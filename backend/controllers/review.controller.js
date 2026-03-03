import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";

const REQUIRE_AI_TRUST = String(process.env.REQUIRE_AI_TRUST || "false").toLowerCase() === "true";

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

const applyLocalTrustDelta = async (userId, rating) => {
	const targetUserId = String(userId || "").trim();
	if (!targetUserId) return;

	const user = await User.findById(targetUserId);
	if (!user) return;

	const currentScore = Number(user.trustScore || 0);
	const ratingValue = Number(rating || 0);
	const delta = Math.max(0.05, Math.min(0.3, ratingValue * 0.05));
	user.trustScore = Number(Math.min(5, currentScore + delta).toFixed(2));
	await user.save();
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

		let trustSource = "none";
		let trustUpdatedByAI = false;

		try {
			const aiReviewResponse = await fetch("http://localhost:8000/reviews/submit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					buyer_id: String(userId),
					seller_id: String(product.shopId || ""),
					product_id: String(productId),
					order_item_id: String(review._id || ""),
					rating: normalizedRating,
					comment: normalizedComment,
				}),
			});

			if (aiReviewResponse.ok) {
				const userIdsToRescore = [String(userId), String(product.shopId || "")].filter(Boolean);

				for (const participantUserId of userIdsToRescore) {
					const aiRescoreResponse = await fetch("http://localhost:8000/trust/recalculate", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ user_id: participantUserId }),
					});

					if (!aiRescoreResponse.ok) {
						continue;
					}

					const aiRescoreData = await aiRescoreResponse.json();
					const participantUser = await User.findById(participantUserId);
					if (participantUser) {
						participantUser.trustScore = aiRescoreData.trust_score;
						await participantUser.save();
						trustUpdatedByAI = true;
						trustSource = "ai";
					}
				}
			}
		} catch (aiError) {
			console.log("⚠️ AI trust re-score unavailable after review submission.");
		}

		if (!trustUpdatedByAI) {
			if (REQUIRE_AI_TRUST) {
				return res.status(existingReview ? 200 : 201).json({
					message:
						existingReview
							? "Review updated, but AI trust scoring is unavailable"
							: "Review submitted, but AI trust scoring is unavailable",
					review: review.toJSON(),
					summary: summarizeReviews(serializedReviews),
					trustSource: "none",
					trustUpdated: false,
				});
			}

			await applyLocalTrustDelta(userId, normalizedRating);
			await applyLocalTrustDelta(product.shopId, normalizedRating);
			trustSource = "fallback";
		}

		return res.status(existingReview ? 200 : 201).json({
			message: existingReview ? "Review updated successfully" : "Review submitted successfully",
			review: review.toJSON(),
			summary: summarizeReviews(serializedReviews),
			trustSource,
			trustUpdated: trustSource !== "none",
		});
	} catch (error) {
		console.log("Error in submitReview controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};