import express from "express";
import {
	getConversationMessages,
	getMyConversations,
	sendMessage,
	startConversation,
	startConversationByEmail,
} from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getMyConversations);
router.post("/start", protectRoute, startConversation);
router.post("/start-by-email", protectRoute, startConversationByEmail);
router.get("/:conversationId/messages", protectRoute, getConversationMessages);
router.post("/:conversationId/messages", protectRoute, sendMessage);

export default router;