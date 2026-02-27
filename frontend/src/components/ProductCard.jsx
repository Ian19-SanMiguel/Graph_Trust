import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	const navigate = useNavigate();
	const handleAddToCart = () => {
		if (!user) {
			toast.error("Please login to add products to cart", { id: "login" });
			return;
		} else {
			// add to cart
			addToCart(product);
		}
	};

	return (
		<div
			onClick={() => navigate(`/product/${product._id}`)}
			className='cursor-pointer flex w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg bg-gray-800 bg-opacity-50'
		>
			<div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
				<img
					className='object-cover w-full'
					src={product.image || `https://source.unsplash.com/600x600/?${encodeURIComponent(product.category)}`}
					alt={product.name || 'product image'}
					onError={(e) => {
						e.currentTarget.src = `https://source.unsplash.com/600x600/?${encodeURIComponent(product.category)}`;
					}}
				/>
				<div className='absolute inset-0 bg-black bg-opacity-20' />
			</div>

			<div className='mt-4 px-5 pb-5'>
				<h5 className='text-xl font-semibold tracking-tight text-white'>{product.name}</h5>
				<button
					type='button'
					onClick={(e) => {
						e.stopPropagation();
						if (product.shopId) {
							navigate(`/shop/${product.shopId}`);
						}
					}}
					className='mt-1 text-sm text-accent-300 hover:text-accent-200 disabled:text-gray-400 disabled:cursor-default'
					disabled={!product.shopId}
				>
					{product.shopName || "Shop"}
				</button>
				<div className='mt-2 mb-5 flex items-center justify-between'>
					<p>
						<span className='text-3xl font-bold text-accent-400'>${product.price}</span>
					</p>
				</div>
				<button
				className='flex items-center justify-center rounded-lg bg-accent-400 px-5 py-2.5 text-center text-sm font-medium text-white
				 hover:bg-accent-300 focus:outline-none focus:ring-2 focus:ring-accent-400 border-2 border-accent-300'
					onClick={(e) => {
						e.stopPropagation();
						handleAddToCart();
					}}
				>
					<ShoppingCart size={22} className='mr-2' />
					Add to cart
				</button>
			</div>
		</div>
	);
};
export default ProductCard;
