import { console_error } from '../Commons/BackEnd/globalLogs.js';
import { getGlobalTransactionStatusUpdater } from '../Commons/BackEnd/globalTransactionStatusUpdater.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { TRANSACTION_STATUS_FAILED, TRANSACTION_STATUS_SUBMITTED, isFrontEndEnvironment, isNullOrBlank } from '../Commons/index.js';
import { SmartUTxOEntity } from '../Entities/SmartUTxO.Entity.js';
import { TransactionEntity } from '../Entities/Transaction.Entity.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';

@BackEndAppliedFor(TransactionEntity)
export class TransactionBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = TransactionEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async updateFailedTransaction(txHash: string, error: any) {
        //-------------------------
        if (isNullOrBlank(txHash)) {
            throw `txHash not defined`;
        }
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //-------------------------
        const submittedTransaction = await this.getOneByParams_<TransactionEntity>({ hash: txHash });
        if (submittedTransaction === undefined) {
            throw `Transaction not found - hash: ${txHash}`;
        }
        //-------------------------
        submittedTransaction.status = TRANSACTION_STATUS_FAILED;
        submittedTransaction.error = error;
        await this.update(submittedTransaction);
        //-------------------------
        const SmartUTxOBackEndApplied = (await import('./SmartUTxO.BackEnd.Applied.js')).SmartUTxOBackEndApplied;
        //-------------------------
        const consuming_UTxOs = submittedTransaction.consuming_UTxOs;
        for (let consuming_UTxO of consuming_UTxOs) {
            //-------------------------
            const txHash = consuming_UTxO.txHash;
            const outputIndex = consuming_UTxO.outputIndex;
            //-------------------------
            const smartUTxO: SmartUTxOEntity | undefined = await SmartUTxOBackEndApplied.getOneByParams_({ txHash, outputIndex });
            //-------------------------
            if (smartUTxO === undefined) {
                console_error(0, `TxStatus`, `updateFailedTransaction - smartUTxO not found for txHash: ${txHash} - outputIndex: ${outputIndex}`);
            } else {
                //-------------------------
                smartUTxO.isConsuming = undefined;
                smartUTxO.isPreparing = undefined;
                await SmartUTxOBackEndApplied.update(smartUTxO);
                //-------------------------
            }
        }
        //--------------------------------------
    }

    public static async submitAndBeginStatusUpdaterJob(txHash: string, swCheckAgainTxWithTimeOut: boolean = false) {
        //-------------------------
        if (isNullOrBlank(txHash)) {
            throw `txHash not defined`;
        }
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //-------------------------
        const submittedTransaction = await this.getOneByParams_<TransactionEntity>({ hash: txHash });
        if (submittedTransaction === undefined) {
            throw `Transaction not found - hash: ${txHash}`;
        }
        //-------------------------
        submittedTransaction.status = TRANSACTION_STATUS_SUBMITTED;
        await this.update(submittedTransaction);
        //-------------------------
        const SmartUTxOBackEndApplied = (await import('./SmartUTxO.BackEnd.Applied.js')).SmartUTxOBackEndApplied;
        //-------------------------
        const consuming_UTxOs = submittedTransaction.consuming_UTxOs;
        for (let consuming_UTxO of consuming_UTxOs) {
            //-------------------------
            const txHash = consuming_UTxO.txHash;
            const outputIndex = consuming_UTxO.outputIndex;
            //-------------------------
            const smartUTxO: SmartUTxOEntity | undefined = await SmartUTxOBackEndApplied.getOneByParams_({ txHash, outputIndex });
            //-------------------------
            if (smartUTxO === undefined) {
                console_error(0, `TxStatus`, `submitAndBeginStatusUpdaterJob - smartUTxO not found for txHash: ${txHash} - outputIndex: ${outputIndex}`);
            } else {
                //-------------------------
                smartUTxO.isConsuming = submittedTransaction.date;
                smartUTxO.isPreparing = undefined;
                await SmartUTxOBackEndApplied.update(smartUTxO);
                //-------------------------
            }
        }
        //--------------------------------------
        (await getGlobalTransactionStatusUpdater()).startUpdaterJob(swCheckAgainTxWithTimeOut);
        //-------------------------
    }

    public static async beginStatusUpdaterJob(swCheckAgainTxWithTimeOut: boolean = false) {
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //-------------------------
        (await getGlobalTransactionStatusUpdater()).startUpdaterJob(swCheckAgainTxWithTimeOut);
        //-------------------------
        // const serverTime = await TimeBackEnd.getServerTime();
        // //------------------------------------
        // // Set initial time
        // const startTime = serverTime;
        // const maxTime = TX_CONSUMING_TIME; // Maximum time for this to run in milliseconds
        // //-------------------------
        // const unconfirmedTransaction = await this.getOneByParams_<TransactionEntity>({ hash: txHash, status: TRANSACTION_STATUS_SUBMITTED });
        // //-------------------------
        // if (unconfirmedTransaction !== undefined) {
        //     console_log(0, `TxStatus`, `transactionStatusUpdaterJob - unconfirmedTransaction: ${unconfirmedTransaction.hash}`);
        //     // Start checking
        //     while (true) {
        //         // Check if maximum time reached
        //         //-------------------------
        //         const serverTime = await TimeBackEnd.getServerTime();
        //         //------------------------------------
        //         const currentTime = serverTime;
        //         if (currentTime - startTime > maxTime) {
        //             unconfirmedTransaction.status = TRANSACTION_STATUS_TIMEOUT;
        //             await this.update(unconfirmedTransaction);
        //             break;
        //         }
        //         // Check if transaction is confirmed
        //         let isConfirmed: boolean = false;
        //         if (isEmulator) {
        //             isConfirmed = true;
        //             // si es emulador la primera vez que se ejecute este job ya va a retornar confirmed
        //         } else {
        //             isConfirmed = await this.getTxIsConfirmedBlockfrostApi(txHash);
        //         }
        //         if (isConfirmed) {
        //             const LucidToolsBackEnd = (await import('@/src/lib/Lucid/backEnd.js')).LucidToolsBackEnd;
        //             var { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(undefined);
        //             //--------------------------------------
        //             if (process.env.NEXT_PUBLIC_CARDANO_NET !== 'Emulator') {
        //                 // TODO: a veces el api de query tx dice que la transaccion existe, pero el api de tx count no lo refleja
        //                 // agrego esto por las dudas, para dar tiempo a blockfrost actualize sus registros
        //                 await new Promise((resolve) => setTimeout(resolve, 5000));
        //             }
        //             //--------------------------------------
        //             console_log(0, `TxStatus`, `transactionStatusUpdaterJob - unconfirmedTransaction: ${unconfirmedTransaction.hash} - isConfirmed - Syncronizing...`);
        //             // do the sync with blockchain for the addresses in transaction
        //             for (let [index, transactionDatum] of Object.entries(unconfirmedTransaction.datums)) {
        //                 //--------------------------------------
        //                 console_log(0, `TxStatus`, `transactionStatusUpdaterJob - sync address: ${transactionDatum.address} - datumType: ${transactionDatum.datumType}`);
        //                 //--------------------------------------
        //                 const addressesToFollow = await AddressToFollowBackEndApplied.getByAddress(transactionDatum.address);
        //                 if (addressesToFollow.length > 0) {
        //                     //--------------------------------------
        //                     //TODO y si hay mas de una en la misma address? deberia hacer la que coincida tmb el tupo de datum
        //                     const addressToFollow = addressesToFollow[0];
        //                     let datumType = transactionDatum.datumType;
        //                     // const EntityClass = this._SmartDBEntities[datumType];
        //                     const EntityClass = SmartDBEntitiesRegistry.get(datumType);
        //                     if (EntityClass !== undefined) {
        //                         if (isEmulator === true && globalEmulator.emulatorDB === undefined) {
        //                             throw `globalEmulator emulatorDB current not found`;
        //                         }
        //                         await BaseSmartDBBackEndMethods.syncWithAddress(EntityClass, lucid, globalEmulator.emulatorDB, addressToFollow, false, true);
        //                     }
        //                 }
        //                 // Update the transaction status in your database here
        //                 unconfirmedTransaction.status = TRANSACTION_STATUS_CONFIRMED;
        //                 await this.update(unconfirmedTransaction);
        //                 //--------------------------------------
        //             }
        //             break;
        //         } else {
        //             console_log(0, `TxStatus`, `transactionStatusUpdaterJob - unconfirmedTransaction: ${unconfirmedTransaction.hash} - NOT isConfirmed`);
        //         }
        //         // Sleep for 5 seconds before the next iteration
        //         await new Promise((resolve) => setTimeout(resolve, checkInterval));
        //     }
        // }
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
