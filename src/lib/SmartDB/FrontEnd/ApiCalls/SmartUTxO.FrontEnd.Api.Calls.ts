import { isEqual, isNullOrBlank, toJson } from '@/src/utils/commons/utils';
import { OptionsGet, OptionsGetOne, optionsGetDefault, optionsGetOneDefault } from '../../Commons';
import { formatUTxO } from '../../Commons/helpers';
import { SmartUTxOEntity } from '../../Entities/SmartUTxO.Entity';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls';

export class SmartUTxOFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = SmartUTxOEntity;

    // #region api

    public static async getByAddressApi<T extends SmartUTxOEntity>(address: string, optionsGet?: OptionsGet): Promise<T[]> {
        try {
            if (isNullOrBlank(address)) {
                throw `address not defined`;
            }
            //------------------
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/by-address/${address}`);
            } else {
                const body = toJson(optionsGet);
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/by-address/${address}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            //------------------
            if (response.status === 200) {
                const datas = await response.json();
                console.log(`[${this._Entity.className()}] - getByAddressApi - response OK`);
                const instances = datas.map((data: any) => this._Entity.fromPlainObject<T>(data));
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

    public static async getByTxHashAndOutputIndexApi<T extends SmartUTxOEntity>(txHash: string, outputIndex: number, optionsGet?: OptionsGetOne): Promise<T | undefined> {
        try {
            if (txHash === undefined || txHash === '' || outputIndex === undefined || outputIndex < 0) {
                throw `txHash or outputIndex not defined`;
            }
            //-------------------------
            let response;
            if (isEqual(optionsGet, optionsGetOneDefault)) {
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/by-txhash-idx/${txHash}/${outputIndex}`);
            } else {
                const body = toJson(optionsGet);
                //-------------------------
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/by-txhash-idx/${txHash}/${outputIndex}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - getByTxHashAndOutputIndexApi - response OK`);
                const instance = this._Entity.fromPlainObject<T>(data);
                console.log(`[${this._Entity.className()}] - getByTxHashAndOutputIndexApi - tx: ${formatUTxO(txHash, outputIndex)} - Instance: ${instance.show()}`);
                return instance;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - getByTxHashAndOutputIndexApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
