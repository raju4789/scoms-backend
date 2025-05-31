/**
 * Generic application error for SCOMS backend. Use for any domain, repository, or service layer errors.
 * Name defaults to 'AppError' but can be customized for context.
 */
export class AppError extends Error {
  public readonly cause?: unknown;
  constructor(message: string, options?: { name?: string; cause?: unknown }) {
    super(message);
    this.name = options?.name || 'AppError';
    this.cause = options?.cause;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
