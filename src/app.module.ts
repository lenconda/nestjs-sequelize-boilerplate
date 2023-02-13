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
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import configs from './app.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: configs,
            isGlobal: true,
        }),
        SequelizeModule.forRootAsync({
            useFactory: async (configService: ConfigService) => {
                const basicConfig = configService.get<SequelizeModuleOptions>('db');
                return {
                    ...basicConfig,
                    synchronize: true,
                    autoLoadModels: true,
                    logQueryParameters: true,
                };
            },
            inject: [ConfigService],
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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
