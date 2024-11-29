import { PaymentKeyHash } from "lucid-cardano";
import { CustomWalletEntity } from "../Entities/CustomWallet.Entity";
import { BaseFrontEndApiCalls, fetchWrapper, isNullOrBlank, WalletFrontEndApiCalls } from "smart-db";

export class CustomWalletFrontEndApiCalls extends WalletFrontEndApiCalls {
    protected static _Entity = CustomWalletEntity;

    // #region api


    // #endregion api
}
