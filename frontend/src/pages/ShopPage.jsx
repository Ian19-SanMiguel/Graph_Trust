import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	BadgeCheck,
	Check,
	ChevronDown,
	Flag,
	MessageCircle,
	Store,
	Users,
} from "lucide-react";
import axios from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import ReportModal from "../components/ReportModal";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { formatPrice } from "../lib/price";

const toTimestamp = (value) => {
	if (!value) return 0;

	if (typeof value === "number") {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Date.parse(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	if (typeof value === "object") {
		if (typeof value.seconds === "number") {
			return value.seconds * 1000;
		}

		if (typeof value.toDate === "function") {
			return value.toDate().getTime();
		}
	}

	return 0;
};

const ShopPage = () => {
	const { shopId } = useParams();
	const [loading, setLoading] = useState(true);
	const [shopData, setShopData] = useState({
		shop: {
			shopId: "",
			shopName: "Shop",
			stats: {
				ratingsDisplay: "No ratings",
				responseRate: "N/A",
				sold: 0,
				followers: 0,
			},
		},
		products: [],
	});
	const [showReportModal, setShowReportModal] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [sortBy, setSortBy] = useState("popular");
	const [priceSortDirection, setPriceSortDirection] = useState("asc");
	const [isFollowing, setIsFollowing] = useState(false);
	const { user } = useUserStore();

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

	useEffect(() => {
		if (!shopId) {
			setIsFollowing(false);
			return;
		}

		const followerId = String(user?._id || "guest");
		const followKey = `storefront_follow:${followerId}:${shopId}`;
		setIsFollowing(localStorage.getItem(followKey) === "1");
	}, [shopId, user?._id]);

	const categories = useMemo(() => {
		const uniqueCategories = Array.from(
			new Set(
				(shopData.products || [])
					.map((product) => (product.category || "").trim().toLowerCase())
					.filter(Boolean)
			)
		);

		return ["all", ...uniqueCategories];
	}, [shopData.products]);

	const visibleProducts = useMemo(() => {
		const filtered =
			selectedCategory === "all"
				? [...shopData.products]
				: shopData.products.filter(
					(product) => (product.category || "").trim().toLowerCase() === selectedCategory
				);

		if (sortBy === "price") {
			return filtered.sort((a, b) => {
				const diff = Number(a.price || 0) - Number(b.price || 0);
				return priceSortDirection === "asc" ? diff : -diff;
			});
		}

		if (sortBy === "top-sales") {
			return filtered.sort((a, b) => {
				const bySold = Number(b.sold || 0) - Number(a.sold || 0);
				if (bySold !== 0) return bySold;
				return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
			});
		}

		if (sortBy === "latest") {
			return filtered.sort((a, b) => {
				return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
			});
		}

		return filtered.sort((a, b) => {
			const scoreA = Number(a.popularityScore || 0);
			const scoreB = Number(b.popularityScore || 0);
			if (scoreB !== scoreA) {
				return scoreB - scoreA;
			}

			const soldDiff = Number(b.sold || 0) - Number(a.sold || 0);
			if (soldDiff !== 0) {
				return soldDiff;
			}

			return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
		});
	}, [shopData.products, selectedCategory, sortBy, priceSortDirection]);

	const handlePriceSortClick = () => {
		if (sortBy !== "price") {
			setSortBy("price");
			return;
		}

		setPriceSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	const stats = useMemo(() => {
		const apiStats = shopData.shop?.stats || {};
		return {
			ratings: apiStats.ratingsDisplay || "No ratings",
			products: shopData.products.length,
			responseRate: apiStats.responseRate || "N/A",
			followers: Number(apiStats.followers || 0),
			totalSold: Number(apiStats.sold || 0),
		};
	}, [shopData.products.length, shopData.shop?.stats]);

	const handleSubmitSellerReport = async (reasons) => {
		if (!user) {
			toast.error("Please login to submit a report");
			return;
		}

		await axios.post("/reports", {
			targetType: "seller",
			targetId: shopData.shop.shopId,
			targetName: shopData.shop.shopName || "Shop",
			reasons,
		});

		toast.success("Report submitted. Thanks for helping keep GraphTrust safe.");
	};

	const handleFollowSeller = () => {
		const followerId = String(user?._id || "guest");
		const followKey = `storefront_follow:${followerId}:${shopId}`;

		if (isFollowing) {
			localStorage.removeItem(followKey);
			setIsFollowing(false);
			setShopData((prev) => ({
				...prev,
				shop: {
					...prev.shop,
					stats: {
						...(prev.shop?.stats || {}),
						followers: Math.max(0, Number(prev.shop?.stats?.followers || 0) - 1),
					},
				},
			}));
			toast.success("You unfollowed this shop.");
			return;
		}

		localStorage.setItem(followKey, "1");
		setIsFollowing(true);
		setShopData((prev) => ({
			...prev,
			shop: {
				...prev.shop,
				stats: {
					...(prev.shop?.stats || {}),
					followers: Number(prev.shop?.stats?.followers || 0) + 1,
				},
			},
		}));
		toast.success("You are now following this shop.");
	};

	const handleChatSeller = () => {
		toast("Messaging is available in the chat page.");
	};

	const categoryLabel = (value) => (value === "all" ? "All" : value.toUpperCase());
	const hasBanner = Boolean(shopData.shop.bannerUrl);
	const hasLogo = Boolean(shopData.shop.logoUrl);

	if (loading) return <LoadingSpinner />;

	return (
		<div className='min-h-screen'>
			<div className='mx-auto w-full max-w-[1320px] px-3 py-4 sm:px-6'>
				<section className='overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/70 shadow-[0_18px_30px_rgba(0,0,0,0.22)]'>
					{hasBanner && (
						<div className='h-32 w-full overflow-hidden border-b border-gray-700 bg-gray-900'>
							<img
								src={shopData.shop.bannerUrl}
								alt='Storefront banner'
								className='h-full w-full object-cover'
								onError={(e) => {
									e.currentTarget.style.display = "none";
								}}
							/>
						</div>
					)}
					<div className='flex flex-wrap items-start justify-between gap-6 border-b border-gray-700 px-4 py-5 sm:px-7'>
						<div className='flex min-w-[250px] items-start gap-4'>
							<div className='flex h-20 w-20 items-center justify-center rounded-full border-4 border-gray-200 bg-gray-900 text-gray-100 shadow-sm'>
								{hasLogo ? (
									<img
										src={shopData.shop.logoUrl}
										alt='Storefront logo'
										className='h-full w-full rounded-full object-cover'
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
								) : (
									<Store className='h-10 w-10 text-accent-300' />
								)}
							</div>
							<div>
								<div className='flex items-center gap-2'>
									<h1 className='text-lg font-extrabold uppercase tracking-[0.25em] text-gray-100 sm:text-xl'>
										{shopData.shop.shopName || "Shop"}
									</h1>
									<BadgeCheck className='h-5 w-5 text-[#4571f3]' />
								</div>
								<p className='mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400'>
									{shopData.shop.tagline || "Active seller storefront"}
								</p>
								{shopData.shop.description && (
									<p className='mt-2 max-w-xl text-sm text-gray-300'>{shopData.shop.description}</p>
								)}
								<div className='mt-4 flex flex-wrap items-center gap-2'>
									<button
										type='button'
										onClick={handleFollowSeller}
										className={`rounded-md px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition ${
											isFollowing
												? "bg-green-600/90 hover:bg-green-500"
												: "bg-accent-600 hover:bg-accent-500"
										}`}
									>
										{isFollowing ? (
											<span className='inline-flex items-center gap-1'>
												<Check size={14} /> Followed
											</span>
										) : (
											"+ Follow"
										)}
									</button>
									<button
										type='button'
										onClick={handleChatSeller}
										className='inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-5 py-2 text-xs font-bold uppercase tracking-wider text-gray-100 transition hover:bg-gray-600'
									>
										<MessageCircle size={14} /> Chat
									</button>
									<button
										type='button'
										onClick={() => setShowReportModal(true)}
										className='inline-flex items-center gap-2 rounded-md border border-accent-500/60 bg-accent-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-300 transition hover:bg-accent-500/20'
									>
										<Flag size={14} /> Report
									</button>
								</div>
							</div>
						</div>

						<div className='grid flex-1 min-w-[260px] grid-cols-2 gap-4 text-gray-100 sm:grid-cols-3 md:grid-cols-5'>
							<div>
								<p className='text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400'>Ratings</p>
								<p className='mt-1 text-sm font-extrabold'>{stats.ratings}</p>
							</div>
							<div>
								<p className='text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400'>Products</p>
								<p className='mt-1 text-sm font-extrabold'>{stats.products}</p>
							</div>
							<div>
								<p className='text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400'>Response Rate</p>
								<p className='mt-1 text-sm font-extrabold'>{stats.responseRate}</p>
							</div>
							<div>
								<p className='text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400'>Sold</p>
								<p className='mt-1 text-sm font-extrabold'>{stats.totalSold}</p>
							</div>
							<div>
								<p className='text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400'>Followers</p>
								<p className='mt-1 flex items-center gap-1 text-sm font-extrabold'>
									<Users size={14} /> {stats.followers}
								</p>
							</div>
						</div>
					</div>

					<div className='flex flex-wrap items-center gap-6 bg-gray-900/60 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 sm:px-7'>
						<span className='border-b-2 border-accent-500 pb-1 text-accent-300'>Home</span>
					</div>
				</section>

				<div className='mt-4 grid gap-4 lg:grid-cols-[180px_1fr]'>
					<aside className='rounded-xl border border-gray-700 bg-gray-800/70 p-4'>
						<p className='mb-3 text-[10px] font-bold uppercase tracking-[0.23em] text-gray-400'>Category</p>
						<div className='space-y-2'>
							{categories.map((category) => {
								const active = selectedCategory === category;
								return (
									<button
										key={category}
										type='button'
										onClick={() => setSelectedCategory(category)}
										className={`w-full rounded-md border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.18em] transition ${
											active
												? "border-accent-500 bg-accent-500/20 text-accent-300"
												: "border-gray-600 bg-gray-700/50 text-gray-200 hover:border-accent-500/50"
										}`}
									>
										{categoryLabel(category)}
									</button>
								);
							})}
						</div>
					</aside>

					<section>
						<div className='mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/80 p-3'>
							<span className='rounded-md bg-gray-700 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gray-100'>
								Sort By:
							</span>
							{[
								{ label: "Popular", value: "popular" },
								{ label: "Latest", value: "latest" },
								{ label: "Top Sales", value: "top-sales" },
							].map((option) => (
								<button
									key={option.value}
									type='button'
									onClick={() => {
										setSortBy(option.value);
									}}
									className={`rounded-md px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] transition ${
										sortBy === option.value
											? "bg-accent-600 text-white"
											: "bg-gray-700 text-gray-200 hover:bg-gray-600"
									}`}
								>
									{option.label}
								</button>
							))}
							<button
								type='button'
								onClick={handlePriceSortClick}
								className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] transition ${
									sortBy === "price"
										? "bg-accent-600 text-white"
										: "bg-gray-700 text-gray-200 hover:bg-gray-600"
								}`}
							>
								Price {priceSortDirection === "asc" ? "Low-High" : "High-Low"}
								<ChevronDown
									size={14}
									className={priceSortDirection === "desc" ? "rotate-180" : ""}
								/>
							</button>
						</div>

						{visibleProducts.length === 0 ? (
							<div className='rounded-2xl border border-gray-700 bg-gray-800/70 p-8 text-center'>
								<p className='text-gray-300'>No products found for this category yet.</p>
								<Link to='/' className='mt-4 inline-block text-sm font-semibold text-accent-300 hover:text-accent-200'>
									Browse other products
								</Link>
							</div>
						) : (
							<div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5'>
								{visibleProducts.map((product) => (
									<Link
										to={`/product/${product._id}`}
										key={product._id}
										className='group overflow-hidden rounded-lg border border-gray-700 bg-gray-800/75 transition hover:-translate-y-0.5 hover:shadow-[0_12px_18px_rgba(0,0,0,0.28)]'
									>
										<div className='h-44 overflow-hidden border-b border-gray-700 bg-gray-900/60'>
											<img
												className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
												src={
													product.image ||
													`https://source.unsplash.com/600x600/?${encodeURIComponent(
														product.category || "product"
													)}`
												}
												alt={product.name || "product image"}
												onError={(e) => {
													e.currentTarget.src = `https://source.unsplash.com/600x600/?${encodeURIComponent(
														product.category || "product"
													)}`;
												}}
											/>
										</div>
										<div className='space-y-2 p-3'>
											<p className='line-clamp-2 min-h-[38px] text-xs font-bold uppercase tracking-[0.08em] text-gray-100'>
												{product.name}
											</p>
											<p className='text-sm font-black text-accent-400'>₱ {formatPrice(product.price)}</p>
											<p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400'>
												{Number(product.sold || 0)} sold
											</p>
										</div>
									</Link>
								))}
							</div>
						)}
					</section>
				</div>
			</div>

			{showReportModal && (
				<ReportModal
					title='Report Seller'
					onClose={() => setShowReportModal(false)}
					onSubmit={handleSubmitSellerReport}
				/>
			)}
		</div>
	);
};

export default ShopPage;