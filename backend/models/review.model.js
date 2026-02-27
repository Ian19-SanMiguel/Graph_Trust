import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { getDB } from "../lib/db.js";

const REVIEWS_COLLECTION = "reviews";

export class Review {
	constructor(data) {
		this._id = data.id || data._id;
		this.productId = data.productId;
		this.userId = data.userId;
		this.userName = data.userName;
		this.rating = data.rating;
		this.comment = data.comment || "";
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	async save() {
		const db = getDB();
		const reviewRef = doc(collection(db, REVIEWS_COLLECTION), this._id);
		await setDoc(reviewRef, {
			productId: this.productId,
			userId: this.userId,
			userName: this.userName,
			rating: this.rating,
			comment: this.comment,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			productId: this.productId,
			userId: this.userId,
			userName: this.userName,
			rating: this.rating,
			comment: this.comment,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async findByProductId(productId) {
		const db = getDB();
		const reviewsRef = collection(db, REVIEWS_COLLECTION);
		const q = query(reviewsRef, where("productId", "==", productId));
		const querySnapshot = await getDocs(q);

		const reviews = querySnapshot.docs.map((reviewDoc) => new Review({ id: reviewDoc.id, ...reviewDoc.data() }));

		return reviews.sort((a, b) => {
			const aSeconds = a.createdAt?.seconds || 0;
			const bSeconds = b.createdAt?.seconds || 0;
			return bSeconds - aSeconds;
		});
	}

	static async findById(id) {
		const db = getDB();
		const reviewRef = doc(db, REVIEWS_COLLECTION, id);
		const docSnap = await getDoc(reviewRef);

		if (!docSnap.exists()) {
			return null;
		}

		return new Review({ id: docSnap.id, ...docSnap.data() });
	}

	static async findOneByUserAndProduct({ userId, productId }) {
		const reviews = await Review.findByProductId(productId);
		return reviews.find((review) => review.userId === userId) || null;
	}

	static async create(data) {
		const review = new Review(data);

		const db = getDB();
		const reviewsRef = collection(db, REVIEWS_COLLECTION);
		const newDocRef = doc(reviewsRef);
		review._id = newDocRef.id;

		await review.save();
		return review;
	}
}

export default Review;