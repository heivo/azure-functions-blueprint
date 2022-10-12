import { ZodError } from 'zod';
import { Permission } from './user';

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor() {
    super(401, 'No valid authentication token');
  }
}

export class NotAllowedError extends HttpError {
  constructor(missingPermissions: Permission[]) {
    super(403, `Not allowed, missing permissions: ${missingPermissions.join(', ')}`);
  }
}

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export class RequestBodyValidationError extends ValidationError {
  constructor(zodError: ZodError) {
    super(formatZodError('Invalid request body', zodError));
  }
}

export class QueryValidationError extends ValidationError {
  constructor(zodError: ZodError) {
    super(formatZodError('Invalid query param(s)', zodError));
  }
}

function formatZodError(prefix: string, zodError: ZodError): string {
  return `${prefix}\n${zodError.errors
    .map((issue) => {
      if (issue.path.length) {
        return `\t - ${issue.path.join('.')}: ${issue.message}`;
      } else {
        return `\t - ${issue.message}`;
      }
    })
    .join('\n')}`;
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}
