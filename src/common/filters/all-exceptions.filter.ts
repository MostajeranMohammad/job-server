import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { DatabaseError } from 'pg';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const baseError = {
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json({
        ...baseError,
        statusCode: status,
        ...(typeof res === 'object' ? res : { message: res }),
      });
    } else if (exception instanceof QueryFailedError) {
      const pgErr = exception as unknown as DatabaseError;
      // default to 400, but handle unique-violation as 409 conflict
      status =
        pgErr.code === '23505' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
      response.status(status).json({
        ...baseError,
        statusCode: status,
        message: pgErr.detail || pgErr.message,
        error: pgErr.code,
      });
    } else {
      response.status(status).json({
        ...baseError,
        statusCode: status,
        message: 'Internal server error',
      });
    }

    // always log the error
    this.logger.error(
      `${request.method} ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
  }
}
