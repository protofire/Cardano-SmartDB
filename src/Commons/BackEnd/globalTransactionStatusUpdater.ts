import { AddressToFollowEntity } from '../../Entities/AddressToFollow.Entity.js';
import { TransactionEntity } from '../../Entities/Transaction.Entity.js';
import {
    isEmulator,
    TRANSACTION_STATUS_CONFIRMED,
    TRANSACTION_STATUS_PENDING,
    TRANSACTION_STATUS_SUBMITTED,
    TRANSACTION_STATUS_TIMEOUT,
    TX_CHECK_INTERVAL_MS,
    TX_CONSUMING_TIME_MS,
    TX_PREPARING_TIME_MS,
    TX_TIMEOUT_MS,
    TX_PROPAGATION_DELAY_MS,
    TRANSACTION_STATUS_PENDING_TIMEOUT,
    TRANSACTION_STATUS_FAILED,
    TRANSACTION_STATUS_CANCELED,
    TRANSACTION_STATUS_CREATED,
    TX_SIMULATION_SLEEP_TIME_MS,
} from '../Constants/constants.js';
import { RegistryManager } from '../Decorators/registerManager.js';
import { sleep, showData, toJson } from '../utils.js';
import { globalEmulator } from './globalEmulator.js';
import { console_error, console_log } from './globalLogs.js';

export class TransactionStatusUpdater {
    private isRunning = false;

    public async transactionUpdater(txHash: string) {
        //-------------------------
        console_log(0, `TxStatus`, `transactionUpdater - Init`);
        try {
            //-------------------------
            const TransactionBackEndApplied = (await import('../../BackEnd/Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
            //-------------------------
            // revisa cualquier estado menos las que ya han sido confirmadas ni las que estan en proceso de creacion
            //-------------------------
            const unconfirmedTransaction: TransactionEntity | undefined = await TransactionBackEndApplied.getOneByParams_({
                hash: txHash,
                status: { $nin: [TRANSACTION_STATUS_CONFIRMED, TRANSACTION_STATUS_CREATED, TRANSACTION_STATUS_CANCELED] },
            });
            //-------------------------
            if (unconfirmedTransaction === undefined) {
                throw `unconfirmedTransaction not found for hash: ${txHash}`;
            }
            //-------------------------
            await this.updateUnconfirmedTransactions([unconfirmedTransaction]);
            //-------------------------
        } catch (error) {
            console_error(0, `TxStatus`, `transactionUpdater - Error: ${error}`);
            throw error;
        }
    }

    public async startUpdaterJob(swCheckAgainTxTimeOut: boolean = false, swCheckAgainTxPendingTimeOut: boolean = false, swCheckAgainTxFailed: boolean = false) {
        if (this.isRunning) {
            console_log(0, `TxStatus`, `startUpdaterJob - Already Running...`);
            return;
        }
        console_log(0, `TxStatus`, `startUpdaterJob - Start`);
        this.isRunning = true;
        try {
            //-------------------------
            const TransactionBackEndApplied = (await import('../../BackEnd/Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
            //-------------------------
            // busco transacciones submitted que ya hayan pasado el time out, y las pongo en timeout
            // hago lo mismo con las utxo que esten en consuming, dentro de esa transaccion, y las pongo en normal
            //-------------------------
            while (true) {
                //-------------------------
                try {
                    //-------------------------
                    // busco transacciones pending que ya hayan pasado el time out, y las pongo en canceladas
                    // hago lo mismo con las utxo que esten en pending, dentro de esa transaccion, y las pongo en normal
                    //-------------------------
                    const pendingTransactions: TransactionEntity[] = await TransactionBackEndApplied.getByParams_({ status: TRANSACTION_STATUS_PENDING });
                    //-------------------------
                    const unconfirmedTransactions: TransactionEntity[] = await TransactionBackEndApplied.getByParams_({ status: TRANSACTION_STATUS_SUBMITTED });
                    //-------------------------
                    if (swCheckAgainTxTimeOut === true || swCheckAgainTxPendingTimeOut === true || swCheckAgainTxFailed === true) {
                        //-------------------------
                        const statusConditions: any[] = [];
                        //-------------------------
                        if (swCheckAgainTxTimeOut === true) {
                            statusConditions.push({ status: TRANSACTION_STATUS_TIMEOUT });
                        }
                        if (swCheckAgainTxPendingTimeOut === true) {
                            statusConditions.push({ status: TRANSACTION_STATUS_PENDING_TIMEOUT });
                        }
                        if (swCheckAgainTxFailed === true) {
                            statusConditions.push({ status: TRANSACTION_STATUS_FAILED });
                        }
                        //-------------------------
                        const timeoutCanceledOrFailedTransactions: TransactionEntity[] = await TransactionBackEndApplied.getByParams_({
                            $or: statusConditions,
                        });
                        //-------------------------
                        unconfirmedTransactions.push(...timeoutCanceledOrFailedTransactions); // Assuming unconfirmedTransactions is defined elsewhere
                        //-------------------------
                        // Reset flags
                        swCheckAgainTxTimeOut = false;
                        swCheckAgainTxPendingTimeOut = false;
                        swCheckAgainTxFailed = false;
                    }
                    //-------------------------
                    if (unconfirmedTransactions.length === 0 && pendingTransactions.length === 0) {
                        console_log(0, `TxStatus`, `startUpdaterJob - Finish`);
                        break;
                    }
                    //-------------------------
                    await this.updatePendingTransactions(pendingTransactions);
                    //-------------------------
                    await this.updateUnconfirmedTransactions(unconfirmedTransactions);
                    //-------------------------
                } catch (error) {
                    console_error(0, `TxStatus`, `startUpdaterJob - Error: ${error} - Retrying...`);
                }
                // Sleep before the next iteration
                await sleep(TX_CHECK_INTERVAL_MS);
                //-------------------------
            }
        } catch (error) {
            console_error(0, `TxStatus`, `startUpdaterJob - Error: ${error}`);
            throw error;
        } finally {
            this.isRunning = false;
        }
        //--------------------------------------
    }

    private async updatePendingTransactions(pendingTransactions: TransactionEntity[]) {
        //-------------------------
        const TimeBackEnd = (await import('../../lib/Time/Time.BackEnd.js')).TimeBackEnd;
        const TransactionBackEndApplied = (await import('../../BackEnd/Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
        //-------------------------
        console_log(0, `TxStatus`, `updatePendingTransactions - ${pendingTransactions.length} pendingTransactions`);
        //-------------------------
        let serverTime = await TimeBackEnd.getServerTime();
        //-------------------------
        for (let pendingTransaction of pendingTransactions) {
            try {
                const currentTime = serverTime;
                if (currentTime - pendingTransaction.date.getTime() > TX_PREPARING_TIME_MS) {
                    //-------------------------
                    await TransactionBackEndApplied.setPendingTransactionTimeout(pendingTransaction);
                    //-------------------------
                }
            } catch (error) {
                console_error(0, `TxStatus`, `updatePendingTransactions - Error: ${error}`);
            }
        }
    }

    private async updateUnconfirmedTransactions(unconfirmedTransactions: TransactionEntity[]) {
        //-------------------------
        const AddressToFollowBackEndApplied = (await import('../../BackEnd/AddressToFollow.BackEnd.Applied.js')).AddressToFollowBackEndApplied;
        const TransactionBackEndApplied = (await import('../../BackEnd/Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
        const BaseSmartDBBackEndMethods = (await import('../../BackEnd/Base/Base.SmartDB.BackEnd.Methods.js')).BaseSmartDBBackEndMethods;
        const LucidToolsBackEnd = (await import('../../lib/Lucid/backEnd.js')).LucidToolsBackEnd;
        const TimeBackEnd = (await import('../../lib/Time/Time.BackEnd.js')).TimeBackEnd;
        const BlockFrostBackEnd = (await import('../../lib/BlockFrost/BlockFrost.BackEnd.js')).BlockFrostBackEnd;
        //-------------------------
        console_log(0, `TxStatus`, `updateUnconfirmedTransactions - ${unconfirmedTransactions.length} unconfirmedTransactions`);
        //-------------------------
        let serverTime = await TimeBackEnd.getServerTime();
        //-------------------------
        const confirmedTransactions: TransactionEntity[] = [];
        //-------------------------
        for (let unconfirmedTransaction of unconfirmedTransactions) {
            try {
                //-------------------------
                console_log(0, `TxStatus`, `updateUnconfirmedTransactions - unconfirmedTransaction: ${unconfirmedTransaction.hash}`);
                //-------------------------
                // Check if transaction is confirmed
                let isConfirmed: boolean = false;
                //-------------------------
                if (isEmulator) {
                    if (unconfirmedTransaction.status === TRANSACTION_STATUS_SUBMITTED) {
                        //-------------------------
                        console_log(0, `TxStatus`, `updateUnconfirmedTransactions - confirming transaction in emulator: ${unconfirmedTransaction.hash}`);
                        //-------------------------
                        isConfirmed = true;
                        //-------------------------
                        await sleep(TX_SIMULATION_SLEEP_TIME_MS);
                        //-------------------------
                    }
                    // si es emulador la primera vez que se ejecute este job ya va a retornar confirmed, agrego un tiempo solo para simular un poco
                } else {
                    isConfirmed = await BlockFrostBackEnd.getTxIsConfirmed_Api(unconfirmedTransaction.hash);
                }
                if (isConfirmed) {
                    //--------------------------------------
                    console_log(0, `TxStatus`, `updateUnconfirmedTransactions - transaction: ${unconfirmedTransaction.hash} - isConfirmed - Syncronizing...`);
                    confirmedTransactions.push(unconfirmedTransaction);
                    //--------------------------------------
                } else {
                    console_log(0, `TxStatus`, `updateUnconfirmedTransactions - transaction: ${unconfirmedTransaction.hash} - isPending`);
                }
            } catch (error) {
                console_error(0, `TxStatus`, `updateUnconfirmedTransactions - Error: ${error}`);
            }
        }
        if (confirmedTransactions.length > 0) {
            //--------------------------------------
            // tengo que hacer el sync solo una vez por address
            const addressesAndDatums: { address: string; datumType: string | undefined }[] = confirmedTransactions
                .map((transaction) => {
                    const datums = Object.keys(transaction.datums);
                    return datums.map((datum) => {
                        return { address: transaction.datums[datum].address, datumType: transaction.datums[datum].datumType };
                    });
                })
                .flat();
            //--------------------------------------
            console_log(0, `TxStatus`, `updateUnconfirmedTransactions - addressesAndDatums: ${showData(addressesAndDatums, false)}`);
            //--------------------------------------
            //get unique addresses and datumType
            const uniqueAddressesAndDatums: { address: string; datumType: string | undefined }[] = Array.from(
                new Set(addressesAndDatums.map((addressAndDatum) => toJson(addressAndDatum)))
            ).map((addressAndDatum) => JSON.parse(addressAndDatum));
            //--------------------------------------
            console_log(0, `TxStatus`, `updateUnconfirmedTransactions - uniqueAddressesAndDatums: ${showData(uniqueAddressesAndDatums, false)}`);
            //--------------------------------------
            var { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(undefined);
            //--------------------------------------
            if (!isEmulator) {
                // NOTE: a veces el api de query tx dice que la transaccion existe, pero el api de tx count no lo refleja
                // agrego esto por las dudas, para dar tiempo a blockfrost actualize sus registros
                await sleep(TX_PROPAGATION_DELAY_MS);
            }
            //--------------------------------------
            const processedAddresses: {
                address: string;
                datumType: string | undefined;
            }[] = [];
            // do the sync with blockchain for the addresses in transaction
            for (let addressAndDatumType of uniqueAddressesAndDatums) {
                //--------------------------------------
                try {
                    console_log(0, `TxStatus`, `updateUnconfirmedTransactions - sync address: ${addressAndDatumType.address} - datumType: ${addressAndDatumType.datumType} - init`);
                    //--------------------------------------
                    const addressesToFollow: AddressToFollowEntity[] = await AddressToFollowBackEndApplied.getByParams_({
                        address: addressAndDatumType.address,
                        datumType: addressAndDatumType.datumType,
                    });
                    //--------------------------------------
                    if (addressesToFollow.length > 0) {
                        //--------------------------------------
                        for (let addressToFollow of addressesToFollow) {
                            //--------------------------------------
                            console_log(0, `TxStatus`, `updateUnconfirmedTransactions - sync address: ${addressToFollow.address} - datumType: ${addressToFollow.datumType} - init`);
                            //--------------------------------------
                            let datumType = addressToFollow.datumType;
                            //--------------------------------------
                            const EntityClass = RegistryManager.getFromSmartDBEntitiesRegistry(datumType);
                            //--------------------------------------
                            if (EntityClass !== undefined) {
                                if (isEmulator === true && globalEmulator.emulatorDB === undefined) {
                                    throw `globalEmulator emulatorDB current not found`;
                                }
                                await BaseSmartDBBackEndMethods.syncWithAddress(EntityClass, lucid, globalEmulator.emulatorDB, addressToFollow, false, true);
                            }
                        }
                    }
                    //--------------------------------------
                    processedAddresses.push(addressAndDatumType);
                    //--------------------------------------
                    console_log(
                        0,
                        `TxStatus`,
                        `updateUnconfirmedTransactions - sync address: ${addressAndDatumType.address} - datumType: ${addressAndDatumType.datumType} - finished`
                    );
                    //--------------------------------------
                    //get transactions ready to confirm, id all the addresses of that transaction are processed
                    const txsToConfirm = confirmedTransactions.filter((tx) => {
                        const datums = Object.keys(tx.datums);
                        return datums.every((datum) => {
                            return processedAddresses.some((addressAndDatum) => {
                                return addressAndDatum.address === tx.datums[datum].address;
                            });
                        });
                    });
                    for (let confirmedTransaction of txsToConfirm) {
                        try {
                            //-------------------------
                            console_log(0, `TxStatus`, `updateUnconfirmedTransactions - confirm transaction: ${confirmedTransaction.hash}`);
                            //--------------------------------------
                            // Update the transaction status in your database here
                            await TransactionBackEndApplied.setConfirmedTransaction(confirmedTransaction);
                        } catch (error) {
                            console_error(0, `TxStatus`, `updateUnconfirmedTransactions - Error: ${error}`);
                        }
                    }
                } catch (error) {
                    console_error(0, `TxStatus`, `updateUnconfirmedTransactions - Error: ${error}`);
                }
            }
            //--------------------------------------
        } else {
            //--------------------------------------
            const currentTime = serverTime;
            //--------------------------------------
            for (let unconfirmedTransaction of unconfirmedTransactions) {
                // Check if maximum time reached
                if (unconfirmedTransaction.status === TRANSACTION_STATUS_SUBMITTED && currentTime - unconfirmedTransaction.date.getTime() > TX_TIMEOUT_MS) {
                    //-------------------------
                    console_log(0, `TxStatus`, `updateUnconfirmedTransactions - unconfirmedTransaction: ${unconfirmedTransaction.hash} - TIMEOUT`);
                    //-------------------------
                    // NOTE: uso un tiempo TX_TIMEOUT_MS mayor que el TX_CONSUMING_TIME_MS, solo por que quiero tener mas margen de que se confirme y hacer el sync
                    // si seteo que es time out y luego se confirma no tendre el sync adecuado
                    // pero igual como Consuming time es mas chico, las utxos usadas se liberaron al menos logicamente para otros usuarios las usen
                    // es posible que la tx haya caido en algun pool de tx y nadie la termino de confirmar
                    // en ese caso quiero que otro usuario pueda crear otra tx
                    // de todas formas si luego la tx es tomada de ese pool perdido y se intenta confirmar, sera cuestion de si tiene o no los utxos disponibles aun
                    //-------------------------
                    await TransactionBackEndApplied.setTransactionTimeout(unconfirmedTransaction);
                    //-------------------------
                }
                if (currentTime - unconfirmedTransaction.date.getTime() > TX_CONSUMING_TIME_MS) {
                    //-------------------------
                    console_log(0, `TxStatus`, `updateUnconfirmedTransactions - unconfirmedTransaction: ${unconfirmedTransaction.hash} - RELEASE UTXO`);
                    //-------------------------
                    // NOTE: aqui no cambio el estado de la transaccion, solo libero los utxos. No importa el estado actual tampoco. Es una medida de seguridad
                    // De todas formas tampoco tengo que hacer nada, por que las utxos ya no tienen mas el flag
                    // cuando pregunte por utxos libres, tendre en cuenta el estado de la tx y el TX_CONSUMING_TIME_MS
                    // si ya paso ese tiempo voy a considerar que la tx fallo y puedo usar los utxos
                    //-------------------------
                    // NOTE2: prefiero igual liberar UTXOS por las dudas
                    //-------------------------
                    await TransactionBackEndApplied.releaseUTxOsByTx(unconfirmedTransaction);
                    //-------------------------
                }
            }
        }
    }
}

interface GlobalTransactionStatusUpdater {
    updater: TransactionStatusUpdater;
}

let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}

if (!globalState.globalTransactionStatusUpdater) {
    globalState.globalTransactionStatusUpdater = {
        updater: new TransactionStatusUpdater(),
    } as GlobalTransactionStatusUpdater;
}

export const globalTransactionStatusUpdater = globalState.globalTransactionStatusUpdater;

export async function getGlobalTransactionStatusUpdater(): Promise<TransactionStatusUpdater> {
    //------------------
    console_log(0, `TransactionStatusUpdater`, `Get getGlobalTransactionStatusUpdater`);
    //------------------
    return globalTransactionStatusUpdater.updater;
}
