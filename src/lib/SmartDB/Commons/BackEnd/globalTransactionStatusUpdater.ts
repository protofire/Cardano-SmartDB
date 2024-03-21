import { SmartUTxOEntity } from '../../Entities/SmartUTxO.Entity';
import { TransactionEntity } from '../../Entities/Transaction.Entity';
import { SmartDBEntitiesRegistry } from '../Decorator.asSmartDBEntity';
import { TRANSACTION_STATUS_FAILED, TRANSACTION_STATUS_TIMEOUT, TRANSACTION_STATUS_CANCELED, TRANSACTION_STATUS_SUBMITTED, TRANSACTION_STATUS_PENDING, TX_CHECK_INTERVAL, TX_PREPARING_TIME, isEmulator, TRANSACTION_STATUS_CONFIRMED, TX_TIMEOUT, TX_CONSUMING_TIME } from '../constants';
import { toJson, sleep, showData } from '../utils';
import { globalEmulator } from './globalEmulator';
import { console_error, console_log } from './globalLogs';

export class TransactionStatusUpdater {
    private isRunning = false;

    public static async getTxCountBlockfrostApi(scriptAddress: string) {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost' + '/addresses/' + scriptAddress + '/total';
            const requestOptions = {
                method: 'GET',
                headers: {
                    project_id: 'xxxxx',
                },
            };
            //----------------------------
            const response = await fetch(urlApi, requestOptions);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.tx_count) {
                    throw `Invalid response format: tx_count not found`;
                }
                console_log(0, `TxStatus`, ` getTxCountBlockfrostApi - tx_count: ${data.tx_count} - response OK`);
                return data.tx_count;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------------------------
        } catch (error) {
            console_error(0, `TxStatus`, ` getTxCountBlockfrostApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getTxIsConfirmedBlockfrostApi(hash: string): Promise<boolean> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost' + '/txs/' + hash;
            const requestOptions = {
                method: 'GET',
                headers: {
                    project_id: 'xxxxx',
                },
            };
            //----------------------------
            const response = await fetch(urlApi, requestOptions);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                console_log(0, `TxStatus`, ` getTxIsConfirmedBlockfrostApi - data: ${toJson(data)} - ${hash}: true - response OK`);
                return true;
            } else {
                // const errorData = await response.json();
                // //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                // //throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                console_log(0, `TxStatus`, ` getTxIsConfirmedBlockfrostApi - ${hash}: false - response OK`);
                return false;
            }
            //----------------------------
        } catch (error) {
            console_error(0, `TxStatus`, ` getTxIsConfirmedBlockfrostApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    protected async releaseUTxOs(transaction: TransactionEntity) {
        //-------------------------
        const SmartUTxOBackEndApplied = (await import('../../BackEnd/SmartUTxO.BackEnd.Applied')).SmartUTxOBackEndApplied;
        //-------------------------
        const consuming_UTxOs = transaction.consuming_UTxOs;
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
                smartUTxO.isConsuming = undefined;
                smartUTxO.isPreparing = undefined;
                await SmartUTxOBackEndApplied.update(smartUTxO);
            }
        }
    }

    public async transactionUpdater(txHash: string) {
        //-------------------------
        console_log(0, `TxStatus`, `transactionUpdater - Init`);
        try {
            //-------------------------
            const TransactionBackEndApplied = (await import('@/src/lib/SmartDB/BackEnd/Transaction.BackEnd.Applied')).TransactionBackEndApplied;
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
            const TransactionBackEndApplied = (await import('@/src/lib/SmartDB/BackEnd/Transaction.BackEnd.Applied')).TransactionBackEndApplied;
            //-------------------------
            // busco transacciones submitted que ya hayan pasado el time out, y las pongo en timeout
            // hago lo mismo con las utxo que esten en consuming, dentro de esa transaccion, y las pongo en normal
            while (true) {
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
                // Sleep for 5 seconds before the next iteration
                await new Promise((resolve) => setTimeout(resolve, TX_CHECK_INTERVAL));
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
        const TimeBackEnd = (await import('@/src/lib/SmartDB/lib/Time/Time.BackEnd')).TimeBackEnd;
        const TransactionBackEndApplied = (await import('@/src/lib/SmartDB/BackEnd/Transaction.BackEnd.Applied')).TransactionBackEndApplied;
        //-------------------------
        console_log(0, `TxStatus`, `UpdaterJob - ${pendingTransactions.length} pendingTransactions`);
        //-------------------------
        let serverTime = await TimeBackEnd.getServerTime();
        //-------------------------
        for (let pendingTransaction of pendingTransactions) {
            const currentTime = serverTime;
            if (currentTime - pendingTransaction.date.getTime() > TX_PREPARING_TIME) {
                //-------------------------
                pendingTransaction.status = TRANSACTION_STATUS_CANCELED;
                await TransactionBackEndApplied.update(pendingTransaction);
                //-------------------------
                await this.releaseUTxOs(pendingTransaction);
                //-------------------------
            }
        }
    }

    private async updateUnconfirmedTransactions(unconfirmedTransactions: TransactionEntity[]) {
        //-------------------------
        const AddressToFollowBackEndApplied = (await import('@/src/lib/SmartDB/BackEnd/AddressToFollow.BackEnd.Applied')).AddressToFollowBackEndApplied;
        const TransactionBackEndApplied = (await import('@/src/lib/SmartDB/BackEnd/Transaction.BackEnd.Applied')).TransactionBackEndApplied;
        const BaseSmartDBBackEndMethods = (await import('@/src/lib/SmartDB/BackEnd/Base/Base.SmartDB.BackEnd.Methods')).BaseSmartDBBackEndMethods;
        const LucidToolsBackEnd = (await import('@/src/lib/SmartDB/lib/Lucid/backEnd')).LucidToolsBackEnd;
        const TimeBackEnd = (await import('@/src/lib/SmartDB/lib/Time/Time.BackEnd')).TimeBackEnd;
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
                    await sleep(5000);
                }
                // si es emulador la primera vez que se ejecute este job ya va a retornar confirmed, agrego un tiempo solo para simular un poco
            } else {
                isConfirmed = await TransactionStatusUpdater.getTxIsConfirmedBlockfrostApi(unconfirmedTransaction.hash);
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
                await new Promise((resolve) => setTimeout(resolve, TX_CHECK_INTERVAL));
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
                    // const EntityClass = this._SmartDBEntities[datumType];
                    const EntityClass = SmartDBEntitiesRegistry.get(datumType);
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
                    confirmedTransaction.status = TRANSACTION_STATUS_CONFIRMED;
                    await TransactionBackEndApplied.update(confirmedTransaction);
                    await this.releaseUTxOs(confirmedTransaction);
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
                    unconfirmedTransaction.status = TRANSACTION_STATUS_TIMEOUT;
                    await TransactionBackEndApplied.update(unconfirmedTransaction);
                    //-------------------------
                    await this.releaseUTxOs(unconfirmedTransaction);
                    //-------------------------
                }
                // Check if maximum time reached
                if (currentTime - unconfirmedTransaction.date.getTime() > TX_CONSUMING_TIME) {
                    //-------------------------
                    console_log(0, `TxStatus`, `UpdaterJob - unconfirmedTransaction: ${unconfirmedTransaction.hash} - RELEASE UTXO`);
                    //-------------------------
                    await this.releaseUTxOs(unconfirmedTransaction);
                    //-------------------------
                }
            }
        }
    }
}

export interface GlobalTransactionStatusUpdater {
    updater: TransactionStatusUpdater;
}
export const globalTransactionStatusUpdater: GlobalTransactionStatusUpdater = {
    updater: new TransactionStatusUpdater(),
};

export async function getGlobalTransactionStatusUpdater(): Promise<TransactionStatusUpdater> {
    //------------------
    console_log(0, `TransactionStatusUpdater`, `Get getGlobalTransactionStatusUpdater`);
    //------------------
    return globalTransactionStatusUpdater.updater;
}
