import { Token_With_Price_And_Date_And_Signature, createQueryURLString, hexToStr, isTokenADA, isToken_CS_And_TN_Valid, showData, toJson, type CS, type TN } from '../../Commons';
import { PriceEntity } from '../../Entities/Price.Entity';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls';

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
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN not defined`;
            }
            const isADA = isTokenADA(CS, TN_Hex);
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN not valid`;
            }
            //------------------
            if (isADA) {
                const priceADAx1e6 = 1_000_000n;
                //----------------------------
                const token: Token_With_Price_And_Date_And_Signature = { CS, TN: TN_Hex, priceADAx1e6, date: undefined, signature: undefined };
                //----------------------------
                console.log(`[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - Token PriceADAx1e6: ${showData(token)} - response OK`);
                return token;
            }
            //------------------
            const queryString = createQueryURLString({ CS, TN: TN_Hex, forceRefresh, validityMS, forceUseOracle });
            //------------------
            const response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/priceADAx1e6-by-Token${queryString}`);
            if (response.status === 200) {
                const data = await response.json();
                //----------------------------
                const token: Token_With_Price_And_Date_And_Signature = { ...data, priceADAx1e6: BigInt(data.priceADAx1e6), date: BigInt(data.date) };
                //----------------------------
                console.log(`[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - Token PriceADAx1e6: ${showData(token)}`);
                return token;
            } else if (response.status === 404) {
                console.log(`[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - CS: ${CS} - TN: ${hexToStr(TN_Hex)} - Token PriceADAx1e6 not found`);
                return undefined;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - get_Token_PriceADAx1e6_Api - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async set_Token_PriceADAx1e6_Api(CS: CS, TN_Hex: TN, priceADAx1e6: bigint): Promise<Token_With_Price_And_Date_And_Signature | undefined> {
        try {
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN not defined`;
            }
            const isADA = isTokenADA(CS, TN_Hex);
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN not valid`;
            }
            //------------------
            if (isADA) {
                const priceADAx1e6 = 1_000_000n;
                //----------------------------
                const token: Token_With_Price_And_Date_And_Signature = { CS, TN: TN_Hex, priceADAx1e6, date: undefined, signature: undefined };
                //----------------------------
                console.log(`[${this._Entity.className()}] - set_Token_PriceADAx1e6_Api - Token PriceADAx1e6: ${showData(token)} - response OK`);
                return token;
            }
            //-------------------------
            const body = toJson({ CS, TN: TN_Hex, priceADAx1e6 });
            //-------------------------
            const response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/set-priceADAx1e6`, {
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
            throw `${error}`;
        }
    }
    // #endregion api
}
