import {
    NestFactory,
    Reflector,
} from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import {
    ClassSerializerInterceptor,
    Type,
    VersioningType,
} from '@nestjs/common';
import {
    WINSTON_MODULE_NEST_PROVIDER,
    WinstonLogger,
} from 'nest-winston';
import {
    ListenerAbstractService,
    remixEnv,
} from './common';
import { killPortProcess } from 'kill-port-process';
import { ClassTransformOptions } from 'class-transformer';

async function bootstrap() {
    remixEnv();
    const app = await NestFactory.create(AppModule);
    const logger = app.get<WinstonLogger>(WINSTON_MODULE_NEST_PROVIDER);
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

    (await Promise.all(
        []
            .concat(
                (Reflect.getMetadata('imports', AppModule) as Type[] || [])
                    .map((ModuleClass) => {
                        return Reflect.getMetadata('providers', ModuleClass) as Type[] || [];
                    })
                    .reduce((result: Type[], currentExportedProviderClasses: Type[]) => {
                        return result.concat(currentExportedProviderClasses);
                    }, [] as Type[]),
            )
            .concat(Reflect.getMetadata('providers', AppModule) as Type[] || [])
            .filter((ProviderClass) => typeof ProviderClass?.prototype?.initListeners === 'function')
            .map((ProviderClass) => {
                return app
                    .resolve<ListenerAbstractService>(ProviderClass)
                    .then((provider) => ([ProviderClass, provider]));
            }),
    )).forEach(([ProviderClass, provider]) => {
        provider.initListeners();
        logger.log(`[${ProviderClass?.name}] Listeners initialized`);
    });

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
