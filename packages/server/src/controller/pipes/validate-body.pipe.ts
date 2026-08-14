import { BadRequestException, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * esbuild (used by SST to bundle the Lambda straight from .ts source) doesn't emit
 * `design:paramtypes` metadata for controller method parameters, only for constructors.
 * Nest's built-in `ValidationPipe` relies on that reflected metadata to know which class
 * to validate `@Body()` against — without it, `metatype` is undefined and validation is
 * silently skipped. Passing the class explicitly here sidesteps reflection entirely, so
 * it works the same whether the app is compiled by tsc or bundled by esbuild.
 */
export class ValidateBodyPipe<T extends object> implements PipeTransform {
  constructor(private readonly cls: new () => T) {}

  async transform(value: unknown): Promise<T> {
    const instance = plainToInstance(this.cls, value);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      // Kept as an array (matching class-validator's own ValidationPipe convention) so
      // GlobalExceptionFilter classifies this as a validation failure, not a malformed-body
      // error — it distinguishes the two by whether the exception message is an array.
      const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));
      throw new BadRequestException(messages);
    }

    return instance;
  }
}
