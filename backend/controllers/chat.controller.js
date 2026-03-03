import { ChatConversation, ChatMessage } from "../models/chat.model.js";
import User from "../models/user.model.js";

const canAccessConversation = (conversation, userId) =>
	Array.isArray(conversation?.participants) && conversation.participants.includes(userId);

const getOrCreateConversation = async ({ starterId, targetUserId, targetUserName }) => {
	const conversationId = ChatConversation.buildConversationId({
		buyerId: starterId,
		shopId: targetUserId,
	});

	let conversation = await ChatConversation.findById(conversationId);

	if (!conversation) {
		conversation = await ChatConversation.create({
			id: conversationId,
			_id: conversationId,
			buyerId: starterId,
			shopId: targetUserId,
			shopName: targetUserName,
			participants: [starterId, targetUserId],
			lastMessage: "",
			lastMessageSenderId: "",
		});
	}

	return conversation;
};

export const startConversation = async (req, res) => {
	try {
		const buyerId = String(req.user?._id || "");
		const { shopId, shopName } = req.body;

		if (!shopId || String(shopId).trim() === "") {
			return res.status(400).json({ message: "shopId is required" });
		}

		const normalizedShopId = String(shopId).trim();
		const normalizedShopName = String(shopName || "Shop").trim();

		if (buyerId === normalizedShopId) {
			return res.status(400).json({ message: "Cannot start a conversation with yourself" });
		}

		const conversation = await getOrCreateConversation({
			starterId: buyerId,
			targetUserId: normalizedShopId,
			targetUserName: normalizedShopName,
		});

		return res.status(201).json({ conversation: conversation.toJSON() });
	} catch (error) {
		console.log("Error in startConversation controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const startConversationByEmail = async (req, res) => {
	try {
		const starterId = String(req.user?._id || "");
		const starterEmail = String(req.user?.email || "").trim().toLowerCase();
		const email = String(req.body?.email || "").trim().toLowerCase();

		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		if (email === starterEmail) {
			return res.status(400).json({ message: "Cannot start a conversation with yourself" });
		}

		const targetUser = await User.findOne({ email });

		if (!targetUser) {
			return res.status(404).json({ message: "No user found with that email" });
		}

		const targetUserId = String(targetUser._id || "");
		if (!targetUserId) {
			return res.status(400).json({ message: "Invalid target user" });
		}

		const conversation = await getOrCreateConversation({
			starterId,
			targetUserId,
			targetUserName: String(targetUser.name || targetUser.email || "User").trim(),
		});

		return res.status(201).json({ conversation: conversation.toJSON() });
	} catch (error) {
		console.log("Error in startConversationByEmail controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getMyConversations = async (req, res) => {
	try {
		const userId = String(req.user?._id || "");
		const conversations = await ChatConversation.findByUserId(userId);
		return res.json({ conversations: conversations.map((conversation) => conversation.toJSON()) });
	} catch (error) {
		console.log("Error in getMyConversations controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getConversationMessages = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const userId = String(req.user?._id || "");

		const conversation = await ChatConversation.findById(conversationId);
		if (!conversation) {
			return res.status(404).json({ message: "Conversation not found" });
		}

		if (!canAccessConversation(conversation, userId)) {
			return res.status(403).json({ message: "Access denied" });
		}

		const messages = await ChatMessage.findByConversationId(conversationId);
		return res.json({ messages: messages.map((message) => message.toJSON()) });
	} catch (error) {
		console.log("Error in getConversationMessages controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const sendMessage = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const userId = String(req.user?._id || "");
		const senderName = String(req.user?.name || "User").trim();
		const text = String(req.body?.text || "").trim();

		if (!text) {
			return res.status(400).json({ message: "Message text is required" });
		}

		if (text.length > 1000) {
			return res.status(400).json({ message: "Message is too long" });
		}

		const conversation = await ChatConversation.findById(conversationId);
		if (!conversation) {
			return res.status(404).json({ message: "Conversation not found" });
		}

		if (!canAccessConversation(conversation, userId)) {
			return res.status(403).json({ message: "Access denied" });
		}

		const message = await ChatMessage.create({
			conversationId,
			senderId: userId,
			senderName,
			text,
		});

		conversation.lastMessage = text;
		conversation.lastMessageSenderId = userId;
		await conversation.save();

		return res.status(201).json({ message: message.toJSON() });
	} catch (error) {
		console.log("Error in sendMessage controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};