import express from "express";
import {
	createProduct,
	deleteProduct,
	updateProduct,
	getAllProducts,
	getFeaturedProducts,
	getMyProducts,
	getProductsByShop,
	getMyStorefront,
	updateMyStorefront,
	getProductsByCategory,
	getRecommendedProducts,
	getProductById,
	toggleFeaturedProduct,
} from "../controllers/product.controller.js";
import {
	adminRoute,
	pendingOrHigherKycOrAdminRoute,
	protectRoute,
	requireMfaForPrivilegedRoute,
	sellerOrAdminRoute,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, requireMfaForPrivilegedRoute, adminRoute, getAllProducts);
router.get("/mine", protectRoute, requireMfaForPrivilegedRoute, sellerOrAdminRoute, getMyProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/shop/profile", protectRoute, requireMfaForPrivilegedRoute, pendingOrHigherKycOrAdminRoute, getMyStorefront);
router.put("/shop/profile", protectRoute, requireMfaForPrivilegedRoute, pendingOrHigherKycOrAdminRoute, updateMyStorefront);
router.get("/shop/:shopId", getProductsByShop);
router.get("/recommendations", getRecommendedProducts);
router.get("/:id", getProductById);
router.post("/", protectRoute, requireMfaForPrivilegedRoute, sellerOrAdminRoute, createProduct);
router.put("/:id", protectRoute, requireMfaForPrivilegedRoute, sellerOrAdminRoute, updateProduct);
router.patch("/:id", protectRoute, requireMfaForPrivilegedRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:id", protectRoute, requireMfaForPrivilegedRoute, sellerOrAdminRoute, deleteProduct);

export default router;
