import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import {
  ConflicError,
  DomainError,
  NotFoundError,
  ValidationError,
} from '../../domain/shared/errors';
import { ApiErrorResponse, ErrorCode } from '@shuttle-connect/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let status: number, message: string, errorCode: string;
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof NotFoundError) {
      status = 404;
    } else if (exception instanceof ValidationError) {
      status = 400;
    } else if (exception instanceof ConflicError) {
      status = 409;
    } else {
      status = 500;
    }

    if (exception instanceof DomainError) {
      message = exception.message;
      errorCode = exception.code;
    } else {
      message = 'Internal server error';
      errorCode = ErrorCode.SERVER_ERROR;
    }

    const body: ApiErrorResponse = {
        success: false,
        error: {
            code: errorCode,
            statusCode: status,
            message
        }
    }

    response.status(status).json(body);
  }
}
