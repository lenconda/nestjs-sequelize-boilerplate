import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
    const {
        APP_HOST: host = '0.0.0.0',
        APP_PORT: port = '3000',
    } = process.env ?? {};

    return {
        host,
        port: parseInt(port, 10),
    };
});
