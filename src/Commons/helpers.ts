import { Assets, C, PaymentKeyHash, Script, UTxO, fromHex, toHex } from 'lucid-cardano';

import { AC, CS, Decimals, PaymentAndStakePubKeyHash, StakeCredentialPubKeyHash, Token_With_Metadata_And_Amount } from './types';
import { formatAmount, hexToStr, isNullOrBlank, searchValueInArray } from './utils';
import { ADA_DECIMALS, ADA_TX_FEE_MARGIN, ADA_UI, LUCID_NETWORK_MAINNET_INT, LUCID_NETWORK_TESTNET_INT, LucidLUCID_NETWORK_MAINNET_NAME } from './constants';
import { TxOutRef } from './classes';

//---------------------------------------------------------------

export function isTokenADA(CS: string, TN: string) {
    return (CS === '' || CS === 'lovelace') && TN === '';
}

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
        if (!/^[\da-fA-F]+$/.test(TN_Hex)) {
            return false;
        }
    }

    return true;
}

export function formatHash(txHash: string) {
    return isNullOrBlank(txHash) ? '' : txHash.slice(0, 4) + '...' + txHash.slice(txHash.length - 4);
}

export function formatCurrencySymbol(cs: string) {
    if (cs === '' || cs === 'lovelace') return 'ADA';
    return cs.slice(0, 4) + '...' + cs.slice(cs.length - 4);
}

export function formatTokenName(tn: string) {
    if (tn === '') return ADA_UI;
    if (tn.length > 30) {
        return tn.slice(0, 30) + '...';
    }
    return tn;
}

export function formatAddress(address: string, isSmall: boolean = true) {
    if (isSmall) {
        return isNullOrBlank(address) ? '' : address.length < 5 + 3 + 4 ? address : address.slice(0, 5) + '...' + address.slice(address.length - 4);
    } else {
        return isNullOrBlank(address) ? '' : address.length < 20 + 3 + 10 ? address : address.slice(0, 20) + '...' + address.slice(address.length - 10);
    }
}

export function formatUTxO(txHash: string, outputIndex: number) {
    return `${formatHash(txHash)}#${outputIndex}`;
}


export function formatTokenAmount(
    amount: bigint | number | undefined,
    CS: string,
    TN_Hex?: string,
    showDecimals: Decimals = 0,
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0,
    decimalsInBigUnit: Decimals = showDecimals
): string {
    if (typeof amount !== 'number' && amount !== undefined) {
        amount = Number(amount);
    }
    if (CS === ADA_UI || CS === '' || CS === 'lovelace') {
        if (amount === undefined) {
            return `... ${ADA_UI}`;
        }
        return formatAmountWithUnit(amount, ADA_DECIMALS, ADA_UI, swRoundWithLetter, showAtLeastDecimals, ADA_DECIMALS);
    } else if (TN_Hex !== undefined) {
        if (amount === undefined) {
            return `... ${hexToStr(TN_Hex)}`;
        }
        return formatAmountWithUnit(amount, showDecimals, hexToStr(TN_Hex), swRoundWithLetter, showAtLeastDecimals, decimalsInBigUnit);
    }
    return '';
}

export function formatAmountWithUnit(
    amount: bigint | number,
    showDecimals: Decimals = 0,
    unit: string = '',
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0,
    decimalsInBigUnit: Decimals = showDecimals
) {
    //-------------
    if (typeof amount !== 'number') {
        amount = Number(amount);
    }
    //-------------
    let roundedValueWithDecimals = amount;
    //-------------
    // if (showDecimals !== decimalsInBigUnit) {
    //-------------
    // si esta seteando estos valores diferentes, aqui calculo el valor real de la unidad grande
    // y mas abajo, si no esta seteado rounbdWithLetter, lo vuelvo a multiplicar, esta vez por el valor de showDecimals, por que a su vez el formatAmount lo va a dividir por ese valor
    const potDecimalsInBigUnit = Math.pow(10, decimalsInBigUnit);
    const realValueInBiGUnit = amount / potDecimalsInBigUnit;
    //-------------
    roundedValueWithDecimals = realValueInBiGUnit;
    // }
    //-------------
    if (swRoundWithLetter === true) {
        //-------------
        let decimals_: Decimals = showAtLeastDecimals;
        //-------------
        if (amount < Math.pow(10, decimalsInBigUnit - showAtLeastDecimals) && amount > 0) {
            //-------------
            if (unit !== '' && (unit === ADA_UI || decimalsInBigUnit === 6)) {
                //-------------
                // eso significa que el numero es menor que el menor valor que se va a mostrar con estos decimales
                // resto dos, por que quiero igual seguir usando el otro valor, que
                //-------------
                if (unit === ADA_UI) {
                    unit = 'lovelace';
                } else {
                    if (decimalsInBigUnit === 6) {
                        unit = 'μ' + unit;
                    } else {
                        // esto por ahora no entra nunca... en el futuro si, pero no es facil para el usuario
                        unit = `x10-${decimalsInBigUnit}` + unit;
                    }
                }
                //-------------
                roundedValueWithDecimals = amount;
                //-------------
            } else {
                decimals_ = showDecimals;
            }
        }
        //-------------
        if (!unit.startsWith(' ') && unit !== '') {
            unit = ' ' + unit;
        }
        //-------------
        if (roundedValueWithDecimals >= 1e18) {
            roundedValueWithDecimals /= 1e18;
            unit = 'QT' + unit;
        } else if (roundedValueWithDecimals >= 1e15) {
            roundedValueWithDecimals /= 1e15;
            unit = 'Q' + unit;
        } else if (roundedValueWithDecimals >= 1e12) {
            roundedValueWithDecimals /= 1e12;
            unit = 'T' + unit;
        } else if (roundedValueWithDecimals >= 1e9) {
            roundedValueWithDecimals /= 1e9;
            unit = 'B' + unit;
        } else if (roundedValueWithDecimals >= 1e6) {
            roundedValueWithDecimals /= 1e6;
            unit = 'M' + unit;
        } else if (roundedValueWithDecimals >= 1e3) {
            roundedValueWithDecimals /= 1e3;
            unit = 'K' + unit;
        }
        //-------------
        if (roundedValueWithDecimals === Math.floor(roundedValueWithDecimals)) {
            decimals_ = 0;
        }
        //-------------
        const potShowDecimals = Math.pow(10, decimals_);
        //-------------
        return formatAmount(roundedValueWithDecimals * potShowDecimals, decimals_, 0) + unit;
        //-------------
    } else {
        //-------------
        if (!unit.startsWith(' ') && unit !== '') {
            unit = ' ' + unit;
        }
        //-------------
        // if (showDecimals !== decimalsInBigUnit) {
        const potShowDecimals = Math.pow(10, showDecimals);
        roundedValueWithDecimals = roundedValueWithDecimals * potShowDecimals;
        // }
        //-------------
        return formatAmount(roundedValueWithDecimals, showDecimals, showAtLeastDecimals) + unit;
        //-------------
    }
}

//---------------------------------------------------------------

export function formatPercentage(
    amount: bigint | number,
    showDecimals: Decimals = 0,
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0,
    decimalsInBigUnit: Decimals = showDecimals
) {
    return formatAmountWithUnit(amount, showDecimals, '', swRoundWithLetter, showAtLeastDecimals, decimalsInBigUnit) + '%';
}

//---------------------------------------------------------------

export function createToken_With_Amount(CS: string, TN: string, amount: bigint): Token_With_Metadata_And_Amount {
    return { CS, TN, amount };
}

export function createToken_ADA_With_Amount(amount: bigint): Token_With_Metadata_And_Amount {
    return { CS: '', TN: '', amount };
}

//---------------------------------------------------------------

export function convert_Tokens_To_Assets(Token_With_Metadata_And_Amount: Token_With_Metadata_And_Amount[]): Assets {
    const assets: Assets = Token_With_Metadata_And_Amount.reduce((acc: Assets, t) => {
        const key = isTokenADA(t.CS, t.TN) ? 'lovelace' : t.CS + t.TN;
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
            return { CS: '', TN: '', amount };
        } else {
            const [CS, TN] = splitTokenKey(key);
            return { CS, TN, amount };
        }
    });
}

function splitTokenKey(key: string): [string, string] {
    // Assuming the key is formed by concatenating CS and TN for non-ADA tokens
    // You need to provide a way to split the key back into CS and TN
    // Placeholder implementation:
    const CS = key.slice(0, 56);
    const TN = key.slice(56);
    return [CS, TN];
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

// #region address to ... conversions

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

function addressFromHexOrBech32(address: any) {
    try {
        return C.Address.from_bytes(fromHex(address));
    } catch (_e) {
        try {
            return C.Address.from_bech32(address);
        } catch (_e) {
            throw `Could not deserialize address.`;
        }
    }
}

/** Address can be in Bech32 or Hex. */
export function getAddressDetails(address: any) {
    // Base Address
    try {
        const parsedAddress = C.BaseAddress.from_address(addressFromHexOrBech32(address));

        if (parsedAddress === undefined) {
            throw `Could not deserialize address.`;
        }

        const paymentCredential =
            parsedAddress.payment_cred().kind() === 0
                ? {
                      type: 'Key',
                      hash: toHex(parsedAddress.payment_cred().to_keyhash()!.to_bytes()),
                  }
                : {
                      type: 'Script',
                      hash: toHex(parsedAddress.payment_cred().to_scripthash()!.to_bytes()),
                  };
        const stakeCredential =
            parsedAddress.stake_cred().kind() === 0
                ? {
                      type: 'Key',
                      hash: toHex(parsedAddress.stake_cred().to_keyhash()!.to_bytes()),
                  }
                : {
                      type: 'Script',
                      hash: toHex(parsedAddress.stake_cred().to_scripthash()!.to_bytes()),
                  };
        return {
            type: 'Base',
            networkId: parsedAddress.to_address().network_id(),
            address: {
                bech32: parsedAddress.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress.to_address().to_bytes()),
            },
            paymentCredential,
            stakeCredential,
        };
    } catch (_e) {
        /* pass */
    }
    // Enterprise Address
    try {
        const parsedAddress = C.EnterpriseAddress.from_address(addressFromHexOrBech32(address));

        if (parsedAddress === undefined) {
            throw `Could not deserialize address.`;
        }

        const paymentCredential =
            parsedAddress.payment_cred().kind() === 0
                ? {
                      type: 'Key',
                      hash: toHex(parsedAddress.payment_cred().to_keyhash()!.to_bytes()),
                  }
                : {
                      type: 'Script',
                      hash: toHex(parsedAddress.payment_cred().to_scripthash()!.to_bytes()),
                  };
        return {
            type: 'Enterprise',
            networkId: parsedAddress.to_address().network_id(),
            address: {
                bech32: parsedAddress.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress.to_address().to_bytes()),
            },
            paymentCredential,
        };
    } catch (_e) {
        /* pass */
    }
    // Pointer Address
    try {
        const parsedAddress = C.PointerAddress.from_address(addressFromHexOrBech32(address));

        if (parsedAddress === undefined) {
            throw `Could not deserialize address.`;
        }

        const paymentCredential =
            parsedAddress.payment_cred().kind() === 0
                ? {
                      type: 'Key',
                      hash: toHex(parsedAddress.payment_cred().to_keyhash()!.to_bytes()),
                  }
                : {
                      type: 'Script',
                      hash: toHex(parsedAddress.payment_cred().to_scripthash()!.to_bytes()),
                  };
        return {
            type: 'Pointer',
            networkId: parsedAddress.to_address().network_id(),
            address: {
                bech32: parsedAddress.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress.to_address().to_bytes()),
            },
            paymentCredential,
        };
    } catch (_e) {
        /* pass */
    }
    // Reward Address
    try {
        const parsedAddress = C.RewardAddress.from_address(addressFromHexOrBech32(address));

        if (parsedAddress === undefined) {
            throw `Could not deserialize address.`;
        }

        const stakeCredential =
            parsedAddress.payment_cred().kind() === 0
                ? {
                      type: 'Key',
                      hash: toHex(parsedAddress.payment_cred().to_keyhash()!.to_bytes()),
                  }
                : {
                      type: 'Script',
                      hash: toHex(parsedAddress.payment_cred().to_scripthash()!.to_bytes()),
                  };
        return {
            type: 'Reward',
            networkId: parsedAddress.to_address().network_id(),
            address: {
                bech32: parsedAddress.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress.to_address().to_bytes()),
            },
            stakeCredential,
        };
    } catch (_e) {
        /* pass */
    }
    // Limited support for Byron addresses
    try {
        const parsedAddress = ((address) => {
            try {
                return C.ByronAddress.from_bytes(fromHex(address));
            } catch (_e) {
                try {
                    return C.ByronAddress.from_base58(address);
                } catch (_e) {
                    throw `Could not deserialize address.`;
                }
            }
        })(address);
        return {
            type: 'Byron',
            networkId: parsedAddress.network_id(),
            address: {
                bech32: '',
                hex: toHex(parsedAddress.to_address().to_bytes()),
            },
        };
    } catch (_e) {
        /* pass */
    }
    throw `No address type matched for: ` + address;
}

// #endregion address to ... conversions

// #region address from PubHeyHash conversions

// network: mainnet = 1    Tesnet = 0
// existen las constantes para usar Lucid_Network_Mainnet_Int = 1
// existen las constantes para usar Lucid_Network_Testnet_Int = 0

export function Ed25519KeyHashToAddress(network: number, keyHash: C.Ed25519KeyHash, stakeKeyHash?: C.Ed25519KeyHash) {
    let address;

    if (stakeKeyHash !== undefined) {
        address = C.BaseAddress.new(network, C.StakeCredential.from_keyhash(keyHash), C.StakeCredential.from_keyhash(stakeKeyHash));
    } else {
        address = C.EnterpriseAddress.new(network, C.StakeCredential.from_keyhash(keyHash));
    }

    const bech32 = address.to_address().to_bech32(undefined);

    return bech32;
}

export function Bip32PublicKeyToAddress(bip32: C.Bip32PublicKey, network: number) {
    let rootPk: C.Bip32PublicKey = bip32;
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
    const bech32 = Ed25519KeyHashToAddress(network, keyHash);

    return bech32;
}

function Bip32PrivateKeyToAddress(bip32: C.Bip32PrivateKey, network: number) {
    let rootPk: C.Bip32PrivateKey = bip32;
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
    const bech32 = Ed25519KeyHashToAddress(network, keyHash);

    return bech32;
}

export const pubKeyHashesToAddresses = (pkhs: string): string => {
    const pkhs_Array = pkhs !== undefined && pkhs !== '' ? pkhs.split(',').map((admin) => admin.trim()) : [];
    const addresses_Array = pkhs_Array.map((pkh) => {
        if (pkh === '' || pkh === undefined) return undefined;
        try {
            const address = pubKeyHashToAddress(
                process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME ? LUCID_NETWORK_MAINNET_INT : LUCID_NETWORK_TESTNET_INT,
                pkh
            );
            return address;
        } catch (error) {
            console.log(`[Helpers] - Can't convert Payment Pub Key Hash: ${pkh} to Address - Error: ${error}`);
            throw `Can't convert Master Payment Pub Key Hash: ${pkh} to Address - ${error}`;
        }
    });
    return addresses_Array.join(',');
};

export function pubKeyHashToAddress(network: number, pkh: PaymentKeyHash, stakePkh?: PaymentKeyHash) {
    console.log('pubKeyHashToAddress - pkh: ' + pkh);
    const keyHash = C.Ed25519KeyHash.from_bytes(fromHex(pkh));
    let stekeKeyHash;
    if (stakePkh !== undefined && stakePkh !== '') {
        stekeKeyHash = C.Ed25519KeyHash.from_bytes(fromHex(stakePkh));
    } else {
        stekeKeyHash = undefined;
    }
    const bech32 = Ed25519KeyHashToAddress(network, keyHash, stekeKeyHash);
    return bech32;
}

// #endregion address from PubHeyHash conversions

// #region address from PrivateKey conversions

export async function getAddressFromPrivateKey(privateKey: string): Promise<string> {
    try {
        const priv = C.PrivateKey.from_bech32(privateKey);
        const pubKeyHash = priv.to_public().hash();
        const address = await C.EnterpriseAddress.new(
            process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME ? LUCID_NETWORK_MAINNET_INT : LUCID_NETWORK_TESTNET_INT,
            C.StakeCredential.from_keyhash(pubKeyHash)
        )
            .to_address()
            .to_bech32(undefined);
        return address;
    } catch (error) {
        console.log(`[Helpers] - getAddressFromPrivateKey - Error: ${error}`);
        throw error;
    }
}

// #endregion address from PrivateKey conversions

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
        const CS_ = key.slice(0, 56);
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

    const CS = aC_Lucid.slice(0, 56);
    const TN = aC_Lucid.slice(56);

    const isADA = aC_Lucid === 'lovelace';
    const isWithoutTokenName = !isADA && TN === '';

    const assets: Assets = {};

    // console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - isADA: " + isADA + " - isWithoutTokenName: " + isWithoutTokenName)

    if (isWithoutTokenName) {
        let total: bigint = 0n;

        uTxOsAtWallet.forEach((u) => {
            if (total < amount) {
                for (const [key, value] of Object.entries(u.assets)) {
                    if (total < amount) {
                        const CS_ = key.slice(0, 56);

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

    const CS = aC_Lucid.slice(0, 56);
    const TN = aC_Lucid.slice(56);

    const isADA = aC_Lucid === 'lovelace';
    const isWithoutTokenName = !isADA && TN === '';

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
                const CS_ = key.slice(0, 56);
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
        if(total < 0n) total = 0n;
    }

    //console.log("storeWallet - getTotalOfUnit - total: " + total)
    return BigInt(total.toString()) as bigint;
}

//---------------------------------------------------------------

export function getAssetsFromCS(assets: Assets, token_CS: CS): Assets {
    const assetsRes: Assets = {};
    for (const [key, value] of Object.entries(assets)) {
        const CS_ = key.slice(0, 56);
        if (token_CS === CS_) {
            assetsRes[key] = value;
        }
    }
    return assetsRes;
}

//---------------------------------------------------------------

export function isNFT_With_AC_Lucid_InValue(assets: Assets, aC_Lucid: AC) {
    if (aC_Lucid in assets) {
        if (assets[aC_Lucid] === 1n) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

//---------------------------------------------------------------

export function isToken_With_AC_Lucid_InValue(assets: Assets, aC_Lucid: AC) {
    if (aC_Lucid in assets) {
        if (assets[aC_Lucid] > 0n) {
            return true;
        } else {
            return false;
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
//             uTxO.datum = await lucid.provider.getDatum(uTxO.datumHash);
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
            const pId = key.slice(0, 56);
            const tn = key.slice(56);
            if (!searchValueInArray(pIds, pId)) {
                pIds.push(pId);
                numPIDs++;
            }
            sumAssetNameLengths += tn.length / 2;
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


export function getInputValueFromSmallUnitPriceLovelace1xe6(smallUnitPriceLovelace1xe6: bigint | number | undefined, decimals: Decimals): bigint  | undefined{
    if (smallUnitPriceLovelace1xe6 === undefined) return undefined;
    if (typeof smallUnitPriceLovelace1xe6 !== 'number' && smallUnitPriceLovelace1xe6 !== undefined) {
        smallUnitPriceLovelace1xe6 = Number(smallUnitPriceLovelace1xe6);
    }
    const extra1e6Decimales = 6
    const inputDecimales = extra1e6Decimales + ADA_DECIMALS - decimals
    // const reverseSmallUnitPriceLovelace = smallUnitPriceLovelace1xe6 / 10 ** extra1e6Decimales;
    // console.log(`reverseSmallUnitPriceLovelace: ${reverseSmallUnitPriceLovelace}`);
    // const reverseUnitPriceLovelace = reverseSmallUnitPriceLovelace * 10 ** decimals;
    // console.log(`reverseUnitPriceLovelace: ${reverseUnitPriceLovelace}`);
    // const reverseUnitPriceADA = reverseUnitPriceLovelace / 10 ** ADA_DECIMALS;
    // console.log(`reverseUnitPriceADA: ${reverseUnitPriceADA}`);
    // const reverseInputValue = reverseUnitPriceADA * 10 ** inputDecimales;
    // console.log(`reverseInputValue: ${reverseInputValue}`);
    const reverseInputValue1Step = BigInt(Math.floor(smallUnitPriceLovelace1xe6 * 10 ** (inputDecimales-ADA_DECIMALS+decimals-extra1e6Decimales)));
    // console.log(`reverseInputValue1Step: ${reverseInputValue1Step}`);
    return reverseInputValue1Step
}

export function getSmallUnitPriceLovelace1xe6FromInputValue(inputValue: bigint | number | undefined, decimals: Decimals): bigint  | undefined{
    if (inputValue === undefined) return undefined;
    if (typeof inputValue !== 'number' && inputValue !== undefined) {
        inputValue = Number(inputValue);
    }
    const extra1e6Decimales = 6
    const inputDecimales = extra1e6Decimales + ADA_DECIMALS - decimals
    // const unitPriceADA = inputValue / 10 ** inputDecimales;
    // console.log(`unitPriceADA: ${unitPriceADA}`);
    // const unitPriceLovelace = unitPriceADA * 10 ** ADA_DECIMALS;
    // console.log(`unitPriceLovelace: ${unitPriceLovelace}`);
    // const smallUnitPriceLovelace = unitPriceLovelace / 10 ** decimals!;
    // console.log(`smallUnitPriceLovelace: ${smallUnitPriceLovelace}`);
    // const smallUnitPriceLovelace1xe6 = (Math.floor(smallUnitPriceLovelace * 10 **extra1e6Decimales));
    // console.log(`smallUnitPriceLovelace1xe6: ${smallUnitPriceLovelace1xe6}`);
    const smallUnitPriceLovelace1xe61Step = BigInt(Math.floor(inputValue * 10 **(-inputDecimales+ADA_DECIMALS-decimals+extra1e6Decimales)));
    // console.log(`smallUnitPriceLovelace1xe61Step: ${smallUnitPriceLovelace1xe61Step}`);
    return smallUnitPriceLovelace1xe61Step
}