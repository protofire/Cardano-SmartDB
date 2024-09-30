// es generica, todos los metodos llevan instancia o entidad como parametro

import { Lucid } from 'lucid-cardano';
import { explainErrorTx } from '../../../Commons/explainError.js';
import { pushSucessNotification, pushWarningNotification } from '../../../Commons/pushNotification.js';
import { WalletTxParams } from '../../../Commons/types.js';
import { BaseSmartDBEntity } from '../../../Entities/Base/Base.SmartDB.Entity.js';
import { LucidToolsFrontEnd } from '../../../lib/Lucid/LucidTools.FrontEnd.js';
import { IUseWalletStore } from '../../../store/types.js';
import { AddressToFollowFrontEndApiCalls } from '../../ApiCalls/AddressToFollow.FrontEnd.Api.Calls.js';
import { BaseSmartDBFrontEndApiCalls } from '../../ApiCalls/Base/Base.SmartDB.FrontEnd.Api.Calls.js';
import { EmulatorEntity } from '../../../Entities/Emulator.Entity.js';
import { AddressToFollowEntity } from '../../../Entities/AddressToFollow.Entity.js';
import { formatAddress } from '../../../Commons/helpers.js';
import { JobManagerFrontEnd } from '../../../lib/JobManager/JobManager.FrontEnd.js';

// todas las clases la pueden usar
export class BaseSmartDBFrontEndBtnHandlers {
    // protected static _Entity = BaseSmartDBEntity;

    // #region front end Btn handlers

    public static async handleBtnCreateHook<T extends BaseSmartDBEntity>(instance: T): Promise<boolean> {
        try {
            const addressesToFollow = await AddressToFollowFrontEndApiCalls.getByAddressApi(instance.getNet_Address());
            if (addressesToFollow && addressesToFollow.length > 0) {
                throw 'Webhook already exists';
            } else {
                await BaseSmartDBFrontEndApiCalls.createHookApi(instance.getStatic(), instance.getNet_Address(), instance.getNET_id_CS());
                pushSucessNotification(`${instance.className()}`, `Webhook created`, false);
                return true;
            }
        } catch (error) {
            console.log(`[${instance.className()}] - handleBtnCreateHook - Error: ${error}`);
            pushWarningNotification(`${instance.className()}`, `Error creating webhook: ${error}`);
            return false;
        }
    }

    public static async handleBtnSync<T extends BaseSmartDBEntity>(instance: T, force: boolean = false): Promise<boolean> {
        try {
            await BaseSmartDBFrontEndApiCalls.syncWithAddressApi<T>(instance.getStatic(), instance.getNet_Address(), force);
            pushSucessNotification(`${instance.className()}`, `${instance.className()} syncronized`, false);
            return true;
        } catch (error) {
            console.log(`[${instance.className()}] - handleBtnSync - Error: ${error}`);
            pushWarningNotification(`${instance.className()}`, `Error syncronizing ${instance.className()}: ${error}`);
            return false;
        }
    }

    public static async handleBtnDoTransactionV1<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        name: string,
        nameTx: string,
        setProcessingTxMessage: (value: string) => void,
        setProcessingTxHash: (value: string) => void,
        walletStore: IUseWalletStore,
        txParams: Record<string, any>,
        apiTxCall: (walletTxParams: WalletTxParams, txParams: any) => Promise<{ txHash: string; txCborHex: string }>
    ): Promise<boolean> {
        try {
            //--------------------------------------
            setProcessingTxMessage(name + '...');
            //--------------------------------------
            const { lucid, emulatorDB, walletTxParams } = await LucidToolsFrontEnd.prepareLucidFrontEndForTx(walletStore);
            //--------------------------------------
            const { txHash, txCborHex } = await apiTxCall(walletTxParams, txParams);
            //--------------------------------------
            setProcessingTxMessage('Transaction prepared, waiting for sign to submit...');
            //--------------------------------------
            await LucidToolsFrontEnd.signAndSubmitTx(lucid, txHash, txCborHex, walletStore.info, emulatorDB);
            //--------------------------------------
            setProcessingTxMessage(`Transaction submitted, waiting for confirmation...`);
            setProcessingTxHash(txHash);
            //--------------------------------------
            if (await LucidToolsFrontEnd.awaitTx(lucid, txHash)) {
                console.log(`${Entity.className()}] - handleBtnTx - waitForTxConfirmation - Tx confirmed - ${txHash}`);
                pushSucessNotification(`${Entity.className()} ${nameTx}`, txHash, true);
            } else {
                console.log(`${Entity.className()}] - handleBtnTx - waitForTxConfirmation - Tx not confirmed - ${txHash}`);
                throw `Tx not confirmed`;
            }
            //--------------------------------------
            setProcessingTxMessage(`Refreshing Wallet...`);
            await walletStore.loadWalletData();
            //--------------------------------------
            setProcessingTxMessage(``);
            return true;
        } catch (error) {
            const error_explained = explainErrorTx(error);
            console.log(`[${Entity.className()}] - handleBtnTx - Error: ${error_explained}`);
            pushWarningNotification(`${Entity.className()} ${nameTx}`, error_explained);
            setProcessingTxMessage(error_explained);
            return false;
        }
    }

    public static async handleBtnDoTransactionV2<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        name: string,
        nameTx: string,
        lucid: Lucid,
        emulatorDB: EmulatorEntity | undefined,
        apiTxCall: () => Promise<{ txHash: string; txCborHex: string }>,
        setProcessingTxMessage: (value: string) => void,
        setProcessingTxHash: (value: string) => void,
        walletStore: IUseWalletStore
    ): Promise<boolean> {
        try {
            //--------------------------------------
            setProcessingTxMessage(name + '...');
            //--------------------------------------
            const { txHash, txCborHex } = await apiTxCall();
            //--------------------------------------
            setProcessingTxMessage('Transaction prepared, waiting for sign to submit...');
            //--------------------------------------
            await LucidToolsFrontEnd.signAndSubmitTx(lucid, txHash, txCborHex, walletStore.info, emulatorDB);
            //--------------------------------------
            setProcessingTxMessage(`Transaction submitted, waiting for confirmation...`);
            setProcessingTxHash(txHash);
            //--------------------------------------
            if (await LucidToolsFrontEnd.awaitTx(lucid, txHash)) {
                console.log(`${Entity.className()}] - handleBtnTx - waitForTxConfirmation - Tx confirmed - ${txHash}`);
                pushSucessNotification(`${Entity.className()} ${nameTx}`, txHash, true);
            } else {
                console.log(`${Entity.className()}] - handleBtnTx - waitForTxConfirmation - Tx not confirmed - ${txHash}`);
                throw `Tx not confirmed`;
            }
            //--------------------------------------
            setProcessingTxMessage(`Refreshing Wallet...`);
            await walletStore.loadWalletData();
            //--------------------------------------
            setProcessingTxMessage(``);
            return true;
        } catch (error) {
            const error_explained = explainErrorTx(error);
            console.log(`[${Entity.className()}] - handleBtnTx - Error: ${error_explained}`);
            pushWarningNotification(`${Entity.className()} ${nameTx}`, error_explained);
            setProcessingTxMessage(error_explained);
            return false;
        }
    }

    public static async handleBtnParseBlockchain(
        Entity: typeof BaseSmartDBEntity,
        setProcessingMessage: (value: string) => void,
        addressesToProcess: AddressToFollowEntity[],
        fromBlock?: number,
        toBlock?: number
    ): Promise<boolean> {
        //--------------------------------------
        try {
            //--------------------------------------
            setProcessingMessage('Parsing Blockchain...');
            //--------------------------------------
            let result = true;
            //--------------------------------------
            for (let index = 0; index < addressesToProcess.length; index++) {
                //--------------------------------------
                const address = addressesToProcess[index].address;
                //--------------------------------------
                console.log(`${Entity.className()} - handleBtnParseBlockchain - Parsing ${addressesToProcess[index].datumType}'s Address: ${address}`);
                //--------------------------------------
                const addressMsg = `Address (${index + 1}/${addressesToProcess.length}): Parsing ${addressesToProcess[index].datumType}'s Address: ${formatAddress(address)}`;
                setProcessingMessage(`${addressMsg}...`);
                //--------------------------------------
                try {
                    //--------------------------------------
                    const jobId = await BaseSmartDBFrontEndApiCalls.parseBlockchainAddressApi(Entity, address, addressesToProcess[index].datumType, fromBlock, toBlock);
                    console.log(`[${Entity.className()}] - handleBtnParseBlockchain - jobId: ${jobId}`);
                    //--------------------------------------
                    const { jobPromise } = JobManagerFrontEnd.startMonitoringJob(jobId, setProcessingMessage, addressMsg);
                    //--------------------------------------
                    const job = await jobPromise; // Await the job's completion
                    //--------------------------------------
                    if (job.status === 'completed') {
                        // await JobManagerFrontEnd.removeJob(jobId);
                        const successMessage = job.message || `Parse ${addressesToProcess[index].datumType}'s Address OK`;
                        pushSucessNotification(`${Entity.className()}`, successMessage, false);
                        result = result && true;
                    } else if (job.status === 'failed') {
                        // await JobManagerFrontEnd.removeJob(jobId);
                        const errorMessage = job.error || `Parse ${addressesToProcess[index].datumType}'s Address Error: ${job.message}`;
                        pushWarningNotification(`${Entity.className()}`, errorMessage);
                        setProcessingMessage(errorMessage);
                        return false;
                    } else if (job.status === 'canceled') {
                        // await JobManagerFrontEnd.removeJob(jobId);
                        const errorMessage = job.error || `Parse ${addressesToProcess[index].datumType}'s Address Canceled`;
                        pushWarningNotification(`${Entity.className()}`, errorMessage);
                        setProcessingMessage(errorMessage);
                        return false;
                    }
                } catch (error) {
                    const error_explained = explainErrorTx(error);
                    console.log(`[${Entity.className()}] - handleBtnParseBlockchain - Error: ${error_explained}`);
                    pushWarningNotification(`${Entity.className()}`, `Parse ${addressesToProcess[index].datumType}'s Address Error`);
                    return false;
                }
            }
            //--------------------------------------
            return result;
            //--------------------------------------
        } catch (error) {
            const error_explained = explainErrorTx(error);
            console.log(`[${Entity.className()}] - handleBtnParseBlockchain - Error: ${error_explained}`);
            pushWarningNotification(`${Entity.className()} Parse Blockchain`, error_explained);
            setProcessingMessage(error_explained);
            return false;
        }
    }

    // #endregion front end Btn handlers
}
