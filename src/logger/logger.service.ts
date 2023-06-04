import {
    Inject,
    Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import {
    WINSTON_MODULE_NEST_PROVIDER,
    WinstonLogger,
} from 'nest-winston';
import {
    NJRS_REQUEST,
    RequestScope,
} from 'nj-request-scope';
import { ConstantService } from 'src/constant/constant.service';

@Injectable()
@RequestScope()
export class LoggerService {
    public constructor(
        @Inject(NJRS_REQUEST)
        private readonly request: Request,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger,
        private readonly constantService: ConstantService,
    ) {
        this.logger.setContext(this?.request?.[this.constantService.TRACE_ID_HEADER_NAME] as string || 'Generic');
    }

    public log(message: any) {
        this.logger.log(message);
    };

    public error(message: any) {
        this.logger.error(message);
    };

    public warn(message: any) {
        this.logger.warn(message);
    };

    public debug(message: any) {
        this.logger.debug(message);
    };

    public verbose(message: any) {
        this.logger.verbose(message);
    };
}
