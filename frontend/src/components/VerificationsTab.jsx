import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, RefreshCw, X, XCircle } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const VerificationsTab = () => {
	const [verifications, setVerifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [processingUserId, setProcessingUserId] = useState("");
	const [previewAsset, setPreviewAsset] = useState(null);

	const fetchVerifications = async () => {
		try {
			setLoading(true);
			const response = await axios.get("/verifications?status=pending");
			setVerifications(response.data?.verifications || []);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to load verification requests");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchVerifications();
	}, []);

	const updateStatus = async (userId, status) => {
		if (processingUserId) return;

		try {
			setProcessingUserId(userId);
			await axios.patch(`/verifications/${userId}/status`, { status });
			toast.success(`Verification ${status}`);
			setVerifications((current) => current.filter((item) => item.userId !== userId));
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update verification status");
		} finally {
			setProcessingUserId("");
		}
	};

	const isPdfAsset = (url) => /\.pdf($|\?)/i.test(url || "");

	if (loading) {
		return (
			<div className='bg-gray-800/60 rounded-lg p-6 text-gray-300'>
				Loading verification requests...
			</div>
		);
	}

	return (
		<>
			<motion.div
				className='bg-gray-800/60 rounded-lg p-6 shadow-lg max-w-6xl mx-auto'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
			<div className='flex items-center justify-between mb-6'>
				<h2 className='text-2xl font-semibold text-accent-300'>Verification Requests</h2>
				<button
					onClick={fetchVerifications}
					className='inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md'
				>
					<RefreshCw size={16} />
					Refresh
				</button>
			</div>

			{verifications.length === 0 ? (
				<div className='text-gray-300 text-sm'>No pending verification requests.</div>
			) : (
				<div className='space-y-4'>
					{verifications.map((verification) => (
						<div
							key={verification._id}
							className='border border-gray-700 rounded-lg p-4 bg-gray-900/40'
						>
							<div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
								<div>
									<p className='text-white font-semibold'>
										{[verification.firstName, verification.middleName, verification.lastName, verification.suffix]
											.filter(Boolean)
											.join(" ")}
									</p>
									<p className='text-sm text-gray-300'>User ID: {verification.userId}</p>
									<p className='text-sm text-gray-300'>Nationality: {verification.nationality}</p>
									<p className='text-sm text-gray-300'>Contact: +63 {verification.contactNumber}</p>
									<p className='text-sm text-gray-300'>Address: {verification.address}</p>
									<div className='flex gap-4 mt-2'>
										<button
											type='button'
											onClick={() =>
												setPreviewAsset({
													title: 'Government ID',
													url: verification.governmentIdUrl,
												})
											}
											className='text-accent-400 hover:text-accent-300 text-sm'
										>
											View Government ID
										</button>
										<button
											type='button'
											onClick={() =>
												setPreviewAsset({
													title: 'Selfie',
													url: verification.selfieUrl,
												})
											}
											className='text-accent-400 hover:text-accent-300 text-sm'
										>
											View Selfie
										</button>
									</div>
								</div>

								<div className='flex items-center gap-2'>
									<button
										onClick={() => updateStatus(verification.userId, "approved")}
										disabled={processingUserId === verification.userId}
										className='inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white px-3 py-2 rounded-md'
									>
										<CheckCircle2 size={16} />
										Approve
									</button>
									<button
										onClick={() => updateStatus(verification.userId, "rejected")}
										disabled={processingUserId === verification.userId}
										className='inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white px-3 py-2 rounded-md'
									>
										<XCircle size={16} />
										Reject
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
			</motion.div>

			{previewAsset && (
				<div className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4'>
					<div className='w-full max-w-5xl bg-gray-900 border border-gray-700 rounded-xl overflow-hidden'>
						<div className='flex items-center justify-between px-4 py-3 border-b border-gray-700'>
							<h3 className='text-white font-semibold'>{previewAsset.title}</h3>
							<button
								type='button'
								onClick={() => setPreviewAsset(null)}
								className='text-gray-300 hover:text-white'
							>
								<X size={18} />
							</button>
						</div>

						<div className='h-[70vh] bg-black/30 flex items-center justify-center'>
							{isPdfAsset(previewAsset.url) ? (
								<iframe
									title={previewAsset.title}
									src={previewAsset.url}
									className='w-full h-full border-0'
								/>
							) : (
								<img
									src={previewAsset.url}
									alt={previewAsset.title}
									className='max-h-full max-w-full object-contain'
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default VerificationsTab;
