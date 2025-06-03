# Database Setup Guide

This guide explains how to set up the MySQL database for the IoT Electricity Monitoring System.

## Quick Setup

### Option 1: Complete Setup (Recommended for Development)

```bash
mysql -u root -p < database_setup.sql
```

### Option 2: Simple Setup + Custom Data

```bash
# Basic tables only
mysql -u root -p < database_simple.sql

# Optional: Add test data
mysql -u root -p < database_seed.sql
```

## Database Schema

### Tables Overview

- **users**: System users (admin/user roles)
- **devices**: ESP32 device registration
- **power_readings**: Real-time power consumption data
- **energy_daily**: Daily energy consumption summaries
- **alerts**: System alerts and notifications

## Default Accounts

### Admin User

- **Username**: `admin`
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: `admin`

**⚠️ Important**: Change the default admin password immediately in production!

## Sample API Keys

The seeding script creates these test devices with API keys:

- **ESP32_001** (Living Room): `ESP32_LIVE_ROOM_API_KEY_001`
- **ESP32_002** (Kitchen): `ESP32_KITCHEN_API_KEY_002`
- **ESP32_003** (Bedroom): `ESP32_BEDROOM_API_KEY_003`
- **ESP32_004** (Office): `ESP32_OFFICE_API_KEY_004`
- **ESP32_005** (Garage): `ESP32_GARAGE_API_KEY_005`

## Database Connection

Update your `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=iot_monitoring
DB_USER=root
DB_PASSWORD=your_mysql_password
```

## MySQL Installation

### macOS (Homebrew)

```bash
brew install mysql
brew services start mysql

# Secure installation (optional)
mysql_secure_installation
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation (optional)
sudo mysql_secure_installation
```

### Windows

Download and install MySQL from [MySQL Official Website](https://dev.mysql.com/downloads/mysql/)

## Verification

After setup, verify the installation:

```sql
USE iot_monitoring;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM power_readings;
```

## Maintenance

### Daily Energy Calculation

The system includes an automated daily energy calculation. To run manually:

```sql
CALL CalculateDailyEnergy('2025-06-03');
```

### Device Health Check

Check for offline devices:

```sql
CALL DeviceHealthCheck();
```

### Cleanup Old Data

Remove readings older than 30 days:

```sql
DELETE FROM power_readings
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## Troubleshooting

### Connection Issues

1. Ensure MySQL service is running
2. Check credentials in `.env` file
3. Verify MySQL is listening on port 3306
4. Check firewall settings

### Performance Optimization

1. Add indexes for frequently queried columns
2. Partition large tables by date
3. Archive old data regularly
4. Monitor query performance

### Common Errors

**Error 1045**: Access denied

- Check username/password
- Ensure user has proper permissions

**Error 2002**: Connection refused

- MySQL service not running
- Wrong host/port configuration

**Error 1049**: Database doesn't exist

- Run the setup script first
- Check database name in connection string

## Production Considerations

1. **Security**:

   - Change default passwords
   - Use strong, unique API keys
   - Enable SSL/TLS for connections
   - Restrict database access by IP

2. **Performance**:

   - Configure MySQL for your workload
   - Monitor resource usage
   - Set up proper backup procedures

3. **Monitoring**:

   - Enable MySQL slow query log
   - Monitor disk space
   - Set up automated backups

4. **Backup Strategy**:

   ```bash
   # Daily backup
   mysqldump -u root -p iot_monitoring > backup_$(date +%Y%m%d).sql

   # Automated backup script
   0 2 * * * /path/to/backup_script.sh
   ```
