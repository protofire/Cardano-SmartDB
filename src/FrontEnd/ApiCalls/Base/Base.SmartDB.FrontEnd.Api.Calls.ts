import fetchWrapper from '../../../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
import { CS, OptionsGet, isEqual, isNullOrBlank, optionsGetDefault, toJson } from '../../../Commons/index.js';
import { AddressToFollowEntity } from '../../../Entities/AddressToFollow.Entity.js';
import { BaseSmartDBEntity } from '../../../Entities/Base/Base.SmartDB.Entity.js';
import { AddressToFollowFrontEndApiCalls } from '../AddressToFollow.FrontEnd.Api.Calls.js';
import { BaseFrontEndApiCalls } from './Base.FrontEnd.Api.Calls.js';

// es generica, todos los metodos llevan instancia o entidad como parametro
// todas las clases la pueden usar
// pero si se setea uno por Entidad y se setea la entidad, tiene metodos especificos
// ofrece metodos igual que el base pero con _ para cuando es especifico

export class BaseSmartDBFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = BaseSmartDBEntity;

    // #region api applied to entity

    public static async getDeployedApi_<T extends BaseSmartDBEntity>(optionsGet?: OptionsGet): Promise<T[]> {
        return await this.getDeployedApi(this._Entity, optionsGet);
    }

    public static async createHookApi_<T extends BaseSmartDBEntity>(address: string, CS: string, TN_Str?: string): Promise<void> {
        return await this.createHookApi(this._Entity, address, CS, TN_Str);
    }

    public static async syncWithAddressApi_<T extends BaseSmartDBEntity>(address: string, CS: CS, force: boolean = false): Promise<boolean> {
        return await this.syncWithAddressApi(this._Entity, address, CS, force);
    }

    public static async parseBlockchainAddressApi_<T extends BaseSmartDBEntity>(address: string, datumType: string, block?: number): Promise<string> {
        return await this.parseBlockchainAddressApi(this._Entity, address, datumType, block);
    }

    // #endregion api applied to entity

    // #region api

    public static async getDeployedApi<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, optionsGet?: OptionsGet): Promise<T[]> {
        try {
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/deployed`);
            } else {
                const body = toJson(optionsGet);
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/deployed`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            if (response.status === 200) {
                const datas = await response.json();
                console.log(`[${Entity.className()}] - getDeployedApi - response OK`);
                const instances = datas.map((data: any) => Entity.fromPlainObject<T>(data));
                console.log(`[${Entity.className()}] - getDeployedApi - len: ${instances.length}`);
                return instances;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - getDeployedApi - Error: ${error}`);
            throw error;
        }
    }

    public static async createHookApi<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, address: string, CS: string, TN_Str?: string): Promise<void> {
        try {
            const addressesToFollow = await AddressToFollowFrontEndApiCalls.getByAddressApi(address, CS);
            if (addressesToFollow && addressesToFollow.length > 0) {
                // no quiero disparar error si ya existe
                // throw "Webhook already exists"
            } else {
                const addressToFollow = new AddressToFollowEntity({
                    address,
                    CS,
                    TN_Str,
                    txCount: -1,
                    apiRouteToCall: Entity.apiRoute() + '/sync',
                    datumType: Entity.className(),
                });
                await AddressToFollowFrontEndApiCalls.createApi(addressToFollow);
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - createHookApi - Error: ${error}`);
            throw error;
        }
    }

    public static async syncWithAddressApi<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, address: string, CS: CS, force: boolean = false): Promise<boolean> {
        try {
            if (isNullOrBlank(address)) {
                throw `address not defined`;
            }
            if (isNullOrBlank(CS)) {
                throw `CS not defined`;
            }
            const body = toJson({ event: 'sync', force, tryCountAgain: false });
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/sync/${address}/${CS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            if (response.status === 200) {
                console.log(`[${Entity.className()}] - syncWithAddressApi - address: ${address} - CS: ${CS} - response OK`);
                return true;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - syncWithAddressApi - Error: ${error}`);
            throw error;
        }
    }

    public static async parseBlockchainAddressApi<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        address: string,
        datumType: string,
        fromBlock?: number,
        toBlock?: number
    ): Promise<string> {
        try {
            //-------------------------
            if (isNullOrBlank(address)) {
                throw `address not defined`;
            }
            //-------------------------
            const body = toJson({ address, datumType, fromBlock, toBlock });
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/parse-blockchain-address`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            //-------------------------
            if (response.status === 202) {
                const data = await response.json();
                console.log(`[${Entity.className()}] - parseBlockchainAddressApi - jobId: ${data.jobId} - response OK`);
                return data.jobId;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${Entity.className()}] - parseBlockchainAddressApi - Error: ${error}`);
            throw error;
        }
    }

    // #endregion api
}
