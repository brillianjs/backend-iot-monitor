# IoT Power Monitoring System - Backend API

Backend API untuk sistem monitoring penggunaan listrik menggunakan ESP32, Express.js, MySQL, dan autentikasi JWT.

## 🚀 Fitur Utama

- **Autentikasi JWT** - Sistem login dan registrasi pengguna
- **Management Device** - Registrasi dan management ESP32 devices
- **Real-time Monitoring** - API untuk menerima data real-time dari ESP32
- **Dashboard API** - Endpoint untuk menampilkan statistik dan laporan
- **Security** - Rate limiting, CORS, dan validasi data
- **Database MySQL** - Penyimpanan data yang reliable dan scalable

## 📋 Prerequisites

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm atau yarn

## 🛠️ Installation

1. **Clone repository**

```bash
git clone <repository-url>
cd iot_sem6
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

Edit file `.env` sesuai konfigurasi Anda:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=iot_monitoring
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# API Keys and Security
API_KEY=your-esp32-api-key-change-this
CORS_ORIGIN=http://localhost:3000
```

4. **Setup database**

```bash
# Login ke MySQL dan buat database
mysql -u root -p
CREATE DATABASE iot_monitoring;
```

5. **Build dan jalankan aplikasi**

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 🗂️ Struktur Database

### Tables

#### `users`

- `id` - Primary key
- `username` - Username unik
- `email` - Email unik
- `password` - Password ter-hash
- `role` - Role user (admin/user)
- `created_at`, `updated_at` - Timestamps

#### `devices`

- `id` - Primary key
- `device_id` - Device ID unik dari ESP32
- `name` - Nama device
- `description` - Deskripsi device
- `location` - Lokasi device
- `api_key` - API key untuk autentikasi ESP32
- `is_active` - Status aktif device
- `created_at`, `updated_at` - Timestamps

#### `power_readings`

- `id` - Primary key
- `device_id` - Foreign key ke devices
- `voltage` - Tegangan (V)
- `current` - Arus (A)
- `power` - Daya (W)
- `energy` - Energi (kWh)
- `power_factor` - Faktor daya
- `frequency` - Frekuensi (Hz)
- `temperature` - Suhu (°C)
- `humidity` - Kelembaban (%)
- `timestamp` - Waktu pembacaan

#### `energy_daily`

- `id` - Primary key
- `device_id` - Foreign key ke devices
- `date` - Tanggal
- `total_energy` - Total energi harian
- `avg_power` - Rata-rata daya
- `max_power` - Daya maksimum
- `min_power` - Daya minimum
- `total_cost` - Estimasi biaya
- `created_at` - Timestamp

#### `alerts`

- `id` - Primary key
- `device_id` - Foreign key ke devices
- `alert_type` - Jenis alert
- `message` - Pesan alert
- `severity` - Tingkat severity
- `is_resolved` - Status resolved
- `created_at`, `resolved_at` - Timestamps

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint           | Description         | Auth Required |
| ------ | ------------------ | ------------------- | ------------- |
| POST   | `/register`        | Register user baru  | ❌            |
| POST   | `/login`           | Login user          | ❌            |
| GET    | `/profile`         | Get user profile    | ✅ JWT        |
| PUT    | `/profile`         | Update user profile | ✅ JWT        |
| PUT    | `/change-password` | Ganti password      | ✅ JWT        |

### Device Management (`/api/devices`)

| Method | Endpoint                  | Description           | Auth Required  |
| ------ | ------------------------- | --------------------- | -------------- |
| GET    | `/`                       | List semua devices    | ✅ JWT         |
| POST   | `/`                       | Buat device baru      | ✅ JWT (Admin) |
| GET    | `/:id`                    | Get device by ID      | ✅ JWT         |
| PUT    | `/:id`                    | Update device         | ✅ JWT (Admin) |
| DELETE | `/:id`                    | Delete device         | ✅ JWT (Admin) |
| PATCH  | `/:id/toggle-status`      | Toggle device status  | ✅ JWT (Admin) |
| POST   | `/:id/regenerate-api-key` | Generate API key baru | ✅ JWT (Admin) |
| GET    | `/:id/readings`           | Get readings device   | ✅ JWT         |
| GET    | `/:id/stats`              | Get statistik device  | ✅ JWT         |

### ESP32 IoT Endpoints (`/api/iot`)

| Method | Endpoint         | Description              | Auth Required |
| ------ | ---------------- | ------------------------ | ------------- |
| POST   | `/readings`      | Submit power reading     | ✅ API Key    |
| POST   | `/readings/bulk` | Submit multiple readings | ✅ API Key    |
| GET    | `/status`        | Get device status        | ✅ API Key    |
| GET    | `/config`        | Get device configuration | ✅ API Key    |
| POST   | `/health`        | Health check             | ✅ API Key    |

### Health Check

| Method | Endpoint      | Description       |
| ------ | ------------- | ----------------- |
| GET    | `/api/health` | API health check  |
| GET    | `/`           | API documentation |

## 🔐 Authentication

### JWT Authentication (Web/Dashboard)

```bash
Authorization: Bearer <jwt_token>
```

### API Key Authentication (ESP32)

```bash
x-api-key: <device_api_key>
```

## 📊 Data Format ESP32

### Submit Reading

```json
POST /api/iot/readings
Content-Type: application/json
x-api-key: <device_api_key>

{
  "voltage": 220.5,
  "current": 2.35,
  "power": 518.175,
  "energy": 0.518,
  "power_factor": 0.95,
  "frequency": 50.0,
  "temperature": 28.5,
  "humidity": 65.2
}
```

### Bulk Submit

```json
POST /api/iot/readings/bulk
Content-Type: application/json
x-api-key: <device_api_key>

{
  "readings": [
    {
      "voltage": 220.5,
      "current": 2.35,
      "power": 518.175,
      "energy": 0.518
    },
    // ... more readings
  ]
}
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests/15 menit untuk web API, 60 requests/menit untuk ESP32
- **CORS**: Configured untuk domain yang diizinkan
- **Helmet**: Security headers
- **Input Validation**: Validasi dan sanitasi semua input
- **Password Hashing**: bcrypt dengan salt rounds 12
- **JWT Expiration**: Token expired setelah 7 hari

## 🔧 Development Scripts

```bash
# Development dengan hot reload
npm run dev

# Build production
npm run build

# Start production server
npm start

# Watch mode untuk TypeScript
npm run watch

# Clean build directory
npm run clean
```

## 📝 Environment Variables

| Variable            | Description                 | Default                 |
| ------------------- | --------------------------- | ----------------------- |
| `PORT`              | Server port                 | `3000`                  |
| `NODE_ENV`          | Environment mode            | `development`           |
| `DB_HOST`           | MySQL host                  | `localhost`             |
| `DB_PORT`           | MySQL port                  | `3306`                  |
| `DB_NAME`           | Database name               | `iot_monitoring`        |
| `DB_USER`           | Database user               | `root`                  |
| `DB_PASSWORD`       | Database password           | ``                      |
| `JWT_SECRET`        | JWT secret key              | _required_              |
| `JWT_EXPIRE`        | JWT expiration              | `7d`                    |
| `CORS_ORIGIN`       | CORS origin                 | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | `15`                    |
| `RATE_LIMIT_MAX`    | Rate limit max requests     | `100`                   |

## 🚀 Deployment

1. **Setup production environment**
2. **Build aplikasi**: `npm run build`
3. **Setup database** dengan credentials production
4. **Setup environment variables** untuk production
5. **Start aplikasi**: `npm start`

## 📄 License

ISC License

## 👥 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request
