import { showData } from '@/src/utils/commons/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 } from 'uuid';
import { NextApiRequestAuthenticated } from '../../lib';
import { TimeBackEnd } from '../../lib/Time/Time.BackEnd';
import { requestContext } from './globalContext';
import { getGlobalEmulator } from './globalEmulator';
import { console_error, console_log, console_logLv1, console_logLv2, enhanceResWithLogFlushing, swShowAlwaysError, swUseFilter, waitForFLush } from './globalLogs';
import { getGlobalLucid } from './globalLucid';
import { getGlobalSettings } from './globalSettings';
import { getGlobalTransactionStatusUpdater } from './globalTransactionStatusUpdater';

export const initGlobals = async (
    req: NextApiRequest,
    res: NextApiResponse,
    swUseGlobalSettings: boolean = true,
    swUseGlobalEmulator: boolean = true,
    swUseGlobalLucid: boolean = true,
    swUseGlobalBlockchainTime: boolean = true,
    swUseGlobalTransactionStatusUpdater: boolean = true
) => {
    try {
        //--------------------
        console_log(1, `initApiRequest`, `Init`);
        //--------------------
        if (swUseGlobalSettings) await getGlobalSettings();
        //--------------------------------------
        // es importante llamar primero a getGlobalEmulator y luego a getGlobalLucid, por que lucid usa el emulador.
        // es importante cargar el emulador con refresh force aqui, asi en cada llamada api se refresca.
        // por ultimo se llama a getGlobalBlockchainTime, que usa el emulador y lucid y prepara el globalBlockchainTime si es que no existe o si pasaron mas de 10 minutos
        //--------------------------------------
        if (swUseGlobalEmulator) await getGlobalEmulator(true);
        if (swUseGlobalLucid) await getGlobalLucid();
        //--------------------------------------
        if (swUseGlobalBlockchainTime) await TimeBackEnd.getGlobalBlockchainTime();
        //--------------------------------------
        if (swUseGlobalTransactionStatusUpdater) await getGlobalTransactionStatusUpdater();
        //--------------------------------------
        console_log(-1, `initApiRequest`, `OK`);
        //--------------------------------------
    } catch (error) {
        console_error(-1, `initApiRequest`, `Error: ${error}`);
        return res.status(500).json({ error: `An error occurred while initApiRequest: ${error}` });
    }
};

export const initApiRequestWithContext = async (
    lv: number,
    name: string,
    req: NextApiRequestAuthenticated,
    res: NextApiResponse,
    apiHandler: (req: NextApiRequestAuthenticated, res: NextApiResponse) => Promise<void>,
    swUseGlobalSettings?: boolean,
    swUseGlobalEmulator?: boolean,
    swUseGlobalLucid?: boolean,
    swUseGlobalBlockchainTime?: boolean
) => {
    return new Promise<void>((resolve) => {
        requestContext.run(async () => {
            //--------------------------------------
            const requestId = v4();
            //--------------------------------------
            requestContext.set('requestId', requestId);
            //--------------------------------------
            res = enhanceResWithLogFlushing(res);
            //--------------------------------------
            if (lv === 0) {
                console_log(1, name, `- - - - - - - - - - - - - - - - - - - - - -  `);
                console_log(0, name, `Api handler - ${showData({ query: req.query, body: req.body }, false)} - Init`);
            } else if (lv === 1) {
                console_logLv1(1, name, `- - - - - - - - - - - - - - - - - - - - - -  `);
                console_logLv1(0, name, `Api handler - ${showData({ query: req.query, body: req.body }, false)} - Init`);
            } else if (lv === 2) {
                console_logLv2(1, name, `- - - - - - - - - - - - - - - - - - - - - -  `);
                console_logLv2(0, name, `Api handler - ${showData({ query: req.query, body: req.body }, false)} - Init`);
            }
            //--------------------
            await initGlobals(req, res, swUseGlobalSettings, swUseGlobalEmulator, swUseGlobalLucid, swUseGlobalBlockchainTime);
            //--------------------------------------
            await apiHandler(req, res);
            //--------------------------------------
            resolve();
        });
    });
};
