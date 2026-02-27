import { useEffect, useMemo, useState } from "react";
import { Image, Link as LinkIcon, Send, UserCircle2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";

const formatTime = (timestamp) => {
	const seconds = timestamp?.seconds;
	if (!seconds) return "";
	return new Date(seconds * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const MessagesPage = () => {
	const { user } = useUserStore();
	const [searchParams] = useSearchParams();
	const [conversations, setConversations] = useState([]);
	const [selectedConversationId, setSelectedConversationId] = useState("");
	const [messages, setMessages] = useState([]);
	const [loadingConversations, setLoadingConversations] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [messageInput, setMessageInput] = useState("");
	const [sending, setSending] = useState(false);

	const selectedConversation = useMemo(
		() => conversations.find((conversation) => conversation._id === selectedConversationId) || null,
		[conversations, selectedConversationId]
	);

	const fetchConversations = async ({ showLoading = true, silentError = false } = {}) => {
		try {
			if (showLoading) {
				setLoadingConversations(true);
			}
			const response = await axios.get("/chats/conversations");
			const nextConversations = response.data?.conversations || [];
			setConversations(nextConversations);

			if (!selectedConversationId && nextConversations.length > 0) {
				setSelectedConversationId(nextConversations[0]._id);
			}
		} catch (error) {
			if (!silentError) {
				toast.error(error.response?.data?.message || "Failed to load conversations");
			}
		} finally {
			if (showLoading) {
				setLoadingConversations(false);
			}
		}
	};

	const fetchMessages = async (conversationId, { showLoading = true, silentError = false } = {}) => {
		if (!conversationId) return;

		try {
			if (showLoading) {
				setLoadingMessages(true);
			}
			const response = await axios.get(`/chats/${conversationId}/messages`);
			setMessages(response.data?.messages || []);
		} catch (error) {
			if (!silentError) {
				toast.error(error.response?.data?.message || "Failed to load messages");
			}
		} finally {
			if (showLoading) {
				setLoadingMessages(false);
			}
		}
	};

	useEffect(() => {
		const init = async () => {
			const shopId = searchParams.get("shopId");
			const shopName = searchParams.get("shopName");

			if (shopId) {
				try {
					const response = await axios.post("/chats/start", { shopId, shopName });
					const startedConversation = response.data?.conversation;
					if (startedConversation?._id) {
						setSelectedConversationId(startedConversation._id);
					}
				} catch (error) {
					toast.error(error.response?.data?.message || "Failed to start chat");
				}
			}

			await fetchConversations();
		};

		init();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		fetchMessages(selectedConversationId, { showLoading: true });
	}, [selectedConversationId]);

	useEffect(() => {
		if (!selectedConversationId) return;

		const intervalId = setInterval(() => {
			fetchConversations({ showLoading: false, silentError: true });
			fetchMessages(selectedConversationId, { showLoading: false, silentError: true });
		}, 5000);

		return () => clearInterval(intervalId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedConversationId]);

	const handleSend = async () => {
		const text = messageInput.trim();
		if (!text || !selectedConversationId || sending) return;

		try {
			setSending(true);
			await axios.post(`/chats/${selectedConversationId}/messages`, { text });
			setMessageInput("");
			await fetchMessages(selectedConversationId, { showLoading: false });
			await fetchConversations({ showLoading: false });
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	return (
		<div className='container mx-auto px-4 py-6'>
			<h1 className='text-4xl font-bold text-accent-400 mb-4'>Messages</h1>

			<div className='rounded-xl overflow-hidden border border-gray-700 bg-gray-900/80 flex min-h-[70vh]'>
				<aside className='w-[32%] min-w-[18rem] border-r border-gray-700 bg-gray-900/90'>
					{loadingConversations ? (
						<div className='p-4 text-gray-400'>Loading conversations...</div>
					) : conversations.length === 0 ? (
						<div className='p-4 text-gray-400'>No conversations yet.</div>
					) : (
						conversations.map((conversation) => (
							<button
								key={conversation._id}
								type='button'
								onClick={() => setSelectedConversationId(conversation._id)}
								className={`w-full px-4 py-3 border-b border-gray-700 text-left transition-colors ${
									selectedConversationId === conversation._id ? "bg-accent-500/20" : "hover:bg-gray-800"
								}`}
							>
								<div className='flex items-center gap-3'>
									<UserCircle2 className='h-10 w-10 text-gray-200' />
									<div className='min-w-0 flex-1'>
										<p className='text-white font-semibold truncate'>{conversation.shopName || "Shop"}</p>
										<p className='text-gray-400 text-xs truncate'>{conversation.lastMessage || "Start chatting..."}</p>
									</div>
									<p className='text-[10px] text-gray-500'>{formatTime(conversation.updatedAt)}</p>
								</div>
							</button>
						))
					)}
				</aside>

				<section className='flex-1 flex flex-col'>
					<div className='h-14 border-b border-gray-700 bg-accent-700/60 px-4 flex items-center justify-between'>
						<div>
							<p className='text-white font-semibold text-sm uppercase tracking-wide'>
								{selectedConversation?.shopName || "Select a conversation"}
							</p>
							<p className='text-green-300 text-xs'>Online</p>
						</div>
						<div className='text-gray-200'>
							<UserCircle2 className='h-6 w-6' />
						</div>
					</div>

					<div className='flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950/40'>
						{loadingMessages ? (
							<p className='text-gray-400 text-sm'>Loading messages...</p>
						) : messages.length === 0 ? (
							<p className='text-gray-400 text-sm'>No messages yet. Say hi 👋</p>
						) : (
							messages.map((message) => {
								const isMine = String(message.senderId) === String(user?._id);

								return (
									<div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
										<div
											className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
												isMine ? "bg-accent-700 text-white" : "bg-accent-300/40 text-gray-100"
											}`}
										>
											<p>{message.text}</p>
											<p className='mt-1 text-[10px] opacity-70'>{formatTime(message.createdAt)}</p>
										</div>
									</div>
								);
							})
						)}
					</div>

					<div className='border-t border-gray-700 bg-gray-900/70 p-3 flex items-center gap-2'>
						<input
							type='text'
							value={messageInput}
							onChange={(event) => setMessageInput(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									handleSend();
								}
							}}
							placeholder={selectedConversationId ? "Type your message..." : "Select a conversation"}
							disabled={!selectedConversationId}
							className='flex-1 rounded-full bg-gray-800 border border-gray-600 px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-accent-400 disabled:opacity-60'
						/>
						<button type='button' className='p-2 rounded bg-gray-800 border border-gray-600 text-gray-300'>
							<Image size={18} />
						</button>
						<button type='button' className='p-2 rounded bg-gray-800 border border-gray-600 text-gray-300'>
							<LinkIcon size={18} />
						</button>
						<button
							type='button'
							onClick={handleSend}
							disabled={!selectedConversationId || !messageInput.trim() || sending}
							className='inline-flex items-center gap-1 rounded bg-accent-600 hover:bg-accent-500 disabled:bg-gray-700 disabled:text-gray-400 px-3 py-2 text-sm font-semibold text-white'
						>
							<Send size={14} />
							Send
						</button>
					</div>
				</section>
			</div>
		</div>
	);
};

export default MessagesPage;