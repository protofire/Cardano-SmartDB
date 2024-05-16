import { PaymentKeyHash } from "lucid-cardano";
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls.js';
import { isNullOrBlank } from '../../Commons/index.js';
import { WalletEntity } from '../../Entities/Wallet.Entity.js';
import fetchWrapper from "../../lib/FetchWrapper/FetchWrapper.FrontEnd.js";

export class WalletFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = WalletEntity;

    // #region api

    public static async isCoreTeamApi(pkh: PaymentKeyHash): Promise<boolean> {
        try {
            //-------------------------
            if (isNullOrBlank(pkh)) {
                throw `pkh not defined`;
            }
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/is-core-team/${pkh}`);
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - isCoreTeamApi - pkh: ${pkh} - isCoreTeam: ${data.isCoreTeam} - response OK`);
                return data.isCoreTeam;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - isCoreTeamApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
