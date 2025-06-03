import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET || "default-secret";
  const expiresIn = process.env.JWT_EXPIRE || "7d";

  // Use explicit object casting to avoid TypeScript overload issues
  const tokenPayload = {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    role: payload.role,
  };

  return jwt.sign(tokenPayload, secret, { expiresIn });
};

export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET || "default-secret";
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const generateApiKey = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const calculatePowerCost = (
  energyKWh: number,
  tariff: number = 0.12
): number => {
  return energyKWh * tariff;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const isValidDeviceId = (deviceId: string): boolean => {
  // Device ID should be alphanumeric and 8-32 characters
  const deviceIdRegex = /^[a-zA-Z0-9]{8,32}$/;
  return deviceIdRegex.test(deviceId);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, "");
};

export const getDateRange = (period: string): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
};

export const roundToTwoDecimals = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
