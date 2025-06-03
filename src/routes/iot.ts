import { Router } from "express";
import {
  submitReading,
  getDeviceStatus,
  getConfiguration,
  healthCheck,
  bulkSubmitReadings,
} from "../controllers/iotController";
import { authenticateDevice, validateDeviceData } from "../middleware/auth";
import { deviceRateLimiter } from "../middleware/security";

const router = Router();

// All IoT routes require device authentication
router.use(authenticateDevice);
router.use(deviceRateLimiter);

// ESP32 endpoints
router.post("/readings", validateDeviceData, submitReading);
router.post("/readings/bulk", bulkSubmitReadings);
router.get("/status", getDeviceStatus);
router.get("/config", getConfiguration);
router.post("/health", healthCheck);

export default router;
