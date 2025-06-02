# 🚀 SCOMS Backend

A robust, enterprise-grade backend service for the ScreenCloud Order Management System (SCOMS), built with Node.js, TypeScript, and Express. This service provides comprehensive APIs for order and warehouse management with advanced features including Consul-based configuration, API key authentication, and comprehensive observability.

---

## Table of Contents
- [Features](#features)
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

---

## Features

### Core Features
- **Order Management**: Complete order lifecycle with pricing, validation, and multi-warehouse allocation
- **Warehouse Management**: Inventory tracking, location-based operations, and stock management
- **API Key Authentication**: Service-to-service authentication with role-based permissions
- **Consul Configuration**: Centralized configuration management with hot-reload capabilities
- **Request Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Centralized error handling with detailed error tracking
- **Health Monitoring**: Multiple health check endpoints for Kubernetes deployment

### Advanced Features
- **Multi-Warehouse Allocation**: Intelligent order distribution across multiple warehouses
- **Distance-Based Shipping**: Geographic calculations for shipping cost optimization
- **Bulk Discount System**: Tiered pricing with automatic discount application
- **Prometheus Metrics**: Custom metrics for monitoring and alerting
- **Correlation ID Tracking**: Request tracing across service boundaries
- **Comprehensive Logging**: Structured logging with correlation tracking

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
git clone https://github.com/your-org/scoms-backend.git
cd scoms-backend

# Install dependencies
npm ci

```

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

# Or start without hot reload
npm run dev
```

### Production Mode
```bash

# Start dependencies
npm run docker:prod

# Start the server
npm start
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
npm run test:watch       # Run tests in watch mode
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
- **Base Price**: $100 per device
- **Bulk Discounts**:
  - 10-24 devices: 5% discount
  - 25-49 devices: 10% discount
  - 50+ devices: 15% discount
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

### Database Migrations
```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual function and method testing
- **Integration Tests**: API endpoint testing with mocked dependencies
- **Repository Tests**: Database operation testing

### Coverage Reports
Test coverage reports are generated in the `coverage/` directory with detailed HTML reports.

## Code Quality

### Linting and Formatting
```bash
# Check code quality
npm run lint:check

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format:fix
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

#### Configuration Issues
```bash
# Check Consul configuration
npm run open-consul-ui

# Verify environment variables
cat .env

# Check application logs
docker-compose logs app
```

### Debug Mode
Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file.

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

**SCOMS Backend** - Building scalable order management solutions with enterprise-grade reliability and observability.
