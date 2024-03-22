import { LucidLUCID_NETWORK_MAINNET_NAME, LucidLUCID_NETWORK_PREPROD_NAME, LucidLUCID_NETWORK_PREVIEW_NAME, NextApiRequestAuthenticated, console_error, console_log, globalSettings, initAllDecorators, initApiRequestWithContext, isEmulator, showData } from '@/src/lib/SmartDB/backEnd';
import { NextApiResponse } from 'next';
import httpProxyMiddleware from 'next-http-proxy-middleware';
// necestary to init all decorators because all the rest of the Apis call the BackeEnd index and thet is where others do the init
initAllDecorators();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *   schemas:
 *     ProxyResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           description: Data from the Blockfrost proxy
 *     ProxyError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 * /api/blockfrost:
 *   get:
 *     summary: Retrieve data from Blockfrost via proxy
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProxyResponse'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProxyError'
 */

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};

const blockfrostProxy = async (req: NextApiRequestAuthenticated, res: NextApiResponse) => {
    if (isEmulator) {
        console_error(0, `Blockfrost proxy`, `Blockfrost proxy not available in emulator`);
        return res.status(400).json({ error: 'Blockfrost proxy not available in emulator' });
    } else {
        return await initApiRequestWithContext(0, `Blockfrost proxy`, req, res, blockfrostProxyWithContext, true, false, false, false);
    }
};

export default blockfrostProxy;

const blockfrostProxyWithContext = async (req: NextApiRequestAuthenticated, res: NextApiResponse) => {
    //--------------------
    let target;
    let PROJECT_ID;
    //--------------------
    if (process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME) {
        target = globalSettings.siteSettings?.blockfrost_url_api_mainnet;
        PROJECT_ID = process.env.BLOCKFROST_KEY_MAINNET;
    } else if (process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_PREVIEW_NAME) {
        target = globalSettings.siteSettings?.blockfrost_url_api_preview;
        PROJECT_ID = process.env.BLOCKFROST_KEY_PREVIEW;
    } else if (process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_PREPROD_NAME) {
        target = globalSettings.siteSettings?.blockfrost_url_api_preprod;
        PROJECT_ID = process.env.BLOCKFROST_KEY_PREPROD;
    }
    //--------------------
    try {
        if (!target || !PROJECT_ID) throw `Invalid target: ${target} or project id ${PROJECT_ID}`;

        console_log(0, `Blockfrost proxy`, `url: ${showData(req.url)}`);
        // console.log(`Blockfrost target: ${log(target)}`);

        const BLOCKFROST_URL_EPOCHS_LATEST_PARAMETERS = '/epochs/latest/parameters';

        if (req.url?.includes(BLOCKFROST_URL_EPOCHS_LATEST_PARAMETERS)) {
            // si es la ruta de bsucar parametros lo hago por mi cuenta
            const fs = require('fs').promises;
            const path = require('path');
            try {
                console_log(0, `Blockfrost proxy`, `Reading protocol-parameters.json`);
                const data = await fs.readFile(path.join(process.cwd(), '_config', 'protocol-parameters.json'), 'utf8');
                const parsedData = JSON.parse(data);
                return res.status(200).json({
                    min_fee_a: parsedData.min_fee_a.toString(),
                    min_fee_b: parsedData.min_fee_b.toString(),
                    max_tx_size: parsedData.max_tx_size.toString(),
                    max_val_size: parsedData.max_val_size.toString(),
                    key_deposit: parsedData.key_deposit.toString(),
                    pool_deposit: parsedData.pool_deposit.toString(),
                    price_mem: parsedData.price_mem.toString(),
                    price_step: parsedData.price_step.toString(),
                    max_tx_ex_mem: parsedData.max_tx_ex_mem.toString(),
                    max_tx_ex_steps: parsedData.max_tx_ex_steps.toString(),
                    coins_per_utxo_size: parsedData.coins_per_utxo_size.toString(),
                    collateral_percent: parsedData.collateral_percent.toString(),
                    max_collateral_inputs: parsedData.max_collateral_inputs.toString(),
                    cost_models: parsedData.cost_models,
                });
            } catch (error) {
                console_error(0, `Blockfrost proxy`, `Error reading protocol-parameters.json: ${error}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }

        const response = await httpProxyMiddleware(req, res, {
            target,
            timeout: 25000, // 10 seconds
            proxyTimeout: 25000, // 10 seconds
            headers: {
                'Content-Type': req.headers['content-type'] ? req.headers['content-type'] : 'text/plain',
                project_id: PROJECT_ID,
            },

            changeOrigin: true,

            pathRewrite: [
                {
                    patternStr: '^/api/blockfrost',
                    replaceStr: '',
                },
            ],

            onProxyInit(httpProxy) {
                httpProxy.on('proxyReq', (proxyReq, req, res) => {
                    // console.log("Blockfrost proxy url new: " + log(req.url))
                    // console.log(`proxyReq: ${log(proxyReq)}`, false)
                });
            },
        });
    } catch (error) {
        console_error(0, `Blockfrost proxy`, error instanceof AggregateError ? `Error: ${error.errors}` : `Error: ${error}`);
        return res.status(400).json({ error: error instanceof AggregateError ? error.errors : error });
    }
};
