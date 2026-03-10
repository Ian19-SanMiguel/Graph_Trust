import { serverTimestamp } from "firebase/firestore";
import Report from "../models/report.model.js";
import Product from "../models/product.model.js";
import { recalculateAiTrustForUser, sendReportGraphEvent } from "../utils/aiTrust.js";

const allowedTargetTypes = ["product", "seller"];
const allowedStatuses = ["open", "resolved", "dismissed"];

export const submitReport = async (req, res) => {
	try {
		const { targetType, targetId, targetName, reasons } = req.body || {};
		const normalizedType = String(targetType || "").trim().toLowerCase();
		const normalizedTargetId = String(targetId || "").trim();
		const normalizedTargetName = String(targetName || "").trim();
		const normalizedReasons = Array.isArray(reasons)
			? reasons.map((reason) => String(reason || "").trim()).filter(Boolean)
			: [];

		if (!allowedTargetTypes.includes(normalizedType)) {
			return res.status(400).json({ message: "Invalid report target type" });
		}

		if (!normalizedTargetId) {
			return res.status(400).json({ message: "targetId is required" });
		}

		if (!normalizedReasons.length) {
			return res.status(400).json({ message: "At least one reason is required" });
		}

		const reporterId = String(req.user?._id || "").trim();

		let resolvedTargetUserId = "";
		if (normalizedType === "seller") {
			resolvedTargetUserId = normalizedTargetId;
		} else if (normalizedType === "product") {
			const reportedProduct = await Product.findById(normalizedTargetId);
			resolvedTargetUserId = String(reportedProduct?.shopId || "").trim();
		}
		const existingReport = await Report.findOneByReporterAndTarget({
			reporterId,
			targetType: normalizedType,
			targetId: normalizedTargetId,
		});

		if (existingReport) {
			return res.status(409).json({
				message: `You already submitted a report for this ${normalizedType}`,
				report: existingReport.toJSON(),
			});
		}

		const report = await Report.create({
			targetType: normalizedType,
			targetId: normalizedTargetId,
			targetUserId: resolvedTargetUserId,
			targetName: normalizedTargetName || (normalizedType === "product" ? "Product" : "Seller"),
			reporterId,
			reasons: normalizedReasons,
			status: "open",
			adminNotes: "",
			resolvedBy: null,
			resolvedAt: null,
		});

		if (resolvedTargetUserId) {
			try {
				await sendReportGraphEvent({
					userId: resolvedTargetUserId,
					reportId: report._id,
					targetType: normalizedType,
					targetId: normalizedTargetId,
					reasons: normalizedReasons,
				});
				await recalculateAiTrustForUser(resolvedTargetUserId);
			} catch (aiError) {
				console.log("AI report signal update failed:", aiError.message);
			}
		}

		return res.status(201).json({
			message: "Report submitted successfully",
			report: report.toJSON(),
		});
	} catch (error) {
		console.log("Error in submitReport controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getReports = async (req, res) => {
	try {
		const status = String(req.query.status || "open").trim().toLowerCase();
		const filter = status === "all" ? {} : { status };

		if (filter.status && !allowedStatuses.includes(filter.status)) {
			return res.status(400).json({ message: "Invalid report status filter" });
		}

		const reports = await Report.find(filter);
		const sortedReports = reports
			.sort((a, b) => {
				const aSeconds = a.updatedAt?.seconds || 0;
				const bSeconds = b.updatedAt?.seconds || 0;
				return bSeconds - aSeconds;
			})
			.map((report) => report.toJSON());

		return res.json({ reports: sortedReports });
	} catch (error) {
		console.log("Error in getReports controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateReportStatus = async (req, res) => {
	try {
		const reportId = String(req.params.reportId || "").trim();
		const status = String(req.body?.status || "").trim().toLowerCase();
		const adminNotes = String(req.body?.adminNotes || "").trim();

		if (!reportId) {
			return res.status(400).json({ message: "reportId is required" });
		}

		if (!allowedStatuses.includes(status)) {
			return res.status(400).json({ message: "Invalid report status" });
		}

		const existingReport = await Report.findById(reportId);
		if (!existingReport) {
			return res.status(404).json({ message: "Report not found" });
		}

		existingReport.status = status;
		existingReport.adminNotes = adminNotes;

		if (status === "open") {
			existingReport.resolvedBy = null;
			existingReport.resolvedAt = null;
		} else {
			existingReport.resolvedBy = String(req.user?._id || "").trim() || null;
			existingReport.resolvedAt = serverTimestamp();
		}

		await existingReport.save();

		return res.json({
			message: "Report status updated successfully",
			report: existingReport.toJSON(),
		});
	} catch (error) {
		console.log("Error in updateReportStatus controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};
