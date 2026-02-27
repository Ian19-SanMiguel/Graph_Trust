import Product from "../models/product.model.js";
import Review from "../models/review.model.js";

const isValidRating = (value) => {
	if (!Number.isFinite(value) || value < 1 || value > 5) {
		return false;
	}

	return Number.isInteger(value * 2);
};

const summarizeReviews = (reviews) => {
	const totalReviews = reviews.length;
	const averageRating =
		totalReviews === 0
			? 0
			: Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews).toFixed(1));

	return { totalReviews, averageRating };
};

export const getReviewsByProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		const reviews = await Review.findByProductId(productId);
		const serializedReviews = reviews.map((review) => review.toJSON());

		return res.json({
			reviews: serializedReviews,
			summary: summarizeReviews(serializedReviews),
		});
	} catch (error) {
		console.log("Error in getReviewsByProduct controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const submitReview = async (req, res) => {
	try {
		const { productId, rating, comment } = req.body;
		const normalizedRating = Number(rating);

		if (!productId || String(productId).trim() === "") {
			return res.status(400).json({ message: "productId is required" });
		}

		if (!isValidRating(normalizedRating)) {
			return res.status(400).json({ message: "rating must be between 1 and 5 in 0.5 increments" });
		}

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		const userId = String(req.user?._id || "");
		const userName = String(req.user?.name || "User").trim();
		const normalizedComment = String(comment || "").trim().slice(0, 500);

		const existingReview = await Review.findOneByUserAndProduct({ userId, productId });
		let review;

		if (existingReview) {
			review = existingReview;
			review.rating = normalizedRating;
			review.comment = normalizedComment;
			review.userName = userName;
			await review.save();
		} else {
			review = await Review.create({
				productId,
				userId,
				userName,
				rating: normalizedRating,
				comment: normalizedComment,
			});
		}

		const reviews = await Review.findByProductId(productId);
		const serializedReviews = reviews.map((item) => item.toJSON());

		return res.status(existingReview ? 200 : 201).json({
			message: existingReview ? "Review updated successfully" : "Review submitted successfully",
			review: review.toJSON(),
			summary: summarizeReviews(serializedReviews),
		});
	} catch (error) {
		console.log("Error in submitReview controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};