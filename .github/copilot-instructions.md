<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# IoT Power Monitoring System - Copilot Instructions

This is a TypeScript/Node.js project for an IoT power monitoring system using ESP32 devices, Express.js, and MySQL.

## Project Structure

- **Backend API**: Express.js with TypeScript
- **Database**: MySQL with connection pooling
- **Authentication**: JWT-based authentication system
- **IoT Integration**: REST API endpoints for ESP32 devices
- **Security**: Rate limiting, CORS, Helmet for security headers

## Key Technologies

- TypeScript
- Express.js
- MySQL2 (with promises)
- JWT (jsonwebtoken)
- bcryptjs for password hashing
- Helmet for security
- CORS middleware
- Express Rate Limit

## Development Guidelines

1. Always use TypeScript with proper type definitions
2. Use async/await for database operations
3. Implement proper error handling with try-catch blocks
4. Follow RESTful API conventions
5. Use proper HTTP status codes
6. Validate input data before processing
7. Use environment variables for configuration
8. Implement proper logging for debugging

## Database Schema

- **users**: Authentication and user management
- **devices**: ESP32 device registration and management
- **power_readings**: Real-time power consumption data
- **energy_daily**: Daily energy consumption summaries
- **alerts**: System alerts and notifications

## API Endpoints

- `/api/auth/*`: User authentication endpoints
- `/api/devices/*`: Device management endpoints (requires authentication)
- `/api/iot/*`: ESP32 device endpoints (requires API key authentication)

## Security Features

- JWT token-based authentication for web clients
- API key authentication for ESP32 devices
- Rate limiting for both web and IoT endpoints
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet

## Code Style

- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Group related functionality in separate files/modules
