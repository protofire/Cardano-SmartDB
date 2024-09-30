import fetchWrapper from '../../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
import { createQueryURLString, isNullOrBlank, toJson } from '../../Commons/index.js';
import { TransactionEntity } from '../../Entities/Transaction.Entity.js';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls.js';

export class TransactionFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = TransactionEntity;

    // #region api

    public static async updateCanceledTransactionApi(txHash: string, error: Record<string, any>): Promise<boolean> {
        try {
            //-------------------------
            if (isNullOrBlank(txHash)) {
                throw `txHash not defined`;
            }
            //------------------
            const body = toJson({ error });
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/update-cenceled-transaction/${txHash}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            //------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - updateCanceledTransactionApi - isStarted: ${data.isUpdated} - response OK`);
                return data.isUpdated;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - updateCanceledTransactionApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async updateFailedTransactionApi(txHash: string, error: Record<string, any>): Promise<boolean> {
        try {
            //-------------------------
            if (isNullOrBlank(txHash)) {
                throw `txHash not defined`;
            }
            //------------------
            const body = toJson({ error });
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/update-failed-transaction/${txHash}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            //------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - updateFailedTransactionApi - isStarted: ${data.isUpdated} - response OK`);
                return data.isUpdated;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - updateFailedTransactionApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async beginStatusUpdaterJobApi(swCheckAgainTxWithTimeOut: boolean = false): Promise<boolean> {
        try {
            //------------------
            const queryString = createQueryURLString({ swCheckAgainTxWithTimeOut });
            //------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/begin-status-updater${queryString}`);
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - beginStatusUpdaterJobApi - isStarted: ${data.isStarted} - response OK`);
                return data.isStarted;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - beginStatusUpdaterJobApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async submitAndBeginStatusUpdaterJobApi(txHash: string): Promise<boolean> {
        try {
            //-------------------------
            if (isNullOrBlank(txHash)) {
                throw `txHash not defined`;
            }
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/submit-and-begin-status-updater/${txHash}`);
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - transactionSubmitAndStatusUpdaterJobApi - isStarted: ${data.isStarted} - response OK`);
                return data.isStarted;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - transactionSubmitAndStatusUpdaterJobApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async transactionStatusUpdaterApi(txHash: string): Promise<boolean> {
        try {
            //-------------------------
            if (isNullOrBlank(txHash)) {
                throw `txHash not defined`;
            }
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/status-updater/${txHash}`);
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - transactionStatusUpdaterApi - isUpdated: ${data.isUpdated} - response OK`);
                return data.isUpdated;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - transactionStatusUpdaterApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getTransactionStatusApi(txHash: string): Promise<string | undefined> {
        try {
            //-------------------------
            if (isNullOrBlank(txHash)) {
                throw `txHash not defined`;
            }
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/get-status/${txHash}`);
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - getTransactionStatusApi - txStatus: ${data.txStatus} - response OK`);
                return data.txStatus;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - getTransactionStatusApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
