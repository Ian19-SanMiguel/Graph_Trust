import express from "express";
import { getReports, submitReport, updateReportStatus } from "../controllers/report.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, submitReport);
router.get("/", protectRoute, adminRoute, getReports);
router.patch("/:reportId/status", protectRoute, adminRoute, updateReportStatus);

export default router;
