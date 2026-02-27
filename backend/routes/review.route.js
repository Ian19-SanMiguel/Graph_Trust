import express from "express";
import { getReviewsByProduct, submitReview } from "../controllers/review.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/product/:productId", getReviewsByProduct);
router.post("/", protectRoute, submitReview);

export default router;