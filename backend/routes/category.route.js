import express from "express";
import { createCategory, getCategories } from "../controllers/category.controller.js";
import { adminRoute, protectRoute, requireMfaForPrivilegedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", protectRoute, requireMfaForPrivilegedRoute, adminRoute, createCategory);

export default router;
