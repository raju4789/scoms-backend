import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import logger from '../utils/logger';

/**
 * Production-ready Swagger configuration following OpenAPI 3.0.3 specification
 * Implements enterprise-grade API documentation standards
 */
// Determine the correct paths based on environment
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? './dist' : './src';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SCOMS Backend - Order Management System API',
      version: '1.0.0',
      description: `
# SCOMS Backend API Documentation

A TypeScript-based order management system with intelligent warehouse allocation, dynamic pricing, and real-time inventory management.

## 🚀 Quick Start Guide

1. **Authentication**: Use Bearer token authentication with one of the test API keys
2. **Try endpoints**: Use the interactive examples below to test all functionality
3. **Monitor responses**: All responses follow standardized success/error format
4. **Request tracing**: Every request includes correlation IDs for debugging

## 🔐 Authentication & Security

### API Key Authentication
All API endpoints (except health checks) require Bearer token authentication:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Available Test Keys
- \`scoms-frontend-key\` - Frontend application access
- \`scoms-admin-key\` - Administrative operations  
- \`scoms-monitoring-key\` - Health monitoring access

## 📊 Business Logic

### Dynamic Pricing Algorithm
- Base device price configurable via Consul with volume-based discount tiers
- Shipping costs calculated using distance-based algorithms with configurable caps

### Warehouse Selection Logic
1. **Distance Calculation**: Uses Haversine formula for accurate geographic distance
2. **Inventory Check**: Verifies sufficient stock at each warehouse  
3. **Optimal Selection**: Chooses nearest warehouse with adequate inventory
4. **Fallback Strategy**: Multi-warehouse allocation if needed

## 🛠️ Error Handling

All error responses follow a standardized format with detailed error information for debugging and monitoring.

## 🧪 Testing Guide

Use the interactive examples below to test all endpoints. Each endpoint includes realistic test data and comprehensive validation.
      `,
      contact: {
        name: 'SCOMS API Team',
        email: 'api-support@scoms.local',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server - Local development environment',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server - Health endpoints',
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API-Key',
          description:
            'API key-based authentication. Obtain your API key from the SCOMS dashboard.',
        },
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            isSuccess: {
              type: 'boolean',
              example: true,
              description: 'Indicates if the request was successful',
            },
            data: {
              description: 'The response payload',
            },
            errorDetails: {
              type: 'null',
              description: 'Always null for successful responses',
            },
          },
          required: ['isSuccess', 'data', 'errorDetails'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            isSuccess: {
              type: 'boolean',
              example: false,
              description: 'Always false for error responses',
            },
            data: {
              type: 'null',
              description: 'Always null for error responses',
            },
            errorDetails: {
              type: 'object',
              properties: {
                errorCode: {
                  type: 'integer',
                  example: 400,
                  description: 'HTTP status code',
                },
                errorMessage: {
                  type: 'string',
                  example: 'Validation failed',
                  description: 'Human-readable error message',
                },
              },
              required: ['errorCode', 'errorMessage'],
            },
          },
          required: ['isSuccess', 'data', 'errorDetails'],
        },

        // Order schemas
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique order identifier',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 50,
              description: 'Number of devices ordered',
            },
            shipping_latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 40.7128,
              description: 'Latitude of shipping destination',
            },
            shipping_longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -74.006,
              description: 'Longitude of shipping destination',
            },
            total_price: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 6750.0,
              description: 'Final total price after volume discount, before shipping',
            },
            discount: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 750.0,
              description: 'Volume discount amount applied to the order',
            },
            shipping_cost: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 125.5,
              description: 'Calculated shipping cost based on distance and weight',
            },
            warehouse_allocation: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/WarehouseAllocation',
              },
              description: 'How the order is allocated across warehouses',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-02T12:00:00.000Z',
              description: 'Order creation timestamp',
            },
          },
          required: [
            'id',
            'quantity',
            'shipping_latitude',
            'shipping_longitude',
            'total_price',
            'discount',
            'shipping_cost',
            'warehouse_allocation',
            'created_at',
          ],
        },
        OrderInput: {
          type: 'object',
          properties: {
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 50,
              description: 'Number of devices to order',
            },
            shipping_latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 40.7128,
              description: 'Latitude of shipping destination',
            },
            shipping_longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -74.006,
              description: 'Longitude of shipping destination',
            },
          },
          required: ['quantity', 'shipping_latitude', 'shipping_longitude'],
          additionalProperties: false,
        },
        OrderVerificationResult: {
          type: 'object',
          properties: {
            isValid: {
              type: 'boolean',
              example: true,
              description: 'Whether the order can be fulfilled',
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 6750.0,
              description: 'Total price after volume discount, before shipping',
            },
            discount: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 750.0,
              description: 'Volume discount amount applied based on quantity',
            },
            shippingCost: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 125.5,
              description: 'Calculated shipping cost based on distance and weight',
            },
            reason: {
              type: 'string',
              example: 'Insufficient stock available',
              description: 'Reason why order is invalid (only present when isValid is false)',
            },
          },
          required: ['isValid', 'totalPrice', 'discount', 'shippingCost'],
        },
        WarehouseAllocation: {
          type: 'object',
          properties: {
            warehouse: {
              type: 'string',
              example: 'New York Distribution Center',
              description: 'Name of the warehouse',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 50,
              description: 'Quantity allocated from this warehouse',
            },
          },
          required: ['warehouse', 'quantity'],
        },

        // Warehouse schemas
        Warehouse: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
              description: 'Unique warehouse identifier',
            },
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'New York Distribution Center',
              description: 'Warehouse name (must be unique)',
            },
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 40.7128,
              description: 'Warehouse latitude coordinate',
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -74.006,
              description: 'Warehouse longitude coordinate',
            },
            stock: {
              type: 'integer',
              minimum: 0,
              maximum: 100000,
              example: 1500,
              description: 'Number of devices in stock',
            },
          },
          required: ['id', 'name', 'latitude', 'longitude', 'stock'],
        },
        CreateWarehouseInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Chicago Distribution Center',
              description: 'Warehouse name (must be unique)',
            },
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 41.8781,
              description: 'Warehouse latitude coordinate',
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -87.6298,
              description: 'Warehouse longitude coordinate',
            },
            stock: {
              type: 'integer',
              minimum: 0,
              maximum: 100000,
              example: 2000,
              description: 'Initial stock quantity',
            },
          },
          required: ['name', 'latitude', 'longitude', 'stock'],
          additionalProperties: false,
        },
        UpdateWarehouseInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Updated Warehouse Name',
              description: 'New warehouse name (must be unique)',
            },
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 41.8781,
              description: 'New latitude coordinate',
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -87.6298,
              description: 'New longitude coordinate',
            },
            stock: {
              type: 'integer',
              minimum: 0,
              maximum: 100000,
              example: 1800,
              description: 'Updated stock quantity',
            },
          },
          minProperties: 1,
          additionalProperties: false,
        },

        // Health schemas
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy',
              description: 'Overall service health status',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-02T12:00:00.000Z',
              description: 'Health check timestamp',
            },
            correlationId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Request correlation ID',
            },
            service: {
              type: 'string',
              example: 'SCOMS Backend',
              description: 'Service name',
            },
            version: {
              type: 'string',
              example: '1.0.0',
              description: 'Service version',
            },
            environment: {
              type: 'string',
              example: 'development',
              description: 'Environment name',
            },
          },
          required: ['status', 'timestamp', 'service', 'version', 'environment'],
        },
        DetailedHealthStatus: {
          allOf: [
            { $ref: '#/components/schemas/HealthStatus' },
            {
              type: 'object',
              properties: {
                responseTime: {
                  type: 'integer',
                  example: 45,
                  description: 'Health check response time in milliseconds',
                },
                dependencies: {
                  type: 'object',
                  properties: {
                    database: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['healthy', 'degraded', 'unhealthy'],
                          example: 'healthy',
                        },
                        latency: {
                          type: 'integer',
                          example: 12,
                          description: 'Database response time in milliseconds',
                        },
                        type: {
                          type: 'string',
                          example: 'PostgreSQL',
                        },
                      },
                    },
                    consul: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['healthy', 'degraded', 'unhealthy'],
                          example: 'healthy',
                        },
                        latency: {
                          type: 'integer',
                          example: 8,
                          description: 'Consul response time in milliseconds',
                        },
                        type: {
                          type: 'string',
                          example: 'Configuration Management',
                        },
                      },
                    },
                  },
                },
                metrics: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'object',
                      description: 'Error statistics and health metrics',
                    },
                    uptime: {
                      type: 'number',
                      example: 86400.5,
                      description: 'Service uptime in seconds',
                    },
                    memory: {
                      type: 'object',
                      properties: {
                        used: {
                          type: 'integer',
                          example: 45,
                          description: 'Used memory in MB',
                        },
                        total: {
                          type: 'integer',
                          example: 128,
                          description: 'Total allocated memory in MB',
                        },
                        external: {
                          type: 'integer',
                          example: 12,
                          description: 'External memory usage in MB',
                        },
                      },
                    },
                    cpu: {
                      type: 'object',
                      description: 'CPU usage statistics',
                    },
                  },
                },
              },
            },
          ],
        },
      },
      responses: {
        // Standard HTTP responses
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse',
              },
            },
          },
        },
        400: {
          description: 'Bad Request - Invalid input or validation failure',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized - Missing or invalid API key',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        404: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        503: {
          description: 'Service Unavailable - Service is temporarily unavailable',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
      parameters: {
        CorrelationId: {
          name: 'X-Correlation-ID',
          in: 'header',
          description: 'Optional correlation ID for request tracing. If not provided, one will be generated automatically.',
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
        },
        AcceptLanguage: {
          name: 'Accept-Language',
          in: 'header',
          description: 'Preferred language for error messages and responses',
          schema: {
            type: 'string',
            default: 'en-US',
            example: 'en-US',
          },
        },
        UserAgent: {
          name: 'User-Agent',
          in: 'header',
          description: 'Client application identifier for monitoring and analytics',
          schema: {
            type: 'string',
            example: 'SCOMS-Frontend/1.0.0',
          },
        },
      },
    },
    tags: [
      {
        name: 'Orders',
        description: 'Order management operations including verification, submission, and retrieval',
        externalDocs: {
          description: 'Order Management Documentation',
          url: 'https://github.com/raju4789/scoms-backend#-business-logic',
        },
      },
      {
        name: 'Warehouses',
        description: 'Warehouse inventory and location management operations',
        externalDocs: {
          description: 'Warehouse Management Documentation', 
          url: 'https://github.com/raju4789/scoms-backend#warehouse-selection-logic',
        },
      },
      {
        name: 'Health',
        description: 'Service health monitoring and readiness endpoints for operational monitoring',
        externalDocs: {
          description: 'Health Check Documentation',
          url: 'https://github.com/raju4789/scoms-backend#-monitoring--observability',
        },
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  // Use dynamic paths based on environment
  apis: [
    `${basePath}/routes/*.js`,
    `${basePath}/routes/*.ts`,
    `${basePath}/models/*.js`, 
    `${basePath}/models/*.ts`,
    `${basePath}/types/*.js`,
    `${basePath}/types/*.ts`
  ],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI with custom styling and security
 */
export const setupSwagger = (app: Express): void => {
  // Custom CSS for professional styling
  const customCss = `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { 
      background: #f8f9fa; 
      border: 1px solid #dee2e6; 
      border-radius: 5px; 
      padding: 15px; 
      margin: 20px 0; 
    }
    .swagger-ui .auth-wrapper { margin: 20px 0; }
    .swagger-ui .btn.authorize { 
      background-color: #007bff; 
      border-color: #007bff; 
    }
    .swagger-ui .btn.authorize:hover { 
      background-color: #0056b3; 
      border-color: #0056b3; 
    }
    .swagger-ui .model-box { 
      background: #f8f9fa; 
      border: 1px solid #dee2e6; 
    }
    .swagger-ui .opblock.opblock-get .opblock-summary { 
      border-color: #61affe; 
    }
    .swagger-ui .opblock.opblock-post .opblock-summary { 
      border-color: #49cc90; 
    }
    .swagger-ui .opblock.opblock-put .opblock-summary { 
      border-color: #fca130; 
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary { 
      border-color: #f93e3e; 
    }
  `;

  const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    customCss,
    customSiteTitle: 'SCOMS API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayOperationId: false,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
      syntaxHighlight: {
        activate: true,
        theme: 'agate',
      },
      // Pre-authorize with example API key for documentation purposes
      preauthorizeApiKey: {
        ApiKeyAuth: 'scoms-frontend-key',
      },
    },
  };

  // Serve Swagger JSON specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Alternative lightweight documentation endpoint
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  logger.info('📚 Swagger documentation available at: http://localhost:3000/api-docs');
  logger.info('📝 Swagger JSON specification at: http://localhost:3000/api-docs.json');
};

export default { swaggerSpec, setupSwagger };
