#!/usr/bin/env node
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

dotenv.config();

const email = process.argv[2];
const role = process.argv[3] || "seller";
if (!email) {
  console.error("Usage: node scripts/promote-user.js user@example.com [seller|admin]");
  process.exit(1);
}

if (!["seller", "admin"].includes(role)) {
  console.error("Role must be either 'seller' or 'admin'");
  process.exit(1);
}

const run = async () => {
  try {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User not found for email: ${email}`);
      process.exit(1);
    }

    user.role = role;
    await user.save();

    console.log(`Updated ${email} role to ${role} (id: ${user._id})`);
    process.exit(0);
  } catch (err) {
    console.error("Error promoting user:", err);
    process.exit(1);
  }
};

run();
