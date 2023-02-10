import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import { VersioningType } from '@nestjs/common';

const remixEnv = () => {
    if (typeof process.env.NODE_ENV !== 'string') {
        return;
    }

    const modeSpecifiedEnv = dotenv.config({
        path: path.join(process.cwd(), `.env.${process.env.NODE_ENV.toLowerCase()}`),
    });

    Object.assign(process.env, {
        ...(modeSpecifiedEnv?.parsed || {}),
    });
};

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

    await app.listen(
        configService.get<number>('app.port'),
        configService.get<string>('app.host'),
    );
}

bootstrap();
