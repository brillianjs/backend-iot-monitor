import express from "express";
import dotenv from "dotenv";
import { createDatabase, initializeTables } from "./config/database";
import routes from "./routes";
import {
  securityMiddleware,
  rateLimiter,
  errorHandler,
  notFound,
  requestLogger,
} from "./middleware/security";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(securityMiddleware);

// Request logging
app.use(requestLogger);

// Rate limiting
app.use("/api", rateLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "IoT Power Monitoring API",
    version: "1.0.0",
    description:
      "Backend API for ESP32-based power consumption monitoring system",
    endpoints: {
      auth: "/api/auth",
      devices: "/api/devices",
      iot: "/api/iot",
      health: "/api/health",
    },
    documentation: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile",
        updateProfile: "PUT /api/auth/profile",
        changePassword: "PUT /api/auth/change-password",
      },
      devices: {
        list: "GET /api/devices",
        create: "POST /api/devices",
        get: "GET /api/devices/:id",
        update: "PUT /api/devices/:id",
        delete: "DELETE /api/devices/:id",
        toggleStatus: "PATCH /api/devices/:id/toggle-status",
        regenerateApiKey: "POST /api/devices/:id/regenerate-api-key",
        readings: "GET /api/devices/:id/readings",
        stats: "GET /api/devices/:id/stats",
      },
      iot: {
        submitReading: "POST /api/iot/readings",
        bulkSubmit: "POST /api/iot/readings/bulk",
        status: "GET /api/iot/status",
        config: "GET /api/iot/config",
        health: "POST /api/iot/health",
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🔧 Initializing database...");
    await createDatabase();
    await initializeTables();
    console.log("✅ Database initialized successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log("");
      console.log("📡 ESP32 Endpoints:");
      console.log(`   POST http://localhost:${PORT}/api/iot/readings`);
      console.log(`   GET  http://localhost:${PORT}/api/iot/status`);
      console.log(`   GET  http://localhost:${PORT}/api/iot/config`);
      console.log("");
      console.log("🔐 Authentication Required Headers:");
      console.log("   Web API: Authorization: Bearer <token>");
      console.log("   ESP32 API: x-api-key: <device-api-key>");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server...");
  process.exit(0);
});

startServer();
