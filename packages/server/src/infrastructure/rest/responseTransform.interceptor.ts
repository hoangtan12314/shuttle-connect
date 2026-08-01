import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ApiSuccessResponse } from '@shuttle-connect/types';
import { map, Observable } from 'rxjs';

export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );

  }
}
