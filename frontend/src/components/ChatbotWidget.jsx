import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useMemo, useState } from "react";

const initialMessages = [
	{
		id: 1,
		from: "bot",
		text: "Hello! How can I help you today?",
		time: "4:54 PM",
	},
];

const formatCurrentTime = () => {
	return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const getEstimatedDeliveryDate = () => {
	const eta = new Date();
	eta.setDate(eta.getDate() + 3);
	return eta.toLocaleDateString([], { month: "short", day: "numeric" });
};

const extractOrderNumber = (message) => {
	const matched = String(message || "").match(/#?[A-Za-z0-9]{8,}/);
	if (!matched) {
		return "";
	}

	return matched[0].startsWith("#") ? matched[0] : `#${matched[0]}`;
};

const buildBotReply = (message) => {
	const normalized = String(message || "").trim();
	const lowered = normalized.toLowerCase();
	const orderNumber = extractOrderNumber(normalized);

	if (orderNumber) {
		return {
			text: `Thanks. I found order ${orderNumber}. Please click the tracker below to view updates.`,
			showTrackerLink: true,
		};
	}

	if (lowered.includes("track") || lowered.includes("order")) {
		return {
			text: "Of course. Can you share your order number so I can check it?",
			showTrackerLink: false,
		};
	}

	return {
		text: "I can help with order tracking. Share your order number and I will guide you to the tracker.",
		showTrackerLink: false,
	};
};

const MessageBubble = ({ message, onOpenTracker }) => {
	const isBot = message.from === "bot";

	return (
		<div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
			<div
				className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-4 ${
					isBot ? "bg-gray-100 text-gray-700" : "bg-[#8F5BFF] text-white"
				}`}
			>
				<p>{message.text}</p>
				{message.showStatusCard && (
					<div className='mt-2 rounded-lg border border-[#d8ccfb] bg-white/90 p-2 text-[11px] text-gray-700'>
						<p className='font-semibold text-[#5f4a93]'>Order Update</p>
						<p className='mt-1'>Status: In transit</p>
						<p>Estimated arrival: {message.estimatedDelivery || "in 3-5 business days"}</p>
					</div>
				)}
				{message.showTrackerLink && (
					<p className='mt-1'>
						<button
							type='button'
							onClick={onOpenTracker}
							className='font-semibold underline hover:text-accent-200'
						>
							Go to order tracker
						</button>
					</p>
				)}
			</div>
		</div>
	);
};

const ChatbotWidget = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState(initialMessages);

	const canSend = useMemo(() => String(input || "").trim().length > 0, [input]);

	const sendMessage = () => {
		const text = String(input || "").trim();
		if (!text) {
			return;
		}

		const userMessage = {
			id: Date.now(),
			from: "user",
			text,
			time: formatCurrentTime(),
		};

		const botReplyShape = buildBotReply(text);
		const botMessage = {
			id: Date.now() + 1,
			from: "bot",
			text: botReplyShape.text,
			showTrackerLink: botReplyShape.showTrackerLink,
			time: formatCurrentTime(),
		};

		setMessages((prev) => [...prev, userMessage, botMessage]);
		setInput("");
	};

	const openOrderTracker = () => {
		const trackerMessage = {
			id: Date.now(),
			from: "bot",
			text: "Here is a quick tracking summary for your order.",
			showStatusCard: true,
			estimatedDelivery: getEstimatedDeliveryDate(),
			time: formatCurrentTime(),
		};

		setMessages((prev) => [...prev, trackerMessage]);
	};

	return (
		<div className='fixed bottom-4 right-4 z-[120]'>
			{isOpen && (
				<div className='mb-3 w-[310px] overflow-hidden rounded-xl border border-[#7d5ac7] bg-[#f4f4f5] shadow-2xl'>
					<div className='flex items-center justify-between bg-[#5f4a93] px-4 py-3'>
						<h3 className='text-lg font-bold uppercase tracking-[0.08em] text-white'>Chatbot</h3>
						<button
							type='button'
							onClick={() => setIsOpen(false)}
							className='rounded-md p-1 text-white/90 hover:bg-white/15'
							aria-label='Close chatbot'
						>
							<X size={16} />
						</button>
					</div>

					<div className='h-[320px] space-y-2 overflow-y-auto bg-[#efefef] p-3'>
						{messages.map((message) => (
							<MessageBubble key={message.id} message={message} onOpenTracker={openOrderTracker} />
						))}
					</div>

					<div className='bg-white p-3'>
						<div className='flex items-center gap-2'>
							<input
								type='text'
								value={input}
								onChange={(event) => setInput(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										sendMessage();
									}
								}}
								placeholder='Type here'
								className='h-9 flex-1 rounded-full border border-gray-300 px-3 text-sm text-gray-700 focus:border-accent-500 focus:outline-none'
							/>
							<button
								type='button'
								onClick={sendMessage}
								disabled={!canSend}
								className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#8F5BFF] text-white hover:bg-[#7b45ef] disabled:cursor-not-allowed disabled:opacity-60'
								aria-label='Send message'
							>
								<Send size={15} />
							</button>
						</div>
					</div>
				</div>
			)}

			<button
				type='button'
				onClick={() => setIsOpen((prev) => !prev)}
				className='inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/80 bg-[#8F5BFF] text-white shadow-xl hover:bg-[#7b45ef]'
				aria-label='Toggle chatbot'
			>
				{isOpen ? <MessageCircle size={26} /> : <Bot size={26} />}
			</button>
		</div>
	);
};

export default ChatbotWidget;
