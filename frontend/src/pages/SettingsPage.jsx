import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, FileText, ShieldCheck, Share2, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";

const settingsItems = [
	{ id: "about", label: "About App", icon: Smartphone },
	{ id: "terms", label: "Terms & Conditions", icon: FileText },
	{ id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
	{ id: "share", label: "Share This App", icon: Share2 },
];

const SettingsPage = () => {
	const { logout, checkAuth, user } = useUserStore();
	const [mfaEnabled, setMfaEnabled] = useState(Boolean(user?.mfaEnabled));
	const [mfaLoading, setMfaLoading] = useState(false);
	const [mfaSetupData, setMfaSetupData] = useState(null);
	const [enableCode, setEnableCode] = useState("");
	const [disableCode, setDisableCode] = useState("");

	useEffect(() => {
		setMfaEnabled(Boolean(user?.mfaEnabled));
	}, [user?.mfaEnabled]);

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

	const loadMfaStatus = async () => {
		try {
			const response = await axios.get("/auth/mfa/status");
			setMfaEnabled(Boolean(response.data?.mfaEnabled));
		} catch {
			toast.error("Failed to load MFA status");
		}
	};

	useEffect(() => {
		loadMfaStatus();
	}, []);

	const handleStartMfaSetup = async () => {
		try {
			setMfaLoading(true);
			const response = await axios.post("/auth/mfa/setup");
			setMfaSetupData(response.data);
			setEnableCode("");
			toast.success("Scan the QR code and enter your 6-digit code");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to start MFA setup");
		} finally {
			setMfaLoading(false);
		}
	};

	const handleEnableMfa = async () => {
		try {
			setMfaLoading(true);
			await axios.post("/auth/mfa/enable", { token: enableCode });
			setMfaEnabled(true);
			setMfaSetupData(null);
			setEnableCode("");
			await checkAuth();
			toast.success("MFA enabled successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to enable MFA");
		} finally {
			setMfaLoading(false);
		}
	};

	const handleDisableMfa = async () => {
		try {
			setMfaLoading(true);
			await axios.post("/auth/mfa/disable", { token: disableCode });
			setMfaEnabled(false);
			setDisableCode("");
			await checkAuth();
			toast.success("MFA disabled");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to disable MFA");
		} finally {
			setMfaLoading(false);
		}
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
					<div className='mb-5 pb-5 border-b border-gray-700'>
						<div className='flex items-center justify-between mb-3'>
							<h3 className='text-lg text-gray-100 font-semibold'>Multi-Factor Authentication</h3>
							<span
								className={`text-xs px-2 py-1 rounded-full ${
									mfaEnabled ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"
								}`}
							>
								{mfaEnabled ? "Enabled" : "Disabled"}
							</span>
						</div>
						<p className='text-sm text-gray-400 mb-4'>
							Protect your account with a one-time code from an authenticator app.
						</p>

						{!mfaEnabled && !mfaSetupData && (
							<button
								type='button'
								onClick={handleStartMfaSetup}
								disabled={mfaLoading}
								className='rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500 disabled:opacity-60'
							>
								{mfaLoading ? "Preparing..." : "Set Up MFA"}
							</button>
						)}

						{!mfaEnabled && mfaSetupData && (
							<div className='space-y-4'>
								<div className='rounded-lg border border-gray-700 bg-gray-800/70 p-3'>
									<img
										src={mfaSetupData.qrCodeDataUrl}
										alt='MFA QR code'
										className='w-48 h-48 bg-white p-2 rounded mx-auto'
									/>
									<p className='mt-3 text-xs text-gray-400 break-all'>
										Manual setup key: <span className='text-gray-300'>{mfaSetupData.secret}</span>
									</p>
								</div>
								<div className='flex gap-2'>
									<input
										type='text'
										value={enableCode}
										onChange={(event) => setEnableCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
										placeholder='Enter 6-digit code'
										className='flex-1 rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-accent-400'
									/>
									<button
										type='button'
										onClick={handleEnableMfa}
										disabled={mfaLoading || enableCode.length < 6}
										className='rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60'
									>
										Enable
									</button>
									<button
										type='button'
										onClick={() => {
											setMfaSetupData(null);
											setEnableCode("");
										}}
										className='rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600'
									>
										Cancel
									</button>
								</div>
							</div>
						)}

						{mfaEnabled && (
							<div className='space-y-3'>
								<p className='text-sm text-gray-400'>Enter a current authenticator code to disable MFA.</p>
								<div className='flex gap-2'>
									<input
										type='text'
										value={disableCode}
										onChange={(event) => setDisableCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
										placeholder='Enter 6-digit code'
										className='flex-1 rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-accent-400'
									/>
									<button
										type='button'
										onClick={handleDisableMfa}
										disabled={mfaLoading || disableCode.length < 6}
										className='rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60'
									>
										Disable
									</button>
								</div>
							</div>
						)}
					</div>

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