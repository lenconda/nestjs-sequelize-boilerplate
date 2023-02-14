import {
    createParamDecorator,
    ExecutionContext,
} from '@nestjs/common';

export const CurrentUser = createParamDecorator(
    (data: string, context: ExecutionContext): any => {
        const user = context.switchToHttp().getRequest().user;

        if (!user) {
            return null;
        }

        const userData = (data ? user[data] : user) as any;

        return userData;
    },
);
