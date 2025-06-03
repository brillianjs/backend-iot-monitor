import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "iot_monitoring",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const pool = mysql.createPool(dbConfig);

export const createDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``
    );
    await connection.end();
    console.log(`Database ${dbConfig.database} created or already exists`);
  } catch (error) {
    console.error("Error creating database:", error);
    throw error;
  }
};

export const initializeTables = async () => {
  try {
    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Devices table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        location VARCHAR(100),
        api_key VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Power consumption readings table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS power_readings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL,
        voltage DECIMAL(8,2) NOT NULL,
        current DECIMAL(8,3) NOT NULL,
        power DECIMAL(10,3) NOT NULL,
        energy DECIMAL(12,3) NOT NULL,
        power_factor DECIMAL(4,3),
        frequency DECIMAL(6,2),
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
        INDEX idx_device_timestamp (device_id, timestamp),
        INDEX idx_timestamp (timestamp)
      )
    `);

    // Energy daily summary table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS energy_daily (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        total_energy DECIMAL(15,3) NOT NULL,
        avg_power DECIMAL(10,3) NOT NULL,
        max_power DECIMAL(10,3) NOT NULL,
        min_power DECIMAL(10,3) NOT NULL,
        total_cost DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_device_date (device_id, date),
        FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
      )
    `);

    // Alerts table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL,
        alert_type ENUM('high_power', 'low_voltage', 'high_temperature', 'device_offline') NOT NULL,
        message TEXT NOT NULL,
        severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        is_resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
        INDEX idx_device_unresolved (device_id, is_resolved),
        INDEX idx_created_at (created_at)
      )
    `);

    console.log("All tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
};

export default pool;
