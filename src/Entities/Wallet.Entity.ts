import { type StakeKeyHash, type PaymentKeyHash } from "lucid-cardano";
import 'reflect-metadata';
import { Convertible, asEntity } from '../Commons';
import { BaseEntity } from './Base/Base.Entity';

//FIXME no puede derivar normalMayz por que normal MAYZ usa WalletEntity para controlar y se arma dependencia circular

@asEntity()
export class WalletEntity extends BaseEntity {
    protected static _apiRoute: string = 'wallets';
    protected static _className: string = 'Wallets';

    // #region fields

    @Convertible()
    createdAt!: Date;

    @Convertible()
    createdBy!: string;

    @Convertible()
    lastConnection!: Date;

    @Convertible()
    walletUsed!: string;

    @Convertible()
    walletValidatedWithSignedToken!: boolean;

    @Convertible()
    paymentPKH!: PaymentKeyHash;

    @Convertible()
    stakePKH!: StakeKeyHash;
    
    @Convertible()
    name!: PaymentKeyHash;

    @Convertible()
    email!: string;

    @Convertible()
    isCoreTeam!: boolean;

    @Convertible()
    testnet_address!: string;

    @Convertible()
    mainnet_address!: string;

    // #endregion fields
}
