import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	try {
		const accessToken = req.cookies.accessToken;

		if (!accessToken) {
			return res.status(401).json({ message: "Unauthorized - No access token provided" });
		}

		try {
			const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(decoded.userId);

			if (!user) {
				return res.status(401).json({ message: "User not found" });
			}

			// Keep the user model instance on req.user for controllers that need to save
			// but also provide a sanitized plain object on req.userSafe for responses
			const userWithoutPassword = user.toJSON();
			delete userWithoutPassword.password;
			if (!userWithoutPassword.hasSubmittedVerification) {
				delete userWithoutPassword.trustScore;
				delete userWithoutPassword.aiTrustScoringMode;
				delete userWithoutPassword.aiTrustModelExists;
				delete userWithoutPassword.aiTrustUpdatedAt;
			}
			req.user = user; // model instance
			req.userSafe = userWithoutPassword; // sanitized plain object

			next();
		} catch (error) {
			if (error.name === "TokenExpiredError") {
				return res.status(401).json({ message: "Unauthorized - Access token expired" });
			}
			throw error;
		}
	} catch (error) {
		console.log("Error in protectRoute middleware", error.message);
		return res.status(401).json({ message: "Unauthorized - Invalid access token" });
	}
};

export const adminRoute = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		return res.status(403).json({ message: "Access denied - Admin only" });
	}
};

export const sellerOrAdminRoute = (req, res, next) => {
	const normalizedKycStatus = String(req.user?.kycStatus || "").trim().toLowerCase();
	const hasApprovedKyc = normalizedKycStatus === "verified" || normalizedKycStatus === "approved";

	if (req.user && (req.user.role === "admin" || hasApprovedKyc)) {
		next();
	} else {
		return res.status(403).json({ message: "Access denied - KYC approved sellers or admin only" });
	}
};

export const pendingOrHigherKycOrAdminRoute = (req, res, next) => {
	const normalizedKycStatus = String(req.user?.kycStatus || "").trim().toLowerCase();
	const hasSubmittedVerification = Boolean(req.user?.hasSubmittedVerification);
	const hasPendingOrHigherKyc =
		normalizedKycStatus === "pending" ||
		normalizedKycStatus === "verified" ||
		normalizedKycStatus === "approved";

	if (req.user && (req.user.role === "admin" || (hasSubmittedVerification && hasPendingOrHigherKyc))) {
		next();
	} else {
		return res.status(403).json({ message: "Access denied - submit verification first" });
	}
};

export const requireMfaForPrivilegedRoute = (req, res, next) => {
	const role = String(req.user?.role || "").trim().toLowerCase();
	const isPrivileged = role === "seller";

	if (!isPrivileged) {
		return next();
	}

	if (req.user?.mfaEnabled) {
		return next();
	}

	return res.status(403).json({
		message: "MFA is required for seller actions",
		mfaRequired: true,
	});
};
