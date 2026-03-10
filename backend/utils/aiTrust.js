import User from "../models/user.model.js";

const AI_ENGINE_BASE_URL = String(process.env.AI_ENGINE_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

const postAi = async (path, payload) => {
	const response = await fetch(`${AI_ENGINE_BASE_URL}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const raw = await response.text().catch(() => "");
		throw new Error(`AI request failed (${response.status}): ${raw || response.statusText}`);
	}

	return response.json();
};

export const sendReviewGraphEvent = async ({ buyerId, sellerId, productId, orderItemId, rating, comment }) => {
	return postAi("/reviews/submit", {
		buyer_id: String(buyerId || ""),
		seller_id: String(sellerId || ""),
		product_id: String(productId || ""),
		order_item_id: String(orderItemId || ""),
		rating: Number(rating || 0),
		comment: String(comment || ""),
	});
};

export const sendOrderGraphEvent = async ({ buyerId, orderId, totalAmount = 0, items = [] }) => {
	return postAi("/orders/checkout", {
		buyer_id: String(buyerId || ""),
		order_id: String(orderId || ""),
		total_amount: Number(totalAmount || 0),
		items: items.map((item) => ({
			product_id: String(item.productId || item.product || ""),
			quantity: Number(item.quantity || 1),
			seller_id: String(item.sellerId || item.shopId || ""),
		})),
	});
};

export const sendKycGraphEvent = async ({ userId, identityMarkers = {} }) => {
	return postAi("/kyc/upload", {
		user_id: String(userId || ""),
		doc_url: "submitted",
		selfie_url: "submitted",
		identity_markers: identityMarkers,
	});
};

export const sendReportGraphEvent = async ({ userId, reportId, targetType, targetId, reasons = [] }) => {
	return postAi("/graph/events/report", {
		user_id: String(userId || ""),
		report_id: String(reportId || ""),
		target_type: String(targetType || ""),
		target_id: String(targetId || ""),
		reasons: Array.isArray(reasons) ? reasons : [],
	});
};

export const recalculateAiTrustForUser = async (userId) => {
	const normalizedUserId = String(userId || "").trim();
	if (!normalizedUserId) {
		return null;
	}

	const aiResult = await postAi("/trust/recalculate", { user_id: normalizedUserId });
	const scoringMode = String(aiResult?.scoring_mode || "").toLowerCase();
	if (scoringMode && scoringMode !== "ml") {
		throw new Error(`AI trust scoring mode is '${scoringMode}', expected 'ml'`);
	}

	const trustScore = Number(aiResult?.trust_score);
	if (!Number.isFinite(trustScore)) {
		return null;
	}

	const user = await User.findById(normalizedUserId);
	if (!user) {
		return null;
	}

	user.trustScore = trustScore;
	user.aiTrustScoringMode = scoringMode || "unknown";
	user.aiTrustModelExists = Boolean(aiResult?.model_exists);
	user.aiTrustUpdatedAt = new Date().toISOString();
	await user.save();
	return {
		userId: normalizedUserId,
		trustScore,
		scoringMode: user.aiTrustScoringMode,
		modelExists: user.aiTrustModelExists,
	};
};

export const recalculateAiTrustForUsers = async (userIds = []) => {
	const uniqueUserIds = Array.from(
		new Set((userIds || []).map((id) => String(id || "").trim()).filter(Boolean))
	);

	const updates = [];
	for (const userId of uniqueUserIds) {
		try {
			const update = await recalculateAiTrustForUser(userId);
			if (update) {
				updates.push(update);
			}
		} catch (error) {
			console.log(`AI trust recalculation failed for ${userId}:`, error.message);
		}
	}

	return updates;
};
