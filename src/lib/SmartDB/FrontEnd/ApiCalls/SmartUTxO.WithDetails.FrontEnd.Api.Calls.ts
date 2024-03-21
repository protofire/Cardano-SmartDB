import { Token_With_Metadata_And_Amount, TokensWithMetadataAndAmount } from '../../Commons';
import { SmartUTxOWithDetailsEntity } from '../../Entities/SmartUTxO.WithDetails.Entity';
import { TokenMetadataEntity } from '../../Entities/Token.Metadata.Entity';
import { SmartUTxOFrontEndApiCalls } from './SmartUTxO.FrontEnd.Api.Calls';
import { TokenMetadataFrontEndApiCalls } from './Token.Metadata.FrontEnd.Api.Calls';

export class SmartUTxOWithDetailsFrontEndApiCalls extends SmartUTxOFrontEndApiCalls {
    protected static _Entity = SmartUTxOWithDetailsEntity;
    // #region api

    public static async loadMetadataApi<T extends SmartUTxOWithDetailsEntity>(instance: T) {
        const assets = instance.assets;
        const assetsWithDetails: TokensWithMetadataAndAmount = [];
        for (const [key, value] of Object.entries(assets)) {
            const CS = key.slice(0, 56);
            const TN = key.slice(56);
            const tokenMetadata: TokenMetadataEntity | undefined = await TokenMetadataFrontEndApiCalls.get_Token_MetadataApi(CS, TN);
            const assetDetails: Token_With_Metadata_And_Amount = {
                CS: CS,
                TN: TN,
                amount: value,
                decimals: tokenMetadata?.decimals ?? 0,
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
