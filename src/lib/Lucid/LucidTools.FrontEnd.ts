import { ExternalWallet, Lucid, LucidEvolution, PrivateKey, ProtocolParameters, TxSigned, WalletApi } from '@lucid-evolution/lucid';
import { protocolParametersForLucid } from '../../Commons/Constants/protocolParameters.js';
import {
    ConnectedWalletInfo,
    LUCID_NETWORK_CUSTOM_NAME,
    TRANSACTION_STATUS_CONFIRMED,
    TRANSACTION_STATUS_FAILED,
    TRANSACTION_STATUS_TIMEOUT,
    TX_CHECK_INTERVAL_MS,
    TX_PREPARING_TIME_MS,
    TX_PROPAGATION_DELAY_MS,
    WalletTxParams,
    checkIfUserCanceled,
    getTxRedeemersDetailsAndResources,
    isEmulator,
    sleep,
    toJson,
} from '../../Commons/index.js';
import { EmulatorEntity } from '../../Entities/Emulator.Entity.js';
import { TransactionEntity } from '../../Entities/Transaction.Entity.js';
import { BaseSmartDBFrontEndApiCalls } from '../../FrontEnd/ApiCalls/Base/Base.SmartDB.FrontEnd.Api.Calls.js';
import { TransactionFrontEndApiCalls } from '../../FrontEnd/ApiCalls/Transaction.FrontEnd.Api.Calls.js';
import { IUseWalletStore } from '../../store/types.js';
import { BlockfrostCustomProviderFrontEnd } from '../BlockFrost/BlockFrost.FrontEnd.js';
import { TimeApi } from '../Time/index.js';

//--------------------------------------

export class LucidToolsFrontEnd {
    // #region initialize lucid

    public static initializeLucidWithBlockfrost = async () => {
        console.log(`[Lucid] - initializeLucidWithBlockfrost`);
        try {
            //-----------------
            const protocolParameters = protocolParametersForLucid[process.env.NEXT_PUBLIC_CARDANO_NET! as keyof typeof protocolParametersForLucid] as ProtocolParameters;
            //-----------------
            const lucid = await Lucid(
                new BlockfrostCustomProviderFrontEnd(process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost', 'xxxx'),
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

    public static initializeLucidWithBlockfrostAndWalletApi = async (walletApi?: WalletApi) => {
        console.log(`[Lucid] - initializeLucidWithBlockfrostAndWalletApi`);
        try {
            const lucid = await this.initializeLucidWithBlockfrost();
            if (walletApi !== undefined) {
                lucid.selectWallet.fromAPI(walletApi);
            }
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithBlockfrostAndWalletApi - Error: ${error}`);
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

    public static initializeLucidWithEmulator = async (emulatorDB: EmulatorEntity) => {
        console.log('[Lucid] - initializeLucidWithEmulator');
        try {
            // los emuladores supuestamente tienen el tiempo de cuando fueron creados y un zlot zero en ese tiempo
            // pero como yo estoy usando los emuladores, al crear lucid con new setea el slot zero en 0 y la fecha del emulador
            // pero el emulador en realidad no esta en slot 0, esta en otro mas avanzado
            // lo que hago aqui es setear el emulador como si estuviera en el tiempo en el que fue creado
            // asi lucid inicializa con ese tiempo y slot zero en 0
            // luego pongo al emulador en el tiempo que correspondia
            //-----------------
            const protocolParameters = protocolParametersForLucid[process.env.NEXT_PUBLIC_CARDANO_NET! as keyof typeof protocolParametersForLucid] as ProtocolParameters;
            //-----------------
            const emulatorTime = emulatorDB.emulator.time;
            emulatorDB.emulator.time = Number(emulatorDB.zeroTime.toString());
            const lucid = await Lucid(emulatorDB.emulator, LUCID_NETWORK_CUSTOM_NAME, { presetProtocolParameters: protocolParameters });
            emulatorDB.emulator.time = emulatorTime;

            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithEmulator - Error: ${error}`);
            throw error;
        }
    };

    public static initializeLucidWithEmulatorAndWalletFromSeed = async (
        emulatorDB: EmulatorEntity,
        walletSeed: string,
        options?: {
            addressType?: 'Base' | 'Enterprise';
            accountIndex?: number;
        }
    ) => {
        console.log(`[Lucid] - initializeLucidWithEmulatorAndWalletFromSeed`);
        try {
            const lucid = await this.initializeLucidWithEmulator(emulatorDB);
            lucid.selectWallet.fromSeed(walletSeed, options);
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithEmulatorAndWalletFromSeed - Error: ${error}`);
            throw error;
        }
    };

    public static initializeLucidWithEmulatorAndWalletFromPrivateKey = async (emulatorDB: EmulatorEntity, walletPrivateKey: PrivateKey) => {
        console.log(`[Lucid] - initializeLucidWithEmulatorAndWalletFromPrivateKey`);
        try {
            const lucid = await this.initializeLucidWithEmulator(emulatorDB);
            lucid.selectWallet.fromPrivateKey(walletPrivateKey);
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithEmulatorAndWalletFromPrivateKey - Error: ${error}`);
            throw error;
        }
    };

    public static initializeLucidWithEmulatorAndExternalWallet = async (emulatorDB: EmulatorEntity, wallet: ExternalWallet) => {
        console.log(`[Lucid] - initializeLucidWithEmulatorAndExternalWallet`);
        try {
            const lucid = await this.initializeLucidWithEmulator(emulatorDB);
            lucid.selectWallet.fromAddress(wallet.address, wallet.utxos ?? []);
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithEmulatorAndExternalWallet - Error: ${error}`);
            throw error;
        }
    };

    // #endregion initialize lucid

    // #region use lucid in front end

    public static async prepareLucidForUseAsUtils(emulatorDB?: EmulatorEntity) {
        let lucid: LucidEvolution;
        try {
            console.log(`[Lucid] - prepareLucidForUseAsUtils`);
            if (isEmulator) {
                emulatorDB = emulatorDB ?? (await BaseSmartDBFrontEndApiCalls.getOneByParamsApi<EmulatorEntity>(EmulatorEntity, { current: true }));
                if (emulatorDB === undefined) {
                    throw 'emulatorDB current not defined';
                } else {
                    lucid = await this.initializeLucidWithEmulator(emulatorDB);
                }
            } else {
                lucid = await this.initializeLucidWithBlockfrost();
            }
            return { lucid };
        } catch (error) {
            console.log(`[Lucid] - prepareLucidForUseAsUtils - Error: ${error}`);
            throw error;
        }
    }

    public static async prepareLucidFrontEndForTx(walletStore: IUseWalletStore): Promise<{ lucid: LucidEvolution; emulatorDB?: EmulatorEntity; walletTxParams: WalletTxParams }> {
        try {
            console.log(`[Lucid] - prepareLucidFrontEndForTx`);
            //--------------------------------------
            if (walletStore.isConnected === false || walletStore.info === undefined) {
                throw `Wallet not connected`;
            }
            //--------------------------------------
            let emulatorDB;
            //--------------------------------------
            if (isEmulator) {
                //--------------------------------------
                // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                await TimeApi.syncEmulatorBlockChainWithServerTimeApi();
                //--------------------------------------
                emulatorDB = await BaseSmartDBFrontEndApiCalls.getOneByParamsApi<EmulatorEntity>(EmulatorEntity, { current: true });
                if (emulatorDB === undefined) {
                    throw `emulatorDB current not found`;
                }
            }
            //--------------------------------------
            const lucid = await walletStore.getLucid({ emulatorDB });
            if (lucid === undefined || lucid.wallet === undefined) {
                throw `wallet not ready yet`;
            }
            //--------------------------------------
            const address = await lucid.wallet().address();
            const rewardAddress = await lucid.wallet().rewardAddress();
            const utxos = await lucid.wallet().getUtxos();
            const walletTxParams: WalletTxParams = {
                pkh: walletStore.info.pkh,
                stakePkh: walletStore.info?.stakePkh,
                address,
                rewardAddress: rewardAddress === null ? undefined : rewardAddress,
                utxos,
            };
            return { lucid, emulatorDB, walletTxParams };
        } catch (error) {
            console.log(`[Lucid] - prepareLucidFrontEndForTx - Error: ${error}`);
            throw error;
        }
    }

    public static async signAndSubmitTx(
        lucid: LucidEvolution,
        txCborHex: string,
        walletInfo?: ConnectedWalletInfo,
        emulatorDB?: EmulatorEntity,
        swDoNotPromtForSigning: boolean = false
    ) {
        try {
            console.log(`[Lucid] - signAndSubmitTx`);
            //--------------------------------------
            const txComplete = lucid.fromTx(txCborHex);
            //--------------------------------------
            const txCompleteHash = txComplete.toHash();
            //--------------------------------------
            const transaction = await TransactionFrontEndApiCalls.getOneByParamsApi<TransactionEntity>(TransactionEntity, { hash: txCompleteHash });
            //--------------------------------------
            try {
                //--------------------------------------
                // Set timeout to release UTXOs if the signing takes too long
                let timeoutId = setTimeout(async () => {
                    if (transaction) {
                        // alert(`Signing timeout reached! Releasing locked UTXOs for txHash: ${txHash}`);
                        console.warn(`[Lucid] - Signing timeout reached! Releasing locked isPreparing UTXOs for txHash: ${txCompleteHash}`);
                        await TransactionFrontEndApiCalls.releaseUTxOsApi(txCompleteHash, true, false);
                    }
                }, TX_PREPARING_TIME_MS);
                //--------------------------------------
                console.log(`[Lucid] - Tx Resources:`);
                console.warn(toJson(getTxRedeemersDetailsAndResources(txComplete)));
                //--------------------------------------
                let txCompleteSigned: TxSigned;
                try {
                    if (swDoNotPromtForSigning === false && (isEmulator || walletInfo?.isWalletFromSeed === true || walletInfo?.isWalletFromKey === true)) {
                        if (confirm('Sign and Submit Tx') === false) {
                            throw 'User canceled';
                        }
                    }
                    txCompleteSigned = await txComplete.sign.withWallet().complete();
                } catch (error) {
                    throw error;
                }
                //--------------------------------------
                // Signing completed successfully, clear the timeout
                clearTimeout(timeoutId);
                //--------------------------------------
                // NOTE: es importante usar el provider general de lucid y no el de la wallet, sobre todo en emulator, por que la wallet tiene un provider adentro que no se actualiza una vez que se crea la wallet en lucid
                // de esta forma el provider de lucid esta actualizado y bien podria conectar wallet nuevamente o no usar ningun metodo de wallet, usar siempre desde lucid
                // por ejemplo el getUTXO de la wallet no sirve, hay que llamar al utxosAt de lucid.
                const txCompleteSignedHash = await lucid.config().provider!.submitTx(txCompleteSigned.toCBOR());
                //--------------------------------------
                if (isEmulator) {
                    if (walletInfo?.walletKey !== undefined) {
                        let walletKey = walletInfo.walletKey;
                        lucid.selectWallet.fromPrivateKey(walletKey);
                    }
                }
                //--------------------------------------
                if (txCompleteHash !== txCompleteSignedHash) alert('txCompleteHash !== txCompleteSignedHash');
                //--------------------------------------
                if (isEmulator && emulatorDB !== undefined) {
                    // si es emulador tengo que usar awaitTx de lucid para que se agregue la tx al ledger del emulador de lucid
                    await lucid.awaitTx(txCompleteSignedHash);
                    // y guardarlo para que lo pueda leer en el backend
                    await LucidToolsFrontEnd.syncEmulatorAfterTx(lucid, emulatorDB);
                }
                //--------------------------------------
                if (transaction !== undefined) {
                    //--------------------------------------
                    // setea la tx en submitted e inicia el job en el server para actualizar el status revisando la blockchain
                    // el seteo se hace al llamar al begin status updater, en el back end
                    //--------------------------------------
                    await TransactionFrontEndApiCalls.submitAndBeginStatusUpdaterJobApi(transaction.hash);
                }
                //--------------------------------------
                return txCompleteSignedHash;
                //--------------------------------------
            } catch (error: any) {
                if (transaction !== undefined) {
                    if (checkIfUserCanceled(error)) {
                        console.log(`[Lucid] - signAndSubmitTx - User canceled`);
                        await TransactionFrontEndApiCalls.updateCanceledTransactionApi(transaction.hash, { error, walletInfo });
                    } else {
                        console.log(`[Lucid] - signAndSubmitTx - Error: ${error}`);
                        await TransactionFrontEndApiCalls.updateFailedTransactionApi(transaction.hash, { error, walletInfo });
                    }
                }
                throw error;
            }
        } catch (error) {
            console.log(`[Lucid] - signAndSubmitTx - Error: ${error}`);
            throw error;
        }
    }

    public static async awaitTxSimple(lucid: LucidEvolution, txHash: string) {
        try {
            //------------------------
            if (!isEmulator) {
                await sleep(TX_CHECK_INTERVAL_MS);
            }
            //------------------------
            const result = await lucid.awaitTx(txHash);
            //------------------------
            if (!isEmulator) {
                await sleep(TX_PROPAGATION_DELAY_MS);
            }
            //------------------------
            return result;
        } catch (error) {
            console.log(`[Lucid] - awaitTx - Error: ${error}`);
            throw error;
        }
    }

    public static async awaitTx(lucid: LucidEvolution, txHash: string) {
        try {
            // Initialize result
            let result = null;
            //------------------------
            if (!isEmulator) {
                await sleep(TX_CHECK_INTERVAL_MS);
            }
            //------------------------
            // Start checking
            while (true) {
                //------------------------
                // Call your API to check if the transaction is confirmed
                //------------------------
                const txStatus = await TransactionFrontEndApiCalls.getTransactionStatusApi(txHash);
                if (txStatus === TRANSACTION_STATUS_CONFIRMED) {
                    result = true;
                    break;
                } else if (txStatus === TRANSACTION_STATUS_FAILED) {
                    const error = TRANSACTION_STATUS_FAILED;
                    console.log(`[Lucid] - awaitTx - Error: ${error}`);
                    throw error;
                } else if (txStatus === TRANSACTION_STATUS_TIMEOUT) {
                    const error = TRANSACTION_STATUS_TIMEOUT;
                    console.log(`[Lucid] - awaitTx - Error: ${error}`);
                    throw error;
                }
                //------------------------
                // Sleep before the next iteration
                await sleep(TX_CHECK_INTERVAL_MS);
            }
            //------------------------
            if (!isEmulator) {
                await sleep(TX_PROPAGATION_DELAY_MS);
            }
            //------------------------
            return result;
        } catch (error) {
            console.log(`[Lucid] - awaitTx - Error: ${error}`);
            throw error;
        }
    }

    public static async syncEmulatorAfterTx(lucid: LucidEvolution, emulatorDB: EmulatorEntity) {
        // cuando se hace la
        console.log(`[Lucid] - syncEmulatorAfterTx - Saving emulator ledger...`);
        emulatorDB.emulator = lucid.config().provider as any;
        await BaseSmartDBFrontEndApiCalls.updateApi(emulatorDB);
    }

    // public static async syncEmulatorAfterTxBackToFront(walletStore: IUseWalletStore) {
    //     //--------------------------------------
    //     // cargo el emulador desde la base de datos, por que se actualizo en backend cuando se confirmo la tx y lo quiero tener actualizado en el front end tmb
    //     console.log(`[Lucid] - syncEmulatorAfterTxBackToFront - Loading Emulador Ledger...`);
    //     //--------------------------------------
    //     const emulatorDB = await SmartDBApi.getOneByParamsApi<EmulatorEntity>(EmulatorEntity, { current: true });
    //     if (emulatorDB === undefined) {
    //         throw `emulatorDB current not found`;
    //     }
    //     walletStore.setEmulatorDB(emulatorDB);
    // }

    // #endregion use lucid in front end
}

//--------------------------------------
