import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const VerificationForm = ({ onClose }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [formData, setFormData] = useState({
		firstName: '',
		middleName: '',
		lastName: '',
		suffix: '',
		dateOfBirth: '',
		sex: '',
		nationality: '',
		address: '',
		contactNumber: '',
		uploadedDocs: null,
		selfieImage: null,
	});

	const steps = ['Info', 'Upload', 'Selfie', 'Review'];

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const handleSubmit = () => {
		console.log('Submitting verification with data:', formData);
		// Here you would submit to backend
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				// Info Step
				return (
					<div className='space-y-6'>
						<div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									First Name <span className='text-red-500'>*</span>
								</label>
								<input
									type='text'
									name='firstName'
									value={formData.firstName}
									onChange={handleInputChange}
									className='w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none placeholder-gray-300 text-gray-100'
									placeholder='First Name'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Middle Name
								</label>
								<input
									type='text'
									name='middleName'
									value={formData.middleName}
									onChange={handleInputChange}
									className='w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none placeholder-gray-300 text-gray-100'
									placeholder='Middle Name'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Last Name <span className='text-red-500'>*</span>
								</label>
								<input
									type='text'
									name='lastName'
									value={formData.lastName}
									onChange={handleInputChange}
									className='w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none placeholder-gray-300 text-gray-100'
									placeholder='Last Name'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Suffix
								</label>
								<select
									name='suffix'
									value={formData.suffix}
									onChange={handleInputChange}
									className='w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none text-gray-100'
								>
									<option value=''>Select</option>
									<option value='Jr'>Jr</option>
									<option value='Sr'>Sr</option>
									<option value='III'>III</option>
									<option value='IV'>IV</option>
								</select>
							</div>
						</div>

						<div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
							<div className='sm:col-span-2'>
								<label className='block text-sm font-medium text-white mb-2'>
									Date of Birth <span className='text-red-500'>*</span>
								</label>
								<input
									type='date'
									name='dateOfBirth'
									value={formData.dateOfBirth}
									onChange={handleInputChange}
									className='w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none placeholder-gray-300 text-gray-100'
									placeholder='MM/DD/YYYY'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Sex <span className='text-red-500'>*</span>
								</label>
								<select
									name='sex'
									value={formData.sex}
									onChange={handleInputChange}
									className='w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none text-gray-100'
								>
									<option value=''>Select</option>
									<option value='male'>Male</option>
									<option value='female'>Female</option>
									<option value='other'>Other</option>
								</select>
							</div>
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Nationality <span className='text-red-500'>*</span>
								</label>
								<select
									name='nationality'
									value={formData.nationality}
									onChange={handleInputChange}
									className='w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none text-gray-100'
								>
									<option value=''>Select</option>
									<option value='american'>American</option>
									<option value='canadian'>Canadian</option>
									<option value='british'>British</option>
									<option value='other'>Other</option>
								</select>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-white mb-2'>
								Address <span className='text-red-500'>*</span>
							</label>
							<input
								type='text'
								name='address'
								value={formData.address}
								onChange={handleInputChange}
								className='w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none placeholder-gray-300 text-gray-100'
								placeholder='Address'
							/>
						</div>

						<div className='w-full sm:w-1/2'>
							<label className='block text-sm font-medium text-white mb-2'>
								Contact Number <span className='text-red-500'>*</span>
							</label>
							<div className='flex'>
								<select className='px-3 py-2 border border-gray-600 rounded-l-lg bg-gray-800 focus:outline-none text-gray-100'>
									<option>+63</option>
									<option>+1</option>
									<option>+44</option>
								</select>
								<input
									type='text'
									name='contactNumber'
									value={formData.contactNumber}
									onChange={handleInputChange}
									className='flex-1 px-3 py-2 border border-l-0 border-gray-600 rounded-r-lg bg-gray-800 focus:outline-none placeholder-gray-300 text-gray-100'
									placeholder='Phone Number'
								/>
							</div>
						</div>
					</div>
				);

			case 1:
				// Upload Documents Step
				return (
					<div className='space-y-6 py-12 text-center'>
						<h3 className='text-lg font-semibold text-white'>Upload Government ID</h3>
						<div className='border-2 border-dashed border-gray-600 rounded-lg p-8'>
							<p className='text-gray-300 mb-4'>Drag and drop your documents here or click to upload</p>
							<input type='file' className='hidden' />
							<button className='bg-accent-400 hover:bg-accent-300 text-white px-6 py-2 rounded-lg font-semibold'>
								Choose File
							</button>
						</div>
						<p className='text-xs text-gray-400'>Accepted formats: JPG, PNG, PDF (Max 10MB)</p>
					</div>
				);

			case 2:
				// Selfie Step
				return (
					<div className='space-y-6 py-12 text-center'>
						<h3 className='text-lg font-semibold text-white'>Take a Selfie</h3>
						<p className='text-gray-300 mb-4'>Make sure your face is clearly visible and well-lit</p>
						<div className='border-2 border-dashed border-gray-600 rounded-lg p-12'>
							<p className='text-gray-300 mb-4'>Take a photo using your camera</p>
							<button className='bg-accent-400 hover:bg-accent-300 text-white px-6 py-2 rounded-lg font-semibold'>
								Open Camera
							</button>
						</div>
					</div>
				);

			case 3:
				// Review Step
				return (
					<div className='space-y-6'>
						<h3 className='text-lg font-semibold text-white mb-4'>Review Your Information</h3>
						<div className='bg-gray-800 bg-opacity-50 rounded-lg p-6 space-y-4 border border-gray-700'>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<p className='text-sm text-gray-400'>First Name</p>
									<p className='font-semibold text-white'>{formData.firstName}</p>
								</div>
								<div>
									<p className='text-sm text-gray-400'>Last Name</p>
									<p className='font-semibold text-white'>{formData.lastName}</p>
								</div>
								<div>
									<p className='text-sm text-gray-400'>Date of Birth</p>
									<p className='font-semibold text-white'>{formData.dateOfBirth}</p>
								</div>
								<div>
									<p className='text-sm text-gray-400'>Nationality</p>
									<p className='font-semibold text-white'>{formData.nationality}</p>
								</div>
								<div className='col-span-2'>
									<p className='text-sm text-gray-400'>Address</p>
									<p className='font-semibold text-white'>{formData.address}</p>
								</div>
							</div>
						</div>
						<p className='text-sm text-gray-400'>
							By submitting, you agree that all information is accurate and complete.
						</p>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<motion.div
			className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			<motion.div
				className='bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto border border-gray-700'
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
			>
				{/* Header with Step Indicators */}
				<div className='bg-gray-800 bg-opacity-50 border-b border-gray-700 p-8'>
					<div className='flex items-center justify-between gap-2'>
						{steps.map((step, idx) => (
							<motion.div
								key={idx}
								className={`flex-1 text-center relative`}
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.1 }}
							>
								<div className={`flex items-center justify-center mb-2`}>
									<div
										className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
											idx <= currentStep
												? 'bg-accent-400 text-gray-900'
												: 'bg-gray-700 text-gray-300'
										}`}
									>
										{idx + 1}
									</div>
									{idx < steps.length - 1 && (
										<div
											className={`flex-1 h-1 mx-2 rounded transition-all ${
												idx < currentStep ? 'bg-accent-400' : 'bg-gray-700'
											}`}
										></div>
									)}
								</div>
								<p className={`text-sm font-semibold ${idx <= currentStep ? 'text-white' : 'text-gray-400'}`}>
									{step}
								</p>
							</motion.div>
						))}
					</div>
				</div>

				{/* Content */}
			<div className='p-8 min-h-[500px]'>
				<motion.div
					key={currentStep}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 }}
				>
					{renderStepContent()}
				</motion.div>
			</div>

				{/* Footer */}
				<div className='border-t border-gray-700 p-8 flex justify-between gap-4 bg-gray-800 bg-opacity-30'>
					<button
						onClick={handleBack}
						className='px-6 py-3 border-2 border-gray-600 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors'
					>
						Back
					</button>
					<button
						onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
						className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors border-2 ${
							currentStep === steps.length - 1
								? 'bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white'
								: 'bg-accent-400 hover:bg-accent-300 border-accent-400 hover:border-accent-300 text-gray-900'
						}`}
					>
						{currentStep === steps.length - 1 ? 'Submit' : 'Proceed'}
						{currentStep < steps.length - 1 && <ChevronRight size={20} />}
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
};

export default VerificationForm;
