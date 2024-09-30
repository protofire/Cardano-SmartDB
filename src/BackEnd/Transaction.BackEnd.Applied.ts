import { addMilliseconds } from 'date-fns';
import { OutRef } from 'lucid-cardano';
import { console_log } from '../Commons/BackEnd/globalLogs.js';
import { getGlobalTransactionStatusUpdater } from '../Commons/BackEnd/globalTransactionStatusUpdater.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import {
    isArrayEmpty,
    isFrontEndEnvironment,
    isNullOrBlank,
    TRANSACTION_STATUS_CONFIRMED,
    TRANSACTION_STATUS_CREATED,
    TRANSACTION_STATUS_FAILED,
    TRANSACTION_STATUS_PENDING,
    TRANSACTION_STATUS_PENDING_TIMEOUT,
    TRANSACTION_STATUS_SUBMITTED,
    TRANSACTION_STATUS_USER_CANCELED,
    TransactionDatum,
    TransactionRedeemer,
    TransactionStatus,
    TX_CONSUMING_TIME,
    TX_PREPARING_TIME,
} from '../Commons/index.js';
import { TransactionEntity } from '../Entities/Transaction.Entity.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';

@BackEndAppliedFor(TransactionEntity)
export class TransactionBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = TransactionEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async getPreparingOrConsuming<T extends TransactionEntity>(): Promise<T[]> {
        //----------------------------
        const TimeBackEnd = (await import('../lib/Time/Time.BackEnd.js')).TimeBackEnd;
        //----------------------------
        console_log(0, this._Entity.className(), `getByOutRefInCurrentUse  - Init`);
        //----------------------------
        let serverTime = await TimeBackEnd.getServerTime();
        //----------------------------
        const query = {
            $and: [
                {
                    $or: [
                        {
                            status: { $in: [TRANSACTION_STATUS_PENDING, TRANSACTION_STATUS_CREATED] },
                            date: { $gte: addMilliseconds(serverTime, -TX_PREPARING_TIME) },
                        },
                        {
                            status: TRANSACTION_STATUS_SUBMITTED,
                            date: { $gte: addMilliseconds(serverTime, -TX_CONSUMING_TIME) },
                        },
                    ],
                },
            ],
        };
        //----------------------------
        const transactions: T[] = await this.getByParams_<T>(query);
        //----------------------------
        return transactions;
    }

    public static async getAvailablesSmartUTxOsForReading(outRefs: OutRef[]): Promise<OutRef[]> {
        //-------------------------
        if (isArrayEmpty(outRefs)) {
            throw `outRefs is empty`;
        }
        //-------------------------
        const freeOutRefs: OutRef[] = [];
        for (const outRef of outRefs) {
            if (isNullOrBlank(outRef.txHash)) {
                throw `outRef txHash is empty`;
            }
            const isFree = await this.isOutRefFreeForReading(outRef);
            if (isFree) {
                freeOutRefs.push(outRef);
            }
        }
        return freeOutRefs;
    }

    public static async getAvailablesSmartUTxOsConsuming(outRefs: OutRef[]): Promise<OutRef[]> {
        //-------------------------
        if (isArrayEmpty(outRefs)) {
            throw `outRefs is empty`;
        }
        //-------------------------
        const freeOutRefs: OutRef[] = [];
        for (const outRef of outRefs) {
            if (isNullOrBlank(outRef.txHash)) {
                throw `outRef txHash is empty`;
            }
            const isFree = await this.isOutRefFreeForConsuming(outRef);
            if (isFree) {
                freeOutRefs.push(outRef);
            }
        }
        return freeOutRefs;
    }

    public static async getFreeOutRefsForReading(outRefs: OutRef[]): Promise<OutRef[]> {
        //-------------------------
        if (isArrayEmpty(outRefs)) {
            throw `outRefs is empty`;
        }
        //-------------------------
        const freeOutRefs: OutRef[] = [];
        for (const outRef of outRefs) {
            if (isNullOrBlank(outRef.txHash)) {
                throw `outRef txHash is empty`;
            }
            const isFree = await this.isOutRefFreeForReading(outRef);
            if (isFree) {
                freeOutRefs.push(outRef);
            }
        }
        return freeOutRefs;
    }

    public static async getFreeOutRefsForConsuming(outRefs: OutRef[]): Promise<OutRef[]> {
        //-------------------------
        if (isArrayEmpty(outRefs)) {
            throw `outRefs is empty`;
        }
        //-------------------------
        const freeOutRefs: OutRef[] = [];
        for (const outRef of outRefs) {
            if (isNullOrBlank(outRef.txHash)) {
                throw `outRef txHash is empty`;
            }
            const isFree = await this.isOutRefFreeForConsuming(outRef);
            if (isFree) {
                freeOutRefs.push(outRef);
            }
        }
        return freeOutRefs;
    }

    public static async isOutRefFreeForReading(outRefToSearch: OutRef): Promise<boolean> {
        //----------------------------
        console_log(0, this._Entity.className(), `isOutRefFreeForReading  - Init`);
        //----------------------------
        if (isNullOrBlank(outRefToSearch.txHash)) {
            throw `outRef txHash is empty`;
        }
        //----------------------------
        const TimeBackEnd = (await import('../lib/Time/Time.BackEnd.js')).TimeBackEnd;
        //----------------------------
        let serverTime = await TimeBackEnd.getServerTime();
        //----------------------------
        const query = {
            $and: [
                {
                    $or: [
                        {
                            status: { $in: [TRANSACTION_STATUS_PENDING, TRANSACTION_STATUS_CREATED] },
                            date: { $gte: addMilliseconds(serverTime, -TX_PREPARING_TIME) }, // Date for PENDING and CREATED
                        },
                        {
                            status: TRANSACTION_STATUS_SUBMITTED,
                            date: { $gte: addMilliseconds(serverTime, -TX_CONSUMING_TIME) }, // Date for SUBMITTED
                        },
                    ],
                },
                {
                    consuming_UTxOs: { $in: [outRefToSearch] }, // Check if OutRef is in consuming_UTxOs array
                },
            ],
        };
        //----------------------------
        const transactions = await this.getByParams_<TransactionEntity>(query);
        //----------------------------
        return transactions.length === 0; // Free for reading if not present in consuming_UTxOs
    }

    public static async isOutRefFreeForConsuming(outRefToSearch: OutRef): Promise<boolean> {
        //----------------------------
        console_log(0, this._Entity.className(), `isOutRefFreeForConsuming  - Init`);
        //----------------------------
        if (isNullOrBlank(outRefToSearch.txHash)) {
            throw `outRef txHash is empty`;
        }
        //----------------------------
        const TimeBackEnd = (await import('../lib/Time/Time.BackEnd.js')).TimeBackEnd;
        //----------------------------
        let serverTime = await TimeBackEnd.getServerTime();
        //----------------------------
        const query = {
            $and: [
                {
                    $or: [
                        {
                            status: { $in: [TRANSACTION_STATUS_PENDING, TRANSACTION_STATUS_CREATED] },
                            date: { $gte: addMilliseconds(serverTime, -TX_PREPARING_TIME) }, // Date for PENDING and CREATED
                        },
                        {
                            status: TRANSACTION_STATUS_SUBMITTED,
                            date: { $gte: addMilliseconds(serverTime, -TX_CONSUMING_TIME) }, // Date for SUBMITTED
                        },
                    ],
                },
                {
                    $or: [
                        { reading_UTxOs: { $in: [outRefToSearch] } }, // Check if OutRef is in reading_UTxOs array
                        { consuming_UTxOs: { $in: [outRefToSearch] } }, // Check if OutRef is in consuming_UTxOs array
                    ],
                },
            ],
        };
        //----------------------------
        const transactions = await this.getByParams_<TransactionEntity>(query);
        //----------------------------
        return transactions.length === 0; // Free for consuming if not present in reading or consuming UTxOs
    }

    public static async getReadingAndConsumingDates(outRefToSearch: OutRef): Promise<{
        isPreparingForReading: Date | undefined;
        isReading: Date | undefined;
        isPreparingForConsuming: Date | undefined;
        isConsuming: Date | undefined;
    }> {
        //----------------------------
        console_log(0, this._Entity.className(), `getReadingAndConsumingDates  - Init`);
        //----------------------------
        if (isNullOrBlank(outRefToSearch.txHash)) {
            throw `outRef txHash is empty`;
        }
        //----------------------------
        const TimeBackEnd = (await import('../lib/Time/Time.BackEnd.js')).TimeBackEnd;
        let serverTime = await TimeBackEnd.getServerTime();
        //----------------------------
        // Query for "preparing" transactions (Pending or Created) for Reading
        const preparingForReadingQuery = {
            $and: [
                {
                    status: { $in: [TRANSACTION_STATUS_PENDING, TRANSACTION_STATUS_CREATED] },
                    date: { $gte: addMilliseconds(serverTime, -TX_PREPARING_TIME) },
                },
                {
                    reading_UTxOs: { $in: [outRefToSearch] }, // Check if OutRef is in reading_UTxOs array
                },
            ],
        };
        // Query for "submitted" transactions for Reading
        const readingQuery = {
            $and: [
                {
                    status: TRANSACTION_STATUS_SUBMITTED,
                    date: { $gte: addMilliseconds(serverTime, -TX_CONSUMING_TIME) },
                },
                {
                    reading_UTxOs: { $in: [outRefToSearch] }, // Check if OutRef is in reading_UTxOs array
                },
            ],
        };
        // Query for "preparing" transactions (Pending or Created) for Consuming
        const preparingForConsumingQuery = {
            $and: [
                {
                    status: { $in: [TRANSACTION_STATUS_PENDING, TRANSACTION_STATUS_CREATED] },
                    date: { $gte: addMilliseconds(serverTime, -TX_PREPARING_TIME) },
                },
                {
                    consuming_UTxOs: { $in: [outRefToSearch] }, // Check if OutRef is in consuming_UTxOs array
                },
            ],
        };
        // Query for "submitted" transactions for Consuming
        const consumingQuery = {
            $and: [
                {
                    status: TRANSACTION_STATUS_SUBMITTED,
                    date: { $gte: addMilliseconds(serverTime, -TX_CONSUMING_TIME) },
                },
                {
                    consuming_UTxOs: { $in: [outRefToSearch] }, // Check if OutRef is in consuming_UTxOs array
                },
            ],
        };
        //----------------------------
        // Get the oldest transaction for each case, sorted by date
        const [preparingForReadingTx, readingTx, preparingForConsumingTx, consumingTx] = await Promise.all([
            this.getByParams_<TransactionEntity>(preparingForReadingQuery, { sort: { date: 1 }, limit: 1 }),
            this.getByParams_<TransactionEntity>(readingQuery, { sort: { date: 1 }, limit: 1 }),
            this.getByParams_<TransactionEntity>(preparingForConsumingQuery, { sort: { date: 1 }, limit: 1 }),
            this.getByParams_<TransactionEntity>(consumingQuery, { sort: { date: 1 }, limit: 1 }),
        ]);
        //----------------------------
        // Extract the dates or return undefined
        const isPreparingForReading = preparingForReadingTx.length > 0 ? preparingForReadingTx[0].date : undefined;
        const isReading = readingTx.length > 0 ? readingTx[0].date : undefined;
        const isPreparingForConsuming = preparingForConsumingTx.length > 0 ? preparingForConsumingTx[0].date : undefined;
        const isConsuming = consumingTx.length > 0 ? consumingTx[0].date : undefined;
        //----------------------------
        // Return the four dates
        return {
            isPreparingForReading,
            isReading,
            isPreparingForConsuming,
            isConsuming,
        };
    }

    public static async setPendingTransaction(
        createdTransaction: TransactionEntity,
        fields: { hash: string; ids: Record<string, string>; redeemers: Record<string, TransactionRedeemer>; datums: Record<string, TransactionDatum> }
    ) {
        //-------------------------
        createdTransaction.hash = fields.hash;
        createdTransaction.ids = fields.ids;
        createdTransaction.redeemers = fields.redeemers;
        createdTransaction.datums = fields.datums;
        createdTransaction.status = TRANSACTION_STATUS_PENDING;
        //-------------------------
        await this.update(createdTransaction);
    }

    public static async setPendingTransactionTimeoutByHash(txHash: string) {
        await this.updateTransactionStatusByHash(txHash, TRANSACTION_STATUS_PENDING_TIMEOUT);
    }

    public static async setPendingTransactionTimeout(pendingTransaction: TransactionEntity) {
        await this.updateTransactionStatus(pendingTransaction, TRANSACTION_STATUS_PENDING_TIMEOUT);
    }

    public static async setCanceledTransactionByHash(txHash: string, error: any) {
        await this.updateTransactionStatusByHash(txHash, TRANSACTION_STATUS_USER_CANCELED, error);
    }

    public static async setCanceledTransaction(pendingTransaction: TransactionEntity, error: any) {
        await this.updateTransactionStatus(pendingTransaction, TRANSACTION_STATUS_USER_CANCELED, error);
    }

    public static async setSubmittedTransactionByHash(txHash: string) {
        await this.updateTransactionStatusByHash(txHash, TRANSACTION_STATUS_SUBMITTED);
    }

    public static async setSubmittedTransaction(pendingTransaction: TransactionEntity) {
        await this.updateTransactionStatus(pendingTransaction, TRANSACTION_STATUS_SUBMITTED);
    }

    public static async setFailedTransactionByHash(txHash: string, error: any) {
        await this.updateTransactionStatusByHash(txHash, TRANSACTION_STATUS_FAILED, error);
    }

    public static async setFailedTransaction(submittedTransaction: TransactionEntity, error: any) {
        await this.updateTransactionStatus(submittedTransaction, TRANSACTION_STATUS_FAILED, error);
    }

    public static async setConfirmedTransactionByHash(txHash: string) {
        await this.updateTransactionStatusByHash(txHash, TRANSACTION_STATUS_CONFIRMED);
    }

    public static async setConfirmedTransaction(submittedTransaction: TransactionEntity) {
        await this.updateTransactionStatus(submittedTransaction, TRANSACTION_STATUS_CONFIRMED);
    }

    public static async updateTransactionStatusByHash(txHash: string, status: TransactionStatus, error?: any) {
        //-------------------------
        if (isNullOrBlank(txHash)) {
            throw `txHash not defined`;
        }
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //-------------------------
        const transaction = await this.getOneByParams_<TransactionEntity>({ hash: txHash });
        if (transaction === undefined) {
            throw `Transaction not found - hash: ${txHash}`;
        }
        //-------------------------
        await this.updateTransactionStatus(transaction, status, error);
        //--------------------------------------
    }

    public static async updateTransactionStatus(transaction: TransactionEntity, status: TransactionStatus, error?: any) {
        //-------------------------
        transaction.status = status;
        if (error !== undefined) {
            transaction.error = error;
        }
        //-------------------------
        await this.update(transaction);
        //-------------------------
    }

    public static async beginStatusUpdaterJob(swCheckAgainTxWithTimeOut: boolean = false) {
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        (await getGlobalTransactionStatusUpdater()).startUpdaterJob(swCheckAgainTxWithTimeOut);
        //-------------------------
    }

    public static async transactionStatusUpdater(txHash: string) {
        //-------------------------
        if (isNullOrBlank(txHash)) {
            throw `txHash not defined`;
        }
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        try {
            //-------------------------
            const submittedTransaction = await this.getOneByParams_<TransactionEntity>({ hash: txHash });
            if (submittedTransaction === undefined) {
                throw `Transaction not found - hash: ${txHash}`;
            }
            //-------------------------
            await (await getGlobalTransactionStatusUpdater()).transactionUpdater(txHash);
            //-------------------------
        } catch (error) {
            throw `${error}`;
        }
    }

    public static async getTransactionStatus(txHash: string): Promise<string | undefined> {
        //-------------------------
        if (isNullOrBlank(txHash)) {
            throw `txHash not defined`;
        }
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //-------------------------
        const transaction = await this.getOneByParams_<TransactionEntity>({ hash: txHash });
        //-------------------------
        return transaction?.status;
    }

    // #endregion class methods
}
