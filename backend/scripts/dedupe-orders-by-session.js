#!/usr/bin/env node
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import Order from "../models/order.model.js";

dotenv.config();

const dryRun = process.argv.includes("--dry-run");

const toTimestamp = (value) => {
	if (!value) return 0;
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value).getTime();
		return Number.isFinite(parsed) ? parsed : 0;
	}
	if (typeof value?.seconds === "number") {
		return value.seconds * 1000;
	}
	if (typeof value?.toDate === "function") {
		const parsed = value.toDate().getTime();
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
};

const pickCanonicalOrder = (orders) => {
	return [...orders].sort((a, b) => {
		const diff = toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
		if (diff !== 0) return diff;
		return String(a._id || "").localeCompare(String(b._id || ""));
	})[0];
};

const run = async () => {
	try {
		await connectDB();
		const orders = await Order.find({});

		const groupedBySession = new Map();
		for (const order of orders) {
			const sessionId = String(order.stripeSessionId || "").trim();
			if (!sessionId) continue;
			if (!groupedBySession.has(sessionId)) {
				groupedBySession.set(sessionId, []);
			}
			groupedBySession.get(sessionId).push(order);
		}

		const sessionsWithDuplicates = [...groupedBySession.entries()].filter(([, groupedOrders]) => groupedOrders.length > 1);

		if (sessionsWithDuplicates.length === 0) {
			console.log("No duplicate orders found by stripeSessionId.");
			process.exit(0);
		}

		const toDelete = [];
		const summary = [];

		for (const [sessionId, groupedOrders] of sessionsWithDuplicates) {
			const keep = pickCanonicalOrder(groupedOrders);
			const remove = groupedOrders.filter((order) => String(order._id) !== String(keep._id));
			toDelete.push(...remove);
			summary.push({
				sessionId,
				keep: keep._id,
				remove: remove.map((order) => order._id),
			});
		}

		if (dryRun) {
			console.log(`[DRY RUN] Found ${sessionsWithDuplicates.length} duplicate payment sessions.`);
			for (const item of summary) {
				console.log(`- ${item.sessionId}: keep ${item.keep}, delete ${item.remove.join(", ")}`);
			}
			console.log(`[DRY RUN] Total duplicate orders to delete: ${toDelete.length}`);
			process.exit(0);
		}

		for (const order of toDelete) {
			await Order.findByIdAndDelete(order._id);
		}

		console.log(`Deduped ${sessionsWithDuplicates.length} payment sessions.`);
		console.log(`Deleted ${toDelete.length} duplicate orders.`);
		for (const item of summary) {
			console.log(`- ${item.sessionId}: kept ${item.keep}`);
		}

		process.exit(0);
	} catch (error) {
		console.error("Error deduping orders by stripe session:", error);
		process.exit(1);
	}
};

run();
