import { Assets, CML, LucidEvolution, OutRef, PaymentKeyHash, Script, SignedMessage, UTxO, fromHex, getAddressDetails, toHex, verifyData } from '@lucid-evolution/lucid';
import {
    ADA_TX_FEE_MARGIN,
    LUCID_NETWORK_MAINNET_NAME,
    TOKEN_ADA_TICKER,
    getLUCID_NETWORK_ID
} from './Constants/constants.js';
import { AC, CS, PaymentAndStakePubKeyHash, StakeCredentialPubKeyHash, Token_With_Metadata_And_Amount } from './types.js';
import { TxOutRef } from './typesPlutus.js';
import { bytesUint8ArraToStringHex, hexToStr, isNullOrBlank, isValidHex, searchValueInArray, strToHex } from './utils.js';
import { slotsPerEpochForLucid } from './Constants/protocolParameters.js';
import { TOKENS_EXTERNAL_ORACLE } from './TOKENS_EXTERNAL.js';

//---------------------------------------------------------------

export function isTokenADA(CS: string, TN_Hex: string) {
    return (CS === '' || CS === 'lovelace') && TN_Hex === '';
}

// Verifica si un token es un "Fund Token External"
export const checkIfIsOracleExtenalToken = (CS: string, TN_Hex: string): boolean => {
    const tokens = TOKENS_EXTERNAL_ORACLE;
    if (!tokens) return false;
    return tokens.some((token) => token.CS === CS && token.TN_Hex === TN_Hex);
};

// Obtiene la API para un token específico
export const getOracleExtenalTokenApiRoute = (CS: string, TN_Hex: string): string | undefined => {
    const tokens = TOKENS_EXTERNAL_ORACLE;
    if (!tokens) return undefined;
    const token = tokens.find((token) => token.CS === CS && token.TN_Hex === TN_Hex);
    return token ? token.Api : undefined;
};

//---------------------------------------------------------------


export function isToken_CS_And_TN_Valid(CS: string | undefined, TN_Hex: string | undefined) {
    if (CS === undefined || TN_Hex === undefined) {
        return false;
    }
    if (!isTokenADA(CS, TN_Hex)) {
        if (CS === '' || TN_Hex === '') {
            return false;
        }
        if (!/^[\da-fA-F]{56}$/.test(CS)) {
            return false;
        }
        if (!isValidHex(TN_Hex)) {
            return false;
        }
    }

    return true;
}

//---------------------------------------------------------------

export function getOutRef(txOut: UTxO): OutRef {
    return { txHash: txOut.txHash, outputIndex: txOut.outputIndex } as OutRef;
}

//---------------------------------------------------------------

export function getFallbackImageLetters(token: { CS: string; TN_Hex: string; ticker?: string }) {
    if (!isNullOrBlank(token.ticker)) {
        return token.ticker!.substring(0, 2).toUpperCase();
    } else if (!isNullOrBlank(token.TN_Hex)) {
        return hexToStr(token.TN_Hex)!.substring(0, 2).toUpperCase();
    } else if (!isNullOrBlank(token.CS)) {
        return token.CS!.substring(0, 2).toUpperCase();
    }
    return '';
}

//---------------------------------------------------------------

export function createToken_With_Amount(CS: string, TN_Hex: string, ticker: string | undefined, amount: bigint): Token_With_Metadata_And_Amount {
    return { CS, TN_Hex, ticker: ticker === undefined ? hexToStr(TN_Hex) : ticker, amount };
}

export function createToken_ADA_With_Amount(amount: bigint): Token_With_Metadata_And_Amount {
    return { CS: '', TN_Hex: '', ticker: TOKEN_ADA_TICKER, amount };
}

//---------------------------------------------------------------

export function convert_Tokens_To_Assets(Token_With_Metadata_And_Amount: Token_With_Metadata_And_Amount[]): Assets {
    const assets: Assets = Token_With_Metadata_And_Amount.reduce((acc: Assets, t) => {
        const key = isTokenADA(t.CS, t.TN_Hex) ? 'lovelace' : t.CS + t.TN_Hex;
        if (acc[key]) {
            acc[key] += t.amount;
        } else {
            acc[key] = t.amount;
        }
        return acc;
    }, {});
    return assets;
}

//---------------------------------------------------------------

export function convert_Assets_To_Tokens(assets: Assets): Token_With_Metadata_And_Amount[] {
    return Object.entries(assets).map(([key, amount]) => {
        if (key === 'lovelace') {
            return { CS: '', TN_Hex: '', amount };
        } else {
            const [CS, TN_Hex] = splitTokenLucidKey(key);
            return { CS, TN_Hex, amount };
        }
    });
}

export function splitTokenLucidKey(key: string): [string, string] {
    // Assuming the key is formed by concatenating CS and TN_Hex for non-ADA tokens
    // You need to provide a way to split the key back into CS and TN_Hex
    // Placeholder implementation:
    const CS = key.slice(0, 56);
    const TN_Hex = key.slice(56);
    return [CS, TN_Hex];
}

//---------------------------------------------------------------

export function isValidUrl(url?: string): boolean {
    url = url ?? '';
    // Regular expression to check if the URL is absolute and starts with http://, https://, or ipfs://
    const absoluteUrlPattern = /^(https?:\/\/|ipfs:\/\/).+/;
    // Check if the URL is an absolute URL, starts with a leading slash, or is an IPFS URL
    const res = absoluteUrlPattern.test(url) || url.startsWith('/') || url.startsWith('data:image');
    return res;
}

export function getUrlForImage(url?: string): string {
    if (isValidUrl(url)) {
        return url!.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${url!.slice(7)}` : url!;
    } else {
        return '';
    }
}

//---------------------------------------------------------------

export function isValidHexColor(color: string): boolean {
    // Regular expression to validate hex color (3 or 6 digits, with or without '#')
    const hexColorPattern = /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
    return hexColorPattern.test(color);
}

//---------------------------------------------------------------

export function getScriptFromJson(jsonString: string): Script {
    const json = JSON.parse(jsonString);
    const script: Script = {
        type: json.type === 'PlutusScriptV1' ? 'PlutusV1' : 'PlutusV2',
        script: json.cborHex,
    };
    return script;
}

//--------------------------------------

// #region address and keys conversions

export const addressesToPkhs = (addresses: string): string => {
    const addresses_Array = addresses !== undefined && addresses !== '' ? addresses.split(',').map((admin) => admin.trim()) : [];
    const pkh_Array = addresses_Array.map((address) => {
        if (address === '' || address === undefined) return undefined;
        try {
            const pkh = getAddressDetails(address)?.paymentCredential?.hash;
            return pkh;
        } catch (error) {
            console.log(`[Helpers] - Can't Address: ${address} to Payment Pub Key Hash - Error: ${error}`);
            throw `Can't convert Address: ${address} to Payment Pub Key Hash - ${error}`;
        }
    });
    return pkh_Array.join(',');
};

export const addressToPubKeyHash = (bech32Addr: string) => {
    try {
        const paymentPkh = getAddressDetails(bech32Addr)?.paymentCredential?.hash;
        return paymentPkh;
    } catch (error) {
        console.log(`[Helpers] - addressToPubKeyHash - Error: ${error}`);
        throw error;
    }
};

export const addressToStakePubKeyHash = (bech32Addr: string): StakeCredentialPubKeyHash | undefined => {
    try {
        const stakePkh = getAddressDetails(bech32Addr)?.stakeCredential?.hash;
        return stakePkh;
    } catch (error) {
        console.log(`[Helpers] - addressToStakePubKeyHash - Error: ${error}`);
        throw error;
    }
};

export const addressToPaymentPubKeyHashAndStakePubKeyHash = (bech32Addr: string): PaymentAndStakePubKeyHash => {
    try {
        const paymentPkh = getAddressDetails(bech32Addr)?.paymentCredential?.hash;
        const stakePkh = getAddressDetails(bech32Addr)?.stakeCredential?.hash;
        return { paymentPkh, stakePkh };
    } catch (error) {
        console.log(`[Helpers] - addressToPaymentPubKeyHashAndStakePubKeyHash - Error: ${error}`);
        throw error;
    }
};

export function addressFromHexOrBech32(address: any) {
    try {
        return CML.Address.from_raw_bytes(fromHex(address));
    } catch (_e) {
        try {
            return CML.Address.from_bech32(address);
        } catch (_e) {
            throw `Could not deserialize address.`;
        }
    }
}

// existen las constantes para usar LUCID_NETWORK_MAINNET_ID = 1
// existen las constantes para usar LUCID_NETWORK_TESTNET_ID = 0

export function getAddressFromKeyCborHex(publicKeyCborHex: string, network_id?: number) {
    const publicKeyBytes = Buffer.from(publicKeyCborHex, 'hex');
    // const publicKey = CML.PublicKey.from_raw_bytes(publicKeyBytes); TODO: verificar este cambio
    const publicKey = CML.PublicKey.from_bytes(new Uint8Array(publicKeyBytes));
    const publicKeyHash = publicKey.hash();
    network_id = network_id !== undefined ? network_id : getLUCID_NETWORK_ID();
    const address = Ed25519KeyHashToAddress(network_id, publicKeyHash);
    return address;
}

// existen las constantes para usar LUCID_NETWORK_MAINNET_ID = 1
// existen las constantes para usar LUCID_NETWORK_TESTNET_ID = 0

export function getAddressFromPrivateKeyBench32(privateKeyBench32: string, network_id?: number): string {
    try {
        const priv = CML.PrivateKey.from_bech32(privateKeyBench32);
        const pubKeyHash = priv.to_public().hash();
        network_id = network_id !== undefined ? network_id : getLUCID_NETWORK_ID();
        const address = CML.EnterpriseAddress.new(network_id, CML.Credential.new_pub_key(pubKeyHash)).to_address().to_bech32(undefined);
        return address;
    } catch (error) {
        console.log(`[Helpers] - getAddressFromPrivateKeyBench32 - Error: ${error}`);
        throw error;
    }
}

// existen las constantes para usar LUCID_NETWORK_MAINNET_ID = 1
// existen las constantes para usar LUCID_NETWORK_TESTNET_ID = 0

export function Ed25519KeyHashToAddress(network_id: number, keyHash: CML.Ed25519KeyHash, stakeKeyHash?: CML.Ed25519KeyHash) {
    let address;

    if (stakeKeyHash !== undefined) {
        address = CML.BaseAddress.new(network_id, CML.Credential.new_pub_key(keyHash), CML.Credential.new_pub_key(stakeKeyHash));
    } else {
        address = CML.EnterpriseAddress.new(network_id, CML.Credential.new_pub_key(keyHash));
    }

    const bech32 = address.to_address().to_bech32(undefined);

    return bech32;
}


export function Bip32PublicKeyToAddress(bip32: CML.Bip32PublicKey, network_id: number) {
    let rootPk: CML.Bip32PublicKey = bip32;
    // generate an address pk
    const addressPk = rootPk!
        .derive(1852 + 0x80000000) // Cardano uses 1852 for Shelley purpose paths
        .derive(1815 + 0x80000000) // Cardano coin type
        .derive(0 + 0x80000000) // account #0
        .derive(0) // external chain (see bip44)
        .derive(0); // 0th account

    // get the address public key hash
    const keyHash = addressPk
        .to_raw_key() // strips the chain code
        .hash();

    // get bech32 for address
    const bech32 = Ed25519KeyHashToAddress(network_id, keyHash);

    return bech32;
}

export function Bip32PrivateKeyToAddress(bip32: CML.Bip32PrivateKey, network_id: number) {
    let rootPk: CML.Bip32PrivateKey = bip32;
    // generate an address pk
    const addressPk = rootPk!
        .derive(1852 + 0x80000000) // Cardano uses 1852 for Shelley purpose paths
        .derive(1815 + 0x80000000) // Cardano coin type
        .derive(0 + 0x80000000) // account #0
        .derive(0) // external chain (see bip44)
        .derive(0); // 0th account

    // get the address public key hash
    const keyHash = addressPk
        .to_raw_key() // strips the chain code
        .to_public()
        .hash();

    // get bech32 for address
    const bech32 = Ed25519KeyHashToAddress(network_id, keyHash);

    return bech32;
}

export const pubKeyHashesToAddresses = (pkhs: string, network_id?: number): string => {
    const pkhs_Array = pkhs !== undefined && pkhs !== '' ? pkhs.split(',').map((admin) => admin.trim()) : [];
    const addresses_Array = pkhs_Array.map((pkh) => {
        if (pkh === '' || pkh === undefined) return undefined;
        try {
            network_id = network_id !== undefined ? network_id : getLUCID_NETWORK_ID();
            const address = pubKeyHashToAddress(network_id, pkh);
            return address;
        } catch (error) {
            console.log(`[Helpers] - Can't convert Payment Pub Key Hash: ${pkh} to Address - Error: ${error}`);
            throw `Can't convert Master Payment Pub Key Hash: ${pkh} to Address - ${error}`;
        }
    });
    return addresses_Array.join(',');
};

export function pubKeyHashToAddress(network_id: number, pkh: PaymentKeyHash, stakePkh?: PaymentKeyHash) {
    console.log('pubKeyHashToAddress - pkh: ' + pkh);
    const keyHash = CML.Ed25519KeyHash.from_raw_bytes(fromHex(pkh));
    let stakeKeyHash;
    if (stakePkh !== undefined && stakePkh !== '') {
        stakeKeyHash = CML.Ed25519KeyHash.from_raw_bytes(fromHex(stakePkh));
    } else {
        stakeKeyHash = undefined;
    }
    const bech32 = Ed25519KeyHashToAddress(network_id, keyHash, stakeKeyHash);
    return bech32;
}

// #endregion address and keys conversions

// #region assets operations

//for adding two Assets into one
export function addAssets(as1: Assets, as2: Assets) {
    const units1 = Object.keys(as1);
    const units2 = Object.keys(as2);

    const res: Assets = {};

    for (let i = 0; i < units1.length; i++) {
        res[units1[i]] = as1[units1[i]];
    }

    for (let i = 0; i < units2.length; i++) {
        if (searchValueInArray(units1, units2[i])) {
            res[units2[i]] = as2[units2[i]] + as1[units2[i]];
        } else {
            res[units2[i]] = as2[units2[i]];
        }
    }

    const units3 = Object.keys(res);
    const res2: Assets = {};

    for (let i = 0; i < units3.length; i++) {
        if (res[units3[i]] !== 0n) {
            res2[units3[i]] = res[units3[i]];
        }
    }

    return res2;
}

export function addAssetsList(assetsList: Assets[]): Assets {
    let res: Assets = {};
    for (let i = 0; i < assetsList.length; i++) {
        const as1 = assetsList[i];
        res = addAssets(as1, res);
    }
    return res;
}

export function subsAssets(as1: Assets, as2: Assets) {
    const units1 = Object.keys(as1);
    const units2 = Object.keys(as2);

    const res: Assets = {};

    for (let i = 0; i < units1.length; i++) {
        res[units1[i]] = as1[units1[i]];
    }

    for (let i = 0; i < units2.length; i++) {
        if (searchValueInArray(units1, units2[i])) {
            res[units2[i]] = res[units2[i]] - as2[units2[i]];
        } else {
            res[units2[i]] = -as2[units2[i]];
        }
    }

    const units3 = Object.keys(res);
    const res2: Assets = {};

    for (let i = 0; i < units3.length; i++) {
        if (res[units3[i]] !== 0n) {
            res2[units3[i]] = res[units3[i]];
        }
    }

    return res2;
}

export function subsAssetsList(initial: Assets, assetsList: Assets[]): Assets {
    let res: Assets = initial;

    for (let i = 0; i < assetsList.length; i++) {
        const as1 = assetsList[i];
        res = subsAssets(res, as1);
    }

    return res;
}

// #endregion assets operations

//---------------------------------------------------------------

export function fixUTxOList(utxos: UTxO[]): UTxO[] {
    return utxos.map((u) => ({
        ...u,
        assets: Object.fromEntries(Object.entries(u.assets).map(([k, v]) => [k, BigInt(v.toString())])),
    }));
}

//---------------------------------------------------------------

export function getAssetOfUTxOs(utxos: UTxO[]): Assets {
    const utxoVal: Assets = {};
    utxos.forEach((u) => {
        const assets: Assets = u.assets;
        const ks = Object.keys(assets);
        ks.forEach((k) => {
            let kVal = assets[k];
            kVal = kVal !== undefined ? kVal : 0n;
            let uVal = utxoVal[k];
            uVal = uVal !== undefined ? uVal : 0n;
            utxoVal[k] = BigInt(kVal.toString()) + BigInt(uVal.toString());
        });
    });
    return utxoVal;
}

//---------------------------------------------------------------

// Get new value from utxos substracting a value
export function subAssetsFromUtxos(utxos: UTxO[], value: Assets): Assets {
    const utxoVal: Assets = {};
    const valKs = Object.keys(value);
    utxos.forEach((u) => {
        const assets: Assets = u.assets;
        const ks = Object.keys(assets);
        ks.forEach((k) => {
            let kVal = assets[k];
            kVal = kVal !== undefined ? kVal : 0n;
            let uVal = utxoVal[k];
            uVal = uVal !== undefined ? uVal : 0n;
            utxoVal[k] = BigInt(kVal.toString()) + BigInt(uVal.toString());
        });
    });
    valKs.forEach((k) => {
        let kVal = value[k];
        kVal = kVal !== undefined ? kVal : 0n;
        let uVal = utxoVal[k];
        uVal = uVal !== undefined ? uVal : 0n;
        if (kVal > uVal) {
            throw 'Subtraction Failed.';
        }
        utxoVal[k] = BigInt(uVal.toString()) - BigInt(kVal.toString());
    });
    return utxoVal;
}

//---------------------------------------------------------------

export function isIncludeValue(find: Assets, where: Assets) {
    for (const key of Object.keys(find)) {
        if (where[key] === undefined || find[key] > where[key]) {
            return false;
        }
    }
    return true;
}

//---------------------------------------------------------------

export function sumTokensAmt_From_CS(assets: Assets, token_CS: CS): bigint {
    let total: bigint = 0n;
    for (const [key, value] of Object.entries(assets)) {
        const [CS_, TN_Hex_] = splitTokenLucidKey(key);
        if (token_CS === CS_) {
            total += value;
        }
    }
    return total;
}

//---------------------------------------------------------------

export function sumTokensAmt_From_AC_Lucid(assets: Assets, token_AC_Lucid: AC): bigint {
    let total: bigint = 0n;
    for (const [key, value] of Object.entries(assets)) {
        const AC_ = key;
        if (token_AC_Lucid === AC_) {
            total += value;
        }
    }
    return total;
}

//---------------------------------------------------------------

export function createValue_Adding_Tokens_Of_AC_Lucid(uTxOsAtWallet: UTxO[], aC_Lucid: AC, amount: bigint) {
    // console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - unit: " + unit + " - amount: " + amount)

    const [CS, TN_Hex] = splitTokenLucidKey(aC_Lucid);

    const isADA = aC_Lucid === 'lovelace';
    const isWithoutTokenName = !isADA && TN_Hex === '';

    const assets: Assets = {};

    // console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - isADA: " + isADA + " - isWithoutTokenName: " + isWithoutTokenName)

    if (isWithoutTokenName) {
        let total: bigint = 0n;

        uTxOsAtWallet.forEach((u) => {
            if (total < amount) {
                for (const [key, value] of Object.entries(u.assets)) {
                    if (total < amount) {
                        const [CS_, TN_Hex_] = splitTokenLucidKey(key);
                        if (CS === CS_) {
                            //console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - CS: " + CS + " - CS_: " + CS_ + " - value: " + value)

                            if (total + value < amount) {
                                total += value;
                                assets[key] = value;
                            } else if (total + value === amount) {
                                total += value;
                                assets[key] = value;
                                return assets;
                            } else {
                                const rest = amount - total;
                                total += rest;
                                assets[key] = rest;
                                return assets;
                            }
                        }
                    }
                }
            }
        });
    } else {
        assets[aC_Lucid] = amount;
    }

    // console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - assets: " + log( assets))

    return assets;
}

//---------------------------------------------------------------

export function getTotalOfUnitInUTxOList(aC_Lucid: AC, uTxOsAtWallet: UTxO[], swOnlyAvailable: boolean = false) {
    //swOnlyAvailable: available for spending

    //console.log("storeWallet - getTotalOfUnit - unit: " + aC_Lucid)
    const [CS, TN_Hex] = splitTokenLucidKey(aC_Lucid);

    const isADA = isTokenADA(CS, TN_Hex);
    if (isADA) {
        aC_Lucid = 'lovelace';
    }

    const isWithoutTokenName = !isADA && TN_Hex === '';

    //console.log("storeWallet - getTotalOfUnit - isADA: " + isADA + " - isWithoutTokenName: " + isWithoutTokenName)
    let total: bigint = 0n;
    let requiredAdaForTokens: bigint = 0n; // Sum of minimum ADA required for UTxOs with tokens

    uTxOsAtWallet.forEach((u) => {
        if (isADA) {
            // Calculate the total ADA considering or not the ADA locked with tokens
            const minAdaForThisUTxO = calculateMinAdaOfUTxO(u);
            requiredAdaForTokens += minAdaForThisUTxO;
            total += u.assets[aC_Lucid] as bigint;
        } else if (isWithoutTokenName) {
            for (const [key, value] of Object.entries(u.assets)) {
                const [CS_, TN_Hex_] = splitTokenLucidKey(key);
                if (CS === CS_) {
                    total += value;
                }
            }
        } else {
            if (u.assets[aC_Lucid]) total += u.assets[aC_Lucid] as bigint;
        }
    });

    // When only the available ADA is requested, subtract the ADA required for UTxOs with tokens
    // and consider the margin for transaction fees.
    if (isADA && swOnlyAvailable) {
        // Subtract the required ADA for tokens and the fee margin from the total ADA
        total = total - requiredAdaForTokens - ADA_TX_FEE_MARGIN;
        if (total < 0n) total = 0n;
    }

    //console.log("storeWallet - getTotalOfUnit - total: " + total)
    return BigInt(total.toString()) as bigint;
}

//---------------------------------------------------------------

export function getAssetsFromCS(assets: Assets, token_CS: CS): Assets {
    const assetsRes: Assets = {};
    for (const [key, value] of Object.entries(assets)) {
        let [CS_, TN_Hex_] = splitTokenLucidKey(key);
        const isADA = isTokenADA(CS_, TN_Hex_);
        if (isADA) {
            CS_ = '';
        }
        if (token_CS === 'lovelace') {
            token_CS = '';
        }
        if (token_CS === CS_) {
            assetsRes[key] = value;
        }
    }
    return assetsRes;
}

//---------------------------------------------------------------

export function isNFT_With_AC_Lucid_InValue(assets: Assets, aC_Lucid: AC) {
    let aC_Lucid2 = aC_Lucid;
    if (aC_Lucid === 'lovelace') {
        aC_Lucid2 = '';
    }
    if (aC_Lucid in assets || aC_Lucid2 in assets) {
        if (assets[aC_Lucid] === 1n) {
            return true;
        } else {
            if (assets[aC_Lucid2] === 1n) {
                return true;
            } else {
                return false;
            }
        }
    } else {
        return false;
    }
}

//---------------------------------------------------------------

export function isToken_With_AC_Lucid_InValue(assets: Assets, aC_Lucid: AC) {
    let aC_Lucid2 = aC_Lucid;
    if (aC_Lucid === 'lovelace') {
        aC_Lucid2 = '';
    }
    if (aC_Lucid in assets || aC_Lucid2 in assets) {
        if (assets[aC_Lucid] > 0n) {
            return true;
        } else {
            if (assets[aC_Lucid2] > 0n) {
                return true;
            } else {
                return false;
            }
        }
    } else {
        return false;
    }
}

//---------------------------------------------------------------

//for finding UTxO that is different to txOutRef
export function find_UTxO_Excluding_UTxO_In_UTxOs(uTxO: UTxO, UTxOs: UTxO[]) {
    for (let i = 0; i < UTxOs.length; i++) {
        if (UTxOs[i] !== uTxO) return UTxOs[i];
    }

    return undefined;
}

//---------------------------------------------------------------

//for finding UTxO that is different to txOutRef
export function find_UTxO_Excluding_TxOutRef_In_UTxOs(txOutRef: TxOutRef, UTxOs: UTxO[]) {
    for (let i = 0; i < UTxOs.length; i++) {
        if (UTxOs[i].txHash !== txOutRef.txHash || UTxOs[i].outputIndex !== txOutRef.outputIndex) {
            return UTxOs[i];
        }
    }
    return undefined;
}

//---------------------------------------------------------------

//for finding UTxO that match the txOutRef. Is just the same txOutRef with more data.

export function find_TxOutRef_In_UTxOs(txOutRef: TxOutRef, uTxOs: UTxO[]) {
    for (let i = 0; i < uTxOs.length; i++) {
        if (uTxOs[i].txHash === txOutRef.txHash && uTxOs[i].outputIndex === txOutRef.outputIndex) {
            return uTxOs[i];
        }
    }

    return undefined;
}

//---------------------------------------------------------------

//for finding UTxO that match the txOutRef. Is just the same txOutRef with more data.

export function find_UTxO_In_UTxOs(uTxO: UTxO, uTxOs: UTxO[]) {
    for (let i = 0; i < uTxOs.length; i++) {
        if (uTxOs[i].txHash === uTxO.txHash && uTxOs[i].outputIndex === uTxO.outputIndex) {
            return uTxOs[i];
        }
    }

    return undefined;
}

//------------------------------------------------------

export function findSmallerUTxO(uTxOs: UTxO[]) {
    // if (eUTxOs.length === 0) return undefined

    let [min, minIndex] = [calculateMinAdaOfAssets(uTxOs[0].assets), 0];

    for (let i = 1; i < uTxOs.length; i++) {
        const min_ = calculateMinAdaOfAssets(uTxOs[i].assets);
        if (min_ < min) {
            min = min_;
            minIndex = i;
        }
    }

    return uTxOs[minIndex];
}

//------------------------------------------------------

export function findUTxOWithAssets(utxos: UTxO[], value: Assets): UTxO | undefined {
    for (const uTxO of utxos) {
        if (isIncludeValue(value, uTxO.assets)) {
            return uTxO;
        }
    }
    return undefined;
}

//------------------------------------------------------

// export async function findDatumIfMissing(lucid: Lucid, uTxO: UTxO): Promise<UTxO> {
//     console.log ("findDatumIfMissing")
//     if (uTxO.datumHash && !uTxO.datum) {
//         console.log(`findDatumIfMissing - searching datumHash in Database: ${uTxO.datumHash}`)
//         const datum = await apiGetDatumDB(uTxO.datumHash);
//         if (datum) {
//             console.log(`findDatumIfMissing - datum in Database: ${uTxO.datum}`)
//             uTxO.datum = datum;
//         } else {
//             console.log ("findDatumIfMissing - looking for datumHash in lucid")
//             uTxO.datum = await lucid.config().provider.getDatum(uTxO.datumHash);
//             if (uTxO.datum) {
//                 //console.log(`findDatumIfMissing - datum in lucid: ${uTxO.datum }`)
//                 console.log ("findDatumIfMissing - saving datumHash in Database")
//                 await apiSaveDatumDB(uTxO.datumHash, uTxO.datum);
//             } else {
//                 console.error ("findDatumIfMissing - datumHash not found in lucid" )
//             }
//         }
//         return uTxO;
//     }
//     return uTxO;
// }

//---------------------------------------------------------------

export function calculateMinAda(
    thereIsADAAsset: boolean,
    numAssets: number,
    sumAssetNameLengths: number,
    numPIDs: number,
    isHash: boolean,
    datumBytes: number,
    scriptBytes: number
): bigint {
    const pidSize = 28;
    const coinsPerUTxOByte = 4310;
    const constantOverheadBytes = 160;
    const hashWords = isHash ? 10 : 0; //si hay data hash suman 10 words
    const hashBytes = hashWords * 8; //si hay data hash suman 10 words
    const addressBytes = 63;
    let extraForAssets = numAssets * 5;
    let sizeBytes = sumAssetNameLengths + numPIDs * pidSize + extraForAssets;
    let sizeBytes2 = sizeBytes + addressBytes + hashBytes + datumBytes + scriptBytes;
    if (sizeBytes2 < 67) sizeBytes2 = 67;
    let minADA = coinsPerUTxOByte * (constantOverheadBytes + sizeBytes2);
    let minADAExtra = Math.floor((130 * minADA) / 100); // HACK: 30% mas
    //console.log(toJson({ minADA, minADAExtra, sizeBytes2, thereIsADAAsset, numAssets, sumAssetNameLengths, numPIDs, isHash, datumBytes, scriptBytes }));
    return BigInt(minADAExtra);
}

export function calculateNumAssetsAndPIDS(assets: Assets) {
    let numPIDs = 0,
        numAssets = 0,
        sumAssetNameLengths = 0;
    const pIds = [];
    let swADA: boolean = false;
    for (const [key, value] of Object.entries(assets)) {
        if (key !== 'lovelace') {
            const [CS, TN_Hex] = splitTokenLucidKey(key);
            if (!searchValueInArray(pIds, CS)) {
                pIds.push(CS);
                numPIDs++;
            }
            sumAssetNameLengths += TN_Hex.length / 2;
        } else {
            swADA = true;
        }
        numAssets++;
    }
    return { numAssets, sumAssetNameLengths, numPIDs, swADA };
}
//---------------------------------------------------------------

export function calculateMinAdaOfAssets(assets: Assets): bigint {
    let { numAssets, sumAssetNameLengths, numPIDs, swADA } = calculateNumAssetsAndPIDS(assets);
    const minADA = calculateMinAda(swADA, numAssets, sumAssetNameLengths, numPIDs, false, 0, 0);
    return minADA;
}

export function calculateMinAdaOfUTxO(UTxO: Partial<UTxO>): bigint {
    let { numAssets, sumAssetNameLengths, numPIDs, swADA } = calculateNumAssetsAndPIDS(UTxO.assets!);
    const scriptBytes = UTxO.scriptRef ? UTxO.scriptRef.script.length / 2 + 20 : 0;
    const datumBytes = UTxO.datum ? UTxO.datum.length / 2 + 7 : 0;
    const minADA = calculateMinAda(swADA, numAssets, sumAssetNameLengths, numPIDs, false, datumBytes, scriptBytes);
    return minADA;
}

//---------------------------------------------------------------

export function calculateMinAda_OLD(numAssets: number, sumAssetNameLengths: number, numPIDs: number, isHash: boolean): bigint {
    //Fixed parameters
    const minUTxOValue = 1_000_000;
    //ADA	The minimum number of ADA that must be present in ADA-only UTxOs.
    const pidSize = 28;
    //Bytes	The number of bytes in a policy ID.
    const coinSize = 2;
    //Bytes	At the Alonzo HFC, this parameter was corrected to be 2 because the original value 0 was an implementation error.
    const utxoEntrySizeWithoutVal = 27;
    //Bytes	The number of bytes in a transaction if there were no value at all in it.
    const adaOnlyUTxOSize = Math.round(utxoEntrySizeWithoutVal + coinSize);
    //Bytes	The number of bytes in a transaction if it were to only contain ADA.
    const coinsPerUTxOWord = Math.floor(minUTxOValue / adaOnlyUTxOSize); // = 34482
    // const coinsPerUTxOByte = Math.floor(coinsPerUTxOWord / 8); // = 4310.25

    const hash = isHash ? 10 : 0; //si hay data hash suman 10 words

    function roundupBytesToWords(b: number) {
        return Math.floor((b + 7) / 8);
    }

    const sizeWords = 6 + roundupBytesToWords(numAssets * 12 + sumAssetNameLengths + numPIDs * pidSize);

    let minADA = Math.max(minUTxOValue, coinsPerUTxOWord * (utxoEntrySizeWithoutVal + sizeWords + hash));

    minADA = Math.floor((130 * minADA) / 100); // HACK: 30% mas

    return BigInt(minADA);
}

export function calculateNumAssetsAndPIDS_OLD(assets: Assets) {
    let numPIDs = 0,
        numAssets = 0,
        sumAssetNameLengths = 0;
    const pIds = [];

    for (const [key, value] of Object.entries(assets)) {
        if (key !== 'lovelace') {
            const pId = key.slice(0, 56);
            const tn = key.slice(56);
            if (!searchValueInArray(pIds, pId)) {
                pIds.push(pId);
                numPIDs++;
            }
            sumAssetNameLengths += tn.length / 2;
        }
        numAssets++;
    }
    return { numAssets, sumAssetNameLengths, numPIDs };
}
//---------------------------------------------------------------

export function calculateMinAdaOfAssets_OLD(assets: Assets, isHash: boolean): bigint {
    let { numAssets, sumAssetNameLengths, numPIDs } = calculateNumAssetsAndPIDS_OLD(assets);

    const minADA = calculateMinAda_OLD(numAssets, sumAssetNameLengths, numPIDs, isHash);

    return minADA;
}

//---------------------------------------------------------------

export function signDataByteString(privateKeyBench32: string, data: Uint8Array) {
    //--------------------------------------
    const paymentKey = CML.PrivateKey.from_bech32(privateKeyBench32);
    //--------------------------------------
    const signedSigStruc = paymentKey.sign(data).to_raw_bytes();
    const signature = bytesUint8ArraToStringHex(signedSigStruc);
    //--------------------------------------
    return signature;
}

//---------------------------------------------------------------

export async function signMessage(lucid: LucidEvolution, privateKeyCborHex: string, dataStr: string) {
    //--------------------------------------
    dataStr = dataStr.replace(/:/g, ': ').replace(/,/g, ', ').replace(/\"/g, "'");
    // console.log(`dataStr = ${dataStr}\n`);
    //--------------------------------------
    const dataHex = strToHex(dataStr);
    // console.log(`dataHex = ${dataHex}\n`);
    //--------------------------------------
    let privateKeyBytes = new Uint8Array(Buffer.from(privateKeyCborHex, 'hex'));
    // original length check before slicing
    if (privateKeyBytes.length === 34 || privateKeyBytes.length === 66) {
        privateKeyBytes = privateKeyBytes.slice(2);
    }
    let privateKey;
    if (privateKeyBytes.length === 32) {
        privateKey = CML.PrivateKey.from_normal_bytes(privateKeyBytes);
    } else if (privateKeyBytes.length === 64) {
        privateKey = CML.PrivateKey.from_extended_bytes(privateKeyBytes);
    } else {
        throw new Error(`Invalid private key length: ${privateKeyBytes.length}`);
    }
    const privateKeyBench32 = privateKey.to_bech32();
    //--------------------------------------
    lucid.selectWallet.fromPrivateKey(privateKeyBench32);
    //--------------------------------------
    const address = await lucid.wallet().address();
    //--------------------------------------
    const signature = await lucid.wallet().signMessage(address, dataHex);
    //--------------------------------------
    return signature;
}

export function verifyMessage(lucid: LucidEvolution, publicKeyCborHex: string, dataStr: string, signature: SignedMessage, network_id?: number) {
    //--------------------------------------
    dataStr = dataStr.replace(/:/g, ': ').replace(/,/g, ', ').replace(/\"/g, "'");
    // console.log(`dataStr = ${dataStr}\n`);
    const dataHex = strToHex(dataStr);
    // console.log(`dataHex = ${dataHex}\n`);
    //--------------------------------------
    const address = getAddressFromKeyCborHex(publicKeyCborHex, network_id);
    // console.log(`address = ${address}\n`);
    //--------------------------------------
    const {
        paymentCredential,
        stakeCredential,
        address: { bech32, hex },
    } = getAddressDetails(address);
    //--------------------------------------
    const keyHash = paymentCredential?.hash || stakeCredential?.hash;
    //--------------------------------------
    if (!keyHash) throw new Error('Not a valid address provided.');
    //--------------------------------------
    return verifyData(hex, keyHash, dataHex, signature);
    //--------------------------------------
}

//---------------------------------------------------------------

export function calculateEpochFromSlot(slot: number, network_name?: string): number {
    network_name = network_name !== undefined ? network_name : process.env.NEXT_PUBLIC_CARDANO_NET!;
    let slotsPerEpoch: number = slotsPerEpochForLucid[network_name as keyof typeof slotsPerEpochForLucid];
    if (slotsPerEpoch === undefined) {
        throw new Error('Unsupported network type');
    }
    return Math.floor(slot / slotsPerEpoch);
}

//---------------------------------------------------------------

