import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from '../lib/axios';

const recognizedCountries = [
	'Afghanistan',
	'Albania',
	'Algeria',
	'Andorra',
	'Angola',
	'Antigua and Barbuda',
	'Argentina',
	'Armenia',
	'Australia',
	'Austria',
	'Azerbaijan',
	'Bahamas',
	'Bahrain',
	'Bangladesh',
	'Barbados',
	'Belarus',
	'Belgium',
	'Belize',
	'Benin',
	'Bhutan',
	'Bolivia',
	'Bosnia and Herzegovina',
	'Botswana',
	'Brazil',
	'Brunei',
	'Bulgaria',
	'Burkina Faso',
	'Burundi',
	'Cabo Verde',
	'Cambodia',
	'Cameroon',
	'Canada',
	'Central African Republic',
	'Chad',
	'Chile',
	'China',
	'Colombia',
	'Comoros',
	'Congo',
	'Costa Rica',
	"Cote d'Ivoire",
	'Croatia',
	'Cuba',
	'Cyprus',
	'Czechia',
	'Democratic Republic of the Congo',
	'Denmark',
	'Djibouti',
	'Dominica',
	'Dominican Republic',
	'Ecuador',
	'Egypt',
	'El Salvador',
	'Equatorial Guinea',
	'Eritrea',
	'Estonia',
	'Eswatini',
	'Ethiopia',
	'Fiji',
	'Finland',
	'France',
	'Gabon',
	'Gambia',
	'Georgia',
	'Germany',
	'Ghana',
	'Greece',
	'Grenada',
	'Guatemala',
	'Guinea',
	'Guinea-Bissau',
	'Guyana',
	'Haiti',
	'Honduras',
	'Hungary',
	'Iceland',
	'India',
	'Indonesia',
	'Iran',
	'Iraq',
	'Ireland',
	'Israel',
	'Italy',
	'Jamaica',
	'Japan',
	'Jordan',
	'Kazakhstan',
	'Kenya',
	'Kiribati',
	'Kuwait',
	'Kyrgyzstan',
	'Laos',
	'Latvia',
	'Lebanon',
	'Lesotho',
	'Liberia',
	'Libya',
	'Liechtenstein',
	'Lithuania',
	'Luxembourg',
	'Madagascar',
	'Malawi',
	'Malaysia',
	'Maldives',
	'Mali',
	'Malta',
	'Marshall Islands',
	'Mauritania',
	'Mauritius',
	'Mexico',
	'Micronesia',
	'Moldova',
	'Monaco',
	'Mongolia',
	'Montenegro',
	'Morocco',
	'Mozambique',
	'Myanmar',
	'Namibia',
	'Nauru',
	'Nepal',
	'Netherlands',
	'New Zealand',
	'Nicaragua',
	'Niger',
	'Nigeria',
	'North Korea',
	'North Macedonia',
	'Norway',
	'Oman',
	'Pakistan',
	'Palau',
	'Palestine',
	'Panama',
	'Papua New Guinea',
	'Paraguay',
	'Peru',
	'Philippines',
	'Poland',
	'Portugal',
	'Qatar',
	'Romania',
	'Russia',
	'Rwanda',
	'Saint Kitts and Nevis',
	'Saint Lucia',
	'Saint Vincent and the Grenadines',
	'Samoa',
	'San Marino',
	'Sao Tome and Principe',
	'Saudi Arabia',
	'Senegal',
	'Serbia',
	'Seychelles',
	'Sierra Leone',
	'Singapore',
	'Slovakia',
	'Slovenia',
	'Solomon Islands',
	'Somalia',
	'South Africa',
	'South Korea',
	'South Sudan',
	'Spain',
	'Sri Lanka',
	'Sudan',
	'Suriname',
	'Sweden',
	'Switzerland',
	'Syria',
	'Tajikistan',
	'Tanzania',
	'Taiwan',
	'Thailand',
	'Timor-Leste',
	'Togo',
	'Tonga',
	'Trinidad and Tobago',
	'Tunisia',
	'Turkiye',
	'Turkmenistan',
	'Tuvalu',
	'Uganda',
	'Ukraine',
	'United Arab Emirates',
	'United Kingdom',
	'United States',
	'Uruguay',
	'Uzbekistan',
	'Vanuatu',
	'Vatican City',
	'Venezuela',
	'Vietnam',
	'Yemen',
	'Zambia',
	'Zimbabwe',
];

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const governmentIdAllowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
const governmentIdAllowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
const selfieAllowedMimeTypes = ['image/jpeg', 'image/png'];
const selfieAllowedExtensions = ['jpg', 'jpeg', 'png'];

const VerificationForm = ({ onClose, onSubmitted }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [showRequiredWarning, setShowRequiredWarning] = useState(false);
	const [isDateOfBirthTouched, setIsDateOfBirthTouched] = useState(false);
	const [isDraggingGovernmentId, setIsDraggingGovernmentId] = useState(false);
	const [governmentIdError, setGovernmentIdError] = useState('');
	const [selfieError, setSelfieError] = useState('');
	const [isCameraOpen, setIsCameraOpen] = useState(false);
	const [cameraError, setCameraError] = useState('');
	const [selfiePreviewUrl, setSelfiePreviewUrl] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const governmentIdInputRef = useRef(null);
	const selfieVideoRef = useRef(null);
	const cameraStreamRef = useRef(null);
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
	const stepColumnClasses = ['col-start-1', 'col-start-3', 'col-start-5', 'col-start-7'];
	const connectorColumnClasses = ['col-start-2', 'col-start-4', 'col-start-6'];
	const contactNumberPattern = /^9\d{9}$/;
	const todayDateString = new Date().toISOString().split('T')[0];
	const minDateOfBirthString = '1900-01-01';
	const dobPattern = /^\d{4}-\d{2}-\d{2}$/;
	const dropdownClassName =
		'w-full appearance-none pl-3 pr-10 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none text-gray-100';
	const requiredInfoFields = [
		'firstName',
		'lastName',
		'dateOfBirth',
		'sex',
		'nationality',
		'address',
		'contactNumber',
	];

	const normalizeContactNumber = (value) => {
		let digits = value.replace(/\D/g, '');

		if (digits.startsWith('63')) {
			digits = digits.slice(2);
		}

		if (digits.startsWith('09')) {
			digits = digits.slice(1);
		}

		return digits.slice(0, 10);
	};

	const hasMissingRequiredInfo = () =>
		requiredInfoFields.some((field) => {
			const value = formData[field];
			return typeof value === 'string' ? value.trim() === '' : !value;
		});

	const isValidContactNumber = (value) => contactNumberPattern.test(normalizeContactNumber(value));

	const fileToDataUrl = (file) =>
		new Promise((resolve, reject) => {
			const fileReader = new FileReader();
			fileReader.onload = () => resolve(fileReader.result);
			fileReader.onerror = () => reject(new Error('Unable to read file'));
			fileReader.readAsDataURL(file);
		});

	const isValidDateOfBirth = (value) => {
		if (!dobPattern.test(value)) {
			return false;
		}

		const [yearString, monthString, dayString] = value.split('-');
		const year = Number(yearString);
		const month = Number(monthString);
		const day = Number(dayString);

		if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
			return false;
		}

		if (year < 1900) {
			return false;
		}

		const parsedDate = new Date(year, month - 1, day);
		if (
			Number.isNaN(parsedDate.getTime()) ||
			parsedDate.getFullYear() !== year ||
			parsedDate.getMonth() !== month - 1 ||
			parsedDate.getDate() !== day
		) {
			return false;
		}

		return value <= todayDateString;
	};

	const formatDateOfBirthForReview = (value) => {
		if (!isValidDateOfBirth(value)) {
			return value;
		}

		const [yearString, monthString, dayString] = value.split('-');
		const year = Number(yearString);
		const month = Number(monthString);
		const day = Number(dayString);

		return new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(year, month - 1, day));
	};

	const getFileExtension = (fileName) => {
		const dotIndex = fileName.lastIndexOf('.');
		if (dotIndex === -1) {
			return '';
		}

		return fileName.slice(dotIndex + 1).toLowerCase();
	};

	const validateFile = ({ file, allowedMimeTypes, allowedExtensions, allowedLabel }) => {
		if (!file) {
			return '';
		}

		if (file.size > MAX_UPLOAD_SIZE_BYTES) {
			return 'File is too large. Maximum size is 10MB.';
		}

		const extension = getFileExtension(file.name);
		const isAllowedByMime = file.type ? allowedMimeTypes.includes(file.type.toLowerCase()) : false;
		const isAllowedByExtension = allowedExtensions.includes(extension);

		if (!isAllowedByMime && !isAllowedByExtension) {
			return `Invalid file format. Accepted formats: ${allowedLabel}.`;
		}

		return '';
	};

	const handleGovernmentIdFile = (file) => {
		const validationError = validateFile({
			file,
			allowedMimeTypes: governmentIdAllowedMimeTypes,
			allowedExtensions: governmentIdAllowedExtensions,
			allowedLabel: 'JPG, JPEG, PNG, PDF',
		});

		if (validationError) {
			setGovernmentIdError(validationError);
			setFormData((prev) => ({
				...prev,
				uploadedDocs: null,
			}));
			return;
		}

		setGovernmentIdError('');
		setFormData((prev) => ({
			...prev,
			uploadedDocs: file,
		}));
	};

	const handleSelfieFile = (file) => {
		const validationError = validateFile({
			file,
			allowedMimeTypes: selfieAllowedMimeTypes,
			allowedExtensions: selfieAllowedExtensions,
			allowedLabel: 'JPG, JPEG, PNG',
		});

		if (validationError) {
			setSelfieError(validationError);
			if (selfiePreviewUrl) {
				URL.revokeObjectURL(selfiePreviewUrl);
				setSelfiePreviewUrl('');
			}
			setFormData((prev) => ({
				...prev,
				selfieImage: null,
			}));
			return;
		}

		setSelfieError('');
		setCameraError('');
		if (selfiePreviewUrl) {
			URL.revokeObjectURL(selfiePreviewUrl);
		}
		setSelfiePreviewUrl(file ? URL.createObjectURL(file) : '');
		setFormData((prev) => ({
			...prev,
			selfieImage: file,
		}));
	};

	const stopCameraStream = () => {
		if (cameraStreamRef.current) {
			cameraStreamRef.current.getTracks().forEach((track) => track.stop());
			cameraStreamRef.current = null;
		}
	};

	const handleOpenCamera = async () => {
		setCameraError('');
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('Camera API is not supported in this browser.');
			}

			stopCameraStream();
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user' },
				audio: false,
			});

			cameraStreamRef.current = stream;
			setIsCameraOpen(true);
		} catch (error) {
			setCameraError('Unable to access camera. Live selfie capture is required for verification.');
		}
	};

	const handleCloseCamera = () => {
		setIsCameraOpen(false);
		stopCameraStream();
	};

	const handleCaptureSelfie = () => {
		const videoElement = selfieVideoRef.current;
		if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
			setCameraError('Camera is not ready yet. Please try again.');
			return;
		}

		const canvas = document.createElement('canvas');
		canvas.width = videoElement.videoWidth;
		canvas.height = videoElement.videoHeight;
		const context = canvas.getContext('2d');
		if (!context) {
			setCameraError('Unable to capture selfie. Please try the camera again.');
			return;
		}

		context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					setCameraError('Unable to capture selfie. Please try the camera again.');
					return;
				}

				const capturedFile = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
				handleSelfieFile(capturedFile);
				handleCloseCamera();
			},
			'image/jpeg',
			0.9
		);
	};

	const getInfoStepValidationMessage = () => {
		if (hasMissingRequiredInfo()) {
			return 'Please fill out all fields marked with * before proceeding.';
		}

		if (!isValidDateOfBirth(formData.dateOfBirth)) {
			return 'Please enter a valid date of birth.';
		}

		if (!isValidContactNumber(formData.contactNumber)) {
			return 'Please enter a valid phone number (09XXXXXXXXX or 9XXXXXXXXX).';
		}

		return '';
	};

	const getStepValidationMessage = () => {
		if (currentStep === 0) {
			return getInfoStepValidationMessage();
		}

		if (currentStep === 1) {
			if (governmentIdError) {
				return governmentIdError;
			}
			return 'Please upload a government ID before proceeding.';
		}

		if (currentStep === 2) {
			if (cameraError) {
				return cameraError;
			}
			if (selfieError) {
				return selfieError;
			}
			return 'Please capture a live selfie before proceeding.';
		}

		return '';
	};

	const isStepValid = (step) => {
		if (step === 0) {
			if (hasMissingRequiredInfo()) {
				return false;
			}

			if (!isValidDateOfBirth(formData.dateOfBirth)) {
				return false;
			}

			return isValidContactNumber(formData.contactNumber);
		}

		if (step === 1) {
			return Boolean(formData.uploadedDocs);
		}

		if (step === 2) {
			return Boolean(formData.selfieImage);
		}

		return true;
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		let nextValue = value;

		if (name === 'contactNumber') {
			nextValue = normalizeContactNumber(value).slice(0, 11);
		}

		setFormData((prev) => ({
			...prev,
			[name]: nextValue,
		}));
		if (showRequiredWarning) {
			setShowRequiredWarning(false);
		}
	};

	const handleGovernmentIdChange = (e) => {
		const file = e.target.files?.[0] || null;
		handleGovernmentIdFile(file);
		if (showRequiredWarning) {
			setShowRequiredWarning(false);
		}
		e.target.value = '';
	};

	const handleGovernmentIdDrop = (e) => {
		e.preventDefault();
		setIsDraggingGovernmentId(false);
		const file = e.dataTransfer.files?.[0] || null;
		handleGovernmentIdFile(file);
		if (showRequiredWarning) {
			setShowRequiredWarning(false);
		}
	};

	const handleRemoveGovernmentId = () => {
		setFormData((prev) => ({
			...prev,
			uploadedDocs: null,
		}));
		setGovernmentIdError('');
		if (showRequiredWarning) {
			setShowRequiredWarning(false);
		}
	};

	const handleRemoveSelfie = () => {
		handleCloseCamera();
		if (selfiePreviewUrl) {
			URL.revokeObjectURL(selfiePreviewUrl);
			setSelfiePreviewUrl('');
		}
		setFormData((prev) => ({
			...prev,
			selfieImage: null,
		}));
		setSelfieError('');
		setCameraError('');
		if (showRequiredWarning) {
			setShowRequiredWarning(false);
		}
	};

	useEffect(() => {
		if (isCameraOpen && selfieVideoRef.current && cameraStreamRef.current) {
			selfieVideoRef.current.srcObject = cameraStreamRef.current;
		}
	}, [isCameraOpen]);

	useEffect(() => {
		return () => {
			stopCameraStream();
			if (selfiePreviewUrl) {
				URL.revokeObjectURL(selfiePreviewUrl);
			}
		};
	}, [selfiePreviewUrl]);

	const handleNext = () => {
		if (!isStepValid(currentStep)) {
			setShowRequiredWarning(true);
			return;
		}

		if (currentStep < steps.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handleBack = () => {
		setShowRequiredWarning(false);
		if (currentStep === 0) {
			onClose?.();
			return;
		}

		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const handleSubmit = async () => {
		if (!isStepValid(0) || !isStepValid(1) || !isStepValid(2)) {
			if (!isStepValid(0)) {
				setCurrentStep(0);
			} else if (!isStepValid(1)) {
				setCurrentStep(1);
			} else {
				setCurrentStep(2);
			}
			setShowRequiredWarning(true);
			return;
		}

		if (isSubmitting) {
			return;
		}

		setShowRequiredWarning(false);

		if (!formData.uploadedDocs || !formData.selfieImage) {
			setShowRequiredWarning(true);
			return;
		}

		try {
			setIsSubmitting(true);

			const [governmentIdImage, selfieImage] = await Promise.all([
				fileToDataUrl(formData.uploadedDocs),
				fileToDataUrl(formData.selfieImage),
			]);

			await axios.post('/verifications/submit', {
				firstName: formData.firstName,
				middleName: formData.middleName,
				lastName: formData.lastName,
				suffix: formData.suffix,
				dateOfBirth: formData.dateOfBirth,
				sex: formData.sex,
				nationality: formData.nationality,
				address: formData.address,
				contactNumber: formData.contactNumber,
				governmentIdImage,
				selfieImage,
			});

			toast.success('Verification submitted successfully');
			onSubmitted?.({ status: 'pending' });
			onClose?.();
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to submit verification');
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderStepContent = () => {
		const showDateOfBirthError =
			currentStep === 0 &&
			((isDateOfBirthTouched && formData.dateOfBirth.trim() !== '' && !isValidDateOfBirth(formData.dateOfBirth)) ||
				(showRequiredWarning && !isValidDateOfBirth(formData.dateOfBirth)));

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
								<div className='relative'>
									<select
										name='suffix'
										value={formData.suffix}
										onChange={handleInputChange}
										className={dropdownClassName}
									>
										<option value=''>Select</option>
										<option value='Jr'>Jr</option>
										<option value='Sr'>Sr</option>
										<option value='III'>III</option>
										<option value='IV'>IV</option>
									</select>
									<ChevronDown
										size={16}
										className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300'
									/>
								</div>
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
									onBlur={() => setIsDateOfBirthTouched(true)}
									min={minDateOfBirthString}
									max={todayDateString}
									className='dob-input w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 focus:outline-none placeholder-gray-300 text-gray-100'
									placeholder='MM/DD/YYYY'
								/>
								<p className='mt-1 h-4 text-xs text-red-400'>
									{showDateOfBirthError ? 'Please enter a valid date of birth.' : ''}
								</p>
							</div>
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Sex <span className='text-red-500'>*</span>
								</label>
								<div className='relative'>
									<select
										name='sex'
										value={formData.sex}
										onChange={handleInputChange}
										className={dropdownClassName}
									>
										<option value=''>Select</option>
										<option value='male'>Male</option>
										<option value='female'>Female</option>
									</select>
									<ChevronDown
										size={16}
										className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300'
									/>
								</div>
							</div>
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Nationality <span className='text-red-500'>*</span>
								</label>
								<div className='relative'>
									<select
										name='nationality'
										value={formData.nationality}
										onChange={handleInputChange}
										className={dropdownClassName}
									>
										<option value=''>Select</option>
										{recognizedCountries.map((country) => (
											<option key={country} value={country}>
												{country}
											</option>
										))}
									</select>
									<ChevronDown
										size={16}
										className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300'
									/>
								</div>
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
								<div className='relative'>
									<select
										className='appearance-none pl-3 pr-10 py-2 border border-gray-600 rounded-l-lg bg-gray-800 focus:outline-none text-gray-100'
										defaultValue='+63'
									>
										<option value='+63'>+63</option>
									</select>
									<ChevronDown
										size={16}
										className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300'
									/>
								</div>
								<input
									type='tel'
									name='contactNumber'
									value={formData.contactNumber}
									onChange={handleInputChange}
									inputMode='numeric'
									autoComplete='tel-national'
									className='flex-1 px-3 py-2 border border-l-0 border-gray-600 rounded-r-lg bg-gray-800 focus:outline-none placeholder-gray-300 text-gray-100'
									placeholder='09XXXXXXXXX or 9XXXXXXXXX'
								/>
							</div>
							<p className='mt-2 text-xs text-gray-400'>Accepted format: starts with 09 or 9</p>
						</div>
					</div>
				);

			case 1:
				// Upload Documents Step
				return (
					<div className='space-y-6 py-12 text-center'>
						<h3 className='text-lg font-semibold text-white'>Upload Government ID</h3>
						<div
							onDragOver={(e) => {
								e.preventDefault();
								setIsDraggingGovernmentId(true);
							}}
							onDragLeave={(e) => {
								e.preventDefault();
								setIsDraggingGovernmentId(false);
							}}
							onDrop={handleGovernmentIdDrop}
							className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
								isDraggingGovernmentId
									? 'border-accent-400 bg-accent-400/10'
									: 'border-gray-600'
							}`}
						>
							<p className='text-gray-300 mb-4'>Drag and drop your documents here or click to upload</p>
							<input
								type='file'
								ref={governmentIdInputRef}
								onChange={handleGovernmentIdChange}
								className='hidden'
								accept='.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'
							/>
							<button
								type='button'
								onClick={() => governmentIdInputRef.current?.click()}
								className='bg-accent-400 hover:bg-accent-300 text-white px-6 py-2 rounded-lg font-semibold'
							>
								Choose File
							</button>
							{formData.uploadedDocs && (
								<div className='mt-3 relative mx-auto w-full max-w-[12rem] rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2'>
									<p className='text-sm text-green-400 pr-6'>Selected: {formData.uploadedDocs.name}</p>
									<button
										type='button'
										onClick={handleRemoveGovernmentId}
										className='absolute right-2 top-2 text-gray-400 hover:text-red-400 transition-colors'
										aria-label='Remove uploaded government ID'
									>
										<X size={14} />
									</button>
								</div>
							)}
							{governmentIdError && (
								<p className='text-sm text-red-400 mt-3'>{governmentIdError}</p>
							)}
						</div>
						<p className='text-xs text-gray-400'>Accepted formats: JPG, PNG, PDF (Max 10MB)</p>
					</div>
				);

			case 2:
				// Selfie Step
				return (
					<div className='space-y-4 py-4 text-center'>
						<h3 className='text-lg font-semibold text-white'>Take a Selfie</h3>
						<p className='text-gray-300 mb-2'>Make sure your face is clearly visible and well-lit.</p>
						<div className='border-2 border-gray-600 rounded-lg p-6'>
							<div className='space-y-2'>
								<div className='relative mx-auto h-44 w-64 rounded-lg border border-gray-700 bg-gray-800/40 flex items-center justify-center overflow-hidden'>
									{isCameraOpen ? (
										<video
											ref={selfieVideoRef}
											autoPlay
											playsInline
											muted
											className='h-full w-full object-cover'
										/>
									) : selfiePreviewUrl ? (
										<>
											<img src={selfiePreviewUrl} alt='Selfie preview' className='h-full w-full object-cover' />
											<button
												type='button'
												onClick={handleRemoveSelfie}
												className='absolute right-2 top-2 text-gray-300 hover:text-red-400 transition-colors'
												aria-label='Remove uploaded selfie'
											>
												<X size={14} />
											</button>
										</>
									) : (
										<p className='text-sm text-gray-300 px-4'>No selfie yet</p>
									)}
								</div>
								<div className='flex items-center justify-center gap-3'>
									<button
										type='button'
										onClick={isCameraOpen ? handleCaptureSelfie : handleOpenCamera}
										className='bg-accent-400 hover:bg-accent-300 text-gray-900 px-6 py-2 rounded-lg font-semibold'
									>
										{isCameraOpen ? 'Capture Photo' : selfiePreviewUrl ? 'Retake Camera' : 'Open Camera'}
									</button>
									{isCameraOpen && (
										<button
											type='button'
											onClick={handleCloseCamera}
											className='border border-gray-600 text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-800'
										>
											Close Camera
										</button>
									)}
								</div>
								<p className='h-4 text-xs text-accent-400'>
									{selfiePreviewUrl && !isCameraOpen ? 'Preview shown above — retake if needed.' : ''}
								</p>
							</div>
						</div>
						<p className='text-xs text-gray-400 pt-1'>Live selfie capture required for KYC verification.</p>
					</div>
				);

			case 3:
				// Review Step
				return (
					<div className='space-y-6'>
						<h3 className='text-lg font-semibold text-white mb-4'>Review Your Information</h3>
						<div className='bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='bg-gray-900/40 rounded-lg p-4 border border-gray-700/80'>
									<p className='text-xs uppercase tracking-wide text-gray-400'>Full Name</p>
									<p className='mt-1 font-semibold text-white'>
										{[formData.firstName, formData.middleName, formData.lastName, formData.suffix]
											.filter(Boolean)
											.join(' ')}
									</p>
								</div>
								<div className='bg-gray-900/40 rounded-lg p-4 border border-gray-700/80'>
									<p className='text-xs uppercase tracking-wide text-gray-400'>Date of Birth</p>
									<p className='mt-1 font-semibold text-white'>{formatDateOfBirthForReview(formData.dateOfBirth)}</p>
								</div>
								<div className='bg-gray-900/40 rounded-lg p-4 border border-gray-700/80'>
									<p className='text-xs uppercase tracking-wide text-gray-400'>Nationality</p>
									<p className='mt-1 font-semibold text-white'>{formData.nationality}</p>
								</div>
								<div className='bg-gray-900/40 rounded-lg p-4 border border-gray-700/80'>
									<p className='text-xs uppercase tracking-wide text-gray-400'>Contact Number</p>
									<p className='mt-1 font-semibold text-white'>+63 {formData.contactNumber}</p>
								</div>
								<div className='col-span-2 bg-gray-900/40 rounded-lg p-4 border border-gray-700/80'>
									<p className='text-xs uppercase tracking-wide text-gray-400'>Address</p>
									<p className='mt-1 font-semibold text-white'>{formData.address}</p>
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
				className='bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700'
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
			>
				{/* Header with Step Indicators */}
				<div className='bg-gray-800 bg-opacity-50 border-b border-gray-700 p-8'>
					<div className='mx-auto w-full max-w-2xl'>
						<div className='grid grid-cols-[3rem_1fr_3rem_1fr_3rem_1fr_3rem] items-center'>
							{steps.map((step, idx) => (
								<React.Fragment key={step}>
									<motion.div
										className={`${stepColumnClasses[idx]} flex h-12 w-12 items-center justify-center rounded-full font-bold transition-all ${
											idx <= currentStep
												? 'bg-accent-400 text-gray-900'
												: 'bg-gray-700 text-gray-300'
										}`}
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: idx * 0.1 }}
									>
										{idx + 1}
									</motion.div>
									{idx < steps.length - 1 && (
										<div
											className={`${connectorColumnClasses[idx]} h-1 rounded transition-all ${
												idx < currentStep ? 'bg-accent-400' : 'bg-gray-700'
											}`}
										></div>
									)}
								</React.Fragment>
							))}
						</div>
						<div className='mt-2 grid grid-cols-[3rem_1fr_3rem_1fr_3rem_1fr_3rem]'>
							{steps.map((step, idx) => (
								<p
									key={`label-${step}`}
									className={`${stepColumnClasses[idx]} text-center text-sm font-semibold ${
										idx <= currentStep ? 'text-white' : 'text-gray-400'
									}`}
								>
									{step}
								</p>
							))}
						</div>
					</div>
				</div>

				{/* Content */}
			<div className='p-8 h-[500px] overflow-hidden'>
				<motion.div
					key={currentStep}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 }}
				>
					{renderStepContent()}
					{showRequiredWarning && currentStep <= 2 && (
						<p className='mt-4 text-sm text-red-400'>
							{getStepValidationMessage()}
						</p>
					)}
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
						disabled={isSubmitting}
						className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors border-2 ${
							isSubmitting
								? 'bg-gray-700 border-gray-700 text-gray-400 cursor-not-allowed'
								: currentStep === steps.length - 1
								? 'bg-accent-400 hover:bg-accent-300 border-accent-400 hover:border-accent-300 text-gray-900'
								: !isStepValid(currentStep)
									? 'bg-gray-700 border-gray-700 text-gray-400'
									: 'bg-accent-400 hover:bg-accent-300 border-accent-400 hover:border-accent-300 text-gray-900'
						}`}
					>
						{isSubmitting ? 'Submitting...' : currentStep === steps.length - 1 ? 'Submit' : 'Proceed'}
						{currentStep < steps.length - 1 && <ChevronRight size={20} />}
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
};

export default VerificationForm;
