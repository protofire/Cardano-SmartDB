import fetchWrapper from '../../../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
import {
    ITEMS_PER_PAGE,
    OptionsCreateOrUpdate,
    OptionsDelete,
    OptionsGet,
    OptionsGetOne,
    RegistryManager,
    createQueryURLString,
    getCombinedConversionFunctions,
    isEmptyObject,
    isEqual,
    isNullOrBlank,
    isObject,
    isString,
    optionsGetDefault,
    optionsGetOneDefault,
    showData,
    toJson,
} from '../../../Commons/index.js';
import { BaseEntity } from '../../../Entities/Base/Base.Entity.js';

// es generica, todos los metodos llevan instancia o entidad como parametro
// todas las clases la pueden usar
// pero si se setea uno por Entidad y se setea la entidad, tiene metodos especificos
// ofrece metodos igual que el base pero con _ para cuando es especifico

export class BaseFrontEndApiCalls {
    protected static _Entity = BaseEntity;

    // #region api applied to entity

    public static async callGenericPOSTApi_<T extends BaseEntity>(apiRoute: string, params: Record<string, any>): Promise<any> {
        return await this.callGenericPOSTApi(this._Entity, apiRoute, params);
    }

    public static async callGeneriGETApi_<T extends BaseEntity>(apiRoute: string, params: Record<string, any>): Promise<any> {
        return await this.callGeneriGETApi(this._Entity, apiRoute, params);
    }

    public static async updateWithParamsApi_<T extends BaseEntity>(id: string, updateFields?: Record<string, any>, optionsUpdate?: OptionsCreateOrUpdate): Promise<T> {
        return await this.updateWithParamsApi(this._Entity, id, updateFields, optionsUpdate);
    }

    public static async checkIfExistsApi_<T extends BaseEntity>(paramsFilterOrID: Record<string, any> | string): Promise<boolean> {
        return await this.checkIfExistsApi(this._Entity, paramsFilterOrID);
    }

    public static async getByIdApi_<T extends BaseEntity>(id: string, optionsGet?: OptionsGetOne): Promise<T | undefined> {
        return await this.getByIdApi(this._Entity, id, optionsGet);
    }

    public static async getOneByParamsApi_<T extends BaseEntity>(paramsFilter?: Record<string, any>, optionsGet?: OptionsGetOne): Promise<T | undefined> {
        return await this.getOneByParamsApi(this._Entity, paramsFilter, optionsGet);
    }

    public static async getByParamsApi_<T extends BaseEntity>(paramsFilter?: Record<string, any>, optionsGet?: OptionsGet): Promise<T[]> {
        return await this.getByParamsApi(this._Entity, paramsFilter, optionsGet);
    }

    public static async getAllApi_<T extends BaseEntity>(optionsGet?: OptionsGet): Promise<T[]> {
        return await this.getAllApi(this._Entity, optionsGet);
    }

    public static async getCountApi_<T extends BaseEntity>(paramsFilter?: Record<string, any>): Promise<{ count: number }> {
        return await this.getCountApi(this._Entity, paramsFilter);
    }

    public static async getTotalItemsAndPagesApi_<T extends BaseEntity>(paramsFilter?: Record<string, any>, itemsPerPage?: number): Promise<{ items: number; pages: number }> {
        return await this.getTotalItemsAndPagesApi(this._Entity, paramsFilter, itemsPerPage);
    }

    public static async deleteByIdApi_<T extends BaseEntity>(id: string, optionsDelete?: OptionsDelete): Promise<boolean> {
        return await this.deleteByIdApi(this._Entity, id, optionsDelete);
    }

    // #endregion api applied to entity

    // #region api

    public static async callGenericPOSTApi<T extends BaseEntity>(Entity: typeof BaseEntity, apiRoute: string, params: Record<string, any>): Promise<any> {
        try {
            const body = toJson(params);
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/${apiRoute}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${Entity.apiRoute()}] - callGenericPOSTApi - OK`);
                return data;
            } else {
                const errorData = await response.json();
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.apiRoute()}] - callGenericPOSTApi - Error: ${error}`);
            throw error;
        }
    }

    public static async callGeneriGETApi<T extends BaseEntity>(Entity: typeof BaseEntity, apiRoute: string, params: Record<string, any>): Promise<any> {
        try {
            //------------------
            const queryString = createQueryURLString(params);
            //------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/${apiRoute}${queryString}`);
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${Entity.apiRoute()}] - callGeneriGETApi - OK`);
                return data;
            } else {
                const errorData = await response.json();
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.apiRoute()}] - callGeneriGETApi - Error: ${error}`);
            throw error;
        }
    }

    public static async createApi<T extends BaseEntity>(instance: T, optionsCreate?: OptionsCreateOrUpdate): Promise<T> {
        try {
            //const createFields = instance.toPlainObject();
            const createFields = instance;
            const body = toJson({ createFields, ...optionsCreate });
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${instance.apiRoute()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${instance.className()}] - createApi - response OK`);
                const instance_ = instance.getStatic().fromPlainObject<T>(data);
                console.log(`[${instance.className()}] - createApi - Instance: ${instance_.show()}`);
                return instance_;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${instance.className()}] - createApi - Error: ${error}`);
            throw error;
        }
    }

    public static async refreshApi<T extends BaseEntity>(instance: T, optionsGet?: OptionsGet): Promise<void> {
        try {
            if (isNullOrBlank(instance._DB_id)) {
                throw `id not defined`;
            }
            const instance_ = await this.getByIdApi<T>(instance.getStatic(), instance._DB_id, optionsGet);
            if (instance_ === undefined) {
                throw `id: ${instance._DB_id} not found`;
            }
            Object.assign(instance, instance_);
        } catch (error) {
            console.log(`[${instance.className()}] - refreshApi - Error: ${error}`);
            throw error;
        }
    }

    public static async updateApi<T extends BaseEntity>(instance: T, optionsUpdate?: OptionsCreateOrUpdate, headers?: Record<string, any>): Promise<void> {
        try {
            const updateFields = instance.toPlainObject();
            await this.updateMeWithParamsApi<T>(instance, updateFields, optionsUpdate, headers);
        } catch (error) {
            console.log(`[${instance.className()}] - updateApi - Error: ${error}`);
            throw error;
        }
    }

    public static async updateWithParamsApi<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        id: string,
        updateFields?: Record<string, any>,
        optionsUpdate?: OptionsCreateOrUpdate
    ): Promise<T> {
        try {
            if (isNullOrBlank(id)) {
                throw `id not defined`;
            }
            const instance = await this.getByIdApi<T>(Entity, id, optionsUpdate);
            if (!instance) {
                throw `${Entity.className()} - Not found for Update Api - id: ${id}`;
            }
            await this.updateMeWithParamsApi<T>(instance, updateFields, optionsUpdate);
            return instance;
        } catch (error) {
            console.log(`[${Entity.className()}] - updateWithParamsApi - Error: ${error}`);
            throw error;
        }
    }

    public static async updateMeWithParamsApi<T extends BaseEntity>(
        instance: T,
        updateFields?: Record<string, any>,
        optionsUpdate?: OptionsCreateOrUpdate,
        headers?: Record<string, any>
    ): Promise<void> {
        try {
            if (isNullOrBlank(instance._DB_id)) {
                throw `id not defined`;
            }
            const body = toJson({ updateFields, ...optionsUpdate });
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${instance.apiRoute()}/update/${instance._DB_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body,
            });
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${instance.className()}] - updateWithParamsApi - response OK`);
                // const instance_ = this.Entity().fromPlainObject<T>(data);
                // Object.assign(instance, instance_);
                for (let key in updateFields) {
                    instance[key as keyof typeof instance] = updateFields[key];
                }
                console.log(`[${instance.className()}] - updateWithParamsApi - Instance: ${instance.show()}`);
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${instance.className()}] - updateWithParamsApi - Error: ${error}`);
            throw error;
        }
    }

    public static async checkIfExistsApi<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilterOrID: Record<string, any> | string): Promise<boolean> {
        try {
            if (isString(paramsFilterOrID) && isNullOrBlank(paramsFilterOrID)) {
                throw `id not defined`;
            }
            if (isObject(paramsFilterOrID) && isEmptyObject(paramsFilterOrID)) {
                throw `paramsFilter not defined`;
            }
            let response;
            if (isString(paramsFilterOrID)) {
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/exists/${paramsFilterOrID}`);
            } else {
                const body = toJson({ paramsFilter: paramsFilterOrID });
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/exists`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${Entity.className()}] - checkIfExistsApi: ${data.swExists}`);
                return data.swExists;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - checkIfExistsApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getByIdApi<T extends BaseEntity>(Entity: typeof BaseEntity, id: string, optionsGet?: OptionsGetOne): Promise<T | undefined> {
        try {
            if (isNullOrBlank(id)) {
                throw `id not defined`;
            }
            let response;
            if (isEqual(optionsGet, optionsGetOneDefault)) {
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/${id}`);
            } else {
                const body = toJson(optionsGet);
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/${id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${Entity.className()}] - getByIdApi - response OK`);
                const instance: T = Entity.fromPlainObject<T>(data);
                console.log(`[${Entity.className()}] - getByIdApi - Instance: ${instance.show()}`);
                return instance;
            } else if (response.status === 404) {
                console.log(`[${Entity.className()}] - getByIdApi - id: ${id} - Instance not found`);
                return undefined;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - getByIdApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getOneByParamsApi<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter?: Record<string, any>, optionsGet?: OptionsGetOne): Promise<T | undefined> {
        try {
            const datas = await this.getByParamsApi<T>(Entity, paramsFilter, { ...optionsGet, limit: 1 });
            const instances = datas.map((data: any) => Entity.fromPlainObject<T>(data));
            if (instances.length > 0) {
                return instances[0];
            } else {
                return undefined;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - getOneByParamsApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getByParamsApi<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter?: Record<string, any>, optionsGet?: OptionsGet): Promise<T[]> {
        try {
            const body = toJson({ paramsFilter, ...optionsGet });
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/by-params`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            if (response.status === 200) {
                const datas = await response.json();
                console.log(`[${Entity.className()}] - getByParamsApi - response OK`);
                const instances = await Promise.all(
                    datas.map(async (data: any) => {
                        //-----------------------
                        const instance = Entity.fromPlainObject<T>(data);
                        //-----------------------
                        if (optionsGet !== undefined && optionsGet.lookUpFields !== undefined && optionsGet.lookUpFields.length > 0) {
                            for (let lookUpField of optionsGet.lookUpFields) {
                                const EntityClass =
                                    RegistryManager.getFromSmartDBEntitiesRegistry(lookUpField.from) !== undefined
                                        ? RegistryManager.getFromSmartDBEntitiesRegistry(lookUpField.from)
                                        : RegistryManager.getFromEntitiesRegistry(lookUpField.from);
                                if (EntityClass !== undefined) {
                                    console.log(`[${Entity.className()}] - getByParams - getByParamsApi- LookUpField: ${lookUpField.from} - Loading...`);
                                    const instance_ = await EntityClass.fromPlainObject(data[lookUpField.as as keyof typeof data]);
                                    if (instance_ !== undefined) {
                                        instance[lookUpField.as as keyof typeof instance] = instance_;
                                    }
                                }
                            }
                        }
                        //-----------------------
                        return instance;
                        //-----------------------
                    })
                );
                console.log(
                    `[${Entity.className()}] - getByParamsApi - params: ${showData(paramsFilter)} - len: ${instances.length} - show firts 5: ${instances
                        .slice(0, 5)
                        .map((item: T) => item.show())
                        .join(', ')}`
                );
                return instances;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - getByParamsApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getAllApi<T extends BaseEntity>(Entity: typeof BaseEntity, optionsGet?: OptionsGet): Promise<T[]> {
        try {
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/all`);
            } else {
                const body = toJson(optionsGet);
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/all`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            if (response.status === 200) {
                const datas = await response.json();
                console.log(`[${Entity.className()}] - getAllApi - response OK`);
                const instances = datas.map((data: any) => Entity.fromPlainObject<T>(data));
                console.log(`[${Entity.className()}] - getAllApi - len: ${instances.length}`);
                return instances;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - getAllApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getCountApi<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter?: Record<string, any>): Promise<{ count: number }> {
        try {
            const body = toJson({ paramsFilter });
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/count`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${Entity.className()}] - getCountApi - count: ${data.count}`);
                return { count: data.count };
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - getCountApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getTotalItemsAndPagesApi<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter?: Record<string, any>,
        itemsPerPage?: number
    ): Promise<{ items: number; pages: number }> {
        const { count: items } = await this.getCountApi(Entity, paramsFilter);
        const totalPages = Math.ceil(items / (itemsPerPage ?? ITEMS_PER_PAGE));
        return { items, pages: totalPages };
    }

    public static async deleteByIdApi<T extends BaseEntity>(Entity: typeof BaseEntity, id: string, optionsDelete?: OptionsDelete): Promise<boolean> {
        try {
            if (isNullOrBlank(id)) {
                throw `id not defined`;
            }
            //------------------
            const queryString = createQueryURLString(optionsDelete);
            //------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/${id}${queryString}`, {
                method: 'DELETE',
            });
            if (response.status === 200) {
                console.log(`[${Entity.className()}] - deleteByIdApi - Deleted id: ${id}`);
                return true;
            } else if (response.status === 404) {
                console.log(`[${Entity.className()}] - deleteByIdApi - id: ${id} - Instance not found`);
                return false;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - deleteByIdApi - Error: ${error}`);
            throw error;
        }
    }

    public static async deleteApi<T extends BaseEntity>(instance: T, optionsDelete?: OptionsDelete): Promise<boolean> {
        try {
            if (isNullOrBlank(instance._DB_id)) {
                throw `id not defined`;
            }
            //------------------
            const queryString = createQueryURLString(optionsDelete);
            //------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${instance.apiRoute()}/${instance._DB_id}${queryString}`, {
                method: 'DELETE',
            });
            if (response.status === 200) {
                console.log(`[${instance.className()}] - deleteApi - Deleted Instance: ${instance.show()}`);
                return true;
            } else if (response.status === 404) {
                console.log(`[${instance.className()}] - deleteApi - id: ${instance._DB_id} - Instance not found`);
                return false;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${instance.className()}] - deleteApi - Error: ${error}`);
            throw error;
        }
    }

    public static async fillWithRelationApi<T extends BaseEntity, R extends BaseEntity>(instance: T, relation: string, optionsGet?: OptionsGet): Promise<void> {
        try {
            if (isNullOrBlank(relation)) {
                throw `Relation not defined`;
            }
            //--------------------------------------
            const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
            //--------------------------------------
            const conversions = conversionFunctions.get(relation);
            if (conversions === undefined || conversions.relation === undefined) {
                throw `Relation: ${relation} not found`;
            }
            //--------------------------------------
            if (conversions.isArray === true) {
                // OneToMany es una relacion un registro de esta tabla se relaciona con muchos registros de otra tabla
                // OneToMany es array
                const values: R[] = await this.loadRelationManyApi<T, R>(instance, relation, optionsGet);
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
                const value: R | undefined = await this.loadRelationOneApi<T, R>(instance, relation, optionsGet);
                //--------------------------------------
                if (value !== undefined && instance[conversions.propertyToFill! as keyof typeof instance] !== value) {
                    instance[relation as keyof typeof instance] = value._DB_id as any;
                    instance[conversions.propertyToFill! as keyof typeof instance] = value as any;
                }
                //--------------------------------------
            }
        } catch (error) {
            console.log(`[${instance.className()}] - fillWithRelationApi - Error: ${error}`);
            throw error;
        }
    }

    public static async loadRelationManyApi<T extends BaseEntity, R extends BaseEntity>(instance: T, relation: string, optionsGet?: OptionsGet): Promise<R[]> {
        try {
            if (isNullOrBlank(relation)) {
                throw `Relation not defined`;
            }
            //--------------------------------------
            const conversionFunctions = getCombinedConversionFunctions(instance.getStatic());
            if (conversionFunctions === undefined) {
                throw `conversionFunctions not found`;
            }
            //--------------------------------------
            const conversions = conversionFunctions.get(relation);
            if (conversions === undefined || conversions.relation === undefined) {
                throw `Relation: ${relation}  not found`;
            }
            //--------------------------------------
            const relatedClassType = conversions.typeRelation as any;
            //--------------------------------------
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${instance.apiRoute()}/loadRelationMany/${instance._DB_id}/${relation}`);
            } else {
                const body = toJson(optionsGet);
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${instance.apiRoute()}/loadRelationMany/${instance._DB_id}/${relation}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            //--------------------------------------
            if (response.status === 200) {
                const datas = await response.json();
                console.log(`[${instance.className()}] - loadRelationManyApi - response OK`);
                const instances: R[] = datas.map((data: R) => relatedClassType.fromPlainObject(data));
                console.log(`[${instance.className()}] - loadRelationManyApi - len: ${instances.length}`);
                return instances;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${instance.className()}] - loadRelationManyApi - Error: ${error}`);
            throw error;
        }
    }

    public static async loadRelationOneApi<T extends BaseEntity, R extends BaseEntity>(instance: T, relation: string, optionsGet?: OptionsGet): Promise<R | undefined> {
        try {
            if (isNullOrBlank(relation)) {
                throw `relation not defined`;
            }
            //--------------------------------------
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
            const relatedClassType = conversions.typeRelation as any;
            //--------------------------------------
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${instance.apiRoute()}/loadRelationOne/${instance._DB_id}/${relation}`);
            } else {
                const body = toJson(optionsGet);
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${instance.apiRoute()}/loadRelationOne/${instance._DB_id}/${relation}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            //--------------------------------------
            if (response.status === 200) {
                const datas = await response.json();
                console.log(`[${instance.className()}] - loadRelationOneApi - response OK`);
                const instance_: R = relatedClassType.fromPlainObject(datas);
                console.log(`[${instance.className()}] - loadRelationOneApi - ${instance_.show()}`);
                return instance_;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${instance.className()}] - loadRelationManyApi - Error: ${error}`);
            throw error;
        }
    }

    // #endregion api
}
