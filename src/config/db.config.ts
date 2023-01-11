import { registerAs } from '@nestjs/config';

export default registerAs('db', () => {
    const {
        DB_TYPE: dialect,
        DB_HOST: host,
        DB_PORT: port,
        DB_USERNAME: username,
        DB_PASSWORD: password,
        DB_NAME: database,
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
