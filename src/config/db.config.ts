import { registerAs } from '@nestjs/config';

export default registerAs('db', () => {
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
});
