//--------------------------------------
import { WalletTxParams, console_error, console_log, globalEmulator, isEmulator } from '../../Commons/index.BackEnd';
import { ExternalWallet, Lucid } from 'lucid-cardano';
import { LucidToolsFrontEnd } from './LucidTools.FrontEnd';
//--------------------------------------

export class LucidToolsBackEnd {
    // #region use lucid in back end

    public static async prepareLucidBackEndForTx(walletTxParams?: WalletTxParams): Promise<{ lucid: Lucid; wallet: ExternalWallet | undefined }> {
        try {
            //--------------------------------------
            console_log(0, `Lucid`, `prepareLucidBackEndForTx`);
            //--------------------------------------
            let wallet: ExternalWallet | undefined;
            //--------------------------------------
            if (walletTxParams !== undefined) {
                const uTxOsAtWallet = walletTxParams.utxos;
                if (uTxOsAtWallet.length == 0) {
                    throw `There are no UTxOs available in your Wallet`;
                }
                //--------------------------------------
                wallet = {
                    address: walletTxParams.address,
                    utxos: uTxOsAtWallet,
                    rewardAddress: walletTxParams.rewardAddress,
                };
            }
            //--------------------------------------
            const lucid = await LucidToolsBackEnd.prepareLucidBackEnd(wallet);
            //--------------------------------------
            return { lucid, wallet };
        } catch (error) {
            console_error(0, `Lucid`, `prepareLucidBackEndForTx - Error: ${error}`);
            throw error;
        }
    }

    public static async prepareLucidBackEnd(wallet?: ExternalWallet) {
        try {
            //--------------------------------------
            console_log(0, `Lucid`, `prepareLucidBackEnd`);
            //--------------------------------------
            // let emulatorDB: EmulatorEntity | undefined;
            let lucid;
            //--------------------------------------
            if (isEmulator) {
                // const EmulatorBackEndApplied = (await import('../MayzSmartDB/BackEnd/index.exports')).EmulatorBackEndApplied;
                // emulatorDB = await EmulatorBackEndApplied.getOneByParams_({ current: true });
                if (globalEmulator.emulatorDB === undefined) {
                    throw `globalEmulator emulatorDB current not found`;
                }
                if (wallet !== undefined) {
                    lucid = await LucidToolsFrontEnd.initializeLucidWithEmulatorAndExternalWallet(globalEmulator.emulatorDB, wallet);
                } else {
                    lucid = await LucidToolsFrontEnd.initializeLucidWithEmulator(globalEmulator.emulatorDB);
                }
            } else {
                if (wallet !== undefined) {
                    lucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrostAndExternalWallet(wallet);
                } else {
                    lucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrost();
                }
            }
            return lucid;
        } catch (error) {
            console_error(0, `Lucid`, `prepareLucidBackEnd - Error: ${error}`);
            throw error;
        }
    }

    // public static async syncEmulatorAfterTx(lucid: Lucid, emulatorDB: EmulatorEntity) {
    //     console_log(0, `Lucid`, `syncEmulatorAfterTx - Saving emulator ledger...`);
    //     emulatorDB.emulator = lucid.provider as any;
    //     const EmulatorBackEndApplied = (await import('../MayzSmartDB/BackEnd/index.exports')).EmulatorBackEndApplied;
    //     await EmulatorBackEndApplied.update(emulatorDB);
    // }

    // #endregion use lucid in back end
}

//--------------------------------------
