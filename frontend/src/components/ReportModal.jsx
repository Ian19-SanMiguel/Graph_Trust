import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const REPORT_REASONS = [
	"harassment",
	"hate",
	"scam",
	"copyright",
	"impersonation",
	"Off-platform payment",
	"Counterfeit",
	"Trademark Violation",
	"Mass posting",
	"Duplicate images",
	"Misleading",
	"Other",
];

const REPORT_REASON_ROWS = [
	REPORT_REASONS.slice(0, 5),
	REPORT_REASONS.slice(5, 8),
	REPORT_REASONS.slice(8),
];

const ReportModal = ({
	title = "Report",
	description = "Thanks for looking out for yourself and your fellow shoppers by reporting things that break the rules. Let us know what's happening, and we'll look into it.",
	onClose,
	onSubmit,
}) => {
	const [selectedReasons, setSelectedReasons] = useState([]);
	const [otherReasonText, setOtherReasonText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const isOtherSelected = selectedReasons.includes("Other");

	const canSubmit = useMemo(() => {
		if (!selectedReasons.length || submitting) return false;
		if (isOtherSelected && !otherReasonText.trim()) return false;
		return true;
	}, [selectedReasons.length, submitting, isOtherSelected, otherReasonText]);

	const toggleReason = (reason) => {
		setSelectedReasons((prev) =>
			prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason]
		);
	};

	const handleSubmit = async () => {
		if (!selectedReasons.length) {
			toast.error("Please select at least one reason");
			return;
		}

		if (isOtherSelected && !otherReasonText.trim()) {
			toast.error("Please enter details for Other");
			return;
		}

		const finalReasons = selectedReasons.map((reason) => {
			if (reason !== "Other") return reason;
			return `Other: ${otherReasonText.trim()}`;
		});

		setSubmitting(true);
		try {
			await onSubmit?.(finalReasons);
			onClose?.();
		} catch (error) {
			toast.error(error?.response?.data?.message || "Failed to submit report");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className='fixed inset-0 z-[100] bg-black/55 flex items-center justify-center p-4'>
			<div className='w-full max-w-[420px] rounded-3xl overflow-hidden bg-white text-black shadow-2xl'>
				<div className='border-b border-gray-300 px-6 py-3 text-center text-3xl font-semibold'>{title}</div>
				<div className='px-6 py-4'>
					<p className='text-sm leading-5 text-gray-800'>{description}</p>

					<div className='mt-3 space-y-1.5'>
						{REPORT_REASON_ROWS.map((row, rowIndex) => (
							<div
								key={`row-${rowIndex}`}
								className='flex w-full items-center justify-between gap-1'
							>
								{row.map((reason) => {
									const active = selectedReasons.includes(reason);
									const reasonPaddingClass =
										reason === "impersonation" || reason === "harassment"
											? "px-2.5"
											: reason === "scam" || reason === "copyright"
											? "px-3"
											: reason === "Duplicate images"
												? "px-3"
												: "px-4";
									return (
										<button
											key={reason}
											type='button'
											onClick={() => toggleReason(reason)}
											className={`rounded-full ${reasonPaddingClass} py-1.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${
												active
													? "bg-accent-700 text-white"
													: "bg-accent-500 text-white hover:bg-accent-600"
											}`}
										>
											{reason}
										</button>
									);
								})}
							</div>
						))}
					</div>

					{isOtherSelected && (
						<div className='mt-3'>
							<input
								type='text'
								value={otherReasonText}
								onChange={(e) => setOtherReasonText(e.target.value)}
								placeholder='Please specify'
								maxLength={120}
								className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-accent-500'
							/>
						</div>
					)}

					<div className='mt-4 flex justify-center gap-3'>
						<button
							type='button'
							onClick={onClose}
							className='rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100'
						>
							Cancel
						</button>
						<button
							type='button'
							onClick={handleSubmit}
							disabled={!canSubmit}
							className='rounded-lg bg-accent-600 px-7 py-1.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60'
						>
							{submitting ? "Submitting..." : "SUBMIT"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ReportModal;
