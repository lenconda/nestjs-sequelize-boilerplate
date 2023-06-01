import {
    Controller,
    ControllerOptions,
} from '@nestjs/common';

export function createPrefixedPathController(prefix: string) {
    const addPrefix = (pathname: string, prefix: string) => typeof pathname === 'string'
        ? `${prefix}${pathname.startsWith('/') ? '' : '/'}${pathname}`
        : typeof pathname === 'undefined'
            ? prefix
            : pathname;

    const modifyControllerArgument = (argument, prefix: string) => {
        let newArgument;

        if (typeof argument === 'string') {
            newArgument = addPrefix(argument, prefix);
        } else if (Array.isArray(argument)) {
            newArgument = argument.map((argumentItem) => addPrefix(argumentItem, prefix));
        } else if ((argument as ControllerOptions)?.path) {
            newArgument = modifyControllerArgument((argument as ControllerOptions)?.path, prefix);
        } else if (typeof argument === 'undefined') {
            return addPrefix(argument, prefix);
        } else {
            return argument;
        }

        return newArgument;
    };

    return function(argument?: string | string[] | ControllerOptions) {
        // eslint-disable-next-line @typescript-eslint/no-invalid-this
        return Controller.call(this, modifyControllerArgument(argument, prefix));
    };
};
