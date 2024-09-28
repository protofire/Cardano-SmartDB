import { NextApiRequestAuthenticated } from '../lib/Auth/index.js';
import { NextApiResponse } from 'next';
import { BackEndApiHandlersFor, sanitizeForDatabase, showData } from '../Commons/index.js';
import { console_error, console_log } from '../Commons/BackEnd/globalLogs.js';
import { yup }  from '../Commons/yupLocale.js';
import { TransactionEntity } from '../Entities/Transaction.Entity.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { TransactionBackEndApplied } from './Transaction.BackEnd.Applied.js';
import { getGlobalTransactionStatusUpdater } from '../Commons/BackEnd/globalTransactionStatusUpdater.js';

@BackEndApiHandlersFor(TransactionEntity)
export class TransactionBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = TransactionEntity;
    protected static _BackEndApplied = TransactionBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers
    protected static _ApiHandlers: string[] = ['status-updater', 'update-failed-transaction', 'begin-status-updater', 'submit-and-begin-status-updater', 'get-status'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'begin-status-updater') {
                return await this.beginStatusUpdaterJobApiHandler(req, res);
            } else if (query[0] === 'update-failed-transaction') {
                if (query.length === 2) {
                    req.query = { txHash: query[1] };
                } else {
                    req.query = {};
                }
                return await this.updateFailedTransactionApiHandler(req, res);
            } else if (query[0] === 'submit-and-begin-status-updater') {
                if (query.length === 2) {
                    req.query = { txHash: query[1] };
                } else {
                    req.query = {};
                }
                return await this.submitAndBeginStatusUpdaterJobApiHandler(req, res);
            } else if (query[0] === 'status-updater') {
                if (query.length === 2) {
                    req.query = { txHash: query[1] };
                } else {
                    req.query = {};
                }
                return await this.transactionStatusUpdaterApiHandler(req, res);
            } else if (query[0] === 'get-status') {
                if (query.length === 2) {
                    req.query = { txHash: query[1] };
                } else {
                    req.query = {};
                }
                return await this.getTransactionStatusApiHandler(req, res);
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

    public static async updateFailedTransactionApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            //-------------------------
            console_log(1, this._Entity.className(), `updateFailedTransactionApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    txHash: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `updateFailedTransactionApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { txHash } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    error: yup.object().required(),
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `updateFailedTransactionApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { error } = validatedBody;
                //-------------------------
                await this._BackEndApplied.setFailedTransactionByHash(txHash, error);
                //-------------------------
                console_log(-1, this._Entity.className(), `updateFailedTransactionApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json({ isUpdated: true });
            } catch (error) {
                console_error(-1, this._Entity.className(), `updateFailedTransactionApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while updating failed transaction: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `updateFailedTransactionApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async beginStatusUpdaterJobApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `beginStatusUpdaterJobApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    swCheckAgainTxWithTimeOut: yup.boolean(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `beginStatusUpdaterJobApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { swCheckAgainTxWithTimeOut } = validatedQuery;
                //-------------------------
                // este metodo debe iniciar un ciclo loop en el server, pero no quedarse esperando el resultado aqui
                // ese ciclo va a actualizar el estado de la transaccion y voy a crear otro metodo para verificar el estado de cada transaccion
                // solamente me va a devolver si el ciclo inicia correctamente
                this._BackEndApplied.beginStatusUpdaterJob(swCheckAgainTxWithTimeOut);
                //-------------------------
                console_log(-1, this._Entity.className(), `beginStatusUpdaterJobApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json({ isStarted: true });
            } catch (error) {
                console_error(-1, this._Entity.className(), `beginStatusUpdaterJobApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while beginStatusUpdaterJobApiHandler: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `beginStatusUpdaterJobApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async submitAndBeginStatusUpdaterJobApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `submitAndBeginStatusUpdaterJobApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    txHash: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `submitAndBeginStatusUpdaterJobApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { txHash } = validatedQuery;
                //-------------------------
                await this._BackEndApplied.setSubmittedTransactionByHash(txHash);
                // NOTE: este metodo debe iniciar un ciclo loop en el server, pero no quedarse esperando el resultado aqui, por eso no uso AWAIT
                this._BackEndApplied.beginStatusUpdaterJob();
                //-------------------------
                console_log(-1, this._Entity.className(), `submitAndBeginStatusUpdaterJobApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json({ isStarted: true });
            } catch (error) {
                console_error(-1, this._Entity.className(), `submitAndBeginStatusUpdaterJobApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while submitAndBeginStatusUpdaterJobApiHandler: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `submitAndBeginStatusUpdaterJobApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async transactionStatusUpdaterApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `transactionStatusUpdaterApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    txHash: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getTransactionStatusApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { txHash } = validatedQuery;
                //-------------------------
                await this._BackEndApplied.transactionStatusUpdater(txHash);
                //-------------------------
                console_log(-1, this._Entity.className(), `transactionStatusUpdaterApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json({ isUpdated: true });
            } catch (error) {
                console_error(-1, this._Entity.className(), `transactionStatusUpdaterApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while updating transaction status: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `transactionStatusUpdaterApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async getTransactionStatusApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `getTransactionStatusApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    txHash: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getTransactionStatusApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { txHash } = validatedQuery;
                //-------------------------
                const txStatus = await this._BackEndApplied.getTransactionStatus(txHash);
                //-------------------------
                console_log(-1, this._Entity.className(), `getTransactionStatusApiHandler - Status: ${txStatus} - GET - OK`);
                //-------------------------
                return res.status(200).json({ txStatus });
            } catch (error) {
                console_error(-1, this._Entity.className(), `getTransactionStatusApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while getting tx status: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `getTransactionStatusApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers
}
