import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { getDB } from "../lib/db.js";

const REPORTS_COLLECTION = "reports";

export class Report {
	constructor(data) {
		this._id = data.id || data._id;
		this.targetType = data.targetType || "product";
		this.targetId = data.targetId || "";
		this.targetUserId = data.targetUserId || "";
		this.targetName = data.targetName || "";
		this.reporterId = data.reporterId || "";
		this.reasons = Array.isArray(data.reasons) ? data.reasons : [];
		this.status = data.status || "open";
		this.adminNotes = data.adminNotes || "";
		this.resolvedBy = data.resolvedBy || null;
		this.resolvedAt = data.resolvedAt || null;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	async save() {
		const db = getDB();
		const reportRef = doc(collection(db, REPORTS_COLLECTION), this._id);
		await setDoc(reportRef, {
			targetType: this.targetType,
			targetId: this.targetId,
			targetUserId: this.targetUserId,
			targetName: this.targetName,
			reporterId: this.reporterId,
			reasons: this.reasons,
			status: this.status,
			adminNotes: this.adminNotes,
			resolvedBy: this.resolvedBy,
			resolvedAt: this.resolvedAt,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			targetType: this.targetType,
			targetId: this.targetId,
			targetUserId: this.targetUserId,
			targetName: this.targetName,
			reporterId: this.reporterId,
			reasons: this.reasons,
			status: this.status,
			adminNotes: this.adminNotes,
			resolvedBy: this.resolvedBy,
			resolvedAt: this.resolvedAt,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async create(data) {
		const report = new Report(data);
		const db = getDB();
		const reportsRef = collection(db, REPORTS_COLLECTION);
		const newDocRef = doc(reportsRef);
		report._id = newDocRef.id;
		await report.save();
		return report;
	}

	static async findById(id) {
		const db = getDB();
		const reportRef = doc(db, REPORTS_COLLECTION, id);
		const docSnap = await getDoc(reportRef);
		if (!docSnap.exists()) {
			return null;
		}
		return new Report({ id: docSnap.id, ...docSnap.data() });
	}

	static async find(filter = {}) {
		const db = getDB();
		const reportsRef = collection(db, REPORTS_COLLECTION);
		let q = query(reportsRef);

		if (filter.status) {
			q = query(reportsRef, where("status", "==", filter.status));
		}

		if (filter.reporterId) {
			q = query(reportsRef, where("reporterId", "==", filter.reporterId));
		}

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((reportDoc) => new Report({ id: reportDoc.id, ...reportDoc.data() }));
	}

	static async findOneByReporterAndTarget({ reporterId, targetType, targetId }) {
		const db = getDB();
		const reportsRef = collection(db, REPORTS_COLLECTION);
		const q = query(
			reportsRef,
			where("reporterId", "==", String(reporterId || "").trim()),
			where("targetType", "==", String(targetType || "").trim().toLowerCase()),
			where("targetId", "==", String(targetId || "").trim())
		);
		const querySnapshot = await getDocs(q);

		if (querySnapshot.empty) {
			return null;
		}

		const reportDoc = querySnapshot.docs[0];
		return new Report({ id: reportDoc.id, ...reportDoc.data() });
	}
}

export default Report;
