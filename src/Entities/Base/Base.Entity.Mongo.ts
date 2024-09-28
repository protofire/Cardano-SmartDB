import { Types } from 'mongoose';
import 'reflect-metadata';
import { deserealizeBigInt } from '../../Commons/conversions.js';
import { getCombinedConversionFunctions } from '../../Commons/Decorators/Decorator.Convertible.js';
import { MongoAppliedFor } from '../../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { ConversionFunctions, executeFunction, toJson } from '../../Commons/index.js';
import { BaseEntity } from './Base.Entity.js';

@MongoAppliedFor([BaseEntity])
export class BaseEntityMongo {
    protected static Entity = BaseEntity;
    protected static _mongoTableName: string;

    // #region fields

    // #endregion fields

    // #region internal class methods

    public static isInstanceOfBaseEntity(instance: any): instance is BaseEntity {
        return instance instanceof BaseEntity;
    }

    public getMongoStatic(): typeof BaseEntityMongo {
        return this.constructor as typeof BaseEntityMongo;
    }

    public static getMongoStatic(): typeof BaseEntityMongo {
        return this as typeof BaseEntityMongo;
    }

    public getStatic(): typeof BaseEntity {
        return this.getMongoStatic().getStatic() as typeof BaseEntity;
    }

    public static getStatic(): typeof BaseEntity {
        return this.Entity as typeof BaseEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods

    // #region mongo db

    public static MongoModel(): any {
        throw `${this.Entity.className()} - Mongo model not implemented`;
    }

    public MongoModel(): any {
        return this.getMongoStatic().MongoModel();
    }

    // #endregion mongo db

    // #region conversions methods

    public static async toMongoInterface<T extends BaseEntity>(instance: T, cascadeSave?: boolean): Promise<any> {
        const conversionFunctions = getCombinedConversionFunctions(this.getStatic());
        const interfaceObj: any = {};
        if (conversionFunctions) {
            const processValue = async (propertyKey: string, conversions: ConversionFunctions<any>, value: any) => {
                try {
                    if (this.isInstanceOfBaseEntity(value) && value.getMongo) {
                        // estoy en un caso de recursividad, una enteidad dentro de esta entidad
                        // busco su entity mongo y llamo a toMongoInterface
                        const mongoEntity = value.getMongo();
                        if (mongoEntity) {
                            value = await mongoEntity.toMongoInterface(value, cascadeSave);
                        } else {
                            throw `${this.className()} - ${propertyKey}: ${value.className()} - ${value} - MongoEntity not found`;
                        }
                    } else {
                        let type = conversions.type as any;
                        // if (value?.toMongoInterface) {
                        //     value = await executeFunction(value.toMongoInterface, value, cascadeSave);
                        // } else
                        if (conversions.toMongoInterface) {
                            value = conversions.toMongoInterface.call(instance, value);
                            // } else if (type.toMongoInterface) {
                            //     value = await executeFunction(type.toMongoInterface, value, cascadeSave);
                            // } else if (conversions.type === BigInt) {
                            //     value = serializeBigInt(value)
                        } else if (value?.toPlainObject) {
                            value = await executeFunction(value.toPlainObject, value);
                        } else if (conversions.toPlainObject) {
                            value = conversions.toPlainObject.call(instance, value);
                        } else if (type.toPlainObject) {
                            value = await executeFunction(type.toPlainObject, value);
                        } else if (value?.toJsonString) {
                            value = JSON.parse(value.toJsonString());
                        } else if (value !== undefined && conversions.type !== Number && conversions.type !== String && conversions.type !== Boolean) {
                            value = JSON.parse(toJson(value));
                        }
                    }
                    return value;
                } catch (error) {
                    throw `${this.className()} - ${propertyKey}: ${error}`;
                }
            };
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                let value: any = undefined;
                let swProcessValue = false;
                if (instance.hasOwnProperty(propertyKey) || conversions.toMongoInterface) {
                    value = (instance as any)[propertyKey];
                    swProcessValue = true;
                }
                if (swProcessValue) {
                    if (conversions.relation !== undefined) {
                        // itero por todas las relaciones que hay
                        if (conversions.isArray === true) {
                            // OneToMany es una relacion un registro de esta tabla se relaciona con muchos registros de otra tabla
                            let array_ids = [];
                            let value_ids: any = value;
                            if (value_ids) {
                                if (Array.isArray(value_ids) === false) {
                                    throw `${this.className()} - ${propertyKey}: OneToMany value must be an Array`;
                                }
                                for (let i = 0; i < value_ids.length; i++) {
                                    let value_id = value_ids[i];
                                    if (value_id !== undefined) {
                                        if (process.env.USE_DATABASE === 'mongo') {
                                            value_id = new Types.ObjectId(value_id);
                                        }
                                        array_ids.push(value_id);
                                    }
                                }
                            }
                            (interfaceObj as any)[conversions.interfaceName || propertyKey] = array_ids;
                        } else {
                            // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
                            // ManyToOne es una relacion de muchos registros de esta tabla con un registro de otra tabla
                            let value_id: any = value;
                            if (value_id !== undefined) {
                                if (process.env.USE_DATABASE === 'mongo') {
                                    value_id = new Types.ObjectId(value_id);
                                }
                            }
                            (interfaceObj as any)[conversions.interfaceName || propertyKey] = value_id;
                        }
                    } else {
                        if (conversions.isArray === true) {
                            let array = [];
                            if (value) {
                                if (Array.isArray(value) === false) {
                                    throw `${this.className()} - ${propertyKey}: value must be an array`;
                                }
                                for (let i = 0; i < value.length; i++) {
                                    const item = await processValue(propertyKey, conversions, value[i]);
                                    array.push(item);
                                }
                            }
                            value = array;
                        } else {
                            value = await processValue(propertyKey, conversions, value);
                        }
                        (interfaceObj as any)[conversions.interfaceName || propertyKey] = value;
                    }
                }
            }
        }
        return interfaceObj as any;
    }

    public static async fromMongoInterface<T extends BaseEntity>(dataInterface: any): Promise<T> {
        const instance = new this.Entity() as T;
        // from interface siempre crea una instancia por que siempre va a ser llamada con un documento
        // pero por eso al llamar de forma anidada, debo verificar que exista el documento
        if (dataInterface) {
            const plainDataInterface = (dataInterface as any).toObject ? (dataInterface as any).toObject() : dataInterface;
            const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
            if (conversionFunctions) {
                const processValue = async (propertyKey: string, conversions: ConversionFunctions<any>, value: any) => {
                    try {
                        let type = conversions.type as any;
                        if (conversions.fromMongoInterface) {
                            value = conversions.fromMongoInterface.call(instance, value);
                        } else if (type.fromMongoInterface) {
                            if (type.MongoModel === undefined || value !== undefined) {
                                value = await executeFunction(type.fromMongoInterface, value);
                            }
                        } else if (conversions.type === BigInt) {
                            value = deserealizeBigInt(value);
                        } else if (conversions.fromPlainObject) {
                            value = conversions.fromPlainObject.call(instance, value);
                        } else if (type.fromPlainObject) {
                            if (type.MongoModel === undefined || value !== undefined) {
                                value = await executeFunction(type.fromPlainObject, value);
                            }
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
                    let value: any = undefined;
                    let swProcessValue = false;
                    if (plainDataInterface.hasOwnProperty(conversions.interfaceName || propertyKey) || conversions.fromMongoInterface) {
                        value = plainDataInterface[conversions.interfaceName || propertyKey];
                        swProcessValue = true;
                    }
                    if (swProcessValue) {
                        if (conversions.relation !== undefined) {
                            // itero por todas las relaciones que hay
                            if (conversions.isArray === true) {
                                // OneToMany es una relacion un registro de esta tabla se relaciona con muchos registros de otra tabla
                                let array_ids = [];
                                const value_ids = value;
                                if (value_ids) {
                                    if (Array.isArray(value_ids) === false) {
                                        throw `${this.className()} - ${propertyKey}: OneToMany value must be an Array`;
                                    }
                                    for (let i = 0; i < value_ids.length; i++) {
                                        let value_id = value_ids[i];
                                        if (process.env.USE_DATABASE === 'mongo') {
                                            value_id = value_id?.toString ? value_id.toString() : value_id;
                                        }
                                        if (value_id) {
                                            array_ids.push(value_id);
                                        }
                                    }
                                }
                                (instance as any)[propertyKey] = array_ids;
                            } else {
                                // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
                                // ManyToOne es una relacion de muchos registros de esta tabla con un registro de otra tabla
                                let value_id = plainDataInterface[conversions.interfaceName || propertyKey];
                                if (process.env.USE_DATABASE === 'mongo') {
                                    value_id = value_id?.toString ? value_id.toString() : value_id;
                                }
                                (instance as any)[propertyKey] = value_id;
                            }
                        } else {
                            if (conversions.isArray === true) {
                                let array = [];
                                if (value) {
                                    if (Array.isArray(value) === false) {
                                        throw `${this.className()} - ${propertyKey}: value must be an array`;
                                    }
                                    for (let i = 0; i < value.length; i++) {
                                        let value_ = value[i];
                                        if (conversions.isDB_id) {
                                            if (process.env.USE_DATABASE === 'mongo') {
                                                value_ = value_?.toString ? value_.toString() : value_;
                                            }
                                        }
                                        const item = await processValue(propertyKey, conversions, value_);
                                        array.push(item);
                                    }
                                }
                                value = array;
                            } else {
                                if (conversions.isDB_id) {
                                    if (process.env.USE_DATABASE === 'mongo') {
                                        value = value?.toString ? value.toString() : value;
                                    }
                                }
                                value = await processValue(propertyKey, conversions, value);
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
