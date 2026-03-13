import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import crypto from "crypto";

const MFA_ISSUER = process.env.MFA_ISSUER || "GraphTrust";

const buildAuthResponseUser = (user) => {
	const hasSubmittedVerification = Boolean(user.hasSubmittedVerification);
	return {
		_id: user._id,
		name: user.name,
		email: user.email,
		role: user.role,
		...(hasSubmittedVerification
			? {
				trustScore: user.trustScore,
				aiTrustScoringMode: user.aiTrustScoringMode || "",
				aiTrustModelExists: Boolean(user.aiTrustModelExists),
				aiTrustUpdatedAt: user.aiTrustUpdatedAt || null,
			}
			: {}),
		hasSubmittedVerification,
		kycStatus: user.kycStatus,
		mfaEnabled: Boolean(user.mfaEnabled),
		storefrontName: user.storefrontName || user.name || "Shop",
		storefrontTagline: user.storefrontTagline || "",
		storefrontDescription: user.storefrontDescription || "",
		storefrontLogoUrl: user.storefrontLogoUrl || "",
		storefrontBannerUrl: user.storefrontBannerUrl || "",
	};
};

const sanitizeOtpToken = (token) => String(token || "").replace(/\s|-/g, "").trim();

const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "15m",
	});

	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: "7d",
	});

	return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); // 7days
};

const setCookies = (res, accessToken, refreshToken) => {
	const isProduction = process.env.NODE_ENV === "production";
	const sameSitePolicy = isProduction ? "none" : "strict";

	res.cookie("accessToken", accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: isProduction,
		sameSite: sameSitePolicy,
		maxAge: 15 * 60 * 1000, // 15 minutes
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: isProduction,
		sameSite: sameSitePolicy,
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
};

export const signup = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}
		const user = await User.create({ name, email, password });

		// authenticate
		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);

		setCookies(res, accessToken, refreshToken);

		res.status(201).json({
			...buildAuthResponseUser(user),
		});
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (user && (await user.comparePassword(password))) {
			if (user.mfaEnabled && user.mfaSecret) {
				const mfaTicket = crypto.randomBytes(24).toString("hex");
				await redis.set(`mfa_ticket:${mfaTicket}`, String(user._id), "EX", 5 * 60);

				return res.status(200).json({
					mfaRequired: true,
					mfaTicket,
					message: "MFA code is required",
				});
			}

			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			res.json(buildAuthResponseUser(user));
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
			await redis.del(`refresh_token:${decoded.userId}`);
		}

		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// this will refresh the access token
export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}

		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

		if (storedToken !== refreshToken) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
			maxAge: 15 * 60 * 1000,
		});

		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.log("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProfile = async (req, res) => {
	try {
		// return sanitized user object
		res.json(req.userSafe || req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const loginWithMfa = async (req, res) => {
	try {
		const mfaTicket = String(req.body?.mfaTicket || "").trim();
		const token = sanitizeOtpToken(req.body?.token);

		if (!mfaTicket || !token) {
			return res.status(400).json({ message: "mfaTicket and token are required" });
		}

		const userId = await redis.get(`mfa_ticket:${mfaTicket}`);
		if (!userId) {
			return res.status(401).json({ message: "MFA challenge expired or invalid" });
		}

		const user = await User.findById(userId);
		if (!user || !user.mfaEnabled || !user.mfaSecret) {
			return res.status(401).json({ message: "MFA is not configured for this account" });
		}

		const isValid = authenticator.verify({ token, secret: user.mfaSecret });
		if (!isValid) {
			return res.status(400).json({ message: "Invalid MFA code" });
		}

		await redis.del(`mfa_ticket:${mfaTicket}`);

		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);
		setCookies(res, accessToken, refreshToken);

		return res.json(buildAuthResponseUser(user));
	} catch (error) {
		console.log("Error in loginWithMfa controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getMfaStatus = async (req, res) => {
	try {
		return res.json({ mfaEnabled: Boolean(req.user?.mfaEnabled) });
	} catch (error) {
		console.log("Error in getMfaStatus controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const setupMfa = async (req, res) => {
	try {
		const user = req.user;
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const secret = authenticator.generateSecret();
		const otpauthUrl = authenticator.keyuri(user.email, MFA_ISSUER, secret);
		const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

		await redis.set(`mfa_setup:${user._id}`, secret, "EX", 10 * 60);

		return res.json({
			secret,
			otpauthUrl,
			qrCodeDataUrl,
			expiresInSeconds: 10 * 60,
		});
	} catch (error) {
		console.log("Error in setupMfa controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const enableMfa = async (req, res) => {
	try {
		const user = req.user;
		const token = sanitizeOtpToken(req.body?.token);

		if (!token) {
			return res.status(400).json({ message: "MFA token is required" });
		}

		const pendingSecret = await redis.get(`mfa_setup:${user._id}`);
		if (!pendingSecret) {
			return res.status(400).json({ message: "No pending MFA setup found. Start setup again." });
		}

		const isValid = authenticator.verify({ token, secret: pendingSecret });
		if (!isValid) {
			return res.status(400).json({ message: "Invalid MFA code" });
		}

		user.mfaEnabled = true;
		user.mfaSecret = pendingSecret;
		await user.save();
		await redis.del(`mfa_setup:${user._id}`);

		return res.json({
			message: "MFA enabled successfully",
			mfaEnabled: true,
		});
	} catch (error) {
		console.log("Error in enableMfa controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const disableMfa = async (req, res) => {
	try {
		const user = req.user;
		const token = sanitizeOtpToken(req.body?.token);

		if (!user?.mfaEnabled || !user?.mfaSecret) {
			return res.status(400).json({ message: "MFA is not enabled" });
		}

		if (!token) {
			return res.status(400).json({ message: "MFA token is required" });
		}

		const isValid = authenticator.verify({ token, secret: user.mfaSecret });
		if (!isValid) {
			return res.status(400).json({ message: "Invalid MFA code" });
		}

		user.mfaEnabled = false;
		user.mfaSecret = "";
		await user.save();

		return res.json({
			message: "MFA disabled successfully",
			mfaEnabled: false,
		});
	} catch (error) {
		console.log("Error in disableMfa controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};
