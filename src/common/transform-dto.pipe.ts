import { ValidationPipe } from '@nestjs/common';

export class TransformDTOPipe extends ValidationPipe {
    public constructor() {
        super({
            transform: true,
            transformOptions: {
                excludeExtraneousValues: true,
                enableImplicitConversion: true,
            },
        });
    }
}
