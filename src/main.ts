import {
    NestFactory,
    Reflector,
} from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import {
    ClassSerializerInterceptor,
    ValidationPipe,
    VersioningType,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { remixEnv } from './common';

async function bootstrap() {
    remixEnv();

    const app = await NestFactory.create(AppModule);
    const configService = app.get<ConfigService>(ConfigService);

    app.enableCors({
        allowedHeaders: '*',
        origin: '*',
    });
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
    }));
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    if (process.env.NODE_ENV !== 'development') {
        app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
    }

    app.useGlobalInterceptors(new ClassSerializerInterceptor(
        app.get(Reflector),
        {
            excludeExtraneousValues: true,
        },
    ));
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.listen(
        configService.get<number>('app.port'),
        configService.get<string>('app.host'),
    );
}

bootstrap();
