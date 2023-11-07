import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const req = context.switchToHttp().getRequest();
    const { url, method } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap((body) => {
        const res = context.switchToHttp().getResponse();
        const { statusCode } = res;
        const responseTime = Date.now() - now;
        console.log(
          `[${className}.${methodName}] [${method} ${url}] ${statusCode} ${responseTime}ms `,
        );
        if (body) {
          console.log(body);
        }
      }),
    );
  }
}
