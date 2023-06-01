import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ExceptionService } from './exception/exception.service';
import { LoggerService } from './logger/logger.service';
import {
    Request,
    Response as ExpressResponse,
} from 'express';
import { Send } from 'express-serve-static-core';
// TODO
// import { UserDTO } from './user/user.dto';

export type Response = Record<string, any>;

@Injectable()
export class AppInterceptor<T> implements NestInterceptor<T, Response> {
    public constructor(
        private readonly exceptionService: ExceptionService,
        private readonly loggerService: LoggerService,
    ) {}

    public async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<Response>> {
        const request: Request & { /* user?: UserDTO */ } = context.switchToHttp().getRequest();
        const response: ExpressResponse = context.switchToHttp().getResponse();

        try {
            const {
                headers,
                body,
                method,
                path,
                query,
                params,
                // TODO: add user
                // user,
            } = request;

            const data = JSON.stringify({
                headers,
                body,
                method,
                path,
                query,
                params,
                // TODO: userId
                // userId: user?.id,
            });

            this.loggerService.log(`[REQUEST] ${data}`);

            if (typeof response.send === 'function') {
                const oldResponseSend = response.send;
                response.send = ((data) => {
                    this.loggerService.log(`[RESPONSE:DATA] ${data}`);
                    this.loggerService.log(`[RESPONSE:HEADERS] ${JSON.stringify(response.getHeaders())}`);
                    oldResponseSend.call(response, data);
                }) as Send<any, ExpressResponse<any, Record<string, any>>>;
            }
        } catch (e) {}

        return next.handle().pipe(
            catchError((e) => {
                this.loggerService.error(e);
                this.loggerService.error(e?.stack);
                if (e instanceof HttpException) {
                    throw e;
                } else {
                    throw this.exceptionService.createException(ExceptionService.ErrorCode.SERVER_GENERIC_ERROR, {});
                }
            }),
        );
    }
}
