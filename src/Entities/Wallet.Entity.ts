import { type StakeKeyHash, type PaymentKeyHash } from '@lucid-evolution/lucid';
import 'reflect-metadata';
import { Convertible, asEntity } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';

@asEntity()
export class WalletEntity extends BaseEntity {
    protected static _apiRoute: string = 'wallets';
    protected static _className: string = 'Wallets';

    // #region fields

    @Convertible()
    walletName!: string;

    @Convertible()
    walletValidatedWithSignedToken!: boolean;

    @Convertible()
    paymentPKH!: PaymentKeyHash;

    @Convertible()
    stakePKH!: StakeKeyHash;

    @Convertible()
    name!: string;

    @Convertible()
    email!: string;

    @Convertible()
    isCoreTeam!: boolean;

    @Convertible()
    testnet_address!: string;

    @Convertible()
    mainnet_address!: string;

    @Convertible()
    createdBy!: string;

    @Convertible()
    lastConnection!: Date;

    @Convertible({ isCreatedAt: true })
    createdAt!: Date;

    @Convertible({ isUpdatedAt: true })
    updatedAt!: Date;

    // #endregion fields
}
