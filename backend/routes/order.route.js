import express from "express";
import { getFulfillmentOrders, getMyOrders, updateFulfillmentStatus } from "../controllers/order.controller.js";
import {
	protectRoute,
	requireMfaForPrivilegedRoute,
	sellerOrAdminRoute,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/mine", protectRoute, getMyOrders);
router.get("/fulfillment", protectRoute, requireMfaForPrivilegedRoute, sellerOrAdminRoute, getFulfillmentOrders);
router.patch(
	"/:orderId/items/:productId/fulfillment",
	protectRoute,
	requireMfaForPrivilegedRoute,
	sellerOrAdminRoute,
	updateFulfillmentStatus
);

export default router;
