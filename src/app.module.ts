import {
    MiddlewareConsumer,
    Module,
    Scope,
} from '@nestjs/common';
import {
    ConfigModule,
    ConfigService,
} from '@nestjs/config';
import {
    SequelizeModule,
    SequelizeModuleOptions,
} from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
    WinstonLogger,
    WinstonModule,
    WINSTON_MODULE_NEST_PROVIDER,
} from 'nest-winston';
import * as winston from 'winston';
import configs from './app.config';
import { LoggerService } from './logger/logger.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppInterceptor } from './app.interceptor';
import { AppMiddleware } from './app.middleware';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: configs,
            isGlobal: true,
        }),
        WinstonModule.forRootAsync({
            useFactory: (configService: ConfigService) => {
                return {
                    transports: [
                        new winston.transports.Console(),
                        ...(
                            process.env.NODE_ENV !== 'development'
                                ? [
                                    new winston.transports.File({
                                        level: 'info',
                                        filename: configService.get<string>('app.logFile'),
                                    }),
                                ]
                                : []
                        ),
                    ],
                    exitOnError: false,
                    format: winston.format.combine(
                        winston.format.timestamp({
                            format: 'YYYY-MM-DD HH:mm:ss',
                        }),
                        winston.format.printf((info) => `${info.timestamp} - ${info.level}: [${info.context}] ${info.message}` + (info.splat !== undefined ? `${info.splat}` : ' ')),
                    ),
                };
            },
            imports: [ConfigModule],
            inject: [ConfigService],
        }),
        SequelizeModule.forRootAsync({
            useFactory: async (configService: ConfigService, logger: WinstonLogger) => {
                const basicConfig = configService.get<SequelizeModuleOptions>('db');
                return {
                    ...basicConfig,
                    synchronize: true,
                    autoLoadModels: true,
                    logQueryParameters: true,
                    logging(sql) {
                        logger.log(sql, 'Sequelize');
                    },
                };
            },
            inject: [
                ConfigService,
                WINSTON_MODULE_NEST_PROVIDER,
            ],
        }),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        LoggerService,
        {
            provide: APP_INTERCEPTOR,
            scope: Scope.REQUEST,
            useClass: AppInterceptor,
        },
    ],
})
export class AppModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer.apply(AppMiddleware).forRoutes('*');
    }
}
