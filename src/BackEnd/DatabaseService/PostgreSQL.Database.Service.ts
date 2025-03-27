import { EntityMetadata, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { console_error, console_log } from '../../Commons/BackEnd/globalLogs.js';
import { OptionsGet } from '../../Commons/types.js';
import { calculateBackoffDelay, isEmptyObject, sleep, toJson } from '../../Commons/utils.js';
import { BaseEntity } from '../../Entities/Base/Base.Entity.js';
import { getFilteredConversionFunctions } from '../../Commons/Decorators/Decorator.Convertible.js';
import { AsyncLocalStorage } from 'async_hooks';
import { DB_LOCK_MAX_TIME_WAITING_TO_COMPLETE_MS, DB_LOCK_TIME_WAITING_TO_TRY_AGAIN_MS, DB_USE_TRANSACTIONS } from '../../Commons/Constants/constants.js';
import { DataSource } from 'typeorm';
import { RegistryManager } from '../../Commons/Decorators/registerManager.js';

let databasePostgreSQL: DataSource | null = null; // Store the connection pool
export const postgresSessionStorage = new AsyncLocalStorage<QueryRunner | undefined>();

export class PostgreSQLDatabaseService {
    
    public static async tryInitializeDataSource(dataSource: DataSource, retries: number = 5, sleep: number = 2000): Promise<DataSource | null> {
        while (retries > 0) {
            try {
                const connectedDatasource = await dataSource.initialize();
                return connectedDatasource; // Success
            } catch (error) {
                retries--;
                console.error(`[DBPOSTGRESQL] Retrying database connection. Attempts left: ${retries}. Error:`, error);
                if (retries === 0) throw error;
                await new Promise((res) => setTimeout(res, sleep)); // Wait before retrying
            }
        }
        return null;
    }

    public static async connectDB(): Promise<void> {
        if (databasePostgreSQL !== null) {
            return; // Already connected
        }
        try {
            //--------------------
            const registeredEntities = Array.from(RegistryManager.getAllFromPosgreSQLModelsRegistry().values());
            //--------------------
            // Define a new DataSource for connecting to the default database (postgres)
            const DefaultDataSource = new DataSource({
                type: 'postgres',
                host: process.env.POSTGRES_HOST,
                port: Number(process.env.POSTGRES_PORT),
                username: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASS,
                database: 'postgres', // default database
                synchronize: false,
                logging: false,
                entities: [],
                subscribers: [],
                migrations: [],
            });
            //--------------------
            const AppDataSource = new DataSource({
                type: 'postgres',
                host: process.env.POSTGRES_HOST,
                port: Number(process.env.POSTGRES_PORT),
                username: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASS,
                database: process.env.POSTGRES_DB,
                synchronize: true,
                logging: ['error', 'schema', 'warn'], //true, //['error', 'schema', 'warn'],
                entities: [...registeredEntities],
                subscribers: [],
                migrations: [],
            });
            //--------------------
            // Connect to the default database and create the target database if it doesn't exist
            await this.tryInitializeDataSource(DefaultDataSource);
            const queryRunner = DefaultDataSource.createQueryRunner();
            await queryRunner.connect();
            const dbName = process.env.POSTGRES_DB;
            //--------------------
            const dbExists = await queryRunner.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
            //--------------------
            if (dbExists.length === 0) {
                await queryRunner.query(`CREATE DATABASE "${dbName}"`);
                console.log(`[DBPOSTGRESQL] Database ${dbName} created successfully.`);
            }
            //--------------------
            await queryRunner.release();
            await DefaultDataSource.destroy();
            //--------------------
            // Now initialize the AppDataSource
            databasePostgreSQL = await this.tryInitializeDataSource(AppDataSource);
            if (databasePostgreSQL === null) {
                throw 'Failed to initialize the AppDataSource';
            }
            //--------------------
            // Simple query to test connection
            await databasePostgreSQL.query('SELECT NOW()');
            console.log('[DBPOSTGRESQL] Connected to postgreSQL database');
        } catch (error) {
            console.error('[DBPOSTGRESQL] Database connection error: ', error);
            databasePostgreSQL = null; // Reset to null on failure
            throw new Error(`Database connection error: ${error}`);
        }
    }

    public static async disconnectDB(): Promise<void> {
        if (databasePostgreSQL) {
            await databasePostgreSQL.destroy();
            databasePostgreSQL = null;
            console.log('[DBPOSTGRESQL] Disconnected from database');
        }
    }

    public static getTableName(baseName: string): string {
        return baseName
            .toLowerCase()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }

    public static async startRunner(name: string): Promise<QueryRunner> {
        await this.connectDB();
        const queryRunner = databasePostgreSQL!.createQueryRunner();
        await queryRunner.connect();
        console_log(0, 'PostgreSQL', `${name} - startRunner - Created new QueryRunner.`);
        return queryRunner;
    }

    public static isRetryableErrorDBLock(error: any): boolean {
        // PostgreSQL retryable errors (deadlocks, serialization failures)
        const retryableCodes = ['40001', '40P01'];
        return retryableCodes.includes(error.code);
    }

    private static getActiveRunner(methodName: string, providedRunner?: QueryRunner): QueryRunner | undefined {
        const storedRunner = postgresSessionStorage.getStore();
        const runner = providedRunner || storedRunner;
        console_log(0, 'PostgreSQL', `${methodName} - runner: ${runner}`); // - details: ` + toJson(sessionDetails));
        return runner;
    }

    public static async getCollections(providedRunner?: QueryRunner): Promise<Set<string>> {
        //--------------------------
        await this.connectDB();
        //--------------------------
        const queryRunner = this.getActiveRunner(`getCollections`, providedRunner);
        const queryRunner_ = queryRunner ? queryRunner.manager : databasePostgreSQL!.manager;
        //--------------------------
        const tables = await queryRunner_.query(`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            `);
        return new Set(tables.map((table: { table_name: string }) => table.table_name));
    }

    public static async withContextTransaction<T>(name: string, operation: () => Promise<T>, swCommitChilds: boolean = false): Promise<T> {
        //----------------------------
        if (!DB_USE_TRANSACTIONS) {
            console_log(0, 'PostgreSQL', `${name} - withContextTransaction - Transactions disabled - Executing operation without transaction.`);
            return await operation();
        }
        //----------------------------
        const existingRunner = postgresSessionStorage.getStore();
        let runner: QueryRunner | undefined = undefined;
        let swTabs = 0;
        //----------------------------
        console_log(1, 'PostgreSQL', `${name} - withContextTransaction - Init`);
        //----------------------------
        try {
            //----------------------------
            if (existingRunner) {
                runner = existingRunner;
            }
            //----------------------------
            let result: T;
            //----------------------------
            if (existingRunner) {
                console_log(1, 'PostgreSQL', `${name} - withContextTransaction - CHILD - Reusing existing QueryRunner - INIT`);
                swTabs = 1;
                result = await operation();
                if (swCommitChilds) {
                    console_log(0, 'PostgreSQL', `${name} - withContextTransaction - CHILD - Committing transaction...`);
                    await runner!.commitTransaction();
                    try {
                        await runner!.rollbackTransaction();
                    } catch (error: any) {
                        console_log(0, 'PostgreSQL', `${name} - withContextTransaction - CHILD - CONTEXTERROR - Rollback error: ${toJson(error)}`);
                    }
                    await runner!.startTransaction();
                }
                console_log(-1, 'PostgreSQL', `${name} - withContextTransaction - CHILD - Executed operation - OK`);
                swTabs = 0;
            } else {
                // Ejecutar la operación con una nueva transacción si no hay una activa.
                const retryDelayMs = DB_LOCK_TIME_WAITING_TO_TRY_AGAIN_MS;
                const maxWaitTimeMs = DB_LOCK_MAX_TIME_WAITING_TO_COMPLETE_MS;
                let retries = 0;
                const startTime = Date.now();
                console_log(0, 'PostgreSQL', `${name} - withContextTransaction - PARENT - Creating new QueryRunner...`);
                runner = await this.startRunner(name);
                while (Date.now() - startTime < maxWaitTimeMs) {
                    await runner.startTransaction();
                    try {
                        return await postgresSessionStorage.run(runner, async () => {
                            console_log(1, 'PostgreSQL', `${name} - withContextTransaction - PARENT - Executing operation - INIT`);
                            swTabs = 1;
                            result = await operation();
                            await runner!.commitTransaction();
                            console_log(0, 'PostgreSQL', `${name} - withContextTransaction - PARENT - Committing transaction...`);
                            await runner!.release();
                            console_log(0, 'PostgreSQL', `${name} - withContextTransaction - PARENT - Released QueryRunner - OK`);
                            console_log(-1, 'PostgreSQL', `${name} - withContextTransaction - PARENT - Executed operation - OK`);
                            swTabs = 0;
                            return result!;
                        });
                    } catch (error: any) {
                        if (runner) {
                            console_log(0, 'PostgreSQL', `${name} - withContextTransaction - PARENT - CONTEXTERROR - Rolling back transaction... - Error: ${toJson(error)}`);
                            try {
                                await runner.rollbackTransaction();
                            } catch (rollbackError: any) {
                                console_log(0, 'PostgreSQL', `${name} - withContextTransaction - PARENT - CONTEXTERROR - Rollback error: ${toJson(rollbackError)}`);
                            }
                        }
                        const isRetryableError = this.isRetryableErrorDBLock(error);
                        if (isRetryableError && Date.now() - startTime < maxWaitTimeMs) {
                            retries++;
                            const backoffDelay = calculateBackoffDelay(retryDelayMs, retries);
                            console_log(
                                0,
                                'PostgreSQL',
                                `${name} - withContextTransaction - PARENT - CONTEXTERROR - Retry ${retries} - retryDelayMs: ${retryDelayMs} - Waiting ${backoffDelay} ms - Error: ${
                                    error.message || toJson(error)
                                }`
                            );
                            await sleep(backoffDelay);
                            continue;
                        } else {
                            console_error(
                                0,
                                'PostgreSQL',
                                `${name} - withContextTransaction - PARENT - CONTEXTERROR - FINALERROR - Ending transaction - Error: ${error.message || toJson(error)}`
                            );
                            if (runner && !runner.isReleased) {
                                await runner.release();
                            }
                            throw error;
                        }
                    }
                }
                console_error(0 - swTabs, 'PostgreSQL', `${name} - withContextTransaction - PARENT - CONTEXTERROR - FINALERROR - Transaction timeout - Ending session`);
                if (runner && !runner.isReleased) {
                    await runner.release();
                }
                throw `Executed operation timeout`;
            }
            return result!;
        } catch (error: any) {
            throw error;
        } finally {
            console_log(-1 - swTabs, 'PostgreSQL', `${name} - withContextTransaction - OK`);
        }
    }

    public static async create<T extends BaseEntity>(instance: T, providedRunner?: QueryRunner): Promise<string> {
        try {
            //--------------------------
            await this.connectDB();
            //--------------------------
            // console_log((0, instance.className(), `create instance T : ${toJson(instance)}`);
            //--------------------------
            const postgreSQLInterface = await instance.getPostgreSQL().toDBInterface(instance);
            //--------------------------
            // console_log((0, instance.className(), `create postgreSQLInterface: ${toJson(postgreSQLInterface)}`);
            //--------------------------
            // Exclude createdAt and updatedAt fields
            const excludedFields = getFilteredConversionFunctions(instance.getStatic(), (conversion) => conversion.isCreatedAt === true || conversion.isUpdatedAt === true);
            // Remove excluded fields
            for (const [field] of excludedFields.entries()) {
                delete postgreSQLInterface[field];
            }
            //--------------------------
            const queryRunner = this.getActiveRunner(`[${instance.className()}] - create`, providedRunner);
            const document = await (queryRunner ? queryRunner.manager : databasePostgreSQL!.manager).save(postgreSQLInterface);
            //--------------------------
            // console_log((0, instance.className(), `create document: ${toJson(document)}`);
            //--------------------------
            if (document) {
                return document._id.toString();
            } else {
                throw `document is null`;
            }
            //--------------------------
        } catch (error) {
            console_error(0, `PostgreSQL`, `create - Error: ${error}`);
            throw error;
        }
    }

    public static async update<T extends BaseEntity>(instance: T, updateSet: Record<string, any>, updateUnSet: Record<string, any>, providedRunner?: QueryRunner) {
        try {
            //--------------------------
            await this.connectDB();
            //--------------------------
            const postgreSQLInterface = await instance.getPostgreSQL().toDBInterface(instance);
            const postgreSQLModel = await instance.getPostgreSQL().DBModel();
            //--------------------------
            const queryRunner = this.getActiveRunner(`[${instance.className()}] - update`, providedRunner);
            //--------------------------
            const repository = (queryRunner ? queryRunner.manager : databasePostgreSQL!.manager).getRepository(postgreSQLModel);
            //--------------------------
            // const metadata = repository.metadata;
            //--------------------------
            // Aquí usamos el ID del objeto `instance` para identificar el registro a actualizar
            const id = postgreSQLInterface._id;
            if (!id) {
                throw `Instance does not have an id`;
            }
            //--------------------------
            // Construimos el objeto de actualización, estableciendo los campos de `updateUnSet` en `NULL`
            const updateObject: Record<string, any> = {};

            for (const field of Object.keys(updateSet)) {
                if (field === 'smartUTxO_id') {
                    //HACK: esto es para guardar la relacion correctamente.... pero solo funciona para smart utxos que es la que mas uso
                    // Set the related entity for smartUTxO_id
                    const SmartUTxOEntityPostgreSQL = (await import ('../../Entities/SmartUTxO.Entity.PostgreSQL.js')).SmartUTxOEntityPostgreSQL
                    const relatedRepository = (queryRunner ? queryRunner.manager : databasePostgreSQL!.manager).getRepository(SmartUTxOEntityPostgreSQL);
                    const relatedEntity = await relatedRepository.findOne(updateSet[field]);
                    if (!relatedEntity && updateSet[field] !== null) {
                        throw new Error(`Invalid smartUTxO_id: ${updateSet[field]}`);
                    }
                    updateObject['smartUTxO'] = relatedEntity || null;
                } else {
                    updateObject[field] = updateSet[field];
                }
            }
            //--------------------------
            for (const field of Object.keys(updateUnSet)) {
                if (field === 'smartUTxO_id') {
                    // Unset the smartUTxO relation
                    updateObject['smartUTxO'] = null;
                } else {
                    updateObject[field] = null;
                }
            }
            //--------------------------
            // Exclude createdAt and updatedAt fields
            const excludedFields = getFilteredConversionFunctions(instance.getStatic(), (conversion) => conversion.isCreatedAt === true || conversion.isUpdatedAt === true);
            // Remove excluded fields
            for (const [field] of excludedFields.entries()) {
                delete updateObject[field];
            }
            //--------------------------
            const updateObjectInterface = await instance.getPostgreSQL().toDBInterface(updateObject as T);
            //--------------------------
            // Realizamos la actualización en PostgreSQL
            const result = await repository.update({ _id: id }, updateObjectInterface);
            //--------------------------
            return result;
        } catch (error) {
            console_error(0, `PostgreSQL`, `update - Error: ${error}`);
            throw error;
        }
    }

    public static async delete<T extends BaseEntity>(instance: T, providedRunner?: QueryRunner): Promise<string> {
        try {
            //--------------------------
            await this.connectDB();
            //--------------------------
            const postgreSQLEntity = await instance.getPostgreSQL().toDBInterface(instance);
            const postgreSQLModel = await instance.getPostgreSQL().DBModel();
            //--------------------------
            const queryRunner = this.getActiveRunner(`[${instance.className()}] - delete`, providedRunner);
            //--------------------------
            const repository = (queryRunner ? queryRunner.manager : databasePostgreSQL!.manager).getRepository(postgreSQLModel);
            // const metadata = repository.metadata;
            //--------------------------
            const id = postgreSQLEntity._id;
            if (!id) {
                throw `Instance does not have an id`;
            }
            //--------------------------
            // Eliminamos el registro identificado por el ID
            await repository.delete(id);
            //--------------------------
            return `Entity with id ${id} deleted successfully`;
            //--------------------------
        } catch (error) {
            console_error(0, `PostgreSQL`, `delete - Error: ${error}`);
            throw error;
        }
    }

    public static async deleteByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter: Record<string, any>,
        providedRunner?: QueryRunner
    ): Promise<number | undefined> {
        try {
            //--------------------------
            await this.connectDB();
            //--------------------------
            const postgreSQLModel = await Entity.getPostgreSQL().DBModel();
            //--------------------------
            const queryRunner = this.getActiveRunner(`[${Entity.className()}] - deleteByParams`, providedRunner);
            //--------------------------
            const repository = (queryRunner ? queryRunner.manager : databasePostgreSQL!.manager).getRepository(postgreSQLModel);
            const metadata = repository.metadata;
            const queryBuilder = repository.createQueryBuilder();
            //--------------------------
            if (!isEmptyObject(paramsFilter)) {
                // Eliminamos los registros que coincidan con los parámetros
                // console_log(0, `PostgreSQL`, `deleteByParams - Applying filters: ${toJson(paramsFilter)}`);
                this.applyFilters(queryBuilder, metadata, paramsFilter, false);
            }
            //--------------------------
            const result = await queryBuilder.delete().execute();
            return result.affected === null ? undefined : result.affected;
            //--------------------------
        } catch (error) {
            console_error(0, `PostgreSQL`, `deleteByParams - Error: ${error}`);
            throw error;
        }
    }

    public static async checkIfExists<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilterOrID: Record<string, any> | string,
        providedRunner?: QueryRunner
    ): Promise<boolean> {
        try {
            //--------------------------
            await this.connectDB();
            //--------------------------
            const postgreSQLModel = await Entity.getPostgreSQL().DBModel();
            //--------------------------
            const queryRunner = this.getActiveRunner(`[${Entity.className()}] - checkIfExists`, providedRunner);
            //--------------------------
            const repository = (queryRunner ? queryRunner.manager : databasePostgreSQL!.manager).getRepository(postgreSQLModel);
            const metadata = repository.metadata;
            const queryBuilder = repository.createQueryBuilder('entity');
            //--------------------------
            if (typeof paramsFilterOrID === 'string') {
                queryBuilder.where(`${this.quoteColumnName('entity._id')} = :id`, { id: paramsFilterOrID });
            } else {
                const metadata = repository.metadata;
                this.applyFilters(queryBuilder, metadata, paramsFilterOrID);
            }
            //--------------------------
            const result = await queryBuilder.getOne();
            // Retorna `true` si existe el registro
            return !!result;
        } catch (error) {
            console_error(0, `PostgreSQL`, `checkIfExists - Error: ${error}`);
            throw error;
        }
    }

    public static async getByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter: Record<string, any>,
        fieldsForSelect: Record<string, number>,
        useOptionGet: OptionsGet,
        providedRunner?: QueryRunner
    ) {
        try {
            //--------------------------
            // console_log((0, `PostgreSQL`, `getByParams - Connecting to PostgreSQL...`);
            //--------------------------
            await this.connectDB();
            const postgreSQLEntity = await Entity.getPostgreSQL().DBModel();
            //--------------------------
            const queryRunner = this.getActiveRunner(`[${Entity.className()}] - getByParams`, providedRunner);
            //--------------------------
            const repository = (queryRunner ? queryRunner.manager : databasePostgreSQL!.manager).getRepository(postgreSQLEntity);
            const metadata = repository.metadata;
            let queryBuilder = repository.createQueryBuilder('entity');
            //--------------------------
            // console_log(0, `PostgreSQL`, `getByParams - Initial Query: ${queryBuilder.getQuery()}`);
            //--------------------------
            if (!isEmptyObject(paramsFilter)) {
                // console_log(0, `PostgreSQL`, `getByParams - Applying filters: ${toJson(paramsFilter)}`);
                queryBuilder = this.applyFilters(queryBuilder, metadata, paramsFilter);
            }
            //--------------------------
            // console_log(0, `PostgreSQL`, `getByParams - After filter Query: ${queryBuilder.getQuery()}`);
            //--------------------------
            if (!isEmptyObject(fieldsForSelect)) {
                const selectedFields = Object.keys(fieldsForSelect)
                    .filter((key) => fieldsForSelect[key] === 1)
                    .map((key) => this.quoteColumnName(`entity.${key}`));
                // console_log((0, `PostgreSQL`, `getByParams - Selecting fields: ${selectedFields}`);
                queryBuilder.select(selectedFields);
            }
            //--------------------------
            // console_log(0, `PostgreSQL`, `getByParams - After Select Query: ${queryBuilder.getQuery()}`);
            //--------------------------
            if (!isEmptyObject(useOptionGet.sort)) {
                for (const [field, order] of Object.entries(useOptionGet!.sort!)) {
                    // console_log((0, `PostgreSQL`, `getByParams - Sorting by ${field} in ${order === 1 ? 'ASC' : 'DESC'} order`);
                    queryBuilder.addOrderBy(this.quoteColumnName(`entity.${field}`), order === 1 ? 'ASC' : 'DESC');
                }
            }
            //--------------------------
            if (useOptionGet.skip !== undefined) {
                // console_log((0, `PostgreSQL`, `getByParams - Skipping ${useOptionGet.skip} records`);
                queryBuilder.skip(useOptionGet.skip);
            }
            if (useOptionGet.limit !== undefined) {
                // console_log((0, `PostgreSQL`, `getByParams - Limiting results to ${useOptionGet.limit}`);
                queryBuilder.take(useOptionGet.limit);
            }
            //--------------------------
            // console_log(0, `PostgreSQL`, `getByParams - Final Query: ${queryBuilder.getQuery()}`);
            //--------------------------
            let results = await queryBuilder.getRawMany();
            // console_log((0, `PostgreSQL`, `getByParams - Raw results: ${toJson(results)}`);
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
            // console_log((0, `PostgreSQL`, `getByParams - Found ${results.length} document(s)`);
            // results.forEach((result) => // console_log(0, `PostgreSQL`, `getByParams - Found ${toJson(result)}`));
            //--------------------------
            return results;
            //--------------------------
        } catch (error) {
            console_error(0, `PostgreSQL`, `getByParams - Error: ${error}`);
            throw error;
        }
    }

    public static async getCount<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>, providedRunner?: QueryRunner): Promise<number> {
        try {
            //--------------------------
            await this.connectDB();
            //--------------------------
            const postgreSQLEntity = await Entity.getPostgreSQL().DBModel();
            //--------------------------
            const queryRunner = this.getActiveRunner(`[${Entity.className()}] - getCount`, providedRunner);
            //--------------------------
            const repository = (queryRunner ? queryRunner.manager : databasePostgreSQL!.manager).getRepository(postgreSQLEntity);
            const metadata = repository.metadata;
            const queryBuilder = repository.createQueryBuilder('entity');
            //--------------------------
            if (!isEmptyObject(paramsFilter)) {
                this.applyFilters(queryBuilder, metadata, paramsFilter);
            }
            //--------------------------
            const count = await queryBuilder.getCount();
            //--------------------------
            return count;
            //--------------------------
        } catch (error) {
            console_error(0, `PostgreSQL`, `getCount - Error: ${error}`);
            throw error;
        }
    }

    // Utility function to quote column names without double quoting
    private static quoteColumnName(columnName: string): string {
        return columnName
            .split('.')
            .map((part) => {
                // Check if the part is already quoted
                if (part.startsWith('"') && part.endsWith('"')) {
                    return part; // Return as-is if already quoted
                }
                return `"${part}"`; // Otherwise, add quotes
            })
            .join('.');
    }

    private static applyFilters(queryBuilder: SelectQueryBuilder<any>, metadata: EntityMetadata, filters: Record<string, any>, useAlias: boolean = true): SelectQueryBuilder<any> {
        //--------------------------
        // console_log(0, `PostgreSQL`, `applyFilters - Entering applyFilters with filters: ${toJson(filters, 2)}`);
        //--------------------------
        const alias = useAlias ? 'entity.' : ''; // Include or exclude alias dynamically
        //--------------------------
        // Function to check if the field is of type JSONB
        const isJsonbField = (field: string): boolean => {
            const column = metadata.findColumnWithPropertyName(field.split('.').pop() || field);
            return column ? column.type === 'jsonb' : false;
        };
        //--------------------------
        const applyFilter = (key: string, value: any, parentKey: string = '', index: number = 0): string => {
            //--------------------------
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            const columnName = `${alias}${fullKey}`; // Conditionally add alias
            //--------------------------
            // console_log(0, `PostgreSQL`, `applyFilters - Processing filter: ${fullKey} = ${toJson(value)}`);
            const createParam = (paramKey: string, paramValue: any) => {
                // Append index to make each parameter unique
                const safeParamKey = `${paramKey.replace(/[^a-zA-Z0-9_]/g, '_')}_${index}`;
                queryBuilder.setParameter(safeParamKey, paramValue);
                return safeParamKey;
            };

            if (key.startsWith('$')) {
                // console_log(0, `PostgreSQL`, `applyFilters - Processing operator: ${key}`);
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
                        throw `Unsupported operator: ${key}`;
                }
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const conditions = Object.entries(value).map(([operator, operand], i) => {
                    switch (operator) {
                        case '$eq':
                            return `${this.quoteColumnName(`${columnName}`)} = :${createParam(fullKey, operand)}`;
                        case '$ne':
                            return `${this.quoteColumnName(`${columnName}`)} != :${createParam(fullKey, operand)}`;
                        case '$gt':
                            return `${this.quoteColumnName(`${columnName}`)} > :${createParam(fullKey, operand)}`;
                        case '$gte':
                            return `${this.quoteColumnName(`${columnName}`)} >= :${createParam(fullKey, operand)}`;
                        case '$lt':
                            return `${this.quoteColumnName(`${columnName}`)} < :${createParam(fullKey, operand)}`;
                        case '$lte':
                            return `${this.quoteColumnName(`${columnName}`)} <= :${createParam(fullKey, operand)}`;
                        case '$in':
                            // Use @> for JSONB, otherwise use IN
                            if (isJsonbField(fullKey)) {
                                return `${this.quoteColumnName(`${columnName}`)} @> :${createParam(fullKey, toJson(operand))}::jsonb`;
                            }
                            return `${this.quoteColumnName(`${columnName}`)} IN (:...${createParam(fullKey, operand)})`;
                        case '$nin':
                            if (isJsonbField(fullKey)) {
                                return `${this.quoteColumnName(`${columnName}`)} NOT @> :${createParam(fullKey, toJson(operand))}::jsonb`;
                            }
                            return `${this.quoteColumnName(`${columnName}`)} NOT IN (:...${createParam(fullKey, operand)})`;
                        case '$regex':
                            return `${this.quoteColumnName(`${columnName}`)} ~ :${createParam(fullKey, operand)}`;
                        case '$exists':
                            return operand ? `${this.quoteColumnName(`${columnName}`)} IS NOT NULL` : `${this.quoteColumnName(`${columnName}`)} IS NULL`;
                        default:
                            throw new Error(`Unsupported operator: ${operator}`);
                    }
                });
                return conditions.join(' AND ');
            } else if (typeof value === 'string' && value.startsWith('/') && value.endsWith('/')) {
                // Handle regex filter
                const regexPattern = value.slice(1, -1);
                return `${this.quoteColumnName(`${columnName}`)} ~ :${createParam(fullKey, regexPattern)}`;
            } else {
                return `${this.quoteColumnName(`${columnName}`)} = :${createParam(fullKey, value)}`;
            }
        };
        //--------------------------
        if (filters !== undefined) {
            const whereClause = Object.entries(filters)
                .map(([key, value]) => applyFilter(key, value))
                .join(' AND ');
            queryBuilder.where(whereClause);
        }
        //--------------------------
        // console_log(0, `PostgreSQL`, `applyFilters - Filter Query: ${queryBuilder.getQuery()}`);
        // console_log(0, `PostgreSQL`, `applyFilters - Filter parameters: ${toJson(queryBuilder.getParameters())}`);
        //--------------------------
        return queryBuilder;
    }

    public static async aggregate<T extends BaseEntity>(Entity: typeof BaseEntity, pipeline: Record<string, any>[], session?: any) {
        throw `PostgreSQL does not support aggregation pipelines like MongoDB.`;
    }
}
