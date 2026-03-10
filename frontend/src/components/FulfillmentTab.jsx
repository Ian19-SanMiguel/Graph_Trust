import { useEffect, useMemo, useState } from "react";
import { PackageCheck, RefreshCcw, Truck } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";
import { formatPrice } from "../lib/price";
import { useUserStore } from "../stores/useUserStore";

const DISPLAY_STATUS_LABEL = {
	processing: "Processing",
	shipping: "Shipping",
	delivered: "Delivered",
	cancelled: "Cancelled",
};

const toDateTime = (value) => {
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

const FulfillmentTab = () => {
	const { user } = useUserStore();
	const isAdmin = user?.role === "admin";
	const currentUserId = String(user?._id || "").trim();
	const [orders, setOrders] = useState([]);
	const [allowedStatuses, setAllowedStatuses] = useState(["processing", "shipping", "delivered", "cancelled"]);
	const [loading, setLoading] = useState(true);
	const [updatingKey, setUpdatingKey] = useState("");

	const orderItemsCount = useMemo(
		() => orders.reduce((total, order) => total + (order.items?.length || 0), 0),
		[orders]
	);

	const groupedOrders = useMemo(() => {
		if (!isAdmin) {
			return {
				mine: orders,
				others: [],
			};
		}

		const mine = [];
		const others = [];

		for (const order of orders) {
			const items = Array.isArray(order.items) ? order.items : [];
			const myItems = items.filter((item) => String(item.shopId || "").trim() === currentUserId);
			const otherItems = items.filter((item) => String(item.shopId || "").trim() !== currentUserId);

			if (myItems.length > 0) {
				mine.push({ ...order, items: myItems });
			}
			if (otherItems.length > 0) {
				others.push({ ...order, items: otherItems });
			}
		}

		return { mine, others };
	}, [orders, isAdmin, currentUserId]);

	const renderOrdersList = (ordersList) => (
		ordersList.map((order) => (
			<div key={order.orderId} className='rounded-lg border border-gray-700 bg-gray-800 overflow-hidden'>
				<div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 bg-gray-900/60 px-4 py-3'>
					<div className='text-sm text-gray-200'>
						<span className='font-semibold'>Order:</span> {order.orderId}
					</div>
					<div className='text-sm text-gray-400'>
						Created: {toDateTime(order.createdAt)}
					</div>
				</div>

				<div className='divide-y divide-gray-700'>
					{(order.items || []).map((item) => {
						const key = `${order.orderId}:${item.productId}`;
						const isUpdating = updatingKey === key;

						return (
							<div key={key} className='grid gap-4 px-4 py-4 md:grid-cols-[minmax(220px,1fr)_150px_170px_180px] md:items-center'>
								<div className='flex items-center gap-3 min-w-0'>
									<div className='h-12 w-12 rounded-md border border-gray-700 bg-gray-900 overflow-hidden shrink-0'>
										{item.productImage ? (
											<img src={item.productImage} alt={item.productName} className='h-full w-full object-cover' />
										) : (
											<div className='h-full w-full flex items-center justify-center text-gray-500'>
												<Truck size={15} />
											</div>
										)}
									</div>
									<div className='min-w-0'>
										<p className='truncate text-sm font-semibold text-white'>{item.productName}</p>
										<p className='text-xs text-gray-400'>Product ID: {item.productId}</p>
									</div>
								</div>

								<div className='text-sm text-gray-200'>
									Qty: <span className='font-semibold'>{item.quantity}</span>
								</div>

								<div className='text-sm text-accent-300 font-semibold'>₱{formatPrice(item.price)}</div>

								<div className='flex items-center gap-2'>
									<select
										value={item.fulfillmentStatus || "processing"}
										onChange={(event) =>
											handleStatusChange(order.orderId, item.productId, event.target.value)
										}
										disabled={isUpdating}
										className='rounded-md border border-gray-600 bg-gray-700 px-2 py-1.5 text-xs font-medium text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500'
									>
										{allowedStatuses.map((status) => (
											<option key={status} value={status}>
												{DISPLAY_STATUS_LABEL[status] || status}
											</option>
										))}
									</select>
									<p className='text-[10px] text-gray-500'>
										{toDateTime(item.fulfillmentUpdatedAt)}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		))
	);

	const fetchFulfillmentOrders = async ({ silent = false } = {}) => {
		try {
			if (!silent) {
				setLoading(true);
			}

			const res = await axios.get("/orders/fulfillment");
			setOrders(res.data?.orders || []);
			if (Array.isArray(res.data?.allowedStatuses) && res.data.allowedStatuses.length > 0) {
				setAllowedStatuses(res.data.allowedStatuses);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to load fulfillment orders");
		} finally {
			if (!silent) {
				setLoading(false);
			}
		}
	};

	useEffect(() => {
		fetchFulfillmentOrders();
	}, []);

	const handleStatusChange = async (orderId, productId, nextStatus) => {
		const updateKey = `${orderId}:${productId}`;
		try {
			setUpdatingKey(updateKey);
			await axios.patch(`/orders/${orderId}/items/${productId}/fulfillment`, { status: nextStatus });
			setOrders((prev) =>
				prev.map((order) => {
					if (order.orderId !== orderId) return order;
					return {
						...order,
						items: (order.items || []).map((item) => {
							if (item.productId !== productId) return item;
							return {
								...item,
								fulfillmentStatus: nextStatus,
								fulfillmentUpdatedAt: new Date().toISOString(),
							};
						}),
					};
				})
			);
			toast.success("Fulfillment status updated");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update status");
		} finally {
			setUpdatingKey("");
		}
	};

	if (loading) {
		return (
			<div className='mx-auto max-w-6xl rounded-lg border border-gray-700 bg-gray-800 p-8 text-center text-gray-300'>
				Loading fulfillment orders...
			</div>
		);
	}

	return (
		<div className='mx-auto max-w-6xl space-y-4'>
			<div className='rounded-lg border border-gray-700 bg-gray-800 p-4'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h2 className='text-xl font-semibold text-accent-300'>Order Fulfillment</h2>
						<p className='text-sm text-gray-400'>
							{orders.length} order{orders.length === 1 ? "" : "s"} · {orderItemsCount} item
							{orderItemsCount === 1 ? "" : "s"}
						</p>
					</div>
					<button
						type='button'
						onClick={() => fetchFulfillmentOrders({ silent: false })}
						className='inline-flex items-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600'
					>
						<RefreshCcw size={15} /> Refresh
					</button>
				</div>
			</div>

			{orders.length === 0 ? (
				<div className='rounded-lg border border-gray-700 bg-gray-800 p-10 text-center text-gray-300'>
					<PackageCheck className='mx-auto mb-3 h-8 w-8 text-accent-400' />
					No fulfillment items yet.
				</div>
			) : (
				<>
					{renderOrdersList(groupedOrders.mine)}

					{isAdmin && groupedOrders.others.length > 0 && groupedOrders.mine.length > 0 && (
						<div className='my-3 flex items-center gap-3'>
							<div className='h-px flex-1 bg-gray-700' />
							<p className='text-xs font-semibold uppercase tracking-[0.14em] text-gray-400'>
								Other Sellers' Orders
							</p>
							<div className='h-px flex-1 bg-gray-700' />
						</div>
					)}

					{isAdmin && renderOrdersList(groupedOrders.others)}
				</>
			)}
		</div>
	);
};

export default FulfillmentTab;
