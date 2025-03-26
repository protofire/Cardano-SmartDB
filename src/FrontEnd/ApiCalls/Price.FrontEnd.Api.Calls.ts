import fetchWrapper from '../../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
import {
    Token_With_Price_And_Date_And_Signature,
    createQueryURLString,
    hexToStr,
    isTokenADA,
    isToken_CS_And_TN_Valid,
    showData,
    toJson,
    type CS,
    type TN,
} from '../../Commons/index.js';
import { PriceEntity } from '../../Entities/Price.Entity.js';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls.js';

export class PriceFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = PriceEntity;

    // #region api

    public static async get_Token_PriceADAx1e6_Api(
        CS: CS,
        TN_Hex: TN,
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature | undefined> {
        try {
            //------------------
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN_Hex not defined`;
            }
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN_Hex not valid`;
            }
            //------------------
            console.log(`[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - Init - Token: CS: ${CS} - TN_Str: ${hexToStr(TN_Hex)}`);
            //------------------
            const isADA = isTokenADA(CS, TN_Hex);
            //------------------
            if (isADA) {
                const priceADAx1e6 = 1_000_000n;
                //----------------------------
                const token: Token_With_Price_And_Date_And_Signature = { CS, TN_Hex, priceADAx1e6, date: undefined, signature: undefined };
                //----------------------------
                console.log(
                    `[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - Token: CS: ${CS} - TN_Str: ${hexToStr(TN_Hex)} - priceADAx1e6: ${priceADAx1e6} - response OK`
                );
                return token;
            }
            //------------------
            const queryString = createQueryURLString({ CS, TN_Hex, forceRefresh, validityMS, forceUseOracle });
            //------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/get-priceADAx1e6${queryString}`);
            //------------------
            if (response.status === 200) {
                //-------------------------
                console.log(`[${this._Entity.apiRoute()}] - get_Token_PriceADAx1e6_Api - response OK`);
                //-------------------------
                const data = await response.json();
                //----------------------------
                const token: Token_With_Price_And_Date_And_Signature = {
                    ...data,
                    priceADAx1e6: data.priceADAx1e6 !== undefined ? BigInt(data.priceADAx1e6) : undefined,
                    date: data.date !== undefined ? BigInt(data.date) : undefined,
                };
                //----------------------------
                console.log(
                    `[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - Token: CS: ${CS} - TN_Str: ${hexToStr(TN_Hex)} - priceADAx1e6: ${
                        data.priceADAx1e6 !== undefined ? BigInt(data.priceADAx1e6) : undefined
                    }`
                );
                return token;
            } else if (response.status === 404) {
                console.log(`[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - CS: ${CS} - TN_Str: ${hexToStr(TN_Hex)} - Token PriceADAx1e6 not found`);
                return undefined;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async get_Tokens_PriceADAx1e6_Api(
        tokens: { CS: CS; TN_Hex: TN }[],
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature[]> {
        try {
            //----------------------------
            if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
                throw `CS or TN_Hex not defined`;
            }
            if (!tokens.every((token) => isToken_CS_And_TN_Valid(token.CS, token.TN_Hex))) {
                throw `CS or TN_Hex not valid`;
            }
            //------------------
            console.log(`[${this._Entity.className()}] - get_Tokens_PriceADAx1e6_Api - Init - Tokens: ${tokens?.map((t) => hexToStr(t.TN_Hex)).join(', ')}`);
            //------------------
            // standarize ADA and remove duplicates in tokens list
            // tokens = tokens.map((token) => {
            //     if (isTokenADA(token.CS, token.TN_Hex)) {
            //         return { ...token, CS: '', TN_Hex: '' };
            //     }
            //     return token;
            // });
            //------------------
            tokens = tokens.filter((token, index) => tokens.findIndex((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) === index);
            //----------------------------
            const body = toJson({ tokens, forceRefresh, validityMS, forceUseOracle });
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/get-pricesADAx1e6`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            //-------------------------
            if (response.status === 200) {
                //-------------------------
                console.log(`[${this._Entity.className()}] - get_Tokens_PriceADAx1e6_Api - response OK`);
                //-------------------------
                const data = await response.json(); // assuming `data` is an array of tokens
                // Format each token's data
                const tokensWithPrices: Token_With_Price_And_Date_And_Signature[] = data.map((token: Token_With_Price_And_Date_And_Signature) => ({
                    ...token,
                    priceADAx1e6: token.priceADAx1e6 !== undefined ? BigInt(token.priceADAx1e6) : undefined,
                    date: token.date !== undefined ? BigInt(token.date) : undefined,
                }));
                //-------------------------
                console.log(
                    `[${this._Entity.className()}] - get_Tokens_PriceADAx1e6_Api - Tokens: ${tokensWithPrices
                        ?.map((t) => {
                            return `${hexToStr(t.TN_Hex)}: ${t.priceADAx1e6 !== undefined ? BigInt(t.priceADAx1e6) : undefined}`;
                        })
                        .join(', ')}`
                );
                //-------------------------
                return tokensWithPrices;
                //-------------------------
            } else if (response.status === 404) {
                console.log(`[${this._Entity.className()}] - get_Tokens_PriceADAx1e6_Api - Tokens PriceADAx1e6 not found`);
                return [];
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - get_Tokens_PriceADAx1e6_Api - Error: ${error}`);
            throw error;
        }
    }

    public static async set_Token_PriceADAx1e6_Api(CS: CS, TN_Hex: TN, priceADAx1e6: bigint): Promise<Token_With_Price_And_Date_And_Signature | undefined> {
        try {
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN_Hex not defined`;
            }
            const isADA = isTokenADA(CS, TN_Hex);
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN_Hex not valid`;
            }
            //------------------
            if (isADA) {
                const priceADAx1e6 = 1_000_000n;
                //----------------------------
                const token: Token_With_Price_And_Date_And_Signature = { CS, TN_Hex, priceADAx1e6, date: undefined, signature: undefined };
                //----------------------------
                console.log(`[${this._Entity.className()}] - set_Token_PriceADAx1e6_Api - Token PriceADAx1e6: ${showData(token)} - response OK`);
                return token;
            }
            //-------------------------
            const body = toJson({ CS, TN_Hex, priceADAx1e6 });
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/set-priceADAx1e6`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            });
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                //----------------------------
                const token: Token_With_Price_And_Date_And_Signature = { ...data, priceADAx1e6: BigInt(data.priceADAx1e6), date: BigInt(data.date) };
                //----------------------------
                console.log(`[${this._Entity.className()}] - set_Token_PriceADAx1e6_Api - Token PriceADAx1e6: ${showData(token)}`);
                return token;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - set_Token_PriceADAx1e6_Api - Error: ${error}`);
            throw error;
        }
    }
    // #endregion api
}
