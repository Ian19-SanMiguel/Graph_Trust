import express from "express";
import {
	getVerificationRequests,
	getMyVerificationStatus,
	submitVerification,
	updateVerificationStatus,
} from "../controllers/verification.controller.js";
import { adminRoute, protectRoute, requireMfaForPrivilegedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protectRoute, getMyVerificationStatus);
router.post("/submit", protectRoute, submitVerification);
router.get("/", protectRoute, requireMfaForPrivilegedRoute, adminRoute, getVerificationRequests);
router.patch("/:userId/status", protectRoute, requireMfaForPrivilegedRoute, adminRoute, updateVerificationStatus);

export default router;
