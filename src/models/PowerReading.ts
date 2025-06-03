import { pool } from "../config/database";
import { PowerReading, PowerReadingInput } from "../types";

export class PowerReadingModel {
  static async create(
    deviceId: string,
    readingData: PowerReadingInput
  ): Promise<PowerReading> {
    const [result] = await pool.execute(
      `INSERT INTO power_readings 
       (device_id, voltage, current, power, energy, power_factor, frequency, temperature, humidity) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deviceId,
        readingData.voltage,
        readingData.current,
        readingData.power,
        readingData.energy,
        readingData.power_factor || null,
        readingData.frequency || null,
        readingData.temperature || null,
        readingData.humidity || null,
      ]
    );

    const insertResult = result as any;
    return this.findById(insertResult.insertId);
  }

  static async findById(id: number): Promise<PowerReading> {
    const [rows] = await pool.execute(
      "SELECT * FROM power_readings WHERE id = ?",
      [id]
    );

    const readings = rows as PowerReading[];
    if (readings.length === 0) {
      throw new Error("Power reading not found");
    }

    return readings[0];
  }

  static async findByDeviceId(
    deviceId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PowerReading[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM power_readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?",
      [deviceId, limit, offset]
    );

    return rows as PowerReading[];
  }

  static async findByDateRange(
    deviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PowerReading[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM power_readings WHERE device_id = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp ASC",
      [deviceId, startDate, endDate]
    );

    return rows as PowerReading[];
  }

  static async getLatestReading(
    deviceId: string
  ): Promise<PowerReading | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM power_readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1",
      [deviceId]
    );

    const readings = rows as PowerReading[];
    return readings.length > 0 ? readings[0] : null;
  }

  static async getAveragesByPeriod(
    deviceId: string,
    period: "hour" | "day" | "month",
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    let groupBy: string;
    let selectFormat: string;

    switch (period) {
      case "hour":
        groupBy = 'DATE_FORMAT(timestamp, "%Y-%m-%d %H")';
        selectFormat = 'DATE_FORMAT(timestamp, "%Y-%m-%d %H:00:00") as period';
        break;
      case "day":
        groupBy = "DATE(timestamp)";
        selectFormat = "DATE(timestamp) as period";
        break;
      case "month":
        groupBy = 'DATE_FORMAT(timestamp, "%Y-%m")';
        selectFormat = 'DATE_FORMAT(timestamp, "%Y-%m-01") as period';
        break;
      default:
        throw new Error("Invalid period");
    }

    const [rows] = await pool.execute(
      `
      SELECT 
        ${selectFormat},
        AVG(voltage) as avg_voltage,
        AVG(current) as avg_current,
        AVG(power) as avg_power,
        SUM(energy) as total_energy,
        COUNT(*) as reading_count,
        MIN(timestamp) as period_start,
        MAX(timestamp) as period_end
      FROM power_readings 
      WHERE device_id = ? AND timestamp BETWEEN ? AND ?
      GROUP BY ${groupBy}
      ORDER BY period
    `,
      [deviceId, startDate, endDate]
    );

    return rows as any[];
  }

  static async getEnergyConsumption(
    deviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ total_energy: number; avg_power: number; peak_power: number }> {
    const [rows] = await pool.execute(
      `
      SELECT 
        COALESCE(SUM(energy), 0) as total_energy,
        COALESCE(AVG(power), 0) as avg_power,
        COALESCE(MAX(power), 0) as peak_power
      FROM power_readings 
      WHERE device_id = ? AND timestamp BETWEEN ? AND ?
    `,
      [deviceId, startDate, endDate]
    );

    const result = rows as any[];
    return result[0];
  }

  static async deleteOldReadings(olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const [result] = await pool.execute(
      "DELETE FROM power_readings WHERE timestamp < ?",
      [cutoffDate]
    );

    const deleteResult = result as any;
    return deleteResult.affectedRows;
  }

  static async getDeviceReadingStats(deviceId: string): Promise<any> {
    const [rows] = await pool.execute(
      `
      SELECT 
        COUNT(*) as total_readings,
        MIN(timestamp) as first_reading,
        MAX(timestamp) as last_reading,
        AVG(power) as avg_power,
        MAX(power) as max_power,
        MIN(power) as min_power,
        SUM(energy) as total_energy
      FROM power_readings 
      WHERE device_id = ?
    `,
      [deviceId]
    );

    const result = rows as any[];
    return result[0];
  }

  static async getTodayStats(deviceId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [rows] = await pool.execute(
      `
      SELECT 
        COUNT(*) as readings_count,
        COALESCE(SUM(energy), 0) as total_energy,
        COALESCE(AVG(power), 0) as avg_power,
        COALESCE(MAX(power), 0) as peak_power,
        COALESCE(MIN(power), 0) as min_power,
        COALESCE(AVG(voltage), 0) as avg_voltage,
        COALESCE(AVG(current), 0) as avg_current
      FROM power_readings 
      WHERE device_id = ? AND timestamp >= ? AND timestamp < ?
    `,
      [deviceId, today, tomorrow]
    );

    const result = rows as any[];
    return result[0];
  }

  static async getRealtimeData(
    deviceId: string,
    minutes: number = 60
  ): Promise<PowerReading[]> {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutes);

    const [rows] = await pool.execute(
      "SELECT * FROM power_readings WHERE device_id = ? AND timestamp >= ? ORDER BY timestamp DESC",
      [deviceId, startTime]
    );

    return rows as PowerReading[];
  }
}
