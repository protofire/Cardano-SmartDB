import { isEqual, isNullOrBlank, toJson } from '@/src/utils/commons/utils';
import { OptionsGet, optionsGetDefault } from '../../../Commons';
import { AddressToFollowEntity } from '../../../Entities/AddressToFollow.Entity';
import { BaseSmartDBEntity } from '../../../Entities/Base/Base.SmartDB.Entity';
import { AddressToFollowFrontEndApiCalls } from '../AddressToFollow.FrontEnd.Api.Calls';
import { BaseFrontEndApiCalls } from './Base.FrontEnd.Api.Calls';

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

    public static async createHookApi_<T extends BaseSmartDBEntity>(address: string, currencySymbol: string, tokenName?: string): Promise<void> {
        return await this.createHookApi(this._Entity, address, currencySymbol, tokenName);
    }
    public static async syncWithAddressApi_<T extends BaseSmartDBEntity>(address: string, force: boolean = false): Promise<boolean> {
        return await this.syncWithAddressApi(this._Entity, address, force);
    }

    // #endregion api applied to entity

    // #region api

    public static async getDeployedApi<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, optionsGet?: OptionsGet): Promise<T[]> {
        try {
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/deployed`);
            } else {
                const body = toJson(optionsGet);
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/deployed`, {
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
            throw `${error}`;
        }
    }

    public static async createHookApi<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, address: string, currencySymbol: string, tokenName?: string): Promise<void> {
        try {
            const addressesToFollow = await AddressToFollowFrontEndApiCalls.getByAddressApi(address);
            if (addressesToFollow && addressesToFollow.length > 0) {
                // no quiero disparar error si ya existe
                // throw "Webhook already exists"
            } else {
                const addressToFollow = new AddressToFollowEntity({
                    address,
                    currencySymbol,
                    tokenName,
                    txCount: -1,
                    apiRouteToCall: Entity.apiRoute() + '/sync',
                    datumType: Entity.className(),
                });
                await AddressToFollowFrontEndApiCalls.createApi(addressToFollow);
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - createHookApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async syncWithAddressApi<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, address: string, force: boolean = false): Promise<boolean> {
        try {
            if (isNullOrBlank(address)) {
                throw `address not defined`;
            }
            const body = toJson({ event: 'sync', force, tryCountAgain: false}); 
            const response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${Entity.apiRoute()}/sync/${address}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            if (response.status === 200) {
                console.log(`[${Entity.className()}] - syncWithAddressApi - address: ${address} - response OK`);
                return true;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${Entity.className()}] - syncWithAddressApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
