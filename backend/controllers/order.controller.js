import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

const ALLOWED_FULFILLMENT_STATUSES = new Set(["processing", "shipping", "delivered", "cancelled"]);

const normalizeProductIdFromLineItem = (lineItem) =>
	String(lineItem?.product || lineItem?.id || lineItem?._id || "").trim();

const toSortTimestamp = (value) => {
	if (!value) return 0;
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value).getTime();
		return Number.isFinite(parsed) ? parsed : 0;
	}
	if (typeof value?.seconds === "number") {
		return value.seconds * 1000;
	}
	if (typeof value?.toDate === "function") {
		return value.toDate().getTime();
	}
	return 0;
};

const canManageProduct = (reqUser, product) => {
	if (!reqUser || !product) return false;
	if (reqUser.role === "admin") return true;
	return String(product.shopId || "") === String(reqUser._id || "");
};

const loadProductsByIds = async (productIds) => {
	const uniqueIds = Array.from(new Set((productIds || []).filter(Boolean)));
	const products = await Promise.all(uniqueIds.map((productId) => Product.findById(productId)));
	return new Map(products.filter(Boolean).map((product) => [String(product._id), product]));
};

export const getMyOrders = async (req, res) => {
	try {
		const userId = String(req.user?._id || "").trim();
		const orders = await Order.find({ user: userId });

		const allProductIds = orders
			.flatMap((order) => order.products || [])
			.map(normalizeProductIdFromLineItem)
			.filter(Boolean);
		const productById = await loadProductsByIds(allProductIds);

		for (const order of orders) {
			const originalItems = Array.isArray(order.products) ? order.products : [];
			const filteredItems = originalItems.filter((lineItem) => {
				const productId = normalizeProductIdFromLineItem(lineItem);
				if (!productId) return false;
				const product = productById.get(productId);
				const ownerId = String(product?.shopId || "").trim();
				return ownerId !== userId;
			});

			if (filteredItems.length === originalItems.length) {
				continue;
			}

			if (filteredItems.length === 0) {
				await Order.findByIdAndDelete(order._id);
				order.products = [];
				continue;
			}

			order.products = filteredItems;
			order.totalAmount = filteredItems.reduce(
				(sum, lineItem) => sum + Number(lineItem?.price || 0) * Number(lineItem?.quantity || 1),
				0
			);
			await order.save();
		}

		const payload = orders
			.map((order) => ({
				orderId: String(order._id || ""),
				totalAmount: Number(order.totalAmount || 0),
				createdAt: order.createdAt || null,
				updatedAt: order.updatedAt || null,
				items: (order.products || [])
					.map((lineItem) => {
						const productId = normalizeProductIdFromLineItem(lineItem);
						if (!productId) return null;
						const product = productById.get(productId);

						return {
							productId,
							productName: product?.name || "Product",
							productImage: product?.image || "",
							shopId: String(product?.shopId || "").trim(),
							shopName: String(product?.shopName || "Shop").trim() || "Shop",
							quantity: Number(lineItem?.quantity || 1),
							price: Number(lineItem?.price || 0),
							fulfillmentStatus: String(lineItem?.fulfillmentStatus || "processing"),
							fulfillmentUpdatedAt: lineItem?.fulfillmentUpdatedAt || null,
						};
					})
					.filter(Boolean),
			}))
			.filter((order) => order.items.length > 0)
			.sort((a, b) => toSortTimestamp(b.createdAt) - toSortTimestamp(a.createdAt));

		return res.json({ orders: payload });
	} catch (error) {
		console.log("Error in getMyOrders controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFulfillmentOrders = async (req, res) => {
	try {
		const orders = await Order.find({});
		const allProductIds = Array.from(
			new Set(
				orders
					.flatMap((order) => order.products || [])
					.map(normalizeProductIdFromLineItem)
					.filter(Boolean)
			)
		);

		const productById = await loadProductsByIds(allProductIds);

		const fulfillmentOrders = orders
			.map((order) => {
				const items = (order.products || [])
					.map((lineItem) => {
						const productId = normalizeProductIdFromLineItem(lineItem);
						if (!productId) return null;
						const product = productById.get(productId);
						if (!canManageProduct(req.user, product)) {
							return null;
						}

						return {
							productId,
							productName: product?.name || "Product",
							productImage: product?.image || "",
							shopId: String(product?.shopId || "").trim(),
							shopName: String(product?.shopName || "Shop").trim() || "Shop",
							quantity: Number(lineItem?.quantity || 1),
							price: Number(lineItem?.price || 0),
							fulfillmentStatus: String(lineItem?.fulfillmentStatus || "processing"),
							fulfillmentUpdatedAt: lineItem?.fulfillmentUpdatedAt || null,
						};
					})
					.filter(Boolean);

				if (items.length === 0) {
					return null;
				}

				return {
					orderId: String(order._id || ""),
					buyerId: String(order.user || ""),
					totalAmount: Number(order.totalAmount || 0),
					createdAt: order.createdAt || null,
					updatedAt: order.updatedAt || null,
					items,
				};
			})
			.filter(Boolean)
			.sort((a, b) => toSortTimestamp(b.createdAt) - toSortTimestamp(a.createdAt));

		return res.json({ orders: fulfillmentOrders, allowedStatuses: Array.from(ALLOWED_FULFILLMENT_STATUSES) });
	} catch (error) {
		console.log("Error in getFulfillmentOrders controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateFulfillmentStatus = async (req, res) => {
	try {
		const orderId = String(req.params?.orderId || "").trim();
		const productId = String(req.params?.productId || "").trim();
		const status = String(req.body?.status || "").trim().toLowerCase();

		if (!orderId || !productId || !status) {
			return res.status(400).json({ message: "orderId, productId, and status are required" });
		}

		if (!ALLOWED_FULFILLMENT_STATUSES.has(status)) {
			return res.status(400).json({ message: "Invalid status" });
		}

		const order = await Order.findById(orderId);
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (!canManageProduct(req.user, product)) {
			return res.status(403).json({ message: "Access denied - cannot update fulfillment for this product" });
		}

		const lineItemIndex = (order.products || []).findIndex(
			(lineItem) => normalizeProductIdFromLineItem(lineItem) === productId
		);

		if (lineItemIndex < 0) {
			return res.status(404).json({ message: "Order item not found" });
		}

		const lineItem = order.products[lineItemIndex] || {};
		lineItem.fulfillmentStatus = status;
		lineItem.fulfillmentUpdatedAt = new Date().toISOString();
		lineItem.fulfillmentUpdatedBy = String(req.user?._id || "");
		order.products[lineItemIndex] = lineItem;

		await order.save();

		return res.json({
			message: "Fulfillment status updated",
			orderId,
			productId,
			status,
			updatedAt: lineItem.fulfillmentUpdatedAt,
		});
	} catch (error) {
		console.log("Error in updateFulfillmentStatus controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};
