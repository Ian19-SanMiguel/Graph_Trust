import cloudinary from "../lib/cloudinary.js";
import Verification from "../models/verification.model.js";
import User from "../models/user.model.js";
import { serverTimestamp } from "firebase/firestore";
import { recalculateAiTrustForUser, sendKycGraphEvent } from "../utils/aiTrust.js";

const requiredFields = [
	"firstName",
	"lastName",
	"dateOfBirth",
	"sex",
	"nationality",
	"address",
	"contactNumber",
	"businessName",
	"authorizedRepresentativeConfirmed",
];
const allowedVerificationStatuses = ["pending", "approved", "rejected"];

const isDataUrl = (value) => typeof value === "string" && value.startsWith("data:");

const uploadVerificationAsset = async (dataUrl, folder) => {
	const isPdf = String(dataUrl || "").startsWith("data:application/pdf");
	return cloudinary.uploader.upload(dataUrl, {
		folder,
		resource_type: isPdf ? "raw" : "image",
	});
};

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
			businessName,
			authorizedRepresentativeConfirmed,
			businessPermitImage,
			taxIdImage,
			governmentIdImage,
			selfieImage,
		} = req.body;

		for (const field of requiredFields) {
			if (!req.body[field] || String(req.body[field]).trim() === "") {
				return res.status(400).json({ message: `${field} is required` });
			}
		}

		if (authorizedRepresentativeConfirmed !== true) {
			return res.status(400).json({
				message: "Authorization confirmation is required",
			});
		}

		if (!isDataUrl(governmentIdImage) || !isDataUrl(selfieImage) || !isDataUrl(businessPermitImage) || !isDataUrl(taxIdImage)) {
			return res.status(400).json({
				message: "Business permit, tax ID, government ID, and selfie files are required",
			});
		}

		const existingVerification = await Verification.findByUserId(req.user._id);
		if (existingVerification && existingVerification.status === "pending") {
			return res.status(409).json({ message: "You already have a pending verification" });
		}

		if (existingVerification && existingVerification.status === "approved") {
			return res.status(409).json({ message: "Your account is already verified" });
		}

		const [businessPermitUpload, taxIdUpload, governmentIdUpload, selfieUpload] = await Promise.all([
			uploadVerificationAsset(businessPermitImage, "verifications/business-permits"),
			uploadVerificationAsset(taxIdImage, "verifications/tax-ids"),
			uploadVerificationAsset(governmentIdImage, "verifications/government-ids"),
			uploadVerificationAsset(selfieImage, "verifications/selfies"),
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
			businessName: String(businessName).trim(),
			authorizedRepresentativeConfirmed: true,
			businessPermitUrl: businessPermitUpload.secure_url,
			taxIdUrl: taxIdUpload.secure_url,
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
		let verification = await Verification.findByUserId(req.user._id);

		if (!verification) {
			return res.json({ submitted: false, status: "not_submitted" });
		}

		if (verification.reviewedBy === "AI_SYSTEM") {
			verification = await Verification.upsertByUserId(req.user._id, {
				status: "pending",
				reviewerNotes: "",
				reviewedBy: null,
				reviewedAt: null,
			});
		}

		const verifiedUser = await User.findById(req.user._id);
		if (verifiedUser && verifiedUser.role !== "admin") {
			let shouldSaveUser = false;
			const normalizedBusinessName = String(verification.businessName || "").trim();
			if (
				normalizedBusinessName &&
				String(verifiedUser.storefrontName || "").trim() !== normalizedBusinessName
			) {
				verifiedUser.storefrontName = normalizedBusinessName;
				shouldSaveUser = true;
			}

			if (verification.status === "approved") {
				if (verifiedUser.role !== "seller") {
					verifiedUser.role = "seller";
					shouldSaveUser = true;
				}

				if (String(verifiedUser.kycStatus || "").trim() !== "Verified") {
					verifiedUser.kycStatus = "Verified";
					shouldSaveUser = true;
				}

				if (!Number.isFinite(Number(verifiedUser.trustScore)) || Number(verifiedUser.trustScore) <= 0) {
					verifiedUser.trustScore = 2.5;
					shouldSaveUser = true;
				}
			} else {
				if (verifiedUser.role === "seller") {
					verifiedUser.role = "customer";
					shouldSaveUser = true;
				}

				const normalizedStatus = String(verification.status || "pending").toLowerCase();
				const mappedKycStatus = normalizedStatus === "rejected" ? "Rejected" : "Pending";
				if (String(verifiedUser.kycStatus || "").trim() !== mappedKycStatus) {
					verifiedUser.kycStatus = mappedKycStatus;
					shouldSaveUser = true;
				}
			}

			if (shouldSaveUser) {
				await verifiedUser.save();
			}
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

		for (const verification of verifications) {
			if (verification.reviewedBy === "AI_SYSTEM") {
				await Verification.upsertByUserId(verification.userId, {
					status: "pending",
					reviewerNotes: "",
					reviewedBy: null,
					reviewedAt: null,
				});
			}
		}

		const normalizedVerifications = await Verification.find(filter);

		const sortedVerifications = normalizedVerifications
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
				businessName: verification.businessName,
				authorizedRepresentativeConfirmed: verification.authorizedRepresentativeConfirmed,
				businessPermitUrl: verification.businessPermitUrl,
				taxIdUrl: verification.taxIdUrl,
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
				const normalizedBusinessName = String(existingVerification.businessName || "").trim();
				if (normalizedBusinessName) {
					verifiedUser.storefrontName = normalizedBusinessName;
				}
				verifiedUser.role = "seller";
				verifiedUser.kycStatus = "Verified";
				if (!Number.isFinite(Number(verifiedUser.trustScore)) || Number(verifiedUser.trustScore) <= 0) {
					verifiedUser.trustScore = 2.5;
				}
				await verifiedUser.save();

				try {
					await sendKycGraphEvent({
						userId,
						identityMarkers: {
							business: String(existingVerification.businessName || "").trim(),
							contact: String(existingVerification.contactNumber || "").trim(),
							nationality: String(existingVerification.nationality || "").trim(),
						},
					});
					await recalculateAiTrustForUser(userId);
				} catch (aiError) {
					console.log("AI trust update after verification approval failed:", aiError.message);
				}
			}
		} else {
			const verifiedUser = await User.findById(userId);
			if (verifiedUser && verifiedUser.role !== "admin") {
				const normalizedBusinessName = String(existingVerification.businessName || "").trim();
				if (normalizedBusinessName) {
					verifiedUser.storefrontName = normalizedBusinessName;
				}
				if (verifiedUser.role === "seller") {
					verifiedUser.role = "customer";
				}
				verifiedUser.kycStatus = status === "rejected" ? "Rejected" : "Pending";
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