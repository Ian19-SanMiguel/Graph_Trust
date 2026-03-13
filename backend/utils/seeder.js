import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";
import { ChatConversation, ChatMessage } from "../models/chat.model.js";
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
const randInt = (min, max) => faker.number.int({ min, max });

const CATEGORY_IMAGE_QUERIES = {
    jeans: ["jeans", "denim", "blue-jeans", "streetwear"],
    "t-shirts": ["tshirt", "tee", "cotton-shirt", "casual-shirt"],
    shoes: ["sneakers", "shoes", "boots", "running-shoes"],
    glasses: ["eyewear", "glasses", "sunglasses", "frames"],
    jackets: ["jacket", "outerwear", "bomber-jacket", "coat"],
    suits: ["suit", "blazer", "formalwear", "tailored-suit"],
    bags: ["backpack", "tote-bag", "handbag", "messenger-bag"],
};

const REVIEW_SNIPPETS = [
    "Great quality for the price.",
    "Exactly what I expected.",
    "Fast shipping and clean packaging.",
    "Seller answered quickly and was helpful.",
    "Will buy again from this shop.",
    "Material feels premium.",
    "Sizing and fit were accurate.",
    "Looks even better in person.",
];

const buildCategoryImage = (category, index) => {
    const queries = CATEGORY_IMAGE_QUERIES[category] || [category];
    const primary = rand(queries);
    const secondary = rand(queries);
    const query = `${primary},${secondary}`;
    return `https://loremflickr.com/800/800/${encodeURIComponent(query)}?lock=${encodeURIComponent(`${category}-${index}`)}`;
};

const buildSeedShops = (count) =>
    Array.from({ length: count }).map((_, index) => ({
        shopId: `seed-shop-${index + 1}`,
        shopName: `${faker.company.name().split(" ")[0]} Shop`,
        responseBias: randInt(55, 98),
    }));

const buildSeedBuyers = (count) =>
    Array.from({ length: count }).map((_, index) => ({
        userId: `seed-buyer-${index + 1}`,
        userName: faker.person.fullName(),
    }));

const fillTemplate = (template, ctx) => {
    return template.replace(/\{(.*?)\}/g, (_, key) => ctx[key] ?? "");
};

export const seedProducts = async ({ perCategory = 12, shopCount = 8 } = {}) => {
    await connectDB();
    const created = [];
	const shops = buildSeedShops(Math.max(1, shopCount));
    const buyers = buildSeedBuyers(Math.max(20, perCategory * 2));

    const productsByShop = new Map();

    for (const category of CATEGORIES) {
        const cfg = CONFIG[category];
        const [minPrice, maxPrice] = cfg.price;

        for (let i = 0; i < perCategory; i++) {
			const shop = rand(shops);
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
            const image = buildCategoryImage(category, i);
            const isFeatured = Math.random() < 0.12;

            const product = await Product.create({
                name,
                description,
                price,
                image,
                category,
                isFeatured,
				shopId: shop.shopId,
				shopName: shop.shopName,
                isSeeded: true,
                seedTag: "dev-seeder-v2",
            });

            created.push(product.toJSON());

            if (!productsByShop.has(shop.shopId)) {
                productsByShop.set(shop.shopId, []);
            }
            productsByShop.get(shop.shopId).push(product.toJSON());
        }
    }

    // Seed social proof signals used by storefront stats: reviews, sold count, followers, and response rate.
    for (const shop of shops) {
        const shopProducts = productsByShop.get(shop.shopId) || [];
        if (shopProducts.length === 0) {
            continue;
        }

        const engagedBuyers = new Set();

        for (const product of shopProducts) {
            const reviewCount = randInt(2, 10);
            const reviewers = faker.helpers.arrayElements(buyers, Math.min(reviewCount, buyers.length));

            for (const reviewer of reviewers) {
                const rating = rand([3, 3.5, 4, 4, 4.5, 5]);
                await Review.create({
                    productId: product._id,
                    userId: reviewer.userId,
                    userName: reviewer.userName,
                    rating,
                    comment: rand(REVIEW_SNIPPETS),
                    isSeeded: true,
                });
                engagedBuyers.add(reviewer.userId);
            }

            const orderCount = randInt(1, 6);
            const orderingBuyers = faker.helpers.arrayElements(buyers, Math.min(orderCount, buyers.length));

            for (const buyer of orderingBuyers) {
                const quantity = randInt(1, 3);
                const priceValue = Number(product.price || 0);
                await Order.create({
                    user: buyer.userId,
                    products: [
                        {
                            product: product._id,
                            quantity,
                            price: priceValue,
                            shopId: shop.shopId,
                            shopName: shop.shopName,
                        },
                    ],
                    totalAmount: Number((priceValue * quantity).toFixed(2)),
                    stripeSessionId: `seed-session-${faker.string.alphanumeric(12)}`,
                });
                engagedBuyers.add(buyer.userId);
            }
        }

        // Create conversations for response-rate signals. Some get seller replies, some remain unanswered.
        const buyerPool = Array.from(engagedBuyers).map((id) => {
            const found = buyers.find((buyer) => buyer.userId === id);
            return found || { userId: id, userName: "Buyer" };
        });
        const conversationsToCreate = Math.min(Math.max(4, buyerPool.length), 14);
        const chatBuyers = faker.helpers.arrayElements(buyerPool, conversationsToCreate);

        for (const chatBuyer of chatBuyers) {
            const conversationId = ChatConversation.buildConversationId({
                buyerId: chatBuyer.userId,
                shopId: shop.shopId,
            });

            const buyerMessage = rand([
                "Hi, is this available?",
                "Can you confirm the size details?",
                "How long is shipping?",
                "Do you have other colors?",
            ]);

            const shouldReply = Math.random() * 100 <= shop.responseBias;

            await ChatConversation.create({
                _id: conversationId,
                buyerId: chatBuyer.userId,
                shopId: shop.shopId,
                shopName: shop.shopName,
                participants: [chatBuyer.userId, shop.shopId],
                lastMessage: shouldReply ? "Yes, still available." : buyerMessage,
                lastMessageSenderId: shouldReply ? shop.shopId : chatBuyer.userId,
            });

            await ChatMessage.create({
                conversationId,
                senderId: chatBuyer.userId,
                senderName: chatBuyer.userName,
                text: buyerMessage,
            });

            if (shouldReply) {
                await ChatMessage.create({
                    conversationId,
                    senderId: shop.shopId,
                    senderName: shop.shopName,
                    text: rand([
                        "Yes, it's available.",
                        "Sure, I can help with that.",
                        "Yes, we can ship tomorrow.",
                        "Available in multiple sizes.",
                    ]),
                });
            }
        }
    }

    return created;
};

export default seedProducts;
