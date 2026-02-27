import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

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
		const shopId = String(req.user?._id || "").trim();
		const shopName = String(req.user?.name || "Shop").trim();

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price,
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

		const shopNameFromProducts = serializedProducts.find((product) => product.shopName)?.shopName || "Shop";

		res.json({
			shop: {
				shopId,
				shopName: shopNameFromProducts,
			},
			products: serializedProducts,
		});
	} catch (error) {
		console.log("Error in getProductsByShop controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
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