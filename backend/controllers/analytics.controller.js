import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

const toDate = (value) => {
	if (!value) return null;
	if (value instanceof Date) return value;
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	if (typeof value?.seconds === "number") {
		return new Date(value.seconds * 1000);
	}
	if (typeof value?.toDate === "function") {
		const parsed = value.toDate();
		return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
	}
	return null;
};

export const getAnalyticsData = async () => {
	try {
		const users = await User.find({});
		const products = await Product.find({});
		const orders = await Order.find({});

		const totalUsers = users.length;
		const totalProducts = products.length;
		const totalSales = orders.length;
		const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

		return {
			users: totalUsers,
			products: totalProducts,
			totalSales,
			totalRevenue,
		};
	} catch (error) {
		console.error("Error fetching analytics data:", error);
		throw error;
	}
};

export const getDailySalesData = async (startDate, endDate) => {
	try {
		const orders = await Order.find({});

		// Filter orders within the date range
		const filteredOrders = orders.filter((order) => {
			const orderDate = toDate(order.createdAt);
			if (!orderDate) return false;
			return orderDate >= startDate && orderDate <= endDate;
		});

		// Group by date
		const dailySalesMap = {};
		filteredOrders.forEach((order) => {
			const orderDate = toDate(order.createdAt);
			if (!orderDate) return;
			const dateStr = orderDate.toISOString().split("T")[0];
			if (!dailySalesMap[dateStr]) {
				dailySalesMap[dateStr] = { sales: 0, revenue: 0 };
			}
			dailySalesMap[dateStr].sales += 1;
			dailySalesMap[dateStr].revenue += order.totalAmount || 0;
		});

		// Get array of all dates in range
		const dateArray = getDatesInRange(startDate, endDate);

		// Map each date to data (0 if no data for that date)
		return dateArray.map((date) => {
			return {
				date,
				sales: dailySalesMap[date]?.sales || 0,
				revenue: dailySalesMap[date]?.revenue || 0,
			};
		});
	} catch (error) {
		console.error("Error fetching daily sales data:", error);
		throw error;
	}
};

function getDatesInRange(startDate, endDate) {	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}