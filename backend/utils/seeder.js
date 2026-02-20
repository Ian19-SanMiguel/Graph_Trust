import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";
import { faker } from "@faker-js/faker";

const CATEGORIES = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];

const CONFIG = {
    "jeans": {
        templates: ["{fit} {wash} Jeans", "{brand} {fit} Denim", "{fit} Jeans - {finish}"],
        fits: ["Slim Fit", "Relaxed Fit", "Skinny", "Straight Leg", "Bootcut"],
        washes: ["Dark Wash", "Light Wash", "Distressed", "Rinse", "Vintage"],
        finishes: ["Ripped", "Raw Hem", "Cuffed", "Tapered"],
        price: [40, 150]
    },
    "t-shirts": {
        templates: ["{adjective} T-Shirt", "{brand} {style} Tee", "{material} {style} T-Shirt"],
        adjectives: ["Classic", "Vintage", "Graphic", "Essential", "Premium"],
        styles: ["Crew Neck", "V-Neck", "Long Sleeve", "Ringer", "Oversized"],
        materials: ["Cotton", "Organic Cotton", "Bamboo", "Modal"],
        price: [8, 60]
    },
    "shoes": {
        templates: ["{style} {type}", "{brand} {style} Shoes", "{style} Sneakers"],
        styles: ["Casual", "Running", "Leather", "Chelsea", "High-Top"],
        types: ["Sneakers", "Boots", "Loafers", "Trainers", "Sandals"],
        price: [30, 250]
    },
    "glasses": {
        templates: ["{style} Glasses", "{brand} {style} Frames", "{style} Sunglasses"],
        styles: ["Aviator", "Round", "Square", "Wayfarer", "Cat-Eye"],
        price: [20, 200]
    },
    "jackets": {
        templates: ["{style} Jacket", "{material} {style} Jacket", "{brand} {style} Outerwear"],
        styles: ["Bomber", "Denim", "Leather", "Parka", "Trench"],
        materials: ["Leather", "Denim", "Wool", "Synthetic"],
        price: [50, 350]
    },
    "suits": {
        templates: ["{style} Suit", "{brand} {style} Suit", "{fabric} {style} Suit"],
        styles: ["Two-Piece", "Three-Piece", "Slim Fit", "Tailored"],
        fabrics: ["Wool", "Cotton", "Linen", "Tweed"],
        price: [150, 700]
    },
    "bags": {
        templates: ["{style} Bag", "{brand} {style} Bag", "{material} {style} Tote"],
        styles: ["Tote", "Backpack", "Messenger", "Clutch", "Duffel"],
        materials: ["Leather", "Canvas", "Nylon"],
        price: [25, 400]
    }
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fillTemplate = (template, ctx) => {
    return template.replace(/\{(.*?)\}/g, (_, key) => ctx[key] ?? "");
};

export const seedProducts = async ({ perCategory = 12 } = {}) => {
    await connectDB();
    const created = [];

    for (const category of CATEGORIES) {
        const cfg = CONFIG[category];
        const [minPrice, maxPrice] = cfg.price;

        for (let i = 0; i < perCategory; i++) {
            const brand = faker.company.name().split(' ')[0];
            const ctx = {
                brand,
                fit: rand(cfg.fits ?? []),
                wash: rand(cfg.washes ?? []),
                finish: rand(cfg.finishes ?? []),
                adjective: rand(cfg.adjectives ?? []),
                style: rand(cfg.styles ?? []),
                material: rand(cfg.materials ?? []) || rand(cfg.fabrics ?? []),
                type: rand(cfg.types ?? []),
                fabric: rand(cfg.fabrics ?? [])
            };

            const template = rand(cfg.templates);
            const name = fillTemplate(template, ctx).trim();

            const description = faker.lorem.paragraph();
            const price = parseFloat(faker.commerce.price(minPrice, maxPrice, 2));
            // category-specific image queries (Unsplash source)
            const IMAGE_QUERIES = {
                "jeans": "jeans,denim",
                "t-shirts": "tshirt,tee,t-shirt,graphic tee",
                "shoes": "shoes,sneakers,boots",
                "glasses": "glasses,sunglasses,eyewear",
                "jackets": "jacket,coat,bomber jacket,parka",
                "suits": "suit,tailored suit,blazer",
                "bags": "bag,backpack,tote,handbag"
            };
                        const image = `https://picsum.photos/seed/${encodeURIComponent(category + '-' + i)}/600/600`;
            const isFeatured = Math.random() < 0.12;

            const product = await Product.create({
                name,
                description,
                price,
                image,
                category,
                isFeatured,
            });

            created.push(product.toJSON());
        }
    }

    return created;
};

export default seedProducts;
