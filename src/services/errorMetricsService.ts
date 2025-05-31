import { ErrorCategory, ErrorMetrics, ErrorSeverity } from '../errors/ErrorTypes';
import logger from '../utils/logger';

/**
 * Service for collecting and reporting error metrics
 */
export class ErrorMetricsService {
  private static instance: ErrorMetricsService;
  private errorCounts: Map<string, number> = new Map();
  private errorRates: Map<string, { count: number; window: number }> = new Map();
  private readonly RATE_WINDOW_MS = 60000; // 1 minute window
  private readonly MAX_ERROR_RATE = 100; // errors per minute

  static getInstance(): ErrorMetricsService {
    if (!ErrorMetricsService.instance) {
      ErrorMetricsService.instance = new ErrorMetricsService();
    }
    return ErrorMetricsService.instance;
  }

  /**
   * Record error metrics for monitoring and alerting
   */
  recordError(metrics: ErrorMetrics): void {
    const { category, severity, statusCode, endpoint, correlationId: _correlationId } = metrics;

    // Log structured error metrics
    logger.info(
      {
        type: 'error_metrics',
        ...metrics,
      },
      'Error metrics recorded'
    );

    // Track error counts by category
    const categoryKey = `${category}:${statusCode}`;
    this.errorCounts.set(categoryKey, (this.errorCounts.get(categoryKey) || 0) + 1);

    // Track error rates for circuit breaker
    this.updateErrorRate(endpoint);

    // Send to external monitoring services in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(metrics);
    }

    // Trigger alerts for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.triggerCriticalAlert(metrics);
    }
  }

  /**
   * Get error statistics for health checks
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const errorsByCategory: Record<string, number> = {};

    this.errorCounts.forEach((count, key) => {
      errorsByCategory[key] = count;
    });

    // Determine health status based on error rates
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    const criticalErrors = errorsByCategory[`${ErrorCategory.SYSTEM}:500`] || 0;
    const highSeverityErrors = Object.entries(errorsByCategory)
      .filter(
        ([key]) =>
          key.includes(ErrorCategory.EXTERNAL_SERVICE) || key.includes(ErrorCategory.DATABASE)
      )
      .reduce((sum, [, count]) => sum + count, 0);

    if (criticalErrors > 0) {
      healthStatus = 'unhealthy';
    } else if (highSeverityErrors > 10 || totalErrors > 50) {
      healthStatus = 'degraded';
    }

    return {
      totalErrors,
      errorsByCategory,
      healthStatus,
    };
  }

  /**
   * Check if endpoint should be circuit broken based on error rate
   */
  shouldCircuitBreak(endpoint: string): boolean {
    const now = Date.now();
    const rateData = this.errorRates.get(endpoint);

    if (!rateData) return false;

    // Reset window if expired
    if (now - rateData.window > this.RATE_WINDOW_MS) {
      this.errorRates.set(endpoint, { count: 0, window: now });
      return false;
    }

    return rateData.count > this.MAX_ERROR_RATE;
  }

  /**
   * Reset error counts (useful for testing or periodic cleanup)
   */
  reset(): void {
    this.errorCounts.clear();
    this.errorRates.clear();
  }

  private updateErrorRate(endpoint: string): void {
    const now = Date.now();
    const current = this.errorRates.get(endpoint) || { count: 0, window: now };

    // Reset if window expired
    if (now - current.window > this.RATE_WINDOW_MS) {
      this.errorRates.set(endpoint, { count: 1, window: now });
    } else {
      this.errorRates.set(endpoint, { count: current.count + 1, window: current.window });
    }
  }

  private sendToMonitoring(metrics: ErrorMetrics): void {
    // Integration points for external monitoring services
    // Examples: DataDog, New Relic, Prometheus, etc.

    // DataDog example (would require datadog client):
    // this.datadogClient?.increment('scoms.errors', 1, [`category:${metrics.category}`]);

    // Custom webhook example:
    // this.sendWebhook('/monitoring/errors', metrics);

    logger.debug({ metrics }, 'Error metrics would be sent to external monitoring');
  }

  private triggerCriticalAlert(metrics: ErrorMetrics): void {
    // Integration points for alerting systems
    // Examples: PagerDuty, Slack, email, etc.

    logger.error(
      {
        type: 'critical_alert',
        ...metrics,
      },
      'CRITICAL ERROR ALERT triggered'
    );

    // In production, this would trigger actual alerts:
    // - PagerDuty incident
    // - Slack notification to oncall channel
    // - Email to engineering team
    // - SMS for P0 incidents
  }
}
