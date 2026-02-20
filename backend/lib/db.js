import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: process.env.FIREBASE_API_KEY,
	authDomain: process.env.FIREBASE_AUTH_DOMAIN,
	projectId: process.env.FIREBASE_PROJECT_ID,
	storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.FIREBASE_APP_ID,
};

let db;

export const connectDB = async () => {
	try {
		const app = initializeApp(firebaseConfig);
		db = getFirestore(app);
		console.log("Firebase Firestore connected successfully");
	} catch (error) {
		console.log("Error connecting to Firebase", error.message);
		process.exit(1);
	}
};

export const getDB = () => {
	if (!db) {
		throw new Error("Firebase not initialized. Call connectDB first.");
	}
	return db;
};
