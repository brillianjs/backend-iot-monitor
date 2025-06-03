import { Router } from "express";
import {
  createDevice,
  getAllDevices,
  getDevice,
  updateDevice,
  deleteDevice,
  toggleDeviceStatus,
  regenerateApiKey,
  getDeviceReadings,
  getDeviceStats,
} from "../controllers/deviceController";
import { authenticate, authorizeAdmin } from "../middleware/auth";

const router = Router();

// All device routes require authentication
router.use(authenticate);

// Device management routes
router.get("/", getAllDevices);
router.post("/", authorizeAdmin, createDevice);
router.get("/:id", getDevice);
router.put("/:id", authorizeAdmin, updateDevice);
router.delete("/:id", authorizeAdmin, deleteDevice);
router.patch("/:id/toggle-status", authorizeAdmin, toggleDeviceStatus);
router.post("/:id/regenerate-api-key", authorizeAdmin, regenerateApiKey);

// Device data routes
router.get("/:id/readings", getDeviceReadings);
router.get("/:id/stats", getDeviceStats);

export default router;
