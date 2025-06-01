# SCOMS Script Reference

This document explains the various npm scripts available in the SCOMS project and when to use them.

> **Related Documentation**:
> - [Environment Guide](./ENVIRONMENT_GUIDE.md) - Development and Production environment setup
> - [Consul Guide](./CONSUL_GUIDE.md) - Consul configuration management

## Main Script Categories

The SCOMS project organizes scripts into several categories:

1. **Main Operations** - Core scripts for running the application
2. **Test Commands** - Scripts for testing various aspects of the application
3. **Docker Operations** - Scripts for managing Docker containers
4. **Code Quality** - Scripts for maintaining code quality
5. **Environment Setup** - Scripts for setting up development and production environments
6. **Consul Operations** - Scripts for managing Consul configuration

## Script Comparison

### Development Environment Setup

| Script | Description | When to Use |
|--------|-------------|-------------|
| `run-dev` | **Comprehensive setup**: Installs dependencies, starts services, sets up Consul, validates configuration | ✅ **Preferred** for initial setup or after pulling new code |
| `setup-dev` | **Basic setup**: Starts services and sets up Consul config | ⚠️ Use only when you need to restart services without dependency checks |

### Production Environment Setup

| Script | Description | When to Use |
|--------|-------------|-------------|
| `run-prod` | **Comprehensive setup**: Builds application, creates Docker image, starts all services, prompts for configuration | ✅ **Preferred** for deployment or full environment setup |
| `setup-prod` | **Basic setup**: Builds application and starts services | ⚠️ Use only when you need to restart services without rebuilding |

### Application Running

| Script | Description | When to Use |
|--------|-------------|-------------|
| `dev` | Run in development mode | For regular development |
| `dev:watch` | Run with hot-reload | For active development with frequent code changes |
| `start` | Run built application | For testing the production build locally |
| `prod` | Run in production mode | For running the built application with production settings |

### Docker Management

| Script | Description | When to Use |
|--------|-------------|-------------|
| `docker:dev` | Start development services | When you only need supporting services |
| `docker:prod` | Start production services | When you want to run the full production stack |
| `docker:down` | Stop production services | When cleaning up production environment |
| `docker:down:dev` | Stop development services | When cleaning up development environment |
| `docker:logs` | View application logs | When troubleshooting production issues |
| `docker:build` | Build Docker image | When you need to rebuild the image manually |

### Consul Configuration

| Script | Description | When to Use |
|--------|-------------|-------------|
| `setup-consul` | Set up both environments | When setting up a fresh environment |
| `setup-consul:dev` | Set up development only | When setting up development |
| `setup-consul:prod` | Set up production only | When setting up production |
| `analyze-consul` | Analyze both environments | When comparing configurations |
| `analyze-consul:dev` | Analyze development only | When troubleshooting development |
| `analyze-consul:prod` | Analyze production only | When troubleshooting production |
| `consul-ui` | Open Consul UI | When you need to manually modify configuration |

## Best Practices

1. **Use `run-dev` and `run-prod` for initial setup**
   - These scripts provide the most comprehensive setup
   - They handle dependencies, services, and configuration

2. **Use specific scripts for targeted operations**
   - If you only need to check linting: `npm run lint:check`
   - If you only need to view Consul config: `npm run analyze-consul`

3. **For development workflow**
   - Start with `npm run run-dev`
   - Then use `npm run dev` or `npm run dev:watch` for coding
   - Use `npm test` for testing

4. **For production workflow**
   - Use `npm run run-prod` for complete setup
   - Use `npm run docker:logs` for monitoring
   - Use `npm run consul-ui` for configuration changes
