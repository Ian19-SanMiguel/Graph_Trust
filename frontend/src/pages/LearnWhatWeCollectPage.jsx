import { motion } from "framer-motion";
import { Shield, Lock, Database } from "lucide-react";

const LearnWhatWeCollectPage = () => {
	return (
		<div className='relative text-white'>
			<div className='relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className='mb-6'
				>
					<h1 className='text-4xl sm:text-5xl lg:text-4xl font-bold mb-2 text-accent-400'>Learn What We Collect</h1>
					<p className='text-gray-300 max-w-3xl'>
						We collect only what is needed for identity verification and fraud prevention. Your data is encrypted and
						access is limited.
					</p>
				</motion.div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className='bg-gray-800/50 border border-gray-700 rounded-2xl p-6'
					>
						<div className='flex items-center gap-3 mb-3'>
							<Shield className='w-6 h-6 text-accent-400' />
							<h2 className='text-2xl font-bold'>Privacy First</h2>
						</div>
						<p className='text-gray-300'>
							Verification data is used only for KYC review and account safety. Access is restricted and audited.
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.15 }}
						className='bg-gray-800/50 border border-gray-700 rounded-2xl p-6'
					>
						<div className='flex items-center gap-2 mb-3'>
							<Lock className='w-5 h-5 text-accent-400' />
							<h2 className='text-2xl font-bold'>How We Protect It</h2>
						</div>
						<ul className='space-y-2 text-gray-200 list-disc pl-5'>
							<li>Encryption in transit and at rest</li>
							<li>Limited staff access with audit logs</li>
							<li>Monitoring for suspicious access attempts</li>
						</ul>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className='bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-4'
				>
					<div className='flex items-center gap-2 mb-4'>
						<Database className='w-5 h-5 text-accent-400' />
						<h2 className='text-2xl font-bold'>What We Collect</h2>
					</div>
					<ul className='space-y-2 text-gray-200 list-disc pl-5'>
						<li>Account details: name, email, username, and phone number</li>
						<li>Identity details: full name, birthday, nationality, and address</li>
						<li>Government ID image and selfie for identity verification</li>
						<li>Verification metadata like submission time and status</li>
					</ul>
				</motion.div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.25 }}
						className='bg-gray-800/50 border border-gray-700 rounded-2xl p-6'
					>
						<h2 className='text-2xl font-bold mb-4'>What We Do Not Collect</h2>
						<ul className='space-y-2 text-gray-200 list-disc pl-5'>
							<li>Payment card numbers for identity verification</li>
							<li>Biometric templates beyond selfie review</li>
							<li>Precise real-time GPS tracking for KYC</li>
						</ul>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
						className='bg-gray-800/50 border border-gray-700 rounded-2xl p-6'
					>
						<h2 className='text-2xl font-bold mb-4'>How Long We Keep It</h2>
						<ul className='space-y-2 text-gray-200 list-disc pl-5'>
							<li>We retain verification data only as long as required for compliance and security.</li>
							<li>You can request deletion of account-related data where legally allowed.</li>
						</ul>
					</motion.div>
				</div>

				<p className='mt-6 text-center text-sm text-gray-400'>For full details, see our Privacy Policy.</p>
			</div>
		</div>
	);
};

export default LearnWhatWeCollectPage;