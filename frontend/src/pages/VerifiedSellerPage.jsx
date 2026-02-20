import { CheckCircle, Shield, Zap, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import VerificationForm from "../components/VerificationForm";

const VerifiedSellerPage = () => {
	const [showVerificationForm, setShowVerificationForm] = useState(false);
	return (
		<div className='min-h-screen bg-gray-900 text-white overflow-hidden'>
			{/* Background gradient */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute inset-0'>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1)_0%,rgba(143,91,255,0.2)_45%,rgba(195,198,255,0.3)_100%)]' />
				</div>
			</div>

			<div className='relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				{/* Header Section */}
				<motion.div
					className='mb-12'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<h1 className='text-4xl sm:text-5xl font-bold mb-2' style={{ color: '#8F5BFF' }}>
						Get Verified
					</h1>
					<p className='text-gray-300'>
						Complete KYC to earn a verified badge and higher trust score
					</p>
				</motion.div>

				{/* Main Content - Grid with Badge + Verification Card */}
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12'>
					{/* Left Sidebar - Badge Info */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className='lg:col-span-1'
					>
						<div className='bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6 text-white'>
							<CheckCircle className='w-16 h-16 mb-3' />
							<h3 className='text-lg font-bold mb-2'>Verified Seller Badge</h3>
							<p className='text-sm mb-4'>Stand out and build trust with buyers</p>
							<div className='bg-white bg-opacity-20 rounded-lg p-3 mb-3'>
								<p className='text-xs font-semibold text-center'>After approval</p>
							</div>
							<p className='text-xs opacity-75 text-center'>Your badge will appear on all listings</p>
						</div>
					</motion.div>

					{/* Center - Main Verification Card */}
					<motion.div
						className='lg:col-span-2 flex justify-center'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						<div className='w-full max-w-md'>
						<div className='bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-8 relative'>
								{/* PENDING Stamp */}
								<div className='absolute top-6 right-6 transform rotate-12'>
								<div className='border-4 border-accent-400 text-accent-400 px-3 py-1 rounded text-lg font-bold'>
										PENDING
									</div>
								</div>

								{/* Steps */}
								<div className='space-y-6'>
									<div className='grid grid-cols-4 gap-2 mb-8'>
										{['Info', 'Upload', 'Selfie', 'Review'].map((step, idx) => (
											<div key={idx} className='text-center'>
												<motion.div
													className='bg-white bg-opacity-30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-lg font-bold text-white border-2 border-white border-opacity-50'
													whileHover={{ scale: 1.1 }}
												>
													{idx + 1}
												</motion.div>
												<p className='text-xs font-semibold text-white'>{step}</p>
											</div>
										))}
									</div>

									<p className='text-center text-sm text-white mb-8'>
										Takes 3-5 minutes. You'll get a Verified badge after approval
									</p>

									<motion.button
										onClick={() => setShowVerificationForm(true)}
										className='w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition duration-300'
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
									>
										Start Verification
									</motion.button>
								</div>
							</div>

							<p className='text-center text-xs text-gray-400 mt-4'>
								Verification takes about a few minutes. You'll get a Verified badge after approval.
							</p>
						</div>
					</motion.div>

					{/* Right Empty Space */}
					<div className='lg:col-span-1'></div>
				</div>

				{/* Requirements and Benefits - Bottom Section */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-12'>
					{/* Requirements */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<div className='bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6'>
							<h3 className='text-lg font-bold mb-4 text-white'>Requirements</h3>
							<p className='text-white text-sm mb-4 font-semibold'>Prepare:</p>
							<ul className='space-y-2 mb-4'>
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
						<div className='bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6'>
							<h3 className='text-lg font-bold mb-4 text-white flex items-center gap-2'>
								<CheckCircle className='w-5 h-5 text-green-400' />
								Benefits
							</h3>
							<ul className='space-y-3'>
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
					className='text-center'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.4 }}
				>
					<motion.button
						className='inline-flex items-center justify-center gap-2 text-accent-400 hover:text-accent-300 font-medium transition duration-300'
						whileHover={{ x: 5 }}
					>
						<Shield className='w-5 h-5' />
						<span>Learn what we collect</span>
					</motion.button>
				</motion.div>
			</div>

			{showVerificationForm && (
				<VerificationForm onClose={() => setShowVerificationForm(false)} />
			)}
		</div>
	);
};

export default VerifiedSellerPage;
