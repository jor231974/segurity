import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
    } else if (exception instanceof Error) {
      console.error('Excepción no controlada:', exception.message);
      if (exception.name === 'PrismaClientKnownRequestError') {
        const code = (exception as any).code;
        status = HttpStatus.CONFLICT;
        if (code === 'P2002') message = 'Registro duplicado: un dato ya existe';
        if (code === 'P2003') message = 'No se puede eliminar: registros relacionados';
        if (code === 'P2025') {
          status = HttpStatus.NOT_FOUND;
          message = 'Registro no encontrado';
        }
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      timestamp: new Date().toISOString(),
    });
  }
}