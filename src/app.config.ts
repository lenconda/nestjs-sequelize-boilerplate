import { registerAs } from '@nestjs/config';

export default [
    registerAs('app', () => {
        const {
            APP_HOST: host = '0.0.0.0',
            APP_PORT: port = '3000',
            APP_LOG_FILE: logFile = './logs/runtime.log',
        } = process.env ?? {};
        return {
            host,
            port: parseInt(port, 10),
            logFile,
        };
    }),
    registerAs('db', () => {
        const {
            DB_TYPE: dialect = 'mysql',
            DB_HOST: host = '0.0.0.0',
            DB_PORT: port = '3306',
            DB_USERNAME: username = 'root',
            DB_PASSWORD: password = 'root',
            DB_NAME: database = 'example',
        } = process.env ?? {};
        return {
            dialect,
            host,
            port: Number(port) || 3306,
            username: username || 'root',
            password,
            database,
        };
    }),
];
