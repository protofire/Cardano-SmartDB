//--------------------------------------
import { WalletTxParams, console_error, console_log, fixUTxOList, globalEmulator, isEmulator, toJson } from '../../Commons/index.BackEnd.js';
import { ExternalWallet, Lucid, LucidEvolution, ProtocolParameters } from '@lucid-evolution/lucid';
import { LucidToolsFrontEnd } from './LucidTools.FrontEnd.js';
import { BlockfrostCustomProviderBackEnd } from '../BlockFrost/BlockFrost.BackEnd.js';
import { protocolParametersForLucid } from '../../Commons/Constants/protocolParameters.js';
//--------------------------------------

export class LucidToolsBackEnd extends LucidToolsFrontEnd {
    // #region use lucid in back end

    public static initializeLucidWithBlockfrost = async () => {
        console.log(`[Lucid] - initializeLucidWithBlockfrost`);
        try {
            //-----------------
            const protocolParameters = protocolParametersForLucid[process.env.NEXT_PUBLIC_CARDANO_NET! as keyof typeof protocolParametersForLucid] as ProtocolParameters;
            //-----------------
            // const lucid = await Lucid(new Blockfrost(process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost', 'xxxx'), process.env.NEXT_PUBLIC_CARDANO_NET! as any, {
            //     presetProtocolParameters: protocolParameters,
            // });
            const lucid = await Lucid(
                new BlockfrostCustomProviderBackEnd(process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost', 'xxxx'),
                process.env.NEXT_PUBLIC_CARDANO_NET! as any,
                {
                    presetProtocolParameters: protocolParameters,
                }
            );
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithBlockfrost - Error: ${error}`);
            throw error;
        }
    };

    public static initializeLucidWithBlockfrostAndWalletFromSeed = async (
        walletSeed: string,
        options?: {
            addressType?: 'Base' | 'Enterprise';
            accountIndex?: number;
        }
    ) => {
        console.log(`[Lucid] - initializeLucidWithBlockfrostAndWalletFromSeed`);
        try {
            const lucid = await this.initializeLucidWithBlockfrost();
            lucid.selectWallet.fromSeed(walletSeed, options);
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithBlockfrostAndWalletFromSeed - Error: ${error}`);
            throw error;
        }
    };

    public static initializeLucidWithBlockfrostAndWalletFromPrivateKey = async (walletPrivateKey: string) => {
        console.log('[Lucid] - initializeLucidWithBlockfrostAndWalletFromPrivateKey');
        try {
            const lucid = await this.initializeLucidWithBlockfrost();
            lucid.selectWallet.fromPrivateKey(walletPrivateKey);
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithBlockfrostAndWalletFromPrivateKey - Error: ${error}`);
            throw error;
        }
    };

    public static initializeLucidWithBlockfrostAndExternalWallet = async (wallet: ExternalWallet) => {
        console.log('[Lucid] - initializeLucidWithBlockfrostAndExternalWallet');
        try {
            const lucid = await this.initializeLucidWithBlockfrost();
            lucid.selectWallet.fromAddress(wallet.address, wallet.utxos ?? []);
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithBlockfrostAndExternalWallet - Error: ${error}`);
            throw error;
        }
    };

    public static async prepareLucidBackEndForTx(walletTxParams?: WalletTxParams): Promise<{ lucid: LucidEvolution; wallet: ExternalWallet | undefined }> {
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
                    utxos: fixUTxOList(uTxOsAtWallet),
                    rewardAddress: walletTxParams.rewardAddress,
                };
                console_log(0, `Lucid`, `prepareLucidBackEndForTx - Wallet: ${toJson(wallet)}`);
            }
            //--------------------------------------
            const lucid = await this.prepareLucidBackEnd(wallet);
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
                // const EmulatorBackEndApplied = (await import('../BackEnd/index.exports.js')).EmulatorBackEndApplied;
                // emulatorDB = await EmulatorBackEndApplied.getOneByParams_({ current: true });
                if (globalEmulator.emulatorDB === undefined) {
                    throw `globalEmulator emulatorDB current not found`;
                }
                if (wallet !== undefined) {
                    lucid = await this.initializeLucidWithEmulatorAndExternalWallet(globalEmulator.emulatorDB, wallet);
                } else {
                    lucid = await this.initializeLucidWithEmulator(globalEmulator.emulatorDB);
                }
            } else {
                if (wallet !== undefined) {
                    lucid = await this.initializeLucidWithBlockfrostAndExternalWallet(wallet);
                } else {
                    lucid = await this.initializeLucidWithBlockfrost();
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
    //     const EmulatorBackEndApplied = (await import('../BackEnd/index.exports.js')).EmulatorBackEndApplied;
    //     await EmulatorBackEndApplied.update(emulatorDB);
    // }

    // #endregion use lucid in back end
}

//--------------------------------------
