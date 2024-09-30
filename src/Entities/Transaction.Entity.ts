import { OutRef, type PaymentKeyHash } from 'lucid-cardano';
import 'reflect-metadata';
import { Convertible, TransactionDatum, TransactionRedeemer, asEntity } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';
import {type UTxO } from "lucid-cardano";

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

    @Convertible({ type: Object })
    ids!: Record<string, string>;

    @Convertible({ type: Object })
    redeemers!: Record<string, TransactionRedeemer>;;

    @Convertible({ type: Object })
    datums!: Record<string, TransactionDatum>;

    @Convertible({ type: Object })
    consuming_UTxOs!: OutRef[];

    @Convertible({ type: Object })
    reading_UTxOs!: OutRef[];

    @Convertible()
    createdAt!: Date;

    @Convertible()
    updatedAt!: Date;

    // #endregion fields
}
