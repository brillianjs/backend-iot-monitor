import { Request, Response } from "express";
import { DeviceModel } from "../models/Device";
import { PowerReadingModel } from "../models/PowerReading";
import {
  isValidDeviceId,
  sanitizeString,
  asyncHandler,
  getDateRange,
  calculatePowerCost,
} from "../utils/helpers";
import { ApiResponse } from "../types";

export const createDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { device_id, name, description, location } = req.body;

    // Validation
    if (!device_id || !name) {
      return res.status(400).json({
        success: false,
        message: "Device ID and name are required",
      });
    }

    if (!isValidDeviceId(device_id)) {
      return res.status(400).json({
        success: false,
        message: "Device ID must be alphanumeric and 8-32 characters long",
      });
    }

    // Check if device already exists
    const existingDevice = await DeviceModel.findByDeviceId(device_id);
    if (existingDevice) {
      return res.status(409).json({
        success: false,
        message: "Device ID already exists",
      });
    }

    // Create device
    const device = await DeviceModel.create({
      device_id,
      name: sanitizeString(name),
      description: description ? sanitizeString(description) : undefined,
      location: location ? sanitizeString(location) : undefined,
    });

    const response: ApiResponse = {
      success: true,
      message: "Device created successfully",
      data: device,
    };

    res.status(201).json(response);
  }
);

export const getAllDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const devices = await DeviceModel.getDevicesWithLatestReadings();
    const total = await DeviceModel.count();

    const response: ApiResponse = {
      success: true,
      message: "Devices retrieved successfully",
      data: {
        devices,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    };

    res.json(response);
  }
);

export const getDevice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deviceId = parseInt(id);

  if (isNaN(deviceId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid device ID",
    });
  }

  const device = await DeviceModel.findById(deviceId);
  const stats = await PowerReadingModel.getDeviceReadingStats(device.device_id);
  const todayStats = await PowerReadingModel.getTodayStats(device.device_id);

  const response: ApiResponse = {
    success: true,
    message: "Device retrieved successfully",
    data: {
      ...device,
      stats: {
        ...stats,
        today: {
          ...todayStats,
          estimated_cost: calculatePowerCost(todayStats.total_energy),
        },
      },
    },
  };

  res.json(response);
});

export const updateDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deviceId = parseInt(id);
    const { name, description, location } = req.body;

    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID",
      });
    }

    const updateData: any = {};

    if (name) updateData.name = sanitizeString(name);
    if (description !== undefined)
      updateData.description = description ? sanitizeString(description) : null;
    if (location !== undefined)
      updateData.location = location ? sanitizeString(location) : null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const device = await DeviceModel.update(deviceId, updateData);

    const response: ApiResponse = {
      success: true,
      message: "Device updated successfully",
      data: device,
    };

    res.json(response);
  }
);

export const deleteDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deviceId = parseInt(id);

    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID",
      });
    }

    const deleted = await DeviceModel.delete(deviceId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Device deleted successfully",
    };

    res.json(response);
  }
);

export const toggleDeviceStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deviceId = parseInt(id);

    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID",
      });
    }

    const device = await DeviceModel.toggleActive(deviceId);

    const response: ApiResponse = {
      success: true,
      message: `Device ${
        device.is_active ? "activated" : "deactivated"
      } successfully`,
      data: device,
    };

    res.json(response);
  }
);

export const regenerateApiKey = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deviceId = parseInt(id);

    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID",
      });
    }

    const device = await DeviceModel.regenerateApiKey(deviceId);

    const response: ApiResponse = {
      success: true,
      message: "API key regenerated successfully",
      data: {
        device_id: device.device_id,
        api_key: device.api_key,
      },
    };

    res.json(response);
  }
);

export const getDeviceReadings = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const period = (req.query.period as string) || "today";

    const deviceId = parseInt(id);
    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID",
      });
    }

    const device = await DeviceModel.findById(deviceId);
    const { start, end } = getDateRange(period);

    const readings = await PowerReadingModel.findByDateRange(
      device.device_id,
      start,
      end
    );

    const response: ApiResponse = {
      success: true,
      message: "Device readings retrieved successfully",
      data: {
        device_id: device.device_id,
        device_name: device.name,
        period,
        date_range: { start, end },
        readings,
      },
    };

    res.json(response);
  }
);

export const getDeviceStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const period = (req.query.period as string) || "today";

    const deviceId = parseInt(id);
    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID",
      });
    }

    const device = await DeviceModel.findById(deviceId);
    const { start, end } = getDateRange(period);

    const energyStats = await PowerReadingModel.getEnergyConsumption(
      device.device_id,
      start,
      end
    );
    const todayStats = await PowerReadingModel.getTodayStats(device.device_id);

    const response: ApiResponse = {
      success: true,
      message: "Device statistics retrieved successfully",
      data: {
        device_id: device.device_id,
        device_name: device.name,
        period,
        stats: {
          ...energyStats,
          estimated_cost: calculatePowerCost(energyStats.total_energy),
        },
        today: {
          ...todayStats,
          estimated_cost: calculatePowerCost(todayStats.total_energy),
        },
      },
    };

    res.json(response);
  }
);
