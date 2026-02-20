import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { getDB } from "../lib/db.js";

const COUPONS_COLLECTION = "coupons";

export class Coupon {
	constructor(data) {
		this._id = data.id || data._id;
		this.code = data.code;
		this.discountPercentage = data.discountPercentage;
		this.expirationDate = data.expirationDate;
		this.isActive = data.isActive !== undefined ? data.isActive : true;
		this.userId = data.userId;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	async save() {
		const db = getDB();
		const couponRef = doc(collection(db, COUPONS_COLLECTION), this._id);
		await setDoc(couponRef, {
			code: this.code,
			discountPercentage: this.discountPercentage,
			expirationDate: this.expirationDate,
			isActive: this.isActive,
			userId: this.userId,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			code: this.code,
			discountPercentage: this.discountPercentage,
			expirationDate: this.expirationDate,
			isActive: this.isActive,
			userId: this.userId,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async find(filter = {}) {
		const db = getDB();
		const couponsRef = collection(db, COUPONS_COLLECTION);
		let q = couponsRef;

		if (Object.keys(filter).length > 0) {
			const conditions = Object.entries(filter).map(([key, value]) => where(key, "==", value));
			q = query(couponsRef, ...conditions);
		} else {
			q = query(couponsRef);
		}

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => new Coupon({ id: doc.id, ...doc.data() }));
	}

	static async findById(id) {
		const db = getDB();
		const couponRef = doc(db, COUPONS_COLLECTION, id);
		const docSnap = await getDoc(couponRef);

		if (!docSnap.exists()) {
			return null;
		}

		return new Coupon({ id: docSnap.id, ...docSnap.data() });
	}

	static async findOne(filter) {
		const db = getDB();
		const couponsRef = collection(db, COUPONS_COLLECTION);
		const conditions = Object.entries(filter).map(([key, value]) => where(key, "==", value));
		const q = query(couponsRef, ...conditions);
		const querySnapshot = await getDocs(q);

		if (querySnapshot.empty) {
			return null;
		}

		const docSnap = querySnapshot.docs[0];
		return new Coupon({ id: docSnap.id, ...docSnap.data() });
	}

	static async create(data) {
		const coupon = new Coupon(data);

		const db = getDB();
		const couponsRef = collection(db, COUPONS_COLLECTION);
		const newDocRef = doc(couponsRef);
		coupon._id = newDocRef.id;

		await coupon.save();
		return coupon;
	}

	static async findByIdAndDelete(id) {
		const db = getDB();
		const couponRef = doc(db, COUPONS_COLLECTION, id);
		await deleteDoc(couponRef);
	}
}

export default Coupon;
