import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { getDB } from "../lib/db.js";

const ORDERS_COLLECTION = "orders";

export class Order {
	constructor(data) {
		this._id = data.id || data._id;
		this.user = data.user;
		this.products = data.products || [];
		this.totalAmount = data.totalAmount;
		this.stripeSessionId = data.stripeSessionId;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	async save() {
		const db = getDB();
		const orderRef = doc(collection(db, ORDERS_COLLECTION), this._id);
		await setDoc(orderRef, {
			user: this.user,
			products: this.products,
			totalAmount: this.totalAmount,
			stripeSessionId: this.stripeSessionId,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			user: this.user,
			products: this.products,
			totalAmount: this.totalAmount,
			stripeSessionId: this.stripeSessionId,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async find(filter = {}) {
		const db = getDB();
		const ordersRef = collection(db, ORDERS_COLLECTION);
		let q = ordersRef;

		if (Object.keys(filter).length > 0) {
			const conditions = Object.entries(filter).map(([key, value]) => where(key, "==", value));
			q = query(ordersRef, ...conditions);
		} else {
			q = query(ordersRef);
		}

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => new Order({ id: doc.id, ...doc.data() }));
	}

	static async findById(id) {
		const db = getDB();
		const orderRef = doc(db, ORDERS_COLLECTION, id);
		const docSnap = await getDoc(orderRef);

		if (!docSnap.exists()) {
			return null;
		}

		return new Order({ id: docSnap.id, ...docSnap.data() });
	}

	static async findOne(filter) {
		const db = getDB();
		const ordersRef = collection(db, ORDERS_COLLECTION);
		const conditions = Object.entries(filter).map(([key, value]) => where(key, "==", value));
		const q = query(ordersRef, ...conditions);
		const querySnapshot = await getDocs(q);

		if (querySnapshot.empty) {
			return null;
		}

		const docSnap = querySnapshot.docs[0];
		return new Order({ id: docSnap.id, ...docSnap.data() });
	}

	static async create(data) {
		const order = new Order(data);

		const db = getDB();
		const ordersRef = collection(db, ORDERS_COLLECTION);
		const newDocRef = doc(ordersRef);
		order._id = newDocRef.id;

		await order.save();
		return order;
	}

	static async findByIdAndDelete(id) {
		const db = getDB();
		const orderRef = doc(db, ORDERS_COLLECTION, id);
		await deleteDoc(orderRef);
	}
}

export default Order;
