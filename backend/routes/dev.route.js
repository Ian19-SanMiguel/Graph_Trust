import express from "express";
import { seedHandler, clearProductsHandler } from "../controllers/dev.controller.js";

const router = express.Router();

// POST /api/dev/seed
router.post("/seed", seedHandler);
router.post("/clear-products", clearProductsHandler);

export default router;
