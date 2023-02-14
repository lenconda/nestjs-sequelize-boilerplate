import * as path from 'path';
import * as dotenv from 'dotenv';

export const remixEnv = () => {
    if (typeof process.env.NODE_ENV !== 'string') {
        return;
    }

    const modeSpecifiedEnv = dotenv.config({
        path: path.join(process.cwd(), `.env.${process.env.NODE_ENV.toLowerCase()}`),
    });

    Object.assign(process.env, {
        ...(modeSpecifiedEnv?.parsed || {}),
    });
};
