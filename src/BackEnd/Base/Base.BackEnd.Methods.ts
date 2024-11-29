import { console_error, console_errorLv2, console_logLv2 } from '../../Commons/BackEnd/globalLogs.js';
import { getCombinedConversionFunctions } from '../../Commons/Decorators/Decorator.Convertible.js';
import { RegistryManager } from '../../Commons/Decorators/registerManager.js';
import {
    CascadeUpdate,
    ConversionFunctions,
    OptionsCreateOrUpdate,
    optionsCreateOrUpdateDefault,
    OptionsDelete,
    optionsDeleteDefault,
    OptionsGet,
    optionsGetDefault,
    OptionsGetOne,
} from '../../Commons/types.js';
import { isEmptyObject, isEqual, isFrontEndEnvironment, isNullOrBlank, isObject, isString, isSubclassOf, showData, toJson } from '../../Commons/utils.js';
import { BaseEntity } from '../../Entities/Base/Base.Entity.js';
import { MongoDatabaseService } from '../DatabaseService/Mongo.Database.Service.js';
import { PostgreSQLDatabaseService } from '../DatabaseService/PostgreSQL.Database.Service.js';

// BaseBackEndMethods es generico
// Todos los metodos reciben o instancia o entidad
// pero si se setea uno por Entidad y se setea la entidad, tiene metodos especificos
// ofrece metodos igual que el base pero con _ para cuando es especifico

export class BaseBackEndMethods {
    // protected static _Entity = BaseEntity;

    // #region internal class methods

    public static isBaseEntityClass(className: any): className is typeof BaseEntity {
        const isBaseEntityClass = isSubclassOf(className, BaseEntity);
        return isBaseEntityClass;
    }

    public static getBack(entity: any): any {
        const result = RegistryManager.getFromBackEndAppliedRegistry(entity);
        if (!result) {
            throw `BackEnd Methods Applied for ${entity} not found in registry.`;
        } else {
            // console.error (`----- get BackEndApplied for ${entity.className()} found ----`)
        }
        return result;
    }

    // #endregion internal class methods

    // #region relations helpers

    public static async checkIfRelationExists<T extends BaseEntity>(
        instance: T,
        RelatedClassType: typeof BaseEntity,
        value_id: string | undefined,
        propertyKey: string,
        conversions: ConversionFunctions<T>
    ): Promise<string | undefined> {
        let result: string | undefined = value_id;
        if (value_id !== undefined) {
            // si esta seteado el id controlo que exista el registro
            // si no existe lo seteo undefined
            const exists = await this.checkIfExists<T>(RelatedClassType, value_id);
            if (!exists) {
                console_error(
                    0,
                    instance.className(),
                    `Relation ${RelatedClassType.className()} - ${propertyKey}: ${conversions.propertyToFill?.toString()} id ${value_id} not found`
                );
                result = undefined;
            }
        }
        return result;
    }

    // se utiliza para ver si alguna relacion no existe, si no existe no se agrega a la lista de ids de esa relacion
    public static async checkIfAllRelationsExists<T extends BaseEntity>(instance: T): Promise<CascadeUpdate> {
        //--------------------------------------
        console_logLv2(1, instance.className(), `checkIfAllRelationsExists - Init`);
        //--------------------------------------
        let swUpdate = false;
        let updatedFields = {};
        //--------------------------------------
        const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.relation !== undefined) {
                    let value: any = undefined;
                    let swProcessValue = false;
                    if (instance.hasOwnProperty(propertyKey as keyof typeof instance) || instance[conversions.propertyToFill! as keyof typeof instance]) {
                        value = instance[propertyKey as keyof typeof instance];
                        swProcessValue = true;
                    }
                    if (swProcessValue) {
                        // itero por todas las relaciones que hay
                        if (conversions.isArray === true) {
                            // OneToMany es array
                            //--------------------------------------
                            const RelatedClassType = conversions.typeRelation;
                            if (!this.isBaseEntityClass(RelatedClassType)) {
                                throw `${instance.className()} - ${propertyKey}: Must be related with SmartDB Class`;
                            }
                            //--------------------------------------
                            const array_ids = [];
                            //--------------------------------------
                            let value_ids: any = value;
                            //--------------------------------------
                            if (value_ids) {
                                if (Array.isArray(value_ids) === false) {
                                    throw `${instance.className()} - ${propertyKey}: OneToMany value must be an Array`;
                                }
                                for (let i = 0; i < value_ids.length; i++) {
                                    const value_id = await this.checkIfRelationExists(instance, RelatedClassType, value_ids[i], propertyKey, conversions);
                                    if (value_id !== undefined) {
                                        array_ids.push(value_id);
                                    }
                                }
                            }
                            //--------------------------------------
                            if (!isEqual(instance[propertyKey as keyof typeof instance], array_ids)) {
                                (instance as any)[propertyKey as keyof typeof instance] = array_ids;
                                swUpdate = true;
                                updatedFields = {
                                    ...updatedFields,
                                    [propertyKey]: {
                                        from: instance[propertyKey as keyof typeof instance],
                                        to: array_ids,
                                    },
                                };
                            }
                            //--------------------------------------
                        } else {
                            // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
                            // ManyToOne es una relacion de muchos registros de esta tabla con un registro de otra tabla
                            // en ambos casos lo que tengo aqui es un solo id
                            //--------------------------------------
                            const RelatedClassType = conversions.typeRelation;
                            if (!this.isBaseEntityClass(RelatedClassType)) {
                                throw `${instance.className()} - ${propertyKey}: Must be related with SmartDB Class`;
                            }
                            //--------------------------------------
                            let value_id: any = await this.checkIfRelationExists(instance, RelatedClassType, value, propertyKey, conversions);
                            //--------------------------------------
                            if (instance[propertyKey as keyof typeof instance] !== value_id) {
                                instance[propertyKey as keyof typeof instance] = value_id;
                                swUpdate = true;
                                updatedFields = {
                                    ...updatedFields,
                                    [propertyKey]: {
                                        from: instance[propertyKey as keyof typeof instance],
                                        to: value_id,
                                    },
                                };
                            }
                            //--------------------------------------
                        }
                    }
                }
            }
        }
        //--------------------------------------
        console_logLv2(-1, instance.className(), `checkIfAllRelationsExists - OK`);
        //--------------------------------------
        return { swUpdate, updatedFields };
    }

    public static async checkRelationAndCreateIt<T extends BaseEntity, R extends BaseEntity>(
        instance: T,
        RelatedClassType: typeof BaseEntity,
        value_object: R | undefined,
        propertyKey: string,
        conversions: ConversionFunctions<T>,
        optionsCreateOrUpdate?: OptionsCreateOrUpdate
    ): Promise<R | undefined> {
        if (value_object !== undefined) {
            // voy a revisar el objeto a ver si hay id en él o si puedo salvarlo
            if (value_object._DB_id) {
                // TODO: no quiero hacer esto. supuestamente aqui chekeaba el id del child y si estaba ok updateaba el child... es mucha sobrecarga innecesaria
                // const exists = await RelatedClassType.checkIfExists(value_object._DB_id);
                // if (!exists) {
                //     console_errorLv2(0, instance.className(), `${propertyKey}: ${conversions.propertyToFill} id ${value_object._DB_id} not found`);
                // } else {
                //     // el objeto tiene id y existe
                //     console_log(instance.className(),  `${tabs()}[${instance.className()}**] - checkRelationAndCreateIt - Relation: ${propertyKey} in field: ${conversions.propertyToFill} - id ${value_object._DB_id} - Updating...`);
                //     await value_object.update(optionsCreateOrUpdate);
                // }
                return value_object;
            } else {
                // no tiene seteado el id el objeto, veo de guardarlo en la base de datos y obtener su id
                console_logLv2(
                    0,
                    instance.className(),
                    `checkRelationAndCreateIt - ${RelatedClassType.className()}: ${propertyKey} in field: ${conversions.propertyToFill} - Creating...`
                );
                const value_object_ = await this.create<R>(value_object, optionsCreateOrUpdate);
                return value_object_;
            }
        }
    }

    public static async checkRelationAndLoadIt<T extends BaseEntity, R extends BaseEntity>(
        instance: T,
        RelatedClassType: typeof BaseEntity,
        value_id: string | undefined,
        propertyKey: string,
        conversions: ConversionFunctions<T>,
        optionsGet?: OptionsGetOne,
        restricFilter?: Record<string, any>
    ): Promise<R | undefined> {
        let value_object: R | undefined;
        if (value_id !== undefined) {
            console_logLv2(
                0,
                instance.className(),
                `checkRelationAndLoadIt - ${RelatedClassType.className()} - in field: ${conversions.propertyToFill} - using ${propertyKey} as id: ${value_id} - Loading...`
            );
            value_object = await this.getById<R>(RelatedClassType, value_id, optionsGet, restricFilter);
        } else {
            console_logLv2(
                0,
                instance.className(),
                `checkRelationAndLoadIt - ${RelatedClassType.className()} - in field: ${conversions.propertyToFill} - using ${propertyKey} as id: ${value_id} - Not found`
            );
        }
        return value_object;
    }

    // #endregion relations helpers

    // #region class methods

    public static async checkDuplicate<T extends BaseEntity>(Entity: typeof BaseEntity, validatedData: any, id?: string) {
        try {
            //-------------------------
            console_logLv2(1, Entity.className(), `checkDuplicate - Init`);
            //-------------------------
            const conversionFunctions = getCombinedConversionFunctions(Entity);
            const query: any = {};
            if (conversionFunctions) {
                for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                    if (conversions.isUnique === true) {
                        if (validatedData.hasOwnProperty(propertyKey)) {
                            if (validatedData[propertyKey] !== undefined) {
                                query[propertyKey] = validatedData[propertyKey];
                            }
                        }
                    }
                }
                let conditions = Object.keys(query).map((key) => ({ [key]: query[key] }));
                if (conditions.length > 0) {
                    //TODO reemplazar con chekIfExist, pero hay que agregar parametro id en el update para no contar a si mismo
                    let swExists: boolean = false;
                    if (id !== undefined) {
                        console_logLv2(0, Entity.className(), `checkDuplicate - To Update - Conditions: ${showData(conditions)}`);
                        swExists = await this.checkIfExists(Entity, {
                            $and: [{ $or: conditions }, { _id: { $ne: id } }],
                        });
                    } else {
                        console_logLv2(0, Entity.className(), `checkDuplicate - To Create - Conditions: ${showData(conditions)}`);
                        swExists = await this.checkIfExists(Entity, { $or: conditions });
                    }
                    if (swExists) {
                        const fieldsStr = Object.keys(query).map((key) => key);
                        throw `${Entity.className()} already exists with same field(s): ${fieldsStr.join(', ')}`;
                    }
                }
            }
            //-------------------------
            console_logLv2(-1, Entity.className(), `checkDuplicate - OK`);
            //-------------------------
        } catch (error) {
            console_errorLv2(-1, Entity.className(), `checkDuplicate - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async checkRequired<T extends BaseEntity>(Entity: typeof BaseEntity, validatedData: any) {
        try {
            //-------------------------
            console_logLv2(1, Entity.className(), `checkRequired - Init`);
            //-------------------------
            const conversionFunctions = getCombinedConversionFunctions(Entity);
            //-------------------------
            if (conversionFunctions) {
                for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                    if (conversions.required === true) {
                        if (validatedData.hasOwnProperty(propertyKey)) {
                            if (validatedData[propertyKey] === undefined || isNullOrBlank(validatedData[propertyKey])) {
                                throw `${Entity.className()} - ${propertyKey} is required`;
                            }
                        } else {
                            throw `${Entity.className()} - ${propertyKey} is required`;
                        }
                    }
                }
            }
            //-------------------------
            console_logLv2(-1, Entity.className(), `checkRequired - OK`);
            //-------------------------
        } catch (error) {
            console_errorLv2(-1, Entity.className(), `checkRequired - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async create<T extends BaseEntity>(instance: T, optionsCreate?: OptionsCreateOrUpdate): Promise<T> {
        try {
            if (isFrontEndEnvironment()) {
                //return await this.createApi<T>(optionsCreate);
                throw `Can't run this method in the Browser`;
            }
            //-----------------------
            console_logLv2(1, instance.className(), `create - Options: ${showData(optionsCreate)} - Init`);
            //----------------------------
            let useOptionCreate = optionsCreateOrUpdateDefault;
            if (optionsCreate !== undefined) {
                useOptionCreate = optionsCreate;
            }
            //-------------------------
            await this.checkDuplicate(instance.getStatic(), instance);
            //-------------------------
            await this.checkRequired(instance.getStatic(), instance);
            //----------------------------
            await this.getBack(instance.getStatic()).cascadeSaveChildRelations(instance, useOptionCreate);
            //--------------------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                const _id = await MongoDatabaseService.create<T>(instance);
                if (_id) {
                    const instance_ = await this.getById<T>(instance.getStatic(), _id, optionsCreate, undefined);
                    if (instance_ === undefined) {
                        throw `${instance.className()} - Not found after created - id: ${_id.toString()}`;
                    }
                    //-----------------------
                    // se hace despues por que necesita el id de este registro para actualizar en el padre
                    // se hace unicamente al crear el registro
                    await this.getBack(instance.getStatic()).cascadeSaveParentRelations(instance_, useOptionCreate);
                    //-----------------------
                    console_logLv2(-1, instance.className(), `create - Instance: ${instance_.show()} - OK`);
                    return instance_;
                } else {
                    throw `unknown Mongo`;
                }
            } else if (process.env.USE_DATABASE === 'postgresql') {
                const _id = await PostgreSQLDatabaseService.create<T>(instance);
                // console_logLv2(0, instance.className(), `id postgres: ${_id}`);
                if (_id) {
                    const instance_ = await this.getById<T>(instance.getStatic(), _id, optionsCreate, undefined);
                    if (instance_ === undefined) {
                        throw `${instance.className()} - Not found after created - id: ${_id.toString()}`;
                    }
                    //-----------------------
                    // se hace despues por que necesita el id de este registro para actualizar en el padre
                    // se hace unicamente al crear el registro
                    await this.getBack(instance.getStatic()).cascadeSaveParentRelations(instance_, useOptionCreate);
                    //-----------------------
                    console_logLv2(-1, instance.className(), `create - Instance: ${instance_.show()} - OK`);
                    //-----------------------
                    return instance_;
                } else {
                    throw `unknown PostgreSQL`;
                }
            } else {
                throw `Database not defined`;
            }
        } catch (error) {
            console_errorLv2(-1, instance.className(), `create - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async refresh<T extends BaseEntity>(instance: T, optionsGet?: OptionsGet): Promise<void> {
        try {
            if (isNullOrBlank(instance._DB_id)) {
                throw `id not defined`;
            }
            //-----------------------
            if (isFrontEndEnvironment()) {
                //return await this.refreshApi<T>(optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //-----------------------
            console_logLv2(1, instance.className(), `refresh - Options: ${showData(optionsGet)} - Init`);
            //----------------------------
            const instance_ = await this.getById<T>(instance.getStatic(), instance._DB_id, optionsGet, undefined);
            if (instance_ === undefined) {
                throw `id: ${instance._DB_id} - Instance not found`;
            }
            Object.assign(instance, instance_);
            console_logLv2(-1, instance.className(), `refresh - Instance: ${instance.show()} - OK`);
            //-----------------------
        } catch (error) {
            console_errorLv2(-1, instance.className(), `refresh - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async update<T extends BaseEntity>(instance: T, optionsUpdate?: OptionsCreateOrUpdate): Promise<void> {
        try {
            if (isNullOrBlank(instance._DB_id)) {
                throw `id not defined`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                //return await this.updateApi<T>(optionsUpdate);
                throw `Can't run this method in the Browser`;
            }
            //-----------------------
            console_logLv2(1, instance.className(), `update - Options: ${showData(optionsUpdate)} - Init`);
            //----------------------------
            let useOptionUpdate = optionsCreateOrUpdateDefault;
            if (optionsUpdate !== undefined) {
                useOptionUpdate = optionsUpdate;
            }
            //----------------------------
            // se asegura de crear nuevas instancias de los hijos que se agregaron como objetos, entonces aqui se crean y se guarda el id en el campo correspondiente
            // mas abajo hago toMongoInterface y eso descarta el objeto hijo y deja solo el id y con esos campos se llama a updateMeWithParams
            // no se hace en updateMeWithParams por que ese metodo es especifico a los campos que se pasan por parametro
            //----------------------------
            await this.getBack(instance.getStatic()).cascadeSaveChildRelations(instance, useOptionUpdate);
            //-----------------------
            let swAllFields = true;
            //-----------------------
            const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (!instance.hasOwnProperty(propertyKey)) {
                    swAllFields = false;
                    break;
                }
            }
            //-----------------------
            if (!swAllFields) {
                console_errorLv2(
                    0,
                    instance.className(),
                    `update - WARNING - not all fields exits on instance, possible overwrite with undefined. Use UpdateMeWithParams for specific fields`
                );
            }
            //-----------------------
            if (process.env.USE_DATABASE === 'mongo') {
                //-----------------------
                const mongoInterface = (await instance.getMongo().toMongoInterface(instance)) as any;
                //-----------------------
                await this.updateMeWithParams<T>(instance, mongoInterface, false);
                //-----------------------
                console_logLv2(-1, instance.className(), `update - Instance: ${instance.show()} - OK`);
                //----------------------------
            } else if (process.env.USE_DATABASE === 'postgresql') {
                //-----------------------
                const postgreSQLInterface = (await instance.getPostgreSQL().toPostgreSQLInterface(instance)) as any;
                //-----------------------
                await this.updateMeWithParams<T>(instance, postgreSQLInterface, false);
                //-----------------------
                console_logLv2(-1, instance.className(), `update - Instance: ${instance.show()} - OK`);
                //----------------------------
            } else {
                throw `Database not defined`;
            }
        } catch (error) {
            console_errorLv2(-1, instance.className(), `update - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async updateMeWithParams<T extends BaseEntity>(instance: T, updateFields: Record<string, any>, swRefreshInstance: boolean = true): Promise<void> {
        try {
            if (isNullOrBlank(instance._DB_id)) {
                throw `id not defined`;
            }
            //-----------------------
            if (isFrontEndEnvironment()) {
                //return await this.updateMeWithParamsApi<T>(updateFields, optionsUpdate);
                throw `Can't run this method in the Browser`;
            }
            //-----------------------
            console_logLv2(1, instance.className(), `updateMeWithParams - swRefreshInstance: ${swRefreshInstance} - Init`);
            //----------------------------
            //----------------------------
            console_logLv2(0, instance.className(), `updateMeWithParams - id: ${instance._DB_id}`);
            console_logLv2(0, instance.className(), `updateMeWithParams - updateFields: ${showData(Object.keys(updateFields))} |`);
            //----------------------------
            let updateSet: Record<string, any> = {};
            let updateUnSet: Record<string, any> = {};
            //----------------------------
            for (let key in updateFields) {
                if (key !== '_DB_id') {
                    if (updateFields[key as keyof typeof updateFields] === undefined) {
                        updateUnSet = { ...updateUnSet, [key]: '' };
                    } else {
                        updateSet = {
                            ...updateSet,
                            [key]: updateFields[key as keyof typeof updateFields],
                        };
                    }
                }
            }
            //----------------------------
            console_logLv2(0, instance.className(), `updateMeWithParams - set fields: ${showData(Object.keys(updateSet))} |`);
            console_logLv2(0, instance.className(), `updateMeWithParams - unset fields: ${showData(Object.keys(updateUnSet))} |`);
            //----------------------------
            // Merge instance with updateSet and updateUnSet to form a "final state"
            const mergedInstance = { ...instance, ...updateSet };
            // Remove unset fields from the mergedInstance
            Object.keys(updateUnSet).forEach((key) => {
                delete mergedInstance[key];
            });
            //----------------------------
            await this.checkDuplicate(instance.getStatic(), mergedInstance, instance._DB_id);
            //-------------------------
            await this.checkRequired(instance.getStatic(), mergedInstance);
            //----------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                //----------------------------
                const document = await MongoDatabaseService.update<T>(instance, updateSet, updateUnSet);
                //----------------------------
                if (document) {
                    //-----------------------
                    // voy a actualizar los campos manualmente en la instancia, asi no tengo que hacer un refresh
                    //-----------------------
                    if (swRefreshInstance) {
                        //-----------------------
                        const newInstance = (await instance.getMongo().fromMongoInterface(document)) as any;
                        //-----------------------
                        Object.entries(updateFields).forEach(([key, value]) => {
                            if (key in instance) {
                                instance[key as keyof typeof instance] = newInstance[key as keyof typeof newInstance];
                            }
                        });
                        //-----------------------
                    }
                    console_logLv2(-1, instance.className(), `updateMeWithParams - OK`);
                } else {
                    throw `Document not updated, maybe not found`;
                }
                //----------------------------
            } else if (process.env.USE_DATABASE === 'postgresql') {
                //----------------------------
                const result = await PostgreSQLDatabaseService.update<T>(instance, updateSet, updateUnSet);
                //----------------------------
                if (result.affected == 1) {
                    //-----------------------
                    // voy a actualizar los campos manualmente en la instancia, asi no tengo que hacer un refresh
                    //-----------------------
                    if (swRefreshInstance) {
                        //-----------------------
                        Object.entries(updateFields).forEach(([key, value]) => {
                            if (key in instance) {
                                instance[key as keyof typeof instance] = updateFields[key as keyof typeof updateFields];
                            }
                        });
                        //-----------------------
                    }
                    console_logLv2(-1, instance.className(), `updateMeWithParams - OK`);
                } else {
                    throw `Document not updated, maybe not found`;
                }
            } else {
                throw `Database not defined`;
            }
        } catch (error) {
            console_errorLv2(-1, instance.className(), `updateMeWithParams - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async updateWithParams<T extends BaseEntity>(Entity: typeof BaseEntity, id: string, updateFields: Record<string, any>): Promise<T> {
        //----------------------------
        try {
            if (isFrontEndEnvironment()) {
                //return await this.updateWithParamsApi<T>(id, updateFields, optionsUpdate);
                throw `Can't run this method in the Browser`;
            }
            //-----------------------
            console_logLv2(1, Entity.className(), `updateWithParams - Init`);
            //----------------------------
            // TODO: podria cargar solo los campos que se van a actualizar. por ahora cargo todo
            const instance = await this.getById<T>(Entity, id, { loadRelations: {} });
            if (!instance) {
                throw `${Entity.className()} - Not found for Update - id: ${id}`;
            }
            await this.updateMeWithParams<T>(instance, updateFields);
            //-----------------------
            console_logLv2(-1, instance.className(), `updateWithParams - OK`);
            //----------------------------
            return instance;
        } catch (error) {
            console_errorLv2(-1, Entity.className(), `updateWithParams - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async checkIfExists<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilterOrID: Record<string, any> | string): Promise<boolean> {
        //----------------------------
        try {
            //----------------------------
            if (isString(paramsFilterOrID) && isNullOrBlank(paramsFilterOrID)) {
                throw `id not defined`;
            }
            if (isObject(paramsFilterOrID) && isEmptyObject(paramsFilterOrID)) {
                throw `paramsFilter not defined`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                //return await this.checkIfExistsApi<T>(paramsFilter);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                const swExists = await MongoDatabaseService.checkIfExists<T>(Entity, paramsFilterOrID);
                return swExists;
            } else if (process.env.USE_DATABASE === 'postgresql') {
                const swExists = await PostgreSQLDatabaseService.checkIfExists<T>(Entity, paramsFilterOrID);
                return swExists;
            }
            {
                throw `Database not defined`;
            }
        } catch (error) {
            console_errorLv2(0, Entity.className(), `checkIfExists - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getById<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        id: string,
        optionsGet?: OptionsGetOne,
        restricFilter?: Record<string, any>
    ): Promise<T | undefined> {
        try {
            if (isNullOrBlank(id)) {
                throw `id not defined`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                //return await this.getByIdApi<T>(id, optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(1, Entity.className(), `getById - id: ${id} - Options: ${showData(optionsGet, false)} - Init`);
            //----------------------------
            const instance = await this.getOneByParams<T>(
                Entity,
                { _id: id },
                {
                    ...optionsGet,
                },
                restricFilter
            );
            //----------------------------
            // console_logLv2(0, Entity.className(), `getById - id: ${id} - ${instance?._DB_id}`);
            //----------------------------
            if (instance) {
                //----------------------------
                console_logLv2(-1, instance.className(), `getById - Instance: ${instance.show()} - OK`);
                //----------------------------
                return instance as T;
            } else {
                //----------------------------
                console_errorLv2(-1, Entity.className(), `getById - id: ${id} - Instance not found`);
                //----------------------------
                return undefined;
            }
            //----------------------------
        } catch (error) {
            console_errorLv2(-1, Entity.className(), `getById - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getOneByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter?: Record<string, any>,
        optionsGet?: OptionsGetOne,
        restricFilter?: Record<string, any>
    ): Promise<T | undefined> {
        try {
            if (isFrontEndEnvironment()) {
                //return await this.getOneByParamsApi<T>(paramsFilter, optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(1, Entity.className(), `getOneByParams - Options: ${showData(optionsGet)} - Init`);
            //----------------------------
            const instances = await this.getByParams<T>(
                Entity,
                paramsFilter,
                {
                    ...optionsGet,
                    limit: 1,
                },
                restricFilter
            );
            //----------------------------
            console_logLv2(-1, Entity.className(), `getOneByParams - OK`);
            //----------------------------
            if (instances.length > 0) {
                return instances[0];
            } else {
                return undefined;
            }
            //----------------------------
        } catch (error) {
            console_errorLv2(-1, Entity.className(), `getOneByParams - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter?: Record<string, any>,
        optionsGet?: OptionsGet,
        restricFilter?: Record<string, any>
    ): Promise<T[]> {
        //----------------------------
        try {
            if (isFrontEndEnvironment()) {
                //return await this.getByParamsApi<T>(paramsFilter, optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(1, Entity.className(), `getByParams - Options: ${showData(optionsGet, false)} - Init`);
            //----------------------------
            const isInclusionSelect = (fieldsForSelect: Record<string, boolean>): boolean | null => {
                const hasTrue = Object.values(fieldsForSelect).some((value) => value === true);
                const hasFalse = Object.values(fieldsForSelect).some((value) => value === false);
                // Si hay mezcla, retornamos null para indicar error
                if (hasTrue && hasFalse) {
                    return null;
                }
                return hasTrue; // true = inclusión, false = exclusión
            };
            const processFieldsForSelect = (
                allFields: string[],
                userFields: Record<string, boolean> | undefined,
                alwaysFields: Record<string, boolean>,
                defaultFieldsWhenUndefined: Record<string, boolean>
            ): Record<string, number> => {
                //----------------------------
                console_logLv2(0, Entity.className(), `getByParams - fieldsForSelect before always selects: ${showData(userFields, false)}`);
                //----------------------------
                if (userFields === undefined) {
                    // una opcion es setear en undefined, o mejor dicho, no agregar fieldsForSelect en optionsGet
                    // se usa a Entity.defaultFieldsWhenUndefined(),
                    // defaultFieldsWhenUndefined en la mayoria de las clases es {}, lo que significa todos.
                    // En algunas clases defaultFieldsWhenUndefined esta seteado en algunos campos, por que la clase tiene mucho y no quiero permitir ese tipo de carga
                    userFields = defaultFieldsWhenUndefined;
                }
                //----------------------------
                // Si no hay campos especificados, retornamos todos los campos
                if (isEmptyObject(userFields)) {
                    // si esta vacio, lo dejo asi, por que eso signifca que trae todos los campos y a veces quiero usarlo asi
                    // para eso el usuario lo deja en fieldsForSelect: {},
                    return Object.fromEntries(allFields.map((field) => [field, 1]));
                }
                //----------------------------
                const isInclusion = isInclusionSelect(userFields);
                if (isInclusion === null) {
                    throw `Invalid field selection: cannot mix inclusion and exclusion`;
                }
                //----------------------------
                // Campos que siempre deben incluirse
                const alwaysFieldsList = Object.entries(alwaysFields)
                    .filter(([_, value]) => value === true)
                    .map(([key]) => key);
                //----------------------------
                if (isInclusion) {
                    // Inclusión - traer campos marcados como true + always fields
                    const userSelectedFields = Object.entries(userFields)
                        .filter(([_, value]) => value === true)
                        .map(([key]) => key);
                    // Unimos los campos del usuario y los always fields, eliminando duplicados
                    const uniqueFields = [...new Set([...userSelectedFields, ...alwaysFieldsList])];
                    return Object.fromEntries(uniqueFields.map((field) => [field, 1]));
                } else {
                    // Exclusión - todos los campos menos los excluidos, pero asegurando always fields
                    const excludedFields = Object.entries(userFields)
                        .filter(([_, value]) => value === false)
                        .map(([key]) => key);

                    // Filtramos allFields quitando los excluidos, pero manteniendo always fields
                    const resultFields = allFields.filter((field) => !excludedFields.includes(field) || alwaysFieldsList.includes(field));
                    return Object.fromEntries(resultFields.map((field) => [field, 1]));
                }
            };
            //----------------------------
            let useOptionGet = optionsGet !== undefined ? optionsGet : optionsGetDefault;
            //----------------------------
            const allFields = Entity.getFields();
            const userFields = useOptionGet.fieldsForSelect;
            //----------------------------
            const alwaysFieldsForSelect: Record<string, boolean> = Entity.alwaysFieldsForSelect;
            const alwaysFieldsForCallbackOnAfterLoad: Record<string, boolean> = useOptionGet.doCallbackAfterLoad === true ? Entity.alwaysFieldsForCallbackOnAfterLoad : {};
            const alwaysFieldsForLoadRelations: Record<string, boolean> = {};
            if (useOptionGet.loadRelations !== undefined) {
                Object.keys(useOptionGet.loadRelations).forEach((key) => {
                    if (useOptionGet.loadRelations![key] === true) {
                        alwaysFieldsForLoadRelations[key] = true;
                    }
                });
            }
            const unifiedAlwaysFields = {
                ...alwaysFieldsForSelect,
                ...alwaysFieldsForCallbackOnAfterLoad,
                ...alwaysFieldsForLoadRelations,
            };
            //----------------------------
            const fieldsForSelect = processFieldsForSelect(allFields, userFields, unifiedAlwaysFields, Entity.defaultFieldsWhenUndefined);
            //----------------------------
            console_logLv2(0, Entity.className(), `getByParams - fieldsForSelect after always selects: ${showData(fieldsForSelect, false)}`);
            //----------------------------
            if (paramsFilter === undefined) {
                paramsFilter = {};
            } else {
                console_logLv2(0, Entity.className(), `getByParams - paramsFilter: ${showData(paramsFilter)}`);
            }
            //----------------------------
            if (restricFilter === undefined) {
                restricFilter = {};
            } else {
                console_logLv2(0, Entity.className(), `getByParams - restricFilter: ${showData(restricFilter)}`);
            }
            //----------------------------
            let filters;
            if (!isEmptyObject(paramsFilter) && !isEmptyObject(restricFilter)) {
                filters = { $and: [paramsFilter, restricFilter] };
            } else {
                filters = { ...paramsFilter, ...restricFilter };
            }
            //----------------------------
            if (useOptionGet.sort === undefined) {
                useOptionGet.sort = Entity.defaultSortForSelect;
            }
            //----------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                //----------------------------
                // console_log (`pre getByParams ${Entity.className()}`)
                const documents = await MongoDatabaseService.getByParams(Entity, filters, fieldsForSelect, useOptionGet);
                // console_log (`post getByParams ${Entity.className()}`)
                //----------------------------
                const instances: T[] = [];
                //----------------------------
                console_logLv2(
                    0,
                    Entity.className(),
                    `getByParams - Processing ${documents.length} document(s)... - show firts 5: ${documents
                        .slice(0, 5)
                        .map((item: any) => toJson({ _id: item._id, name: item.name ?? '' }))
                        .join(', ')}`
                );
                //----------------------------
                let index = 0;
                //----------------------------
                for (let doc of documents) {
                    //-----------------------
                    index++;
                    //-----------------------
                    if (documents.length > 1 && documents.length < 10) {
                        console_logLv2(1, Entity.className(), `getByParams - ${index}/${documents.length} - Processing document`);
                    }
                    //----------------------------
                    if (doc._doc !== undefined) {
                        // console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - DOCUMENT HAS _DOC`);
                        doc = doc._doc;
                    } else {
                        // console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - DOCUMENT HAS NO _DOC`);
                    }
                    //----------------------------
                    // console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - Document fields: ${showData(Object.keys(doc), false)}`);
                    // console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - Document fields len: ${Object.keys(doc).length}`);
                    //-----------------------
                    const instance = (await Entity.getMongo().fromMongoInterface(doc)) as T;
                    //-----------------------
                    if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
                        for (let lookUpField of useOptionGet.lookUpFields) {
                            const EntityClass =
                                RegistryManager.getFromSmartDBEntitiesRegistry(lookUpField.from) !== undefined
                                    ? RegistryManager.getFromSmartDBEntitiesRegistry(lookUpField.from)
                                    : RegistryManager.getFromEntitiesRegistry(lookUpField.from);
                            if (EntityClass !== undefined) {
                                console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - LookUpField: ${lookUpField.from} - Loading...`);
                                const instance_ = await EntityClass.getMongo().fromMongoInterface(doc[lookUpField.as]);
                                if (instance_ !== undefined) {
                                    instance[lookUpField.as as keyof typeof instance] = instance_;
                                }
                            }
                        }
                    }
                    //-----------------------
                    await this.getBack(instance.getStatic()).cascadeLoadRelations(instance, useOptionGet);
                    //-----------------------
                    let cascadeUpdate: CascadeUpdate = { swUpdate: false };
                    //-----------------------
                    if (useOptionGet.doCallbackAfterLoad === true) {
                        const cascadeUpdateCallBackAfterLoad: CascadeUpdate = await this.getBack(instance.getStatic()).callbackOnAfterLoad(instance, cascadeUpdate);
                        if (cascadeUpdateCallBackAfterLoad.swUpdate) {
                            console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - updating because some callbackOnAfterLoad...`);
                            cascadeUpdate = cascadeUpdateCallBackAfterLoad;
                        }
                    }
                    //-----------------------
                    if (useOptionGet.checkRelations === true) {
                        const cascadeUpdateCheckAllRelationsExists = await this.checkIfAllRelationsExists(instance);
                        if (cascadeUpdateCheckAllRelationsExists.swUpdate) {
                            console_logLv2(0, Entity.className(), `getByParams -${index}/${documents.length} - updating because checkIfAllRelationsExists...`);
                            cascadeUpdate = {
                                swUpdate: true,
                                updatedFields: {
                                    ...cascadeUpdate.updatedFields,
                                    ...cascadeUpdateCheckAllRelationsExists.updatedFields,
                                },
                            };
                        }
                    }
                    //-----------------------
                    if (cascadeUpdate.swUpdate === true && cascadeUpdate.updatedFields !== undefined) {
                        //-----------------------
                        const updatedFields = Object.entries(cascadeUpdate.updatedFields).reduce((acc, [key, value]) => {
                            acc[key] = value.to; // Assign the 'to' value to the field
                            return acc;
                        }, {} as Record<string, any>); // Add index signature to allow indexing with a string
                        //-----------------------
                        console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - updating because cascadeUpdate...`);
                        //-----------------------
                        await this.updateMeWithParams<T>(instance, updatedFields, false);
                        //-----------------------
                    }
                    //-----------------------
                    instances.push(instance);
                    //-----------------------
                    if (documents.length > 1 && documents.length < 10) {
                        console_logLv2(-1, instance.className(), `getByParams - ${index}/${documents.length} - Iterating document - OK`);
                    }
                    //----------------------------
                }
                //-----------------------
                console_logLv2(
                    -1,
                    Entity.className(),
                    `getByParams - len: ${instances.length} - show firts 5: ${instances
                        .slice(0, 5)
                        .map((item: T) => item.show())
                        .join(', ')} - OK`
                );
                //-----------------------
                return instances as T[];
            }
            if (process.env.USE_DATABASE === 'postgresql') {
                //----------------------------
                // console_log (`pre getByParams ${Entity.className()}`)
                const documents = await PostgreSQLDatabaseService.getByParams(Entity, filters, fieldsForSelect, useOptionGet);
                // console_logLv2(0, Entity.className(),  `post getByParams ${toJson(documents)}`)
                //----------------------------
                const instances: T[] = [];
                //----------------------------
                console_logLv2(
                    0,
                    Entity.className(),
                    `getByParams - Processing ${documents.length} document(s)... - show firts 5: ${documents
                        .slice(0, 5)
                        .map((item: any) => toJson({ _id: item._id, name: item.name ?? '' }))
                        .join(', ')}`
                );
                //----------------------------
                let index = 0;
                //----------------------------
                for (let doc of documents) {
                    //-----------------------
                    index++;
                    //-----------------------
                    if (documents.length > 1 && documents.length < 10) {
                        console_logLv2(1, Entity.className(), `getByParams - ${index}/${documents.length} - Processing document`);
                    }
                    //----------------------------
                    // console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - Document fields: ${showData(Object.keys(doc), false)}`);
                    // console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - Document fields len: ${Object.keys(doc).length}`);
                    //-----------------------
                    const instance = (await Entity.getPostgreSQL().fromPostgreSQLInterface(doc)) as T;
                    // console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - instance: ${showData(instance, false)}`);
                    //-----------------------
                    // if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
                    //     for (let lookUpField of useOptionGet.lookUpFields) {
                    //         const EntityClass =
                    //             RegistryManager.getFromSmartDBEntitiesRegistry(lookUpField.from) !== undefined
                    //                 ? RegistryManager.getFromSmartDBEntitiesRegistry(lookUpField.from)
                    //                 : RegistryManager.getFromEntitiesRegistry(lookUpField.from);
                    //         if (EntityClass !== undefined) {
                    //             console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - LookUpField: ${lookUpField.from} - Loading...`);
                    //             const instance_ = await EntityClass.getPostgreSQL().fromPostgreSQLInterface(doc[lookUpField.as]);
                    //             if (instance_ !== undefined) {
                    //                 instance[lookUpField.as as keyof typeof instance] = instance_;
                    //             }
                    //         }
                    //     }
                    // }
                    //-----------------------
                    await this.getBack(instance.getStatic()).cascadeLoadRelations(instance, useOptionGet);
                    //-----------------------
                    let cascadeUpdate: CascadeUpdate = { swUpdate: false };
                    //-----------------------
                    if (useOptionGet.doCallbackAfterLoad === true) {
                        const cascadeUpdateCallBackAfterLoad: CascadeUpdate = await this.getBack(instance.getStatic()).callbackOnAfterLoad(instance, cascadeUpdate);
                        if (cascadeUpdateCallBackAfterLoad.swUpdate) {
                            console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - updating because some callbackOnAfterLoad...`);
                            cascadeUpdate = cascadeUpdateCallBackAfterLoad;
                        }
                    }
                    //-----------------------
                    if (useOptionGet.checkRelations === true) {
                        const cascadeUpdateCheckAllRelationsExists = await this.checkIfAllRelationsExists(instance);
                        if (cascadeUpdateCheckAllRelationsExists.swUpdate) {
                            console_logLv2(0, Entity.className(), `getByParams -${index}/${documents.length} - updating because checkIfAllRelationsExists...`);
                            cascadeUpdate = {
                                swUpdate: true,
                                updatedFields: {
                                    ...cascadeUpdate.updatedFields,
                                    ...cascadeUpdateCheckAllRelationsExists.updatedFields,
                                },
                            };
                        }
                    }
                    //-----------------------
                    if (cascadeUpdate.swUpdate === true && cascadeUpdate.updatedFields !== undefined) {
                        //-----------------------
                        const updatedFields = Object.entries(cascadeUpdate.updatedFields).reduce((acc, [key, value]) => {
                            acc[key] = value.to; // Assign the 'to' value to the field
                            return acc;
                        }, {} as Record<string, any>); // Add index signature to allow indexing with a string
                        //-----------------------
                        console_logLv2(0, Entity.className(), `getByParams - ${index}/${documents.length} - updating because cascadeUpdate...`);
                        //-----------------------
                        await this.updateMeWithParams<T>(instance, updatedFields, false);
                        //-----------------------
                    }
                    //-----------------------
                    instances.push(instance);
                    //-----------------------
                    if (documents.length > 1 && documents.length < 10) {
                        console_logLv2(-1, instance.className(), `getByParams - ${index}/${documents.length} - Iterating document - OK`);
                    }
                    //----------------------------
                }
                //-----------------------
                console_logLv2(
                    -1,
                    Entity.className(),
                    `getByParams - len: ${instances.length} - show firts 5: ${instances
                        .slice(0, 5)
                        .map((item: T) => item.show())
                        .join(', ')} - OK`
                );
                //-----------------------
                return instances as T[];
            } else {
                throw 'Database not defined';
            }
        } catch (error) {
            console_errorLv2(-1, Entity.className(), `getByParams - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getAll<T extends BaseEntity>(Entity: typeof BaseEntity, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        try {
            if (isFrontEndEnvironment()) {
                //return await this.getAllApi<T>(optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(0, Entity.className(), `getAll - Options: ${showData(optionsGet)} - Init`);
            //----------------------------
            return await this.getByParams<T>(Entity, undefined, optionsGet, restricFilter);
        } catch (error) {
            console_errorLv2(0, Entity.className(), `getAll - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getCount<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter?: Record<string, any>, restricFilter?: Record<string, any>): Promise<number> {
        try {
            if (isFrontEndEnvironment()) {
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(1, Entity.className(), `getCount - Init`);
            //----------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                //----------------------------
                if (paramsFilter === undefined) {
                    paramsFilter = {};
                } else {
                    console_logLv2(0, Entity.className(), `getCount - paramsFilter: ${showData(paramsFilter)}`);
                }
                //----------------------------
                if (restricFilter === undefined) {
                    restricFilter = {};
                } else {
                    console_logLv2(0, Entity.className(), `getCount - restricFilter: ${showData(restricFilter)}`);
                }
                //----------------------------
                let filters;
                if (!isEmptyObject(paramsFilter) && !isEmptyObject(restricFilter)) {
                    filters = { $and: [paramsFilter, restricFilter] };
                } else {
                    filters = { ...paramsFilter, ...restricFilter };
                }
                //----------------------------
                const count = await MongoDatabaseService.getCount(Entity, filters);
                //-----------------------
                console_logLv2(-1, Entity.className(), `getCount: ${count} - OK`);
                //-----------------------
                return count;
            } else if (process.env.USE_DATABASE === 'postgresql') {
                //----------------------------
                if (paramsFilter === undefined) {
                    paramsFilter = {};
                } else {
                    console_logLv2(0, Entity.className(), `getCount - paramsFilter: ${showData(paramsFilter)}`);
                }
                //----------------------------
                if (restricFilter === undefined) {
                    restricFilter = {};
                } else {
                    console_logLv2(0, Entity.className(), `getCount - restricFilter: ${showData(restricFilter)}`);
                }
                //----------------------------
                let filters;
                if (!isEmptyObject(paramsFilter) && !isEmptyObject(restricFilter)) {
                    filters = { $and: [paramsFilter, restricFilter] };
                } else {
                    filters = { ...paramsFilter, ...restricFilter };
                }
                //----------------------------
                const count = await PostgreSQLDatabaseService.getCount(Entity, filters);
                //-----------------------
                console_logLv2(-1, Entity.className(), `getCount: ${count} - OK`);
                //-----------------------
                return count;
            }
            {
                throw 'Database not defined';
            }
        } catch (error) {
            console_errorLv2(-1, Entity.className(), `getCount - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async aggregate<T extends BaseEntity>(Entity: typeof BaseEntity, pipeline: Record<string, any>[], isResultSameEntity: boolean = true): Promise<any[]> {
        try {
            if (isFrontEndEnvironment()) {
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(0, Entity.className(), `aggregate - Init`);
            //----------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                //----------------------------
                console_logLv2(0, Entity.className(), `aggregate - pipeline: ${showData(toJson(pipeline), false)} - OK`);
                //----------------------------
                const documents = await MongoDatabaseService.aggregate(Entity, pipeline);
                // console_log (`post getByParams ${Entity.className()}`)
                //----------------------------
                const instances: any[] = [];
                //-----------------------
                for (const doc of documents) {
                    //-----------------------
                    let instance = doc;
                    //-----------------------
                    if (isResultSameEntity) {
                        instance = (await Entity.getMongo().fromMongoInterface(doc)) as any;
                    }
                    //-----------------------
                    instances.push(instance);
                    //-----------------------
                }
                console_logLv2(0, Entity.className(), `aggregate len: ${instances.length} - OK`);
                //-----------------------
                return instances as any[];
            } else {
                throw 'Database not defined';
            }
        } catch (error) {
            console_errorLv2(0, Entity.className(), `aggregate - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async deleteById<T extends BaseEntity>(Entity: typeof BaseEntity, id: string, optionsDelete?: OptionsDelete): Promise<boolean> {
        //----------------------------
        try {
            //----------------------------
            if (isFrontEndEnvironment()) {
                //return await this.deleteByIdApi(id, optionsDelete);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(0, Entity.className(), `deleteById - Options: ${showData(optionsDelete)} - Init`);
            //----------------------------
            const instance = await this.getById<T>(Entity, id, { loadRelations: {} });
            if (!instance) {
                throw `id: ${id} - Instance not found`;
            }
            return await this.delete<T>(instance, optionsDelete);
        } catch (error) {
            console_errorLv2(0, Entity.className(), `deleteById - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async deleteByParams<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter?: Record<string, any>, optionsDelete?: OptionsDelete): Promise<boolean> {
        try {
            //----------------------------
            if (isFrontEndEnvironment()) {
                //return await this.deleteByIdApi(id, optionsDelete);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(1, Entity.className(), `deleteByParams: ${showData(paramsFilter)} - Options: ${showData(optionsDelete)} - Init`);
            //----------------------------
            let useOptionDelete = optionsDeleteDefault;
            if (optionsDelete !== undefined) {
                useOptionDelete = optionsDelete;
            }
            //----------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                //----------------------------
                if (paramsFilter === undefined) {
                    paramsFilter = {};
                } else {
                    console_logLv2(0, Entity.className(), `deleteByParams - paramsFilter: ${showData(paramsFilter)}`);
                }
                //----------------------------
                const deletedCount = await MongoDatabaseService.deleteByParams<T>(Entity, paramsFilter);
                if (deletedCount === undefined) {
                    console_errorLv2(-1, Entity.className(), `deleteByParams - Error`);
                    return false;
                }
                //----------------------------
                // TODO: ver useOptionDelete.deleteRelation y tambien agregar cascadeDelete en conversions
                //----------------------------
                console_logLv2(-1, Entity.className(), `deleteByParams - deletedCount: ${deletedCount} - OK`);
                //----------------------------
                return true;
            } else if (process.env.USE_DATABASE === 'postgresql') {
                //----------------------------
                if (paramsFilter === undefined) {
                    paramsFilter = {};
                } else {
                    console_logLv2(0, Entity.className(), `deleteByParams - paramsFilter: ${showData(paramsFilter)}`);
                }
                //----------------------------
                const deletedCount = await PostgreSQLDatabaseService.deleteByParams<T>(Entity, paramsFilter);
                if (deletedCount === undefined) {
                    console_errorLv2(-1, Entity.className(), `deleteByParams - Error`);
                    return false;
                }
                //----------------------------
                // TODO: ver useOptionDelete.deleteRelation y tambien agregar cascadeDelete en conversions
                //----------------------------
                console_logLv2(-1, Entity.className(), `deleteByParams - deletedCount: ${deletedCount} - OK`);
                //----------------------------
                return true;
            }
            {
                throw `Database not defined`;
            }
        } catch (error) {
            console_errorLv2(0, Entity.className(), `deleteByParams - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async delete<T extends BaseEntity>(instance: T, optionsDelete?: OptionsDelete): Promise<boolean> {
        try {
            //----------------------------
            if (isNullOrBlank(instance._DB_id)) {
                throw `id not defined`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                //return await this.deleteApi(optionsDelete);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv2(1, instance.className(), `delete - id: ${instance._DB_id} - Options: ${showData(optionsDelete)} - Init`);
            //----------------------------
            let useOptionDelete = optionsDeleteDefault;
            if (optionsDelete !== undefined) {
                useOptionDelete = optionsDelete;
            }
            //----------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                const document = await MongoDatabaseService.delete<T>(instance);
                if (!document) {
                    console_errorLv2(-1, instance.className(), `delete - id: ${instance._DB_id} - Error`);
                    return false;
                }
                //----------------------------
                // TODO: ver useOptionDelete.deleteRelation y tambien agregar cascadeDelete en conversions
                // a partir de eso revisar las relaciones y eliminar aquellas atomaticamente
                //----------------------------
                await this.getBack(instance.getStatic()).cascadeDeleteRelations(instance, useOptionDelete.deleteRelations);
                //----------------------------
                console_logLv2(-1, instance.className(), `delete - OK`);
                //----------------------------
                return true;
            } else if (process.env.USE_DATABASE === 'postgresql') {
                const document = await PostgreSQLDatabaseService.delete<T>(instance);
                if (!document) {
                    console_errorLv2(-1, instance.className(), `delete - id: ${instance._DB_id} - Error`);
                    return false;
                }
                //----------------------------
                // TODO: ver useOptionDelete.deleteRelation y tambien agregar cascadeDelete en conversions
                // a partir de eso revisar las relaciones y eliminar aquellas atomaticamente
                //----------------------------
                await this.getBack(instance.getStatic()).cascadeDeleteRelations(instance, useOptionDelete.deleteRelations);
                //----------------------------
                console_logLv2(-1, instance.className(), `delete - OK`);
                //----------------------------
                return true;
            }
            {
                throw `Database not defined`;
            }
        } catch (error) {
            console_errorLv2(-1, instance.className(), `delete - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async fillWithRelation<T extends BaseEntity, R extends BaseEntity>(
        instance: T,
        relation: string,
        optionsGet?: OptionsGet,
        restricFilter?: Record<string, any>
    ): Promise<void> {
        try {
            if (isNullOrBlank(relation)) {
                throw `relation not defined`;
            }
            //--------------------------------------
            if (isFrontEndEnvironment()) {
                //return await this.fillWithRelationApi<T, R>(relation, optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //-----------------------
            console_logLv2(1, instance.className(), `fillWithRelation - relation: ${relation} - Options: ${showData(optionsGet)} - Init`);
            //----------------------------
            const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
            if (conversionFunctions === undefined) {
                throw `conversionFunctions not found`;
            }
            //--------------------------------------
            const conversions = conversionFunctions.get(relation);
            if (conversions === undefined || conversions.relation === undefined) {
                throw `${relation} relation not found`;
            }
            //--------------------------------------
            if (conversions.isArray === true) {
                // OneToMany es una relacion un registro de esta tabla se relaciona con muchos registros de otra tabla
                // OneToMany es array
                const values: R[] = await this.loadRelationMany<T, R>(instance, relation, optionsGet, restricFilter);
                //--------------------------------------
                if (instance[conversions.propertyToFill! as keyof typeof instance] !== values) {
                    instance[relation as keyof typeof instance] = values.map((item) => item._DB_id) as any;
                    instance[conversions.propertyToFill! as keyof typeof instance] = values as any;
                }
                //--------------------------------------
            } else {
                // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
                // ManyToOne es una relacion de muchos registros de esta tabla con un registro de otra tabla
                //--------------------------------------
                const value: R | undefined = await this.loadRelationOne<T, R>(instance, relation, optionsGet, restricFilter);
                //--------------------------------------
                if (value !== undefined && instance[conversions.propertyToFill! as keyof typeof instance] !== value) {
                    instance[relation as keyof typeof instance] = value._DB_id as any;
                    instance[conversions.propertyToFill! as keyof typeof instance] = value as any;
                }
                //--------------------------------------
            }
            //-----------------------
            console_logLv2(-1, instance.className(), `fillWithRelation - OK`);
            //----------------------------
        } catch (error) {
            console_errorLv2(-1, instance.className(), `fillWithRelation - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async loadRelationMany<T extends BaseEntity, R extends BaseEntity>(
        instance: T,
        relation: string,
        optionsGet?: OptionsGet,
        restricFilter?: Record<string, any>
    ): Promise<R[]> {
        try {
            //--------------------------------------
            if (isNullOrBlank(relation)) {
                throw `propertyKey not defined`;
            }
            //--------------------------------------
            if (isFrontEndEnvironment()) {
                //return await this.loadRelationManyApi<T, R>(relation, optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //-----------------------
            console_logLv2(1, instance.className(), `loadRelationMany - relation: ${relation} - Options: ${showData(optionsGet)} - Init`);
            //----------------------------
            const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
            if (conversionFunctions === undefined) {
                throw `conversionFunctions not found`;
            }
            //--------------------------------------
            const conversions = conversionFunctions.get(relation);
            if (conversions === undefined || conversions.relation === undefined) {
                throw `${relation} relation not found`;
            }
            //--------------------------------------
            if (optionsGet === undefined) {
                optionsGet = conversions.optionsGet;
            }
            //--------------------------------------
            const RelatedClassType = conversions.typeRelation;
            if (!this.isBaseEntityClass(RelatedClassType)) {
                throw `${instance.className()} - ${relation}: Must be related with SmartDB Class`;
            }
            //--------------------------------------
            if (conversions.isArray === true) {
                // OneToMany es una relacion un registro de esta tabla se relaciona con muchos registros de otra tabla
                // OneToMany es array
                //--------------------------------------
                const array_ids = [];
                const array_objects: R[] = [];
                //--------------------------------------
                let value_ids: any = undefined;
                if (instance.hasOwnProperty(relation)) {
                    value_ids = instance[relation as keyof typeof instance];
                }
                //--------------------------------------
                if (value_ids) {
                    if (Array.isArray(value_ids) === false) {
                        throw `${instance.className()} - ${relation}: OneToMany value must be an Array`;
                    }
                    //--------------------------------------
                    console_logLv2(0, instance.className(), `loadRelationMany - value_ids len: ${value_ids.length}`);
                    //--------------------------------------
                    for (
                        let i = optionsGet?.skip !== undefined ? optionsGet.skip : 0;
                        i < value_ids.length && (optionsGet?.limit === undefined || i < optionsGet.limit + (optionsGet?.skip !== undefined ? optionsGet.skip : 0));
                        i++
                    ) {
                        //--------------------------------------
                        const optionsGetOne: OptionsGetOne = {
                            sort: optionsGet?.sort,
                            fieldsForSelect: optionsGet?.fieldsForSelect,
                            doCallbackAfterLoad: optionsGet?.doCallbackAfterLoad,
                            loadRelations: optionsGet?.loadRelations,
                            optionsGetForRelation: optionsGet?.optionsGetForRelation,
                            checkRelations: optionsGet?.checkRelations,
                        };
                        //--------------------------------------
                        // let value_id = await this.checkRelationID(value_ids[i], RelatedClassType, relation, conversions);
                        let value_id = value_ids[i];
                        //--------------------------------------
                        array_ids.push(value_id);
                        //--------------------------------------
                        if (value_id !== undefined) {
                            const value_object: R | undefined = await this.checkRelationAndLoadIt<T, R>(
                                instance,
                                RelatedClassType,
                                value_id,
                                relation,
                                conversions,
                                optionsGetOne,
                                restricFilter
                            );
                            if (value_object !== undefined) {
                                array_objects.push(value_object);
                            }
                        }
                    }
                }
                //-----------------------
                console_logLv2(-1, instance.className(), `loadRelationMany - relation: ${relation} - OK`);
                //----------------------------
                return array_objects;
                //--------------------------------------
            } else {
                // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
                // ManyToOne es una relacion de muchos registros de esta tabla con un registro de otra tabla
                //--------------------------------------
                throw `${relation} is single. Use loadRelationOne`;
            }
        } catch (error) {
            console_errorLv2(-1, instance.className(), `loadRelationMany - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async loadRelationOne<T extends BaseEntity, R extends BaseEntity>(
        instance: T,
        relation: string,
        optionsGet?: OptionsGet,
        restricFilter?: Record<string, any>
    ): Promise<R | undefined> {
        try {
            //--------------------------------------
            if (isNullOrBlank(relation)) {
                throw `propertyKey not defined`;
            }
            //--------------------------------------
            if (isFrontEndEnvironment()) {
                //return await this.loadRelationOneApi<T, R>(relation, optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //-----------------------
            console_logLv2(1, instance.className(), `loadRelationOne - relation: ${relation} - Options: ${showData(optionsGet)} - Init`);
            //----------------------------
            const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
            if (conversionFunctions === undefined) {
                throw `conversionFunctions not found`;
            }
            //--------------------------------------
            const conversions = conversionFunctions.get(relation);
            if (conversions === undefined || conversions.relation === undefined) {
                throw `${relation} relation not found`;
            }
            //--------------------------------------
            if (optionsGet === undefined) {
                optionsGet = conversions.optionsGet;
            }
            //--------------------------------------
            const RelatedClassType = conversions.typeRelation;
            if (!this.isBaseEntityClass(RelatedClassType)) {
                throw `${instance.className()} - ${relation}: Must be related with SmartDB Class`;
            }
            //--------------------------------------
            if (conversions.isArray === true) {
                // OneToMany es una relacion un registro de esta tabla se relaciona con muchos registros de otra tabla
                // OneToMany es array
                //--------------------------------------
                throw `${relation} is single. Use loadRelationMany`;
                //--------------------------------------
            } else {
                // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
                // ManyToOne es una relacion de muchos registros de esta tabla con un registro de otra tabla
                //--------------------------------------
                let value_id: any = undefined;
                if (instance.hasOwnProperty(relation)) {
                    value_id = instance[relation as keyof typeof instance];
                }
                //--------------------------------------
                // value_id = await this.checkRelationID(value_id, RelatedClassType, relation, conversions);
                //--------------------------------------
                let value_object: R | undefined;
                if (value_id !== undefined) {
                    value_object = await this.checkRelationAndLoadIt<T, R>(instance, RelatedClassType, value_id, relation, conversions, optionsGet, restricFilter);
                }
                //-----------------------
                console_logLv2(-1, instance.className(), `loadRelationOne - relation: ${relation} - OK`);
                //----------------------------
                return value_object;
                //--------------------------------------
            }
        } catch (error) {
            console_errorLv2(-1, instance.className(), `loadRelationOne - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion class methods
}
