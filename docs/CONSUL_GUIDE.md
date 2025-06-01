# SCOMS Consul Configuration Guide

This comprehensive guide covers all aspects of HashiCorp Consul configuration management in the SCOMS (ScreenCloud Order Management System) backend.

> **Related Documentation**:
> - [Environment Guide](./ENVIRONMENT_GUIDE.md) - Development and Production environment setup
> - [Script Reference](./SCRIPT_REFERENCE.md) - Available npm scripts

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Initial Setup](#initial-setup)
4. [Development Usage](#development-usage)
5. [Production Usage](#production-usage)
6. [Updating Configuration](#updating-configuration)
7. [Hot Configuration Reloading](#hot-configuration-reloading)
8. [Common Configuration Tasks](#common-configuration-tasks)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Overview

Consul serves as the centralized configuration management system for SCOMS, providing:

- **Environment Isolation**: Separate configurations for development and production
- **Dynamic Reconfiguration**: Change application behavior without code changes or restarts
- **Centralized Management**: Single source of truth for all configuration
- **Versioning and Metadata**: Track configuration changes and their purposes

One of the primary benefits of using Consul is the ability to change application behavior without code changes or redeployments. The SCOMS application is designed to hot-reload configuration changes from Consul.

## Architecture

### Configuration Structure

SCOMS uses a hierarchical configuration structure in Consul:

```
scoms/
├── development/
│   └── config/
│       ├── metadata/
│       │   ├── version
│       │   ├── lastUpdated
│       │   └── description
│       ├── database/
│       │   ├── host
│       │   ├── port
│       │   └── ...
│       ├── server/
│       │   ├── port
│       │   └── ...
│       └── ...
└── production/
    └── config/
        ├── metadata/
        │   ├── version
        │   ├── lastUpdated
        │   └── description
        ├── database/
        │   ├── host
        │   ├── port
        │   └── ...
        ├── server/
        │   ├── port
        │   └── ...
        └── ...
```

### Environment Isolation

The system uses different Consul paths for each environment:

- Development: `scoms/development/config/*`
- Production: `scoms/production/config/*`

This ensures that development changes won't affect production and vice versa.

## Initial Setup

### Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed

### Setup Commands

```bash
# One-command setup for development
npm run run-dev

# One-command setup for production
npm run run-prod
```

### Manual Setup

```bash
# Start Consul (development)
npm run docker:dev

# Setup development configuration
npm run setup-consul:dev

# Start Consul (production)
npm run docker:prod

# Setup production configuration
npm run setup-consul:prod
```

## Development Usage

In development, configuration is loaded automatically for developer convenience:

```bash
# Load development configuration into Consul
npm run setup-consul:dev

# View current development configuration
npm run analyze-consul:dev

# Open Consul UI
npm run consul-ui
```

## Production Usage

In production, configuration is managed manually through Consul UI/API:

```bash
# View current production configuration
npm run analyze-consul:prod

# Open Consul UI
npm run consul-ui
```

## Updating Configuration

### Using Consul UI

The Consul UI provides a user-friendly way to update configuration:

1. Open the Consul UI:
   ```bash
   npm run consul-ui
   # Or navigate to http://localhost:8500/ui/
   ```

2. Navigate to the Key/Value store
   - Click on "Key/Value" in the top menu
   - Navigate to `scoms/production/config/` (for production) or `scoms/development/config/` (for development)

3. Edit a value:
   - Click on the key you want to modify (e.g., `order/devicePrice`)
   - Edit the value in the text area
   - Click "Save"

4. The application will automatically detect the change and apply the new configuration

### Using Consul API

For scripting or automation, use the Consul HTTP API:

```bash
# Update device price in production
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/order/devicePrice -d "175"

# Update database connection pool size in production
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/database/maxConnections -d "100"

# Update log level in production
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/server/logLevel -d "info"
```

## Hot Configuration Reloading

SCOMS is designed to detect and apply configuration changes at runtime:

1. When a change is made in Consul, the application watches for updates
2. Changes are validated and applied immediately
3. No application restart is required

Example log messages when configuration is reloaded:
```
[INFO] Configuration change detected in Consul
[INFO] Validating new configuration...
[INFO] Configuration hot reloaded from Consul
```

## Common Configuration Tasks

### Order Configuration

```bash
# Update device price
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/order/devicePrice -d "175"

# Update shipping rate
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/order/shippingRatePerKgKm -d "0.015"
```

### Database Configuration

```bash
# Update connection pool size
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/database/maxConnections -d "100"

# Update connection timeout
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/database/connectionTimeout -d "60000"
```

### Server Configuration

```bash
# Update log level
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/server/logLevel -d "info"

# Update server port
curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/server/port -d "3030"
```

## Troubleshooting

### Common Issues

#### Configuration Not Loading

```bash
# Check Consul status
curl http://localhost:8500/v1/status/leader

# Check if keys exist
curl http://localhost:8500/v1/kv/scoms/development/config/?recurse=true

# Analyze configuration
npm run analyze-consul
```

#### Hot Reload Not Working

Verify the watch configuration is correct:

```bash
# Check watch status in application logs
npm run docker:logs | grep "watch"
```

## Best Practices

1. **Always validate changes** before and after applying them
2. **Document all changes** made through Consul UI or API
3. **Use meaningful metadata** when updating configuration:
   ```bash
   # Update metadata after making changes
   curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/metadata/lastUpdated -d "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
   curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/metadata/description -d "Updated device price for Q2 2025"
   ```
4. **Test in development first** before applying changes to production
5. **Consider version control** for configuration changes:
   ```bash
   # Increment version after making changes
   curl -X PUT http://localhost:8500/v1/kv/scoms/production/config/metadata/version -d "1.0.1"
   ```
6. **Never edit code just to change configuration** - use Consul instead
7. **Keep environment configurations isolated** to prevent accidental changes
