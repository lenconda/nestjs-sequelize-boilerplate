import {
    ArgumentMetadata,
    mixin,
    PipeTransform,
    Type,
    ValidationPipe,
} from '@nestjs/common';
import { memoize } from 'lodash';

function createTransformArrayDTOPipe<T>(itemType: Type<T>): Type<PipeTransform> {
    class MixinTransformArrayDTOPipe extends ValidationPipe implements PipeTransform {
        public constructor() {
            super({
                transform: true,
                transformOptions: {
                    excludeExtraneousValues: true,
                    enableImplicitConversion: true,
                },
            });
        }

        public transform(values: T[], metadata: ArgumentMetadata): Promise<any[]> {
            if (!Array.isArray(values)) {
                return [];
            }
            return Promise.all(values.map((value) => super.transform(
                value,
                {
                    ...metadata,
                    metatype: itemType,
                },
            )));
        }
    }
    return mixin(MixinTransformArrayDTOPipe);
}

export const TransformArrayDTOPipe: <T>(itemType: Type<T>) => Type<PipeTransform> = memoize(createTransformArrayDTOPipe);
