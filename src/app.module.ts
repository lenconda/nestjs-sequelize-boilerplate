import { Module } from '@nestjs/common';
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
                                        filename: configService.get<string>('app.logFile'),
                                    }),
                                ]
                                : []
                        ),
                    ],
                    exitOnError: false,
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
    providers: [AppService],
})
export class AppModule {}
