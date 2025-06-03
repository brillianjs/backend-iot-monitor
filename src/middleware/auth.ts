import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/helpers";
import { pool } from "../config/database";
import { User, Device } from "../types";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Get user from database
    const [rows] = await pool.execute(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [decoded.id]
    );

    const users = rows as User[];
    if (users.length === 0) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }
  next();
};

export const authenticateDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: "API key required",
      });
      return;
    }

    // Get device from database
    const [rows] = await pool.execute(
      "SELECT * FROM devices WHERE api_key = ? AND is_active = true",
      [apiKey]
    );

    const devices = rows as Device[];
    if (devices.length === 0) {
      res.status(401).json({
        success: false,
        message: "Invalid API key or device inactive",
      });
      return;
    }

    req.device = devices[0];
    next();
  } catch (error) {
    console.error("Device authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const validateDeviceData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { voltage, current, power, energy } = req.body;

  if (typeof voltage !== "number" || voltage < 0 || voltage > 500) {
    res.status(400).json({
      success: false,
      message: "Invalid voltage value (0-500V)",
    });
    return;
  }

  if (typeof current !== "number" || current < 0 || current > 100) {
    res.status(400).json({
      success: false,
      message: "Invalid current value (0-100A)",
    });
    return;
  }

  if (typeof power !== "number" || power < 0 || power > 50000) {
    res.status(400).json({
      success: false,
      message: "Invalid power value (0-50000W)",
    });
    return;
  }

  if (typeof energy !== "number" || energy < 0) {
    res.status(400).json({
      success: false,
      message: "Invalid energy value (must be >= 0)",
    });
    return;
  }

  next();
};
