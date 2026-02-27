import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { getDB } from "../lib/db.js";

const CONVERSATIONS_COLLECTION = "chat_conversations";
const MESSAGES_COLLECTION = "chat_messages";

export class ChatConversation {
	constructor(data) {
		this._id = data.id || data._id;
		this.buyerId = data.buyerId;
		this.shopId = data.shopId;
		this.shopName = data.shopName || "Shop";
		this.participants = data.participants || [];
		this.lastMessage = data.lastMessage || "";
		this.lastMessageSenderId = data.lastMessageSenderId || "";
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	static buildConversationId({ buyerId, shopId }) {
		return `${buyerId}_${shopId}`;
	}

	async save() {
		const db = getDB();
		const conversationRef = doc(db, CONVERSATIONS_COLLECTION, this._id);
		await setDoc(conversationRef, {
			buyerId: this.buyerId,
			shopId: this.shopId,
			shopName: this.shopName,
			participants: this.participants,
			lastMessage: this.lastMessage,
			lastMessageSenderId: this.lastMessageSenderId,
			createdAt: this.createdAt || serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			buyerId: this.buyerId,
			shopId: this.shopId,
			shopName: this.shopName,
			participants: this.participants,
			lastMessage: this.lastMessage,
			lastMessageSenderId: this.lastMessageSenderId,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	static async findById(id) {
		const db = getDB();
		const conversationRef = doc(db, CONVERSATIONS_COLLECTION, id);
		const docSnap = await getDoc(conversationRef);

		if (!docSnap.exists()) {
			return null;
		}

		return new ChatConversation({ id: docSnap.id, ...docSnap.data() });
	}

	static async findByUserId(userId) {
		const db = getDB();
		const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
		const q = query(conversationsRef, where("participants", "array-contains", userId));
		const querySnapshot = await getDocs(q);

		const conversations = querySnapshot.docs.map((conversationDoc) =>
			new ChatConversation({ id: conversationDoc.id, ...conversationDoc.data() })
		);

		return conversations.sort((a, b) => {
			const aSeconds = a.updatedAt?.seconds || 0;
			const bSeconds = b.updatedAt?.seconds || 0;
			return bSeconds - aSeconds;
		});
	}

	static async create(data) {
		const conversation = new ChatConversation(data);
		await conversation.save();
		return conversation;
	}
}

export class ChatMessage {
	constructor(data) {
		this._id = data.id || data._id;
		this.conversationId = data.conversationId;
		this.senderId = data.senderId;
		this.senderName = data.senderName || "User";
		this.text = data.text;
		this.createdAt = data.createdAt;
	}

	async save() {
		const db = getDB();
		const messagesRef = collection(db, MESSAGES_COLLECTION);
		const messageRef = doc(messagesRef, this._id);
		await setDoc(messageRef, {
			conversationId: this.conversationId,
			senderId: this.senderId,
			senderName: this.senderName,
			text: this.text,
			createdAt: this.createdAt || serverTimestamp(),
		});

		return this;
	}

	toJSON() {
		return {
			_id: this._id,
			conversationId: this.conversationId,
			senderId: this.senderId,
			senderName: this.senderName,
			text: this.text,
			createdAt: this.createdAt,
		};
	}

	static async create(data) {
		const message = new ChatMessage(data);

		const db = getDB();
		const messagesRef = collection(db, MESSAGES_COLLECTION);
		const newDocRef = doc(messagesRef);
		message._id = newDocRef.id;

		await message.save();
		return message;
	}

	static async findByConversationId(conversationId) {
		const db = getDB();
		const messagesRef = collection(db, MESSAGES_COLLECTION);
		const q = query(messagesRef, where("conversationId", "==", conversationId));
		const querySnapshot = await getDocs(q);

		const messages = querySnapshot.docs.map((messageDoc) =>
			new ChatMessage({ id: messageDoc.id, ...messageDoc.data() })
		);

		return messages.sort((a, b) => {
			const aSeconds = a.createdAt?.seconds || 0;
			const bSeconds = b.createdAt?.seconds || 0;
			return aSeconds - bSeconds;
		});
	}
}
