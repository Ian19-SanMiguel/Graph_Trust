import seedProducts from "../utils/seeder.js";

import Product from "../models/product.model.js";

export const seedHandler = async (req, res) => {
  try {
    // defensively handle missing body or missing perCategory
    const perCategory = parseInt(req.body?.perCategory ?? 12, 10) || 12;
    const created = await seedProducts({ perCategory });
    return res.json({ success: true, createdCount: created.length });
  } catch (err) {
    console.error("/api/dev/seed error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const clearProductsHandler = async (req, res) => {
  try {
    // Delete products created by current and legacy dev seeders.
    const products = await Product.find({});
    const seededProducts = products.filter((product) => {
      const shopId = String(product?.shopId || "").trim().toLowerCase();
      const seedTag = String(product?.seedTag || "").trim().toLowerCase();
      const image = String(product?.image || "").trim().toLowerCase();

      return (
        Boolean(product?.isSeeded) ||
        shopId.startsWith("seed-shop-") ||
        seedTag.startsWith("dev-seeder") ||
        image.includes("picsum.photos/seed/") ||
        image.includes("loremflickr.com")
      );
    });

    let deleted = 0;
    for (const p of seededProducts) {
      if (p._id) {
        await Product.findByIdAndDelete(p._id);
        deleted++;
      }
    }
    return res.json({ success: true, deletedCount: deleted });
  } catch (err) {
    console.error("/api/dev/clear-products error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const aiHealthHandler = async (req, res) => {
  try {
    const response = await fetch("http://localhost:8000/trust/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "dev-health-check" }),
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "AI engine responded with non-OK status",
        status: response.status,
      });
    }

    const data = await response.json();
    return res.json({ success: true, aiReachable: true, data });
  } catch (err) {
    return res.status(502).json({ success: false, aiReachable: false, message: err.message });
  }
};

export default { seedHandler };
