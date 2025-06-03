# 🚀 SCOMS Backend - Order Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-black.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

A modern TypeScript-based order management system with intelligent warehouse allocation, dynamic pricing, and real-time inventory management.

## 📖 Overview

SCOMS (ScreenCloud Order Management System) is a production-ready backend service that handles device ordering with sophisticated business logic. It automatically selects optimal warehouses based on proximity and inventory, applies dynamic volume-based pricing, and provides comprehensive monitoring and observability.

**Core Capabilities:**
- Intelligent warehouse selection using geolocation algorithms
- Dynamic pricing with configurable volume discounts (5-20%)
- Real-time inventory management across multiple locations
- Production-grade monitoring, logging, and metrics
- RESTful APIs with interactive documentation
- Containerized deployment with Docker

## ✨ Key Features

- **🎯 Smart Warehouse Selection**: Automatically finds closest warehouse with available inventory using geolocation
- **💰 Dynamic Pricing Engine**: Volume-based discounts (5-20%) with configurable business rules
- **📊 Real-time Inventory**: Live stock tracking across multiple warehouses
- **🔧 Production Ready**: Complete monitoring stack with Prometheus, Grafana, and structured logging
- **🔒 Enterprise Security**: API key authentication with role-based permissions
- **📚 API Documentation**: Interactive Swagger/OpenAPI documentation
- **🐳 Docker Ready**: Full containerization with development and production configurations

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18+ with npm 9+
- **Docker** & Docker Compose
- **Git** for version control

### ⚡ Development Setup (Recommended)

```bash
# 1. Clone and install dependencies
git clone https://github.com/raju4789/scoms-backend.git
cd scoms-backend
npm ci

# 2. Start infrastructure services (PostgreSQL, Consul, Monitoring)
npm run docker:dev

# 3. Start application with hot reload
npm run dev:watch
```

### 🏭 Production Setup

```bash
# Start complete production environment
npm run docker:prod
```

### 🔗 Service URLs

**Development:**
- **API Server**: http://localhost:3000 (with hot reload)
- **API Documentation**: http://localhost:3000/api-docs
- **Grafana Dashboards**: http://localhost:3001 (admin/admin)
- **Consul Configuration**: http://localhost:8500/ui
- **PostgreSQL**: localhost:5432 (database: `scoms_dev`)

**Production:**
- **API Server**: http://localhost:3000
- **Monitoring Dashboard**: http://localhost:3001
- **Configuration Management**: http://localhost:8500/ui

## 🧪 Quick API Test

```bash
# Health check
curl http://localhost:3000/health

# Test order pricing with volume discount
curl -H "Authorization: Bearer scoms-frontend-key" \
     -H "Content-Type: application/json" \
     -d '{
       "deviceQuantity": 50,
       "customerLocation": {"latitude": 40.7128, "longitude": -74.0060}
     }' \
     http://localhost:3000/api/v1/orders/verify

# Create an actual order
curl -H "Authorization: Bearer scoms-frontend-key" \
     -H "Content-Type: application/json" \
     -d '{
       "deviceQuantity": 25,
       "customerLocation": {"latitude": 37.7749, "longitude": -122.4194}
     }' \
     http://localhost:3000/api/v1/orders

# List available warehouses
curl -H "Authorization: Bearer scoms-frontend-key" \
     http://localhost:3000/api/v1/warehouses
```

## 🏗️ Architecture Overview

SCOMS follows clean architecture principles with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Monitoring    │    │  Configuration  │
│  (Frontend/API) │    │   (Grafana)     │    │    (Consul)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express Middleware Layer                    │
│  Auth │ Validation │ Logging │ Metrics │ Error Handling        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  Order Service │ Warehouse Service │ Auth Service              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Repository Layer                             │
│  Order Repository │ Warehouse Repository                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

- **Repository Pattern**: Clean data access abstraction
- **Service Layer**: Business logic encapsulation
- **Middleware Pipeline**: Cross-cutting concerns (auth, logging, metrics)
- **Configuration as Code**: External configuration via Consul
- **Request Correlation**: End-to-end request tracing

## 🛠️ Technology Stack

**Backend Framework:**
- **TypeScript** 5.0+ - Type-safe development
- **Express.js** 4.18+ - Web application framework
- **Node.js** 18+ - Runtime environment

**Database & Storage:**
- **PostgreSQL** 15+ - Primary database with ACID compliance
- **TypeORM** - Object-relational mapping with decorators

**Configuration & Service Discovery:**
- **Consul** - Dynamic configuration management and service discovery
- **🔥 Hot Configuration Reload** - Real-time configuration updates without server restarts
  - Configuration changes apply instantly across all service instances
  - Zero-downtime updates for pricing rules, discount rates, and business logic
  - Live environment switching and feature flag management
  - Automatic configuration validation and rollback on errors

**Monitoring & Observability:**
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Data visualization and dashboards
- **Structured Logging** - JSON-formatted logs with correlation IDs

**Development & Deployment:**
- **Docker** & **Docker Compose** - Containerization
- **Jest** - Unit and integration testing
- **ESLint** - Code quality and consistency
- **Swagger/OpenAPI** - API documentation

## 🔐 Authentication & Security

### API Key Authentication

All API endpoints require authentication via API key in the Authorization header:

```bash
Authorization: Bearer scoms-frontend-key
```

### Available API Keys

- `scoms-frontend-key` - Frontend application access
- `scoms-admin-key` - Administrative operations
- `scoms-monitoring-key` - Monitoring and health checks

### Security Features

- **Request Rate Limiting** - Prevents API abuse
- **Input Validation** - Comprehensive request validation
- **SQL Injection Protection** - TypeORM parameterized queries
- **CORS Configuration** - Cross-origin request security
- **Security Headers** - Helmet.js security middleware

## 📊 API Documentation

### Core Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Service health check | ❌ |
| `GET` | `/api/v1/warehouses` | List all warehouses | ✅ |
| `POST` | `/api/v1/orders/verify` | Verify order pricing | ✅ |
| `POST` | `/api/v1/orders` | Create new order | ✅ |
| `GET` | `/api/v1/orders/:id` | Get order details | ✅ |

### Request/Response Examples

**Order Verification:**
```json
POST /api/v1/orders/verify
{
  "deviceQuantity": 50,
  "customerLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}

Response:
{
  "deviceQuantity": 50,
  "unitPrice": 150.00,
  "discount": 10.0,
  "subtotal": 6750.00,
  "shippingCost": 125.50,
  "totalPrice": 6875.50,
  "selectedWarehouse": {
    "id": "wh-001",
    "name": "New York Warehouse",
    "distance": 15.3
  }
}
```

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid device quantity",
    "details": ["Device quantity must be between 1 and 1000"]
  },
  "correlationId": "req-12345"
}
```

## 💰 Business Logic

### Dynamic Pricing Algorithm

Base device price: **$150** (configurable via Consul)

**Volume Discount Tiers:**
- 1-24 devices: **0%** discount
- 25-49 devices: **5%** discount
- 50-99 devices: **10%** discount
- 100-249 devices: **15%** discount
- 250+ devices: **20%** discount

### Warehouse Selection Logic

1. **Distance Calculation**: Uses Haversine formula for accurate geographic distance
2. **Inventory Check**: Verifies sufficient stock at each warehouse
3. **Optimal Selection**: Chooses nearest warehouse with adequate inventory
4. **Fallback Strategy**: Multi-warehouse allocation if needed

### Shipping Cost Calculation

- **Rate**: $0.01 per kg per km (configurable)
- **Device Weight**: 0.365kg per device
- **Cap**: Maximum 15% of order subtotal
- **Distance**: Great-circle distance between customer and warehouse

## 🧪 Testing Strategy

### Test Coverage

- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: API endpoints and database operations
- **Repository Tests**: Data access layer validation

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- orderService.test.ts
```

### Test Environment

Tests run against an in-memory SQLite database for fast execution and isolation.

## 🐳 Docker Configuration

### Development Environment

```bash
# Start development services
npm run docker:dev

# Services included:
# - PostgreSQL database
# - Consul configuration server
# - Prometheus metrics collection
# - Grafana dashboards
```

### Production Environment

```bash
# Start production environment
npm run docker:prod

# Additional production features:
# - Application container
# - Health checks
# - Resource limits
# - Restart policies
```

### Docker Commands

```bash
# View running containers
docker-compose ps

# View application logs
docker-compose logs scoms-app

# Restart specific service
docker-compose restart scoms-app

# Stop all services
docker-compose down
```

## 📈 Monitoring & Observability

### Metrics Collection

- **Application Metrics**: Request count, response time, error rates
- **Business Metrics**: Order volume, revenue, warehouse utilization
- **System Metrics**: CPU, memory, database connections

### Grafana Dashboards

Access Grafana at http://localhost:3001 (admin/admin)

**Available Dashboards:**
- **Application Overview**: Request metrics, error rates, response times
- **Business Intelligence**: Order trends, revenue analytics
- **System Health**: Resource utilization, database performance

### Logging

Structured JSON logs with correlation IDs for request tracing:

```json
{
  "timestamp": "2025-06-03T10:30:00.000Z",
  "level": "info",
  "message": "Order created successfully",
  "correlationId": "req-12345",
  "orderId": "ord-67890",
  "customerId": "cust-456",
  "totalPrice": 6875.50
}
```

## 🔧 Development Guide

### Local Development

```bash
# Install dependencies
npm ci

# Start development server with hot reload
npm run dev:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production
npm run build
```

### Environment Variables

Key configuration via Consul, but some local overrides available:

```bash
# Database connection (optional override)
DATABASE_URL=postgresql://user:pass@localhost:5432/scoms_dev

# Log level (optional)
LOG_LEVEL=debug

# Port (optional)
PORT=3000
```

## Project Structure

```
src/
├── config/                  # Configuration management
│   ├── consul.ts           # Consul integration
│   ├── data-source-consul.ts # Database config
│   └── swagger.ts          # API documentation
├── middleware/             # Express middleware
│   ├── auth.ts            # Authentication
│   ├── correlationId.ts   # Request tracing
│   ├── errorHandler.ts    # Error handling
│   ├── metrics.ts         # Prometheus metrics
│   ├── requestLogger.ts   # Structured logging
│   └── validation.ts      # Input validation
├── routes/                # API endpoints
│   ├── healthRoutes.ts    # Health checks
│   ├── orderRoutes.ts     # Order management
│   └── warehouseRoutes.ts # Warehouse operations
├── services/              # Business logic layer
│   ├── authService.ts     # Authentication logic
│   ├── orderService.ts    # Order processing
│   └── warehouseService.ts # Warehouse management
├── models/                # Database entities
│   ├── Order.ts          # Order entity
│   └── Warehouse.ts      # Warehouse entity
├── repositories/          # Data access layer
│   ├── orderRepository.ts # Order CRUD operations
│   └── warehouseRepository.ts # Warehouse operations
├── utils/                 # Utility functions
│   ├── orderUtils.ts     # Pricing algorithms
│   └── logger.ts         # Logging utilities
└── types/                 # TypeScript definitions
    ├── AuthTypes.ts      # Authentication types
    └── OrderServiceTypes.ts # Order types
```

## 🚀 Getting Started Checklist

- [ ] Install Node.js 18+ and Docker
- [ ] Clone the repository
- [ ] Run `npm ci` to install dependencies
- [ ] Start services with `npm run docker:dev`
- [ ] Start development server with `npm run dev:watch`
- [ ] Visit http://localhost:3000/api-docs for API documentation
- [ ] Test the API with the provided curl commands
- [ ] Check monitoring at http://localhost:3001

For detailed API documentation, visit the interactive Swagger UI at `/api-docs` when the server is running.

## 🚀 Future Enhancements

### 🧪 Integration Tests
- **Real Database Testing**: Integration testing with real database and external services
- **End-to-End API Testing**: Complete API testing scenarios covering full user workflows
- **Service Integration**: Testing interactions between all microservices and external dependencies

### 📊 Improve Test Coverage
- **Comprehensive Coverage**: Comprehensive test coverage improvements (target: 90%+)
- **Enhanced Test Suites**: Enhanced unit and integration test suites with better assertions
- **Code Quality Gates**: Automated coverage enforcement in CI/CD pipeline

### 🔐 Integrate Vault for Secrets
- **HashiCorp Vault**: HashiCorp Vault integration for centralized secrets management
- **Secret Rotation**: Secret rotation and management automation for enhanced security
- **Dynamic Secrets**: Dynamic database credentials and API key management

### 📈 Improve Grafana Dashboards
- **Business Metrics**: Enhanced Grafana dashboards with comprehensive business metrics
- **Stakeholder Templates**: Interactive dashboard templates for different stakeholders (operations, business, development)
- **Real-time Monitoring**: Real-time performance monitoring and intelligent alerting systems

### ⚡ Caching Implementation
- **Redis Integration**: Redis-based caching for high-frequency API endpoints
- **Cache Strategies**: Cache invalidation strategies for maintaining data consistency
- **Performance Optimization**: Response time optimization for frequently accessed data and warehouse lookups

**Contributing**: We welcome contributions! Check our [Contributing Guide](CONTRIBUTING.md) for development setup and submission guidelines.
