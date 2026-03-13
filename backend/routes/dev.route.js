import express from "express";
import { seedHandler, clearProductsHandler, aiHealthHandler } from "../controllers/dev.controller.js";

const router = express.Router();

// POST /api/dev/seed
router.post("/seed", seedHandler);
router.post("/clear-fake-products", clearProductsHandler);
router.post("/clear-products", clearProductsHandler);
router.get("/ai-health", aiHealthHandler);

export default router;
