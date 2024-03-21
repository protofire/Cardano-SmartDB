import { NextApiResponse } from 'next';
import { showData, sanitizeForDatabase } from '@/src/utils/commons/utils';
import yup from '@/src/utils/commons/yupLocale';
import { NextApiRequestAuthenticated } from '@/src/lib/SmartDB/lib/Auth/index';
import { console_error, console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { PriceEntity } from '../Entities/Price.Entity';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers';
import { PriceBackEndApplied } from './Price.BackEnd.Applied';

export class PriceBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = PriceEntity;
    protected static _BackEndApplied = PriceBackEndApplied;
    //protected static _BackEndMethods = this._BackEndApplied.getBack();

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
                    CS: yup.string(),
                    TN: yup.string(),
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
                const { CS, TN, forceRefresh, validityMS, forceUseOracle } = validatedQuery;
                //-------------------------
                const token = await this._BackEndApplied.get_Token_With_Price_And_Signature(CS!, TN!, forceRefresh, validityMS, forceUseOracle);
                if (token === undefined) {
                    console_error(-1, this._Entity.className(), `get_Token_PriceADAx1e6_ApiHandler - Error: Price ADA not found`);
                    return res.status(404).json({ error: `Price ADA not found` });
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
                    TN: yup.string().required(),
                    priceADAx1e6: yup.number().required(),
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
                const { CS, TN, priceADAx1e6 } = validatedBody;
                //-------------------------
                const token = await this._BackEndApplied.set_Token_PriceADAx1e6(CS, TN, BigInt(priceADAx1e6));
                if (token === undefined) {
                    console_error(-1, this._Entity.className(), `set_Token_PriceADAx1e6_ApiHandler - Error: Could not set Price ADA`);
                    return res.status(404).json({ error: `Could not set Price ADA` });
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
}
