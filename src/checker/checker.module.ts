import {
    Global,
    Module,
} from '@nestjs/common';
import { CheckerService } from './checker.service';

@Global()
@Module({
    providers: [CheckerService],
    exports: [CheckerService],
})
export class CheckerModule {}
