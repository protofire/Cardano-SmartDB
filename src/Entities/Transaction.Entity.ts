import { OutRef, type PaymentKeyHash } from '@lucid-evolution/lucid';
import 'reflect-metadata';
import { Convertible, TransactionDatum, TransactionRedeemer, asEntity } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';
import { type UTxO } from '@lucid-evolution/lucid';

@asEntity()
export class TransactionEntity extends BaseEntity {
    protected static _apiRoute: string = 'transactions';
    protected static _className: string = 'Transactions';

    // #region fields

    @Convertible()
    hash!: string;

    @Convertible()
    paymentPKH!: PaymentKeyHash;

    @Convertible()
    date!: Date;

    @Convertible()
    type!: string;

    @Convertible()
    status!: string;

    @Convertible()
    error!: Object;

    @Convertible()
    parse_info!: string;

    @Convertible({ type: Object })
    ids!: Record<string, string | undefined>;

    @Convertible({ type: Object })
    redeemers!: Record<string, TransactionRedeemer>;

    @Convertible({ type: Object })
    datums!: Record<string, TransactionDatum>;

    @Convertible({ type: Object })
    consuming_UTxOs!: UTxO[];

    @Convertible({ type: Object })
    reading_UTxOs!: UTxO[];

    @Convertible()
    valid_from?: number;

    @Convertible()
    valid_until?: number;

    @Convertible()
    unit_mem?: number;

    @Convertible()
    unit_steps?: number;

    @Convertible()
    fee?: number;

    @Convertible()
    size?: number;

    @Convertible()
    CBORHex?: string;

    @Convertible({ isCreatedAt: true })
    createdAt!: Date;

    @Convertible({ isUpdatedAt: true })
    updatedAt!: Date;

    // #endregion fields

    // #region  db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...super.alwaysFieldsForSelect,
        paymentPKH: true,
        date: true,
        type: true,
        hash: true,
        status: true,
        error: true,
        parse_info: true,
        ids: true,
        redeemers: true,
        datums: true,
        consuming_UTxOs: true,
        reading_UTxOs: true,
        valid_from: true,
        valid_until: true,
        unit_mem: true,
        unit_steps: true,
        fee: true,
        CBORHex: true,
        createdAt: true,
        updatedAt: true,
    };

    // #endregion  db
}
