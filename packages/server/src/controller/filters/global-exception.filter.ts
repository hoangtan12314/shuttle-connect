import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import {
  ConflicError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../domain/shared/errors';
import { ApiErrorResponse, ErrorCode } from '@shuttle-connect/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let status: number, message: string, errorCode: string;
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ValidationError) {
      status = 400;
    } else if (exception instanceof UnauthorizedError) {
      status = 401;
    } else if (exception instanceof ForbiddenError) {
      status = 403;
    } else if (exception instanceof NotFoundError) {
      status = 404;
    } else if (exception instanceof ConflicError) {
      status = 409;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else {
      status = 500;
    }

    if (exception instanceof DomainError) {
      message = exception.message;
      errorCode = exception.code;
    } else if (exception instanceof HttpException) {
      const httpBody = exception.getResponse();
      const rawMessage =
        typeof httpBody === 'string' ? httpBody : (httpBody as { message?: unknown }).message;

      if (Array.isArray(rawMessage)) {
        // class-validator (via ValidationPipe) always reports failures as an array of
        // per-constraint messages, even when only one field is invalid — this is what
        // distinguishes a real validation failure from a body-parsing failure below.
        message = rawMessage.join('; ');
        errorCode = ErrorCode.REQUEST_VALIDATION_FAILED;
      } else {
        // A BadRequestException with a plain string message, at least today, only comes
        // from Express's body parser failing to JSON.parse the request body (e.g. a
        // trailing comma or unquoted key) — that raw parser text isn't something an API
        // consumer should have to interpret, so replace it with a clear, actionable message.
        message =
          'Request body could not be parsed as JSON. Check for syntax errors such as missing quotes around keys/strings or a trailing comma.';
        errorCode = ErrorCode.MALFORMED_REQUEST_BODY;
      }
    } else {
      message = 'Internal server error';
      errorCode = ErrorCode.SERVER_ERROR;
      console.error('Unhandled exception:', exception);
    }

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        statusCode: status,
        message,
      },
    };

    response.status(status).json(body);
  }
}
