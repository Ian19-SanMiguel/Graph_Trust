#!/usr/bin/env node
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

dotenv.config();

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || "Admin User";

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.js email password [name]");
  process.exit(1);
}

const run = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      console.error(`User already exists: ${email}`);
      process.exit(1);
    }

    const user = await User.create({ name, email, password, role: "admin" });

    console.log("Created admin user:");
    console.log(`  id: ${user._id}`);
    console.log(`  name: ${user.name}`);
    console.log(`  email: ${user.email}`);
    console.log(`  password: ${password} (plain text shown once)`);
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin user:", err);
    process.exit(1);
  }
};

run();
