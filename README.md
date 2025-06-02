# 🚀 SCOMS Backend - ScreenCloud Order Management System

## Project Overview

The **ScreenCloud Order Management System (SCOMS) Backend** is a production-ready, enterprise-grade microservice designed to handle complex order fulfillment workflows for device distribution. Built with modern TypeScript and Node.js, this system demonstrates advanced software engineering practices including microservices architecture, distributed configuration management, and comprehensive observability.

### What Makes SCOMS Special?

SCOMS showcases a sophisticated approach to order management with intelligent warehouse allocation, distance-based shipping calculations, and real-time pricing optimization. The system is designed for scalability, reliability, and maintainability - making it an excellent example of enterprise-level backend development.

**Key Business Logic:**
- 📦 **Smart Order Processing**: Automatically allocates orders across multiple warehouses based on inventory and location
- 💰 **Dynamic Pricing**: Implements tiered discount system (5%, 10%, 15%) with shipping cost optimization
- 🌍 **Geographic Intelligence**: Calculates shipping costs based on distance from nearest warehouses
- 🔄 **Real-time Inventory**: Tracks and updates warehouse stock levels across all facilities

---

## ✨ Key Features

### 🎯 Core Business Features
- **🛒 Advanced Order Management**
  - Multi-warehouse allocation algorithm
  - Real-time pricing calculation with bulk discounts
  - Distance-based shipping cost optimization
  - Order verification before submission

- **🏭 Intelligent Warehouse Management**
  - Geographic-based inventory tracking
  - Real-time stock level monitoring
  - Location-aware order fulfillment
  - Inventory allocation optimization

- **💵 Dynamic Pricing Engine**
  - Base price: $100 per device
  - Bulk discounts: 5% (10-24), 10% (25-49), 15% (50+)
  - Distance-based shipping calculations
  - 15% shipping cap on order total

### 🛡️ Enterprise Security & Operations
- **🔐 API Key Authentication**
  - Role-based permission system (`orders:read`, `orders:write`, `warehouses:*`)
  - Service-to-service authentication
  - Consul-managed API key configuration

- **⚙️ Advanced Configuration Management**
  - Consul-based centralized configuration
  - Hot-reload capabilities without service restart
  - Environment-specific configuration management

- **📊 Production-Ready Observability**
  - Prometheus metrics collection
  - Correlation ID request tracing
  - Structured logging with multiple levels
  - Health checks for Kubernetes deployment

### 🔧 Developer Experience
- **🧪 Comprehensive Testing**
  - Unit tests with Jest
  - Repository layer testing
  - High test coverage standards

- **📝 API Documentation**
  - Interactive Swagger/OpenAPI documentation
  - Request/response examples
  - Comprehensive endpoint documentation

- **🏗️ Modern Architecture**
  - Clean architecture with separation of concerns
  - TypeORM for database operations
  - Express.js with TypeScript
  - Docker containerization

---

## Table of Contents
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Consul Setup](#database--consul-setup)
- [Running the Application](#running-the-application)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Configuration Management](#configuration-management)
- [Development](#development)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Observability](#observability)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Future Enhancements](#future-enhancements)

---

## Tech Stack

### Core Technologies
- **Node.js** 18+ with TypeScript
- **Express.js** - Web framework
- **PostgreSQL** - Primary database with TypeORM
- **Consul** - Configuration management and service discovery
- **Jest** - Testing framework with comprehensive coverage

### Development & Operations
- **Docker & Docker Compose** - Containerization
- **ESLint & Prettier** - Code quality and formatting
- **Swagger/OpenAPI** - API documentation
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards
- **Loki** - Log aggregation

## Architecture

```
src/
├── index.ts                 # Main application entry point
├── config/                  # Configuration management
│   ├── consul.ts           # Consul service integration
│   ├── data-source-consul.ts # Database configuration via Consul
│   └── swagger.ts          # API documentation setup
├── middleware/              # Express middleware
│   ├── auth.ts             # API key authentication
│   ├── correlationId.ts    # Request correlation tracking
│   ├── errorHandler.ts     # Centralized error handling
│   ├── metrics.ts          # Prometheus metrics collection
│   ├── requestLogger.ts    # Request/response logging
│   └── validation.ts       # Input validation and sanitization
├── routes/                  # API route definitions
│   ├── healthRoutes.ts     # Health check endpoints
│   ├── orderRoutes.ts      # Order management APIs
│   └── warehouseRoutes.ts  # Warehouse management APIs
├── services/                # Business logic layer
│   ├── authService.ts      # Authentication service
│   ├── orderService.ts     # Order business logic
│   ├── warehouseService.ts # Warehouse business logic
│   └── errorMetricsService.ts # Error tracking and metrics
├── models/                  # TypeORM entity models
│   ├── Order.ts            # Order entity
│   └── Warehouse.ts        # Warehouse entity
├── repositories/            # Data access layer
│   ├── orderRepository.ts  # Order data operations
│   └── warehouseRepository.ts # Warehouse data operations
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions and helpers
└── errors/                  # Custom error definitions
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) 9+
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd scoms-backend

# Install dependencies
npm ci
```

## Environment Variables

Before running the application, you'll need to set up the following environment variables. You can create a `.env` file in the root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=scoms
DB_SSL=false

# Consul Configuration
CONSUL_HOST=localhost
CONSUL_PORT=8500

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Device Configuration (optional - defaults provided)
DEVICE_PRICE=150
DEVICE_WEIGHT_KG=0.365
SHIPPING_RATE_PER_KG_KM=0.01
SHIPPING_COST_THRESHOLD_PERCENT=0.15
```

## Database & Consul Setup

The SCOMS backend requires PostgreSQL and HashiCorp Consul to be running. These dependencies are managed through Docker Compose for easy setup and consistent environments.

**Services:**
- **PostgreSQL**: `localhost:5432`
- **Consul**: `localhost:8500` (UI available at http://localhost:8500/ui)

## Running the Application

### Development Mode
```bash
# Start dependencies
npm run docker:dev

# Start server with hot reload
npm run dev:watch

# Or start server without hot reload
npm run dev
```

### Production Mode
```bash
# Start all services including the application
npm run docker:prod
```

### Available Scripts
```bash
npm run dev              # Start in development mode
npm run dev:watch        # Start with hot reload
npm run build            # Compile TypeScript
npm start                # Start compiled application
npm run docker:dev       # Start dev dependencies
npm run docker:prod      # Start prod dependencies
npm run docker:down:dev  # Stop dev containers
npm run docker:down      # Stop prod containers
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
npm run lint:check       # Check code quality
npm run format:check     # Check code formatting
```

## Authentication

The SCOMS API uses API key authentication with role-based permissions.

### API Key Configuration
API keys are managed through Consul at the key `scoms/auth/config`. Default keys include:

- **Frontend Key**: `scoms-frontend-key`
  - Permissions: `orders:read`, `orders:write`, `warehouses:read`
- **Admin Key**: `scoms-admin-key`
  - Permissions: `*` (all operations)
- **Warehouse Service Key**: `scoms-warehouse-service-key`
  - Permissions: `warehouses:read`, `warehouses:write`, `orders:read`

### Using API Keys
Include the API key in the `Authorization` header:

```bash
# Using Bearer token
curl -H "Authorization: Bearer scoms-frontend-key" \
     http://localhost:3000/api/v1/orders

# Using x-api-key header
curl -H "x-api-key: scoms-frontend-key" \
     http://localhost:3000/api/v1/orders
```

### Permission Levels
- **orders:read** - View orders and verify pricing
- **orders:write** - Submit new orders
- **warehouses:read** - View warehouse information
- **warehouses:write** - Manage warehouse inventory
- **\*** - All permissions (admin access)

## API Endpoints

### Base URL
`http://localhost:3000/api/v1`

### Orders API
- `GET /orders` - List all orders (requires `orders:read`)
- `GET /orders/{id}` - Get specific order (requires `orders:read`)
- `POST /orders/verify` - Verify order pricing (requires `orders:read`)
- `POST /orders/submit` - Submit new order (requires `orders:write`)

### Warehouses API
- `GET /warehouses` - List all warehouses (requires `warehouses:read`)
- `GET /warehouses/{id}` - Get specific warehouse (requires `warehouses:read`)
- `POST /warehouses` - Create warehouse (requires `warehouses:write`)
- `PUT /warehouses/{id}` - Update warehouse (requires `warehouses:write`)
- `DELETE /warehouses/{id}` - Delete warehouse (requires `warehouses:write`)

### Health Endpoints
- `GET /health` - Basic health check
- `GET /health/detailed` - Comprehensive health check with dependencies
- `GET /ready` - Kubernetes readiness probe
- `GET /live` - Kubernetes liveness probe

### Monitoring
- `GET /metrics` - Prometheus metrics endpoint

### Order Pricing Logic
- **Base Price**: $150 per device (configurable via Consul)
- **Bulk Discounts**:
  - 25-49 devices: 5% discount
  - 50-99 devices: 10% discount
  - 100+ devices: 15% discount
- **Shipping**: Distance-based from nearest warehouse
- **Shipping Cap**: Maximum 15% of order total (after discount)

## Configuration Management

SCOMS uses Consul for centralized configuration management with hot-reload capabilities.

### Configuration Structure
```
scoms/
├── server/              # Server configuration
├── database/            # Database settings
├── auth/                # Authentication configuration
├── orders/              # Order processing settings
└── warehouses/          # Warehouse management settings
```

### Accessing Configuration
```bash
# View all SCOMS configuration
curl http://localhost:8500/v1/kv/scoms/?recurse

# View authentication configuration
curl http://localhost:8500/v1/kv/scoms/auth/config
```

## Development

### Project Structure
- **Routes**: API endpoint definitions with Swagger documentation
- **Services**: Business logic and domain operations
- **Repositories**: Data access layer with TypeORM
- **Middleware**: Cross-cutting concerns (auth, validation, logging)
- **Models**: TypeORM entities and database schema
- **Utils**: Helper functions and utilities

### Adding New Features
1. Define routes in `src/routes/`
2. Implement business logic in `src/services/`
3. Add data access in `src/repositories/`
4. Include comprehensive tests
5. Update API documentation

### Database Schema
The database schema is automatically managed through the Docker setup. The TypeORM entities (`Order` and `Warehouse`) define the schema structure, and the database is initialized when the containers start.

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm test -- --watch
```

### Test Structure
- **Unit Tests**: Individual function and method testing
- **Integration Tests**: API endpoint testing with mocked dependencies
- **Repository Tests**: Database operation testing
- **Route Tests**: HTTP endpoint testing with supertest
- **Service Tests**: Business logic and validation testing

### Test Coverage

The project maintains comprehensive test coverage across all modules:

| Module | Coverage | Status |
|--------|----------|--------|
| **Routes** | 100% | ✅ Excellent |
| **Models** | 100% | ✅ Excellent |
| **Repositories** | 95.74% | ✅ Very Good |
| **Utils** | 90.2% | ✅ Very Good |
| **Middleware** | 80.76% | ✅ Good |
| **Services** | 68.75% | ⚠️ Moderate |
| **Config** | 17.98% | ❌ Needs Improvement |

**Overall Coverage**: 69.62% statements, 52.96% branches, 65.8% functions

### Coverage Reports
- **HTML Report**: Open `coverage/lcov-report/index.html` for detailed visual coverage analysis
- **LCOV Format**: `coverage/lcov.info` for CI/CD integration
- **JSON Format**: `coverage/coverage-final.json` for programmatic access

## Code Quality

### Linting and Formatting
```bash
# Check code quality
npm run lint:check

# Fix linting issues
npm run lint

# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Quality Standards
- ESLint configuration with TypeScript support
- Prettier for consistent code formatting
- SonarCloud integration for continuous quality monitoring
- Comprehensive test coverage requirements

## Observability

### Monitoring Stack
The `observability/` directory contains configuration for:

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboards and visualization
- **Loki**: Log aggregation and search
- **Promtail**: Log shipping

### Custom Metrics
- HTTP request duration and count
- Error rates by category and severity
- Database connection health
- Consul connectivity status
- Active connections and resource usage

### Logging
Structured logging with correlation IDs for request tracing across services.

## API Documentation

### Swagger Documentation
Interactive API documentation is available at:
- **Development**: http://localhost:3000/api-docs
- **Production**: Configured based on deployment

### Request Examples
Sample HTTP requests are available in the `rest-client/` directory:
- `orders.http` - Order management examples
- `warehouses.http` - Warehouse management examples
- `health.http` - Health check examples

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database container
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

#### Consul Connection Issues
```bash
# Check Consul status
curl http://localhost:8500/v1/status/leader

# Restart Consul
docker-compose restart consul

# Access Consul UI
open http://localhost:8500/ui
```

#### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### Authentication Errors
- Verify API key in Consul: http://localhost:8500/ui/dc1/kv/scoms/auth/config
- Check API key format and permissions
- Ensure proper header format: `Authorization: Bearer your-api-key`

### Health Check Commands
```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed

# Readiness check
curl http://localhost:3000/ready
```

## Contributing

1. **Fork and Branch**: Create a feature branch from `main`
2. **Code Standards**: Follow ESLint and Prettier configurations
3. **Testing**: Add comprehensive tests for new features
4. **Documentation**: Update API documentation and README as needed
5. **Quality**: Ensure all quality checks pass before submitting PR

### Pull Request Process
1. Ensure CI/CD pipeline passes
2. Include comprehensive tests
3. Update documentation
4. Follow conventional commit messages
5. Request review from maintainers

### Development Guidelines
- Use TypeScript strict mode
- Follow SOLID principles
- Implement comprehensive error handling
- Include request/response validation
- Add appropriate logging and metrics

---

## 🚀 Future Enhancements

- **🧪 Integration Tests**
  - Integration testing with real database and external services
  - End-to-end API testing scenarios

- **📊 Improve Test Coverage**
  - Comprehensive test coverage improvements (target: 90%+)
  - Enhanced unit and integration test suites

- **🔐 Integrate Vault for Secrets**
  - HashiCorp Vault integration for secrets management
  - Secret rotation and management automation

- **📈 Improve Grafana Dashboards**
  - Enhanced Grafana dashboards with business metrics
  - Interactive dashboard templates for different stakeholders
  - Real-time performance monitoring and alerting

- **⚡ Caching Implementation**
  - Redis-based caching for API endpoints
  - Cache invalidation strategies for data consistency
  - Response time optimization for frequently accessed data

---

**SCOMS Backend** - A sophisticated foundation for building scalable, enterprise-grade order management solutions with modern software engineering practices.
