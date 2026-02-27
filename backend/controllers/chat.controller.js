import { ChatConversation, ChatMessage } from "../models/chat.model.js";

const canAccessConversation = (conversation, userId) =>
	Array.isArray(conversation?.participants) && conversation.participants.includes(userId);

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

		const conversationId = ChatConversation.buildConversationId({
			buyerId,
			shopId: normalizedShopId,
		});

		let conversation = await ChatConversation.findById(conversationId);

		if (!conversation) {
			conversation = await ChatConversation.create({
				id: conversationId,
				_id: conversationId,
				buyerId,
				shopId: normalizedShopId,
				shopName: normalizedShopName,
				participants: [buyerId, normalizedShopId],
				lastMessage: "",
				lastMessageSenderId: "",
			});
		}

		return res.status(201).json({ conversation: conversation.toJSON() });
	} catch (error) {
		console.log("Error in startConversation controller", error.message);
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