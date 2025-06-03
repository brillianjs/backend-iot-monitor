import { Request, Response } from "express";
import { PowerReadingModel } from "../models/PowerReading";
import { DeviceModel } from "../models/Device";
import { asyncHandler, roundToTwoDecimals } from "../utils/helpers";
import { ApiResponse, PowerReadingInput } from "../types";

export const submitReading = asyncHandler(
  async (req: Request, res: Response) => {
    const device = req.device!;
    const readingData: PowerReadingInput = req.body;

    // Round the values to appropriate decimal places
    const processedData: PowerReadingInput = {
      voltage: roundToTwoDecimals(readingData.voltage),
      current: roundToTwoDecimals(readingData.current * 1000) / 1000, // 3 decimal places for current
      power: roundToTwoDecimals(readingData.power * 1000) / 1000, // 3 decimal places for power
      energy: roundToTwoDecimals(readingData.energy * 1000) / 1000, // 3 decimal places for energy
      power_factor: readingData.power_factor
        ? roundToTwoDecimals(readingData.power_factor * 1000) / 1000
        : undefined,
      frequency: readingData.frequency
        ? roundToTwoDecimals(readingData.frequency)
        : undefined,
      temperature: readingData.temperature
        ? roundToTwoDecimals(readingData.temperature)
        : undefined,
      humidity: readingData.humidity
        ? roundToTwoDecimals(readingData.humidity)
        : undefined,
    };

    // Create power reading
    const reading = await PowerReadingModel.create(
      device.device_id,
      processedData
    );

    // Check for alerts (simple thresholds)
    const alerts = [];

    if (processedData.power > 5000) {
      // High power consumption > 5kW
      alerts.push({
        type: "high_power",
        message: `High power consumption detected: ${processedData.power}W`,
        severity: "high",
      });
    }

    if (processedData.voltage < 200 || processedData.voltage > 250) {
      // Voltage out of normal range
      alerts.push({
        type: "voltage_anomaly",
        message: `Voltage out of normal range: ${processedData.voltage}V`,
        severity: "medium",
      });
    }

    if (processedData.temperature && processedData.temperature > 60) {
      // High temperature
      alerts.push({
        type: "high_temperature",
        message: `High temperature detected: ${processedData.temperature}°C`,
        severity: "high",
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Reading submitted successfully",
      data: {
        reading_id: reading.id,
        timestamp: reading.timestamp,
        alerts: alerts.length > 0 ? alerts : undefined,
      },
    };

    res.status(201).json(response);
  }
);

export const getDeviceStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const device = req.device!;

    // Get latest reading
    const latestReading = await PowerReadingModel.getLatestReading(
      device.device_id
    );

    // Get today's stats
    const todayStats = await PowerReadingModel.getTodayStats(device.device_id);

    const response: ApiResponse = {
      success: true,
      message: "Device status retrieved successfully",
      data: {
        device: {
          id: device.device_id,
          name: device.name,
          location: device.location,
          is_active: device.is_active,
        },
        latest_reading: latestReading,
        today_stats: todayStats,
        server_time: new Date().toISOString(),
      },
    };

    res.json(response);
  }
);

export const getConfiguration = asyncHandler(
  async (req: Request, res: Response) => {
    const device = req.device!;

    // Configuration for ESP32
    const config = {
      reading_interval: 30, // seconds
      max_voltage: 250,
      min_voltage: 200,
      max_current: 50,
      max_power: 10000,
      temperature_threshold: 60,
      humidity_threshold: 90,
      server_endpoints: {
        submit_reading: `/api/iot/readings`,
        get_status: `/api/iot/status`,
        get_config: `/api/iot/config`,
      },
      alerts: {
        high_power_threshold: 5000,
        low_voltage_threshold: 200,
        high_voltage_threshold: 250,
        high_temperature_threshold: 60,
      },
    };

    const response: ApiResponse = {
      success: true,
      message: "Configuration retrieved successfully",
      data: {
        device_id: device.device_id,
        config,
        last_updated: new Date().toISOString(),
      },
    };

    res.json(response);
  }
);

export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  const device = req.device!;

  // Update device last seen timestamp (you might want to add this field to the database)
  // For now, we'll just return a health status

  const response: ApiResponse = {
    success: true,
    message: "Device health check successful",
    data: {
      device_id: device.device_id,
      status: "online",
      timestamp: new Date().toISOString(),
      server_status: "operational",
    },
  };

  res.json(response);
});

export const bulkSubmitReadings = asyncHandler(
  async (req: Request, res: Response) => {
    const device = req.device!;
    const { readings } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Readings array is required and must not be empty",
      });
    }

    if (readings.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Maximum 100 readings per bulk submission",
      });
    }

    const submittedReadings = [];
    const errors = [];

    for (let i = 0; i < readings.length; i++) {
      try {
        const readingData = readings[i];

        // Validate each reading
        if (
          typeof readingData.voltage !== "number" ||
          typeof readingData.current !== "number" ||
          typeof readingData.power !== "number" ||
          typeof readingData.energy !== "number"
        ) {
          errors.push({ index: i, error: "Invalid reading data format" });
          continue;
        }

        const processedData: PowerReadingInput = {
          voltage: roundToTwoDecimals(readingData.voltage),
          current: roundToTwoDecimals(readingData.current * 1000) / 1000,
          power: roundToTwoDecimals(readingData.power * 1000) / 1000,
          energy: roundToTwoDecimals(readingData.energy * 1000) / 1000,
          power_factor: readingData.power_factor
            ? roundToTwoDecimals(readingData.power_factor * 1000) / 1000
            : undefined,
          frequency: readingData.frequency
            ? roundToTwoDecimals(readingData.frequency)
            : undefined,
          temperature: readingData.temperature
            ? roundToTwoDecimals(readingData.temperature)
            : undefined,
          humidity: readingData.humidity
            ? roundToTwoDecimals(readingData.humidity)
            : undefined,
        };

        const reading = await PowerReadingModel.create(
          device.device_id,
          processedData
        );
        submittedReadings.push({
          index: i,
          reading_id: reading.id,
          timestamp: reading.timestamp,
        });
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const response: ApiResponse = {
      success: errors.length === 0,
      message: `Bulk submission completed. ${submittedReadings.length} readings submitted successfully.`,
      data: {
        submitted_count: submittedReadings.length,
        error_count: errors.length,
        submitted_readings: submittedReadings,
        errors: errors.length > 0 ? errors : undefined,
      },
    };

    res.status(errors.length === 0 ? 201 : 207).json(response); // 207 = Multi-Status
  }
);
