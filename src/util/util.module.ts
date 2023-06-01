import {
    Global,
    Module,
} from '@nestjs/common';
import { UtilService } from './util.service';
import { UTIL_SERVICE } from './util-service.constant';

@Global()
@Module({
    providers: [
        UtilService,
        {
            provide: UTIL_SERVICE,
            useClass: UtilService,
        },
    ],
    exports: [
        UtilService,
        UTIL_SERVICE,
    ],
})
export class UtilModule {}
