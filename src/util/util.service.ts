import {
    Injectable,
    Type,
} from '@nestjs/common';
import {
    FindOptions,
    IncludeOptions,
    Includeable,
    Order,
    Transaction,
    WhereOptions,
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ExceptionService } from 'src/exception/exception.service';
import {
    Model,
    ModelType,
    Sequelize,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { BaseModel } from 'src/common';
import { PaginationSearchOptions } from 'src/app.interface';
import * as _ from 'lodash';
import { ConfigService } from '@nestjs/config';
import {
    ClassConstructor,
    ClassTransformOptions,
    plainToInstance,
} from 'class-transformer';
import { CheckerService } from 'src/checker/checker.service';

@Injectable()
export class UtilService {
    private tempIds: string[] = [];

    public constructor(
        private readonly exceptionService: ExceptionService,
        private readonly sequelize: Sequelize,
        private readonly configService: ConfigService,
        private readonly checkerService: CheckerService,
    ) {}

    public generateRandomText(length = 32, extraCharacters = '') {
        const seed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.concat(extraCharacters);
        let result = '';

        while (result.length < length) {
            result += seed.charAt(Math.floor(Math.random() * seed.length));
        }

        return result;
    }

    public generateTempId() {
        while (true) {
            const currentTempId = uuidv4();

            if (this.tempIds.indexOf(currentTempId) === -1) {
                this.tempIds.push(currentTempId);
                return `temp$:${currentTempId}`;
            }
        }
    }

    public extractTempId(idOrTempId: string) {
        if (!idOrTempId) {
            return null;
        }

        const regex = /^temp\$:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!regex.test(idOrTempId)) {
            return;
        }

        return /^temp\$:(.*)$/g.exec(idOrTempId)?.[1] || null;
    }

    public async withTransaction<T = any>(
        {
            callback,
            unmanaged = false,
            outerTransaction,
        }: {
            callback: (transaction: Transaction) => Promise<T>,
            unmanaged?: boolean;
            outerTransaction?: Transaction;
        },
    ) {
        if (typeof callback !== 'function') {
            return;
        }

        if (outerTransaction) {
            return await callback(outerTransaction);
        } else {
            if (!unmanaged) {
                return await this.sequelize.transaction(async (transaction) => {
                    return await callback(transaction);
                });
            } else {
                const unmanagedTransaction = await this.sequelize.transaction();
                try {
                    const result = await callback(unmanagedTransaction);
                    return result;
                } catch (e) {
                    await unmanagedTransaction.rollback();
                }
            }
        }
    }

    public async performPaginationQuery<D, T extends BaseModel>(
        {
            model,
            cursorField = 'id',
            outerTransaction,
            limit = 20,
            order = [['createdAt', 'DESC']],
            lastCursor,
            options: rawOptions = {},
            search = {},
            DTOClass,
            modelPaths = [],
            allowedSearchFields = [],
            resultItemGetter,
        }: {
            model: typeof BaseModel<any>;
            DTOClass: Type<D>;
            cursorField?: string;
            outerTransaction?: Transaction;
            limit?: number;
            lastCursor?: string;
            options?: FindOptions;
            search?: PaginationSearchOptions;
            modelPaths?: Type[];
            order?: Order;
            allowedSearchFields?: string[];
            resultItemGetter?: (item: T) => any,
        },
    ): Promise<{
        data: D[];
        has_next: boolean;
        last: string;
    }> {
        this.checkerService.checkParams(
            {
                model,
            },
            {
                model: (value) => !value,
            },
        );

        return await this.withTransaction({
            outerTransaction,
            callback: async (transaction) => {
                const generatePaginationQueryWhereOptions = async (lastCursor: string): Promise<WhereOptions> => {
                    let lastCursorQueryResult: BaseModel;

                    if (lastCursor && typeof lastCursor === 'string') {
                        lastCursorQueryResult = await model.findOne({
                            where: {
                                id: lastCursor,
                            } as any,
                            include: rawOptions.include,
                            transaction,
                        });

                        if (typeof resultItemGetter === 'function') {
                            lastCursorQueryResult = resultItemGetter(lastCursorQueryResult as unknown as T);
                        }
                    }

                    const createdAtField = 'createdAt';
                    const paginationWhereOptions: WhereOptions = lastCursorQueryResult
                        ? {
                            [createdAtField]: {
                                [Op.lte]: lastCursorQueryResult.get(createdAtField),
                            },
                            [Op.or]: [
                                {
                                    [createdAtField]: {
                                        [Op.lt]: lastCursorQueryResult.get(createdAtField),
                                    },
                                },
                                {
                                    [cursorField]: {
                                        [Op.lt]: lastCursorQueryResult.get(cursorField),
                                    },
                                },
                            ],
                        }
                        : {};
                    const otherWhereOptions = Object.keys(search).reduce((result, currentField) => {
                        if (allowedSearchFields?.length > 0 && allowedSearchFields?.indexOf(currentField) < 0) {
                            return result;
                        }

                        const {
                            value,
                            like = true,
                        } = search[currentField] || { value: null };

                        if (typeof value !== 'string') {
                            return result;
                        }

                        if (like) {
                            result[currentField] = {
                                [Op.like]: value,
                            };
                        } else {
                            result[currentField] = value;
                        }

                        return result;
                    }, {} as Record<string, any>);
                    let whereOptions: WhereOptions = {
                        ...paginationWhereOptions,
                        ...otherWhereOptions,
                    };

                    if (Object.keys(rawOptions?.where || {}).length > 0) {
                        whereOptions = {
                            [Op.and]: [
                                whereOptions,
                                rawOptions.where,
                            ],
                        };
                    }

                    return whereOptions;
                };
                const getOptions = (options: FindOptions, whereOptions?: WhereOptions) => {
                    const currentOptions: FindOptions = _.cloneDeep(_.omit(options, [
                        'limit',
                        'order',
                        'where',
                    ]));

                    const recursivelyGetTargetedRelationIndexes = (includes: Includeable[], modelClasses: Type[], result: number[] = []): number[] => {
                        if (!Array.isArray(includes) || includes.length === 0 || modelClasses.length === 0) {
                            return result;
                        }

                        const ModelClass = modelClasses[0];
                        let index = includes.findIndex((includeItem) => (includeItem as IncludeOptions)?.model === ModelClass);

                        if (index === -1) {
                            index = null;
                        }

                        if (index === null) {
                            return result;
                        }

                        result.push(index);

                        if (modelClasses.length > 1) {
                            return recursivelyGetTargetedRelationIndexes(
                                (includes[index] as IncludeOptions)?.include,
                                modelClasses.slice(1),
                                result,
                            );
                        }

                        return result;
                    };
                    const includeIndexes = recursivelyGetTargetedRelationIndexes(currentOptions.include as Includeable[], modelPaths);

                    if (includeIndexes.length !== modelPaths.length) {
                        throw this.exceptionService.createException(ExceptionService.ErrorCode.FAILED_TO_LOCATE_MODEL_PATH, {});
                    }

                    const generateKeyName = (subPath: string) => {
                        const keyName = includeIndexes.length === 0
                            ? ''
                            : 'include' + includeIndexes.map((indexValue, index) => {
                                return `[${indexValue}]${index === includeIndexes.length - 1 ? '' : '.include' }`;
                            });
                        return `${keyName ? `${keyName}.` : ''}${subPath}`;;
                    };

                    if (Object.keys(whereOptions).length > 0) {
                        _.set(currentOptions, generateKeyName('where'), whereOptions);
                    }

                    if (limit > 0) {
                        currentOptions.limit = limit;
                    }

                    if (Array.isArray(order) && includeIndexes.length > 0) {
                        let currentIncludes: Array<IncludeOptions | ModelType<any, any>> = currentOptions?.include as IncludeOptions[];
                        const associations = includeIndexes.map((indexValue) => {
                            const currentIncludeAssociation = currentIncludes?.[indexValue];

                            if (!(currentIncludeAssociation as IncludeOptions)?.as && !(currentIncludeAssociation as IncludeOptions)?.model) {
                                return currentIncludeAssociation as ModelType<any, any>;
                            } else {
                                const {
                                    as: associationValue,
                                    model,
                                } = (currentIncludeAssociation as IncludeOptions) || {};
                                currentIncludes = (currentIncludeAssociation as IncludeOptions)?.include as Array<IncludeOptions | ModelType<any, any>>;
                                return {
                                    as: associationValue,
                                    model,
                                };
                            }
                        });

                        currentOptions.order = order.map((orderItem) => {
                            if (!Array.isArray(orderItem) || orderItem.length > 2 || associations.some((item) => !item)) {
                                return orderItem;
                            }

                            return associations.concat(orderItem as [any?, string?]);
                        }) as Order;
                    } else {
                        currentOptions.order = order;
                    }

                    return currentOptions;
                };

                const queryResult = (await model.findAll({
                    ...getOptions(rawOptions, await generatePaginationQueryWhereOptions(lastCursor)),
                    transaction,
                })) as unknown[] as T[];
                let hasNext = false;

                {
                    const currentLastItemId = queryResult[queryResult?.length - 1]?.get('id');

                    if (!currentLastItemId || limit <= 0) {
                        hasNext = false;
                    } else {
                        const nextFirstQueryResult = await model.findOne({
                            ...getOptions(rawOptions, await generatePaginationQueryWhereOptions(currentLastItemId)),
                            transaction,
                        });
                        hasNext = Boolean(nextFirstQueryResult);
                    }
                }

                const result = {
                    has_next: hasNext,
                    data: queryResult.map((item) => {
                        return new DTOClass(typeof resultItemGetter === 'function' ? resultItemGetter(item) : item);
                    }),
                    last: queryResult[queryResult.length - 1].get('id'),
                };

                return result;
            },
        });
    }

    public getModelFieldEnumValues<T = any>(model: Type<Model<any, any>>, fieldName: string): T[] {
        const repository = this.sequelize.getRepository(model);

        if (!repository) {
            return [];
        }

        const field = repository?.getAttributes()?.[fieldName];

        if (!field) {
            return [];
        }

        if (Array.isArray(field.values)) {
            return field.values;
        }

        return [];
    }

    public plainToInstance<T, V>(cls: ClassConstructor<T>, plain: V, options: ClassTransformOptions = {}): T {
        return plainToInstance<T, V>(cls, plain, {
            ...this.configService.get('classTransformer'),
            ...options,
        });
    }
}
