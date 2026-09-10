/**
 * Split out of lib/content.ts so a caller can catch the error type without
 * importing the loader — lib/content.ts validates at module scope, so a static
 * import of it throws before any try block is entered.
 */
export class ContentValidationError extends Error {
  constructor(
    message: string,
    readonly details: string[],
  ) {
    super(message);
    this.name = 'ContentValidationError';
  }
}
