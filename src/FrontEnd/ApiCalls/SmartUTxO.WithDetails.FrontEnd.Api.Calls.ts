import { TokenMetadataEntity } from '../../backEnd.js';
import {
    Token_With_Metadata_And_Amount,
    TokensWithMetadataAndAmount,
    splitTokenLucidKey
} from '../../Commons/index.js';
import { SmartUTxOWithDetailsEntity } from '../../Entities/SmartUTxO.WithDetails.Entity.js';
import { SmartUTxOFrontEndApiCalls } from './SmartUTxO.FrontEnd.Api.Calls.js';
import { TokenMetadataFrontEndApiCalls } from './Token.Metadata.FrontEnd.Api.Calls.js';

export class SmartUTxOWithDetailsFrontEndApiCalls extends SmartUTxOFrontEndApiCalls {
    protected static _Entity = SmartUTxOWithDetailsEntity;
    // #region api

    public static async loadMetadataApi<T extends SmartUTxOWithDetailsEntity>(instance: T) {
        const assets = instance.assets;
        const assetsWithDetails: TokensWithMetadataAndAmount = [];
        for (const [key, value] of Object.entries(assets)) {
            const [CS, TN_Hex] = splitTokenLucidKey(key);
            const tokenMetadata: TokenMetadataEntity | undefined = await TokenMetadataFrontEndApiCalls.get_Token_MetadataApi(CS, TN_Hex);
            const assetDetails: Token_With_Metadata_And_Amount = {
                CS,
                TN_Hex,
                amount: value,
                ticker: tokenMetadata?.ticker,
                decimals: tokenMetadata?.decimals,
                image: tokenMetadata?.image,
                colorHex: tokenMetadata?.colorHex,
                metadata_raw: tokenMetadata?.metadata_raw,
            };
            assetsWithDetails.push(assetDetails);
        }
        instance.assetsWithDetails = assetsWithDetails;
    }

    // #endregion api
}
