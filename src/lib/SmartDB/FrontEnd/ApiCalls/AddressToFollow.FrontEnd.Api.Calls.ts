import { OptionsGet, optionsGetDefault } from '../../Commons';
import { isNullOrBlank, toJson, isEqual } from '@/src/utils/commons/utils';
import { AddressToFollowEntity } from '../../Entities/AddressToFollow.Entity';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls';

export class AddressToFollowFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = AddressToFollowEntity;

    // #region api

    public static async syncAddressApi(addressToFollow: AddressToFollowEntity, force: boolean = false): Promise<boolean> {
        try {
            //-------------------------
            if (!addressToFollow) {
                throw `addressToFollow not defined`;
            }
            //-------------------------
            const body = toJson({ event: 'sync', force, tryCountAgain: false });
            //-------------------------
            const response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${addressToFollow.apiRouteToCall}/${addressToFollow.address}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            //-------------------------
            if (response.status === 200) {
                console.log(`[${this._Entity.className()}] - syncAddressApi - address: ${addressToFollow.address} - response OK`);
                return true;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - syncAddressApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async syncAllApi(force: boolean = false): Promise<boolean> {
        try {
            //-------------------------
            const body = toJson({ event: 'sync', force });
            //-------------------------
            const response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/sync-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            //-------------------------
            if (response.status === 200) {
                console.log(`[${this._Entity.className()}] - syncAllApi - response OK`);
                return true;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - syncAllApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async cleanApi(force: boolean = false): Promise<boolean> {
        try {
            //-------------------------
            const response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/clean`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            //-------------------------
            if (response.status === 200) {
                console.log(`[${this._Entity.className()}] - cleanApi - response OK`);
                return true;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - cleanApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getByAddressApi(address: string, optionsGet?: OptionsGet): Promise<AddressToFollowEntity[]> {
        try {
            //-------------------------
            if (isNullOrBlank(address)) {
                throw `address not defined`;
            }
            //-------------------------
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/by-address/${address}`);
            } else {
                const body = toJson(optionsGet);
                //-------------------------
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/by-address/${address}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            //-------------------------
            if (response.status === 200) {
                const datas = await response.json();
                console.log(`[${this._Entity.className()}] - getByAddressApi - response OK`);
                const instances = datas.map((data: any) => this._Entity.fromPlainObject<AddressToFollowEntity>(data));
                console.log(`[${this._Entity.className()}] - getByAddressApi - address: ${address} - len: ${instances.length}`);
                return instances;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - getByAddressApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
