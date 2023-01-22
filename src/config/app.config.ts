import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
    const {
        APP_PORT: port,
    } = process.env ?? {};

    return {
        port: parseInt(port, 10),
    };
});
