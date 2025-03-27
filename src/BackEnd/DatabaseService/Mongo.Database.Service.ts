import { AsyncLocalStorage } from 'async_hooks';
import EventEmitter from 'events';
import * as Mongoose from 'mongoose';
import mongoose, { ClientSession, Types } from 'mongoose';
import { console_error, console_log, swLogsMongoDebug } from '../../Commons/BackEnd/globalLogs.js';
import {
    DB_LOCK_MAX_TIME_WAITING_TO_COMPLETE_MS,
    DB_LOCK_TIME_WAITING_TO_TRY_AGAIN_MS,
    DB_SERVERSELECCION_TIMEOUT_MS,
    DB_USE_TRANSACTIONS,
    DB_WRITE_TIMEOUT_MS,
} from '../../Commons/Constants/constants.js';
import { getCombinedConversionFunctions, getFilteredConversionFunctions } from '../../Commons/Decorators/Decorator.Convertible.js';
import { OptionsGet } from '../../Commons/types.js';
import { calculateBackoffDelay, isEmptyObject, isString, sleep, toJson } from '../../Commons/utils.js';
import { BaseEntity } from '../../Entities/Base/Base.Entity.js';

export const dbEvents = new EventEmitter();
let database: Mongoose.Connection | null = null;

dbEvents.on('dbError', (err) => {
    console.error(`Database Error: ${err}`);
    throw new Error(`Database Error: ${err}`);
});

export const sessionStorage = new AsyncLocalStorage<ClientSession | undefined>();

export class MongoDatabaseService {
    public static connectDB = (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (database !== null) {
                // Already connected
                // console.log(`Already connected to database`);
                resolve();
                return;
            }

            const uri = process.env.MONGO_URLDB;
            if (!uri) {
                reject('Please define the MONGO_URLDB environment variable');
                return;
            }

            const opts = {
                bufferCommands: true,
                useNewUrlParser: true,
                /** Specifies how long (in milliseconds) to block for server selection before throwing an exception.  */
                serverSelectionTimeoutMS: DB_SERVERSELECCION_TIMEOUT_MS,
                readConcern: { level: mongoose.mongo.ReadConcern.LINEARIZABLE }, // Garantiza consistencia razonable
                writeConcern: {
                    w: 'majority' as mongoose.mongo.W, // Asegura que los datos están replicados
                    wtimeoutMS: DB_WRITE_TIMEOUT_MS, // 5 segundos de timeout
                    journal: true, // Asegura durabilidad
                },
                readPreference: mongoose.mongo.ReadPreference.PRIMARY,

                // ... other options
            };

            // const opts = {
            //     // 1. READ CONCERN - Nivel de consistencia en lecturas
            //     readConcern: { level: ReadConcern.LOCAL },     // Lectura más rápida, puede ver datos no confirmados
            //     // readConcern: { level: ReadConcern.AVAILABLE },  // Similar a LOCAL, pero más permisivo con nodos en recovery
            //     // readConcern: { level: ReadConcern.MAJORITY },   // Garantiza leer datos confirmados por mayoría de nodos
            //     // readConcern: { level: ReadConcern.LINEARIZABLE },// Máxima consistencia, más lento, garantiza orden global
            //     // readConcern: { level: ReadConcern.SNAPSHOT },   // Lectura consistente en el tiempo, ideal para reportes

            //     // 2. WRITE CONCERN - Confirmación de escrituras
            //     writeConcern: {
            //         w: 'majority' as W,    // Espera confirmación de mayoría de nodos
            //         // w: 1 as W,          // Solo espera confirmación del primario
            //         // w: 2 as W,          // Espera confirmación de primario y un secundario
            //         wtimeoutMS: 5000,      // Timeout para esperar confirmaciones (5 segundos)
            //         journal: true          // Espera que los datos se escriban en el journal
            //     },

            //     // 3. READ PREFERENCE - De dónde leer los datos
            //     readPreference: ReadPreference.PRIMARY,           // Solo lee del nodo primario
            //     // readPreference: ReadPreference.PRIMARY_PREFERRED, // Primario si está disponible, sino secundarios
            //     // readPreference: ReadPreference.SECONDARY,        // Solo lee de secundarios
            //     // readPreference: ReadPreference.SECONDARY_PREFERRED,// Prefiere secundarios, usa primario si necesario
            //     // readPreference: ReadPreference.NEAREST,          // Lee del nodo más cercano (menor latencia)
            // };

            // Valores por DEFECTO de MongoDB si no especificamos nada:
            // readConcern: { level: 'local' }
            // writeConcern: { w: 1 }
            // readPreference: 'primary'

            // // SIN SESIÓN - Opciones disponibles:
            // - 'local'     // Ve datos inmediatamente
            // - 'majority'  // Ve datos confirmados por mayoría
            // - 'available' // Ve cualquier dato disponible

            // // CON SESIÓN/TRANSACCIÓN - Opciones adicionales:
            // - 'snapshot'  // Ve un estado consistente en el tiempo
            // - 'linearizable' // Garantiza orden global de operaciones

            for (let i = 0; i < 3; ++i) {
                try {
                    // console.error(`Database connect: ${toJson({ uri, opts })}`);
                    await Mongoose.connect(uri, opts);
                    mongoose.set('debug', swLogsMongoDebug);
                    break;
                } catch (err) {
                    console.log(`Error database connection (Try ${i + 1}): ${err}}`);
                    if (i >= 2) {
                        reject(err);
                    }
                }
            }

            database = Mongoose.connection;
            database.once('connected', () => {
                // Connected to database
                console.log(`Connected to database`);
            });
            database.on('connected', (err) => {
                console.log(`Connected to database`);
            });
            database.on('error', (err) => {
                dbEvents.emit('dbError', err);
            });

            resolve();
        });
    };

    public static disconnectDB = async () => {
        if (!database) {
            return;
        }
        await Mongoose.disconnect();
    };

    public static convertParamsForAggregation(query: any, prefix: string): any {
        const excludedKeywords = ['$and', '$or', '$nor', '$not'];

        const convertedQuery: any = {};

        for (const key in query) {
            if (Object.prototype.hasOwnProperty.call(query, key)) {
                const value = query[key];

                if (excludedKeywords.includes(key)) {
                    convertedQuery[key] = value.map((subQuery: any) => this.convertParamsForAggregation(subQuery, prefix));
                } else {
                    const updatedKey = prefix ? `${prefix}.${key}` : key;

                    if (typeof value === 'object' && !Array.isArray(value)) {
                        convertedQuery[updatedKey] = this.convertParamsForAggregation(value, updatedKey);
                    } else {
                        convertedQuery[updatedKey] = value;
                    }
                }
            }
        }

        return convertedQuery;
    }

    public static getTableName(baseName: string): string {
        baseName = baseName.toLowerCase();
        // Check if the class name ends with 'y' (but not 'ay', 'ey', 'iy', 'oy', 'uy' which typically just add 's')
        if (baseName.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(baseName.charAt(baseName.length - 2))) {
            // Replace 'y' with 'ies'
            return baseName.substring(0, baseName.length - 1) + 'ies';
        } else if (!baseName.endsWith('s')) {
            // If it does not end with 's', simply add 's'
            return baseName + 's';
        }
        // If it ends with 's', return as is (assuming it's already plural)
        return baseName;
    }

    public static isRetryableErrorDBLock(error: any) {
        const isRetryableErrorMongoLock1 = error instanceof mongoose.mongo.MongoError && (error.code === 112 || error.code === 251 || error.code === 24);
        const isRetryableErrorMongoLock2 =
            error instanceof mongoose.mongo.MongoError && (error.message.includes('Unable to read from a snapshot') || error.message.includes('Please retry your operation'));
        const isRetryableErrorMongoLock3 = toJson(error).includes('Unable to read from a snapshot') || toJson(error).includes('Please retry your operation');
        const isRetryableErrorDBLock = isRetryableErrorMongoLock1 || isRetryableErrorMongoLock2 || isRetryableErrorMongoLock3;
        return isRetryableErrorDBLock && DB_USE_TRANSACTIONS === true;
    }

    // 1. READ CONCERN - Nivel de consistencia en lecturas
    //     readConcern: { level: ReadConcern.LOCAL },     // Lectura más rápida, puede ver datos no confirmados
    //     // readConcern: { level: ReadConcern.AVAILABLE },  // Similar a LOCAL, pero más permisivo con nodos en recovery
    //     // readConcern: { level: ReadConcern.MAJORITY },   // Garantiza leer datos confirmados por mayoría de nodos
    //     // readConcern: { level: ReadConcern.LINEARIZABLE },// Máxima consistencia, más lento, garantiza orden global
    //     // readConcern: { level: ReadConcern.SNAPSHOT },   // Lectura consistente en el tiempo, ideal para reportes

    //     // 2. WRITE CONCERN - Confirmación de escrituras
    //     writeConcern: {
    //         w: 'majority' as W,    // Espera confirmación de mayoría de nodos
    //         // w: 1 as W,          // Solo espera confirmación del primario
    //         // w: 2 as W,          // Espera confirmación de primario y un secundario
    //         wtimeoutMS: 5000,      // Timeout para esperar confirmaciones (5 segundos)
    //         journal: true          // Espera que los datos se escriban en el journal
    //     },

    //     // 3. READ PREFERENCE - De dónde leer los datos
    //     readPreference: ReadPreference.PRIMARY,           // Solo lee del nodo primario
    //     // readPreference: ReadPreference.PRIMARY_PREFERRED, // Primario si está disponible, sino secundarios
    //     // readPreference: ReadPreference.SECONDARY,        // Solo lee de secundarios
    //     // readPreference: ReadPreference.SECONDARY_PREFERRED,// Prefiere secundarios, usa primario si necesario
    //     // readPreference: ReadPreference.NEAREST,          // Lee del nodo más cercano (menor latencia)

    // Valores por defecto para transacciones
    private static defaultTransactionOptions: mongoose.mongo.TransactionOptions = {
        readConcern: mongoose.mongo.ReadConcern.MAJORITY, // Better consistency for transactions
        // readConcern: 'local', // Better consistency for transactions
        writeConcern: {
            w: 'majority' as mongoose.mongo.W,
            wtimeout: DB_WRITE_TIMEOUT_MS,
            j: true,
        },
        readPreference: mongoose.mongo.ReadPreference.PRIMARY,
    };

    // Add a new method to start a session
    public static async startSession(name: string, options?: mongoose.mongo.TransactionOptions): Promise<ClientSession> {
        await this.connectDB();
        const session = await mongoose.startSession({
            defaultTransactionOptions: {
                ...this.defaultTransactionOptions,
                ...options,
            },
        });
        console_log(0, 'MONGO', `${name} - startSession - Created new session: ${session.id?.id.toString('hex')}`);
        return session;
    }

    private static getActiveSession(methodName: string, providedSession?: ClientSession): ClientSession | undefined {
        const storedSession = sessionStorage.getStore();
        const session = providedSession || storedSession;
        const sessionId = providedSession
            ? providedSession?.id?.id.toString('hex') || 'id not found'
            : storedSession
            ? storedSession?.id?.id.toString('hex') || 'id not found'
            : 'no session';
        const sessionDetails = {
            source: providedSession ? 'parameter' : storedSession ? 'context' : 'none',
            // sesskionId: providedSession ? providedSession?.id?.id || 'none' : storedSession?.id?.id || 'none',
            // hasSession: !!session,
            inTransaction: session?.inTransaction() || false,
            // serverSessionId: session?.serverSession?.id?.id || 'none',
        };
        console_log(0, 'MONGO', `${methodName} - session: ${sessionId}`); // - details: ` + toJson(sessionDetails));
        return session;
    }

    public static async getCollections() {
        return new Set((await mongoose.connection.db.listCollections().toArray()).map((col) => col.name));
    }

    public static async withContextTransaction<T>(
        name: string,
        operation: () => Promise<T>,
        options?: mongoose.mongo.TransactionOptions,
        swCommitChilds: boolean = false
    ): Promise<T> {
        //----------------------------
        if (!DB_USE_TRANSACTIONS) {
            console_log(0, 'MONGO', `${name} - withContextTransaction - Transactions disabled - Executing operation without transaction.`);
            return await operation();
        }
        //----------------------------
        const existingSession = sessionStorage.getStore();
        let session: ClientSession | undefined = undefined;
        // let isValid: boolean = true;
        let swTabs = 0;
        //----------------------------
        console_log(1, 'MONGO', `${name} - withContextTransaction - Init - options: ${toJson(options)}`);
        //----------------------------
        try {
            //----------------------------
            if (existingSession !== undefined) {
                session = existingSession;
            }
            //----------------------------
            let result: T;
            //----------------------------
            // If an active session exists, directly execute the operation
            if (existingSession !== undefined) {
                // if (existingSession !== undefined && isValid) {
                console_log(1, 'MONGO', `${name} - withContextTransaction - CHILD - Executing operation - Reusing existing session: ${session!.id?.id.toString('hex')} - INIT`);
                swTabs = 1;
                result = await operation();
                if (swCommitChilds) {
                    console_log(0, 'MONGO', `${name} - withContextTransaction - CHILD - Executed operation - Committing transaction...`);
                    await session!.commitTransaction();
                    try {
                        await session!.abortTransaction();
                    } catch (error: any) {
                        console_log(
                            0,
                            'MONGO',
                            `${name} - withContextTransaction - CHILD - CONTEXTERROR - Executed operation Error - Aborting transaction Error - Error: ${toJson(error)}`
                        );
                    }
                    session!.startTransaction();
                }
                console_log(-1, 'MONGO', `${name} - withContextTransaction - CHILD - Executed operation - OK`);
                swTabs = 0;
            } else {
                // Ejecutar la operación con una nueva transacción si no hay una activa.
                const retryDelayMs = DB_LOCK_TIME_WAITING_TO_TRY_AGAIN_MS;
                const maxWaitTimeMs = DB_LOCK_MAX_TIME_WAITING_TO_COMPLETE_MS;
                let retries = 0;
                const startTime = Date.now();
                console_log(0, 'MONGO', `${name} - withContextTransaction - PARENT - No existing session. Creating new session...`);
                session = await this.startSession(name, options);
                while (Date.now() - startTime < maxWaitTimeMs) {
                    try {
                        return await sessionStorage.run(session, async () => {
                            console_log(1, 'MONGO', `${name} - withContextTransaction - PARENT - Executing operation in session: ${session!.id?.id.toString('hex')} - INIT`);
                            session!.startTransaction();
                            swTabs = 1;
                            result = await operation();
                            await session!.commitTransaction();
                            console_log(0, 'MONGO', `${name} - withContextTransaction - PARENT - Executed operation - Committing transaction...`);
                            console_log(
                                0,
                                'MONGO',
                                `${name} - withContextTransaction - PARENT - Executed operation and completed childs - Ending session: ${session?.id?.id.toString('hex')} - OK`
                            );
                            if (session) {
                                // cierra session cuando todo va bien
                                await session.endSession();
                            }
                            console_log(-1, 'MONGO', `${name} - withContextTransaction - PARENT - Executed operation - OK`);
                            swTabs = 0;
                            return result!;
                        });
                    } catch (error: any) {
                        if (session) {
                            console_log(
                                0,
                                'MONGO',
                                `${name} - withContextTransaction - PARENT - CONTEXTERROR - Executed operation Error - Aborting transaction... - Error: ${toJson(error)}`
                            );
                            try {
                                await session.abortTransaction();
                            } catch (error: any) {
                                console_log(
                                    0,
                                    'MONGO',
                                    `${name} - withContextTransaction - PARENT - CONTEXTERROR - Executed operation Error - Aborting transaction Error - Error: ${toJson(error)}`
                                );
                            }
                        }
                        const isRetryableErrorDBLock = this.isRetryableErrorDBLock(error);
                        if (isRetryableErrorDBLock) {
                            if (Date.now() - startTime < maxWaitTimeMs) {
                                retries++;
                                // Add exponential backoff with jitter
                                const backoffDelay = calculateBackoffDelay(retryDelayMs, retries);
                                console_log(
                                    0,
                                    'MONGO',
                                    `${name} - withContextTransaction - PARENT - CONTEXTERROR - Executed operation Error - DB Locked - Retry ${retries} - retryDelayMs: ${retryDelayMs} - Waiting ${backoffDelay} ms before retrying - Error (code ${
                                        error.code
                                    }): ${error.message || toJson(error)}`
                                );
                                await sleep(backoffDelay);
                                continue;
                            } else {
                                console_error(
                                    0,
                                    'MONGO',
                                    `${name} - withContextTransaction - PARENT - CONTEXTERROR - FINALERROR - Executed operation Error - DB Locked timeout - Ending session - Session: ${session?.id?.id.toString(
                                        'hex'
                                    )} - Error (code ${error.code}): ${error.message || toJson(error)}`
                                );
                                if (session) {
                                    // cierra session cuando es error de DB Locked y se acabó el tiempo
                                    await session.endSession();
                                }
                                throw `Executed operation timeout `; // Re-throw the error
                            }
                        }
                        console_error(
                            0,
                            'MONGO',
                            `${name} - withContextTransaction - PARENT - CONTEXTERROR - FINALERROR - Executed operation Error - Ending session - Session: ${session?.id?.id.toString(
                                'hex'
                            )} - Error (code ${error.code}): ${error.message || toJson(error)}`
                        );
                        if (session) {
                            // cierra session cuando es error de la operacion, no es DB Locked
                            await session.endSession();
                        }
                        throw error; // Re-throw the error
                    } finally {
                    }
                }
                console_error(
                    0 - swTabs,
                    'MONGO',
                    `${name} - withContextTransaction - PARENT - CONTEXTERROR - FINALERROR - Executed operation timeout - Ending session - Session: ${session?.id?.id.toString(
                        'hex'
                    )}`
                );
                if (session) {
                    // cierra session cuando el ciclo while se termina por timeout
                    await session.endSession();
                }
                throw `Executed operation timeout `; // Re-throw the error
            }
            return result!;
        } catch (error: any) {
            throw error; // Re-throw the error
        } finally {
            console_log(-1 - swTabs, 'MONGO', `${name} - withContextTransaction - OK`);
        }
    }

    public static async create<T extends BaseEntity>(instance: T, session?: ClientSession): Promise<string> {
        //----------------------------
        await this.connectDB();
        session = this.getActiveSession(`[${instance.className()}] - create`, session);
        //----------------------------
        try {
            const MongoModel = instance.getMongo().DBModel();
            const mongoInterface = await instance.getMongo().toDBInterface(instance);
            //--------------------------
            // Exclude createdAt and updatedAt fields
            const excludedFields = getFilteredConversionFunctions(instance.getStatic(), (conversion) => conversion.isCreatedAt === true || conversion.isUpdatedAt === true);
            // Remove excluded fields
            for (const [field] of excludedFields.entries()) {
                delete mongoInterface[field];
            }
            //--------------------------
            const Mongo = new MongoModel(mongoInterface);
            const document = await Mongo.save({ session });
            if (document) {
                return document._id.toString();
            } else {
                throw `document is null`;
            }
        } catch (error) {
            const console_log_or_error = session === undefined ? console_error : console_log;
            console_log_or_error(0, `MONGO`, `create - Error: ${error}`);
            throw error;
        }
    }

    public static async update<T extends BaseEntity>(instance: T, updateSet: Record<string, any>, updateUnSet: Record<string, any>, session?: ClientSession) {
        //----------------------------
        await this.connectDB();
        session = this.getActiveSession(`[${instance.className()}] - update`, session);
        //----------------------------
        try {
            //----------------------------
            const MongoModel = instance.getMongo().DBModel();
            let instanceId: Types.ObjectId | undefined = undefined;
            try {
                instanceId = new Types.ObjectId(instance._DB_id);
                if (instanceId === undefined) throw `id is undefined`;
            } catch (error) {
                console_error(0, `MONGO`, `Error converting ${instanceId} to ObjectId - Error: ${error}`);
                throw `Error: converting ${instanceId} to ObjectId - Error: ${error}`;
            }
            //--------------------------
            // Exclude createdAt and updatedAt fields
            const excludedFields = getFilteredConversionFunctions(instance.getStatic(), (conversion) => conversion.isCreatedAt === true || conversion.isUpdatedAt === true);
            // Remove excluded fields
            // Filter fields from updateSet and updateUnSet
            const filteredUpdateSet = { ...updateSet };
            const filteredUpdateUnSet = { ...updateUnSet };
            for (const [field] of excludedFields.entries()) {
                delete filteredUpdateSet[field];
                delete filteredUpdateUnSet[field];
            }
            //--------------------------
            const document = await MongoModel.findOneAndUpdate({ _id: instanceId }, { $set: filteredUpdateSet, $unset: filteredUpdateUnSet }, { new: true, session });
            return document;
        } catch (error) {
            const console_log_or_error = session === undefined ? console_error : console_log;
            console_log_or_error(0, `MONGO`, `update - Error: ${error}`);
            throw error;
        }
    }

    public static async deleteByParams<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>, session?: ClientSession): Promise<number | undefined> {
        //----------------------------
        await this.connectDB();
        session = this.getActiveSession(`[${Entity.className()}] - deleteByParams`, session);
        //----------------------------
        try {
            //----------------------------
            const MongoModel = Entity.getMongo().DBModel();
            this.convertStringToRegexAndObjectId(Entity, paramsFilter);
            const result = await MongoModel.deleteMany(paramsFilter).session(session);
            return result?.deletedCount;
        } catch (error) {
            const console_log_or_error = session === undefined ? console_error : console_log;
            console_log_or_error(0, `MONGO`, `deleteByParams - Error: ${error}`);
            throw error;
        }
    }

    public static async delete<T extends BaseEntity>(instance: T, session?: ClientSession) {
        //----------------------------
        await this.connectDB();
        session = this.getActiveSession(`[${instance.className()}] - delete`, session);
        //----------------------------
        try {
            //----------------------------
            const MongoModel = instance.getMongo().DBModel();
            let instanceId: Types.ObjectId | undefined = undefined;
            try {
                instanceId = new Types.ObjectId(instance._DB_id);
                if (instanceId === undefined) throw `id is undefined`;
            } catch (error) {
                console_error(0, `MONGO`, `Error converting ${instanceId} to ObjectId - Error: ${error}`);
                throw `Error: converting ${instanceId} to ObjectId - Error: ${error}`;
            }
            const document = await MongoModel.findByIdAndDelete(instanceId).session(session).exec();
            return document;
        } catch (error) {
            const console_log_or_error = session === undefined ? console_error : console_log;
            console_log_or_error(0, `MONGO`, `delete - Error: ${error}`);
            throw error;
        }
    }

    public static async checkIfExists<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilterOrID: Record<string, any> | string, session?: ClientSession): Promise<boolean> {
        //----------------------------
        await this.connectDB();
        session = this.getActiveSession(`[${Entity.className()}] - checkIfExists`, session);
        //----------------------------
        try {
            //----------------------------
            const MongoModel = Entity.getMongo().DBModel();
            let document;
            //----------------------------
            if (isString(paramsFilterOrID)) {
                let instanceId: Types.ObjectId | undefined = undefined;
                try {
                    instanceId = new Types.ObjectId(paramsFilterOrID);
                    if (instanceId === undefined) throw `id is undefined`;
                } catch (error) {
                    throw `Error: converting ${instanceId} to ObjectId - Error: ${error}`;
                }
                document = await MongoModel.findById(instanceId, { _id: 1 }).session(session).exec();
            } else {
                this.convertStringToRegexAndObjectId(Entity, paramsFilterOrID);
                document = await MongoModel.findOne(paramsFilterOrID, { _id: 1 }).session(session).exec();
            }
            //----------------------------
            if (document) {
                //console_log(0, `MONGO`, `checkIfExists - True`);
                return true;
            } else {
                console_log(0, `MONGO`, `checkIfExists - False`);
                return false;
            }
        } catch (error) {
            const console_log_or_error = session === undefined ? console_error : console_log;
            console_log_or_error(0, `MONGO`, `checkIfExists - Error: ${error}`);
            throw error;
        }
    }

    public static async getByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter: Record<string, any>,
        fieldsForSelectForMongo: Record<string, number>,
        useOptionGet: OptionsGet,
        session?: ClientSession
    ) {
        //----------------------------
        await this.connectDB();
        session = this.getActiveSession(`[${Entity.className()}] - getByParams`, session);
        //----------------------------
        try {
            //----------------------------
            // console.log (`getByParams post connect ${Entity.className()}`)
            const MongoModel = Entity.getMongo().DBModel();
            //----------------------------
            let query;
            //----------------------------
            let includesBiginFilter = false;
            let includesBiginSort = false;
            //----------------------------
            let filterFields: string[] = [];
            let sortFields: string[] = [];
            //----------------------------
            let bigintFields: string[] = [];
            //----------------------------
            let convertedFieldNames: Record<string, string> = {};
            //----------------------------
            // List of fields that are actually Bigints but stored as strings
            //----------------------------
            const conversionFunctions = getCombinedConversionFunctions(Entity.getStatic());
            if (conversionFunctions) {
                for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                    if (conversions.type === BigInt) {
                        bigintFields.push(propertyKey);
                        convertedFieldNames[propertyKey] = propertyKey + '_converted'; // New field name
                    }
                }
            }
            //----------------------------
            if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
                useOptionGet.lookUpFields.forEach((lookupField) => {
                    if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
                        convertedFieldNames[lookupField.localField] = lookupField.localField + '_converted'; // New field name
                    }
                });
            }
            //----------------------------
            // Function to recursively collect fields that require conversion
            function collectFieldsForConversion(query: Record<string, any>, collectedFields = new Set<string>()): string[] {
                Object.entries(query).forEach(([key, value]) => {
                    if (['$or', '$and', '$not', '$nor'].includes(key) && Array.isArray(value)) {
                        // If the key is a query operator and its value is an array, recurse into each element
                        value.forEach((subQuery) => collectFieldsForConversion(subQuery, collectedFields));
                    } else if (bigintFields.includes(key)) {
                        // If the key is one of the fields requiring conversion, add it to the set
                        collectedFields.add(key);
                    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        // If the value is a nested object (subquery), recurse into it
                        collectFieldsForConversion(value, collectedFields);
                    }
                    // Other types of values (e.g., direct comparisons) do not need recursion
                });

                return Array.from(collectedFields); // Convert Set to Array before returning
            }
            //----------------------------
            function replaceFieldNamesInFilter(query: Record<string, any>, convertedFieldNames: Record<string, string>): Record<string, any> {
                const updatedQuery: Record<string, any> = {};
                for (const [key, value] of Object.entries(query)) {
                    if (['$or', '$and', '$not', '$nor'].includes(key) && Array.isArray(value)) {
                        // Recursively handle array of conditions
                        updatedQuery[key] = value.map((subQuery) => replaceFieldNamesInFilter(subQuery, convertedFieldNames));
                    } else if (bigintFields.includes(key)) {
                        // Replace field name if it's in the list of fields that need conversion
                        const newKey = convertedFieldNames[key];
                        updatedQuery[newKey] = value;
                    } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.entries(value) !== undefined && Object.entries(value).length > 0) {
                        // Recursively handle nested objects
                        updatedQuery[key] = replaceFieldNamesInFilter(value, convertedFieldNames);
                    } else {
                        // Copy over as-is if no replacement needed
                        updatedQuery[key] = value;
                    }
                }

                return updatedQuery;
            }
            //----------------------------
            if (!isEmptyObject(paramsFilter)) {
                //----------------------------
                this.convertStringToRegexAndObjectId(Entity, paramsFilter);
                filterFields = collectFieldsForConversion(paramsFilter);
                includesBiginFilter = filterFields.some((field) => bigintFields.includes(field));
            }
            //----------------------------
            if (!isEmptyObject(useOptionGet.sort)) {
                //----------------------------
                // Check if sort criteria include any Bigint fields
                sortFields = Object.keys(useOptionGet!.sort!);
                includesBiginSort = sortFields.some((field) => bigintFields.includes(field));
                //----------------------------
            }
            //----------------------------
            if (includesBiginFilter || includesBiginSort || (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0)) {
                // Build an aggregation pipeline
                let pipeline = [];
                //----------------------------
                if (paramsFilter._id && typeof paramsFilter._id === 'string') {
                    paramsFilter._id = new Types.ObjectId(paramsFilter._id);
                }
                //----------------------------
                // Convert Bigint fields to numbers for filter and sorting
                let addFieldsStage = {
                    $addFields: {},
                };
                //----------------------------
                const divisor = 1_000_000_000;
                //----------------------------
                filterFields.forEach((field) => {
                    if (bigintFields.includes(field)) {
                        let defaultValue = 0;
                        (addFieldsStage.$addFields as any)[convertedFieldNames[field]] = {
                            $convert: {
                                // input: `$${field}`
                                input: { $divide: [{ $toDecimal: `$${field}` }, divisor] },
                                to: 'decimal',
                                onError: defaultValue,
                                onNull: defaultValue,
                                // onError: 'Error', // Handle conversion error
                                // onNull: 'Error', // Handle null values
                            },
                        };
                    }
                });
                //----------------------------
                sortFields.forEach((field) => {
                    if (bigintFields.includes(field)) {
                        let sortOrder = useOptionGet.sort![field]; // Get the sort order for the field
                        let defaultValueForSort = sortOrder === -1 ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
                        (addFieldsStage.$addFields as any)[convertedFieldNames[field]] = {
                            $convert: {
                                input: `$${field}`,
                                //input: { $toDecimal: `$${field}` },
                                // input: { $divide: [{ $toDecimal: `$${field}` }, divisor] },
                                to: 'decimal',
                                onError: defaultValueForSort, // Use a large number for sorting to the end
                                onNull: defaultValueForSort, // Use a large number for sorting to the end
                                // onError: 'Error', // Handle conversion error
                                // onNull: 'Error', // Handle null values
                            },
                        };
                    }
                });
                //----------------------------
                if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
                    useOptionGet.lookUpFields.forEach((lookupField) => {
                        if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
                            (addFieldsStage.$addFields as any)[convertedFieldNames[lookupField.localField]] = {
                                $convert: {
                                    input: `$${lookupField.localField}`,
                                    to: 'objectId',
                                    // onError: 'Error', // Handle conversion error
                                    // onNull: 'Error', // Handle null values
                                },
                            };
                        }
                    });
                }
                //----------------------------
                if (Object.keys(addFieldsStage.$addFields).length > 0) {
                    pipeline.push(addFieldsStage);

                    if (!isEmptyObject(fieldsForSelectForMongo) && Object.values(fieldsForSelectForMongo).every((value) => value === 1)) {
                        // esto es solo para testing...
                        // me aseguro que no sea empty, si no estaria agregando fields a la proyection con 1, y solo lenvatnaria los convertidos, en lugar de levantar todos como cuando es empty
                        // si es una lista de inclusion me encargo de agregar los elementso que van always

                        // NOTE: no me queda claro nada de todo esto....
                        // por que estaba agregando aqui todos los campos usados, los converted, etc, en la projeccion final???
                        // y estaba tirando error en un caso donde agregaba campos que ya estaban en la proyeccion

                        const additionalFieldsForProjection = Object.keys(addFieldsStage.$addFields).reduce((acc: Record<string, number>, field) => {
                            // acc[field] = 1; // <-- Aquí se está agregando el campo convertido a la proyección
                            return acc;
                        }, {});

                        // Merge this object with fieldsForSelectForMongo
                        fieldsForSelectForMongo = { ...fieldsForSelectForMongo, ...additionalFieldsForProjection };
                    }
                }
                //----------------------------
                // Add $lookup stages to the pipeline based on lookUpFields
                if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
                    useOptionGet.lookUpFields.forEach((lookupField) => {
                        if (!isEmptyObject(fieldsForSelectForMongo) && Object.values(fieldsForSelectForMongo).every((value) => value === 1)) {
                            // me aseguro que no sea empty, si no estaria agregando fields a la proyection con 1, y solo lenvatnaria los convertidos, en lugar de levantar todos como cuando es empty
                            // y estaba tirando error en un caso donde agregaba campos que ya estaban en la proyeccion
                            // agregar automáticamente los campos generados por lookups

                            fieldsForSelectForMongo[lookupField.as] = 1;
                        }

                        const fieldsForSelect = lookupField.fieldsForSelect;
                        let pipeline_: { $project: Record<string, number> }[] = [];
                        if (fieldsForSelect !== undefined && !isEmptyObject(fieldsForSelect)) {
                            const fieldsForSelectForMongo_ = Object.fromEntries(Object.keys(fieldsForSelect).map((key) => [key, fieldsForSelect[key] ? 1 : 0]));
                            pipeline_ = [{ $project: fieldsForSelectForMongo_ }];
                        }
                        if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
                            let lookup: Record<string, any> = {
                                from: this.getTableName(lookupField.from),
                                localField: convertedFieldNames[lookupField.localField],
                                foreignField: lookupField.foreignField,
                                as: lookupField.as,
                            };
                            if (pipeline_.length > 0) {
                                lookup = { ...lookup, pipeline: pipeline_ };
                            }
                            pipeline.push({
                                $lookup: lookup,
                            });
                        } else {
                            let lookup: Record<string, any> = {
                                from: this.getTableName(lookupField.from),
                                localField: lookupField.localField,
                                foreignField: lookupField.foreignField,
                                as: lookupField.as,
                            };
                            if (pipeline_.length > 0) {
                                lookup = { ...lookup, pipeline: pipeline_ };
                            }
                            pipeline.push({
                                $lookup: lookup,
                            });
                        }
                    });
                    // Optional: If you're sure each $lookup will always return a single document and want to flatten the results
                    // You can add a $unwind stage for each lookup result.
                    useOptionGet.lookUpFields.forEach((lookupField) => {
                        // Add $unwind stage only if necessary. Comment out or remove if not needed.
                        pipeline.push({
                            $unwind: {
                                path: `$${lookupField.as}`,
                                // Include the path in the output documents even if the path is null, empty, or missing.
                                preserveNullAndEmptyArrays: true,
                            },
                        });
                    });
                }
                //----------------------------
                if (!isEmptyObject(paramsFilter)) {
                    // Apply filters
                    const newFilter = replaceFieldNamesInFilter(paramsFilter, convertedFieldNames);
                    pipeline.push({ $match: newFilter });
                }
                //----------------------------
                if (!isEmptyObject(useOptionGet.sort)) {
                    // Apply sorting
                    let sortStage = { $sort: {} };
                    for (let field of sortFields) {
                        let sortField = bigintFields.includes(field) ? convertedFieldNames[field] : field;
                        (sortStage.$sort as any)[sortField] = useOptionGet!.sort![field];
                    }
                    pipeline.push(sortStage);
                }
                //----------------------------
                // Apply skip if necessary
                if (useOptionGet.skip !== undefined) {
                    pipeline.push({ $skip: useOptionGet.skip });
                }
                // Apply limit if necessary
                if (useOptionGet.limit !== undefined) {
                    pipeline.push({ $limit: useOptionGet.limit });
                }
                //----------------------------
                // Apply projection
                if (!isEmptyObject(fieldsForSelectForMongo)) {
                    pipeline.push({ $project: fieldsForSelectForMongo });
                }
                //----------------------------
                console_log(0, `MONGO`, `getByParams - pipeline: ${toJson(pipeline)}`);
                //----------------------------
                query = MongoModel.aggregate(pipeline).session(session);
                //----------------------------
                const documents = await query.exec();
                //----------------------------
                console_log(
                    0,
                    `MONGO`,
                    `getByParam - pipeline - found ${documents.length} document(s)... - show: ${documents
                        .map((item: any) =>
                            toJson({
                                _id: item._id,
                                name: item.name ?? '',
                                fieldsConverted: Object.keys(addFieldsStage.$addFields).map((field) => {
                                    return { field, value: item[field] };
                                }),
                            })
                        )
                        .join('      |     ')}`
                );
                //--------------------------
                return documents;
            } else {
                //----------------------------
                // Normal find query
                query = MongoModel.find(paramsFilter, fieldsForSelectForMongo).session(session);
                //----------------------------
                if (useOptionGet.skip !== undefined) {
                    query = query.skip(useOptionGet.skip);
                }
                if (useOptionGet.limit !== undefined) {
                    query = query.limit(useOptionGet.limit);
                }
                //----------------------------
                if (!isEmptyObject(useOptionGet.sort)) {
                    query = query.sort(useOptionGet.sort);
                }
                //----------------------------
                // console_log(0, `MONGO`, `getByParams - query - paramsFilter: ${toJson(paramsFilter)} - fieldsForSelectForMongo: ${toJson(fieldsForSelectForMongo)} - useOptionGet: ${toJson(useOptionGet)}`);
                //----------------------------
                const documents = await query.exec();
                //----------------------------
                return documents;
            }
        } catch (error) {
            const console_log_or_error = session === undefined ? console_error : console_log;
            console_log_or_error(0, `MONGO`, `getByParams - Error: ${error}`);
            throw error;
        }
    }

    public static async getCount<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>, session?: ClientSession): Promise<number> {
        //----------------------------
        await this.connectDB();
        session = this.getActiveSession(`[${Entity.className()}] - getCount`, session);
        //----------------------------
        try {
            //----------------------------
            const MongoModel = Entity.getMongo().DBModel();
            this.convertStringToRegexAndObjectId(Entity, paramsFilter);
            const count = await MongoModel.countDocuments(paramsFilter).session(session).exec();
            return count;
            //----------------------------
        } catch (error) {
            const console_log_or_error = session === undefined ? console_error : console_log;
            console_log_or_error(0, `MONGO`, `getCount - Error: ${error}`);
            throw error;
        }
    }

    public static async aggregate<T extends BaseEntity>(Entity: typeof BaseEntity, pipeline: Record<string, any>[], session?: ClientSession) {
        //----------------------------
        await this.connectDB();
        session = this.getActiveSession(`[${Entity.className()}] - aggregate`, session);
        //----------------------------
        try {
            const MongoModel = Entity.getMongo().DBModel();
            //----------------------------
            let query;
            //----------------------------
            pipeline.forEach((stage) => {
                if (stage.$match) {
                    this.convertStringToRegexAndObjectId(Entity, stage.$match);
                }
            });
            //----------------------------
            query = MongoModel.aggregate(pipeline).session(session);
            //----------------------------
            const documents = await query.exec();
            //----------------------------
            return documents;
        } catch (error) {
            const console_log_or_error = session === undefined ? console_error : console_log;
            console_log_or_error(0, `MONGO`, `aggregate - Error: ${error}`);
            throw error;
        }
    }

    public static convertStringToRegexAndObjectId<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>) {
        try {
            //----------------------------
            const MongoModel = Entity.getMongo().DBModel();
            //----------------------------
            for (const key in paramsFilter) {
                if (typeof paramsFilter[key] === 'string') {
                    // Convert string to RegExp if it starts with '/'
                    if (paramsFilter[key].startsWith('/')) {
                        const regExpParts = paramsFilter[key].split('/');
                        const pattern = regExpParts[1];
                        const flags = regExpParts[2];
                        paramsFilter[key] = new RegExp(pattern, flags);
                    }
                    // Convert string to ObjectId if the key ends with '_id'
                    else if (key === '_id' || (key.endsWith('_id') && MongoModel?.schema?.obj[key] !== undefined && MongoModel?.schema?.obj[key].type?.name === 'ObjectId')) {
                        try {
                            paramsFilter[key] = new Types.ObjectId(paramsFilter[key]);
                        } catch (error) {
                            throw `Error converting ${key} to ObjectId - Error: ${error}`;
                        }
                    }
                } else if (typeof paramsFilter[key] === 'object' && paramsFilter[key] !== null && Types.ObjectId.isValid(paramsFilter[key]) === false) {
                    if (key === '_id' || (key.endsWith('_id') && MongoModel?.schema?.obj[key] !== undefined && MongoModel?.schema?.obj[key].type?.name === 'ObjectId')) {
                        if (paramsFilter[key].$in) {
                            paramsFilter[key].$in = paramsFilter[key].$in.map((id: string) => {
                                try {
                                    return new Types.ObjectId(id);
                                } catch (error) {
                                    throw `Error: converting ${id} to ObjectId in $in - Error: ${error}`;
                                }
                            });
                        } else if (paramsFilter[key].$nin) {
                            paramsFilter[key].$nin = paramsFilter[key].$nin.map((id: string) => {
                                try {
                                    return new Types.ObjectId(id);
                                } catch (error) {
                                    throw `Error: converting ${id} to ObjectId in $nin - Error: ${error}`;
                                }
                            });
                        } else if (paramsFilter[key].$eq) {
                            try {
                                paramsFilter[key].$eq = new Types.ObjectId(paramsFilter[key].$eq);
                            } catch (error) {
                                throw `Error converting ${paramsFilter[key].$eq} to ObjectId in $eq - Error: ${error}`;
                            }
                        } else if (paramsFilter[key].$ne) {
                            try {
                                paramsFilter[key].$ne = new Types.ObjectId(paramsFilter[key].$ne);
                            } catch (error) {
                                throw `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: ${error}`;
                            }
                        } else {
                            throw `${key} is an ObjectId field, but the filter ${paramsFilter[key]} is not a valid filter for ObjectId fields. Filters: ${toJson(paramsFilter)}`;
                        }
                    } else {
                        // Recursive call for nested objects (like those in $or or $and)
                        this.convertStringToRegexAndObjectId(Entity, paramsFilter[key]);
                    }
                }
            }
        } catch (error) {
            console_error(0, `MONGO`, `convertStringToRegexAndObjectId - Error: ${error}`);
            throw error;
        }
    }
}