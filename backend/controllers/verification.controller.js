import cloudinary from "../lib/cloudinary.js";
import Verification from "../models/verification.model.js";
import User from "../models/user.model.js";
import { serverTimestamp } from "firebase/firestore";

const requiredFields = [
	"firstName",
	"lastName",
	"dateOfBirth",
	"sex",
	"nationality",
	"address",
	"contactNumber",
];
const allowedVerificationStatuses = ["pending", "approved", "rejected"];

const isDataUrl = (value) => typeof value === "string" && value.startsWith("data:");

export const submitVerification = async (req, res) => {
	try {
		const {
			firstName,
			middleName,
			lastName,
			suffix,
			dateOfBirth,
			sex,
			nationality,
			address,
			contactNumber,
			governmentIdImage,
			selfieImage,
		} = req.body;

		for (const field of requiredFields) {
			if (!req.body[field] || String(req.body[field]).trim() === "") {
				return res.status(400).json({ message: `${field} is required` });
			}
		}

		if (!isDataUrl(governmentIdImage) || !isDataUrl(selfieImage)) {
			return res.status(400).json({ message: "Government ID and selfie images are required" });
		}

		const existingVerification = await Verification.findByUserId(req.user._id);
		if (existingVerification && existingVerification.status === "pending") {
			return res.status(409).json({ message: "You already have a pending verification" });
		}

		if (existingVerification && existingVerification.status === "approved") {
			return res.status(409).json({ message: "Your account is already verified" });
		}

		const [governmentIdUpload, selfieUpload] = await Promise.all([
			cloudinary.uploader.upload(governmentIdImage, { folder: "verifications/government-ids" }),
			cloudinary.uploader.upload(selfieImage, { folder: "verifications/selfies" }),
		]);

		const verification = await Verification.upsertByUserId(req.user._id, {
			firstName: String(firstName).trim(),
			middleName: String(middleName || "").trim(),
			lastName: String(lastName).trim(),
			suffix: String(suffix || "").trim(),
			dateOfBirth: String(dateOfBirth).trim(),
			sex: String(sex).trim(),
			nationality: String(nationality).trim(),
			address: String(address).trim(),
			contactNumber: String(contactNumber).trim(),
			governmentIdUrl: governmentIdUpload.secure_url,
			selfieUrl: selfieUpload.secure_url,
			status: "pending",
			reviewerNotes: "",
			reviewedBy: null,
			reviewedAt: null,
		});

		return res.status(201).json({
			message: "Verification submitted successfully",
			verification: {
				_id: verification._id,
				status: verification.status,
				reviewerNotes: verification.reviewerNotes,
				reviewedBy: verification.reviewedBy,
				reviewedAt: verification.reviewedAt,
				createdAt: verification.createdAt,
				updatedAt: verification.updatedAt,
			},
		});
	} catch (error) {
		console.log("Error in submitVerification controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getMyVerificationStatus = async (req, res) => {
	try {
		const verification = await Verification.findByUserId(req.user._id);

		if (!verification) {
			return res.json({ submitted: false, status: "not_submitted" });
		}

		return res.json({
			submitted: true,
			status: verification.status,
			verification: {
				_id: verification._id,
				status: verification.status,
				reviewerNotes: verification.reviewerNotes,
				reviewedBy: verification.reviewedBy,
				reviewedAt: verification.reviewedAt,
				updatedAt: verification.updatedAt,
			},
		});
	} catch (error) {
		console.log("Error in getMyVerificationStatus controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getVerificationRequests = async (req, res) => {
	try {
		const status = req.query.status || "pending";
		const filter = status === "all" ? {} : { status };
		const verifications = await Verification.find(filter);

		const sortedVerifications = verifications
			.sort((a, b) => {
				const aSeconds = a.updatedAt?.seconds || 0;
				const bSeconds = b.updatedAt?.seconds || 0;
				return bSeconds - aSeconds;
			})
			.map((verification) => ({
				_id: verification._id,
				userId: verification.userId,
				firstName: verification.firstName,
				middleName: verification.middleName,
				lastName: verification.lastName,
				suffix: verification.suffix,
				dateOfBirth: verification.dateOfBirth,
				sex: verification.sex,
				nationality: verification.nationality,
				address: verification.address,
				contactNumber: verification.contactNumber,
				governmentIdUrl: verification.governmentIdUrl,
				selfieUrl: verification.selfieUrl,
				status: verification.status,
				reviewerNotes: verification.reviewerNotes,
				reviewedBy: verification.reviewedBy,
				reviewedAt: verification.reviewedAt,
				createdAt: verification.createdAt,
				updatedAt: verification.updatedAt,
			}));

		return res.json({ verifications: sortedVerifications });
	} catch (error) {
		console.log("Error in getVerificationRequests controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateVerificationStatus = async (req, res) => {
	try {
		const { userId } = req.params;
		const { status, reviewerNotes } = req.body;

		if (!allowedVerificationStatuses.includes(status)) {
			return res.status(400).json({ message: "Invalid verification status" });
		}

		const existingVerification = await Verification.findByUserId(userId);
		if (!existingVerification) {
			return res.status(404).json({ message: "Verification not found" });
		}

		const verification = await Verification.upsertByUserId(userId, {
			status,
			reviewerNotes: String(reviewerNotes || "").trim(),
			reviewedBy: req.user._id,
			reviewedAt: serverTimestamp(),
		});

		if (status === "approved") {
			const verifiedUser = await User.findById(userId);
			if (verifiedUser && verifiedUser.role !== "admin") {
				verifiedUser.role = "seller";
				await verifiedUser.save();
			}
		}

		return res.json({
			message: "Verification status updated successfully",
			verification: {
				_id: verification._id,
				status: verification.status,
				reviewerNotes: verification.reviewerNotes,
				reviewedBy: verification.reviewedBy,
				reviewedAt: verification.reviewedAt,
				updatedAt: verification.updatedAt,
			},
		});
	} catch (error) {
		console.log("Error in updateVerificationStatus controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};
