import { connectDB } from "./lib/db.js";

const testConnection = async () => {
	try {
		console.log("Testing Firebase Firestore connection...");
		await connectDB();
		console.log("✓ Firebase Firestore connected successfully!");
		process.exit(0);
	} catch (error) {
		console.log("✗ Error connecting to Firebase:");
		console.log("  Message:", error.message);
		console.log("  Code:", error.code);
		console.log("  Name:", error.name);
		process.exit(1);
	}
};

testConnection();
