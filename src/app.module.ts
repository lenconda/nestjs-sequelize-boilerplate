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
import dbConfig from './config/db.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [
                dbConfig,
            ],
            isGlobal: true,
        }),
        SequelizeModule.forRootAsync({
            useFactory: async (configService: ConfigService) => {
                const basicConfig = configService.get<SequelizeModuleOptions>('db');
                return {
                    ...basicConfig,
                    synchronize: true,
                    autoLoadModels: true,
                };
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
