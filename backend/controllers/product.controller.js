import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";
import Verification from "../models/verification.model.js";
import { ChatConversation, ChatMessage } from "../models/chat.model.js";

const buildStorefrontPayload = (user) => ({
	shopId: String(user?._id || ""),
	shopName: String(user?.storefrontName || user?.name || "Shop").trim() || "Shop",
	tagline: String(user?.storefrontTagline || "").trim(),
	description: String(user?.storefrontDescription || "").trim(),
	logoUrl: String(user?.storefrontLogoUrl || "").trim(),
	bannerUrl: String(user?.storefrontBannerUrl || "").trim(),
});

const isBase64Image = (value) => typeof value === "string" && value.startsWith("data:image");

const uploadStorefrontImage = async (imageData, shopId, kind) => {
	const response = await cloudinary.uploader.upload(imageData, {
		folder: `storefronts/${shopId}`,
		public_id: kind,
		overwrite: true,
	});

	return response?.secure_url || "";
};

const resolveRegisteredBusinessName = async (userId, fallbackName) => {
	const verification = await Verification.findByUserId(String(userId || "").trim());
	const businessName = String(verification?.businessName || "").trim();
	if (businessName) {
		return businessName;
	}

	const normalizedFallback = String(fallbackName || "").trim();
	return normalizedFallback || "Shop";
};

const computeShopStats = async ({ shopId, productIds }) => {
	const productIdSet = new Set((productIds || []).filter(Boolean));
	const soldByProduct = {};
	const reviewSummaryByProduct = {};

	let soldCount = 0;
	const engagedBuyerIds = new Set();

	if (productIdSet.size > 0) {
		const orders = await Order.find({});
		for (const order of orders) {
			const orderUserId = String(order.user || "").trim();
			for (const lineItem of order.products || []) {
				const lineProductId = String(lineItem.product || lineItem.id || lineItem._id || "").trim();
				if (!productIdSet.has(lineProductId)) {
					continue;
				}

				const quantity = Number(lineItem.quantity || 1);
				soldCount += quantity;
				soldByProduct[lineProductId] = Number(soldByProduct[lineProductId] || 0) + quantity;
				if (orderUserId) {
					engagedBuyerIds.add(orderUserId);
				}
			}
		}
	}

	let reviewCount = 0;
	let reviewRatingTotal = 0;
	for (const productId of productIdSet) {
		const reviews = await Review.findByProductId(productId);
		const productReviewCount = reviews.length;
		const productRatingTotal = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
		const productRatingAverage =
			productReviewCount > 0 ? Number((productRatingTotal / productReviewCount).toFixed(2)) : 0;

		reviewSummaryByProduct[productId] = {
			reviewCount: productReviewCount,
			ratingAverage: productRatingAverage,
		};

		reviewCount += reviews.length;
		reviewRatingTotal += productRatingTotal;
	}

	const averageRating = reviewCount ? Number((reviewRatingTotal / reviewCount).toFixed(1)) : 0;

	const normalizedShopId = String(shopId || "");
	const conversations = await ChatConversation.findByUserId(normalizedShopId);
	let repliedConversationCount = 0;
	for (const conversation of conversations) {
		if (conversation?.buyerId) {
			engagedBuyerIds.add(String(conversation.buyerId));
		}

		const otherParticipantId = (conversation.participants || []).find(
			(participantId) => String(participantId || "") !== normalizedShopId
		);
		if (otherParticipantId) {
			engagedBuyerIds.add(String(otherParticipantId));
		}

		const messages = await ChatMessage.findByConversationId(conversation._id);
		const buyerSent = messages.some((message) => String(message.senderId || "") !== normalizedShopId);
		const sellerSent = messages.some((message) => String(message.senderId || "") === normalizedShopId);

		if (buyerSent && sellerSent) {
			repliedConversationCount += 1;
		}
	}

	const responseRate =
		conversations.length > 0 ? `${Math.round((repliedConversationCount / conversations.length) * 100)}%` : "N/A";

	return {
		ratingAverage: averageRating,
		ratingCount: reviewCount,
		ratingsDisplay: reviewCount > 0 ? `${averageRating} (${reviewCount})` : "No ratings",
		responseRate,
		sold: soldCount,
		followers: engagedBuyerIds.size,
		perProduct: Array.from(productIdSet).reduce((acc, productId) => {
			const reviewData = reviewSummaryByProduct[productId] || { reviewCount: 0, ratingAverage: 0 };
			const sold = Number(soldByProduct[productId] || 0);
			const reviewCountForProduct = Number(reviewData.reviewCount || 0);
			const ratingAverage = Number(reviewData.ratingAverage || 0);
			const popularityScore = Number((sold * 3 + reviewCountForProduct * 2 + ratingAverage).toFixed(2));

			acc[productId] = {
				sold,
				reviewCount: reviewCountForProduct,
				ratingAverage,
				popularityScore,
			};
			return acc;
		}, {}),
	};
};

export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({});
		res.json({ products: products.map((p) => p.toJSON()) });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getMyProducts = async (req, res) => {
	try {
		if (req.user?.role === "admin") {
			const products = await Product.find({});
			return res.json({ products: products.map((p) => p.toJSON()) });
		}

		const products = await Product.find({ shopId: String(req.user?._id || "") });
		return res.json({ products: products.map((p) => p.toJSON()) });
	} catch (error) {
		console.log("Error in getMyProducts controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get("featured_products");
		if (featuredProducts) {
			return res.json(JSON.parse(featuredProducts));
		}

		// if not in redis, fetch from Firestore
		featuredProducts = await Product.find({ isFeatured: true });

		if (!featuredProducts || featuredProducts.length === 0) {
			return res.status(404).json({ message: "No featured products found" });
		}

		const productsJSON = featuredProducts.map((p) => p.toJSON());

		// store in redis for future quick access
		await redis.set("featured_products", JSON.stringify(productsJSON));

		res.json(productsJSON);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, image, category } = req.body;
		const normalizedPrice = Number.parseFloat(price);

		if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
			return res.status(400).json({ message: "Price must be a valid non-negative number" });
		}

		const shopId = String(req.user?._id || "").trim();
		const shopName = await resolveRegisteredBusinessName(
			shopId,
			req.user?.storefrontName || req.user?.name || "Shop"
		);

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price: normalizedPrice,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			category,
			shopId,
			shopName,
		});

		res.status(201).json(product.toJSON());
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (req.user?.role !== "admin" && product.shopId !== String(req.user?._id || "")) {
			return res.status(403).json({ message: "Access denied - You can delete only your products" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloudinary");
			} catch (error) {
				console.log("error deleting image from cloudinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (req.user?.role !== "admin" && product.shopId !== String(req.user?._id || "")) {
			return res.status(403).json({ message: "Access denied - You can edit only your products" });
		}

		const { name, description, price, category, image } = req.body || {};
		if (typeof name === "string" && name.trim()) {
			product.name = name.trim().slice(0, 120);
		}
		if (typeof description === "string") {
			product.description = description.trim().slice(0, 1500);
		}
		if (typeof category === "string" && category.trim()) {
			product.category = category.trim().toLowerCase();
		}

		if (price !== undefined) {
			const normalizedPrice = Number.parseFloat(price);
			if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
				return res.status(400).json({ message: "Price must be a valid non-negative number" });
			}
			product.price = normalizedPrice;
		}

		if (image && isBase64Image(image)) {
			const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
			product.image = cloudinaryResponse?.secure_url || product.image;
		} else if (typeof image === "string" && image.trim()) {
			product.image = image.trim();
		}

		const updated = await product.save();
		return res.json(updated.toJSON());
	} catch (error) {
		console.log("Error in updateProduct controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		// Get all products and randomly select 4
		const products = await Product.find({});
		const shuffled = products.sort(() => Math.random() - 0.5).slice(0, 4);

		const result = shuffled.map((product) => ({
			_id: product._id,
			name: product.name,
			description: product.description,
			image: product.image,
			price: product.price,
			shopId: product.shopId || "",
			shopName: product.shopName || "",
		}));

		res.json(result);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products: products.map((p) => p.toJSON()) });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByShop = async (req, res) => {
	const { shopId } = req.params;

	try {
		const products = await Product.find({ shopId });
		const serializedProducts = products.map((product) => product.toJSON());
		const productIds = serializedProducts.map((product) => String(product._id || "")).filter(Boolean);
		const seller = await User.findById(shopId);
		const storefront = buildStorefrontPayload(seller);
		const registeredShopName = await resolveRegisteredBusinessName(
			shopId,
			storefront.shopName || seller?.name || "Shop"
		);
		const stats = await computeShopStats({ shopId, productIds });
		const productStats = stats.perProduct || {};
		const enrichedProducts = serializedProducts.map((product) => {
			const metrics = productStats[String(product._id || "")] || {};
			return {
				...product,
				sold: Number(metrics.sold || 0),
				reviewCount: Number(metrics.reviewCount || 0),
				ratingAverage: Number(metrics.ratingAverage || 0),
				popularityScore: Number(metrics.popularityScore || 0),
			};
		});

		const shopNameFromProducts =
			registeredShopName || serializedProducts.find((product) => product.shopName)?.shopName || "Shop";

		res.json({
			shop: {
				shopId,
				shopName: shopNameFromProducts,
				tagline: storefront.tagline,
				description: storefront.description,
				logoUrl: storefront.logoUrl,
				bannerUrl: storefront.bannerUrl,
				stats,
			},
			products: enrichedProducts,
		});
	} catch (error) {
		console.log("Error in getProductsByShop controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getMyStorefront = async (req, res) => {
	try {
		const user = req.user;
		const storefront = buildStorefrontPayload(req.user);
		const shopName = await resolveRegisteredBusinessName(
			user?._id,
			storefront.shopName || user?.name || "Shop"
		);

		if (String(user?.storefrontName || "").trim() !== shopName) {
			user.storefrontName = shopName;
			await user.save();
		}

		return res.json({ storefront: { ...storefront, shopName } });
	} catch (error) {
		console.log("Error in getMyStorefront controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateMyStorefront = async (req, res) => {
	try {
		const user = req.user;
		const {
			tagline,
			description,
			logoUrl,
			bannerUrl,
			logoImage,
			bannerImage,
		} = req.body || {};

		const registeredShopName = await resolveRegisteredBusinessName(
			user?._id,
			user.storefrontName || user.name || "Shop"
		);

		user.storefrontName = registeredShopName.slice(0, 60);
		user.storefrontTagline = String(tagline || "").trim().slice(0, 120);
		user.storefrontDescription = String(description || "").trim().slice(0, 700);

		if (logoImage && isBase64Image(logoImage)) {
			user.storefrontLogoUrl = await uploadStorefrontImage(
				logoImage,
				String(user._id),
				"logo"
			);
		} else if (typeof logoUrl === "string") {
			user.storefrontLogoUrl = logoUrl.trim().slice(0, 1000);
		}

		if (bannerImage && isBase64Image(bannerImage)) {
			user.storefrontBannerUrl = await uploadStorefrontImage(
				bannerImage,
				String(user._id),
				"banner"
			);
		} else if (typeof bannerUrl === "string") {
			user.storefrontBannerUrl = bannerUrl.trim().slice(0, 1000);
		}

		await user.save();

		return res.json({ storefront: buildStorefrontPayload(user) });
	} catch (error) {
		console.log("Error in updateMyStorefront controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product.toJSON());
  } catch (error) {
    console.log('Error in getProductById controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct.toJSON());
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function updateFeaturedProductsCache() {
	try {
		const featuredProducts = await Product.find({ isFeatured: true });
		const productsJSON = featuredProducts.map((p) => p.toJSON());
		await redis.set("featured_products", JSON.stringify(productsJSON));	} catch (error) {
		console.log("error in update cache function");
	}
}