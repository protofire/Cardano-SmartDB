import { Assets, Emulator, UTxO } from '@lucid-evolution/lucid';
import { Token_With_Metadata_And_Amount, Token_With_Price_And_Date, Token_With_Price_And_Date_And_Signature_And_Amount_And_Metadata } from './types.js';
import { concatUint8Arrays, intToUint8Array, stringHexToUint8Array, toJson } from "./utils.js";
import { ValueTransformer } from 'typeorm';

//--------------------------------------------------------

// export const serializeBigInt = (value: bigint | undefined) => {
//     if (value !== undefined) {
//         return value.toString();
//     } else {
//         return undefined;
//     }
// }

export const deserealizeBigInt = (value: string | undefined): bigint | undefined => {
    if (value !== undefined && value !== null && value !== '') {
        return BigInt(value);
    } else {
        return undefined;
    }
};

//--------------------------------------------------------  

export const UTxOTransformer: ValueTransformer = {
    to: (value: UTxO[]) => {
      if (!value) return null;
      return value.map(utxo => toJson(utxo));
    },
    from: (value: any) => {
      if (!value) return null;
      return value.map((v: any) => JSON.parse(v)); // asumimos que existe UTxO.fromJson
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
    const tokenMetadataAndAmount: Token_With_Metadata_And_Amount = {
        CS: (value as any).CS,
        TN_Hex: (value as any).TN_Hex,
        amount: BigInt((value as any).amount),
        ticker: (value as any).ticker,
        decimals: (value as any).decimals,
        image: (value as any).image,
        colorHex: (value as any).colorHex,
        metadata_raw: (value as any).metadata,
    };
    return tokenMetadataAndAmount;
};

export const deserealizeTokenWithPriceAndMetadataAndAmount = (value: any | undefined): Token_With_Price_And_Date_And_Signature_And_Amount_And_Metadata | undefined => {
    if (value === undefined) return undefined;
    const tokenWithPriceMetadataAndAmount: Token_With_Price_And_Date_And_Signature_And_Amount_And_Metadata = {
        CS: (value as any).CS,
        TN_Hex: (value as any).TN_Hex,
        priceADAx1e6: (value as any).priceADAx1e6 !== undefined ? BigInt((value as any).priceADAx1e6) : undefined,
        date: (value as any).date !== undefined ? BigInt((value as any).date) : undefined,
        signature: (value as any).signature,
        amount: BigInt((value as any).amount),
        ticker: (value as any).ticker,
        decimals: (value as any).decimals,
        image: (value as any).image,
        colorHex: (value as any).colorHex,
        metadata_raw: (value as any).metadata,
    };
    return tokenWithPriceMetadataAndAmount;
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
        stringHexToUint8Array(data.TN_Hex),
        data.priceADAx1e6 !== undefined ? intToUint8Array(data.priceADAx1e6) : new Uint8Array([]),
        data.date !== undefined ? intToUint8Array(data.date) : new Uint8Array([]),
    ]);
}
//--------------------------------------------------------
