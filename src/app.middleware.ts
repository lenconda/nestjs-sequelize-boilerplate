import {
    Injectable,
    NestMiddleware,
} from '@nestjs/common';
import { ConstantService } from './constant/constant.service';
import {
    Request,
    Response,
} from 'express';
import { UtilService } from './util/util.service';

@Injectable()
export class AppMiddleware implements NestMiddleware {
    public constructor(
        private readonly constantService: ConstantService,
        private readonly utilService: UtilService,
    ) {}

    public use(request: Request, response: Response, next: () => void) {
        const traceId = this.utilService.extractTempId(this.utilService.generateTempId());
        request[this.constantService.TRACE_ID_HEADER_NAME] = traceId;
        response.setHeader(this.constantService.TRACE_ID_HEADER_NAME, traceId);
        next();
    }
}
