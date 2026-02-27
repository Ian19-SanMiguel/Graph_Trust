import { CheckCircle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import VerificationForm from "../components/VerificationForm";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";

const VerifiedSellerPage = () => {
	const [showVerificationForm, setShowVerificationForm] = useState(false);
	const [verificationStatus, setVerificationStatus] = useState("not_submitted");
	const { user } = useUserStore();
	const isVerificationPending = verificationStatus === "pending";
	const isVerificationApproved = verificationStatus === "approved";
	const isVerificationRejected = verificationStatus === "rejected";

	useEffect(() => {
		const loadVerificationStatus = async () => {
			if (!user) {
				setVerificationStatus("not_submitted");
				return;
			}

			try {
				const response = await axios.get("/verifications/me");
				setVerificationStatus(response.data?.status || "not_submitted");
			} catch (error) {
				setVerificationStatus("not_submitted");
			}
		};

		loadVerificationStatus();
	}, [user]);

	const isVerificationActionLocked = isVerificationPending || isVerificationApproved;
	const verificationActionLabel = isVerificationApproved
		? "Verified"
		: isVerificationPending
			? "Verification Pending"
			: "Start Verification";

	const verificationStatusMessage = isVerificationApproved
		? "Your account is verified. Your verified badge and trust benefits are now active."
		: isVerificationPending
			? "Your verification is pending review. We’ll notify you once approved."
			: isVerificationRejected
				? "Your verification was rejected. Please submit a new one."
				: "Verification takes about a few minutes. You'll get a Verified badge after approval.";
	return (
		<div className='relative text-white'>

			<div className='relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
				{/* Header Section */}
				<motion.div
					className='mb-4'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<h1 className='text-4xl sm:text-5xl lg:text-4xl font-bold mb-2' style={{ color: '#8F5BFF' }}>
						Get Verified
					</h1>
					<p className='text-gray-300 lg:text-sm'>
						Complete KYC to earn a verified badge and higher trust score
					</p>
				</motion.div>

				{/* Main Content - Grid with Badge + Verification Card */}
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
					{/* Left Sidebar - Badge Info */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className='md:col-span-1'
					>
						<div className='bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6 lg:p-4 text-white'>
							<CheckCircle className='w-16 h-16 lg:w-12 lg:h-12 mb-3' />
							<h3 className='text-lg font-bold mb-2'>Verified Seller Badge</h3>
							<p className='text-sm lg:text-xs mb-4 lg:mb-3'>Stand out and build trust with buyers</p>
							<div className='bg-white bg-opacity-20 rounded-lg p-3 lg:p-2 mb-3'>
								<p className='text-xs font-semibold text-center'>After approval</p>
							</div>
							<p className='text-xs opacity-75 text-center'>Your badge will appear on all listings</p>
						</div>
					</motion.div>

					{/* Center - Main Verification Card */}
					<motion.div
						className='md:col-span-2 flex justify-center'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						<div className='w-full max-w-md'>
						<div className='bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-8 lg:p-5 relative'>
								{(isVerificationPending || isVerificationApproved) && (
									<div className='absolute top-6 right-6 transform rotate-12'>
										<div
											className={`border-4 px-3 py-1 rounded text-lg font-bold ${
												isVerificationApproved
													? "border-green-400 text-green-400"
													: "border-accent-400 text-accent-400"
											}`}
										>
											{isVerificationApproved ? "VERIFIED" : "PENDING"}
										</div>
									</div>
								)}

								{/* Steps */}
								<div className='space-y-6 lg:space-y-3'>
									<div className='grid grid-cols-4 gap-2 mb-8 lg:mb-4'>
										{['Info', 'Upload', 'Selfie', 'Review'].map((step, idx) => (
											<div key={idx} className='text-center'>
												<motion.div
													className='bg-white bg-opacity-30 rounded-full w-12 h-12 lg:w-10 lg:h-10 flex items-center justify-center mx-auto mb-2 text-lg lg:text-sm font-bold text-white border-2 border-white border-opacity-50'
													whileHover={{ scale: 1.1 }}
												>
													{idx + 1}
												</motion.div>
												<p className='text-xs font-semibold text-white'>{step}</p>
											</div>
										))}
									</div>

									<p className='text-center text-sm lg:text-xs text-white mb-8 lg:mb-4'>
										Takes 3-5 minutes. You'll get a Verified badge after approval
									</p>

									<motion.button
										onClick={() => !isVerificationActionLocked && setShowVerificationForm(true)}
										disabled={isVerificationActionLocked}
										className={`w-full text-white font-bold py-3 lg:py-2.5 px-6 rounded-lg transition duration-300 ${
											isVerificationActionLocked
												? 'bg-gray-700 cursor-not-allowed opacity-80'
												: 'bg-gray-900 hover:bg-gray-800'
										}`}
										whileHover={!isVerificationActionLocked ? { scale: 1.02 } : undefined}
										whileTap={{ scale: 0.98 }}
									>
										{verificationActionLabel}
									</motion.button>
								</div>
							</div>

							<p className='text-center text-xs text-gray-400 mt-4 lg:mt-3'>
								{verificationStatusMessage}
							</p>
						</div>
					</motion.div>

					{/* Right Empty Space */}
					<div className='hidden md:block md:col-span-1'></div>
				</div>

				{/* Requirements and Benefits - Bottom Section */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
					{/* Requirements */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<div className='bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6 lg:p-4'>
							<h3 className='text-lg font-bold mb-4 text-white'>Requirements</h3>
							<p className='text-white text-sm lg:text-xs mb-4 lg:mb-3 font-semibold'>Prepare:</p>
							<ul className='space-y-2 lg:space-y-1 mb-4 lg:mb-3'>
								<li className='flex items-center text-white text-sm'>
									<span className='w-2 h-2 bg-white rounded-full mr-3'></span>
									<span>Government ID</span>
								</li>
								<li className='flex items-center text-white text-sm'>
									<span className='w-2 h-2 bg-white rounded-full mr-3'></span>
									<span>Clear selfie</span>
								</li>
								<li className='flex items-center text-white text-sm'>
									<span className='w-2 h-2 bg-white rounded-full mr-3'></span>
									<span>Stable internet</span>
								</li>
							</ul>
							<p className='text-xs text-white opacity-75'>
								Your documents are encrypted and used only for verification
							</p>
						</div>
					</motion.div>

					{/* Benefits */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<div className='bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6 lg:p-4'>
							<h3 className='text-lg font-bold mb-4 text-white flex items-center gap-2'>
								<CheckCircle className='w-5 h-5 text-green-400' />
								Benefits
							</h3>
							<ul className='space-y-3 lg:space-y-2'>
								<li className='flex items-start text-white text-sm'>
									<CheckCircle className='w-4 h-4 mr-3 text-green-400 mt-0.5 flex-shrink-0' />
									<span>Verified badge on listings</span>
								</li>
								<li className='flex items-start text-white text-sm'>
									<CheckCircle className='w-4 h-4 mr-3 text-green-400 mt-0.5 flex-shrink-0' />
									<span>Higher trust score visibility</span>
								</li>
								<li className='flex items-start text-white text-sm'>
									<CheckCircle className='w-4 h-4 mr-3 text-green-400 mt-0.5 flex-shrink-0' />
									<span>Faster buyer confidence</span>
								</li>
							</ul>
						</div>
					</motion.div>
				</div>

				{/* Learn More Section */}
				<motion.div
					className='text-center lg:mt-1'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.4 }}
				>
					<motion.div
						className='inline-flex items-center justify-center gap-2 text-accent-400 hover:text-accent-300 font-medium transition duration-300'
						whileHover={{ x: 5 }}
					>
						<Link to='/learn-what-we-collect' className='inline-flex items-center gap-2'>
							<Shield className='w-5 h-5' />
							<span>Learn what we collect</span>
						</Link>
					</motion.div>
				</motion.div>
			</div>

			{showVerificationForm && (
				<VerificationForm
					onClose={() => setShowVerificationForm(false)}
					onSubmitted={() => setVerificationStatus("pending")}
				/>
			)}
		</div>
	);
};

export default VerifiedSellerPage;
