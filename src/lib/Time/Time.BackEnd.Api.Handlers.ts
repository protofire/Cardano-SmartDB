import { NextApiResponse } from 'next';
import { NextApiRequestAuthenticated } from '../Auth/index.js';
import { TimeBackEnd } from './Time.BackEnd.js';
import { console_error, console_log } from '../../Commons/BackEnd/globalLogs.js';

/**
 * @swagger
 * tags:
 *   name: Time
 *   description: Time-related endpoints
 */

/**
 * @swagger
 * /api/time/get:
 *   get:
 *     summary: Get server time
 *     tags: [Time]
 *     description: Retrieve the current server time.
 *     responses:
 *       200:
 *         description: Server time retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serverTime:
 *                   type: string
 *                   description: The current server time in ISO format
 *                   example: "2024-05-17T12:34:56.789Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: An error occurred while getting server time
 */

/**
 * @swagger
 * /api/time/sync-emulator-blockchain-time:
 *   get:
 *     summary: Sync emulator blockchain with server time
 *     tags: [Time]
 *     description: Sync the emulator blockchain time with the server time.
 *     responses:
 *       200:
 *         description: Emulator blockchain time synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serverTime:
 *                   type: string
 *                   description: The current server time in ISO format after sync
 *                   example: "2024-05-17T12:34:56.789Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: An error occurred while setting server time
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: Method not allowed
 */


export class TimeBackEndApiHandlers {
    
    //---------------------------------------------------------------

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
