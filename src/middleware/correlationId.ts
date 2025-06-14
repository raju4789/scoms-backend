import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {

    // Extend the Request interface to include correlationId
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Middleware to generate and attach correlation IDs to requests for traceability
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if correlation ID is provided in headers, otherwise generate one
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    uuidv4();

  // Attach to request for use in handlers
  req.correlationId = correlationId;

  // Add to response headers for client tracking
  res.setHeader('x-correlation-id', correlationId);

  next();
}
