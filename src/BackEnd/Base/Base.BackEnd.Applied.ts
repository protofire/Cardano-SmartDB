import { console_logLv2 } from '../../Commons/BackEnd/globalLogs.js';
import { BackEndAppliedFor } from '../../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { getCombinedConversionFunctions } from '../../Commons/Decorators/Decorator.Convertible.js';
import { CascadeUpdate, OptionsCreateOrUpdate, OptionsDelete, OptionsGet, OptionsGetOne } from '../../Commons/types.js';
import { isNullOrBlank, toJson } from '../../Commons/utils.js';
import { BaseEntity } from '../../Entities/Base/Base.Entity.js';
import { BaseBackEndMethods } from './Base.BackEnd.Methods.js';

@BackEndAppliedFor(BaseEntity)
export class BaseBackEndApplied {
    protected static _Entity = BaseEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    public static getBack() {
        return this._BackEndMethods;
    }

    // #region class methods applied to entity

    public static async create<T extends BaseEntity>(instance: T, optionsCreate?: OptionsCreateOrUpdate): Promise<T> {
        return await this.getBack().create<T>(instance, optionsCreate);
    }

    public static async updateWithParams_<T extends BaseEntity>(id: string, updateFields: Record<string, any>, optionsUpdate?: OptionsCreateOrUpdate): Promise<T> {
        return await this.getBack().updateWithParams<T>(this._Entity, id, updateFields, optionsUpdate);
    }

    public static async updateMeWithParams<T extends BaseEntity>(instance: T, updateFields: Record<string, any>, optionsUpdate?: OptionsCreateOrUpdate): Promise<void> {
        return await this.getBack().updateMeWithParams<T>(instance, updateFields, optionsUpdate);
    }

    public static async update<T extends BaseEntity>(instance: T, optionsUpdate?: OptionsCreateOrUpdate): Promise<void> {
        return await this.getBack().update<T>(instance, optionsUpdate);
    }

    public static async checkIfExists_<T extends BaseEntity>(paramsFilterOrID: Record<string, any> | string): Promise<boolean> {
        return await this.getBack().checkIfExists<T>(this._Entity, paramsFilterOrID);
    }

    public static async getById_<T extends BaseEntity>(id: string, optionsGet?: OptionsGetOne, restricFilter?: Record<string, any>): Promise<T | undefined> {
        return await this.getBack().getById<T>(this._Entity, id, optionsGet, restricFilter);
    }

    public static async getOneByParams_<T extends BaseEntity>(
        paramsFilter?: Record<string, any>,
        optionsGet?: OptionsGetOne,
        restricFilter?: Record<string, any>
    ): Promise<T | undefined> {
        return await this.getBack().getOneByParams<T>(this._Entity, paramsFilter, optionsGet, restricFilter);
    }

    public static async getByParams_<T extends BaseEntity>(paramsFilter?: Record<string, any>, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        return await this.getBack().getByParams<T>(this._Entity, paramsFilter, optionsGet, restricFilter);
    }

    public static async getAll_<T extends BaseEntity>(optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        return await this.getBack().getAll<T>(this._Entity, optionsGet, restricFilter);
    }

    public static async getCount_<T extends BaseEntity>(paramsFilter?: Record<string, any>, restricFilter?: Record<string, any>): Promise<number> {
        return await this.getBack().getCount<T>(this._Entity, paramsFilter, restricFilter);
    }

    public static async aggregate_<T extends BaseEntity>(pipeline: Record<string, any>[], isResultSameEntity: boolean = true): Promise<any[]> {
        return await this.getBack().aggregate<T>(this._Entity, pipeline, isResultSameEntity);
    }

    public static async deleteById_<T extends BaseEntity>(id: string, optionsDelete?: OptionsDelete): Promise<boolean> {
        return await this.getBack().deleteById<T>(this._Entity, id, optionsDelete);
    }

    public static async deleteByParams_<T extends BaseEntity>(paramsFilter?: Record<string, any>, optionsDelete?: OptionsDelete): Promise<boolean> {
        return await this.getBack().deleteByParams<T>(this._Entity, paramsFilter, optionsDelete);
    }

    public static async delete<T extends BaseEntity>(instance: T, optionsDelete?: OptionsDelete): Promise<boolean> {
        return await this.getBack().delete<T>(instance, optionsDelete);
    }

    public static async loadRelationMany<T extends BaseEntity, R extends BaseEntity>(
        instance: T,
        relation: string,
        optionsGet?: OptionsGet,
        restricFilter?: Record<string, any>
    ): Promise<R[]> {
        return await this.getBack().loadRelationMany<T, R>(instance, relation, optionsGet, restricFilter);
    }

    public static async loadRelationOne<T extends BaseEntity, R extends BaseEntity>(
        instance: T,
        relation: string,
        optionsGet?: OptionsGet,
        restricFilter?: Record<string, any>
    ): Promise<R | undefined> {
        return await this.getBack().loadRelationOne<T, R>(instance, relation, optionsGet, restricFilter);
    }

    // #endregion class methods applied to entity

    // #region relations

    public static async cascadeSaveChildRelations<T extends BaseEntity, R extends BaseEntity>(instance: T, optionsCreateOrUpdate?: OptionsCreateOrUpdate) {
        // para actualizar o crear los registros de las relaciones que tenga
        // se hace al crear y al hacer updates

        // se va a asegurar que los ids en las relaciones existan
        // si no existen los setea undefined y se crea el objeto sin esos ids, o sea, los elimina

        // si hay id, que exista y luego asegurarme despues de crearlo, al cargarlo, que carge el objeto si tiene cascadaLoad
        // si no hay id, reviso el  objeto, si el objeto esta, y tiene id, que exista, si no lo elimino
        // si no hay id, reviso el objeto si no tienen id, lo creo si hay cascadaSave, luego asegurarme de cargarlo si hay cascadeLoad
        // si es array, ....
        //--------------------------------------
        console_logLv2(1, instance.className(), `cascadeSaveChildRelations - Init`);
        //--------------------------------------
        const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.relation !== undefined) {
                    let value: any = undefined;
                    let swProcessValue = false;
                    if (instance.hasOwnProperty(propertyKey) || instance[conversions.propertyToFill! as keyof typeof instance]) {
                        value = instance[propertyKey as keyof typeof instance];
                        swProcessValue = true;
                    }
                    if (swProcessValue) {
                        // itero por todas las relaciones que hay
                        if (conversions.isArray === true) {
                            // OneToMany es array
                            //--------------------------------------
                            const RelatedClassType = conversions.typeRelation;
                            if (!this.getBack().isBaseEntityClass(RelatedClassType)) {
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
                                    // const value_id = await this.checkRelationID(value_ids[i], RelatedClassType, propertyKey, conversions);
                                    // if (value_id !== undefined) {
                                    //     array_ids.push(value_id);
                                    // }
                                    const value_id = value_ids[i];
                                    array_ids.push(value_id);
                                }
                            }
                            //--------------------------------------
                            const value_objects: R[] | undefined = instance[conversions.propertyToFill! as keyof typeof instance] as R[] | undefined;
                            //--------------------------------------
                            if (value_objects) {
                                if (Array.isArray(value_objects) === false) {
                                    throw `${instance.className()} - ${propertyKey}: OneToMany ${conversions.propertyToFill} value must be an Array`;
                                }
                                // voy a recorrer los objetos para ver si hay algun id más alli o si hay alguno por guardar en la base de datos
                                //--------------------------------------
                                const isCascadeSave =
                                    optionsCreateOrUpdate?.saveRelations?.[propertyKey] === true ||
                                    (optionsCreateOrUpdate?.saveRelations === undefined && conversions.cascadeSave === true);
                                //--------------------------------------
                                console_logLv2(
                                    0,
                                    instance.className(),
                                    `cascadeSaveChildRelations - ${propertyKey}: OneToMany ${conversions.propertyToFill} - isCascadeSave: ${isCascadeSave}`
                                );
                                //--------------------------------------
                                if (isCascadeSave) {
                                    //--------------------------------------
                                    let optionsCreateOrUpdateForRelation = conversions.optionsCreateOrUpdate;
                                    if (optionsCreateOrUpdateForRelation === undefined) {
                                        optionsCreateOrUpdateForRelation = { saveRelations: optionsCreateOrUpdate?.saveRelations };
                                    }
                                    //--------------------------------------
                                    for (let i = 0; i < value_objects.length; i++) {
                                        const value_object = await this.getBack().checkRelationAndCreateIt<T, R>(
                                            instance,
                                            RelatedClassType,
                                            value_objects[i],
                                            propertyKey,
                                            conversions,
                                            optionsCreateOrUpdateForRelation
                                        );
                                        const value_id = value_object?._DB_id;
                                        // si value_object id esta seteado, voy a controlar que este en el array de ids
                                        if (value_id !== undefined && !array_ids.includes(value_id)) {
                                            array_ids.push(value_id);
                                        }
                                        (value_objects as any)[i] = value_object;
                                    }
                                }
                            }
                            //--------------------------------------
                            instance[propertyKey as keyof typeof instance] = array_ids as any;
                            //--------------------------------------
                            (instance as any)[conversions.propertyToFill! as keyof typeof instance] = value_objects;
                            //--------------------------------------
                        } else {
                            // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
                            // ManyToOne es una relacion de muchos registros de esta tabla con un registro de otra tabla
                            // en ambos casos lo que tengo aqui es un solo id
                            //--------------------------------------
                            const RelatedClassType = conversions.typeRelation;
                            if (!this.getBack().isBaseEntityClass(RelatedClassType)) {
                                throw `${instance.className()} - ${propertyKey}: Must be related with SmartDB Class`;
                            }
                            //--------------------------------------
                            let value_id = value;
                            // let value_id: any = await this.checkRelationID(value, RelatedClassType, propertyKey, conversions);;
                            //--------------------------------------
                            let value_object: R | undefined = instance[conversions.propertyToFill! as keyof typeof instance] as R | undefined;
                            //--------------------------------------
                            const isCascadeSave =
                                optionsCreateOrUpdate?.saveRelations?.[propertyKey] === true ||
                                (optionsCreateOrUpdate?.saveRelations === undefined && conversions.cascadeSave === true);
                            //--------------------------------------
                            console_logLv2(
                                0,
                                instance.className(),
                                `cascadeSaveChildRelations - ${propertyKey}: OneToOne ${conversions.propertyToFill} - isCascadeSave: ${isCascadeSave}`
                            );
                            //--------------------------------------
                            if (isCascadeSave) {
                                //--------------------------------------
                                let optionsCreateOrUpdateForRelation = conversions.optionsCreateOrUpdate;
                                if (optionsCreateOrUpdateForRelation === undefined) {
                                    optionsCreateOrUpdateForRelation = { saveRelations: optionsCreateOrUpdate?.saveRelations };
                                }
                                //--------------------------------------
                                value_object = await this.getBack().checkRelationAndCreateIt<T, R>(
                                    instance,
                                    RelatedClassType,
                                    value_object,
                                    propertyKey,
                                    conversions,
                                    optionsCreateOrUpdateForRelation
                                );
                                console_logLv2(
                                    0,
                                    instance.className(),
                                    `cascadeSaveChildRelations - created child: ${toJson(value_object)}`
                                );
                            }
                            //--------------------------------------
                            const value_id2 = value_object?._DB_id;
                            //--------------------------------------
                            if (isNullOrBlank(value_id)) {
                                value_id = value_id2;
                            } else {
                                // si value id esta seteado, voy a controlar que sea el mismo id del objeto
                                // if (value_id !== value_id2 && value_id2 !== undefined) {
                                //     throw `${this.className()} - ${propertyKey}: Relation id ${value_id} is different from ${conversions.propertyToFill} id ${value_id2}`;
                                // }
                            }
                            console_logLv2(
                                0,
                                instance.className(),
                                `cascadeSaveChildRelations - saving child in parent ${propertyKey}: ${value_id}`
                            );
                            //--------------------------------------
                            instance[propertyKey as keyof typeof instance] = value_id;
                            //--------------------------------------
                            (instance as any)[conversions.propertyToFill! as keyof typeof instance] = value_object;
                            //--------------------------------------
                            console_logLv2(
                                0,
                                instance.className(),
                                `cascadeSaveChildRelations - saved child in parent ${propertyKey}: ${instance[propertyKey as keyof typeof instance] }`
                            );
                        }
                    }
                }
            }
        }
        //--------------------------------------
        console_logLv2(-1, instance.className(), `cascadeSaveChildRelations - OK`);
        //--------------------------------------
    }

    public static async cascadeSaveParentRelations<T extends BaseEntity>(instance: T, optionsCreateOrUpdate?: OptionsCreateOrUpdate) {
        //TODO: por ahora no pude hacerla automatica, se hace manual en cada clase que queira modificar un padre
        // tengo problemas de referencia ciruclar
        return;
    }

    public static async cascadeLoadRelations<T extends BaseEntity, R extends BaseEntity>(instance: T, optionsGet?: OptionsGet): Promise<void> {
        //--------------------------------------
        // console_logLv2(1, instance.className(), `cascadeLoadRelations - Init`)
        //--------------------------------------
        const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.relation !== undefined) {
                    let value: any = undefined;
                    let swProcessValue = false;
                    if (instance.hasOwnProperty(propertyKey) || instance[conversions.propertyToFill! as keyof typeof instance]) {
                        value = instance[propertyKey as keyof typeof instance];
                        swProcessValue = true;
                    }
                    if (swProcessValue) {
                        // itero por todas las relaciones que hay
                        if (conversions.isArray === true) {
                            // OneToMany es array
                            //--------------------------------------
                            const RelatedClassType = conversions.typeRelation;
                            if (!this.getBack().isBaseEntityClass(RelatedClassType)) {
                                throw `${instance.className()} - ${propertyKey}: Must be related with SmartDB Class`;
                            }
                            //--------------------------------------
                            const array_ids = [];
                            const array_objects: R[] = [];
                            //--------------------------------------
                            const value_ids: any = value;
                            //--------------------------------------
                            if (value_ids) {
                                if (Array.isArray(value_ids) === false) {
                                    throw `${instance.className()} - ${propertyKey}: OneToMany value must be an Array`;
                                }
                                for (let i = 0; i < value_ids.length; i++) {
                                    const value_id = value_ids[i];
                                    array_ids.push(value_id);
                                }
                            }
                            //--------------------------------------
                            // const value_objects = (this as any)[conversions.propertyToFill!];
                            //--------------------------------------
                            // if (value_objects) {
                            //     if (Array.isArray(value_objects)  === false) {
                            //         throw `${this.className()} - ${propertyKey}: OneToMany ${conversions.propertyToFill} value must be an Array`;
                            //     }
                            //     // voy a recorrer los objetos para ver si hay algun id más alli o si hay alguno por guardar en la base de datos
                            //     for (let i = 0; i < value_objects.length; i++) {
                            //         const value_object = value_objects[i]
                            //         const value_id = await this.checkRelationID(value_object?._DB_id, RelatedClassType, propertyKey, conversions);
                            //         // si value_object id esta seteado, voy a controlar que este en el array de ids
                            //         if (value_id !== undefined) {
                            //             if (!array_ids.includes(value_id)) {
                            //                 array_ids.push(value_id);
                            //             }
                            //             array_objects.push(value_object);
                            //         }
                            //     }
                            // }
                            //--------------------------------------
                            const isCascadeLoad =
                                optionsGet?.loadRelations?.[propertyKey] === true || (optionsGet?.loadRelations === undefined && conversions.cascadeLoad === true);
                            //--------------------------------------
                            console_logLv2(
                                0,
                                instance.className(),
                                `cascadeLoadRelations - ${propertyKey}: OneToMany ${conversions.propertyToFill} - isCascadeLoad: ${isCascadeLoad}`
                            );
                            //--------------------------------------
                            if (isCascadeLoad) {
                                //--------------------------------------
                                let optionsGetForRelation =
                                    // primero veo si vienen option get para la relacion en particular
                                    // si no, cargo las que estan en la conversion
                                    optionsGet?.optionsGetForRelation?.[propertyKey] !== undefined ? optionsGet.optionsGetForRelation[propertyKey] : conversions.optionsGet;
                                //--------------------------------------
                                if (optionsGetForRelation === undefined) {
                                    // si aun es undefined, copio las opciones de get que me pasaron para la entidad principal
                                    optionsGetForRelation = optionsGet;
                                }
                                //--------------------------------------
                                for (let i = 0; i < array_ids.length; i++) {
                                    const value_id = array_ids[i];
                                    const value_object = await this.getBack().checkRelationAndLoadIt<T, R>(
                                        instance,
                                        RelatedClassType,
                                        value_id,
                                        propertyKey,
                                        conversions,
                                        optionsGetForRelation
                                    );
                                    if (value_object !== undefined) {
                                        array_objects.push(value_object);
                                    }
                                }
                            }
                            //--------------------------------------
                            instance[conversions.propertyToFill! as keyof typeof instance] = array_objects as any;
                            //--------------------------------------
                        } else {
                            // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
                            // ManyToOne es una relacion de muchos registros de esta tabla con un registro de otra tabla
                            // en ambos casos lo que tengo aqui es un solo id
                            //--------------------------------------
                            const RelatedClassType = conversions.typeRelation;
                            if (!this.getBack().isBaseEntityClass(RelatedClassType)) {
                                throw `${instance.className()} - ${propertyKey}: Must be related with SmartDB Class`;
                            }
                            //--------------------------------------
                            let value_id = value;
                            //--------------------------------------
                            let value_object = instance[conversions.propertyToFill! as keyof typeof instance];
                            //--------------------------------------
                            //--------------------------------------
                            if (value_id !== undefined && value_object === undefined) {
                                //--------------------------------------
                                const isCascadeLoad =
                                    optionsGet?.loadRelations?.[propertyKey] === true || (optionsGet?.loadRelations === undefined && conversions.cascadeLoad === true);
                                //--------------------------------------
                                console_logLv2(
                                    0,
                                    instance.className(),
                                    `cascadeLoadRelations - ${propertyKey}: OneToOne ${conversions.propertyToFill} - isCascadeLoad: ${isCascadeLoad}`
                                );
                                //--------------------------------------
                                if (isCascadeLoad) {
                                    //--------------------------------------
                                    let optionsGetForRelation = conversions.optionsGet;
                                    if (optionsGetForRelation === undefined) {
                                        optionsGetForRelation = { doCallbackAfterLoad: optionsGet?.doCallbackAfterLoad };
                                    }
                                    //--------------------------------------
                                    const value_object = await this.getBack().checkRelationAndLoadIt<T, R>(
                                        instance,
                                        RelatedClassType,
                                        value_id,
                                        propertyKey,
                                        conversions,
                                        optionsGetForRelation
                                    );
                                    instance[conversions.propertyToFill! as keyof typeof instance] = value_object as any;
                                }
                            }
                        }
                    }
                }
            }
        }
        //--------------------------------------
        // console_logLv2(-1, instance.className(), `cascadeLoadRelations - OK`);
        //--------------------------------------
        return;
    }

    public static async cascadeDeleteRelations<T extends BaseEntity>(instance: T, deleteRelations?: Record<string, boolean>) {
        // TODO: seria ideal aqui poder borrar los ManyToOne, pero como puedo hacerlo si no puedo obtener el tipo de la relacion
        // no puedo hacerlo por que me genera dependencias circulares entre las clases
        // la clase con OneToMany, como Protocol tiene Funds
        // y la clase ManyToOne, como Fund tiene Protocol
        // para evitar eso, las clases como Funds, no tienen la relacion ManyToOne definida de antemano
        // por eso tienen que definir su propio cascadeDelete y borrar ahi la relacion del Protocolo
        // idealmenete al borrar fondos aqui podria de forma sistematica actualizar el protoclo... pero esta dificil por ahora
        // prefiero seguir con el modo manual, como esta ahora en Fund y FundHoldings E inveetUnit
        // //--------------------------------------
        // const isCascadeDelete =
        //     (deleteRelations?.[propertyKey] === true) ||
        //     (!saveRelations && conversions.cascadeSave === true);
        // //--------------------------------------
        return;
    }

    // #endregion relations

    // #region callbacks

    public static async callbackOnAfterLoad<T extends BaseEntity>(instance: T, cascadeUpdate: CascadeUpdate): Promise<CascadeUpdate> {
        return cascadeUpdate;
    }

    // #endregion callbacks
}
