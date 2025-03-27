import { NextApiResponse } from 'next';
import { console_error, console_log } from '../Commons/BackEnd/globalLogs.js';
import { BackEndApiHandlersFor, sanitizeForDatabase, showData, Token_With_Price_And_Date_And_Signature } from '../Commons/index.js';
import { yup } from '../Commons/yupLocale.js';
import { PriceEntity } from '../Entities/Price.Entity.js';
import { NextApiRequestAuthenticated } from '../lib/Auth/types.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { PriceBackEndApplied } from './Price.BackEnd.Applied.js';

@BackEndApiHandlersFor(PriceEntity)
export class PriceBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = PriceEntity;
    protected static _BackEndApplied = PriceBackEndApplied;
    //protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers
    protected static _ApiHandlers: string[] = ['get-priceADAx1e6', 'get-pricesADAx1e6', 'set-priceADAx1e6']; //, 'get-history-priceADAx1e6'

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'get-priceADAx1e6') {
                req.query = { ...req.query };
                return await this.get_Token_PriceADAx1e6_ApiHandler(req, res);
            } else if (query[0] === 'get-pricesADAx1e6') {
                req.query = { ...req.query };
                return await this.get_Tokens_PriceADAx1e6_ApiHandler(req, res);
            } else if (query[0] === 'set-priceADAx1e6') {
                req.query = { ...req.query };
                return await this.set_Token_PriceADAx1e6_ApiHandler(req, res);
                // } else if (query[0] === 'get-history-priceADAx1e6') {
                //     req.query = { ...req.query };
                //     return await this.get_Token_PriceData_LastDays_From_OracleApiHandler(req, res);
            } else {
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

    public static async get_Token_PriceADAx1e6_ApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Token_PriceADAx1e6_ApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    CS: yup.string().defined('CS must be a string').strict(true),
                    TN_Hex: yup.string().defined('TN_Hex must be a string').strict(true),
                    forceRefresh: yup.boolean(),
                    validityMS: yup.number(),
                    forceUseOracle: yup.boolean(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_PriceADAx1e6_ApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { CS, TN_Hex, forceRefresh, validityMS, forceUseOracle } = validatedQuery;
                //-------------------------
                const token: Token_With_Price_And_Date_And_Signature | undefined = await this._BackEndApplied.get_Token_With_Price_And_Signature(
                    CS,
                    TN_Hex,
                    forceRefresh,
                    validityMS,
                    forceUseOracle
                );
                if (token === undefined) {
                    console_error(-1, this._Entity.className(), `get_Token_PriceADAx1e6_ApiHandler - Error: Price not found`);
                    return res.status(404).json({ error: `Price not found` });
                }
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Token_PriceADAx1e6_ApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json({
                    ...token,
                    priceADAx1e6: token.priceADAx1e6 !== undefined ? token.priceADAx1e6.toString() : undefined,
                    date: token.date !== undefined ? token.date.toString() : undefined,
                });
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Token_PriceADAx1e6_ApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `get_Token_PriceADAx1e6_ApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async get_Tokens_PriceADAx1e6_ApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Tokens_PriceADAx1e6_ApiHandler - POST - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_log(0, this._Entity.className(), `body: ${showData(req.body)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                // Define the token schema for each item in the token array
                const tokenSchema = yup.object().shape({
                    CS: yup.string().defined('CS must be a string').strict(true),
                    TN_Hex: yup.string().defined('TN_Hex must be a string').strict(true),
                });
                const schemaBody = yup.object().shape({
                    tokens: yup.array().of(tokenSchema).required('Token array is required'),
                    forceRefresh: yup.boolean(),
                    validityMS: yup.number(),
                    forceUseOracle: yup.boolean(),
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Tokens_PriceADAx1e6_ApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { tokens, forceRefresh, validityMS, forceUseOracle } = validatedBody;
                //-------------------------
                const tokensWithPrices: Token_With_Price_And_Date_And_Signature[] = await this._BackEndApplied.get_Tokens_With_Price_And_SignatureWrapper(
                    tokens,
                    forceRefresh,
                    validityMS,
                    forceUseOracle
                );
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Tokens_PriceADAx1e6_ApiHandler - POST - OK - Tokens Len: ${tokensWithPrices.length}`);
                //-------------------------
                const formattedTokens = tokensWithPrices.map((token: Token_With_Price_And_Date_And_Signature) => ({
                    ...token,
                    priceADAx1e6: token.priceADAx1e6 !== undefined ? token.priceADAx1e6.toString() : undefined,
                    date: token.date !== undefined ? token.date.toString() : undefined,
                }));
                return res.status(200).json(formattedTokens);
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Tokens_PriceADAx1e6_ApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `get_Tokens_PriceADAx1e6_ApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async set_Token_PriceADAx1e6_ApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            //-------------------------
            console_log(1, this._Entity.className(), `set_Token_PriceADAx1e6_ApiHandler - POST - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    CS: yup.string().required(),
                    TN_Hex: yup.string().required(),
                    priceADAx1e6: yup.number().positive().required(),
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `set_Token_PriceADAx1e6_ApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { CS, TN_Hex, priceADAx1e6 } = validatedBody;
                //-------------------------
                const token = await this._BackEndApplied.set_Token_PriceADAx1e6(CS, TN_Hex, BigInt(priceADAx1e6));
                if (token === undefined) {
                    console_error(-1, this._Entity.className(), `set_Token_PriceADAx1e6_ApiHandler - Error: Could not set Price`);
                    return res.status(404).json({ error: `Could not set Price` });
                }
                //-------------------------
                console_log(-1, this._Entity.className(), `set_Token_PriceADAx1e6_ApiHandler - POST - OK`);
                //-------------------------
                return res.status(200).json({
                    ...token,
                    priceADAx1e6: token.priceADAx1e6 !== undefined ? token.priceADAx1e6.toString() : undefined,
                    date: token.date !== undefined ? token.date.toString() : undefined,
                });
            } catch (error) {
                console_error(-1, this._Entity.className(), `set_Token_PriceADAx1e6_ApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while setting the ${this._Entity.className()}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `set_Token_PriceADAx1e6_ApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // public static async get_Token_PriceData_LastDays_From_OracleApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    //     if (req.method === 'GET') {
    //         //-------------------------
    //         console_log(1, this._Entity.className(), `get_Token_PriceData_LastDays_From_OracleApiHandler - GET - Init`);
    //         console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
    //         //-------------------------
    //         try {
    //             //-------------------------
    //             const sanitizedQuery = sanitizeForDatabase(req.query);
    //             //-------------------------
    //             // date is posix timestamp
    //             const schemaQuery = yup.object().shape({
    //                 CS: yup.string().defined('CS must be a string').strict(true),
    //                 TN_Hex: yup.string().defined('TN_Hex must be a string').strict(true),
    //                 days: yup.number().integer().positive().defined('date must be a posix timestamp').strict(true),
    //             });
    //             //-------------------------
    //             let validatedQuery;
    //             try {
    //                 validatedQuery = await schemaQuery.validate(sanitizedQuery);
    //             } catch (error) {
    //                 console_error(-1, this._Entity.className(), `get_Token_PriceData_LastDays_From_OracleApiHandler - Error: ${error}`);
    //                 return res.status(400).json({ error });
    //             }
    //             //-------------------------
    //             const { CS, TN_Hex, days } = validatedQuery;
    //             //-------------------------
    //             const historic_prices: Token_Historic_Price[] = await this._BackEndApplied.get_Token_PriceData_LastDays_From_OracleApi(CS, TN_Hex, days);
    //             //-------------------------
    //             console_log(-1, this._Entity.className(), `get_Token_PriceData_LastDays_From_OracleApiHandler - GET - OK`);
    //             //-------------------------
    //             //-------------------------
    //             const converted_historic_prices = historic_prices.map((item) => ({
    //                 priceADAx1e6: item.priceADAx1e6 !== undefined ? item.priceADAx1e6.toString() : undefined,
    //                 date: item.date !== undefined ? item.date.toString() : undefined,
    //             }));
    //             return res.status(200).json({
    //                 prices: converted_historic_prices,
    //             });
    //             //-------------------------
    //         } catch (error) {
    //             console_error(-1, this._Entity.className(), `get_Token_PriceData_LastDays_From_OracleApiHandler - Error: ${error}`);
    //             return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
    //         }
    //     } else {
    //         console_error(-1, this._Entity.className(), `get_Token_PriceData_LastDays_From_OracleApiHandler - Error: Method not allowed`);
    //         return res.status(405).json({ error: `Method not allowed` });
    //     }
    // }

    // #endregion api handlers
}
