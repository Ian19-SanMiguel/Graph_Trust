import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { getDB } from "../lib/db.js";

const VERIFICATIONS_COLLECTION = "seller_verifications";

export class Verification {
	constructor(data) {
		this._id = data.id || data._id;
		this.userId = data.userId;
		this.firstName = data.firstName;
		this.middleName = data.middleName || "";
		this.lastName = data.lastName;
		this.suffix = data.suffix || "";
		this.dateOfBirth = data.dateOfBirth;
		this.sex = data.sex;
		this.nationality = data.nationality;
		this.address = data.address;
		this.contactNumber = data.contactNumber;
		this.governmentIdUrl = data.governmentIdUrl;
		this.selfieUrl = data.selfieUrl;
		this.status = data.status || "pending";
		this.reviewerNotes = data.reviewerNotes || "";
		this.reviewedBy = data.reviewedBy || null;
		this.reviewedAt = data.reviewedAt || null;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	async save() {
		const db = getDB();
		const verificationRef = doc(db, VERIFICATIONS_COLLECTION, this._id);
		await setDoc(verificationRef, {
			userId: this.userId,
			firstName: this.firstName,
			middleName: this.middleName,
			lastName: this.lastName,
			suffix: this.suffix,
			dateOfBirth: this.dateOfBirth,
			sex: this.sex,
			nationality: this.nationality,
			address: this.address,
			contactNumber: this.contactNumber,
			governmentIdUrl: this.governmentIdUrl,
			selfieUrl: this.selfieUrl,
			status: this.status,
			reviewerNotes: this.reviewerNotes,
			reviewedBy: this.reviewedBy,
			reviewedAt: this.reviewedAt,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			userId: this.userId,
			firstName: this.firstName,
			middleName: this.middleName,
			lastName: this.lastName,
			suffix: this.suffix,
			dateOfBirth: this.dateOfBirth,
			sex: this.sex,
			nationality: this.nationality,
			address: this.address,
			contactNumber: this.contactNumber,
			governmentIdUrl: this.governmentIdUrl,
			selfieUrl: this.selfieUrl,
			status: this.status,
			reviewerNotes: this.reviewerNotes,
			reviewedBy: this.reviewedBy,
			reviewedAt: this.reviewedAt,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async findByUserId(userId) {
		const db = getDB();
		const verificationRef = doc(db, VERIFICATIONS_COLLECTION, userId);
		const docSnap = await getDoc(verificationRef);

		if (!docSnap.exists()) {
			return null;
		}

		return new Verification({ id: docSnap.id, ...docSnap.data() });
	}

	static async find(filter = {}) {
		const db = getDB();
		const verificationsRef = collection(db, VERIFICATIONS_COLLECTION);
		let q = query(verificationsRef);

		if (filter.status) {
			q = query(verificationsRef, where("status", "==", filter.status));
		}

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((verificationDoc) =>
			new Verification({ id: verificationDoc.id, ...verificationDoc.data() })
		);
	}

	static async upsertByUserId(userId, data) {
		const existing = await Verification.findByUserId(userId);
		const verification = new Verification({
			...(existing ? existing.toJSON() : {}),
			...data,
			id: userId,
			_id: userId,
			userId,
		});
		await verification.save();
		return verification;
	}
}

export default Verification;
