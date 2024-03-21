import { pushSucessNotification, pushWarningNotification } from '@/src/utils/commons/pushNotification';
import { BaseSmartDBEntity } from '../../../Entities/Base/Base.SmartDB.Entity';
import { AddressToFollowFrontEndApiCalls } from '../../ApiCalls/AddressToFollow.FrontEnd.Api.Calls';
import { BaseSmartDBFrontEndApiCalls } from '../../ApiCalls/Base/Base.SmartDB.FrontEnd.Api.Calls';
import { IUseWalletStore } from '@/src/store/types';
import { ProtocolEntity } from '@/src/lib/MayzSmartDB/Entities/Protocol.Entity';
import { LucidToolsFrontEnd } from '@/src/lib/SmartDB/lib/Lucid/LucidTools.FrontEnd';
import { explainErrorTx } from '@/src/utils/specific/explainError';
import { WalletTxParams } from '../../../Commons';
import { Lucid } from 'lucid-cardano';
import { EmulatorEntity } from '../../../Entities/Emulator.Entity';

// es generica, todos los metodos llevan instancia o entidad como parametro
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
    public static async handleBtnDoTransaction_OLD<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        name: string,
        nameTx: string,
        setProcessingTxMessage: (value: string) => void,
        setProcessingTxHash: (value: string) => void,
        walletStore: IUseWalletStore,
        protocol: ProtocolEntity,
        txParams: any,
        apiTxCall: (walletTxParams: WalletTxParams, txParams: any) => Promise<any>
    ): Promise<boolean> {
        try {
            //--------------------------------------
            setProcessingTxMessage(name + '...');
            //--------------------------------------
            const { lucid, emulatorDB, walletTxParams } = await LucidToolsFrontEnd.prepareLucidFrontEndForTx(walletStore);
            //--------------------------------------
            const { txCborHex } = await apiTxCall(walletTxParams, txParams);
            //--------------------------------------
            setProcessingTxMessage('Transaction prepared, waiting for sign to submit...');
            //--------------------------------------
            const txHash = await LucidToolsFrontEnd.signAndSubmitTx(lucid, txCborHex, walletStore.info, emulatorDB);
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
            setProcessingTxMessage(`Syncronizing...`);
            //--------------------------------------
            setProcessingTxMessage(`Refreshing data...`);
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



    public static async handleBtnDoTransaction<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        name: string,
        nameTx: string,
        lucid: Lucid,
        emulatorDB: EmulatorEntity | undefined,
        apiTxCall: () => Promise<any>,
        setProcessingTxMessage: (value: string) => void,
        setProcessingTxHash: (value: string) => void,
        walletStore: IUseWalletStore,
    ): Promise<boolean> {
        try {
            //--------------------------------------
            setProcessingTxMessage(name + '...');
            //--------------------------------------
            const { txCborHex } = await apiTxCall();
            //--------------------------------------
            setProcessingTxMessage('Transaction prepared, waiting for sign to submit...');
            //--------------------------------------
            const txHash = await LucidToolsFrontEnd.signAndSubmitTx(lucid, txCborHex, walletStore.info, emulatorDB);
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
            setProcessingTxMessage(`Syncronizing...`);
            //--------------------------------------
            setProcessingTxMessage(`Refreshing data ...`);
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

    // #endregion front end Btn handlers
}
