import { NextApiResponse } from 'next';
import yup from '@/src/utils/commons/yupLocale';
import { NextApiRequestAuthenticated } from '../lib/Auth/types';
import { OptionsGet, OptionsGetOne, yupValidateOptionsGet, yupValidateOptionsGetOne } from '../Commons';
import { SmartUTxOEntity } from '../Entities/SmartUTxO.Entity';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers';
import { showData, sanitizeForDatabase } from '@/src/utils/commons/utils';
import { console_error, console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { SmartUTxOBackEndApplied } from './SmartUTxO.BackEnd.Applied';


export class SmartUTxOBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = SmartUTxOEntity;
    protected static _BackEndApplied = SmartUTxOBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers
    protected static _ApiHandlers: string[] = ['by-address', 'by-txhash-idx'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'by-address') {
                if (query.length === 2) {
                    req.query = { address: query[1] };
                } else {
                    req.query = {};
                }
                return await this.getByAddressApiHandler(req, res);
            } else if (query[0] === 'by-txhash-idx') {
                if (query.length === 3) {
                    req.query = { txHash: query[1], outputIndex: query[2] };
                } else {
                    req.query = {};
                }
                return await this.getByTxHashAndOutputIndexApiHandler(req, res);
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
    public static async getByAddressApiHandler<T extends SmartUTxOEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            console_log(1, this._Entity.className(), `getByAddressApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    address: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getByAddressApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { address } = validatedQuery;
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const smartUTxOs = await this._BackEndApplied.getByAddress<T>(address, undefined, restricFilter);
                //-------------------------
                console_log(-1, this._Entity.className(), `getByAddressApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(smartUTxOs.map((smartUTxO) => smartUTxO.toPlainObject()));
            } catch (error) {
                console_error(-1, this._Entity.className(), `getByAddressApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'POST') {
            console_log(1, this._Entity.className(), `syncWithAddressApiHandlers - POST - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_log(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    address: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { address } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGet);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const smartUTxOs = await this._BackEndApplied.getByAddress<T>(address, optionsGet, restricFilter);
                //-------------------------
                console_log(-1, this._Entity.className(), `syncWithAddressApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json(smartUTxOs.map((smartUTxO) => smartUTxO.toPlainObject()));
            } catch (error) {
                console_error(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while synchronizing the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async getByTxHashAndOutputIndexApiHandler<T extends SmartUTxOEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            console_log(1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    txHash: yup.string().required(),
                    outputIndex: yup.number().positive().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { txHash, outputIndex } = validatedQuery;
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const smartUTxO = await this._BackEndApplied.getByTxHashAndOutputIndex<T>(txHash, outputIndex, undefined, restricFilter);
                //-------------------------
                if (!smartUTxO) {
                    console_error(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                console_log(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(smartUTxO.toPlainObject());
            } catch (error) {
                console_error(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'POST') {
            console_log(1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - POST - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_log(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    txHash: yup.string().required(),
                    outputIndex: yup.number().positive().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { txHash, outputIndex } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGetOne);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGetOne = { ...validatedBody };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const smartUTxO = await this._BackEndApplied.getByTxHashAndOutputIndex<T>(txHash, outputIndex, optionsGet, restricFilter);
                //-------------------------
                if (!smartUTxO) {
                    console_error(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                console_log(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - POST - OK`);
                //-------------------------
                return res.status(200).json(smartUTxO.toPlainObject());
            } catch (error) {
                console_error(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `getByTxHashAndOutputIndexApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

}
