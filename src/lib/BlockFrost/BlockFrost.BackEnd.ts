import {
    Address,
    Blockfrost,
    CML,
    Credential,
    Datum,
    DatumHash,
    Delegation,
    OutRef,
    RewardAddress,
    Transaction,
    TxHash,
    UTxO,
    Unit,
    applyDoubleCborEncoding,
    fromHex,
} from '@lucid-evolution/lucid';
import { console_error, console_log } from '../../Commons/BackEnd/globalLogs.js';
import { API_TIMEOUT } from '../../Commons/Constants/constants.js';
import { createQueryURLString, sleep, isNullOrBlank, toJson } from '../../Commons/utils.js';
import { fetchWrapperBackEnd } from '../FetchWrapper/FetchWrapper.BackEnd.js';
import { TransactionDetails } from '../../Commons/types.js';
import { addressToPubKeyHash } from '../../Commons/helpers.js';

const lucid = '0.4.24'; // LucidEvolution version

export class BlockfrostCustomProviderBackEnd extends Blockfrost {
    // public url: string;
    // public projectId: string;

    // constructor(url: string, projectId?: string) {
    //     this.url = url;
    //     this.projectId = projectId || '';
    // }

    async getProtocolParameters() {
        const result = await fetchWrapperBackEnd(`${this.url}/epochs/latest/parameters`, {
            headers: { project_id: this.projectId, lucid },
        }).then((res) => res.json());
        return {
            minFeeA: parseInt(result.min_fee_a),
            minFeeB: parseInt(result.min_fee_b),
            maxTxSize: parseInt(result.max_tx_size),
            maxValSize: parseInt(result.max_val_size),
            keyDeposit: BigInt(result.key_deposit),
            poolDeposit: BigInt(result.pool_deposit),
            drepDeposit: BigInt(result.drep_deposit),
            govActionDeposit: BigInt(result.gov_action_deposit),
            priceMem: parseFloat(result.price_mem),
            priceStep: parseFloat(result.price_step),
            maxTxExMem: BigInt(result.max_tx_ex_mem),
            maxTxExSteps: BigInt(result.max_tx_ex_steps),
            coinsPerUtxoByte: BigInt(result.coins_per_utxo_size),
            collateralPercentage: parseInt(result.collateral_percent),
            maxCollateralInputs: parseInt(result.max_collateral_inputs),
            minFeeRefScriptCostPerByte: parseInt(result.min_fee_ref_script_cost_per_byte),
            costModels: result.cost_models,
        };
    }
    async getUtxos(addressOrCredential: string | Credential): Promise<UTxO[]> {
        const queryPredicate = (() => {
            if (typeof addressOrCredential === 'string') return addressOrCredential;
            const credentialBech32 =
                addressOrCredential.type === 'Key'
                    ? CML.Ed25519KeyHash.from_hex(addressOrCredential.hash).to_bech32('addr_vkh')
                    : CML.ScriptHash.from_hex(addressOrCredential.hash).to_bech32('addr_vkh'); // should be 'script' (CIP-0005)
            return credentialBech32;
        })();
        let result: any[] = [];
        let page = 1;
        while (true) {
            const pageResult = await fetchWrapperBackEnd(
                `${this.url}/addresses/${queryPredicate}/utxos?page=${page}`,
                { headers: { project_id: this.projectId, lucid } },
                undefined,
                3
            ).then((res) => res.json());
            if (pageResult.error) {
                if (pageResult.status_code === 404) {
                    return [];
                } else {
                    throw new Error(`Could not fetchWrapperBackEnd UTxOs from Blockfrost. Error: ${toJson(pageResult.error)}`);
                }
            }
            result = result.concat(pageResult);
            if (pageResult.length <= 0) break;
            page++;
        }
        return this.blockfrostUtxosToUtxos2(result);
    }
    async getUtxosWithUnit(addressOrCredential: Address | Credential, unit: Unit): Promise<UTxO[]> {
        const queryPredicate = (() => {
            if (typeof addressOrCredential === 'string') return addressOrCredential;
            const credentialBech32 =
                addressOrCredential.type === 'Key'
                    ? CML.Ed25519KeyHash.from_hex(addressOrCredential.hash).to_bech32('addr_vkh')
                    : CML.ScriptHash.from_hex(addressOrCredential.hash).to_bech32('addr_vkh'); // should be 'script' (CIP-0005)
            return credentialBech32;
        })();
        let result: any[] = [];
        let page = 1;
        while (true) {
            const pageResult = await fetchWrapperBackEnd(
                `${this.url}/addresses/${queryPredicate}/utxos/${unit}?page=${page}`,
                {
                    headers: { project_id: this.projectId, lucid },
                },
                undefined,
                3
            ).then((res) => res.json());
            if (pageResult.error) {
                if (pageResult.status_code === 404) {
                    return [];
                } else {
                    throw new Error(`Could not fetchWrapperBackEnd UTxOs from Blockfrost. Error: ${toJson(pageResult.error)}`);
                }
            }
            result = result.concat(pageResult);
            if (pageResult.length <= 0) break;
            page++;
        }
        return this.blockfrostUtxosToUtxos2(result);
    }
    async getUtxoByUnit(unit: Unit): Promise<UTxO> {
        const addresses = await fetchWrapperBackEnd(`${this.url}/assets/${unit}/addresses?count=2`, { headers: { project_id: this.projectId, lucid } }, undefined, 3).then((res) =>
            res.json()
        );
        if (!addresses || addresses.error) {
            throw new Error('Unit not found.');
        }
        if (addresses.length > 1) {
            throw new Error('Unit needs to be an NFT or only held by one address.');
        }
        const address = addresses[0].address;
        const utxos = await this.getUtxosWithUnit(address, unit);
        if (utxos.length > 1) {
            throw new Error('Unit needs to be an NFT or only held by one address.');
        }
        return utxos[0];
    }
    async getUtxosByOutRef(outRefs: OutRef[]): Promise<UTxO[]> {
        //TODO: Make sure old already spent UTxOs are not retrievable.
        const queryHashes = [...new Set(outRefs.map((outRef) => outRef.txHash))];
        const utxos = await Promise.all(
            queryHashes.map(async (txHash) => {
                const result = await fetchWrapperBackEnd(`${this.url}/txs/${txHash}/utxos`, { headers: { project_id: this.projectId, lucid } }, undefined, 3).then((res) =>
                    res.json()
                );
                if (!result || result.error) {
                    return [];
                }
                const utxosResult: UTxO[] = result.outputs.map(
                    (
                        // deno-lint-ignore no-explicit-any
                        r: any
                    ) => ({
                        ...r,
                        tx_hash: txHash,
                    })
                );
                return this.blockfrostUtxosToUtxos2(utxosResult);
            })
        );
        return utxos
            .reduce((acc, utxos) => acc.concat(utxos), [])
            .filter((utxo) => outRefs.some((outRef) => utxo.txHash === outRef.txHash && utxo.outputIndex === outRef.outputIndex));
    }
    async getDelegation(rewardAddress: RewardAddress): Promise<Delegation> {
        const result = await fetchWrapperBackEnd(`${this.url}/accounts/${rewardAddress}`, { headers: { project_id: this.projectId, lucid } }, undefined, 3).then((res) =>
            res.json()
        );
        if (!result || result.error) {
            return { poolId: null, rewards: 0n };
        }
        return {
            poolId: result.pool_id || null,
            rewards: BigInt(result.withdrawable_amount),
        };
    }
    async getDatum(datumHash: DatumHash): Promise<Datum> {
        const datum = await fetchWrapperBackEnd(
            `${this.url}/scripts/datum/${datumHash}/cbor`,
            {
                headers: { project_id: this.projectId, lucid },
            },
            undefined,
            3
        )
            .then((res) => res.json())
            .then((res) => res.cbor);
        if (!datum || datum.error) {
            throw new Error(`No datum found for datum hash: ${datumHash}`);
        }
        return datum;
    }
    awaitTx(txHash: TxHash, checkInterval = 3000): Promise<boolean> {
        return new Promise((res) => {
            const confirmation = setInterval(async () => {
                const isConfirmed = await fetchWrapperBackEnd(
                    `${this.url}/txs/${txHash}`,
                    {
                        headers: { project_id: this.projectId, lucid },
                    },
                    undefined,
                    3
                ).then((res) => res.json());
                if (isConfirmed && !isConfirmed.error) {
                    clearInterval(confirmation);
                    await new Promise((res) => setTimeout(() => res(1), 1000));
                    return res(true);
                }
            }, checkInterval);
        });
    }
    async submitTx(tx: Transaction): Promise<TxHash> {
        const result = await fetchWrapperBackEnd(
            `${this.url}/tx/submit`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/cbor',
                    project_id: this.projectId,
                    lucid,
                },
                body: fromHex(tx),
            },
            undefined,
            3
        ).then((res) => res.json());
        if (!result || result.error) {
            if (result?.status_code === 400) throw new Error(result.message);
            else throw new Error(`Could not submit transaction: ${toJson(result)}`);
        }
        return result;
    }
    private async blockfrostUtxosToUtxos2(result: any[]): Promise<UTxO[]> {
        return await Promise.all(
            result.map(async (r) => ({
                txHash: r.tx_hash,
                outputIndex: r.output_index,
                assets: Object.fromEntries(r.amount.map(({ unit, quantity }: { unit: string; quantity: number }) => [unit, BigInt(quantity)])),
                address: r.address,
                datumHash: (!r.inline_datum && r.data_hash) || undefined,
                datum: r.inline_datum || undefined,
                scriptRef: r.reference_script_hash
                    ? await (async () => {
                          const { type } = await fetchWrapperBackEnd(`${this.url}/scripts/${r.reference_script_hash}`, {
                              headers: { project_id: this.projectId, lucid },
                          }).then((res) => res.json());
                          //TODO: support native scripts
                          if (type === 'Native' || type === 'native') {
                              throw new Error('Native script ref not implemented!');
                          }
                          const { cbor: script } = await fetchWrapperBackEnd(`${this.url}/scripts/${r.reference_script_hash}/cbor`, {
                              headers: { project_id: this.projectId, lucid },
                          }).then((res) => res.json());
                          return {
                              type: type === 'plutusV1' ? 'PlutusV1' : 'PlutusV2',
                              script: applyDoubleCborEncoding(script),
                          };
                      })()
                    : undefined,
            }))
        );
    }
}

export class BlockFrostBackEnd {
    public static async getTxIsConfirmed_Api(hash: string): Promise<boolean> {
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
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 0, API_TIMEOUT);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                console_log(0, `BlockFrost`, ` getTxIsConfirmed_Api - data: ${toJson(data)} - ${hash}: true - response OK`);
                return true;
            } else {
                // const errorData = await response.json();
                // //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                // //throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                console_log(0, `BlockFrost`, ` getTxIsConfirmed_Api - ${hash}: false - response OK`);
                return false;
            }
            //----------------------------
        } catch (error) {
            console_error(0, `BlockFrost`, ` getTxIsConfirmed_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async getTxCount_Api(scriptAddress: string) {
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
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.tx_count) {
                    throw `Invalid response format: tx_count not found`;
                }
                console_log(0, `BlockFrost`, `getTxCount_Api - tx_count: ${data.tx_count} - response OK`);
                return data.tx_count;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------------------------
        } catch (error) {
            console_error(0, `BlockFrost`, `getTxCount_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async getLatestSlot_Api(): Promise<number | undefined> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost' + '/blocks/latest';
            const requestOptions = {
                method: 'GET',
                headers: {
                    project_id: 'xxxxx',
                },
            };
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.slot) {
                    throw `Invalid response format: slot not found`;
                }
                console_log(0, `BlockFrost`, `getLatestSlot_Api - slot: ${data.slot} - response OK`);
                return Number(data.slot);
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console_error(0, `BlockFrost`, `getLatestSlot_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async getEpochLatest_Api(): Promise<number | undefined> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost/epoch/latest';
            const requestOptions = {
                method: 'GET',
                headers: {
                    project_id: 'xxxxx',
                },
            };
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.epoch) {
                    throw 'Invalid response format: epoch not found';
                }
                console_log(0, 'BlockFrost', `getEpochLatest_Api - epoch: ${data.epoch} - response OK`);
                return Number(data.epoch);
            } else {
                const errorData = await response.json();
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console_error(0, 'BlockFrost', `getEpochLatest_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async getBlockInSlot_Api(slot: number): Promise<number | undefined> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + `/api/blockfrost/blocks/slot/${slot}`;
            const requestOptions = {
                method: 'GET',
                headers: {
                    project_id: 'xxxxx',
                },
            };
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.height) {
                    throw 'Invalid response format: height not found';
                }
                console_log(0, 'BlockFrost', `getBlockInSlot_Api - block height: ${data.height} - block time: ${data.time} - response OK`);
                return Number(data.height);
            } else {
                const errorData = await response.json();
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console_error(0, 'BlockFrost', `getBlockInSlot_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async getEpoch_Api(epoch: number): Promise<any | undefined> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + `/api/blockfrost/epochs/${epoch}`;
            const requestOptions = {
                method: 'GET',
                headers: {
                    project_id: 'xxxxx',
                },
            };
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.epoch) {
                    throw 'Invalid response format: epoch not found';
                }
                console_log(0, 'BlockFrost', `getEpochBlockfrostApi - epoch: ${data.epoch} - start_time: ${data.start_time} - end_time: ${data.end_time} - response OK`);
                return data;
            } else {
                const errorData = await response.json();
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console_error(0, 'BlockFrost', `getEpochBlockfrostApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getPreviusEpochs_Api(last_epoch: number, count: number, page: number): Promise<any | undefined> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + `/api/blockfrost/epochs/${last_epoch}/previous?count=${count}&page=${page}`;
            const requestOptions = {
                method: 'GET',
                headers: {
                    project_id: 'xxxxx',
                },
            };
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                console_log(0, 'BlockFrost', `getAllEpochBlockfrostByCountAndPageApi - len: ${data.length} - response OK`);
                return data;
            } else {
                const errorData = await response.json();
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console_error(0, 'BlockFrost', `getAllEpochBlockfrostByCountAndPageApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getAllPreviusEpochs_Api(last_epoch: number): Promise<any[]> {
        let allData: any[] = [];
        let page = 1;
        const count = 100;
        let dataBatch;

        try {
            while (true) {
                dataBatch = await this.getPreviusEpochs_Api(last_epoch, count, page);
                if (dataBatch && dataBatch.length > 0) {
                    allData = allData.concat(dataBatch);
                    page++;
                } else {
                    break;
                }
            }
        } catch (error) {
            console_error(0, 'BlockFrost', `getAllEpochBlockfrostApi - Error: ${error}`);
            throw error;
        }

        return allData;
    }

    // #region class methods for parse blockchain transactions

    public static async getFromAndToBlockInAddress_Api(address: string): Promise<{ fromBlock: number; toBlock: number } | undefined> {
        //----------
        let fromBlock = 0;
        let toBlock = 0;
        //----------
        try {
            //----------
            const queryString = createQueryURLString({
                count: 1,
                order: 'asc',
            });
            //----------
            const urlApi = `${process.env.NEXT_PUBLIC_REACT_SERVER_URL}/api/blockfrost/addresses/${address}/transactions${queryString}`;
            //----------
            const requestOptions = {
                method: 'GET',
                headers: { project_id: 'xxxxx' },
            };
            //----------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3, API_TIMEOUT);
            //----------
            if (response.status === 200) {
                const transactions = await response.json();
                if (transactions.length === 0) {
                    console_log(0, `BlockFrost`, `getFromAndToBlockInAddress_Api - No transactions found`);
                    return undefined;
                }
                console_log(0, `BlockFrost`, `getFromAndToBlockInAddress_Api - Firts Transaction Block: ${transactions[0].block_height}`);
                //----------
                fromBlock = transactions[0].block_height;
                //----------
            } else if (response.status === 404) {
                console_log(0, `BlockFrost`, `getFromAndToBlockInAddress_Api - Api query not found`);
                return undefined;
            } else {
                const errorData = await response.json();
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------
        } catch (error) {
            console_error(0, `BlockFrost`, `getFromAndToBlockInAddress_Api - Error: ${error}`);
            throw error;
        }
        //----------
        try {
            //----------
            const queryString = createQueryURLString({
                count: 1,
                order: 'desc',
            });
            //----------
            const urlApi = `${process.env.NEXT_PUBLIC_REACT_SERVER_URL}/api/blockfrost/addresses/${address}/transactions${queryString}`;
            //----------
            const requestOptions = {
                method: 'GET',
                headers: { project_id: 'xxxxx' },
            };
            //----------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3, API_TIMEOUT);
            //----------
            if (response.status === 200) {
                const transactions = await response.json();
                if (transactions.length === 0) {
                    console_log(0, `BlockFrost`, `getFromAndToBlockInAddress_Api - No transactions found`);
                    return undefined;
                }
                console_log(0, `BlockFrost`, `getFromAndToBlockInAddress_Api - Last Transaction Block: ${transactions[0].block_height}`);
                //----------
                toBlock = transactions[0].block_height;
                //----------
            } else if (response.status === 404) {
                console_log(0, `BlockFrost`, `getFromAndToBlockInAddress_Api - Api query not found`);
                return undefined;
            } else {
                const errorData = await response.json();
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------
        } catch (error) {
            console_error(0, `BlockFrost`, `getFromAndToBlockInAddress_Api - Error: ${error}`);
            throw error;
        }
        //----------
        return { fromBlock, toBlock };
        //----------
    }

    public static async get_Transactions_Api(address: string, fromBlock?: number, toBlock?: number): Promise<Record<string, any>[] | undefined> {
        //----------
        const transactions: Record<string, any>[] = [];
        //----------
        let page = 1;
        const count = 100; // Fetch 100 transactions per request
        let hasMore = true;
        //----------
        while (hasMore) {
            //----------
            try {
                //----------
                const queryString = createQueryURLString({
                    from: fromBlock,
                    to: toBlock,
                    count: count,
                    page: page,
                    order: 'asc',
                });
                //----------
                const urlApi = `${process.env.NEXT_PUBLIC_REACT_SERVER_URL}/api/blockfrost/addresses/${address}/transactions${queryString}`;
                const requestOptions = {
                    method: 'GET',
                    headers: { project_id: 'xxxxx' },
                };
                const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3, API_TIMEOUT);
                //----------
                if (response.status === 200) {
                    //----------
                    const batchTransactions = await response.json();
                    //----------
                    transactions.push(...batchTransactions);
                    //----------
                    console_log(0, `BlockFrost`, `get_Transactions_Api - Transactions len: ${batchTransactions.length} - response OK`);
                    //----------
                    if (batchTransactions.length < count) {
                        hasMore = false; // Less than count transactions means it's the last page
                    } else {
                        // // HACK: para probar solo con 100
                        // hasMore = false;
                        page++; // Prepare for the next page
                    }
                    //----------
                } else if (response.status === 404) {
                    console_log(0, `BlockFrost`, `get_Transactions_Api - Api query not found`);
                    return transactions.length > 0 ? transactions : undefined;
                } else {
                    const errorData = await response.json();
                    throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                }
            } catch (error) {
                console_error(0, `BlockFrost`, `get_Transactions_Api - Error: ${error}`);
                throw error;
            }
        }
        return transactions;
    }

    public static async getTransactionsDetails_Api(transactionBlockchain: Record<string, any>): Promise<TransactionDetails | undefined> {
        //get utxos inputs & outputs
        const uTXOs = await this.get_TransactionsUTxOs_Api(transactionBlockchain.tx_hash);
        //--------------------------------------
        if (uTXOs !== undefined) {
            //--------------------------------------
            const inputs = uTXOs.inputs;
            const outputs = uTXOs.outputs;
            //--------------------------------------
            const pkh = this.getUserPkh(inputs);
            //--------------------------------------
            //get redeemers
            const redeemersBlockchain = await this.get_TransactionsRedeemers_Api(transactionBlockchain.tx_hash);
            //--------------------------------------
            if (redeemersBlockchain !== undefined) {
                //--------------------------------------
                for (const redeemer of redeemersBlockchain) {
                    const redeemerBlockchainCBOR = await this.get_TransactionsRedeemers_CborFormHash_Api(redeemer.redeemer_data_hash);
                    if (redeemerBlockchainCBOR !== undefined) {
                        redeemer['CBORHex'] = redeemerBlockchainCBOR;
                    } else {
                        throw `Cant get Redeemer CBORHex - ${redeemer.redeemer_data_hash}`;
                    }
                }
                //--------------------------------------
                const transactionDetails: TransactionDetails = {
                    transactionBlockchain,
                    pkh,
                    inputs,
                    outputs,
                    redeemersBlockchain,
                };
                //--------------------------------------
                return transactionDetails;
            } else {
                //--------------------------------------
                throw `Cant get Redeemers - ${transactionBlockchain.tx_hash}`;
                //--------------------------------------
            }
        } else {
            //--------------------------------------
            throw `Cant get UTXOs - ${transactionBlockchain.tx_hash}`;
            //--------------------------------------
        }
    }

    public static async get_TransactionsUTxOs_Api(txHash: string): Promise<Record<string, Record<string, any>[]> | undefined> {
        //-------------------------
        if (isNullOrBlank(txHash)) {
            throw `txHash not defined`;
        }
        //----------------------------
        //transactions?count=100&page=1&order=asc&from=8929261&to=9999269:10
        const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost/txs/' + txHash + '/utxos';
        const requestOptions = {
            method: 'GET',
            headers: {
                project_id: 'xxxxx',
            },
        };
        try {
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3, API_TIMEOUT);
            //----------------------------
            switch (response.status) {
                case 200: {
                    const uTxOs = await response.json();
                    const inputs = uTxOs.inputs;
                    const outputs = uTxOs.outputs;
                    console_log(0, `BlockFrost`, `get_TransactionsUTxOs_Api - inputs len: ${inputs.length} - outputs len: ${outputs.length} - reponse OK`);
                    return { inputs, outputs };
                }
                case 404: {
                    console_log(0, `BlockFrost`, `get_TransactionsUTxOs_Api - Metadata not found`);
                    return undefined;
                }
                default: {
                    const errorData = await response.json();
                    //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                    throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                }
            }
            //----------------------------
        } catch (error) {
            console_error(0, `BlockFrost`, `get_TransactionsUTxOs_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async get_TransactionsRedeemers_Api(txHash: string): Promise<Record<string, any>[] | undefined> {
        //-------------------------
        if (isNullOrBlank(txHash)) {
            throw `txHash not defined`;
        }
        //----------------------------
        //transactions?count=100&page=1&order=asc&from=8929261&to=9999269:10
        const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost/txs/' + txHash + '/redeemers';
        const requestOptions = {
            method: 'GET',
            headers: {
                project_id: 'xxxxx',
            },
        };
        try {
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3, API_TIMEOUT);
            //----------------------------
            switch (response.status) {
                case 200: {
                    const redeemers = await response.json();
                    console_log(0, `BlockFrost`, `get_TransactionsRedeemers_Api - Redeemers len: ${redeemers.length} - reponse OK`);
                    return redeemers;
                }
                case 404: {
                    console_log(0, `BlockFrost`, `get_TransactionsRedeemers_Api - Metadata not found`);
                    return undefined;
                }
                default: {
                    const errorData = await response.json();
                    //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                    throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                }
            }
            //----------------------------
        } catch (error) {
            console_error(0, `BlockFrost`, `get_TransactionsRedeemers_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async get_TransactionsRedeemers_CborFormHash_Api(dataHash: string): Promise<string | undefined> {
        //-------------------------
        if (isNullOrBlank(dataHash)) {
            throw `dataHash not defined`;
        }
        //----------------------------
        const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost/scripts/datum/' + dataHash + '/cbor';
        const requestOptions = {
            method: 'GET',
            headers: {
                project_id: 'xxxxx',
            },
        };
        try {
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions, true, 3, API_TIMEOUT);
            //----------------------------
            switch (response.status) {
                case 200: {
                    const redeemers = await response.json();
                    console_log(0, `BlockFrost`, `get_TransactionsRedeemers_CborFormHash_Api - Redeemers len: ${redeemers.cbor} - reponse OK`);
                    return redeemers.cbor;
                }
                case 404: {
                    console_log(0, `BlockFrost`, `get_TransactionsRedeemers_CborFormHash_Api - Metadata not found`);
                    return undefined;
                }
                default: {
                    const errorData = await response.json();
                    //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                    throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                }
            }
            //----------------------------
        } catch (error) {
            console_error(0, `BlockFrost`, `get_TransactionsRedeemers_CborFormHash_Api - Error: ${error}`);
            throw error;
        }
    }

    public static getUserPkh(inputs: Record<string, any>[]): string {
        const inputFromUser = inputs.find((input) => input.collateral === true);
        if (inputFromUser === undefined) {
            throw new Error('Input From User not found');
        }
        const addressUser = inputFromUser.address;
        const pkh = addressToPubKeyHash(addressUser);
        if (pkh === undefined) {
            throw new Error('Pkh not found');
        }
        return pkh;
    }

    public static getInputFromAddress(inputs: Record<string, any>[], address: string): Record<string, any> {
        const addressInputs = inputs.find((input) => input.address === address && input.reference === false);
        if (addressInputs === undefined) {
            throw new Error(`Input for ${address} not found`);
        }
        return addressInputs;
    }

    public static getInputRefFromAddress(inputs: Record<string, any>[], address: string): Record<string, any> {
        const addressInputs = inputs.find((input) => input.address === address && input.reference === true);
        if (addressInputs === undefined) {
            throw new Error(`Input Ref for ${address} not found`);
        }
        return addressInputs;
    }

    public static getOutputFromAddress(outputs: Record<string, any>[], address: string): Record<string, any> {
        const addressOutputs = outputs.find((output) => output.address === address);
        if (addressOutputs === undefined) {
            throw new Error(`Output for ${address} not found`);
        }
        return addressOutputs;
    }

    public static isThereMintRedeemer(redeemersBlockchain: Record<string, any>[], quantity: number): boolean {
        return redeemersBlockchain.filter((redeemer) => redeemer.purpose === 'mint').length === quantity;
    }

    public static isThereConsumeRedeemer(redeemersBlockchain: Record<string, any>[], quantity: number): boolean {
        return redeemersBlockchain.filter((redeemer) => redeemer.purpose === 'spend').length === quantity;
    }

    public static getMintRedeemers(redeemersBlockchain: Record<string, any>[]): Record<string, any>[] {
        return redeemersBlockchain.filter((redeemer) => redeemer.purpose === 'mint');
    }

    public static getConsumeRedeemers(redeemersBlockchain: Record<string, any>[]): Record<string, any>[] {
        return redeemersBlockchain.filter((redeemer) => redeemer.purpose === 'spend');
    }

    // #endregion class methods for parse blockchain transactions

}
