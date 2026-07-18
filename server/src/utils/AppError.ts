/**
 * Represents an operational application error with an associated HTTP status code.
 *
 * Distinguishes between expected business errors and unexpected system failures
 * via the `isOperational` flag, enabling the global `errorHandler` middleware
 * to decide whether to expose the message to the client or return a generic `500`.
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  /**
   * @param message - Human-readable error description forwarded to the HTTP response body.
   * @param statusCode - HTTP status code for the response. Defaults to `500`.
   */
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
