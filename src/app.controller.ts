import {
    Controller,
    Get,
    Version,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    public constructor(private readonly appService: AppService) {}

    @Get()
    @Version(['1', '2'])
    public getHello(): string {
        return this.appService.getHello();
    }
}
