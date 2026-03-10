import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Edit2, Star, Trash, Upload } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { formatPrice } from "../lib/price";

const ProductsList = ({ canToggleFeatured = false }) => {
	const { deleteProduct, toggleFeaturedProduct, updateProduct, fetchCategories, products, categories } = useProductStore();
	const [editingProduct, setEditingProduct] = useState(null);
	const [form, setForm] = useState({ name: "", description: "", price: "", category: "", image: "" });

	const openEditor = (product) => {
		setEditingProduct(product);
		setForm({
			name: product.name || "",
			description: product.description || "",
			price: String(product.price ?? ""),
			category: product.category || "",
			image: product.image || "",
		});
	};

	const handleImageChange = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => {
			setForm((prev) => ({ ...prev, image: reader.result }));
		};
		reader.readAsDataURL(file);
	};

	const handleSave = async () => {
		if (!editingProduct?._id) return;
		await updateProduct(editingProduct._id, {
			name: form.name,
			description: form.description,
			price: Number.parseFloat(form.price),
			category: form.category,
			image: form.image,
		});
		setEditingProduct(null);
	};

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	console.log("products", products);

	return (
		<>
			<motion.div
				className='bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<table className=' min-w-full divide-y divide-gray-700'>
				<thead className='bg-gray-700'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Product
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Price
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Category
						</th>

						{canToggleFeatured && (
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
							>
								Featured
							</th>
						)}
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Actions
						</th>
					</tr>
				</thead>

				<tbody className='bg-gray-800 divide-y divide-gray-700'>
					{products?.map((product) => (
						<tr key={product._id} className='hover:bg-gray-700'>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='flex items-center'>
									<div className='flex-shrink-0 h-10 w-10'>
										<img
											className='h-10 w-10 rounded-full object-cover'
											src={product.image || `https://source.unsplash.com/100x100/?${encodeURIComponent(product.category)}`}
											alt={product.name}
											onError={(e) => (e.currentTarget.src = `https://source.unsplash.com/100x100/?${encodeURIComponent(product.category)}`)}
										/>
									</div>
									<div className='ml-4'>
										<div className='text-sm font-medium text-white'>{product.name}</div>
									</div>
								</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-300'>₱{formatPrice(product.price)}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-300'>{product.category}</div>
							</td>
							{canToggleFeatured && (
								<td className='px-6 py-4 whitespace-nowrap'>
									<button
										onClick={() => toggleFeaturedProduct(product._id)}
										className={`p-1 rounded-full ${
											product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-600 text-gray-300"
										} hover:bg-yellow-500 transition-colors duration-200`}
									>
										<Star className='h-5 w-5' />
									</button>
								</td>
							)}
							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
								<button
									onClick={() => openEditor(product)}
									className='mr-3 text-blue-400 hover:text-blue-300'
									title='Edit product'
								>
									<Edit2 className='h-5 w-5' />
								</button>
								<button
									onClick={() => deleteProduct(product._id)}
									className='text-red-400 hover:text-red-300'
								>
									<Trash className='h-5 w-5' />
								</button>
							</td>
						</tr>
					))}
				</tbody>
				</table>
			</motion.div>
			{editingProduct && (
			<div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4'>
				<div className='w-full max-w-xl rounded-lg border border-gray-700 bg-gray-900 p-5'>
					<h3 className='text-lg font-semibold text-white'>Edit Product</h3>
					<div className='mt-4 space-y-3'>
						<div>
							<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400'>
								Product Name
							</label>
							<input
								type='text'
								value={form.name}
								onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
								className='w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white'
								placeholder='Enter product name'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400'>
								Description
							</label>
							<textarea
								value={form.description}
								onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
								className='w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white'
								placeholder='Enter product description'
								rows={3}
							/>
						</div>
						<div className='grid grid-cols-2 gap-3'>
							<div>
								<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400'>
									Price
								</label>
								<input
									type='number'
									min='0'
									step='0.01'
									value={form.price}
									onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
									className='w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white'
									placeholder='Enter price'
								/>
							</div>
							<div>
								<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400'>
									Category
								</label>
								<select
									value={form.category}
									onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
									className='w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white'
								>
									<option value=''>Select category</option>
									{categories.map((category) => (
										<option key={category._id || category.slug} value={category.slug}>
											{category.name}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className='flex items-center justify-between'>
							<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400'>
								Product Image
							</label>
							<label htmlFor='edit-product-image' className='inline-flex cursor-pointer items-center rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700'>
								<Upload className='mr-2 h-4 w-4' /> Update Image
							</label>
							<input id='edit-product-image' type='file' accept='image/*' className='sr-only' onChange={handleImageChange} />
							{form.image && <span className='text-xs text-gray-400'>Image ready</span>}
						</div>
					</div>
					<div className='mt-5 flex justify-end gap-2'>
						<button type='button' onClick={() => setEditingProduct(null)} className='rounded-md bg-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-600'>
							Cancel
						</button>
						<button type='button' onClick={handleSave} className='rounded-md bg-accent-600 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-500'>
							Save Changes
						</button>
					</div>
				</div>
			</div>
			)}
		</>
	);
};
export default ProductsList;
