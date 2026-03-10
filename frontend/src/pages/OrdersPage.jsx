import { useEffect, useMemo, useState } from "react";
import { Clock3, Package, Truck } from "lucide-react";
import axios from "../lib/axios";
import { formatPrice } from "../lib/price";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const STATUS_STEPS = ["processing", "shipping", "delivered"];

const STATUS_LABELS = {
	processing: "Processing",
	shipping: "Shipping",
	delivered: "Delivered",
	cancelled: "Cancelled",
};

const toDisplayDate = (value) => {
	if (!value) return "-";
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed.toLocaleString();
		}
	}
	if (typeof value?.seconds === "number") {
		return new Date(value.seconds * 1000).toLocaleString();
	}
	if (typeof value?.toDate === "function") {
		return value.toDate().toLocaleString();
	}
	return "-";
};

const statusBadgeClass = (status) => {
	if (status === "delivered") return "bg-green-500/20 text-green-300 border-green-500/40";
	if (status === "shipping") return "bg-blue-500/20 text-blue-300 border-blue-500/40";
	if (status === "cancelled") return "bg-red-500/20 text-red-300 border-red-500/40";
	return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
};

const OrdersPage = () => {
	const navigate = useNavigate();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);

	const itemsCount = useMemo(
		() => orders.reduce((total, order) => total + (order.items?.length || 0), 0),
		[orders]
	);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const res = await axios.get("/orders/mine");
			setOrders(res.data?.orders || []);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to load orders");
		} finally {
			setLoading(false);
		}
	};

	const handleAskSellerForUpdate = ({ orderId, shopId, shopName }) => {
		const normalizedShopId = String(shopId || "").trim();
		if (!normalizedShopId) {
			toast.error("Seller details are unavailable for this item");
			return;
		}

		const autoMessage = `Hi, I would like an update on Order: ${orderId}`;
		navigate(
			`/messages?shopId=${encodeURIComponent(normalizedShopId)}&shopName=${encodeURIComponent(
				shopName || "Shop"
			)}&autoMessage=${encodeURIComponent(autoMessage)}`
		);
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	if (loading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='mx-auto max-w-6xl rounded-lg border border-gray-700 bg-gray-800 p-10 text-center text-gray-300'>
					Loading your orders...
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='mx-auto max-w-6xl space-y-4'>
				<div className='rounded-lg border border-gray-700 bg-gray-800 p-4'>
					<h1 className='text-3xl font-bold text-accent-400'>My Orders</h1>
					<p className='mt-1 text-sm text-gray-400'>
						{orders.length} order{orders.length === 1 ? "" : "s"} · {itemsCount} tracked item{itemsCount === 1 ? "" : "s"}
					</p>
				</div>

				{orders.length === 0 ? (
					<div className='rounded-lg border border-gray-700 bg-gray-800 p-10 text-center'>
						<Package className='mx-auto mb-3 h-8 w-8 text-accent-400' />
						<p className='text-gray-300'>No orders yet.</p>
					</div>
				) : (
					orders.map((order) => {
						const orderItems = order.items || [];
						const firstOpenItem = orderItems.find(
							(item) => String(item.fulfillmentStatus || "processing").toLowerCase() !== "delivered" && item.shopId
						);
						const canAskForUpdate = Boolean(firstOpenItem?.shopId);

						return (
						<div key={order.orderId} className='rounded-lg border border-gray-700 bg-gray-800 overflow-hidden'>
							<div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 bg-gray-900/60 px-4 py-3'>
								<div className='text-sm text-gray-200'>
									<span className='font-semibold'>Order:</span> {order.orderId}
								</div>
								<div className='text-sm text-accent-300 font-semibold'>₱{formatPrice(order.totalAmount)}</div>
								{canAskForUpdate && (
									<button
										type='button'
										onClick={() =>
											handleAskSellerForUpdate({
												orderId: order.orderId,
												shopId: firstOpenItem.shopId,
												shopName: firstOpenItem.shopName,
											})
										}
										className='inline-flex rounded bg-accent-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-accent-500'
									>
										Ask seller for update
									</button>
								)}
								<div className='text-xs text-gray-400'>Placed: {toDisplayDate(order.createdAt)}</div>
							</div>

							<div className='divide-y divide-gray-700'>
								{(order.items || []).map((item) => {
									const status = String(item.fulfillmentStatus || "processing").toLowerCase();
									const currentStepIndex = STATUS_STEPS.indexOf(status);
									return (
										<div key={`${order.orderId}:${item.productId}`} className='px-4 py-4'>
											<div className='grid gap-4 md:grid-cols-[minmax(220px,1fr)_130px_130px_1fr] md:items-center'>
												<div className='flex items-center gap-3 min-w-0'>
													<div className='h-14 w-14 shrink-0 rounded-md border border-gray-700 bg-gray-900 overflow-hidden'>
														{item.productImage ? (
															<img src={item.productImage} alt={item.productName} className='h-full w-full object-cover' />
														) : (
															<div className='h-full w-full flex items-center justify-center text-gray-500'>
																<Package size={15} />
															</div>
														)}
													</div>
													<div className='min-w-0'>
														<p className='truncate text-sm font-semibold text-white'>{item.productName}</p>
														<p className='text-xs text-gray-400'>Qty {item.quantity}</p>
													</div>
												</div>

												<div className='text-sm text-accent-300 font-semibold'>₱{formatPrice(item.price)}</div>

												<div>
													<span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
														{STATUS_LABELS[status] || status}
													</span>
													<p className='mt-1 text-[11px] text-gray-500'>Updated: {toDisplayDate(item.fulfillmentUpdatedAt)}</p>
												</div>

												<div>
													<div className='mb-1 -mt-1 flex items-center justify-between gap-2'>
														<div className='flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-gray-500'>
															<Truck size={12} /> Fulfillment progress
														</div>
													</div>
													<div className='grid grid-cols-3 gap-2'>
														{STATUS_STEPS.map((step, index) => {
															const active = status === "cancelled" ? false : index <= (currentStepIndex < 0 ? 0 : currentStepIndex);
															return (
																<div
																	key={step}
																	className={`rounded px-2 py-1 text-center text-[10px] font-semibold ${
																		active ? "bg-accent-600 text-white" : "bg-gray-700 text-gray-400"
																	}`}
																>
																	{STATUS_LABELS[step]}
																</div>
															);
														})}
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
						);
					})
				)}
			</div>
		</div>
	);
};

export default OrdersPage;
