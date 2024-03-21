import { NextApiRequestAuthenticated } from '../Auth/index';
import { console_error, console_log, enhanceResWithLogFlushing, initApiRequestWithContext, initGlobals, requestContext } from '../../Commons/index.BackEnd';
import { NextApiResponse } from 'next';
import { TimeBackEnd } from './Time.BackEnd';
import { showData } from '../../Commons';
import { v4 } from 'uuid';

export class TimeBackEndApiHandlers {
    //---------------------------------------------------------------

    public static async getServerTimeApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        return await initApiRequestWithContext(0, `Time`, req, res, this.getServerTimeApiHandlerWithContext.bind(this));
    }

    public static async getServerTimeApiHandlerWithContext(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //--------------------------------------
            console_log(1, `Time`, `get - GET - Init`);
            //console_log(0, `Time`, `query: ${log(req.query)}`);
            try {
                //-------------------------
                const serverTime = await TimeBackEnd.getServerTime(true, true);
                //----------------------------
                console_log(-1, `Time`, `get - GET - OK`);
                //--------------------------------------
                res.json({ serverTime });
            } catch (error) {
                console_error(-1, `Time`, `get - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while getting server time: ${error}` });
            }
        } else {
            console_error(-1, `Time`, `get - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    //---------------------------------------------------------------

    public static async syncEmulatorBlockChainWithServerTimeApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        return await initApiRequestWithContext(0, `Auth`, req, res, this.syncEmulatorBlockChainWithServerTimeApiHandlerWithContext.bind(this));
    }

    public static async syncEmulatorBlockChainWithServerTimeApiHandlerWithContext(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            console_log(1, `Time`, `sync - GET - Init`);
            //console_log(0, `Time`, `query: ${log(req.query)}`);
            try {
                //-------------------------
                const serverTime = await TimeBackEnd.syncEmulatorBlockChainWithServerTime();
                //--------------------------------------
                console_log(-1, `Time`, `sync - GET - OK`);
                //--------------------------------------
                res.json({ serverTime });
            } catch (error) {
                console_error(-1, `Time`, `sync - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while setting server time: ${error}` });
            }
        } else {
            console_error(-1, `Time`, `sync - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // public static async syncServerWithBlockChainTimeApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    //     //--------------------
    //     globalTab.level = 0;
    //     await getGlobalSettings();
    //     //--------------------
    //     if (req.method === 'GET') {
    //         console_log(1, `Time`, `sync - GET - Init`);
    //         //console_log(0, `Time`, `query: ${log(req.query)}`);
    //         try {
    //             //-------------------------
    //             const serverTime = await this.syncServerWithBlockChainTime();
    //             //--------------------------------------
    //             console_log(-1, `Time`, `sync - GET - OK`);
    //             //--------------------------------------
    //             res.json({ serverTime });
    //         } catch (error) {
    //             console_error(-1, `Time`, `sync - Error: ${error}`);
    //             return res.status(500).json({ error: `An error occurred while setting server time: ${error}` });
    //         }
    //     } else {
    //         console_error(-1, `Time`, `sync - Error: Method not allowed`);
    //         return res.status(405).json({ error: `Method not allowed` });
    //     }
    // }
}
