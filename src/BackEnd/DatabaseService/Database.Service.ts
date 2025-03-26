import { OptionsGet } from '../../Commons/types.js';
import { BaseEntity } from '../../Entities/Base/Base.Entity.js';
import { MongoDatabaseService } from './Mongo.Database.Service.js';
import { PostgreSQLDatabaseService } from './PostgreSQL.Database.Service.js';

export interface IDatabaseService {
    connectDB(): Promise<void>;
    disconnectDB(): Promise<void>;
    getTableName(baseName: string): string;
    isRetryableErrorDBLock(error: any): boolean;
    withContextTransaction<T>(name: string, operation: () => Promise<T>, options?: any, swCommitChilds?: boolean): Promise<T>;
    getCollections(session?: any, providedRunner?: any): Promise<Set<string>>;
    create<T extends BaseEntity>(instance: T, session?: any, providedRunner?: any): Promise<string>;
    update<T extends BaseEntity>(instance: T, updateSet: Record<string, any>, updateUnSet: Record<string, any>, session?: any, providedRunner?: any): Promise<any>;
    delete<T extends BaseEntity>(instance: T, session?: any, providedRunner?: any): Promise<any>;
    deleteByParams<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>, session?: any, providedRunner?: any): Promise<number | undefined>;
    checkIfExists<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilterOrID: Record<string, any> | string, session?: any, providedRunner?: any): Promise<boolean>;
    getByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter: Record<string, any>,
        fieldsForSelect: Record<string, number>,
        useOptionGet: OptionsGet,
        session?: any,
        providedRunner?: any
    ): Promise<any[]>;
    getCount<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>, session?: any, providedRunner?: any): Promise<number>;
    aggregate<T extends BaseEntity>(Entity: typeof BaseEntity, pipeline: Record<string, any>[], session?: any, providedRunner?: any): Promise<any>;
}

export function DatabaseService(): IDatabaseService {
    if (process.env.USE_DATABASE === 'mongo') {
        return MongoDatabaseService;
    } else if (process.env.USE_DATABASE === 'postgresql') {
        return PostgreSQLDatabaseService;
    } else {
        throw `Database not defined`;
    }
}
