import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { getDB } from "../lib/db.js";

const CATEGORIES_COLLECTION = "categories";

export class Category {
	constructor(data) {
		this._id = data.id || data._id;
		this.name = data.name;
		this.slug = data.slug;
		this.imageUrl = data.imageUrl || "";
		this.createdBy = data.createdBy || "";
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	async save() {
		const db = getDB();
		const categoryRef = doc(collection(db, CATEGORIES_COLLECTION), this._id);
		await setDoc(categoryRef, {
			name: this.name,
			slug: this.slug,
			imageUrl: this.imageUrl,
			createdBy: this.createdBy,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			name: this.name,
			slug: this.slug,
			imageUrl: this.imageUrl,
			createdBy: this.createdBy,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async find(filter = {}) {
		const db = getDB();
		const categoriesRef = collection(db, CATEGORIES_COLLECTION);
		let q = categoriesRef;

		if (Object.keys(filter).length > 0) {
			const conditions = Object.entries(filter).map(([key, value]) => where(key, "==", value));
			q = query(categoriesRef, ...conditions);
		} else {
			q = query(categoriesRef);
		}

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((docSnap) => new Category({ id: docSnap.id, ...docSnap.data() }));
	}

	static async findOne(filter = {}) {
		const results = await Category.find(filter);
		return results.length > 0 ? results[0] : null;
	}

	static async findById(id) {
		const db = getDB();
		const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
		const docSnap = await getDoc(categoryRef);
		if (!docSnap.exists()) {
			return null;
		}
		return new Category({ id: docSnap.id, ...docSnap.data() });
	}

	static async create(data) {
		const category = new Category(data);

		const db = getDB();
		const categoriesRef = collection(db, CATEGORIES_COLLECTION);
		const newDocRef = doc(categoriesRef);
		category._id = newDocRef.id;

		await category.save();
		return category;
	}

	static async findByIdAndDelete(id) {
		const db = getDB();
		const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
		await deleteDoc(categoryRef);
	}
}

export default Category;
