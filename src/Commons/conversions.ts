import { Assets, Emulator } from "lucid-cardano";
import { Token_With_Metadata_And_Amount, Token_With_Price_And_Date } from './types';
import { concatUint8Arrays, stringHexToUint8Array, intToUint8Array } from "./utils";

//--------------------------------------------------------

// export const serializeBigInt = (value: bigint | undefined) => {
//     if (value !== undefined) {
//         return value.toString();
//     } else {
//         return undefined;
//     }
// }

export const deserealizeBigInt = (value: string | undefined): bigint | undefined => {
    if (value !== undefined && value !== '') {
        return BigInt(value);
    } else {
        return undefined;
    }
};

//--------------------------------------------------------

// export const serializeAssets = (value: Assets | undefined) => {
//     if (value === undefined) return undefined
//     const assetsSerialized: { [x: string]: string } = {};
//     for (const key in value) {
//         assetsSerialized[key] = value[key].toString();
//     }
//     return assetsSerialized;
// };

export const deserealizeAssets = (value: any | undefined): Assets | undefined => {
    if (value === undefined) return undefined;
    const assets: Assets = {};
    for (const key in value) {
        assets[key] = BigInt(value[key]);
    }
    return assets;
};

export const deserealizeTokenWithMetadataAndAmount = (value: any | undefined): Token_With_Metadata_And_Amount | undefined => {
    if (value === undefined) return undefined;
    const assetDetails: Token_With_Metadata_And_Amount = {
        CS: (value as any).CS,
        TN: (value as any).TN,
        amount: BigInt((value as any).amount),
        decimals: (value as any).decimals,
        image: (value as any).image,
        colorHex: (value as any).colorHex,
        metadata_raw: (value as any).metadata,
    };
    return assetDetails;
};

//--------------------------------------------------------

// export const serializeEmulator = (emulator: Emulator | undefined) => {
//     if (emulator === undefined) return undefined
//     let serialized: any = {};
//     serialized = JSON.parse(toJson(emulator));
//     for (const key in emulator.ledger) {
//         const assets = serializeAssets(emulator.ledger[key].utxo.assets);
//         serialized.ledger[key].utxo.assets = assets
//     }
//     return serialized;
// };

export const deserealizeEmulator = (serialized: any | undefined): Emulator | undefined => {
    if (serialized === undefined) return undefined;
    const emulator = new Emulator([]);
    Object.assign(emulator, serialized);
    for (const key in serialized.ledger) {
        const assets = deserealizeAssets(serialized.ledger[key].utxo.assets);
        serialized.ledger[key].utxo.assets = assets;
    }
    return emulator;
};

//--------------------------------------------------------

export function tokenWithDetailsToUint8Array(data: Token_With_Price_And_Date): Uint8Array {
    return concatUint8Arrays([
        stringHexToUint8Array(data.CS),
        stringHexToUint8Array(data.TN),
        data.priceADAx1e6 !== undefined ? intToUint8Array(data.priceADAx1e6) : new Uint8Array([]),
        data.date !== undefined ? intToUint8Array(data.date) : new Uint8Array([]),
    ]);
}
//--------------------------------------------------------
