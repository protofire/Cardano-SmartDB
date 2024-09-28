import { SelectQueryBuilder } from 'typeorm';
import { connectPostgres, databasePostgreSQL } from '../../Commons/BackEnd/dbPostgreSQL.js';
import { console_error, console_log } from '../../Commons/BackEnd/globalLogs.js';
import { OptionsGet } from '../../Commons/types.js';
import { isEmptyObject, toJson } from '../../Commons/utils.js';
import { BaseEntity } from '../../Entities/Base/Base.Entity.js';

export class PostgreSQLDatabaseService {
    public static async create<T extends BaseEntity>(instance: T): Promise<string> {
        try {
            await connectPostgres();
            console_log(0, instance.className(), `create instance T : ${toJson(instance)}`);
            const postgreSQLInterface = await instance.getPostgreSQL().toPostgreSQLInterface(instance);
            console_log(0, instance.className(), `create postgreSQLInterface: ${toJson(postgreSQLInterface)}`);
            const document = await databasePostgreSQL!.manager.save(postgreSQLInterface);
            console_log(0, instance.className(), `create document: ${toJson(document)}`);
            if (document) {
                return document._id.toString();
            } else {
                throw `document is null`;
            }
        } catch (error) {
            console_error(0, `PostgreSQL`, `create - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async update<T extends BaseEntity>(instance: T, updateSet: {}, updateUnSet: {}) {
        try {
            await connectPostgres();
            const postgreSQLEntity = await instance.getPostgreSQL().toPostgreSQLInterface(instance);
            const postgreSQLModel = await instance.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(postgreSQLModel);
            // Aquí usamos el ID del objeto `instance` para identificar el registro a actualizar
            const id = postgreSQLEntity._id;
            if (!id) {
                throw new Error('Instance does not have an id');
            }
            // Realizamos la actualización en PostgreSQL
            const document = await repository.update(
                { _id: id },
                {
                    ...updateSet,
                    ...updateUnSet,
                }
            );
            return document;
        } catch (error) {
            console_error(0, `PostgreSQL`, `update - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async delete<T extends BaseEntity>(instance: T): Promise<string> {
        try {
            await connectPostgres();
            const postgreSQLEntity = await instance.getPostgreSQL().toPostgreSQLInterface(instance);
            const postgreSQLModel = await instance.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(postgreSQLModel);
            const id = postgreSQLEntity._id;
            if (!id) {
                throw new Error('Instance does not have an id');
            }
            // Eliminamos el registro identificado por el ID
            await repository.delete(id);
            return `Entity with id ${id} deleted successfully`;
        } catch (error) {
            console_error(0, `PostgreSQL`, `delete - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async deleteByParams<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>): Promise<number | undefined> {
        try {
            await connectPostgres();
            const postgreSQLModel = await Entity.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(postgreSQLModel);
            const queryBuilder = repository.createQueryBuilder('entity');
            // Eliminamos los registros que coincidan con los parámetros
            this.applyFilters(queryBuilder, paramsFilter);
            const result = await queryBuilder.delete().execute();
            return result.affected === null ? undefined : result.affected;
        } catch (error) {
            console_error(0, `PostgreSQL`, `deleteByParams - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async checkIfExists<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilterOrID: Record<string, any> | string): Promise<boolean> {
        try {
            await connectPostgres();
            const postgreSQLModel = await Entity.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(postgreSQLModel);
            const queryBuilder = repository.createQueryBuilder('entity');

            if (typeof paramsFilterOrID === 'string') {
                queryBuilder.where('entity._id = :id', { id: paramsFilterOrID });
            } else {
                this.applyFilters(queryBuilder, paramsFilterOrID);
            }
            const result = await queryBuilder.getOne();
            // Retorna `true` si existe el registro
            return !!result;
        } catch (error) {
            console_error(0, `PostgreSQL`, `checkIfExists - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter: Record<string, any>,
        fieldsForSelect: Record<string, number>,
        useOptionGet: OptionsGet
    ) {
        try {
            // console_log(0, `PostgreSQL`, `getByParams - Connecting to PostgreSQL...`);
            await connectPostgres();
            const postgreSQLEntity = await Entity.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(postgreSQLEntity);
            let queryBuilder = repository.createQueryBuilder('entity');
            //--------------------------
            // console.log('Initial Query:', queryBuilder.getQuery());
            //--------------------------
            if (!isEmptyObject(paramsFilter)) {
                // console_log(0, `PostgreSQL`, `getByParams - Applying filters: ${toJson(paramsFilter)}`);
                queryBuilder = this.applyFilters(queryBuilder, paramsFilter);
            }
            //--------------------------
            // console.log('After filter Query:', queryBuilder.getQuery());
            //--------------------------
            if (!isEmptyObject(fieldsForSelect)) {
                const selectedFields = Object.keys(fieldsForSelect)
                    .filter((key) => fieldsForSelect[key] === 1)
                    .map((key) => `entity.${key}`);
                // console_log(0, `PostgreSQL`, `getByParams - Selecting fields: ${selectedFields}`);
                queryBuilder.select(selectedFields);
            }
            //--------------------------
            // console.log('After Select Query:', queryBuilder.getQuery());
            //--------------------------
            if (!isEmptyObject(useOptionGet.sort)) {
                for (const [field, order] of Object.entries(useOptionGet!.sort!)) {
                    // console_log(0, `PostgreSQL`, `getByParams - Sorting by ${field} in ${order === 1 ? 'ASC' : 'DESC'} order`);
                    queryBuilder.addOrderBy(`entity.${field}`, order === 1 ? 'ASC' : 'DESC');
                }
            }
            //--------------------------
            if (useOptionGet.skip !== undefined) {
                // console_log(0, `PostgreSQL`, `getByParams - Skipping ${useOptionGet.skip} records`);
                queryBuilder.skip(useOptionGet.skip);
            }
            if (useOptionGet.limit !== undefined) {
                // console_log(0, `PostgreSQL`, `getByParams - Limiting results to ${useOptionGet.limit}`);
                queryBuilder.take(useOptionGet.limit);
            }
            //--------------------------
            // console.log('Final Query:', queryBuilder.getQuery());
            //--------------------------
            let results = await queryBuilder.getRawMany();
            // console_log(0, `PostgreSQL`, `getByParams - Raw results: ${toJson(results)}`);
            //--------------------------
            // Process the results to ensure consistent field naming
            results = results.map((result) => {
                const processedResult: any = {};
                for (const key in result) {
                    if (key.startsWith('entity_')) {
                        processedResult[key.replace('entity_', '')] = result[key];
                    } else {
                        processedResult[key] = result[key];
                    }
                }
                return processedResult;
            });
            //--------------------------
            // console_log(0, `PostgreSQL`, `getByParams - Found ${results.length} document(s)`);
            // results.forEach((result) => console_log(0, `PostgreSQL`, `getByParams - Found ${toJson(result)}`));
            //--------------------------
            return results;
        } catch (error) {
            console_error(0, `PostgreSQL`, `getByParams - Error: ${error}`);
            throw error;
        }
    }

    public static async getCount<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>): Promise<number> {
        try {
            await connectPostgres();
            const postgreSQLEntity = await Entity.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(postgreSQLEntity);
            const queryBuilder = repository.createQueryBuilder('entity');
            if (!isEmptyObject(paramsFilter)) {
                this.applyFilters(queryBuilder, paramsFilter);
            }

            const count = await queryBuilder.getCount();
            return count;
        } catch (error) {
            console_error(0, `PostgreSQL`, `getCount - Error: ${error}`);
            throw `${error}`;
        }
    }
    private static applyFilters(queryBuilder: SelectQueryBuilder<any>, filters: Record<string, any>): SelectQueryBuilder<any> {
        // console.log('Entering applyFilters with filters:', toJson(filters, null, 2));
        //--------------------------
        const applyFilter = (key: string, value: any, parentKey: string = '', index: number = 0): string => {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            // console.log(`Processing filter: ${fullKey} = ${toJson(value)}`);

            const createParam = (paramKey: string, paramValue: any) => {
                // Append index to make each parameter unique
                const safeParamKey = `${paramKey.replace(/[^a-zA-Z0-9_]/g, '_')}_${index}`;
                queryBuilder.setParameter(safeParamKey, paramValue);
                return safeParamKey;
            };

            const quoteColumnName = (columnName: string) => {
                return columnName
                    .split('.')
                    .map((part) => `"${part}"`)
                    .join('.');
            };

            if (key.startsWith('$')) {
                switch (key) {
                    case '$or':
                    case '$and':
                        if (!Array.isArray(value)) throw new Error(`${key} must be an array`);
                        const conditions = value.map(
                            (condition, i) =>
                                `(${Object.entries(condition)
                                    .map(([subKey, subValue]) => applyFilter(subKey, subValue, parentKey, i))
                                    .join(' AND ')})`
                        );
                        return `(${conditions.join(key === '$or' ? ' OR ' : ' AND ')})`;
                    case '$not':
                        return `NOT (${Object.entries(value)
                            .map(([subKey, subValue]) => applyFilter(subKey, subValue, 'not', index))
                            .join(' AND ')})`;
                    case '$nor':
                        if (!Array.isArray(value)) throw new Error('$nor must be an array');
                        return `NOT (${value
                            .map(
                                (condition, i) =>
                                    `(${Object.entries(condition)
                                        .map(([subKey, subValue]) => applyFilter(subKey, subValue, `nor_${i}`, i))
                                        .join(' AND ')})`
                            )
                            .join(' OR ')})`;
                    default:
                        throw new Error(`Unsupported operator: ${key}`);
                }
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const conditions = Object.entries(value).map(([operator, operand], i) => {
                    switch (operator) {
                        case '$eq':
                            return `${quoteColumnName(`entity.${fullKey}`)} = :${createParam(fullKey, operand)}`;
                        case '$ne':
                            return `${quoteColumnName(`entity.${fullKey}`)} != :${createParam(fullKey, operand)}`;
                        case '$gt':
                            return `${quoteColumnName(`entity.${fullKey}`)} > :${createParam(fullKey, operand)}`;
                        case '$gte':
                            return `${quoteColumnName(`entity.${fullKey}`)} >= :${createParam(fullKey, operand)}`;
                        case '$lt':
                            return `${quoteColumnName(`entity.${fullKey}`)} < :${createParam(fullKey, operand)}`;
                        case '$lte':
                            return `${quoteColumnName(`entity.${fullKey}`)} <= :${createParam(fullKey, operand)}`;
                        case '$in':
                            return `${quoteColumnName(`entity.${fullKey}`)} IN (:...${createParam(fullKey, operand)})`;
                        case '$nin':
                            return `${quoteColumnName(`entity.${fullKey}`)} NOT IN (:...${createParam(fullKey, operand)})`;
                        case '$regex':
                            return `${quoteColumnName(`entity.${fullKey}`)} ~ :${createParam(fullKey, operand)}`;
                        case '$exists':
                            return operand ? `${quoteColumnName(`entity.${fullKey}`)} IS NOT NULL` : `${quoteColumnName(`entity.${fullKey}`)} IS NULL`;
                        default:
                            throw new Error(`Unsupported operator: ${operator}`);
                    }
                });
                return conditions.join(' AND ');
            } else if (typeof value === 'string' && value.startsWith('/') && value.endsWith('/')) {
                // Handle regex filter
                const regexPattern = value.slice(1, -1);
                return `${quoteColumnName(`entity.${fullKey}`)} ~ :${createParam(fullKey, regexPattern)}`;
            } else {
                return `${quoteColumnName(`entity.${fullKey}`)} = :${createParam(fullKey, value)}`;
            }
        };
        //--------------------------
        const whereClause = Object.entries(filters)
            .map(([key, value]) => applyFilter(key, value))
            .join(' AND ');
        queryBuilder.where(whereClause);
        //--------------------------
        // console.log('Filter Query:', queryBuilder.getQuery());
        // console.log('Filter parameters:', toJson(queryBuilder.getParameters(), null, 2));
        //--------------------------
        return queryBuilder;
    }
}
