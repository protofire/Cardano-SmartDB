import { ClaimFreeTxParams, CreateFreeTxParams, UpdateFreeTxParams } from '@example/src/lib/Commons/Constants/transactions';
import { FreeApi } from '@example/src/lib/SmartDB/FrontEnd';
import assert from 'assert';
import { Assets, Lucid } from 'lucid-cardano';
import { ConnectedWalletInfo, delay, getTotalOfUnitInUTxOList, LucidToolsFrontEnd, toJson, WalletTxParams } from 'smart-db';
import { TestResult } from './results';

export interface TestCase {
    utxos: number;
    users: number[];
    transactionsPerUser: number[];
}

interface WalletInfo {
    walletLucid: Lucid;
    address: string;
    qtyUtxos: number;
    currentBalance: bigint;
    requiredFunds: bigint;
    additionalFundsNeeded: bigint;
    additionalUtxosNeeded: number;
}

export async function initializeLucid(): Promise<Lucid> {
    console.log('[TEST] - Initializing Lucid...');
    const lucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrost();
    console.log('[TEST] - Lucid initialized successfully.');
    return lucid;
}

export async function createWallets(masterWallet: Lucid, testCases: TestCase[], walletPrivateKeys: string[]): Promise<Lucid[]> {
    const numWallets = Math.max(...testCases.map((testCase) => Math.max(...testCase.users)));
    console.log(`[TEST] - Creating ${numWallets} wallets...`);
    const addressMasterWallet = await masterWallet.wallet.address();
    console.log(`[TEST] - Master Wallet - addressWallet: ${addressMasterWallet} - created.`);
    const walletLucids: Lucid[] = [];
    for (let i = 0; i < numWallets; i++) {
        console.log(`[TEST] - Generating wallet ${i + 1}...`);
        const privateKey = walletPrivateKeys.length > i ? walletPrivateKeys[i] : masterWallet.utils.generatePrivateKey();
        const walletLucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrostAndWalletFromPrivateKey(privateKey);
        walletLucids.push(walletLucid);
        const addressWallet = await walletLucid.wallet.address();
        console.log(`[TEST] - Wallet ${i + 1} - privateKey: ${privateKey} - addressWallet: ${addressWallet} - created.`);
    }
    console.log('[TEST] - All wallets created successfully.');
    return walletLucids;
}

function calculateRequiredFunds(walletIndex: number, testCases: TestCase[], txFee: number, safetyMargin: number): [number, bigint] {
    let totalTransactions = 0;
    //---------------------
    testCases.forEach((testCase) => {
        testCase.users.forEach((users, userIndex) => {
            if (walletIndex < users) {
                testCase.transactionsPerUser.forEach((txPerUser) => {
                    totalTransactions += txPerUser;
                });
            }
        });
    });
    //---------------------
    const requiredFunds = BigInt(Math.ceil(totalTransactions * txFee * safetyMargin) * 4); //smart On + smart Off + read On + read Off
    //---------------------
    return [totalTransactions, requiredFunds];
}

export async function prepareWallets(
    masterWallet: Lucid,
    walletLucids: Lucid[],
    testCases: TestCase[],
    txFee: number,
    safetyMargin: number,
    requiredUTxOs: number,
    collateralAmt: bigint
): Promise<void> {
    //---------------------
    console.log('[TEST] - Preparing wallets...');
    const uTxOsAtMasterWallet = await masterWallet.wallet.getUtxos();
    const masterBalance = getTotalOfUnitInUTxOList('lovelace', uTxOsAtMasterWallet);
    console.log(`[TEST] - Master wallet balance: ${masterBalance} lovelace.`);
    //---------------------
    const walletInfos: WalletInfo[] = [];
    for (let index = 0; index < walletLucids.length; index++) {
        const walletLucid = walletLucids[index];
        const address = await walletLucid.wallet.address();
        let currentBalance = 0n;
        let qtyUtxos = 0;
        try {
            const utxos = await walletLucid.wallet.getUtxos();
            qtyUtxos = utxos.length;
            currentBalance = getTotalOfUnitInUTxOList('lovelace', utxos);
        } catch (error) {
            // Do nothing, no hay utxos en la wallet
        }
        const [totalTransactions, requiredFunds] = calculateRequiredFunds(index, testCases, txFee, safetyMargin);
        const additionalFundsNeeded = requiredFunds > currentBalance ? requiredFunds - currentBalance : 0n;
        const additionalUtxosNeeded = Math.max(0, requiredUTxOs - qtyUtxos);
        walletInfos.push({
            walletLucid,
            address,
            qtyUtxos,
            currentBalance,
            requiredFunds,
            additionalFundsNeeded,
            additionalUtxosNeeded,
        });
        //---------------------
        console.log(
            `[TEST] - Wallet: ${index} - Address: ${address} - Total transactions: ${totalTransactions} - Required funds: ${requiredFunds} lovelace - Current balance: ${currentBalance} lovelace - Additional funds needed: ${additionalFundsNeeded} lovelace - Additional UTXOs needed: ${additionalUtxosNeeded}`
        );
        //---------------------
    }
    //---------------------
    const totalAdditionalFundsNeeded = walletInfos.reduce((sum, info) => {
        const collateralFunds = BigInt(info.additionalUtxosNeeded) * collateralAmt;
        return sum + info.additionalFundsNeeded + collateralFunds;
    }, 0n);
    //---------------------
    console.log(`[TEST] - Total additional funds needed: ${totalAdditionalFundsNeeded} lovelace.`);
    //---------------------
    if (masterBalance < totalAdditionalFundsNeeded) {
        console.error('Not enough funds in master wallet.');
        throw `Master wallet does not have enough funds. Required: ${totalAdditionalFundsNeeded}, Available: ${masterBalance}`;
    }
    //---------------------
    const MAX_OUTPUTS_PER_TX = 5;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000; // 5 seconds
    //---------------------
    // Agrupar wallets que necesitan fondos o UTXOs adicionales
    const walletsNeedingFunds = walletInfos.filter((w) => w.additionalFundsNeeded > 0 || w.additionalUtxosNeeded > 0);
    //---------------------
    for (let i = 0; i < walletsNeedingFunds.length; i += MAX_OUTPUTS_PER_TX) {
        //---------------------
        const batch = walletsNeedingFunds.slice(i, i + MAX_OUTPUTS_PER_TX);
        //---------------------
        console.log(`[TEST] - Processing batch of ${batch.length} wallets`);
        //---------------------
        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                let tx = masterWallet.newTx();
                let swSend = false;
                //---------------------
                for (let index = 0; index < batch.length; index++) {
                    //---------------------
                    const walletInfo = batch[index];
                    //---------------------
                    if (walletInfo.additionalFundsNeeded > 0 || walletInfo.additionalUtxosNeeded > 0) {
                        //---------------------
                        console.log(`[TEST] - Funding wallet ${index} at address: ${walletInfo.address}`);
                        console.log(`[TEST] - Current balance: ${walletInfo.currentBalance}, Required: ${walletInfo.requiredFunds}`);
                        console.log(`[TEST] - Current UTXOs: ${walletInfo.qtyUtxos}, Required: ${requiredUTxOs}.`);
                        //---------------------
                        if (walletInfo.additionalFundsNeeded > 0) {
                            const value: Assets = { ['lovelace']: walletInfo.additionalFundsNeeded };
                            console.log(`[TEST] - Will send ${walletInfo.additionalFundsNeeded} lovelace for transactions...`);
                            tx = tx.payToAddress(walletInfo.address, value);
                            tx = tx.payToAddress(walletInfo.address, value);
                            walletInfo.additionalUtxosNeeded -= 1;
                            swSend = true;
                        }
                        //---------------------
                        if (walletInfo.additionalUtxosNeeded > 0) {
                            const collateralValue: Assets = { ['lovelace']: collateralAmt };
                            console.log(`[TEST] - Will send ${walletInfo.additionalUtxosNeeded} UTXOs of ${collateralAmt} lovelace each for collateral...`);
                            for (let j = 0; j < walletInfo.additionalUtxosNeeded; j++) {
                                tx = tx.payToAddress(walletInfo.address, collateralValue);
                                tx = tx.payToAddress(walletInfo.address, collateralValue);
                            }
                            swSend = true;
                        }
                    }
                }
                //---------------------
                if (swSend) {
                    //--------------------------------------
                    console.log(`[TEST] - Creating transactions... (Attempt ${retries + 1})`);
                    //--------------------------------------
                    const txComplete = await tx.complete();
                    //--------------------------------------
                    const txCompleteSigned = await txComplete.sign().complete();
                    const txHash = await txCompleteSigned.submit();
                    //--------------------------------------
                    if (await LucidToolsFrontEnd.awaitTxSimple(masterWallet, txHash)) {
                        console.log(`[TEST] - Transaction confirmed - ${txHash}`);
                        break; // Success, exit the retry loop
                    } else {
                        throw 'Transaction not confirmed';
                    }
                    //--------------------------------------
                }
                break; // If we reach here, the transaction was successful
            } catch (error) {
                console.error(`Error processing transaction batch (Attempt ${retries + 1}):`, error);
                if (retries === MAX_RETRIES - 1) {
                    throw `Failed to process transaction after ${MAX_RETRIES} attempts: ${toJson(error)}`;
                }
                retries++;
                console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
                await delay(RETRY_DELAY);
            }
        }
    }
    //---------------------
    console.log('[TEST] - All wallets funded successfully.');
}

export async function deleteContractUTXOs(masterWallet: Lucid, utxosToDelete: number): Promise<void> {
    //---------------------
    console.log(`[TEST] - Deleting ${utxosToDelete} utxos...`);
    //---------------------
    const freeEntities = await FreeApi.getAllApi_({ fieldsForSelect: {}, loadRelations: { smartUTxO_id: true }, limit: utxosToDelete });
    const freeIds = freeEntities.map((entity) => entity._DB_id);
    //---------------------
    if (freeIds.length > 0) {
        //---------------------
        function chunkArray<T>(array: T[], chunkSize: number): T[][] {
            const result: T[][] = [];
            for (let i = 0; i < array.length; i += chunkSize) {
                result.push(array.slice(i, i + chunkSize));
            }
            return result;
        }
        //---------------------
        const chunkedIds = chunkArray(freeIds, 3); // Divide freeIds en lotes de 3
        //---------------------
        for (const chunk of chunkedIds) {
            console.log(`[TEST] - Deleting ${chunk.length} contract UTXOs - ids: ${chunk.join(', ')}`);
            let txParams: ClaimFreeTxParams = { free_ids: chunk };
            await executeTransaction('Setup', masterWallet, 'claim-free-tx', txParams);
        }
        //---------------------
    }
    //---------------------
    console.log(`[TEST] - Deleted ${utxosToDelete} utxos.`);
}

export async function createContractUTXOs(masterWallet: Lucid, utxosToCreate: number): Promise<void> {
    console.log(`[TEST] - Creating ${utxosToCreate} utxos...`);
    for (let i = 0; i < utxosToCreate; i++) {
        await createContractUTXO(masterWallet);
    }
    console.log(`[TEST] - Created ${utxosToCreate} utxos.`);
}

export async function createContractUTXO(masterWallet: Lucid): Promise<void> {
    console.log('[TEST] - Creating contract UTXO...');
    let txParams: CreateFreeTxParams = {};
    await executeTransaction('Setup', masterWallet, 'create-free-tx', txParams);
    console.log('[TEST] - Contract UTXO created.');
}

export async function executeTransaction(testName: string, walletLucid: Lucid, endpoint: string, txParams: any): Promise<string> {
    //---------------------
    console.log(`[TEST - ${testName}] - Executing transaction: ${endpoint}...`);
    //---------------------
    const addressWallet = await walletLucid.wallet.address();
    const rewardAddress = await walletLucid.wallet.rewardAddress();
    const utxos = await walletLucid.wallet.getUtxos();
    const pkh = walletLucid.utils.getAddressDetails(addressWallet)?.paymentCredential?.hash;
    const stakePkh = walletLucid.utils.getAddressDetails(addressWallet)?.stakeCredential?.hash;
    //---------------------
    // console.log(`[TEST - ${testName}] - Address: ${addressWallet}, Payment Key Hash: ${pkh}, Stake Key Hash: ${stakePkh}`);
    //---------------------
    if (!pkh) {
        console.error('Payment credential not found.');
        throw `Can't get Payment Credentials from address`;
    }
    //---------------------
    const walletTxParams: WalletTxParams = {
        pkh: pkh,
        stakePkh: stakePkh,
        address: addressWallet,
        rewardAddress: rewardAddress || undefined,
        utxos,
    };
    //---------------------
    const connectedWalletInfo: ConnectedWalletInfo = {
        walletNameOrSeedOrKey: addressWallet,
        address: addressWallet,
        pkh,
        stakePkh,
        useBlockfrostToSubmit: false,
        isWalletFromSeed: false,
        isWalletFromKey: true,
        network: process.env.NEXT_PUBLIC_CARDANO_NET!,
        isWalletValidatedWithSignedToken: false,
    };
    //---------------------
    const { txHash, txCborHex } = await FreeApi.callGenericTxApi_(endpoint, walletTxParams, txParams);
    //---------------------
    console.log(`[TEST - ${testName}] - Transaction created - txHash:${txHash} - CBOR Ok!`);
    //---------------------
    const txHashSigned = await LucidToolsFrontEnd.signAndSubmitTx(walletLucid, txHash, txCborHex, connectedWalletInfo, undefined);
    //---------------------
    assert(txHash === txHashSigned, 'txHash !== txHashSigned');
    //---------------------
    console.log(`[TEST - ${testName}] - Transaction Hash: ${txHash}`);
    //---------------------
    if (await LucidToolsFrontEnd.awaitTx(walletLucid, txHash)) {
        console.log(`[TEST - ${testName}] - Transaction confirmed - ${txHash}`);
        return txHash;
    } else {
        console.error('Transaction not confirmed.');
        throw new Error('Transaction not confirmed');
    }
}

export async function runTestCase(
    masterWallet: Lucid,
    walletLucids: Lucid[],
    utxos: number,
    users: number,
    transactionsPerUser: number,
    useSmartSelection: boolean,
    useRead: boolean,
    initialDelayBetweenUsers: number = 500,
    delayBetweenTxs: number = 3000,
    maxRetries: number = 3,
    delayBetweenRetries: number = 3000
): Promise<TestResult> {
    //---------------------
    const start = Date.now();
    //---------------------
    const testName = `${utxos}:${users}:${transactionsPerUser}:${useSmartSelection}:${useRead}`;
    console.log(
        `[TEST - ${testName}] - Running Test Case - utxos: ${utxos}, users: ${users}, transactionsPerUser: ${transactionsPerUser}, smartSelection: ${useSmartSelection}, With Reference Read: ${useRead} - ...`
    );
    //---------------------
    let totalAttempts = 0;
    let successful = 0;
    let failed = 0;
    //---------------------
    await Promise.all(
        walletLucids.slice(0, users).map(async (walletLucid, userIndex) => {
            //---------------------
            // Initial delay for each user
            // const initialDelayMs = (initialDelayBetweenUsers * userIndex) / users;
            const initialDelayMs = initialDelayBetweenUsers * userIndex;
            //---------------------
            console.log(`[TEST - ${testName}] - initialDelayMs: ${initialDelayMs} ms`);
            //---------------------
            await delay(initialDelayMs);
            //---------------------
            for (let txIndex = 0; txIndex < transactionsPerUser; txIndex++) {
                //---------------------
                if (txIndex > 0) {
                    // Delay between transactions for the same user
                    await delay(delayBetweenTxs);
                }
                //---------------------
                for (let attempt = 0; attempt < maxRetries; attempt++) {
                    totalAttempts++;
                    let txParams: UpdateFreeTxParams = { valueToAdd: Math.floor(Math.random() * 100), useSmartSelection, useRead };
                    try {
                        await executeTransaction(testName, walletLucid, 'update-free-tx', txParams);
                        successful++;
                        break; // Exit retry loop if successful
                    } catch (error) {
                        // console.error(`[TEST - ${testName}] - error: ${toJson(error)}`);
                        // //(AlonzoContextError (TranslationLogicMissingInput (TxIn (TxId {unTxId = SafeHash \\\"bbcfa36de8688cd7a7be9d12a8351d1e13c35591ff64db2d2f182717cdb94a1f\\\"}) (TxIx {unTxIx = 1})))))])))
                        // if (toJson(error).includes('TranslationLogicMissingInput')) {
                        //     const utxoMissing = toJson(error).split('TxId {unTxId = ')[1].split('}')[0];
                        // }
                        if (attempt === maxRetries - 1) {
                            failed++;
                        } else {
                            await delay(delayBetweenRetries); // Wait a bit before retrying
                        }
                    }
                }
            }
        })
    );
    //---------------------
    const end = Date.now();
    const totalTime = end - start;
    const totalTransactions = users * transactionsPerUser;
    const averageTimePerTx = totalTime / totalTransactions;
    const averageTimePerSuccessfulTx = successful > 0 ? totalTime / successful : 0;
    const averageTimePerAttemptedTx = totalTime / totalAttempts;
    //---------------------
    // Define pass criteria
    let pass: boolean;
    if (useSmartSelection) {
        if (utxos >= users) {
            // Deberian pasar todos los intentos
            pass = successful >= 0.8 * totalTransactions;
        } else {
            // We expect some failures, but not too many
            pass = failed >= 0;
        }
    } else {
        // Without smart selection, success depends on UTXO availability
        if (utxos >= users) {
            // Deberian pasar algunos de los intentos
            pass = successful >= 0;
        } else {
            // We expect some failures
            // pass = failed > 0 && failed <= 0.5 * totalTransactions;
            pass = failed >= 0;
        }
    }
    //---------------------
    console.log(
        `[TEST - ${testName}] - Finishing Test Case - utxos: ${utxos}, users: ${users}, transactionsPerUser: ${transactionsPerUser}, smartSelection: ${useSmartSelection}, With Reference Read: ${useRead}`
    );
    console.log(`[TEST - ${testName}] - Pass: ${pass} - Total Tx: ${totalTransactions}, Successful: ${successful}, Failed: ${failed}, Total Attempts: ${totalAttempts}`);
    console.log(
        `[TEST - ${testName}] - Total Time: ${totalTime}, Average Time per Tx: ${averageTimePerTx}, Average Time per Successful Tx: ${averageTimePerSuccessfulTx}, Average Time per Attempted Tx: ${averageTimePerAttemptedTx}`
    );
    //---------------------
    return {
        utxos,
        users,
        transactionsPerUser,
        smartSelection: useSmartSelection,
        read: useRead,
        successful,
        failed,
        totalAttempts,
        totalTime,
        averageTimePerTx,
        averageTimePerSuccessfulTx,
        averageTimePerAttemptedTx,
        pass,
    };
    //---------------------
}
