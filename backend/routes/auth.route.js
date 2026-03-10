import express from "express";
import {
	login,
	logout,
	signup,
	refreshToken,
	getProfile,
	loginWithMfa,
	getMfaStatus,
	setupMfa,
	enableMfa,
	disableMfa,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/login-mfa", loginWithMfa);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
router.get("/mfa/status", protectRoute, getMfaStatus);
router.post("/mfa/setup", protectRoute, setupMfa);
router.post("/mfa/enable", protectRoute, enableMfa);
router.post("/mfa/disable", protectRoute, disableMfa);

export default router;
