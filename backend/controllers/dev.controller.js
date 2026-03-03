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
    // fetch all products and delete them
    const products = await Product.find();
    let deleted = 0;
    for (const p of products) {
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
