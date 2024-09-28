import { TransactionEntity } from '../../Entities/Transaction.Entity.js';
import { BlockFrostBackEnd } from '../../lib/BlockFrost/BlockFrost.BackEnd.js';
import {
    TRANSACTION_STATUS_CANCELED,
    TRANSACTION_STATUS_FAILED,
    TRANSACTION_STATUS_PENDING,
    TRANSACTION_STATUS_SUBMITTED,
    TRANSACTION_STATUS_TIMEOUT,
    TX_CHECK_INTERVAL,
    TX_CONSUMING_TIME,
    TX_PREPARING_TIME,
    TX_TIMEOUT,
    TX_WAIT_FOR_SYNC,
    isEmulator
} from '../Constants/constants.js';
import { RegistryManager } from '../Decorators/registerManager.js';
import { delay, showData, toJson } from '../utils.js';
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
            const unconfirmedTransaction: TransactionEntity | undefined = await TransactionBackEndApplied.getOneByParams_({
                hash: txHash,
                $or: [
                    { status: TRANSACTION_STATUS_FAILED },
                    { status: TRANSACTION_STATUS_TIMEOUT },
                    { status: TRANSACTION_STATUS_CANCELED },
                    { status: TRANSACTION_STATUS_SUBMITTED },
                    { status: TRANSACTION_STATUS_PENDING },
                ],
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
            throw `${error}`;
        }
    }

    public async startUpdaterJob(swCheckAgainTxWithTimeOut: boolean = false) {
        if (this.isRunning) {
            console_log(0, `TxStatus`, `UpdaterJob - Already Running...`);
            return;
        }
        console_log(0, `TxStatus`, `UpdaterJob - Start`);
        this.isRunning = true;
        try {
            //-------------------------
            const TransactionBackEndApplied = (await import('../../BackEnd/Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
            //-------------------------
            // busco transacciones submitted que ya hayan pasado el time out, y las pongo en timeout
            // hago lo mismo con las utxo que esten en consuming, dentro de esa transaccion, y las pongo en normal
            while (true) {
                try {
                    //-------------------------
                    // busco transacciones pending que ya hayan pasado el time out, y las pongo en canceladas
                    // hago lo mismo con las utxo que esten en pending, dentro de esa transaccion, y las pongo en normal
                    //-------------------------
                    const pendingTransactions: TransactionEntity[] = await TransactionBackEndApplied.getByParams_({ status: TRANSACTION_STATUS_PENDING });
                    //-------------------------
                    const unconfirmedTransactions: TransactionEntity[] = await TransactionBackEndApplied.getByParams_({ status: TRANSACTION_STATUS_SUBMITTED });
                    //-------------------------
                    if (swCheckAgainTxWithTimeOut) {
                        const timeoutTransactions: TransactionEntity[] = await TransactionBackEndApplied.getByParams_({
                            $or: [{ status: TRANSACTION_STATUS_TIMEOUT }, { status: TRANSACTION_STATUS_CANCELED }],
                        });
                        unconfirmedTransactions.push(...timeoutTransactions);
                        swCheckAgainTxWithTimeOut = false;
                    }
                    //-------------------------
                    if (unconfirmedTransactions.length === 0 && pendingTransactions.length === 0) {
                        console_log(0, `TxStatus`, `UpdaterJob - Finish`);
                        break;
                    }
                    //-------------------------
                    await this.updatePendingTransactions(pendingTransactions);
                    //-------------------------
                    await this.updateUnconfirmedTransactions(unconfirmedTransactions);
                    //-------------------------
                } catch (error) {
                    console_error(0, `TxStatus`, `UpdaterJob - Error: ${error} - Retrying...`);
                }
                // Sleep for TX_CHECK_INTERVAL before the next iteration
                await delay(TX_CHECK_INTERVAL)
            }
        } catch (error) {
            console_error(0, `TxStatus`, `UpdaterJob - Error: ${error}`);
            throw `${error}`;
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
        console_log(0, `TxStatus`, `UpdaterJob - ${pendingTransactions.length} pendingTransactions`);
        //-------------------------
        let serverTime = await TimeBackEnd.getServerTime();
        //-------------------------
        for (let pendingTransaction of pendingTransactions) {
            const currentTime = serverTime;
            if (currentTime - pendingTransaction.date.getTime() > TX_PREPARING_TIME) {
                await TransactionBackEndApplied.updateTransactionStatusAndUTxOs(pendingTransaction, TRANSACTION_STATUS_CANCELED);
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
        //-------------------------
        console_log(0, `TxStatus`, `UpdaterJob - ${unconfirmedTransactions.length} unconfirmedTransactions`);
        //-------------------------
        let serverTime = await TimeBackEnd.getServerTime();
        //-------------------------
        const confirmedTransactions: TransactionEntity[] = [];
        //-------------------------
        for (let unconfirmedTransaction of unconfirmedTransactions) {
            //-------------------------
            console_log(0, `TxStatus`, `UpdaterJob - unconfirmedTransaction: ${unconfirmedTransaction.hash}`);
            //-------------------------
            // Check if transaction is confirmed
            let isConfirmed: boolean = false;
            if (isEmulator) {
                if (unconfirmedTransaction.status === TRANSACTION_STATUS_SUBMITTED) {
                    isConfirmed = true;
                    await delay(5000);
                }
                // si es emulador la primera vez que se ejecute este job ya va a retornar confirmed, agrego un tiempo solo para simular un poco
            } else {
                isConfirmed = await BlockFrostBackEnd.getTxIsConfirmed_Api(unconfirmedTransaction.hash);
            }
            if (isConfirmed) {
                //--------------------------------------
                console_log(0, `TxStatus`, `UpdaterJob - transaction: ${unconfirmedTransaction.hash} - isConfirmed - Syncronizing...`);
                confirmedTransactions.push(unconfirmedTransaction);
                //--------------------------------------
            } else {
                console_log(0, `TxStatus`, `UpdaterJob - transaction: ${unconfirmedTransaction.hash} - isPending`);
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
            console_log(0, `TxStatus`, `UpdaterJob - addressesAndDatums: ${showData(addressesAndDatums, false)}`);
            //--------------------------------------
            //get unique addresses and datumType
            const uniqueAddressesAndDatums: { address: string; datumType: string | undefined }[] = Array.from(
                new Set(addressesAndDatums.map((addressAndDatum) => toJson(addressAndDatum)))
            ).map((addressAndDatum) => JSON.parse(addressAndDatum));
            //--------------------------------------
            console_log(0, `TxStatus`, `UpdaterJob - uniqueAddressesAndDatums: ${showData(uniqueAddressesAndDatums, false)}`);
            //--------------------------------------
            var { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(undefined);
            //--------------------------------------
            if (process.env.NEXT_PUBLIC_CARDANO_NET !== 'Emulator') {
                // TODO: a veces el api de query tx dice que la transaccion existe, pero el api de tx count no lo refleja
                // agrego esto por las dudas, para dar tiempo a blockfrost actualize sus registros
                await delay(TX_WAIT_FOR_SYNC);
            }
            //--------------------------------------
            const processedAddresses: {
                address: string;
                datumType: string | undefined;
            }[] = [];
            // do the sync with blockchain for the addresses in transaction
            for (let addressAdnDatumType of uniqueAddressesAndDatums) {
                //--------------------------------------
                console_log(0, `TxStatus`, `UpdaterJob - sync address: ${addressAdnDatumType.address} - datumType: ${addressAdnDatumType.datumType} - init`);
                //--------------------------------------
                const addressesToFollow = await AddressToFollowBackEndApplied.getByAddress(addressAdnDatumType.address);
                if (addressesToFollow.length > 0) {
                    //--------------------------------------
                    //TODO y si hay mas de una en la misma address? deberia hacer la que coincida tmb el tupo de datum
                    const addressToFollow = addressesToFollow[0];
                    let datumType = addressAdnDatumType.datumType;
                    if (datumType === undefined) {
                        throw `datumType is undefined`;
                    }
                    //--------------------------------------
                    const EntityClass = RegistryManager.getFromSmartDBEntitiesRegistry(datumType);
                    if (EntityClass !== undefined) {
                        if (isEmulator === true && globalEmulator.emulatorDB === undefined) {
                            throw `globalEmulator emulatorDB current not found`;
                        }
                        await BaseSmartDBBackEndMethods.syncWithAddress(EntityClass, lucid, globalEmulator.emulatorDB, addressToFollow, false, true);
                    }
                }
                //--------------------------------------
                processedAddresses.push(addressAdnDatumType);
                //--------------------------------------
                console_log(0, `TxStatus`, `UpdaterJob - sync address: ${addressAdnDatumType.address} - datumType: ${addressAdnDatumType.datumType} - finished`);
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
                    //-------------------------
                    console_log(0, `TxStatus`, `UpdaterJob - confirm transaction: ${confirmedTransaction.hash}`);
                    //--------------------------------------
                    // Update the transaction status in your database here
                    await TransactionBackEndApplied.setConfirmedTransaction(confirmedTransaction);
                }
            }
            //--------------------------------------
        } else {
            //--------------------------------------
            const currentTime = serverTime;
            //--------------------------------------
            for (let unconfirmedTransaction of unconfirmedTransactions) {
                // Check if maximum time reached
                if (unconfirmedTransaction.status === TRANSACTION_STATUS_SUBMITTED && currentTime - unconfirmedTransaction.date.getTime() > TX_TIMEOUT) {
                    //-------------------------
                    console_log(0, `TxStatus`, `UpdaterJob - unconfirmedTransaction: ${unconfirmedTransaction.hash} - TIMEOUT`);
                    //-------------------------
                    await TransactionBackEndApplied.updateTransactionStatusAndUTxOs(unconfirmedTransaction, TRANSACTION_STATUS_TIMEOUT);
                    //-------------------------
                }
                // NOTE: aqui no cambio el estado de la transaccion, solo libero los utxos. No importa el estado actual tampoco. Es una medida de seguridad
                if (currentTime - unconfirmedTransaction.date.getTime() > TX_CONSUMING_TIME) {
                    //-------------------------
                    console_log(0, `TxStatus`, `UpdaterJob - unconfirmedTransaction: ${unconfirmedTransaction.hash} - RELEASE UTXO`);
                    //-------------------------
                    await TransactionBackEndApplied.relseaseUTxOs(unconfirmedTransaction);
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
