import cloudinary from "../lib/cloudinary.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

const DEFAULT_CATEGORY_IMAGES = {
	jeans: "/jeans.jpg",
	"t-shirts": "/tshirts.jpg",
	shoes: "/shoes.jpg",
	glasses: "/glasses.png",
	jackets: "/jackets.jpg",
	suits: "/suits.jpg",
	bags: "/bags.jpg",
};

const toSlug = (value) =>
	String(value || "")
		.trim()
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const toTitle = (slug) =>
	String(slug || "")
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const isBase64Image = (value) => typeof value === "string" && value.startsWith("data:image");

export const getCategories = async (req, res) => {
	try {
		const storedCategories = await Category.find({});
		const productCategorySet = new Set();
		const products = await Product.find({});
		products.forEach((product) => {
			const slug = toSlug(product?.category || "");
			if (slug) {
				productCategorySet.add(slug);
			}
		});

		Object.keys(DEFAULT_CATEGORY_IMAGES).forEach((slug) => productCategorySet.add(slug));

		const categories = [
			...storedCategories.map((category) => category.toJSON()),
			...Array.from(productCategorySet)
				.filter((slug) => !storedCategories.some((category) => category.slug === slug))
				.map((slug) => ({
					_id: `default:${slug}`,
					name: toTitle(slug),
					slug,
					imageUrl:
						DEFAULT_CATEGORY_IMAGES[slug] ||
						`https://source.unsplash.com/1200x900/?${encodeURIComponent(slug)},fashion`,
				})),
		];

		return res.json({
			categories: categories.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
		});
	} catch (error) {
		console.log("Error in getCategories controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createCategory = async (req, res) => {
	try {
		const { name, image, imageUrl } = req.body || {};
		const normalizedName = String(name || "").trim();
		const slug = toSlug(normalizedName);

		if (!normalizedName || !slug) {
			return res.status(400).json({ message: "Category name is required" });
		}

		const existing = await Category.findOne({ slug });
		if (existing) {
			return res.status(409).json({ message: "Category already exists" });
		}

		let resolvedImageUrl = String(imageUrl || "").trim();
		if (image && isBase64Image(image)) {
			const uploaded = await cloudinary.uploader.upload(image, {
				folder: "categories",
				public_id: slug,
				overwrite: true,
			});
			resolvedImageUrl = uploaded?.secure_url || resolvedImageUrl;
		}

		if (!resolvedImageUrl) {
			return res.status(400).json({ message: "Category image is required" });
		}

		const category = await Category.create({
			name: normalizedName.slice(0, 60),
			slug,
			imageUrl: resolvedImageUrl.slice(0, 1000),
			createdBy: String(req.user?._id || ""),
		});

		return res.status(201).json(category.toJSON());
	} catch (error) {
		console.log("Error in createCategory controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};
