import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';

/**
 * Swagger configuration using OpenAPI 3.0.3 specification
 * Following production best practices for API documentation
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ScreenCloud Order Management System (SCOMS) API',
      version: '1.0.0',
      description: `
# ScreenCloud Order Management System API

A comprehensive RESTful API for managing orders and warehouses in the ScreenCloud ecosystem.

## Features

- **Order Management**: Create, verify, and track orders with real-time pricing
- **Warehouse Management**: Full CRUD operations for warehouse inventory
- **Multi-warehouse Allocation**: Intelligent distribution of orders across warehouses
- **Dynamic Pricing**: Bulk discount tiers and location-based shipping costs
- **Health Monitoring**: Comprehensive health checks and metrics
- **Security**: API key-based authentication with role-based permissions

## Authentication

All endpoints (except health checks) require API key authentication via the \`Authorization\` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Permission Levels

- **orders:read** - Read orders and verify pricing
- **orders:write** - Submit new orders
- **warehouses:read** - View warehouse information
- **warehouses:write** - Manage warehouse inventory

## Error Handling

All endpoints return a consistent error format with detailed error information:

\`\`\`json
{
  "isSuccess": false,
  "data": null,
  "errorDetails": {
    "errorCode": 400,
    "errorMessage": "Validation failed",
    "errorId": "uuid",
    "correlationId": "uuid",
    "category": "validation",
    "severity": "low",
    "timestamp": "2025-06-02T12:00:00.000Z"
  }
}
\`\`\`

## Rate Limiting

API requests are subject to rate limiting. Monitor the following headers:
- \`X-RateLimit-Limit\` - Request limit per window
- \`X-RateLimit-Remaining\` - Remaining requests in current window
- \`X-RateLimit-Reset\` - Time when the current window resets
      `,
      contact: {
        name: 'SCOMS API Support',
        email: 'api-support@screencloud.com',
        url: 'https://docs.screencloud.com/scoms'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      termsOfService: 'https://screencloud.com/terms'
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://staging-api.screencloud.com/scoms/v1',
        description: 'Staging server'
      },
      {
        url: 'https://api.screencloud.com/scoms/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API-Key',
          description: 'API key-based authentication. Obtain your API key from the SCOMS dashboard.'
        }
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            isSuccess: {
              type: 'boolean',
              example: true,
              description: 'Indicates if the request was successful'
            },
            data: {
              description: 'The response payload'
            },
            errorDetails: {
              type: 'null',
              description: 'Always null for successful responses'
            }
          },
          required: ['isSuccess', 'data', 'errorDetails']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            isSuccess: {
              type: 'boolean',
              example: false,
              description: 'Always false for error responses'
            },
            data: {
              type: 'null',
              description: 'Always null for error responses'
            },
            errorDetails: {
              type: 'object',
              properties: {
                errorCode: {
                  type: 'integer',
                  example: 400,
                  description: 'HTTP status code'
                },
                errorMessage: {
                  type: 'string',
                  example: 'Validation failed',
                  description: 'Human-readable error message'
                },
                errorId: {
                  type: 'string',
                  format: 'uuid',
                  example: '123e4567-e89b-12d3-a456-426614174000',
                  description: 'Unique identifier for this error instance'
                },
                correlationId: {
                  type: 'string',
                  format: 'uuid',
                  example: '987fcdeb-51e2-43d1-b456-426614174000',
                  description: 'Request correlation ID for tracing'
                },
                category: {
                  type: 'string',
                  enum: ['validation', 'authentication', 'authorization', 'not_found', 'business_logic', 'external_service', 'database', 'network', 'system', 'unknown'],
                  example: 'validation',
                  description: 'Error category for classification'
                },
                severity: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  example: 'low',
                  description: 'Error severity level'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-06-02T12:00:00.000Z',
                  description: 'Error occurrence timestamp'
                },
                details: {
                  type: 'object',
                  additionalProperties: true,
                  description: 'Additional error context and details'
                },
                retryable: {
                  type: 'boolean',
                  example: false,
                  description: 'Whether the request can be retried'
                },
                helpUrl: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://docs.screencloud.com/scoms/errors/validation',
                  description: 'URL with more information about this error'
                }
              },
              required: ['errorCode', 'errorMessage', 'errorId', 'correlationId', 'category', 'severity', 'timestamp']
            }
          },
          required: ['isSuccess', 'data', 'errorDetails']
        },

        // Order schemas
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique order identifier'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 25,
              description: 'Number of devices ordered'
            },
            shipping_latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 40.7128,
              description: 'Latitude of shipping destination'
            },
            shipping_longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -74.0060,
              description: 'Longitude of shipping destination'
            },
            total_price: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 2375.00,
              description: 'Final total price after discount, before shipping'
            },
            discount: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 125.00,
              description: 'Discount amount applied to the order'
            },
            shipping_cost: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 35.50,
              description: 'Shipping cost for the order'
            },
            warehouse_allocation: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/WarehouseAllocation'
              },
              description: 'How the order is allocated across warehouses'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-02T12:00:00.000Z',
              description: 'Order creation timestamp'
            }
          },
          required: ['id', 'quantity', 'shipping_latitude', 'shipping_longitude', 'total_price', 'discount', 'shipping_cost', 'warehouse_allocation', 'created_at']
        },
        OrderInput: {
          type: 'object',
          properties: {
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 25,
              description: 'Number of devices to order'
            },
            shipping_latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 40.7128,
              description: 'Latitude of shipping destination'
            },
            shipping_longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -74.0060,
              description: 'Longitude of shipping destination'
            }
          },
          required: ['quantity', 'shipping_latitude', 'shipping_longitude'],
          additionalProperties: false
        },
        OrderVerificationResult: {
          type: 'object',
          properties: {
            isValid: {
              type: 'boolean',
              example: true,
              description: 'Whether the order can be fulfilled'
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 2375.00,
              description: 'Total price after discount, before shipping'
            },
            discount: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 125.00,
              description: 'Discount amount applied'
            },
            shippingCost: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 35.50,
              description: 'Calculated shipping cost'
            },
            reason: {
              type: 'string',
              example: 'Insufficient stock available',
              description: 'Reason why order is invalid (only present when isValid is false)'
            }
          },
          required: ['isValid', 'totalPrice', 'discount', 'shippingCost']
        },
        WarehouseAllocation: {
          type: 'object',
          properties: {
            warehouse: {
              type: 'string',
              example: 'New York Warehouse',
              description: 'Name of the warehouse'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 15,
              description: 'Quantity allocated from this warehouse'
            }
          },
          required: ['warehouse', 'quantity']
        },

        // Warehouse schemas
        Warehouse: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
              description: 'Unique warehouse identifier'
            },
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'New York Distribution Center',
              description: 'Warehouse name (must be unique)'
            },
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 40.7128,
              description: 'Warehouse latitude coordinate'
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -74.0060,
              description: 'Warehouse longitude coordinate'
            },
            stock: {
              type: 'integer',
              minimum: 0,
              maximum: 100000,
              example: 1500,
              description: 'Number of devices in stock'
            }
          },
          required: ['id', 'name', 'latitude', 'longitude', 'stock']
        },
        CreateWarehouseInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Chicago Distribution Center',
              description: 'Warehouse name (must be unique)'
            },
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 41.8781,
              description: 'Warehouse latitude coordinate'
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -87.6298,
              description: 'Warehouse longitude coordinate'
            },
            stock: {
              type: 'integer',
              minimum: 0,
              maximum: 100000,
              example: 2000,
              description: 'Initial stock quantity'
            }
          },
          required: ['name', 'latitude', 'longitude', 'stock'],
          additionalProperties: false
        },
        UpdateWarehouseInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Updated Warehouse Name',
              description: 'New warehouse name (must be unique)'
            },
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              example: 41.8781,
              description: 'New latitude coordinate'
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              example: -87.6298,
              description: 'New longitude coordinate'
            },
            stock: {
              type: 'integer',
              minimum: 0,
              maximum: 100000,
              example: 1800,
              description: 'Updated stock quantity'
            }
          },
          minProperties: 1,
          additionalProperties: false
        },

        // Health schemas
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy',
              description: 'Overall service health status'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-02T12:00:00.000Z',
              description: 'Health check timestamp'
            },
            correlationId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Request correlation ID'
            },
            service: {
              type: 'string',
              example: 'SCOMS Backend',
              description: 'Service name'
            },
            version: {
              type: 'string',
              example: '1.0.0',
              description: 'Service version'
            },
            environment: {
              type: 'string',
              example: 'development',
              description: 'Environment name'
            }
          },
          required: ['status', 'timestamp', 'service', 'version', 'environment']
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
                  description: 'Health check response time in milliseconds'
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
                          example: 'healthy'
                        },
                        latency: {
                          type: 'integer',
                          example: 12,
                          description: 'Database response time in milliseconds'
                        },
                        type: {
                          type: 'string',
                          example: 'PostgreSQL'
                        }
                      }
                    },
                    consul: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['healthy', 'degraded', 'unhealthy'],
                          example: 'healthy'
                        },
                        latency: {
                          type: 'integer',
                          example: 8,
                          description: 'Consul response time in milliseconds'
                        },
                        type: {
                          type: 'string',
                          example: 'Configuration Management'
                        }
                      }
                    }
                  }
                },
                metrics: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'object',
                      description: 'Error statistics and health metrics'
                    },
                    uptime: {
                      type: 'number',
                      example: 86400.5,
                      description: 'Service uptime in seconds'
                    },
                    memory: {
                      type: 'object',
                      properties: {
                        used: {
                          type: 'integer',
                          example: 45,
                          description: 'Used memory in MB'
                        },
                        total: {
                          type: 'integer',
                          example: 128,
                          description: 'Total allocated memory in MB'
                        },
                        external: {
                          type: 'integer',
                          example: 12,
                          description: 'External memory usage in MB'
                        }
                      }
                    },
                    cpu: {
                      type: 'object',
                      description: 'CPU usage statistics'
                    }
                  }
                }
              }
            }
          ]
        }
      },
      responses: {
        // Standard HTTP responses
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              }
            }
          }
        },
        400: {
          description: 'Bad Request - Invalid input or validation failure',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                isSuccess: false,
                data: null,
                errorDetails: {
                  errorCode: 400,
                  errorMessage: 'Validation failed',
                  errorId: '123e4567-e89b-12d3-a456-426614174000',
                  correlationId: '987fcdeb-51e2-43d1-b456-426614174000',
                  category: 'validation',
                  severity: 'low',
                  timestamp: '2025-06-02T12:00:00.000Z',
                  details: {
                    quantity: 'Quantity must be greater than 0'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Missing or invalid API key',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                isSuccess: false,
                data: null,
                errorDetails: {
                  errorCode: 401,
                  errorMessage: 'Authentication required',
                  errorId: '123e4567-e89b-12d3-a456-426614174000',
                  correlationId: '987fcdeb-51e2-43d1-b456-426614174000',
                  category: 'authentication',
                  severity: 'medium',
                  timestamp: '2025-06-02T12:00:00.000Z',
                  helpUrl: '/docs/authentication'
                }
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                isSuccess: false,
                data: null,
                errorDetails: {
                  errorCode: 403,
                  errorMessage: 'Insufficient permissions',
                  errorId: '123e4567-e89b-12d3-a456-426614174000',
                  correlationId: '987fcdeb-51e2-43d1-b456-426614174000',
                  category: 'authorization',
                  severity: 'medium',
                  timestamp: '2025-06-02T12:00:00.000Z',
                  helpUrl: '/docs/permissions'
                }
              }
            }
          }
        },
        404: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                isSuccess: false,
                data: null,
                errorDetails: {
                  errorCode: 404,
                  errorMessage: 'Order with identifier \'123e4567-e89b-12d3-a456-426614174000\' not found',
                  errorId: '123e4567-e89b-12d3-a456-426614174000',
                  correlationId: '987fcdeb-51e2-43d1-b456-426614174000',
                  category: 'not_found',
                  severity: 'low',
                  timestamp: '2025-06-02T12:00:00.000Z'
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                isSuccess: false,
                data: null,
                errorDetails: {
                  errorCode: 500,
                  errorMessage: 'An unexpected error occurred',
                  errorId: '123e4567-e89b-12d3-a456-426614174000',
                  correlationId: '987fcdeb-51e2-43d1-b456-426614174000',
                  category: 'system',
                  severity: 'critical',
                  timestamp: '2025-06-02T12:00:00.000Z',
                  retryable: false
                }
              }
            }
          }
        },
        503: {
          description: 'Service Unavailable - Service is temporarily unavailable',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                isSuccess: false,
                data: null,
                errorDetails: {
                  errorCode: 503,
                  errorMessage: 'Service temporarily unavailable',
                  errorId: '123e4567-e89b-12d3-a456-426614174000',
                  correlationId: '987fcdeb-51e2-43d1-b456-426614174000',
                  category: 'external_service',
                  severity: 'high',
                  timestamp: '2025-06-02T12:00:00.000Z',
                  retryable: true
                }
              }
            }
          }
        }
      },
      parameters: {
        CorrelationId: {
          name: 'X-Correlation-ID',
          in: 'header',
          description: 'Unique identifier for request tracing across services',
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      }
    },
    tags: [
      {
        name: 'Orders',
        description: 'Order management operations including verification and submission',
        externalDocs: {
          description: 'Order Management Guide',
          url: 'https://docs.screencloud.com/scoms/orders'
        }
      },
      {
        name: 'Warehouses',
        description: 'Warehouse inventory and location management',
        externalDocs: {
          description: 'Warehouse Management Guide',
          url: 'https://docs.screencloud.com/scoms/warehouses'
        }
      },
      {
        name: 'Health',
        description: 'Service health and monitoring endpoints',
        externalDocs: {
          description: 'Health Check Guide',
          url: 'https://docs.screencloud.com/scoms/health'
        }
      }
    ],
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/models/*.ts',
    './src/types/*.ts'
  ]
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
        theme: 'agate'
      },
      // Pre-authorize with example API key for documentation purposes
      preauthorizeApiKey: {
        ApiKeyAuth: 'scoms-demo-key'
      }
    }
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

  console.log(`📚 Swagger documentation available at: http://localhost:3000/api-docs`);
  console.log(`📝 Swagger JSON specification at: http://localhost:3000/api-docs.json`);
};

export default { swaggerSpec, setupSwagger };
