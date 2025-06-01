# SCOMS Environment Guide

This comprehensive guide covers the development and production environments for the ScreenCloud Order Management System (SCOMS) backend.

> **Related Documentation**:
> - [Consul Guide](./CONSUL_GUIDE.md) - Consul configuration management
> - [Script Reference](./SCRIPT_REFERENCE.md) - Available npm scripts

## 📋 Table of Contents

1. [Environment Overview](#environment-overview)
2. [Development Environment](#development-environment)
3. [Production Environment](#production-environment)
4. [Switching Between Environments](#switching-between-environments)
5. [Environment-Specific Configuration](#environment-specific-configuration)
6. [Docker Setup](#docker-setup)
7. [Database Setup](#database-setup)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Environment Overview

SCOMS supports two distinct environments with different configurations and operational models:

| Feature | Development | Production |
|---------|-------------|------------|
| **Docker Compose File** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **Application Location** | Run locally (outside Docker) | Run in Docker container |
| **Configuration Loading** | Automatic via setup script | Manual via Consul UI/API |
| **Database Connection** | `localhost:5432` | `postgres:5432` (Docker service) |
| **Configuration Approach** | Developer convenience | Operational best practices |
| **Consul Configuration** | Pre-loaded | Manually configured |

## Development Environment

The development environment is designed for developer convenience and rapid iteration.

### Key Features

- Supporting services (Consul, PostgreSQL, pgAdmin) run in Docker
- Application runs locally (not in Docker) for easy debugging
- Configuration is automatically loaded into Consul
- Local changes to code are immediately reflected

### Quick Start Setup

```bash
# One-command setup (recommended)
npm run run-dev

# Start the application after setup
npm run dev
```

### Manual Setup

```bash
# Install dependencies
npm install

# Start supporting services (Consul, PostgreSQL, pgAdmin)
npm run docker:dev

# Load development configuration into Consul
npm run setup-consul:dev

# Run the application locally
npm run dev
```

### Development Workflow

1. Make code changes locally
2. Application hot-reloads or restart with `npm run dev`
3. For configuration changes during development:
   - Use Consul UI for quick testing
   - Configuration is managed automatically via TypeScript bootstrap

### Development Commands

```bash
# Run the application
npm run dev

# Run with hot reloading
npm run dev:watch

# Run tests
npm test

# Check code quality
npm run lint
npm run format

# Stop development services
npm run docker:down:dev
```

### Development Services

After setup, you'll have access to:

- **Application**: http://localhost:3000/
- **Consul UI**: http://localhost:8500/ui/
- **PgAdmin**: http://localhost:5050/ (admin@admin.com / admin)
- **PostgreSQL**: localhost:5432 (postgres / postgres)

## Production Environment

The production environment follows operational best practices for reliability and security.

### Key Features

- All services (including application) run in Docker
- Configuration is managed manually through Consul UI/API
- Changes to configuration don't require code changes or redeployment
- More resilient and secure setup

### Quick Start Setup

```bash
# One-command setup (recommended)
npm run run-prod
```

This will:
1. Build the application and Docker image
2. Start all services
3. Prompt for configuration setup preferences

### Manual Setup

```bash
# Build the application
npm run build

# Build Docker image
npm run docker:build

# Start production environment
npm run setup-prod
```

### Production Workflow

1. Deploy application and services using `docker-compose.yml`
2. Configure application through Consul UI/API
3. For configuration changes:
   - Use Consul UI: http://localhost:8500/ui/
   - Use Consul API: curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/KEY -d VALUE
   - Monitor application logs: `npm run docker:logs`

### Production Commands

```bash
# View application logs
npm run docker:logs

# Analyze configuration
npm run analyze-consul:prod

# Stop production services
npm run docker:down
```

## Switching Between Environments

When switching between environments, make sure to clean up first:

```bash
# When switching from development to production
npm run docker:down:dev
npm run run-prod  # Preferred over setup-prod as it's more comprehensive

# When switching from production to development
npm run docker:down
npm run run-dev   # Preferred over setup-dev as it's more comprehensive
```

> **Note**: The `setup-dev` and `setup-prod` scripts are maintained for backward compatibility but provide a less comprehensive setup than their `run-dev` and `run-prod` counterparts. Always prefer the `run-*` versions for complete environment setup.

## Environment-Specific Configuration

SCOMS uses environment-specific paths in Consul for configuration:

- Development: `scoms/development/config/*`
- Production: `scoms/production/config/*`

This ensures that development changes won't affect production and vice versa.

See the [Consul Guide](./CONSUL_GUIDE.md) for detailed information on configuration management.

## Docker Setup

### Development Docker Setup

The development environment uses `docker-compose.dev.yml` which only runs supporting services:

```bash
# Start development Docker services
npm run docker:dev

# Stop development Docker services
npm run docker:down:dev
```

### Production Docker Setup

The production environment uses `docker-compose.yml` which runs all services including the application:

```bash
# Start production Docker services
npm run docker:prod

# Stop production Docker services
npm run docker:down
```

## Database Setup

### Development Database

In development, the database runs in Docker but is accessed from the local application:

- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres
- **Database**: scoms

### Production Database

In production, both the application and database run in Docker:

- **Host**: postgres (Docker service name)
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres (should be changed in production)
- **Database**: scoms

## Troubleshooting

### Common Issues

#### Service Connection Issues

```bash
# Check Docker container status
docker ps

# Check Docker logs
docker-compose logs postgres
docker-compose logs consul
```

#### Database Connection Issues

```bash
# Test database connection
npm run test:db

# Check database logs
docker-compose logs postgres
```

#### Configuration Issues

```bash
# Test environment configuration
npm run test:env

# Check Consul configuration
npm run analyze-consul
```

## Best Practices

### Development Environment

- Use for rapid iteration and testing
- Feel free to experiment with configuration
- Keep setup scripts updated for team consistency
- Use hot reloading for efficient development

### Production Environment

- Never edit code just to change configuration
- Use Consul UI/API for all configuration changes
- Document all configuration changes
- Test changes in development first
- Monitor logs regularly
- Use proper authentication in production (change default passwords)
