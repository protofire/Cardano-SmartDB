import 'reflect-metadata';
// import { Types } from 'mongoose';
import { Convertible, getCombinedConversionFunctions } from '../../Commons/Decorators/Decorator.Convertible.js';
import { deserealizeBigInt } from '../../Commons/conversions.js';
import { BaseConstructor } from './Base.Constructor.js';
import { isEmptyObject, toJson, showData, RegistryManager, ConversionFunctions } from '../../Commons/index.js';
// import { IBackendMethods } from '../../Commons/Interfaces.js';
// import { BackEndMethodsRegistry } from '../../Commons/Decorator.BackEndRegistry.js';

export interface IEntityMongo {
    MongoModel(): any;
    toMongoInterface<T extends BaseEntity>(instance: T, cascadeSave?: boolean): Promise<any>;
    fromMongoInterface<T extends BaseEntity>(dataInterface: any): Promise<T>;
}

// export interface IBackendMethods {
//     checkIfExists_<T extends BaseEntity>(paramsFilter: Record<string, any> | string): Promise<boolean>;
//     checkIfExists<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any> | string): Promise<boolean>;

//     create<T extends BaseEntity>(instance: T, optionsCreate?: OptionsCreateOrUpdate): Promise<T>;

//     refresh<T extends BaseEntity>(instance: T, optionsGet?: OptionsGet): Promise<void>;

//     update<T extends BaseEntity>(instance: T, optionsUpdate?: OptionsCreateOrUpdate): Promise<void>;
//     updateMeWithParams<T extends BaseEntity>(instance: T, updateFields?: Record<string, any>, optionsUpdate?: OptionsCreateOrUpdate): Promise<void>;

//     updateWithParams_<T extends BaseEntity>(id: string, updateFields?: Record<string, any>, optionsUpdate?: OptionsCreateOrUpdate): Promise<T>;
//     updateWithParams<T extends BaseEntity>(Entity: typeof BaseEntity, id: string, updateFields?: Record<string, any>, optionsUpdate?: OptionsCreateOrUpdate): Promise<T>;

//     getById_<T extends BaseEntity>(id: string, optionsGet?: OptionsGetOne, restricFilter?: Record<string, any>): Promise<T | undefined>;
//     getById<T extends BaseEntity>(Entity: typeof BaseEntity, id: string, optionsGet?: OptionsGetOne, restricFilter?: Record<string, any>): Promise<T | undefined>;
//     getOneByParams_<T extends BaseEntity>(paramsFilter?: Record<string, any>, optionsGet?: OptionsGetOne, restricFilter?: Record<string, any>): Promise<T | undefined>;
//     getOneByParams<T extends BaseEntity>(
//         Entity: typeof BaseEntity,
//         paramsFilter?: Record<string, any>,
//         optionsGet?: OptionsGetOne,
//         restricFilter?: Record<string, any>
//     ): Promise<T | undefined>;

//     getByParams_<T extends BaseEntity>(paramsFilter?: Record<string, any>, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]>;

//     getByParams<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter?: Record<string, any>, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]>;

//     getAll_<T extends BaseEntity>(optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]>;
//     getAll<T extends BaseEntity>(Entity: typeof BaseEntity, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]>;

//     deleteById_<T extends BaseEntity>(id: string, optionsDelete?: OptionsDelete): Promise<boolean>;
//     deleteById<T extends BaseEntity>(Entity: typeof BaseEntity, id: string, optionsDelete?: OptionsDelete): Promise<boolean>;
//     delete<T extends BaseEntity>(instance: T, optionsDelete?: OptionsDelete): Promise<boolean>;

//     fillWithRelation<T extends BaseEntity, R extends BaseEntity>(instance: T, relation: string, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<void>;
//     loadRelationMany<T extends BaseEntity, R extends BaseEntity>(instance: T, relation: string, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<R[]>;
//     loadRelationOne<T extends BaseEntity, R extends BaseEntity>(
//         instance: T,
//         relation: string,
//         optionsGet?: OptionsGet,
//         restricFilter?: Record<string, any>
//     ): Promise<R | undefined>;
// }

export class BaseEntity extends BaseConstructor {
    protected static _className: string = 'Base';
    protected static _apiRoute: string = 'Must implement Class';
    // protected static _mongoTableName: string = this._className;
    //protected static _BackEndMethods: IBackendMethods | undefined = undefined;

    // #region fields

    @Convertible({ interfaceName: '_id', isDB_id: true })
    _DB_id: string;

    // #endregion fields

    // #region internal class methods

    public static getMongo(): IEntityMongo {
        const result = RegistryManager.getFromMongoAppliedRegistry(this);
        if (!result) {
            throw `Mongo Methods Applied for ${this} not found in registry.`;
        } else {
            // console.error (`----- get Mongo for ${this.className()} found`)
            // console.error (`${result} ----`)
        }
        return result;
    }

    public getMongo(): IEntityMongo {
        return this.getStatic().getMongo();
    }

    // #endregion internal class methods

    // #region db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        _id: true,
    };

    public static alwaysFieldsForCallbackOnAfterLoad: Record<string, boolean> = {};

    public static defaultSortForSelect: Record<string, number> = {};

    // #endregion db

    // #region internal class methods

    public getStatic(): typeof BaseEntity {
        return this.constructor as typeof BaseEntity;
    }

    public static getStatic(): typeof BaseEntity {
        return this as typeof BaseEntity;
    }

    public className(): string {
        return this.getStatic()._className;
    }

    public static className(): string {
        return this._className;
    }

    public apiRoute(): string {
        return this.getStatic()._apiRoute;
    }

    public static apiRoute(): string {
        return this._apiRoute;
    }

    constructor(properties?: Partial<any>) {
        super(properties);
        this._DB_id = properties?._DB_id ?? undefined;
    }

    // #endregion internal class methods

    // #region class methods

    public show(): string {
        const object: any = {};
        if (this.hasOwnProperty('_DB_id') && (this as any)['_DB_id'] !== undefined) {
            object._DB_id = (this as any)['_DB_id'];
        }
        if (this.hasOwnProperty('name') && (this as any)['name'] !== undefined) {
            object.name = (this as any)['name'];
        }
        if (isEmptyObject(object)) {
            return toJson(Object.entries(this));
        }
        return toJson(object);
    }

    public static filterByID<T extends BaseEntity>(id: string, list: T[]): T | undefined {
        const instance = list.filter((i) => i._DB_id == id);
        if (instance.length > 0) {
            return instance[0];
        } else {
            return undefined;
        }
    }

    public fillMeFromObject<T extends BaseEntity>(object: any) {
        console.log(`[${this.className()}] - fillMeFromObject - object: ${showData(object)}`);
        Object.assign(this, object);
        return;
    }

    // #endregion class methods

    // #region conversions methods

    public toJsonString<T extends BaseEntity>() {
        return toJson(this);
    }

    public static fromJsonString<T extends BaseEntity>(json: string): T {
        const data = JSON.parse(json);
        return this.fromPlainObject<T>(data);
    }

    public toPlainObject<T extends BaseEntity>(): object {
        const conversionFunctions = getCombinedConversionFunctions(this.getStatic());
        const plainObject: object = {};
        if (conversionFunctions) {
            const processValue = (propertyKey: string, conversions: ConversionFunctions<any>, value: any) => {
                try {
                    let type = conversions.type as any;
                    if (value?.toPlainObject) {
                        value = value.toPlainObject();
                    } else if (conversions.toPlainObject) {
                        value = conversions.toPlainObject.call(this, value);
                    } else if (type.toPlainObject) {
                        value = type.toPlainObject(value);
                        // } else if (conversions.type === BigInt) {
                        //     value = serializeBigInt(value)
                    } else if (value?.toJsonString) {
                        value = JSON.parse(value.toJsonString());
                    } else if (value !== undefined && conversions.type !== Number && conversions.type !== String && conversions.type !== Boolean) {
                        value = JSON.parse(toJson(value));
                    }
                    return value;
                } catch (error) {
                    throw `${this.className()} - ${propertyKey}: ${error}`;
                }
            };
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.relation !== undefined) {
                    let value: any = undefined;
                    let swProcessValue = false;
                    if (this.hasOwnProperty(propertyKey) || conversions.toPlainObject || (this as any)[conversions.propertyToFill!]) {
                        value = (this as any)[propertyKey];
                        swProcessValue = true;
                    }
                    if (swProcessValue) {
                        // es un tipo de campo con id y objeto en relacion
                        // quiero quedarme con el id y convertir a objeto el value
                        // si es array, OneToMany, quiero convertir todos los elementos en objetos
                        if (conversions.isArray === true) {
                            let array_ids: string[] = [];
                            const value_ids = value;
                            if (value_ids) {
                                if (Array.isArray(value_ids) === false) {
                                    throw `${this.className()} - ${propertyKey}: OneToMany value must be an Array`;
                                }
                                for (let i = 0; i < value_ids.length; i++) {
                                    const item = value_ids[i];
                                    array_ids.push(item);
                                }
                            }
                            (plainObject as any)[propertyKey] = array_ids;
                            if (conversions.propertyToFill && this.hasOwnProperty(conversions.propertyToFill)) {
                                const relatedClassType = conversions.typeRelation as any;
                                let array_objects: string[] = [];
                                const value_objects = (this as any)[conversions.propertyToFill];
                                if (value_objects) {
                                    if (Array.isArray(value_objects) === false) {
                                        throw `${this.className()} - ${propertyKey}: OneToMany value must be an Array`;
                                    }
                                    for (let i = 0; i < value_objects.length; i++) {
                                        const item = processValue(propertyKey, { ...conversions, type: relatedClassType }, value_objects[i]);
                                        array_objects.push(item);
                                    }
                                }
                                (plainObject as any)[conversions.propertyToFill] = array_objects;
                            }
                        } else {
                            const value_id: string = value;
                            (plainObject as any)[propertyKey] = value_id;
                            if (conversions.propertyToFill && this.hasOwnProperty(conversions.propertyToFill)) {
                                const relatedClassType = conversions.typeRelation as any;
                                const value_object = processValue(propertyKey, { ...conversions, type: relatedClassType }, (this as any)[conversions.propertyToFill]);
                                (plainObject as any)[conversions.propertyToFill] = value_object;
                            }
                        }
                    }
                } else {
                    let value: any = undefined;
                    let swProcessValue = false;
                    if (this.hasOwnProperty(propertyKey) || conversions.toPlainObject) {
                        value = (this as any)[propertyKey];
                        swProcessValue = true;
                    }
                    if (swProcessValue) {
                        // es un campo normal
                        if (conversions.isArray === true) {
                            let array = [];
                            if (value) {
                                if (Array.isArray(value) === false) {
                                    throw `${this.className()} - ${propertyKey}: value must be an array`;
                                }
                                for (let i = 0; i < value.length; i++) {
                                    const item = processValue(propertyKey, conversions, value[i]);
                                    array.push(item);
                                }
                            }
                            value = array;
                        } else {
                            value = processValue(propertyKey, conversions, value);
                        }
                        (plainObject as any)[propertyKey] = value;
                    }
                }
            }
        }
        return plainObject;
    }

    public static fromPlainObject<T extends BaseEntity>(plainObject: object): T {
        const instance = new this() as T;
        if (plainObject) {
            const conversionFunctions = getCombinedConversionFunctions<T>(this);
            if (conversionFunctions) {
                const processValue = (propertyKey: string, conversions: ConversionFunctions<any>, value: any) => {
                    try {
                        let type = conversions.type as any;
                        if (conversions.fromPlainObject) {
                            value = conversions.fromPlainObject.call(this, value);
                        } else if (type.fromPlainObject) {
                            if (type.MongoModel === undefined || value !== undefined) {
                                value = type.fromPlainObject(value);
                            }
                        } else if (conversions.type === BigInt) {
                            value = deserealizeBigInt(value);
                        } else if (
                            value !== undefined &&
                            conversions.type !== Number &&
                            conversions.type !== String &&
                            conversions.type !== Boolean &&
                            conversions.type !== Object
                        ) {
                            value = new type(value);
                        }
                        return value;
                    } catch (error) {
                        throw `${this.className()} - ${propertyKey}: ${error}`;
                    }
                };
                for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                    if (conversions.relation !== undefined) {
                        let value: any = undefined;
                        let swProcessValue = false;
                        if (plainObject.hasOwnProperty(propertyKey) || conversions.fromPlainObject || (this as any)[conversions.propertyToFill!]) {
                            value = (plainObject as any)[propertyKey];
                            swProcessValue = true;
                        }
                        if (swProcessValue) {
                            // es un tipo de campo con id y objeto en relacion
                            // quiero quedarme con el id y convertir el value
                            // si es array, OneToMany, quiero convertir todos los elementos
                            if (conversions.isArray === true) {
                                let array_ids = [];
                                let value_ids: string | undefined = value;
                                if (value_ids) {
                                    if (Array.isArray(value_ids) === false) {
                                        throw `${this.className()} - ${propertyKey}: OneToMany value must be an Array`;
                                    }
                                    for (let i = 0; i < value_ids.length; i++) {
                                        const item = value_ids[i];
                                        array_ids.push(item);
                                    }
                                }
                                (instance as any)[propertyKey] = array_ids;
                                if (conversions.propertyToFill && (plainObject as any).hasOwnProperty(conversions.propertyToFill)) {
                                    let array_objects: string[] = [];
                                    const relatedClassType = conversions.typeRelation as any;
                                    const value_objects = (plainObject as any)[conversions.propertyToFill];
                                    if (value_objects) {
                                        if (Array.isArray(value_objects) === false) {
                                            throw `${this.className()} - ${propertyKey}: OneToMany ${conversions.propertyToFill.toString()} value must be an Array`;
                                        }
                                        for (let i = 0; i < value_objects.length; i++) {
                                            const item = processValue(propertyKey, { ...conversions, type: relatedClassType }, value_objects[i]);
                                            array_objects.push(item);
                                        }
                                    }
                                    (instance as any)[conversions.propertyToFill] = array_objects;
                                }
                            } else {
                                let value_id: string | undefined = value;
                                (instance as any)[propertyKey] = value_id;
                                if (conversions.propertyToFill && (plainObject as any).hasOwnProperty(conversions.propertyToFill)) {
                                    const relatedClassType = conversions.typeRelation as any;
                                    const value_object = processValue(propertyKey, { ...conversions, type: relatedClassType }, (plainObject as any)[conversions.propertyToFill]);
                                    (instance as any)[conversions.propertyToFill] = value_object;
                                }
                            }
                        }
                    } else {
                        let value: any = undefined;
                        let swProcessValue = false;
                        if (plainObject.hasOwnProperty(propertyKey) || conversions.fromPlainObject) {
                            value = (plainObject as any)[propertyKey];
                            swProcessValue = true;
                        }
                        if (swProcessValue) {
                            if (conversions.isArray === true) {
                                let array = [];
                                if (value) {
                                    if (Array.isArray(value) === false) {
                                        throw `${this.className()} - ${propertyKey}: value must be an array`;
                                    }
                                    for (let i = 0; i < value.length; i++) {
                                        const item = processValue(propertyKey, conversions, value[i]);
                                        array.push(item);
                                    }
                                }
                                value = array;
                            } else {
                                value = processValue(propertyKey, conversions, value);
                            }
                            (instance as any)[propertyKey] = value;
                        }
                    }
                }
            }
        }
        return instance;
    }

    // #endregion conversions methods
}
