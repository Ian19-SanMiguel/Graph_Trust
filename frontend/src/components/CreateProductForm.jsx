import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const CreateProductForm = () => {
	const [newProduct, setNewProduct] = useState({
		name: "",
		description: "",
		price: "",
		category: "",
		image: "",
	});
	const [newCategory, setNewCategory] = useState({ name: "", image: "" });

	const { createProduct, createCategory, fetchCategories, categories, loading } = useProductStore();
	const { user } = useUserStore();
	const isAdmin = user?.role === "admin";

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const parsedPrice = Number.parseFloat(newProduct.price);

		if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
			return;
		}

		try {
			await createProduct({ ...newProduct, price: parsedPrice });
			setNewProduct({ name: "", description: "", price: "", category: "", image: "" });
		} catch {
			console.log("error creating a product");
		}
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();

			reader.onloadend = () => {
				setNewProduct({ ...newProduct, image: reader.result });
			};

			reader.readAsDataURL(file); // base64
		}
	};

	const handleCategoryImageChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => {
			setNewCategory((prev) => ({ ...prev, image: reader.result }));
		};
		reader.readAsDataURL(file);
	};

	const handleCreateCategory = async (e) => {
		e.preventDefault();
		if (!newCategory.name.trim() || !newCategory.image) {
			return;
		}

		try {
			const created = await createCategory({ name: newCategory.name, image: newCategory.image });
			if (created?.slug) {
				setNewProduct((prev) => ({ ...prev, category: created.slug }));
			}
			setNewCategory({ name: "", image: "" });
		} catch {
			// Errors are surfaced via toast in the store.
		}
	};

	return (
		<motion.div
			className='bg-gray-800 shadow-lg rounded-lg p-8 mb-8 max-w-xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<h2 className='text-2xl font-semibold mb-6 text-accent-300'>Create New Product</h2>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label htmlFor='name' className='block text-sm font-medium text-gray-300'>
						Product Name
					</label>
					<input
						type='text'
						id='name'
						name='name'
						value={newProduct.name}
						onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2
						 px-3 text-white focus:outline-none focus:ring-2
						focus:ring-accent-500 focus:border-accent-500'
						required
					/>
				</div>

				<div>
					<label htmlFor='description' className='block text-sm font-medium text-gray-300'>
						Description
					</label>
					<textarea
						id='description'
						name='description'
						value={newProduct.description}
						onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
						rows='3'
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm
					 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-500 
					 focus:border-accent-500'
						required
					/>
				</div>

				<div>
					<label htmlFor='price' className='block text-sm font-medium text-gray-300'>
						Price
					</label>
					<input
						type='number'
						id='price'
						name='price'
						value={newProduct.price}
						onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
						step='0.01'
						min='0'
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
					py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-500
					 focus:border-accent-500'
						required
					/>
				</div>

				<div>
					<label htmlFor='category' className='block text-sm font-medium text-gray-300'>
						Category
					</label>
					<select
						id='category'
						name='category'
						value={newProduct.category}
						onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md
						 shadow-sm py-2 px-3 text-white focus:outline-none 
					 focus:ring-2 focus:ring-accent-500 focus:border-accent-500'
						required
					>
						<option value=''>Select a category</option>
						{categories.map((category) => (
							<option key={category._id || category.slug} value={category.slug}>
								{category.name}
							</option>
						))}
					</select>
				</div>

				{isAdmin && (
				<div className='rounded-lg border border-gray-700 bg-gray-900/40 p-4'>
					<h3 className='mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-accent-300'>
						Add Category
					</h3>
					<div className='grid gap-3 md:grid-cols-[1fr_auto]'>
						<input
							type='text'
							placeholder='Category name'
							value={newCategory.name}
							onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
							className='block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500'
						/>
						<label
							htmlFor='category-image'
							className='cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600'
						>
							<Upload className='mr-2 h-4 w-4' />
							Category Image
						</label>
						<input
							type='file'
							id='category-image'
							className='sr-only'
							accept='image/*'
							onChange={handleCategoryImageChange}
						/>
					</div>
					<div className='mt-3 flex items-center justify-between'>
						<p className='text-xs text-gray-400'>
							{newCategory.image ? "Category image selected" : "Upload an image for this category"}
						</p>
						<button
							type='button'
							onClick={handleCreateCategory}
							disabled={loading || !newCategory.name.trim() || !newCategory.image}
							className='rounded-md bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400'
						>
							Create Category
						</button>
					</div>
				</div>
				)}

				<div className='mt-1 flex items-center'>
					<input type='file' id='image' className='sr-only' accept='image/*' onChange={handleImageChange} />
					<label
						htmlFor='image'
						className='cursor-pointer bg-gray-700 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500'
					>
						<Upload className='h-5 w-5 inline-block mr-2' />
						Upload Image
					</label>
					{newProduct.image && <span className='ml-3 text-sm text-gray-400'>Image uploaded </span>}
				</div>

				<button
					type='submit'
					className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
					shadow-sm text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50'
					disabled={loading}
				>
					{loading ? (
						<>
							<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
							Loading...
						</>
					) : (
						<>
							<PlusCircle className='mr-2 h-5 w-5' />
							Create Product
						</>
					)}
				</button>
			</form>
		</motion.div>
	);
};
export default CreateProductForm;
