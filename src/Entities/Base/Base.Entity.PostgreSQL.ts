import { ConversionFunctions, deserealizeBigInt, executeFunction, getCombinedConversionFunctions, isNullOrBlank, toJson } from '../../backEnd.js';
import { PostgreSQLAppliedFor } from '../../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import { BaseEntity } from './Base.Entity.js';

@PostgreSQLAppliedFor([BaseEntity])
export class BaseEntityPostgreSQL {
    protected static Entity = BaseEntity;
    protected static _postgreSQLTableName: string;

    // #region fields

    // #endregion fields

    // #region internal class methods

    public static isInstanceOfBaseEntity(instance: any): instance is BaseEntity {
        return instance instanceof BaseEntity;
    }

    public getPostgreSQLStatic(): typeof BaseEntityPostgreSQL {
        return this.constructor as typeof BaseEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof BaseEntityPostgreSQL {
        return this as typeof BaseEntityPostgreSQL;
    }

    public getStatic(): typeof BaseEntity {
        return this.getPostgreSQLStatic().getStatic() as typeof BaseEntity;
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

    // #region postgreSQL db

    // public static PostgreSQLModel(): any {
    //     throw `${this.Entity.className()} - postgreSQL model not implemented`;
    // }

    public static PostgreSQLModel() {
        return this;
    }

    public MongoModel(): any {
        return this.getPostgreSQLStatic().PostgreSQLModel();
    }
    // #endregion postgreSQL db
    // #endregion internal class methods

    // #region conversions methods

    public static async toPostgreSQLInterface<T extends BaseEntity>(instance: T, cascadeSave?: boolean): Promise<any> {
        const conversionFunctions = getCombinedConversionFunctions(this.getStatic());
        const interfaceObj: any = new this();
        if (conversionFunctions) {
            const processValue = async (propertyKey: string, conversions: ConversionFunctions<any>, value: any) => {
                try {
                    if (this.isInstanceOfBaseEntity(value) && value.getPostgreSQL) {
                        // estoy en un caso de recursividad, una enteidad dentro de esta entidad
                        // busco su entity postgreSQL y llamo a toPostgreSQLInterface
                        const postgreSQLEntity = value.getPostgreSQL();
                        if (postgreSQLEntity) {
                            value = await postgreSQLEntity.toPostgreSQLInterface(value, cascadeSave);
                        } else {
                            throw `${this.className()} - ${propertyKey}: ${value.className()} - ${value} - PostgreSQLEntity not found`;
                        }
                    } else {
                        let type = conversions.type as any;
                        // if (value?.toPostgreSQLInterface) {
                        //     value = await executeFunction(value.toPostgreSQLInterface, value, cascadeSave);
                        // } else
                        if (conversions.toPostgreSQLInterface) {
                            value = conversions.toPostgreSQLInterface.call(instance, value);
                            // } else if (type.toPostgreSQLInterface) {
                            //     value = await executeFunction(type.toPostgreSQLInterface, value, cascadeSave);
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
                        } else if (value !== undefined && value !== null && conversions.type !== Number && conversions.type !== String && conversions.type !== Boolean) {
                            value = JSON.parse(toJson(value));
                        } else if (value === undefined){
                            value = null;
                        }
                    }
                    return value;
                } catch (error) {
                    throw `${this.className()} - ${propertyKey}: ${error}`;
                }
            };
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                //------------------
                let value: any = undefined;
                let swProcessValue = false;
                //------------------
                if (instance.hasOwnProperty(propertyKey) || conversions.toPostgreSQLInterface) {
                    value = (instance as any)[propertyKey];
                    swProcessValue = true;
                }
                //------------------
                if (swProcessValue) {
                    if (conversions.relation !== undefined) {
                        if (conversions.propertyToFill === undefined) {
                            throw `${this.className()} - ${propertyKey}: propertyToFill is required`;
                        }
                        //------------------
                        value = (instance as any)[conversions.propertyToFill];
                        //------------------
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
                        (interfaceObj as any)[conversions.interfaceName || conversions.propertyToFill] = value;
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

    public static async fromPostgreSQLInterface<T extends BaseEntity>(dataInterface: any): Promise<T> {
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
                        if (conversions.fromPostgreSQLInterface) {
                            value = conversions.fromPostgreSQLInterface.call(instance, value);
                        } else if (type.fromPostgreSQLInterface) {
                            if (type.PostgreSQLModel === undefined || (value !== undefined && value !== null)) {
                                value = await executeFunction(type.fromPostgreSQLInterface, value);
                            }
                        } else if (conversions.type === BigInt) {
                            value = deserealizeBigInt(value);
                        } else if (conversions.fromPlainObject) {
                            value = conversions.fromPlainObject.call(instance, value);
                        } else if (type.fromPlainObject) {
                            if (type.PostgreSQLModel === undefined || (value !== undefined && value !== null)) {
                                value = await executeFunction(type.fromPlainObject, value);
                            }
                        } else if (
                            value !== undefined && value !== null &&
                            conversions.type !== Number &&
                            conversions.type !== String &&
                            conversions.type !== Boolean &&
                            conversions.type !== Object
                        ) {
                            value = new type(value);
                        } else if (value === null){
                            value = undefined;
                        }
                        return value;
                    } catch (error) {
                        throw `${this.className()} - ${propertyKey}: ${error}`;
                    }
                };
                for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                    let value: any = undefined;
                    let swProcessValue = false;
                    if (plainDataInterface.hasOwnProperty(conversions.interfaceName || propertyKey) || conversions.fromPostgreSQLInterface) {
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
                                        if (process.env.USE_DATABASE === 'postgresql') {
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
                                if (process.env.USE_DATABASE === 'postgresql') {
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
                                            if (process.env.USE_DATABASE === 'postgresql') {
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
                                    if (process.env.USE_DATABASE === 'postgresql') {
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
