import { ExternalWallet, Lucid, PrivateKey, TxSigned, WalletApi } from 'lucid-cardano';
import {
    ConnectedWalletInfo,
    TRANSACTION_STATUS_CONFIRMED,
    TRANSACTION_STATUS_FAILED,
    TRANSACTION_STATUS_TIMEOUT,
    TX_CHECK_INTERVAL,
    WalletTxParams,
    createErrorObject,
    delay,
    isEmptyObject_usingJson,
    isEmulator,
    isObject,
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
            const lucid = await Lucid.new(
                new BlockfrostCustomProviderFrontEnd(process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost', 'xxxx'),
                process.env.NEXT_PUBLIC_CARDANO_NET! as any
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
                lucid.selectWallet(walletApi);
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
            lucid.selectWalletFromSeed(walletSeed, options);
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
            lucid.selectWalletFromPrivateKey(walletPrivateKey);
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
            lucid.selectWalletFrom(wallet);
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

            const emulatorTime = emulatorDB.emulator.time;
            emulatorDB.emulator.time = emulatorDB.zeroTime;
            const lucid = await Lucid.new(emulatorDB.emulator);
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
            lucid.selectWalletFromSeed(walletSeed, options);
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
            lucid.selectWalletFromPrivateKey(walletPrivateKey);
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
            lucid.selectWalletFrom(wallet);
            return lucid;
        } catch (error) {
            console.log(`[Lucid] - initializeLucidWithEmulatorAndExternalWallet - Error: ${error}`);
            throw error;
        }
    };

    // #endregion initialize lucid

    // #region use lucid in front end

    public static async prepareLucidForUseAsUtils(emulatorDB?: EmulatorEntity) {
        let lucid: Lucid;
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

    public static async prepareLucidFrontEndForTx(walletStore: IUseWalletStore): Promise<{ lucid: Lucid; emulatorDB?: EmulatorEntity; walletTxParams: WalletTxParams }> {
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
            const address = await lucid.wallet.address();
            const rewardAddress = await lucid.wallet.rewardAddress();
            const utxos = await lucid.wallet.getUtxos();
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

    public static getTxMemAndStepsUse(txSize: number, txJson: string) {
        const tx = JSON.parse(txJson);
        const witness_set = tx.witness_set;
        const redeemers = witness_set.redeemers;
        const result = [];
        var mem = 0;
        var steps = 0;
        if (redeemers?.length) {
            for (var i = 0; i < redeemers.length; i += 1) {
                result.push({ TAG: redeemers[i].tag, MEM: Number(redeemers[i].ex_units.mem) / 1_000_000, STEPS: Number(redeemers[i].ex_units.steps) / 1_000_000_000 });
                mem += Number(redeemers[i].ex_units.mem);
                steps += Number(redeemers[i].ex_units.steps);
            }
        }
        //console.log ("getTxMemAndStepsUse - protocolParameters: " + toJson (protocolParameters))
        result.push({ SIZE: txSize, MEM: mem / 1_000_000, STEPS: steps / 1_000_000_000 });
        // result.push({ "MAX SIZE": maxTxSize, "MAX MEM": maxTxExMem / 100_0000, "MAX STEPS": maxTxExSteps / 100_0000_000 })

        return result;
    }

    public static async signAndSubmitTx(lucid: Lucid, txHash: string, txCborHex: string, walletInfo?: ConnectedWalletInfo, emulatorDB?: EmulatorEntity) {
        try {
            console.log(`[Lucid] - signAndSubmitTx`);
            //--------------------------------------
            let txComplete = lucid.fromTx(txCborHex);
            //--------------------------------------
            const txCompleteHash = txComplete.toHash();
            //--------------------------------------
            if (txCompleteHash !== txHash) alert('txCompleteHash !== txHash');
            //--------------------------------------
            const transaction = await TransactionFrontEndApiCalls.getOneByParamsApi<TransactionEntity>(TransactionEntity, { hash: txHash });
            //--------------------------------------
            console.log(`[Lucid] - Tx Resources:`);
            const txSize = txComplete.txComplete.to_bytes().length;
            console.info(toJson(this.getTxMemAndStepsUse(txSize, txComplete.txComplete.to_json())));
            //--------------------------------------
            let txCompleteSigned: TxSigned;
            //--------------------------------------
            if (isEmulator) {
                if (confirm('Sign and Submit Tx') === false) {
                    throw 'User canceled';
                }
            }
            //--------------------------------------
            txCompleteSigned = await txComplete.sign().complete();
            //--------------------------------------
            const txCompleteSignedHash = await txCompleteSigned.submit();
            //--------------------------------------
            if (txCompleteHash !== txCompleteSignedHash) alert('txCompleteHash !== txCompleteSignedHash');
            //--------------------------------------
            if (isEmulator && emulatorDB !== undefined) {
                // si es emulador tengo que usar awaitTx de lucid para que se agregue la tx al ledger del emulador de lucid
                await lucid.awaitTx(txHash);
                // y guardarlo para que lo pueda leer en el backend
                await LucidToolsFrontEnd.syncEmulatorAfterTx(lucid, emulatorDB);
            }
            //--------------------------------------
            // setea la tx en submitted e inicia el job en el server para actualizar el status revisando la blockchain
            // el seteo se hace al llamar al begin status updater, en el back end
            //--------------------------------------
            await TransactionFrontEndApiCalls.submitAndBeginStatusUpdaterJobApi(txCompleteSignedHash);
            //--------------------------------------
            return txCompleteSignedHash;
            //--------------------------------------
        } catch (error) {
            //--------------------------------------
            console.log(`[Lucid] - signAndSubmitTx - Error: ${error}`);
            //--------------------------------------
            const errorObj = createErrorObject(error);
            //--------------------------------------
            await TransactionFrontEndApiCalls.updateFailedTransactionApi(txHash, { error: errorObj, walletInfo });
            //--------------------------------------
            throw error;
        }
    }

    public static async awaitTxSimple(lucid: Lucid, txHash: string) {
        try {
            const result = await lucid.awaitTx(txHash);
            await delay(TX_CHECK_INTERVAL);
            return result;
        } catch (error) {
            console.log(`[Lucid] - awaitTx - Error: ${error}`);
            throw error;
        }
    }

    public static async awaitTx(lucid: Lucid, txHash: string) {
        try {
            await delay(1000);
            // Initialize result
            let result = null;
            // Start checking
            while (true) {
                // Call your API to check if the transaction is confirmed
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
                // Sleep for TX_CHECK_INTERVAL seconds before the next iteration
                await delay(TX_CHECK_INTERVAL);
            }
            return result;
        } catch (error) {
            console.log(`[Lucid] - awaitTx - Error: ${error}`);
            throw error;
        }
    }

    public static async syncEmulatorAfterTx(lucid: Lucid, emulatorDB: EmulatorEntity) {
        // cuando se hace la
        console.log(`[Lucid] - syncEmulatorAfterTx - Saving emulator ledger...`);
        emulatorDB.emulator = lucid.provider as any;
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
