import { motion } from "framer-motion";
import { ChevronRight, FileCheck, Shield } from "lucide-react";
import { useState } from "react";

const faqPages = [
	[
		{
			question: "1) Why do I need KYC?",
			answer:
				"KYC helps confirm real identities. It reduces fake accounts, scams, and repeat offenders. Verified sellers also get a badge and higher trust visibility.",
		},
		{
			question: "2) How long does verification take?",
			answer:
				"Submitting requirements takes around 3–5 minutes. Review time depends on volume, but most checks finish within 24–48 hours.",
		},
		{
			question: "3) What affects my trust score?",
			answer:
				"Your score is based on KYC status, transaction behavior, dispute outcomes, and risk signals from linked activity patterns.",
		},
		{
			question: "4) Can I use GraphTrust without verification?",
			answer:
				"Yes. You can browse listings without verification. To sell, message, and complete transactions, verification may be required depending on platform rules.",
		},
		{
			question: "5) How do I report suspicious activity?",
			answer:
				"Open the listing or user profile, tap Report, select a reason, add details, and upload screenshots if needed. Our team reviews reports and may restrict confirmed violations.",
		},
		{
			question: "6) What documents are required for KYC?",
			answer:
				"A valid government ID and a clear selfie are required. Some cases may need an additional check if the photo is blurry or details don’t match.",
		},
	],
	[
		{
			question: "7) What types of ID are accepted?",
			answer: "Usually National ID, Driver’s License, Passport, and other government-issued IDs.",
		},
		{
			question: "8) Will my personal data be safe?",
			answer:
				"Yes. Uploaded documents are encrypted, access is limited, and data is used only for verification and fraud prevention.",
		},
		{
			question: "9) Why is my verification marked ‘Pending’?",
			answer:
				"Your submission is waiting for review. This can happen during high volume or if extra checks are needed.",
		},
		{
			question: "10) What happens if my verification is rejected?",
			answer: "You’ll see the reason and can fix the issue, then resubmit.",
		},
		{
			question: "11) Can my trust score go down?",
			answer:
				"Yes. It may decrease if there are repeated disputes, confirmed reports, suspicious linked activity, or unusual behavior patterns.",
		},
		{
			question: "12) Can I improve my trust score?",
			answer:
				"Yes. Complete KYC, keep successful transactions, respond clearly to buyers, avoid suspicious patterns, and resolve issues quickly.",
		},
	],
];

const HowItWorksPage = () => {
	const [faqPageIndex, setFaqPageIndex] = useState(0);
	const isOnFirstFaqPage = faqPageIndex === 0;
	const isOnLastFaqPage = faqPageIndex === faqPages.length - 1;

	const handleNextFaqPage = () => {
		setFaqPageIndex((current) => Math.min(current + 1, faqPages.length - 1));
	};

	const handlePreviousFaqPage = () => {
		setFaqPageIndex((current) => Math.max(current - 1, 0));
	};

	return (
		<div className='relative min-h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)] text-white overflow-hidden'>
			<div className='relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-3 h-full flex flex-col'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className='mb-2'
				>
					<h1 className='text-3xl sm:text-4xl font-bold mb-1 text-accent-400'>How GraphTrust Works</h1>
					<p className='text-gray-200/90 max-w-3xl text-sm'>
						KYC + graph-based fraud detection + trust scoring are used together to make buying and selling safer.
					</p>
				</motion.div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-2 mb-2'>
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
					>
						<div className='bg-gray-800/50 border border-gray-700 rounded-2xl p-3.5 h-full'>
							<div className='flex items-center gap-2.5 mb-2.5'>
								<Shield className='w-5 h-5 text-accent-400' />
								<h2 className='text-2xl font-bold'>Trust Foundation</h2>
							</div>
							<p className='text-gray-300 text-sm leading-relaxed'>
								Identity checks, fraud signals, and trust scoring work as one system to protect users.
							</p>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className='bg-gray-800/50 border border-gray-700 rounded-2xl p-3.5 flex flex-col justify-center'
					>
						<p className='text-sm text-gray-200 leading-relaxed'>
							<span className='font-semibold text-accent-400'>For Buyers:</span> Browse safely, check trust score, and report scams.
						</p>
						<p className='text-sm text-gray-200 leading-relaxed mt-2'>
							<span className='font-semibold text-accent-400'>For Sellers:</span> Get verified, build trust, and avoid risky behavior.
						</p>
					</motion.div>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-2 mb-2'>
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.15 }}
					>
						<div className='bg-gray-800/50 border border-gray-700 rounded-2xl p-3.5 h-full'>
							<h2 className='text-xl font-bold mb-2'>Step-by-step Process</h2>
							<ul className='space-y-1 text-gray-200 text-sm list-disc pl-5'>
								<li><span className='font-semibold'>Create Account:</span> Sign up to buy, sell, and message.</li>
								<li><span className='font-semibold'>Verify Identity (KYC):</span> Submit ID and selfie for a verified badge.</li>
								<li><span className='font-semibold'>Graph Fraud Detection:</span> Detect suspicious links between accounts.</li>
								<li><span className='font-semibold'>Trust Scoring:</span> Profiles and listings display trust score and risk level.</li>
							</ul>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.25 }}
						className='bg-gray-800/50 border border-gray-700 rounded-2xl p-3.5'
					>
						<div className='flex items-center gap-2 mb-2'>
							<FileCheck className='w-5 h-5 text-accent-400' />
							<h2 className='text-xl font-bold'>Safety Features</h2>
						</div>
						<ul className='space-y-1 text-gray-200 text-sm'>
							<li><span className='font-semibold'>Verified badges:</span> Help buyers identify trusted sellers quickly.</li>
							<li><span className='font-semibold'>Scam reporting and moderation:</span> Reports are reviewed and acted on.</li>
							<li><span className='font-semibold'>Secure messaging and audit logs:</span> Interactions remain safer and traceable.</li>
						</ul>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className='relative bg-gray-800/50 border border-gray-700 rounded-2xl p-3.5 pb-12 flex-1 min-h-0 overflow-hidden'
				>
					<h2 className='text-xl font-bold mb-2 text-center'>Frequently Asked Question (FAQ)</h2>
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-200'>
						<div className='space-y-2'>
							{faqPages[faqPageIndex].slice(0, 3).map((faqItem) => (
								<div key={faqItem.question}>
									<p className='font-semibold text-white'>{faqItem.question}</p>
									<p className='text-gray-300 leading-snug'>{faqItem.answer}</p>
								</div>
							))}
						</div>
						<div className='space-y-2'>
							{faqPages[faqPageIndex].slice(3).map((faqItem) => (
								<div key={faqItem.question}>
									<p className='font-semibold text-white'>{faqItem.question}</p>
									<p className='text-gray-300 leading-snug'>{faqItem.answer}</p>
								</div>
							))}
						</div>
					</div>

					{!isOnFirstFaqPage && (
						<button
							type='button'
							onClick={handlePreviousFaqPage}
							className='absolute bottom-2.5 left-2.5 z-10 rounded-full bg-gray-900/80 border border-gray-600 p-1.5 text-accent-300 hover:text-accent-200 hover:border-accent-300 transition'
							aria-label='Previous FAQ page'
						>
							<ChevronRight size={22} className='rotate-180' />
						</button>
					)}

					{!isOnLastFaqPage && (
						<button
							type='button'
							onClick={handleNextFaqPage}
							className='absolute bottom-2.5 right-2.5 z-10 rounded-full bg-gray-900/80 border border-gray-600 p-1.5 text-accent-300 hover:text-accent-200 hover:border-accent-300 transition'
							aria-label='Next FAQ page'
						>
							<ChevronRight size={22} />
						</button>
					)}
				</motion.div>
			</div>
		</div>
	);
};

export default HowItWorksPage;
