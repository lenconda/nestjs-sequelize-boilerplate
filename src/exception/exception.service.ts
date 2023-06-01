import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    Type,
} from '@nestjs/common';

/**
 * 00000: no error
 * A0000: user failure
 *  A0100: user authorization and authentication failure
 *  A0200: user data mismatching
 *  A0300: second class mecro error code for input data error
 * B0000: system failure
 *  B0100: configuration missing errors
 *  B0200: configuration mismatching errors
 *  B0300: errors that caused by server code issues
 *  B0400: permission mismatching
 *  B0500: status forbidden
 *  B0600: resource failure
 * C0000: first class macor error code for a third-party module failure
 *  C0100: OAuth2 failure
 *  C0200: GitHub failure
 */
enum ErrorCode {
    UNRECOGNIZED_ERROR = '~0000',
    UNAUTHORIZED_NO_USERID = 'A0101',
    URL_PARAMS_MISMATCHING = 'A0201',
    INPUT_PARAMS_MISMATCHING = 'A0303',
    SERVER_GENERIC_ERROR = 'B0301',
    FAILED_TO_LOCATE_MODEL_PATH = 'B0308',
    NOT_PERMITTED = 'B0401',
    OAUTH2_USER_NOT_VERIFIED = 'C0101',
    OAUTH2_USER_NOT_FOUND = 'C0102',
}

interface CreateExceptionMap {
    [ErrorCode.URL_PARAMS_MISMATCHING]: {
        params: string[];
    };
    [ErrorCode.OAUTH2_USER_NOT_VERIFIED]: {
        userId: string;
    };
    [ErrorCode.INPUT_PARAMS_MISMATCHING]: {
        params: string[];
    };
    [ErrorCode.OAUTH2_USER_NOT_FOUND]: {
        userId: string;
    };
    [key: string]: {};
}

interface CreateExceptionFnBaseOptions {
    exception?: Type<HttpException>;
}

type CreateExceptionFn = <T extends keyof CreateExceptionMap>(code: T, options: CreateExceptionMap[T] & CreateExceptionFnBaseOptions) => HttpException;

@Injectable()
export class ExceptionService {
    public static ErrorCode = ErrorCode;

    public createException: CreateExceptionFn;

    public constructor() {
        const createException: CreateExceptionFn = (code, options = {}) => {
            const {
                exception: Exception = InternalServerErrorException,
                ...context
            } = options;
            return new Exception({
                code,
                context,
            });
        };
        this.createException = createException.bind(this);
    }
}
