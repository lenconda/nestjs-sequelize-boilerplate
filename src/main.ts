import {
    NestFactory,
    Reflector,
} from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import {
    ClassSerializerInterceptor,
    VersioningType,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { remixEnv } from './common';
import { killPortProcess } from 'kill-port-process';
import { ClassTransformOptions } from 'class-transformer';

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
        defaultVersion: '1',
        type: VersioningType.URI,
    });
    app.useGlobalInterceptors(new ClassSerializerInterceptor(
        app.get(Reflector),
        configService.get<ClassTransformOptions>('classTransformer'),
    ));

    const port = configService.get<number>('app.port');

    if (process.env.NODE_ENV === 'development') {
        try {
            await killPortProcess(port);
        } catch (e) {}
    }

    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    await app.listen(
        port,
        configService.get<string>('app.host'),
    );
}

bootstrap();
