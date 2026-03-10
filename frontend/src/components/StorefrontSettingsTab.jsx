import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";

const INITIAL_FORM = {
	shopName: "",
	tagline: "",
	description: "",
	logoUrl: "",
	bannerUrl: "",
	logoImage: "",
	bannerImage: "",
};

const StorefrontSettingsTab = () => {
	const [form, setForm] = useState(INITIAL_FORM);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const loadStorefront = async () => {
			try {
				setLoading(true);
				const res = await axios.get("/products/shop/profile");
				const storefront = res.data?.storefront || {};
				setForm({
					shopName: storefront.shopName || "",
					tagline: storefront.tagline || "",
					description: storefront.description || "",
					logoUrl: storefront.logoUrl || "",
					bannerUrl: storefront.bannerUrl || "",
				});
			} catch (error) {
				toast.error(error.response?.data?.message || "Failed to load storefront profile");
			} finally {
				setLoading(false);
			}
		};

		loadStorefront();
	}, []);

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleImageUpload = (field) => (e) => {
		const file = e.target.files?.[0];
		if (!file) {
			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			setForm((prev) => ({ ...prev, [field]: String(reader.result || "") }));
		};
		reader.readAsDataURL(file);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			setSaving(true);
			const payload = {
				tagline: form.tagline,
				description: form.description,
				logoUrl: form.logoUrl,
				bannerUrl: form.bannerUrl,
				logoImage: form.logoImage,
				bannerImage: form.bannerImage,
			};
			const res = await axios.put("/products/shop/profile", payload);
			const updated = res.data?.storefront || {};
			setForm((prev) => ({
				...prev,
				logoUrl: updated.logoUrl || prev.logoUrl,
				bannerUrl: updated.bannerUrl || prev.bannerUrl,
				logoImage: "",
				bannerImage: "",
			}));
			toast.success("Storefront updated");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update storefront");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className='max-w-3xl mx-auto rounded-lg border border-gray-700 bg-gray-800 p-10 text-center text-gray-300'>
				<Loader2 className='mx-auto mb-3 h-6 w-6 animate-spin text-accent-400' />
				Loading storefront settings...
			</div>
		);
	}

	return (
		<motion.div
			className='bg-gray-800 shadow-lg rounded-lg p-8 mb-8 max-w-3xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<h2 className='text-2xl font-semibold mb-2 text-accent-300'>Customize Storefront</h2>
			<p className='mb-6 text-sm text-gray-400'>This controls what buyers see on your shop page.</p>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label className='block text-sm font-medium text-gray-300 mb-1'>Shop Name</label>
					<input
						type='text'
						value={form.shopName}
						readOnly
						disabled
						maxLength={60}
						className='block w-full cursor-not-allowed bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-gray-400'
						required
					/>
					<p className='mt-1 text-xs text-gray-500'>
						Shop name is locked to your registered business name.
					</p>
				</div>

				<div>
					<label className='block text-sm font-medium text-gray-300 mb-1'>Tagline</label>
					<input
						type='text'
						value={form.tagline}
						onChange={(e) => updateField("tagline", e.target.value)}
						maxLength={120}
						placeholder='Example: Curated gadgets delivered fast'
						className='block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500'
					/>
				</div>

				<div>
					<label className='block text-sm font-medium text-gray-300 mb-1'>Description</label>
					<textarea
						rows={4}
						value={form.description}
						onChange={(e) => updateField("description", e.target.value)}
						maxLength={700}
						className='block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500'
					/>
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<div>
						<label className='block text-sm font-medium text-gray-300 mb-2'>Store Logo</label>
						<p className='mb-2 text-xs text-gray-400'>Recommended: 512 x 512 px square (PNG/JPG, under 2 MB).</p>
						<div className='rounded-md border border-gray-600 bg-gray-700/40 p-3'>
							<div className='mb-3 h-24 w-24 overflow-hidden rounded-full border border-gray-600 bg-gray-800'>
								{form.logoImage || form.logoUrl ? (
									<img
										src={form.logoImage || form.logoUrl}
										alt='Logo preview'
										className='h-full w-full object-cover'
									/>
								) : null}
							</div>
							<input
								type='file'
								accept='image/*'
								onChange={handleImageUpload("logoImage")}
								className='hidden'
								id='storefront-logo-upload'
							/>
							<label
								htmlFor='storefront-logo-upload'
								className='inline-flex cursor-pointer items-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-600'
							>
								<ImagePlus className='h-4 w-4' /> Upload logo
							</label>
						</div>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-300 mb-2'>Store Banner</label>
						<p className='mb-2 text-xs text-gray-400'>Recommended: 1600 x 500 px (PNG/JPG, under 4 MB).</p>
						<div className='rounded-md border border-gray-600 bg-gray-700/40 p-3'>
							<div className='mb-3 h-24 w-full overflow-hidden rounded-md border border-gray-600 bg-gray-800'>
								{form.bannerImage || form.bannerUrl ? (
									<img
										src={form.bannerImage || form.bannerUrl}
										alt='Banner preview'
										className='h-full w-full object-cover'
									/>
								) : null}
							</div>
							<input
								type='file'
								accept='image/*'
								onChange={handleImageUpload("bannerImage")}
								className='hidden'
								id='storefront-banner-upload'
							/>
							<label
								htmlFor='storefront-banner-upload'
								className='inline-flex cursor-pointer items-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-600'
							>
								<ImagePlus className='h-4 w-4' /> Upload banner
							</label>
						</div>
					</div>
				</div>

				<button
					type='submit'
					disabled={saving}
					className='w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-60'
				>
					{saving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
					{saving ? "Saving..." : "Save Storefront"}
				</button>
			</form>
		</motion.div>
	);
};

export default StorefrontSettingsTab;
