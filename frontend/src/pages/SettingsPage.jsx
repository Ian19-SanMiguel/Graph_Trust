import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, FileText, ShieldCheck, Share2, Smartphone, X } from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";

const settingsItems = [
	{ id: "about", label: "About App", icon: Smartphone },
	{ id: "terms", label: "Terms & Conditions", icon: FileText },
	{ id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
	{ id: "share", label: "Share This App", icon: Share2 },
];

const settingsCardContent = {
	about: {
		title: "About the Website",
		pages: [
			`The Barangay St. Joseph Daycare Enrollment Management System is a web-based platform designed to help the barangay daycare center handle enrollment faster and more organized. It allows parents/guardians to submit applications online, upload required documents, and track enrollment status without needing to visit the office multiple times. For staff, the system provides tools to review applications, record screening notes, assign learners to sections based on age and capacity, and generate reports for monitoring and recordkeeping.

Key Features:

Online Enrollment: Parents/guardians can fill out learner and guardian details and submit applications digitally.
Requirements Upload: Upload scanned documents (birth certificate, immunization card, barangay clearance) with a checklist to track missing files.
Status Tracking: View application status (Pending, Approved, Waitlisted, Rejected) with updates from the daycare office.
Screening Support: Staff can record health concerns, residency confirmation, and other eligibility notes in one place.
Section Management: Create sections, set capacity, assign teachers, and place learners manually or automatically based on rules.
Reports and Printing: Generate printable forms, masterlists per section, summaries by age/sex/purok, and export to PDF/Excel.
Security and Privacy: Role-based access, activity logs, and data privacy consent to protect sensitive information.

This website improves the enrollment process by reducing paperwork, avoiding duplicate records, and making updates easier for both parents and barangay daycare staff.`,
		],
	},
	terms: {
		title: "Terms & Condition",
		pages: [
			`Introduction
Welcome to the Barangay. St. Joseph Daycare Enrollment Management System. By using this system, you agree to these Terms and Conditions. If you do not agree, please cease to use the system.

1. User Responsibilities
- Users must provide complete, accurate, and updated information during registration and enrollment.
- Parents/Guardians are responsible for ensuring that the learner's details and uploaded documents are true and valid. Any attempt to submit false information, fake documents, or misuse the system may result in application rejection and account suspension.

2. Enrollment Application and Requirements
- All enrollment applications are subject to review and verification by authorized barangay daycare staff.
- Submission of an application does not guarantee approval. Required documents (e.g., birth certificate, immunization card, barangay clearance) must be submitted within the announced enrollment period.
- Incomplete requirements may result in a Pending, Waitlisted, or Rejected status.

3. Screening and Eligibility
- The daycare may conduct screening based on barangay policies, capacity limits, age rules per level, and other eligibility criteria (e.g., barangay residency and other priority considerations if applicable).
- The system's section assignment or recommendations are based on encoded rules and available slots, but final placement may still be decided by authorized staff.

4. Section Capacity and Waitlisting
- Each section has a limited capacity. If slots are full, the application may be placed on a waitlist. Waitlisted applicants may be approved if slots become available or if adjustments are made by the daycare office.
- The barangay daycare office has the right to manage section assignments to maintain fair distribution and compliance with policies.

5. Data Privacy and Consent
- Personal information collected through the system is used only for enrollment processing, daycare records, reporting, and official barangay daycare operations.
- By submitting an application, you provide your consent for the barangay daycare office to collect, store, and process your data in accordance with the Data Privacy Act of 2012 (RA 10173). Access to sensitive data is limited and protected through role-based access controls.`,
			`6. Security and Account Access
- Users must keep their login credentials confidential and must not share accounts with others. The system may implement security measures such as strong password rules and activity logging to protect records. Users are responsible for any activity done using their account.

7. System Availability and Maintenance
- The barangay may perform system updates, backups, or maintenance that may cause temporary downtime. The barangay is not liable for delays caused by technical issues, internet connectivity problems, or device limitations.

8. Limitation of Liability
- The system serves as a digital platform for enrollment processing and record management. The barangay daycare office is not liable for losses caused by incorrect data submitted by users, unauthorized access due to user negligence, or delays caused by incomplete requirements. Final decisions regarding enrollment approval and section assignment remain under the barangay daycare office.

9. Changes to Terms
- The barangay daycare office may update these Terms and Conditions when needed. Continued use of the system means you accept the updated terms.

10. Contact Information
- For inquiries, corrections, or support, contact the Barangay St. Joseph Daycare Office through the official barangay contact channels.`,
		],
	},
	privacy: {
		title: "Privacy Policy",
		pages: [
			`Welcome to the Barangay. St. Joseph Daycare Enrollment Management System. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use the website and its services.

1. Information We Collect
We may collect the following types of data:
- Parent/Guardian Information: Name, contact number, email (if provided), address, and relationship to the learner.
- Learner Information: Full name, sex, birthdate, age, address, and barangay zone/purok.
- Emergency Contact Information: Name and contact details.
- Uploaded Requirements: Scanned documents such as birth certificate, immunization card, and barangay clearance.
- Application Data: Enrollment status (Pending/Approved/Waitlisted/Rejected), screening notes, and section assignment.
- System Logs: Activity records such as user actions, date/time, and changes made for auditing and security.

2. How We Use Your Information
Your information is used to:
- Process and verify daycare enrollment applications.
- Validate requirements and eligibility based on barangay daycare policies.
- Assign learners to appropriate sections based on age rules and capacity.
- Generate reports and printable documents for official daycare records.
- Communicate updates about enrollment status and missing requirements.
- Maintain system security, prevent misuse, and support audit and troubleshooting.

3. Data Sharing and Disclosure
We do not sell or share personal information with unauthorized parties. Data may only be accessed by authorized personnel based on role:
- Staff can access data needed for enrollment processing.
- Parents/Guardians can only access their own child's application.
- Admin (Web Developer) may access technical logs for maintenance and security purposes.
- Information may be disclosed only when required by law or official government directives.`,
			`4. Data Storage and Protection
We protect data through:
- Role-based access control and limited permissions.
- Strong password rules and secure login measures (including MFA if enabled).
- Activity logs to track changes and prevent unauthorized actions.
- Secure backups and controlled restore procedures.
- Uploaded documents and records are stored only for official daycare enrollment and recordkeeping.

5. Data Retention
Records are kept only as long as necessary for daycare operations, reporting, and legal or barangay requirements. When data is no longer needed, it will be securely deleted or archived according to official policy.

6. Your Rights as a Data Subject
You may request to:
- Review your submitted information.
- Correct inaccurate or outdated details.
- Ask about how your data is being used.
- Requests are subject to verification to protect learner privacy.

7. Consent
By using the system and submitting an application, you agree to the collection and processing of your information for enrollment purposes. The system may include a consent checkbox to confirm agreement in compliance with the Data Privacy Act of 2012 (RA 10173).

8. Changes to This Privacy Policy
We may update this Privacy Policy when needed. Updates will be reflected on the website, and continued use of the system means you accept the revised policy.

9. Contact Information
For privacy concerns, corrections, or data requests, contact the Barangay St. Joseph Daycare Office through official barangay communication channels.`,
		],
	},
};

const SettingsPage = () => {
	const { logout, checkAuth, user } = useUserStore();
	const [mfaEnabled, setMfaEnabled] = useState(Boolean(user?.mfaEnabled));
	const [mfaLoading, setMfaLoading] = useState(false);
	const [mfaSetupData, setMfaSetupData] = useState(null);
	const [enableCode, setEnableCode] = useState("");
	const [disableCode, setDisableCode] = useState("");
	const [activeCardId, setActiveCardId] = useState("");
	const [activeCardPage, setActiveCardPage] = useState(0);

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

		if (settingsCardContent[itemId]) {
			setActiveCardId(itemId);
			setActiveCardPage(0);
			return;
		}

		toast("This option is not available yet");
	};

	const closeSettingsCard = () => {
		setActiveCardId("");
		setActiveCardPage(0);
	};

	const activeCard = settingsCardContent[activeCardId] || null;
	const activePages = activeCard?.pages || [];
	const totalPages = activePages.length;
	const canGoNextPage = activeCardPage < totalPages - 1;

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
			{activeCard && (
				<div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] p-3 sm:p-6'>
					<div className='mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-600 bg-[#222552] text-white'>
						<div className='flex items-center justify-between border-b border-gray-600 px-4 py-3 sm:px-6'>
							<h2 className='text-2xl font-bold'>{activeCard.title}</h2>
							<button
								type='button'
								onClick={closeSettingsCard}
								className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 transition hover:bg-gray-200'
								aria-label='Close info card'
							>
								<X size={20} />
							</button>
						</div>

						<div className='flex-1 overflow-y-auto px-4 py-4 sm:px-6'>
							<div className='whitespace-pre-wrap text-sm leading-relaxed sm:text-base'>{activePages[activeCardPage]}</div>
						</div>

						<div className='flex items-center justify-between border-t border-gray-600 px-4 py-3 sm:px-6'>
							<div className='text-xs text-gray-300'>
								{totalPages > 1 ? `Page ${activeCardPage + 1} of ${totalPages}` : "Single page"}
							</div>
							<div className='flex items-center gap-2'>
								{canGoNextPage && (
									<button
										type='button'
										onClick={() => setActiveCardPage((prev) => prev + 1)}
										className='inline-flex items-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-600'
									>
										Next
										<ChevronRight size={16} />
									</button>
								)}
								<button
									type='button'
									onClick={closeSettingsCard}
									className='rounded-md bg-accent-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-500'
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

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