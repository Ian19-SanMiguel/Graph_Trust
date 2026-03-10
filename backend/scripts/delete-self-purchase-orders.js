#!/usr/bin/env node
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

dotenv.config();

const dryRun = process.argv.includes("--dry-run");

const run = async () => {
  try {
    await connectDB();

    const orders = await Order.find();
    const uniqueProductIds = [...new Set(
      orders.flatMap((order) => (order.products || []).map((item) => item?.product).filter(Boolean))
    )];

    const productDocs = await Promise.all(uniqueProductIds.map((id) => Product.findById(id)));
    const productOwnerMap = new Map();

    for (let i = 0; i < uniqueProductIds.length; i += 1) {
      const productDoc = productDocs[i];
      productOwnerMap.set(uniqueProductIds[i], productDoc?.shopId || "");
    }

    const targetOrders = orders.filter((order) => {
      const buyerId = String(order.user || "");
      if (!buyerId) return false;

      return (order.products || []).some((item) => {
        const ownerId = String(productOwnerMap.get(item?.product) || "");
        return ownerId && ownerId === buyerId;
      });
    });

    if (targetOrders.length === 0) {
      console.log("No self-purchase orders found.");
      process.exit(0);
    }

    if (dryRun) {
      console.log(`[DRY RUN] Found ${targetOrders.length} self-purchase orders:`);
      targetOrders.forEach((order) => console.log(`- ${order._id} (buyer: ${order.user})`));
      process.exit(0);
    }

    for (const order of targetOrders) {
      await Order.findByIdAndDelete(order._id);
    }

    console.log(`Deleted ${targetOrders.length} self-purchase orders.`);
    targetOrders.forEach((order) => console.log(`- ${order._id} (buyer: ${order.user})`));
    process.exit(0);
  } catch (error) {
    console.error("Error deleting self-purchase orders:", error);
    process.exit(1);
  }
};

run();
