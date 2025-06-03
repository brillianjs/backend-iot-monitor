export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: "admin" | "user";
  created_at: Date;
  updated_at: Date;
}

export interface Device {
  id: number;
  device_id: string;
  name: string;
  description?: string;
  location?: string;
  api_key: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PowerReading {
  id: number;
  device_id: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  power_factor?: number;
  frequency?: number;
  temperature?: number;
  humidity?: number;
  timestamp: Date;
}

export interface EnergyDaily {
  id: number;
  device_id: string;
  date: Date;
  total_energy: number;
  avg_power: number;
  max_power: number;
  min_power: number;
  total_cost: number;
  created_at: Date;
}

export interface Alert {
  id: number;
  device_id: string;
  alert_type:
    | "high_power"
    | "low_voltage"
    | "high_temperature"
    | "device_offline";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  is_resolved: boolean;
  created_at: Date;
  resolved_at?: Date;
}

export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PowerReadingInput {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  power_factor?: number;
  frequency?: number;
  temperature?: number;
  humidity?: number;
}

export interface DeviceStats {
  device_id: string;
  name: string;
  location?: string;
  is_active: boolean;
  latest_reading?: PowerReading;
  today_energy: number;
  today_cost: number;
  avg_power_today: number;
  alerts_count: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface EnergyReport {
  device_id: string;
  period: string;
  total_energy: number;
  total_cost: number;
  avg_power: number;
  peak_power: number;
  readings_count: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      device?: Device;
    }
  }
}
