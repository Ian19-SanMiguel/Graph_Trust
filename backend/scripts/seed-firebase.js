#!/usr/bin/env node
import dotenv from "dotenv";
import seedProducts from "../utils/seeder.js";

dotenv.config();

const run = async () => {
  try {
    console.log("Seeding Firestore with fake products...");
    const created = await seedProducts({ perCategory: 12 });
    console.log(`Created ${created.length} products.`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

run();
