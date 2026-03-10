import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../lib/axios";

const statusBadgeClass = {
	open: "bg-yellow-600/20 text-yellow-300 border-yellow-500/40",
	resolved: "bg-green-600/20 text-green-300 border-green-500/40",
	dismissed: "bg-red-600/20 text-red-300 border-red-500/40",
};

const formatTimestamp = (value) => {
	if (!value) return "-";
	if (typeof value?.seconds === "number") {
		return new Date(value.seconds * 1000).toLocaleString();
	}
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed.toLocaleString();
		}
	}
	if (typeof value?.toDate === "function") {
		return value.toDate().toLocaleString();
	}
	return "-";
};

const ReportsTab = () => {
	const [reports, setReports] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("open");
	const [processingReportId, setProcessingReportId] = useState("");

	const loadReports = async () => {
		try {
			setLoading(true);
			const response = await axios.get(`/reports?status=${statusFilter}`);
			setReports(response.data?.reports || []);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to load reports");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadReports();
	}, [statusFilter]);

	const updateStatus = async (reportId, status) => {
		if (!reportId || processingReportId) return;

		try {
			setProcessingReportId(reportId);
			await axios.patch(`/reports/${reportId}/status`, { status });
			toast.success(`Report marked as ${status}`);
			await loadReports();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update report");
		} finally {
			setProcessingReportId("");
		}
	};

	if (loading) {
		return <div className='rounded-lg bg-gray-800/60 p-6 text-gray-300'>Loading reports...</div>;
	}

	return (
		<motion.div
			className='mx-auto max-w-6xl rounded-lg bg-gray-800/60 p-6 shadow-lg'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
				<h2 className='text-2xl font-semibold text-accent-300'>User Reports</h2>
				<div className='flex items-center gap-2'>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200'
					>
						<option value='open'>Open</option>
						<option value='resolved'>Resolved</option>
						<option value='dismissed'>Dismissed</option>
						<option value='all'>All</option>
					</select>
					<button
						type='button'
						onClick={loadReports}
						className='inline-flex items-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600'
					>
						<RefreshCw size={15} /> Refresh
					</button>
				</div>
			</div>

			{reports.length === 0 ? (
				<div className='rounded-md border border-gray-700 bg-gray-900/30 p-5 text-sm text-gray-300'>
					No reports found for this filter.
				</div>
			) : (
				<div className='space-y-4'>
					{reports.map((report) => (
						<div key={report._id} className='rounded-lg border border-gray-700 bg-gray-900/40 p-4'>
							<div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start'>
								<div className='min-w-0'>
									<div className='mb-2 flex items-center gap-2'>
										<span className='rounded bg-gray-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-200'>
											{report.targetType}
										</span>
										<span className={`rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] ${statusBadgeClass[report.status] || "bg-gray-700 text-gray-200 border-gray-600"}`}>
											{report.status}
										</span>
									</div>
									<p className='text-sm font-semibold text-white'>
										Target: {report.targetName || "Unknown"}
									</p>
									<p className='truncate text-xs text-gray-400'>
										Target ID: {report.targetId}
									</p>
									<p className='truncate text-xs text-gray-400'>
										Reporter ID: {report.reporterId}
									</p>
									<p className='mt-2 break-words text-xs text-gray-300'>
										Reasons: {(report.reasons || []).join(", ") || "-"}
									</p>
									<p className='mt-1 text-[11px] text-gray-500'>
										Submitted: {formatTimestamp(report.createdAt)}
									</p>
								</div>
								<div className='flex flex-wrap items-center justify-start gap-2 md:justify-end'>
									<button
										type='button'
										onClick={() => updateStatus(report._id, "open")}
										disabled={processingReportId === report._id}
										className='inline-flex items-center gap-1 rounded-md bg-yellow-600 px-3 py-2 text-xs font-semibold text-white hover:bg-yellow-500 disabled:opacity-60'
									>
										<Clock3 size={14} /> Open
									</button>
									<button
										type='button'
										onClick={() => updateStatus(report._id, "resolved")}
										disabled={processingReportId === report._id}
										className='inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-60'
									>
										<CheckCircle2 size={14} /> Resolve
									</button>
									<button
										type='button'
										onClick={() => updateStatus(report._id, "dismissed")}
										disabled={processingReportId === report._id}
										className='inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60'
									>
										<XCircle size={14} /> Dismiss
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</motion.div>
	);
};

export default ReportsTab;
