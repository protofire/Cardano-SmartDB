import { Assets } from 'lucid-cardano';
import { OptionsGet, Token_With_Metadata_And_Amount, TokensWithMetadataAndAmount, createQueryURLString, hexToStr, isEqual, isToken_CS_And_TN_Valid, optionsGetDefault, splitTokenLucidKey, toJson, type CS, type TN } from '../../Commons/index.js';
import { TokenMetadataEntity } from '../../Entities/Token.Metadata.Entity.js';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls.js';
import fetchWrapper from '../../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
export class TokenMetadataFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = TokenMetadataEntity;
    // #region api

    public static async getAssetsWithDetailsApi(assets: Assets): Promise<TokensWithMetadataAndAmount> {
        //-------------------------
        const tokensMetadata: TokenMetadataEntity[] = await this.get_Tokens_MetadataApi(
            Object.entries(assets).map(([key, value]) => {
                const [CS, TN_Hex] = splitTokenLucidKey(key);
                return { CS, TN_Hex };
            }),
            undefined,
            TokenMetadataEntity.optionsGetForTokenStore
        );
        const assetsWithDetails: TokensWithMetadataAndAmount = [];
        for (const [key, value] of Object.entries(assets)) {
            const [CS, TN_Hex] = splitTokenLucidKey(key);
            const tokenMetadata: TokenMetadataEntity | undefined = tokensMetadata.find((token) => token.CS === CS && token.TN_Hex === TN_Hex);
            const assetDetails: Token_With_Metadata_And_Amount = {
                CS: CS,
                TN_Hex,
                amount: value,
                decimals: tokenMetadata?.decimals,
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
                throw `CS or TN_Hex not defined`;
            }
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN_Hex not valid`;
            }
            //------------------
            console.log(`[${this._Entity.className()}] - get_Token_MetadataApi - Init - Token: CS: ${CS} - TN_Hex: ${hexToStr(TN_Hex)}`);
            //------------------
            const queryString = createQueryURLString({ CS, TN_Hex, forceRefresh });
            //------------------
            let response;
            if (isEqual(optionsGet, optionsGetDefault)) {
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/metadata-by-Token${queryString}`);
            } else {
                const body = toJson(optionsGet);
                response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/metadata-by-Token${queryString}`, {
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
                console.log(`[${this._Entity.className()}] - get_Token_MetadataApi - CS: ${CS} - TN_Hex: ${hexToStr(TN_Hex)} - response OK`);
                const instance: TokenMetadataEntity = TokenMetadataEntity.fromPlainObject<TokenMetadataEntity>(data);
                console.log(`[${this._Entity.className()}] - get_Token_MetadataApi - CS: ${CS} - TN_Hex: ${hexToStr(TN_Hex)} - Instance: ${instance.show()}`);
                return instance;
            } else if (response.status === 404) {
                console.log(`[${this._Entity.className()}] - get_Token_MetadataApi - CS: ${CS} - TN_Hex: ${hexToStr(TN_Hex)} - Token Metadata not found`);
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

    public static async get_Tokens_MetadataApi(tokens: { CS: CS; TN_Hex: TN }[], forceRefresh?: boolean, optionsGet?: OptionsGet): Promise<TokenMetadataEntity[]> {
        //-------------------------
        try {
            //----------------------------
            if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
                throw `CS or TN_Hex not defined`;
            }
            if (!tokens.every((token) => isToken_CS_And_TN_Valid(token.CS, token.TN_Hex))) {
                throw `CS or TN_Hex not valid`;
            }
            //------------------
            console.log(`[${this._Entity.className()}] - get_Tokens_MetadataApi - Init - Tokens: ${tokens?.map((t) => hexToStr(t.TN_Hex ?? '')).join(', ')}`);
            //------------------
            // remove duplicates in tokens list
            tokens = tokens.filter((token, index) => tokens.findIndex((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) === index);
            //----------------------------
            const body = toJson({ tokens, forceRefresh, optionsGet });
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/metadata-by-Tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            //-------------------------
            if (response.status === 200) {
                const datas = await response.json();
                console.log(`[${this._Entity.className()}] - get_Tokens_MetadataApi - response OK`);
                const instances: TokenMetadataEntity[] = datas.map((data: any) => TokenMetadataEntity.fromPlainObject<TokenMetadataEntity>(data));
                console.log(`[${this._Entity.className()}] - get_Tokens_MetadataApi - len: ${instances.length}`);
                //-------------------------
                console.log(
                    `[${this._Entity.className()}] - get_Tokens_MetadataApi - Tokens: ${instances
                        ?.map((t) => {
                            return `${hexToStr(t.TN_Hex ?? '')}: ${t.decimals}`;
                        })
                        .join(', ')}`
                );
                //-------------------------
                return instances;
            } else if (response.status === 404) {
                console.log(`[${this._Entity.className()}] - get_Tokens_MetadataApi - Tokens Metadata not found`);
                return [];
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - get_Tokens_MetadataApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
