import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Store } from "lucide-react";
import axios from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";

const ShopPage = () => {
	const { shopId } = useParams();
	const [loading, setLoading] = useState(true);
	const [shopData, setShopData] = useState({
		shop: { shopId: "", shopName: "Shop" },
		products: [],
	});

	useEffect(() => {
		const fetchShopData = async () => {
			try {
				setLoading(true);
				const response = await axios.get(`/products/shop/${shopId}`);
				setShopData({
					shop: response.data?.shop || { shopId, shopName: "Shop" },
					products: response.data?.products || [],
				});
			} catch (error) {
				setShopData({
					shop: { shopId, shopName: "Shop" },
					products: [],
				});
			} finally {
				setLoading(false);
			}
		};

		if (!shopId) {
			setLoading(false);
			return;
		}

		fetchShopData();
	}, [shopId]);

	if (loading) return <LoadingSpinner />;

	return (
		<div className='container mx-auto px-4 py-10'>
			<div className='max-w-6xl mx-auto'>
				<div className='rounded-2xl border border-gray-700 bg-gray-800/70 p-6 mb-8'>
					<div className='flex items-center gap-3'>
						<div className='rounded-full bg-accent-500/20 p-3'>
							<Store className='h-7 w-7 text-accent-300' />
						</div>
						<div>
							<h1 className='text-3xl font-bold text-white'>{shopData.shop.shopName || "Shop"}</h1>
							<p className='text-sm text-gray-300'>
								{shopData.products.length} product{shopData.products.length === 1 ? "" : "s"} listed
							</p>
						</div>
					</div>
				</div>

				{shopData.products.length === 0 ? (
					<div className='rounded-2xl border border-gray-700 bg-gray-800/60 p-8 text-center'>
						<p className='text-gray-300'>No products found for this shop yet.</p>
						<Link to='/' className='inline-block mt-4 text-accent-300 hover:text-accent-200'>
							Browse other products
						</Link>
					</div>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
						{shopData.products.map((product) => (
							<ProductCard key={product._id} product={product} />
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ShopPage;