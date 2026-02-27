import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { getDB } from "../lib/db.js";

const PRODUCTS_COLLECTION = "products";

export class Product {
	constructor(data) {
		this._id = data.id || data._id;
		this.name = data.name;
		this.description = data.description;
		this.price = data.price;
		this.image = data.image;
		this.category = data.category;
		this.shopId = data.shopId || "";
		this.shopName = data.shopName || "";
		this.isFeatured = data.isFeatured || false;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	async save() {
		const db = getDB();
		const productRef = doc(collection(db, PRODUCTS_COLLECTION), this._id);
		await setDoc(productRef, {
			name: this.name,
			description: this.description,
			price: this.price,
			image: this.image,
			category: this.category,
			shopId: this.shopId,
			shopName: this.shopName,
			isFeatured: this.isFeatured,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			name: this.name,
			description: this.description,
			price: this.price,
			image: this.image,
			category: this.category,
			shopId: this.shopId,
			shopName: this.shopName,
			isFeatured: this.isFeatured,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async find(filter = {}) {
		const db = getDB();
		const productsRef = collection(db, PRODUCTS_COLLECTION);
		let q = productsRef;

		if (Object.keys(filter).length > 0) {
			const conditions = Object.entries(filter).map(([key, value]) => where(key, "==", value));
			q = query(productsRef, ...conditions);
		} else {
			q = query(productsRef);
		}

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => new Product({ id: doc.id, ...doc.data() }));
	}

	static async findById(id) {
		const db = getDB();
		const productRef = doc(db, PRODUCTS_COLLECTION, id);
		const docSnap = await getDoc(productRef);

		if (!docSnap.exists()) {
			return null;
		}

		return new Product({ id: docSnap.id, ...docSnap.data() });
	}

	static async create(data) {
		const product = new Product(data);

		const db = getDB();
		const productsRef = collection(db, PRODUCTS_COLLECTION);
		const newDocRef = doc(productsRef);
		product._id = newDocRef.id;

		await product.save();
		return product;
	}

	static async findByIdAndDelete(id) {
		const db = getDB();
		const productRef = doc(db, PRODUCTS_COLLECTION, id);
		await deleteDoc(productRef);
	}

	static async lean() {
		// For compatibility - Firestore doesn't need lean()
		return this;
	}
}

export default Product;
