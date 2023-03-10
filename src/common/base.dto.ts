import { Expose } from 'class-transformer';
import { Model } from 'sequelize';
import * as _ from 'lodash';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';

export class BaseDTO<T = any> {
    @Expose({ name: 'created_at' })
    public createdAt?: Date;

    @Expose({ name: 'updated_at' })
    public updatedAt?: Date;

    public constructor(data: T) {
        if ((data as Model)?.dataValues) {
            Object.assign(this, (data as Model).dataValues);
        } else if (data) {
            Object.assign(this, data);
        }

        try {
            const typeMetadata = defaultMetadataStorage._typeMetadatas.get(this.constructor);
            if (typeMetadata instanceof Map) {
                typeMetadata.forEach((value, key) => {
                    let TargetType: any;
                    try {
                        TargetType = value.typeFunction({
                            newObject: Array.isArray(this[key]) ? this[key][0] : this[key],
                            object: this,
                            property: key,
                        });
                    } catch (e) {}
                    if (!TargetType && value?.reflectedType !== Array) {
                        TargetType = value.reflectedType;
                    }
                    if (TargetType) {
                        if (value?.reflectedType === Array && Array.isArray(this[key])) {
                            this[key] = this[key].map((item) => item instanceof TargetType ? item : new TargetType(item));
                        } else if (this[key]) {
                            this[key] = this[key] instanceof TargetType ? this[key] : new TargetType(this[key]);
                        }
                    }
                });
            }
        } catch (e) {}
    }

    protected nesten<T = any>(
        inputs: T[],
        findParent: (item: T, inputs: T[]) => T,
        onParentFinded: (parentItem: T, item: T) => void,
    ) {
        if (!inputs || !_.isArray(inputs) || !_.isFunction(findParent) || !_.isFunction(onParentFinded)) {
            return inputs;
        }

        const inputItems = _.cloneDeep(inputs);
        const result: T[] = [];

        for (const inputItem of inputItems) {
            const parentItem = findParent(inputItem, inputItems);
            if (parentItem) {
                onParentFinded(parentItem, inputItem);
            }
            result.push(inputItem);
        }

        return result;
    }
}
