import { WalletTxParams } from '../../../Commons/index.js';
import { BaseSmartDBEntity } from '../../../Entities/Base/Base.SmartDB.Entity.js';
import { BaseSmartDBFrontEndApiCalls } from './Base.SmartDB.FrontEnd.Api.Calls.js';

// es generica, todos los metodos llevan instancia o entidad como parametro
// todas las clases la pueden usar
export class BaseSmartDBFrontEndTxApiCalls extends BaseSmartDBFrontEndApiCalls {
    // #region api applied to entity

    public static async callGenericTxApi_<T extends BaseSmartDBEntity>(
        apiRoute: string,
        walletTxParams: WalletTxParams,
        txParams: Record<string, any>
    ): Promise<{ txHash: string; txCborHex: string }> {
        return await this.callGenericTxApi(this._Entity, apiRoute, walletTxParams, txParams);
    }
    // #endregion api applied to entity

    // #region api

    public static async callGenericTxApi(
        Entity: typeof BaseSmartDBEntity,
        txApiRoute: string,
        walletTxParams: WalletTxParams,
        txParams: Record<string, any>
    ): Promise<{ txHash: string; txCborHex: string }> {
        try {
            if (txParams === undefined) {
                throw `txParams not defined`;
            }
            const params = { walletTxParams, txParams };
            const data = await this.callGenericPOSTApi_('tx/' + txApiRoute, params);
            return data;
        } catch (error) {
            console.log(`[${Entity.apiRoute()}] - callTxApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
