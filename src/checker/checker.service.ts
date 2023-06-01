import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { ExceptionService } from 'src/exception/exception.service';

export interface ValidationError {
    index: number;
    message: string;
    context?: {
        path?: string | string[];
    } & {
        type?: string;
    };
}

@Injectable()
export class CheckerService {
    public constructor(
        private readonly exceptionService: ExceptionService,
    ) {}

    public checkParams(values: any, checkerMap: Record<string, <T>(value: T) => boolean>) {
        const invalidParams = Object.keys(checkerMap).filter((paramName) => {
            const currentValue = values?.[paramName];
            const currentChecker = checkerMap?.[paramName];
            if (typeof currentChecker === 'function') {
                return currentChecker(currentValue);
            }
            return false;
        });

        if (invalidParams.length > 0) {
            throw this.exceptionService.createException(ExceptionService.ErrorCode.INPUT_PARAMS_MISMATCHING, {
                params: invalidParams,
                exception: BadRequestException,
            });
        }
    }
}
