# SCOMS Backend

ScreenCloud Order Management System (SCOMS) Backend

## 🌟 Features

- **Robust Architecture**: Clean architecture with clear separation of concerns
- **Environment Flexibility**: Separate development and production environments
- **Dynamic Configuration**: Runtime configuration changes via Consul without code changes
- **Containerized**: Docker-based setup for consistency across environments
- **TypeScript**: Type safety and modern JavaScript features
- **RESTful API**: Well-structured API endpoints for order and warehouse management
- **Comprehensive Testing**: Jest-based test suite with good coverage
- **Database Integration**: PostgreSQL with TypeORM for type-safe database access

## 🚀 Quick Start

### Development (Recommended)

```sh
# Complete development setup (recommended)
npm run run-dev

# OR start coding with hot-reload
npm run dev:watch
```

### Production

```sh
# Complete production setup
npm run run-prod

# Monitor logs
npm run docker:logs
```

## 📚 Documentation

- [Unified Guide](./docs/UNIFIED_GUIDE.md) - Complete project guide (start here)
- [Configuration Guide](./docs/UNIFIED_CONFIG_GUIDE.md) - Configuration management
- [Environment Guide](./docs/ENVIRONMENT_GUIDE.md) - Environment details
- [Consul Guide](./docs/CONSUL_GUIDE.md) - Consul integration
- [Script Reference](./docs/SCRIPT_REFERENCE.md) - Available scripts

### Production

- **Start everything (including the app) in Docker:**
  ```sh
  docker-compose up --build -d
  ```
- **Stop everything:**
  ```sh
  docker-compose down
  ```

---

- To open the Consul UI: `npm run open:consul`
- For test endpoints, see the `rest-client/` folder.
- For more details, see the documentation in `docs/`.

---

> **Note:**
> The legacy `run-dev.sh` script is deprecated. Please use the npm scripts above for a simpler, more standard workflow.

## 👨‍💻 Development Guide

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up the development environment: `npm run run-dev`
4. Start the application: `npm run dev`

### Development Workflow

1. Make code changes in the `src/` directory
2. Run tests: `npm test`
3. Check code quality: `npm run lint`
4. Format code: `npm run format`
5. Test database connection: `npm run test:db`
6. View Consul configuration: `npm run analyze-consul:dev`

### API Testing

The `rest-client/` directory contains HTTP request examples for testing the API:

- `orders.http` - Order management endpoints
- `warehouses.http` - Warehouse management endpoints

Use the VS Code REST Client extension or convert these to Postman/Insomnia collections.

## 🔧 Environment Setup

SCOMS uses different setups for development and production:

| Environment | Application    | Supporting Services | Configuration    |
| ----------- | -------------- | ------------------- | ---------------- |
| Development | Runs locally   | Run in Docker       | Auto-loaded      |
| Production  | Runs in Docker | Run in Docker       | Manually managed |

For more details, see [docs/ENVIRONMENT_GUIDE.md](docs/ENVIRONMENT_GUIDE.md).

## 📝 Configuration Management

SCOMS uses HashiCorp Consul for configuration management:

- **Development**: Configuration is automatically loaded for convenience
- **Production**: Configuration is managed manually through Consul UI/API (no code changes needed)

For detailed configuration management, see [docs/CONSUL_GUIDE.md](docs/CONSUL_GUIDE.md).

## 🧪 Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Test environment configuration:

```bash
npm run test:env
```

## 📊 Monitoring

View application logs:

```bash
# For production environment
npm run docker:logs
```

Analyze configuration:

```bash
# View all configurations
npm run analyze-consul

# View development configuration only
npm run analyze-consul:dev

# View production configuration only
npm run analyze-consul:prod
```

## 🧹 Cleanup

```bash
# Stop development services
npm run docker:down:dev

# Stop production services
npm run docker:down
```

## 📁 Project Structure

The project follows a clean architecture pattern with clear separation of concerns:

```
/scoms-backend
├── src/                    # Source code
│   ├── config/             # Configuration (Consul, database)
│   ├── models/             # Database entities
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic
│   ├── routes/             # API endpoints
│   ├── middleware/         # Express middleware
│   ├── errors/             # Error handling
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
│       └── testing/        # Test utilities
├── scripts/                # Shell scripts for setup and management
├── docs/                   # Documentation files
│   ├── CONSUL_GUIDE.md     # Comprehensive Consul guide
│   ├── ENVIRONMENT_GUIDE.md# Environment setup guide
│   └── SCRIPT_REFERENCE.md # npm scripts reference
├── rest-client/            # HTTP request samples
├── docker-compose.yml      # Production Docker setup
└── docker-compose.dev.yml  # Development Docker setup
```

## 📚 Documentation

- [README.md](README.md) - Main project documentation (this file)
- [docs/ENVIRONMENT_GUIDE.md](docs/ENVIRONMENT_GUIDE.md) - Comprehensive guide to development and production environments
- [docs/CONSUL_GUIDE.md](docs/CONSUL_GUIDE.md) - Complete guide to Consul configuration management
- [docs/SCRIPT_REFERENCE.md](docs/SCRIPT_REFERENCE.md) - Comprehensive guide to available npm scripts
