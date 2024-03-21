import { Token_With_Price_And_Date_And_Signature, type CS, type TN, isTokenADA, isToken_CS_And_TN_Valid, Token_With_Price_And_Date, Token_Historic_Price } from '../../Commons';
import { createQueryURLString, hexToStr, showData } from '@/src/utils/commons/utils';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls';
import { PriceHistoricEntity } from '../../Entities/Price.Historic.Entity';

export class PriceHistoricFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = PriceHistoricEntity;

    // #region api

    public static async get_Token_Historic_PriceADAx1e6x1e3_Api(CS: CS, TN_Hex: TN, days: number = 90, forceRefresh: boolean = false): Promise<Token_Historic_Price [] > {
        try {
            //------------------
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN not defined`;
            }
            const isADA = isTokenADA(CS, TN_Hex)
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN not valid`;
            }
            //------------------
            // TODO: implementar codigo para forceRefresh
            //------------------
            if (isADA) {
                const priceADAx1e6 = 1_000_000n;
                //----------------------------
                const historic_prices: Token_Historic_Price [] = Array(days).fill({ priceADAx1e6, date: undefined });
                //----------------------------
                console.log(`[${this._Entity.className()}] - get_Token_Historic_PriceADAx1e6x1e3_Api - Token Historic Lenght: ${showData(historic_prices.length)} - response OK`);
                return historic_prices;
            }
            //------------------
            const queryString = createQueryURLString({ CS, TN: TN_Hex, days, forceRefresh });
            //------------------
            const response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/historic-priceADAx1e6-by-Token${queryString}`);
            if (response.status === 200) {
                const data = await response.json();
                //----------------------------
                console.log(`[${this._Entity.className()}] - get_Token_Historic_PriceADAx1e6x1e3_Api - Token Historic Lenght: ${showData(data.prices.length)}`);
                //----------------------------
                const historic_prices: Token_Historic_Price[] = [];
                //----------------------------
                data.prices.forEach((data: Token_With_Price_And_Date) => {
                    if (data.priceADAx1e6 === undefined || data.date === undefined) {   
                        throw `priceADAx1e6 or date not defined`;
                    }
                    const token: Token_Historic_Price = { priceADAx1e6: BigInt(data.priceADAx1e6), date: BigInt(data.date) };
                    historic_prices.push(token);
                });
                //----------------------------
                return historic_prices;
                //----------------------------
            } else if (response.status === 404) {
                console.log(`[${this._Entity.className()}] - get_Token_Historic_PriceADAx1e6x1e3_Api - CS: ${CS} - TN: ${hexToStr(TN_Hex)} - Token PriceADAx1e6 not found`);
                return [];
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[${this._Entity.className()}] - get_Token_Historic_PriceADAx1e6x1e3_Api - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
