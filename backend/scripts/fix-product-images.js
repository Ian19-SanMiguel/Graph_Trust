#!/usr/bin/env node
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";

dotenv.config();

const IMAGE_QUERIES = {
  "jeans": "jeans,denim",
  "t-shirts": "tshirt,tee,t-shirt,graphic tee",
  "shoes": "shoes,sneakers,boots",
  "glasses": "glasses,sunglasses,eyewear",
  "jackets": "jacket,coat,bomber jacket,parka",
  "suits": "suit,tailored suit,blazer",
  "bags": "bag,backpack,tote,handbag"
};

const run = async () => {
  try {
    await connectDB();
    const products = await Product.find();
    let updated = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const img = p.image;
      const shouldFix = !img || img === "" || img.includes("picsum") || img.includes("placeholder");
      if (shouldFix) {
        const query = IMAGE_QUERIES[p.category] || p.category || "clothing";
        const newImage = `https://source.unsplash.com/600x600/?${encodeURIComponent(query)}`;
        p.image = newImage;
        await p.save();
        updated++;
        console.log(`Updated image for ${p._id} -> ${newImage}`);
      }
    }

    console.log(`Done. Products scanned: ${products.length}, images updated: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error("Error fixing product images:", err);
    process.exit(1);
  }
};

run();
