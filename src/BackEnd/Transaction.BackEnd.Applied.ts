import { console_error } from '../Commons/BackEnd/globalLogs.js';
import { getGlobalTransactionStatusUpdater } from '../Commons/BackEnd/globalTransactionStatusUpdater.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import {
    TRANSACTION_STATUS_CONFIRMED,
    TRANSACTION_STATUS_FAILED,
    TRANSACTION_STATUS_PENDING,
    TRANSACTION_STATUS_SUBMITTED,
    TransactionStatus,
    isFrontEndEnvironment,
    isNullOrBlank,
} from '../Commons/index.js';
import { SmartUTxOEntity } from '../Entities/SmartUTxO.Entity.js';
import { TransactionEntity } from '../Entities/Transaction.Entity.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';

@BackEndAppliedFor(TransactionEntity)
export class TransactionBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = TransactionEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async updateUTxOs(transaction: TransactionEntity, isPreparing?: Date, isConsuming?: Date) {
        //-------------------------
        const SmartUTxOBackEndApplied = (await import('./SmartUTxO.BackEnd.Applied.js')).SmartUTxOBackEndApplied;
        //-------------------------
        const consuming_UTxOs = transaction.consuming_UTxOs;
        //-------------------------
        for (let consuming_UTxO of consuming_UTxOs) {
            //-------------------------
            const txHash = consuming_UTxO.txHash;
            const outputIndex = consuming_UTxO.outputIndex;
            //-------------------------
            const smartUTxO: SmartUTxOEntity | undefined = await SmartUTxOBackEndApplied.getOneByParams_({ txHash, outputIndex });
            //-------------------------
            if (smartUTxO === undefined) {
                console_error(0, `TxStatus`, `UpdaterJob - smartUTxO not found for txHash: ${txHash} - outputIndex: ${outputIndex}`);
            } else {
                //-------------------------
                smartUTxO.isConsuming = isConsuming;
                smartUTxO.isPreparing = isPreparing;
                await SmartUTxOBackEndApplied.update(smartUTxO);
            }
        }
    }

    public static async relseaseUTxOs(transaction: TransactionEntity) {
        await this.updateUTxOs(transaction, undefined, undefined);
    }

    public static async setPendingTransactionByHash(txHash: string) {
        await this.updateTransactionStatusAndUTxOsByHash(txHash, TRANSACTION_STATUS_PENDING);
    }

    public static async setPendingTransaction(createdTransaction: TransactionEntity) {
        await this.updateTransactionStatusAndUTxOs(createdTransaction, TRANSACTION_STATUS_PENDING);
    }

    public static async setSubmittedTransactionByHash(txHash: string) {
        await this.updateTransactionStatusAndUTxOsByHash(txHash, TRANSACTION_STATUS_SUBMITTED);
    }

    public static async setSubmittedTransaction(pendingTransaction: TransactionEntity) {
        await this.updateTransactionStatusAndUTxOs(pendingTransaction, TRANSACTION_STATUS_SUBMITTED);
    }

    public static async setFailedTransactionByHash(txHash: string, error: any) {
        await this.updateTransactionStatusAndUTxOsByHash(txHash, TRANSACTION_STATUS_FAILED, error);
    }

    public static async setFailedTransaction(submittedTransaction: TransactionEntity, error: any) {
        await this.updateTransactionStatusAndUTxOs(submittedTransaction, TRANSACTION_STATUS_FAILED, error);
    }

    public static async setConfirmedTransactionByHash(txHash: string) {
        await this.updateTransactionStatusAndUTxOsByHash(txHash, TRANSACTION_STATUS_CONFIRMED);
    }

    public static async setConfirmedTransaction(submittedTransaction: TransactionEntity) {
        await this.updateTransactionStatusAndUTxOs(submittedTransaction, TRANSACTION_STATUS_CONFIRMED);
    }

    public static async updateTransactionStatusAndUTxOsByHash(txHash: string, status: TransactionStatus, error?: any) {
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
        await this.updateTransactionStatusAndUTxOs(transaction, status, error);
        //--------------------------------------
    }

    public static async updateTransactionStatusAndUTxOs(transaction: TransactionEntity, status: TransactionStatus, error?: any) {
        //-------------------------
        transaction.status = status;
        if (error !== undefined){
            transaction.error = error;
        }
        //-------------------------
        switch (status) {
            case TRANSACTION_STATUS_PENDING:
                await this.updateUTxOs(transaction, transaction.date);
                break;
            case TRANSACTION_STATUS_SUBMITTED:
                await this.updateUTxOs(transaction, undefined, transaction.date);
                break;
            default:
                await this.relseaseUTxOs(transaction);
                break;
        }
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
