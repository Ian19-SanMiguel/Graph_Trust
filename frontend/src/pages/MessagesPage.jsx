import { useEffect, useMemo, useState } from "react";
import {
	ArrowLeft,
	Camera,
	Image,
	Link as LinkIcon,
	Search,
	Send,
	UserCircle2,
} from "lucide-react";
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
	const [startEmailInput, setStartEmailInput] = useState("");
	const [startingByEmail, setStartingByEmail] = useState(false);

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
			const autoMessage = String(searchParams.get("autoMessage") || "").trim();

			if (shopId) {
				try {
					const response = await axios.post("/chats/start", { shopId, shopName });
					const startedConversation = response.data?.conversation;
					if (startedConversation?._id) {
						setSelectedConversationId(startedConversation._id);

						if (autoMessage) {
							const sentFlagKey = `auto_msg_sent:${startedConversation._id}:${autoMessage}`;
							if (sessionStorage.getItem(sentFlagKey) !== "1") {
								await axios.post(`/chats/${startedConversation._id}/messages`, { text: autoMessage });
								sessionStorage.setItem(sentFlagKey, "1");
							}
						}
					}
				} catch (error) {
					toast.error(error.response?.data?.message || "Failed to start chat");
				}
			}

			await fetchConversations();

			if (shopId || autoMessage) {
				window.history.replaceState({}, "", "/messages");
			}
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

	const handleStartByEmail = async () => {
		const email = startEmailInput.trim().toLowerCase();
		if (!email || startingByEmail) return;

		try {
			setStartingByEmail(true);
			const response = await axios.post("/chats/start-by-email", { email });
			const startedConversation = response.data?.conversation;

			if (startedConversation?._id) {
				setSelectedConversationId(startedConversation._id);
				setStartEmailInput("");
				await fetchConversations({ showLoading: false });
				await fetchMessages(startedConversation._id, { showLoading: false });
				toast.success("Conversation started");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to start conversation");
		} finally {
			setStartingByEmail(false);
		}
	};

	const clearSelectedConversationOnMobile = () => {
		setSelectedConversationId("");
		setMessages([]);
	};

	return (
		<div className='-mt-5 min-h-[calc(100vh-5rem)] w-full bg-gray-900'>
			<div className='grid min-h-[calc(100vh-5rem)] grid-cols-1 border-b border-gray-700 bg-gray-900 md:grid-cols-[320px_1fr]'>
					<aside
						className={`border-r border-gray-700 bg-gray-900/95 ${
							selectedConversationId ? "hidden md:block" : "block"
						}`}
					>
						<div className='border-b border-gray-700 px-5 py-4'>
							<h1 className='text-3xl font-extrabold text-accent-400'>Messages</h1>
							<div className='mt-3 flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2'>
								<Search size={16} className='text-gray-400' />
								<input
									type='email'
									value={startEmailInput}
									onChange={(event) => setStartEmailInput(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											handleStartByEmail();
										}
									}}
									placeholder='Start chat by email...'
									className='w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none'
								/>
							</div>
							<button
								type='button'
								onClick={handleStartByEmail}
								disabled={!startEmailInput.trim() || startingByEmail}
								className='mt-2 w-full rounded-lg bg-accent-600 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-500 disabled:bg-gray-700 disabled:text-gray-400'
							>
								{startingByEmail ? "Starting..." : "Start Conversation"}
							</button>
						</div>

						<div className='max-h-[calc(100vh-14rem)] overflow-y-auto md:max-h-[calc(100vh-11rem)]'>
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
										className={`w-full border-b border-gray-700 px-4 py-3 text-left transition ${
											selectedConversationId === conversation._id
												? "bg-accent-500/20"
												: "hover:bg-gray-800"
										}`}
									>
										<div className='flex items-center gap-3'>
											<UserCircle2 className='h-11 w-11 text-gray-300' />
											<div className='min-w-0 flex-1'>
												<p className='truncate text-base font-bold text-white'>
													{conversation.shopName || "Shop"}
												</p>
												<p className='truncate text-xs text-gray-400'>
													{conversation.lastMessage || "Send a message..."}
												</p>
											</div>
											<p className='text-[10px] text-gray-500'>{formatTime(conversation.updatedAt)}</p>
										</div>
									</button>
								))
							)}
						</div>
					</aside>

					<section
						className={`flex flex-col bg-gray-900/70 ${
							selectedConversationId ? "block" : "hidden md:flex"
						}`}
					>
						<div className='flex h-16 items-center justify-between border-b border-gray-700 bg-accent-700/40 px-4 text-white'>
							<div className='flex items-center gap-3'>
								<button
									type='button'
									onClick={clearSelectedConversationOnMobile}
									className='rounded-md p-1 text-white/90 hover:bg-white/10 md:hidden'
								>
									<ArrowLeft size={18} />
								</button>
								<UserCircle2 className='h-9 w-9 text-white/90' />
								<div>
									<p className='text-sm font-extrabold uppercase tracking-wide'>
										{selectedConversation?.shopName || "Select a conversation"}
									</p>
									<p className='text-xs text-green-300'>Online</p>
								</div>
							</div>
							<div className='text-xs text-white/80'>Chat</div>
						</div>

						<div className='flex-1 overflow-y-auto bg-gray-900/70 p-4'>
							{loadingMessages ? (
								<p className='text-sm text-gray-400'>Loading messages...</p>
							) : messages.length === 0 ? (
								<p className='text-sm text-gray-400'>No messages yet. Start the conversation.</p>
							) : (
								<div className='space-y-3'>
									{messages.map((message) => {
										const isMine = String(message.senderId) === String(user?._id);

										return (
											<div
												key={message._id}
												className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
											>
												{!isMine && <UserCircle2 size={18} className='mb-1 text-gray-400' />}
												<div
													className={`max-w-[72%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
														isMine
															? "rounded-br-sm bg-accent-600 text-white"
															: "rounded-bl-sm bg-gray-700 text-gray-100"
													}`}
												>
													<p>{message.text}</p>
													<p className='mt-1 text-[10px] opacity-70'>{formatTime(message.createdAt)}</p>
												</div>
												{isMine && <UserCircle2 size={18} className='mb-1 text-gray-400' />}
											</div>
										);
									})}
								</div>
							)}
						</div>

						<div className='border-t border-gray-700 bg-gray-900/90 px-3 py-2'>
							<div className='flex items-center gap-2'>
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
									placeholder={selectedConversationId ? "Type here" : "Select a conversation"}
									disabled={!selectedConversationId}
									className='h-9 flex-1 rounded-full border border-gray-600 bg-gray-800 px-4 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:opacity-70'
								/>
								<button type='button' className='rounded-md p-2 text-gray-400 hover:bg-gray-800'>
									<Image size={18} />
								</button>
								<button type='button' className='rounded-md p-2 text-gray-400 hover:bg-gray-800'>
									<Camera size={18} />
								</button>
								<button type='button' className='rounded-md p-2 text-gray-400 hover:bg-gray-800'>
									<LinkIcon size={18} />
								</button>
								<button
									type='button'
									onClick={handleSend}
									disabled={!selectedConversationId || !messageInput.trim() || sending}
									className='inline-flex items-center gap-1 rounded-full bg-accent-600 px-3 py-2 text-xs font-semibold text-white hover:bg-accent-500 disabled:bg-gray-300 disabled:text-gray-500'
								>
									<Send size={14} /> Send
								</button>
							</div>
						</div>
					</section>
				</div>
		</div>
	);
};

export default MessagesPage;