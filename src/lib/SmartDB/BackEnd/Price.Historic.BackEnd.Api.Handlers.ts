import { NextApiResponse } from 'next';
import { showData, sanitizeForDatabase } from '@/src/utils/commons/utils';
import yup from '@/src/utils/commons/yupLocale';
import { NextApiRequestAuthenticated } from '@/src/lib/SmartDB/lib/Auth/index';
import { console_error, console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { PriceEntity } from '../Entities/Price.Entity';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers';
import { PriceBackEndApplied } from './Price.BackEnd.Applied';
import { PriceHistoricEntity } from '../Entities/Price.Historic.Entity';
import { PriceHistoricBackEndApplied } from './Price.Historic.BackEnd.Applied';
import { Token_Historic_Price } from '../Commons';

export class PriceHistoricBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = PriceHistoricEntity;
    protected static _BackEndApplied = PriceHistoricBackEndApplied;

// #region custom api handlers

protected static _ApiHandlers: string[] = ['historic-priceADAx1e6-by-Token'];

protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
    //--------------------
    const { query } = req.query;
    //--------------------
    if (this._ApiHandlers.includes(command) && query !== undefined) {
        if (query[0] === 'historic-priceADAx1e6-by-Token') {
            return await this.get_Token_Historic_PriceADAx1e6x1e3_ApiHandler(req, res);
        }{
            console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Api Handler function not found`);
            return res.status(500).json({ error: `Api Handler function not found` });
        }
    } else {
        console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Wrong Custom Api route`);
        return res.status(405).json({ error: `Wrong Custom Api route` });
    }
}

// #endregion custom api handlers

    // #region api handlers
    public static async get_Token_Historic_PriceADAx1e6x1e3_ApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_ApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    CS: yup.string(),
                    TN: yup.string(),
                    days: yup.number().integer().min(1).max(365),
                    forceRefresh: yup.boolean(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_ApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { CS, TN, days, forceRefresh } = validatedQuery;
                //-------------------------
                const historic_prices : Token_Historic_Price [] = await this._BackEndApplied.get_Tokens_Historic_PriceADAx1e6x1e3_LastDays(CS!, TN!, days, forceRefresh);
                if (historic_prices.length === 0) {
                    console_error(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_ApiHandler - Error: Historic Prices ADA not found`);
                    return res.status(404).json({ error: `Historic Prices ADA not found` });
                }
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_ApiHandler - GET - OK`);
                //-------------------------
                const converted_historic_prices = historic_prices.map(item => ({
                    priceADAx1e6: item.priceADAx1e6 !== undefined ? item.priceADAx1e6.toString() : undefined,
                    date: item.date !== undefined ? item.date.toString() : undefined
                }));
                return res.status(200).json({
                    prices: converted_historic_prices
                });
                //-------------------------
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_ApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_ApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }
}
