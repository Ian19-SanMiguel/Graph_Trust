import { motion } from "framer-motion";
import { ChevronRight, FileText, ShieldCheck, Share2, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const settingsItems = [
	{ id: "about", label: "About App", icon: Smartphone },
	{ id: "terms", label: "Terms & Conditions", icon: FileText },
	{ id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
	{ id: "share", label: "Share This App", icon: Share2 },
];

const SettingsPage = () => {
	const { logout } = useUserStore();

	const handleSettingClick = async (itemId) => {
		if (itemId === "share") {
			const sharePayload = {
				title: "GraphTrust",
				text: "Check out GraphTrust",
				url: window.location.origin,
			};

			try {
				if (navigator.share) {
					await navigator.share(sharePayload);
					return;
				}

				if (navigator.clipboard?.writeText) {
					await navigator.clipboard.writeText(window.location.origin);
					toast.success("App link copied");
					return;
				}
			} catch {
				toast.error("Unable to share right now");
				return;
			}

			toast("Sharing is not available in this browser");
			return;
		}

		toast("Coming soon");
	};

	return (
		<div className='min-h-screen pb-10'>
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
				<motion.h1
					className='text-3xl sm:text-4xl font-bold mb-6 text-accent-400'
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
				>
					Settings
				</motion.h1>

				<motion.div
					className='rounded-2xl border border-gray-700 bg-gray-900/70 overflow-hidden'
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<div className='bg-accent-700/80 px-6 py-3 border-b border-accent-500/40'>
						<h2 className='text-white font-semibold text-xl'>Information</h2>
					</div>

					<div className='divide-y divide-gray-700'>
						{settingsItems.map((item) => {
							const ItemIcon = item.icon;
							return (
								<button
									key={item.id}
									type='button'
									onClick={() => handleSettingClick(item.id)}
									className='w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800/80 transition-colors'
								>
									<div className='flex items-center gap-4'>
										<ItemIcon size={20} className='text-gray-300' />
										<span className='text-gray-100 text-xl'>{item.label}</span>
									</div>
									<ChevronRight size={20} className='text-gray-500' />
								</button>
							);
						})}
					</div>
				</motion.div>

				<div className='mt-6 rounded-2xl border border-gray-700 bg-gray-900/70 px-6 py-5'>
					<button
						type='button'
						onClick={logout}
						className='w-full text-center text-lg text-gray-300 hover:text-red-300 transition-colors'
					>
						Sign Out
					</button>
				</div>
			</div>
		</div>
	);
};

export default SettingsPage;