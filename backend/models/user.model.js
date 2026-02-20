import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { getDB } from "../lib/db.js";
import bcrypt from "bcryptjs";

const USERS_COLLECTION = "users";

export class User {
	constructor(data) {
		this._id = data.id || data._id;
		this.name = data.name;
		this.email = data.email;
		this.password = data.password;
		this.cartItems = data.cartItems || [];
		this.role = data.role || "customer";
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	async save() {
		const db = getDB();
		const userRef = doc(collection(db, USERS_COLLECTION), this._id);
		await setDoc(userRef, {
			name: this.name,
			email: this.email,
			password: this.password,
			cartItems: this.cartItems,
			role: this.role,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return this;
	}

	async comparePassword(password) {
		return bcrypt.compare(password, this.password);
	}

	toJSON() {
		return {
			_id: this._id,
			name: this.name,
			email: this.email,
			role: this.role,
			cartItems: this.cartItems,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async findOne(filter) {
		const db = getDB();
		const usersRef = collection(db, USERS_COLLECTION);
		const q = query(usersRef, where("email", "==", filter.email));
		const querySnapshot = await getDocs(q);

		if (querySnapshot.empty) {
			return null;
		}

		const docSnap = querySnapshot.docs[0];
		return new User({ id: docSnap.id, ...docSnap.data() });
	}

	static async findById(id) {
		const db = getDB();
		const userRef = doc(db, USERS_COLLECTION, id);
		const docSnap = await getDoc(userRef);

		if (!docSnap.exists()) {
			return null;
		}

		return new User({ id: docSnap.id, ...docSnap.data() });
	}

	static async create(data) {
		const salt = await bcrypt.genSalt(10);
		const hashPassword = await bcrypt.hash(data.password, salt);

		const user = new User({
			...data,
			password: hashPassword,
		});

		// Generate a unique ID for the user
		const db = getDB();
		const usersRef = collection(db, USERS_COLLECTION);
		const newDocRef = doc(usersRef);
		user._id = newDocRef.id;

		await user.save();
		return user;
	}
}

export default User;
