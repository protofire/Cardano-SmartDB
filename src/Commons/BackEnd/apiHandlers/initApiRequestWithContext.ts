import { NextApiResponse } from 'next';
import { NextApiRequestAuthenticated } from '../../../lib/Auth/types.js';
import { showData } from '../../utils.js';
import { requestContext, requestId } from '../globalContext.js';
import { console_log, console_logLv1, console_logLv2, enhanceResWithLogFlushing } from '../globalLogs.js';

// toma un api handler y lo encapsula con contexto y logs
export const initApiRequestWithContext = async (
    lv: number,
    name: string,
    req: NextApiRequestAuthenticated,
    res: NextApiResponse,
    apiHandler: (req: NextApiRequestAuthenticated, res: NextApiResponse) => Promise<void>
) => {
    return new Promise<void>((resolve) => {
        requestContext.run(async () => {
            //--------------------------------------
            requestId();
            //--------------------------------------
            res = enhanceResWithLogFlushing(res);
            //--------------------------------------
            if (lv === 0) {
                console_log(0, name, `- - - - - - - - - - - - - - - - - - - - - -  `);
                console_log(0, name, `Api handler - ${showData({ query: req.query, body: req.body }, false)} - Init`);
            } else if (lv === 1) {
                console_logLv1(0, name, `- - - - - - - - - - - - - - - - - - - - - -  `);
                console_logLv1(0, name, `Api handler - ${showData({ query: req.query, body: req.body }, false)} - Init`);
            } else if (lv === 2) {
                console_logLv2(0, name, `- - - - - - - - - - - - - - - - - - - - - -  `);
                console_logLv2(0, name, `Api handler - ${showData({ query: req.query, body: req.body }, false)} - Init`);
            }
            //--------------------
            await apiHandler(req, res);
            //--------------------------------------
            resolve();
        });
    });
};

