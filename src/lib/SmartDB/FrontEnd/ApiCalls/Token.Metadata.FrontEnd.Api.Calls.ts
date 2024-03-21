import { Assets } from 'lucid-cardano';
import { ADA_DECIMALS } from '@/src/utils/specific/constants';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls';
import { Token_With_Metadata_And_Amount, TokensWithMetadataAndAmount, type CS, type TN, isTokenADA, isToken_CS_And_TN_Valid, OptionsGet, optionsGetDefault } from '../../Commons';
import { showData, createQueryURLString, hexToStr, isEqual, toJson } from '@/src/utils/commons/utils';
import { TokenMetadataEntity } from '../../Entities/Token.Metadata.Entity';

export class TokenMetadataFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = TokenMetadataEntity;
    // #region api

    public static async getAssetsWithDetailsApi(assets: Assets): Promise<TokensWithMetadataAndAmount> {
        //-------------------------
        const assetsWithDetails: TokensWithMetadataAndAmount = [];
        for (const [key, value] of Object.entries(assets)) {
            const CS = key.slice(0, 56);
            const TN = key.slice(56);
            const tokenMetadata: TokenMetadataEntity | undefined = await this.get_Token_MetadataApi(CS, TN, undefined, TokenMetadataEntity.optionsGetForTokenStore);
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
        return assetsWithDetails;
    }

    public static async get_Token_MetadataApi(CS: CS, TN_Hex: TN, forceRefresh?: boolean, optionsGet?: OptionsGet): Promise<TokenMetadataEntity | undefined> {
        //-------------------------
        try {
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN not defined`;
            }
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN not valid`;
            }
            //------------------
            const queryString = createQueryURLString({ CS, TN: TN_Hex, forceRefresh });
            //------------------
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/metadata-by-Token${queryString}`);
            } else {
                const body = toJson(optionsGet);
                response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/metadata-by-Token${queryString}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                });
            }
            //------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - get_Token_MetadataApi - CS: ${CS} - TN: ${hexToStr(TN_Hex)} - response OK`);
                const instance: TokenMetadataEntity = TokenMetadataEntity.fromPlainObject<TokenMetadataEntity>(data);
                console.log(`[${this._Entity.className()}] - get_Token_MetadataApi - Instance: ${instance.show()}`);
                return instance;
            } else if (response.status === 404) {
                console.log(`[${this._Entity.className()}] - get_Token_MetadataApi - CS: ${CS} - TN: ${hexToStr(TN_Hex)} - Token Metadata not found`);
                return undefined;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - get_Token_MetadataApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
