import { Router } from "express";
import authRoutes from "./auth";
import deviceRoutes from "./devices";
import iotRoutes from "./iot";

const router = Router();

// API Routes
router.use("/auth", authRoutes);
router.use("/devices", deviceRoutes);
router.use("/iot", iotRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "IoT Monitoring API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
