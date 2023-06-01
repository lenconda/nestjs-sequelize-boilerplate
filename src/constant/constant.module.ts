import {
    Global,
    Module,
} from '@nestjs/common';
import { ConstantService } from './constant.service';

@Global()
@Module({
    providers: [ConstantService],
    exports: [ConstantService],
})
export class ConstantModule {}
