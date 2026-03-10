import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
	try {
		const cartItemIds = req.user.cartItems.map((item) => item.product || item);
		const products = await Promise.all(cartItemIds.map((id) => Product.findById(id)));

		// add quantity for each product
		const cartItems = products
			.filter((product) => product !== null)
			.map((product) => {
				const item = req.user.cartItems.find((cartItem) => (cartItem.product || cartItem) === product._id);
				return { ...product.toJSON(), quantity: item?.quantity || 1 };
			});

		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId, quantity } = req.body;
		const user = req.user;
		const normalizedQuantity = Math.max(1, Number.parseInt(quantity, 10) || 1);

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.shopId && String(product.shopId) === String(user._id)) {
			return res.status(400).json({ message: "You cannot purchase your own product" });
		}

		const existingItem = user.cartItems.find((item) => (item.product || item) === productId);
		if (existingItem) {
			existingItem.quantity += normalizedQuantity;
		} else {
			user.cartItems.push({ product: productId, quantity: normalizedQuantity });
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter((item) => (item.product || item) !== productId);
		}
		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in removeAllFromCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		const existingItem = user.cartItems.find((item) => (item.product || item) === productId);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item) => (item.product || item) !== productId);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
