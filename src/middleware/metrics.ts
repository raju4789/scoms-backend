import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry to register metrics
const register = new client.Registry();

// Get environment from NODE_ENV
const environment = process.env.NODE_ENV || 'development';

// Default metrics with scoms_ prefix
client.collectDefaultMetrics({ 
  register,
  prefix: 'scoms_nodejs_'
});

// Custom metrics with scoms_ prefix and environment label
const httpRequestsTotal = new client.Counter({
  name: 'scoms_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'environment'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'scoms_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'environment'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

const activeConnections = new client.Gauge({
  name: 'scoms_active_connections',
  help: 'Number of active connections',
  labelNames: ['environment'],
  registers: [register]
});

// Business metrics
const ordersTotal = new client.Counter({
  name: 'scoms_orders_total',
  help: 'Total number of orders processed',
  labelNames: ['status', 'warehouse_id', 'environment'],
  registers: [register]
});

const warehouseOperations = new client.Counter({
  name: 'scoms_warehouse_operations_total',
  help: 'Total number of warehouse operations',
  labelNames: ['operation', 'warehouse_id', 'environment'],
  registers: [register]
});

const databaseConnections = new client.Gauge({
  name: 'scoms_db_connections_active',
  help: 'Number of active database connections',
  labelNames: ['environment'],
  registers: [register]
});

// Error metrics
const applicationErrors = new client.Counter({
  name: 'scoms_errors_total',
  help: 'Total number of application errors',
  labelNames: ['error_type', 'severity', 'environment'],
  registers: [register]
});

// Middleware to collect HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc({ environment });

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    // Record metrics
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
      environment
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
        environment
      },
      duration
    );
    
    // Decrement active connections
    activeConnections.dec({ environment });
  });

  next();
};

// Metrics endpoint handler
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
};

// Business metrics functions
export const recordOrderMetric = (status: string, warehouseId: string) => {
  ordersTotal.inc({ status, warehouse_id: warehouseId, environment });
};

export const recordWarehouseOperation = (operation: string, warehouseId: string) => {
  warehouseOperations.inc({ operation, warehouse_id: warehouseId, environment });
};

export const setDatabaseConnections = (count: number) => {
  databaseConnections.set({ environment }, count);
};

export const recordError = (errorType: string, severity: string) => {
  applicationErrors.inc({ error_type: errorType, severity, environment });
};

export { register };
