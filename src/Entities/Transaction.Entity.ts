import { type PaymentKeyHash } from 'lucid-cardano';
import 'reflect-metadata';
import { Convertible, TransactionDatum, TransactionRedeemer, asEntity } from '../Commons';
import { BaseEntity } from './Base/Base.Entity';
import {type UTxO } from "lucid-cardano";

@asEntity()
export class TransactionEntity extends BaseEntity {
    protected static _apiRoute: string = 'transactions';
    protected static _className: string = 'Transactions';

    // #region fields

    @Convertible()
    paymentPKH!: PaymentKeyHash;

    @Convertible()
    date!: Date;

    @Convertible()
    type!: string;

    @Convertible()
    hash!: string;

    @Convertible()
    status!: string;

    @Convertible()
    error!: Object;

    // export const TRANSACTION_STATUS_PENDING = 'pending';
    // export const TRANSACTION_STATUS_CANCELED = 'canceled';
    // export const TRANSACTION_STATUS_SUBMITTED = 'submitted';
    // export const TRANSACTION_STATUS_CONFIRMED = 'confirmed';
    // export const TRANSACTION_STATUS_FAILED = 'failed';
    // export const TRANSACTION_STATUS_EXPIRED = 'expired';
    // export const TRANSACTION_STATUS_UNKNOWN = 'unknown';

    @Convertible({ type: Object })
    ids!: Record<string, string>;

    @Convertible({ type: Object })
    redeemers!: Record<string, TransactionRedeemer>;;

    @Convertible({ type: Object })
    datums!: Record<string, TransactionDatum>;

    @Convertible({ type: Object })
    consuming_UTxOs!: UTxO[];

    // #endregion fields
}
