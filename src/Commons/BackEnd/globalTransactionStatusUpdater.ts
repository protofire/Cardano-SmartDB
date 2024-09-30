import { TransactionEntity } from '../../Entities/Transaction.Entity.js';
import { BlockFrostBackEnd } from '../../lib/BlockFrost/BlockFrost.BackEnd.js';
import {
    isEmulator,
    TRANSACTION_STATUS_CONFIRMED,
    TRANSACTION_STATUS_CREATED,
    TRANSACTION_STATUS_PENDING,
    TRANSACTION_STATUS_SUBMITTED,
    TRANSACTION_STATUS_TIMEOUT,
    TX_CHECK_INTERVAL,
    TX_CONSUMING_TIME,
    TX_PREPARING_TIME,
    TX_TIMEOUT,
    TX_WAIT_FOR_SYNC
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
            // revisa cualquier estado menos las que ya han sido confirmadas ni las que estan en proceso de creacion
            //-------------------------
            const unconfirmedTransaction: TransactionEntity | undefined = await TransactionBackEndApplied.getOneByParams_({
                hash: txHash,
                status: { $nin: [TRANSACTION_STATUS_CONFIRMED, TRANSACTION_STATUS_CREATED] },
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
                            $or: [{ status: TRANSACTION_STATUS_TIMEOUT }],
                            // antes revisaba pending timeout, pero ese se pone desde pending, o sea, nunca se enviaron a la red, no hace falta revisar
                            // las timeout si, por que esas eran submited que se pasaron de tiempo de espera
                            // las failed tampoco  fueron nunca submitted. Las puso asi el frontend cuando se intentaba firmar o submitiar. Existe una minima chance de que se hayan submiteado pero luego arroja error y quedan failed.
                            // pero no por eso lo voy a agregar aca. Para eso se puede revisar manualmente las tx en transactionUpdater(hash)
                            //, { status: TRANSACTION_STATUS_PENDING_TIMEOUT }
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
                await delay(TX_CHECK_INTERVAL);
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
                await TransactionBackEndApplied.setPendingTransactionTimeout(pendingTransaction);
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
                    // NOTE: uso un tiempo TX_TIMEOUT mayor que el TX_CONSUMING_TIME, solo por que quiero tener mas margen de que se confirme y hacer el sync
                    // si seteo que es time out y luego se confirma no tendre el sync adecuado
                    // pero igual como Consuming time es mas chico, las utxos usadas se liberaron al menos logicamente para otros usuarios las usen
                    // es posible que la tx haya caido en algun pool de tx y nadie la termino de confirmar
                    // en ese caso quiero que otro usuario pueda crear otra tx
                    // de todas formas si luego la tx es tomada de ese pool perdido y se intenta confirmar, sera cuestion de si tiene o no los utxos disponibles aun
                    //-------------------------
                    await TransactionBackEndApplied.updateTransactionStatus(unconfirmedTransaction, TRANSACTION_STATUS_TIMEOUT);
                    //-------------------------
                }
                if (currentTime - unconfirmedTransaction.date.getTime() > TX_CONSUMING_TIME) {
                    //-------------------------
                    console_log(0, `TxStatus`, `UpdaterJob - unconfirmedTransaction: ${unconfirmedTransaction.hash} - RELEASE UTXO`);
                    //-------------------------
                    // NOTE: aqui no cambio el estado de la transaccion, solo libero los utxos. No importa el estado actual tampoco. Es una medida de seguridad
                    // De todas formas tampoco tengo que hacer nada, por que las utxos ya no tienen mas el flag
                    // cuando pregunte por utxos libres, tendre en cuenta el estado de la tx y el TX_CONSUMING_TIME
                    // si ya paso ese tiempo voy a considerar que la tx fallo y puedo usar los utxos
                    // await TransactionBackEndApplied.relseaseUTxOs(unconfirmedTransaction);
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
