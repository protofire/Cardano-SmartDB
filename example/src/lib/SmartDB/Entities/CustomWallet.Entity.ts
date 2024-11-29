import { type StakeKeyHash, type PaymentKeyHash } from "lucid-cardano";
import 'reflect-metadata';
import { asEntity, Convertible, WalletEntity } from "smart-db";

@asEntity()
export class CustomWalletEntity extends WalletEntity {
    protected static _apiRoute: string = 'walletsEx';
    protected static _className: string = 'WalletsEx';

    // #region fields

    @Convertible()
    custom!: Date;

    // #endregion fields
}
