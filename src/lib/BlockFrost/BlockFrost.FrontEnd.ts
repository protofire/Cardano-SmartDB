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
import { toJson } from '../../Commons/utils.js';
import { fetchWrapper } from '../FetchWrapper/FetchWrapper.FrontEnd.js';

const lucid = '0.4.24'; // LucidEvolution version

export class BlockfrostCustomProviderFrontEnd extends Blockfrost {
    // public url: string;
    // public projectId: string;

    // constructor(url: string, projectId?: string) {
    //     this.url = url;
    //     this.projectId = projectId || '';
    // }

    async getProtocolParameters() {
        const result = await fetchWrapper(`${this.url}/epochs/latest/parameters`, {
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
            const pageResult = await fetchWrapper(`${this.url}/addresses/${queryPredicate}/utxos?page=${page}`, { headers: { project_id: this.projectId, lucid } }).then((res) =>
                res.json()
            );
            if (pageResult.error) {
                if (pageResult.status_code === 404) {
                    return [];
                } else {
                    throw new Error(`Could not fetchWrapper UTxOs from Blockfrost. Error: ${toJson(pageResult.error)}`);
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
            const pageResult = await fetchWrapper(`${this.url}/addresses/${queryPredicate}/utxos/${unit}?page=${page}`, { headers: { project_id: this.projectId, lucid } }).then(
                (res) => res.json()
            );
            if (pageResult.error) {
                if (pageResult.status_code === 404) {
                    return [];
                } else {
                    throw new Error(`Could not fetchWrapper UTxOs from Blockfrost. Error: ${toJson(pageResult.error)}`);
                }
            }
            result = result.concat(pageResult);
            if (pageResult.length <= 0) break;
            page++;
        }
        return this.blockfrostUtxosToUtxos2(result);
    }
    async getUtxoByUnit(unit: Unit): Promise<UTxO> {
        const addresses = await fetchWrapper(`${this.url}/assets/${unit}/addresses?count=2`, { headers: { project_id: this.projectId, lucid } }).then((res) => res.json());
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
                const result = await fetchWrapper(`${this.url}/txs/${txHash}/utxos`, { headers: { project_id: this.projectId, lucid } }).then((res) => res.json());
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
        const result = await fetchWrapper(`${this.url}/accounts/${rewardAddress}`, { headers: { project_id: this.projectId, lucid } }).then((res) => res.json());
        if (!result || result.error) {
            return { poolId: null, rewards: 0n };
        }
        return {
            poolId: result.pool_id || null,
            rewards: BigInt(result.withdrawable_amount),
        };
    }
    async getDatum(datumHash: DatumHash): Promise<Datum> {
        const datum = await fetchWrapper(`${this.url}/scripts/datum/${datumHash}/cbor`, {
            headers: { project_id: this.projectId, lucid },
        })
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
                const isConfirmed = await fetchWrapper(`${this.url}/txs/${txHash}`, {
                    headers: { project_id: this.projectId, lucid },
                }).then((res) => res.json());
                if (isConfirmed && !isConfirmed.error) {
                    clearInterval(confirmation);
                    await new Promise((res) => setTimeout(() => res(1), 1000));
                    return res(true);
                }
            }, checkInterval);
        });
    }
    async submitTx(tx: Transaction): Promise<TxHash> {
        const result = await fetchWrapper(`${this.url}/tx/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/cbor',
                project_id: this.projectId,
                lucid,
            },
            body: fromHex(tx),
        }).then((res) => res.json());
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
                          const { type } = await fetchWrapper(`${this.url}/scripts/${r.reference_script_hash}`, {
                              headers: { project_id: this.projectId, lucid },
                          }).then((res) => res.json());
                          //TODO: support native scripts
                          if (type === 'Native' || type === 'native') {
                              throw new Error('Native script ref not implemented!');
                          }
                          const { cbor: script } = await fetchWrapper(`${this.url}/scripts/${r.reference_script_hash}/cbor`, {
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

export class BlockFrostFrontEnd {
    // public static async getSlotApi(): Promise<number | undefined> {
    //     try {
    //         //----------------------------
    //         const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost' + '/blocks/latest';
    //         const requestOptions = {
    //             method: 'GET',
    //             headers: {
    //                 project_id: 'xxxxx',
    //             },
    //         };
    //         //----------------------------
    //         const response = await fetchWrapper(urlApi, requestOptions, true, 3);
    //         //----------------------------
    //         if (response.status === 200) {
    //             const data = await response.json();
    //             if (!data.slot) {
    //                 throw `Invalid response format: slot not found`;
    //             }
    //             console.log(`[BlockFrost] - getSlotApi - slot: ${data.slot} - response OK`);
    //             return Number(data.slot);
    //         } else {
    //             const errorData = await response.json();
    //             //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
    //             throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
    //         }
    //     } catch (error) {
    //         console.log(`[BlockFrost] - getSlotApi - Error: ${error}`);
    //         throw error;
    //     }
    // }
}
