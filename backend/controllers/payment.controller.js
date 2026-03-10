import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { stripe } from "../lib/stripe.js";
import { recalculateAiTrustForUsers, sendOrderGraphEvent } from "../utils/aiTrust.js";

const removePurchasedItemsFromUserCart = async (userId, purchasedProducts = []) => {
	const normalizedUserId = String(userId || "").trim();
	if (!normalizedUserId) {
		return;
	}

	const user = await User.findById(normalizedUserId);
	if (!user) {
		return;
	}

	const purchasedProductIds = new Set(
		(purchasedProducts || [])
			.map((item) => String(item?.id || item?.product || "").trim())
			.filter(Boolean)
	);

	if (!purchasedProductIds.size) {
		return;
	}

	const nextCartItems = (user.cartItems || []).filter((item) => {
		const itemProductId = String(item?.product || item || "").trim();
		return !purchasedProductIds.has(itemProductId);
	});

	if (nextCartItems.length !== (user.cartItems || []).length) {
		user.cartItems = nextCartItems;
		await user.save();
	}
};

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		let totalAmount = 0;
		const normalizedProducts = products
			.map((product) => ({
				id: product?._id || product?.id,
				quantity: Number(product?.quantity) || 1,
			}))
			.filter((product) => Boolean(product.id));

		if (!normalizedProducts.length) {
			return res.status(400).json({ error: "No valid products were provided" });
		}

		const uniqueIds = [...new Set(normalizedProducts.map((product) => product.id))];
		const productDocs = await Promise.all(uniqueIds.map((id) => Product.findById(id)));
		const productMap = new Map();

		for (let i = 0; i < uniqueIds.length; i += 1) {
			const foundProduct = productDocs[i];
			if (!foundProduct) {
				return res.status(404).json({ error: "One or more products no longer exist" });
			}
			productMap.set(uniqueIds[i], foundProduct);
		}

		const hasOwnProduct = normalizedProducts.some((item) => {
			const product = productMap.get(item.id);
			return product?.shopId && String(product.shopId) === String(req.user._id);
		});

		if (hasOwnProduct) {
			return res.status(400).json({ error: "You cannot purchase your own product" });
		}

		const lineItems = normalizedProducts.map((item) => {
			const canonicalProduct = productMap.get(item.id);
			const amount = Math.round(Number(canonicalProduct.price || 0) * 100);
			totalAmount += amount * item.quantity;

			return {
				price_data: {
					currency: "php",
					product_data: {
						name: canonicalProduct.name,
						images: [canonicalProduct.image],
					},
					unit_amount: amount,
				},
				quantity: item.quantity,
			};
		});

		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					normalizedProducts.map((item) => {
						const canonicalProduct = productMap.get(item.id);
						return {
							id: item.id,
							quantity: item.quantity,
							price: Number(canonicalProduct?.price || 0),
						};
					})
				),
			},
		});

		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;
		
		if (!sessionId) {
			return res.status(400).json({ message: "Session ID is required" });
		}

		console.log("Attempting to retrieve session:", sessionId);
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		
		console.log("Session retrieved successfully:", session.payment_status);

		if (session.payment_status === "paid") {
			const products = JSON.parse(session.metadata.products || "[]");

			if (String(req.user?._id || "") !== String(session.metadata.userId || "")) {
				return res.status(403).json({
					success: false,
					message: "You are not allowed to finalize this checkout session.",
				});
			}

			const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
			if (existingOrder) {
				await removePurchasedItemsFromUserCart(session.metadata.userId, products);
				return res.status(200).json({
					success: true,
					message: "Payment already processed.",
					orderId: existingOrder._id,
					alreadyProcessed: true,
				});
			}

			if (session.metadata.couponCode) {
				const coupon = await Coupon.findOne({
					code: session.metadata.couponCode,
					userId: session.metadata.userId,
				});
				if (coupon) {
					await Coupon.findByIdAndDelete(coupon._id);
				}
			}

			// create a new Order
			const orderedProductDocs = await Promise.all(products.map((product) => Product.findById(product.id)));
			const hasOwnProductInPaidSession = orderedProductDocs.some((orderedProduct, index) => {
				if (!orderedProduct) {
					return false;
				}
				const buyerId = String(session.metadata.userId || "");
				const ownerId = String(orderedProduct.shopId || "");
				if (ownerId && ownerId === buyerId) {
					console.warn("Blocked self-purchase order creation", {
						sessionId,
						productId: products[index]?.id,
						buyerId,
					});
					return true;
				}
				return false;
			});

			if (hasOwnProductInPaidSession) {
				return res.status(400).json({
					success: false,
					message: "Order contains your own product and cannot be completed.",
				});
			}

			const newOrder = await Order.create({
				user: session.metadata.userId,
				products: products.map((product) => ({
					product: product.id,
					quantity: product.quantity,
					price: product.price,
					fulfillmentStatus: "processing",
					fulfillmentUpdatedAt: new Date().toISOString(),
				})),
				totalAmount: session.amount_total / 100, // convert from cents to dollars,
				stripeSessionId: sessionId,
			});

			await removePurchasedItemsFromUserCart(session.metadata.userId, products);

			const orderItemsWithSellers = await Promise.all(
				products.map(async (item) => {
					const productDoc = await Product.findById(item.id);
					return {
						productId: String(item.id || ""),
						quantity: Number(item.quantity || 1),
						sellerId: String(productDoc?.shopId || ""),
					};
				})
			);

			try {
				await sendOrderGraphEvent({
					buyerId: String(session.metadata.userId || ""),
					orderId: String(newOrder._id || sessionId),
					totalAmount: Number(session.amount_total || 0) / 100,
					items: orderItemsWithSellers,
				});

				const usersToRescore = [
					String(session.metadata.userId || ""),
					...orderItemsWithSellers.map((item) => String(item.sellerId || "")),
				];
				await recalculateAiTrustForUsers(usersToRescore);
			} catch (aiError) {
				console.log("AI trust update after checkout failed:", aiError.message);
			}

			res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder._id,
			});
		} else {
			res.status(400).json({ 
				success: false,
				message: "Payment not completed", 
				paymentStatus: session.payment_status 
			});
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	// Find and delete existing coupon for this user
	const existingCoupons = await Coupon.find({ userId });
	for (const existingCoupon of existingCoupons) {
		await Coupon.findByIdAndDelete(existingCoupon._id);
	}

	const newCoupon = await Coupon.create({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});
	return newCoupon;
}