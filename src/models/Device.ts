import { pool } from "../config/database";
import { Device } from "../types";
import { generateApiKey } from "../utils/helpers";

export class DeviceModel {
  static async create(deviceData: {
    device_id: string;
    name: string;
    description?: string;
    location?: string;
  }): Promise<Device> {
    const apiKey = generateApiKey();

    const [result] = await pool.execute(
      "INSERT INTO devices (device_id, name, description, location, api_key) VALUES (?, ?, ?, ?, ?)",
      [
        deviceData.device_id,
        deviceData.name,
        deviceData.description || null,
        deviceData.location || null,
        apiKey,
      ]
    );

    const insertResult = result as any;
    return this.findById(insertResult.insertId);
  }

  static async findById(id: number): Promise<Device> {
    const [rows] = await pool.execute("SELECT * FROM devices WHERE id = ?", [
      id,
    ]);

    const devices = rows as Device[];
    if (devices.length === 0) {
      throw new Error("Device not found");
    }

    return devices[0];
  }

  static async findByDeviceId(deviceId: string): Promise<Device | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM devices WHERE device_id = ?",
      [deviceId]
    );

    const devices = rows as Device[];
    return devices.length > 0 ? devices[0] : null;
  }

  static async findByApiKey(apiKey: string): Promise<Device | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM devices WHERE api_key = ?",
      [apiKey]
    );

    const devices = rows as Device[];
    return devices.length > 0 ? devices[0] : null;
  }

  static async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<Device[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM devices ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    return rows as Device[];
  }

  static async findActive(): Promise<Device[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM devices WHERE is_active = true ORDER BY name"
    );

    return rows as Device[];
  }

  static async update(
    id: number,
    deviceData: Partial<Device>
  ): Promise<Device> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(deviceData).forEach(([key, value]) => {
      if (
        key !== "id" &&
        key !== "created_at" &&
        key !== "api_key" &&
        value !== undefined
      ) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      throw new Error("No valid fields to update");
    }

    values.push(id);

    await pool.execute(
      `UPDATE devices SET ${updates.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute("DELETE FROM devices WHERE id = ?", [
      id,
    ]);

    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }

  static async count(): Promise<number> {
    const [rows] = await pool.execute("SELECT COUNT(*) as count FROM devices");
    const result = rows as any[];
    return result[0].count;
  }

  static async toggleActive(id: number): Promise<Device> {
    await pool.execute(
      "UPDATE devices SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    return this.findById(id);
  }

  static async regenerateApiKey(id: number): Promise<Device> {
    const newApiKey = generateApiKey();

    await pool.execute(
      "UPDATE devices SET api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newApiKey, id]
    );

    return this.findById(id);
  }

  static async deviceIdExists(
    deviceId: string,
    excludeId?: number
  ): Promise<boolean> {
    let query = "SELECT id FROM devices WHERE device_id = ?";
    const params: any[] = [deviceId];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    const devices = rows as any[];
    return devices.length > 0;
  }

  static async getDeviceStats(deviceId: string): Promise<any> {
    const [rows] = await pool.execute(
      `
      SELECT 
        d.*,
        (SELECT COUNT(*) FROM alerts WHERE device_id = d.device_id AND is_resolved = false) as unresolved_alerts,
        (SELECT timestamp FROM power_readings WHERE device_id = d.device_id ORDER BY timestamp DESC LIMIT 1) as last_reading_time
      FROM devices d 
      WHERE d.device_id = ?
    `,
      [deviceId]
    );

    const devices = rows as any[];
    return devices.length > 0 ? devices[0] : null;
  }

  static async getDevicesWithLatestReadings(): Promise<any[]> {
    const [rows] = await pool.execute(`
      SELECT 
        d.*,
        pr.voltage,
        pr.current,
        pr.power,
        pr.energy,
        pr.timestamp as last_reading_time,
        (SELECT COUNT(*) FROM alerts WHERE device_id = d.device_id AND is_resolved = false) as unresolved_alerts
      FROM devices d
      LEFT JOIN (
        SELECT DISTINCT device_id,
          FIRST_VALUE(voltage) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as voltage,
          FIRST_VALUE(current) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as current,
          FIRST_VALUE(power) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as power,
          FIRST_VALUE(energy) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as energy,
          FIRST_VALUE(timestamp) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as timestamp
        FROM power_readings
      ) pr ON d.device_id = pr.device_id
      ORDER BY d.name
    `);

    return rows as any[];
  }
}
