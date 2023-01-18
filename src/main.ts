import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

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
    await app.listen(3000);
}
bootstrap();
