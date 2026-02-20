#!/usr/bin/env node
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-user.js user@example.com");
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

    user.role = "admin";
    await user.save();

    console.log(`Promoted ${email} to admin (id: ${user._id})`);
    process.exit(0);
  } catch (err) {
    console.error("Error promoting user:", err);
    process.exit(1);
  }
};

run();
