import { NextApiResponse } from 'next';
import { NextApiRequestAuthenticated } from '../../../lib/Auth/types.js';
import { BLOCKFROST_URL_EPOCHS_LATEST_PARAMETERS, TIMEOUT_PROXY_BLOCKFROST_MS, isEmulator, isMainnet, isPreprod, isPreview } from '../../Constants/constants.js';
import { showData } from '../../utils.js';
import { console_error, console_log } from '../globalLogs.js';
import { globalSettings } from '../globalSettings.js';
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * tags:
 *   name: Blockfrost Proxy
 *   description: Proxies requests to the Blockfrost API
 * /api/blockfrost/{path*}:
 *   get:
 *     summary: Proxy request to Blockfrost API
 *     tags: [Blockfrost Proxy]
 *     description: This endpoint proxies requests to the Blockfrost API. For detailed information on the Blockfrost API endpoints, refer to the [Blockfrost API documentation](https://docs.blockfrost.io/).
 *     parameters:
 *       - in: path
 *         name: path*
 *         schema:
 *           type: string
 *         required: true
 *         description: The path of the Blockfrost API endpoint to proxy.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response from Blockfrost API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: Invalid target or project id
 *       401:
 *         description: Unauthorized
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
 *                   example: Internal server error
 */

// This is generally not recommended but can be a temporary workaround
const httpProxyMiddleware = require('next-http-proxy-middleware/build/index').default;

export const blockfrostProxyApiHandlerWithContext = async (req: NextApiRequestAuthenticated, res: NextApiResponse) => {
    //--------------------
    let target;
    let PROJECT_ID;
    //--------------------
    if (isMainnet) {
        target = globalSettings.siteSettings?.blockfrost_url_api_mainnet;
        PROJECT_ID = process.env.BLOCKFROST_KEY_MAINNET;
    } else if (isPreview) {
        target = globalSettings.siteSettings?.blockfrost_url_api_preview;
        PROJECT_ID = process.env.BLOCKFROST_KEY_PREVIEW;
    } else if (isPreprod) {
        target = globalSettings.siteSettings?.blockfrost_url_api_preprod;
        PROJECT_ID = process.env.BLOCKFROST_KEY_PREPROD;
    }
    //--------------------
    try {
        //--------------------
        if (isEmulator) {
            console_error(0, `Blockfrost Proxy`, `Blockfrost Proxy not available in emulator`);
            return res.status(400).json({ error: 'Blockfrost Proxy not available in emulator' });
        }
        //-------------------------
        if (!target || !PROJECT_ID) throw `Invalid target: ${target} or project id ${PROJECT_ID}`;
        //--------------------
        console_log(0, `Blockfrost Proxy`, `url: ${showData(req.url)}`);
        // console.log(`Blockfrost target: ${log(target)}`);
        //--------------------
        if (req.url?.includes(BLOCKFROST_URL_EPOCHS_LATEST_PARAMETERS)) {
            // si es la ruta de bsucar parametros lo hago por mi cuenta
            const fs = require('fs').promises;
            const path = require('path');
            try {
                console_log(0, `Blockfrost Proxy`, `Reading protocol-parameters-${process.env.NEXT_PUBLIC_CARDANO_NET!}.json`);
                const data = await fs.readFile(path.join(process.cwd(), '_config', `protocol-parameters-${process.env.NEXT_PUBLIC_CARDANO_NET!}.json`), 'utf8');
                const parsedData = JSON.parse(data);
                const result = {
                    min_fee_a: parsedData.min_fee_a.toString(),
                    min_fee_b: parsedData.min_fee_b.toString(),
                    max_tx_size: parsedData.max_tx_size.toString(),
                    max_val_size: parsedData.max_val_size.toString(),
                    key_deposit: parsedData.key_deposit.toString(),
                    pool_deposit: parsedData.pool_deposit.toString(),
                    drep_deposit: parsedData.drep_deposit.toString(),
                    gov_action_deposit: parsedData.gov_action_deposit.toString(),
                    // NOTE: para que calcule un poco mas de fee agrego un 10%
                    // price_mem: (Number(parsedData.price_mem) * 1.1).toString().slice(0, Number(parsedData.price_mem).toString().length),
                    // price_step: (Number(parsedData.price_step) * 1.1).toString().slice(0, Number(parsedData.price_step).toString().length),
                    price_mem: parsedData.price_mem.toString(),
                    price_step: parsedData.price_step.toString(),
                    max_tx_ex_mem: parsedData.max_tx_ex_mem.toString(),
                    max_tx_ex_steps: parsedData.max_tx_ex_steps.toString(),
                    coins_per_utxo_size: parsedData.coins_per_utxo_size.toString(),
                    collateral_percent: parsedData.collateral_percent.toString(),
                    max_collateral_inputs: parsedData.max_collateral_inputs.toString(),
                    min_fee_ref_script_cost_per_byte: parsedData.min_fee_ref_script_cost_per_byte,
                    // cost_models: Object.fromEntries(Object.entries(parsedData.cost_models as any).map(([plutus, costModel])=>[
                    //         plutus,
                    //         Object.values(costModel as any)
                    //       ])),
                    cost_models: parsedData.cost_models,
                };

                // /home/manuelpadilla/sources/reposUbuntu/MAYZ/mayz-protocol-dapp-v1.0.5-mainnet-release-2024/node_modules/@spacebudz/lucid/lib/provider/blockfrost.js
                // /home/manuelpadilla/sources/reposUbuntu/MAYZ/mayz-protocol-dapp-v1.0.5-mainnet-release-2024/node_modules/@lucid-evolution/provider/dist/index.cjs

                // minFeeA: parseInt(result.min_fee_a),
                // minFeeB: parseInt(result.min_fee_b),
                // maxTxSize: parseInt(result.max_tx_size),
                // maxValSize: parseInt(result.max_val_size),
                // keyDeposit: BigInt(result.key_deposit),
                // poolDeposit: BigInt(result.pool_deposit),
                // drepDeposit: BigInt(result.drep_deposit),
                // govActionDeposit: BigInt(result.gov_action_deposit),
                // priceMem: parseFloat(result.price_mem),
                // priceStep: parseFloat(result.price_step),
                // maxTxExMem: BigInt(result.max_tx_ex_mem),
                // maxTxExSteps: BigInt(result.max_tx_ex_steps),
                // coinsPerUtxoByte: BigInt(result.coins_per_utxo_size),
                // collateralPercentage: parseInt(result.collateral_percent),
                // maxCollateralInputs: parseInt(result.max_collateral_inputs),
                // minFeeRefScriptCostPerByte: parseInt(
                //   result.min_fee_ref_script_cost_per_byte
                // ),
                // costModels: result.cost_models

                return res.status(200).json(result);
            } catch (error) {
                console_error(0, `Blockfrost Proxy`, `Error reading protocol-parameters.json: ${error}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }
        //--------------------
        const response = await httpProxyMiddleware(req, res, {
            target,
            timeout: TIMEOUT_PROXY_BLOCKFROST_MS,
            proxyTimeout: TIMEOUT_PROXY_BLOCKFROST_MS,
            headers: {
                'Content-Type': req.headers['content-type'] ? req.headers['content-type'] : 'text/plain',
                project_id: PROJECT_ID,
            },
            //--------------------
            changeOrigin: true,
            //--------------------
            pathRewrite: [
                {
                    patternStr: '^/api/blockfrost',
                    replaceStr: '',
                },
            ],
            //--------------------
            onProxyInit(httpProxy: { on: (arg0: string, arg1: (proxyReq: any, req: any, res: any) => void) => void }) {
                httpProxy.on('proxyReq', (proxyReq, req, res) => {
                    // console.log("Blockfrost Proxy url new: " + log(req.url))
                    // console.log(`proxyReq: ${log(proxyReq)}`, false)
                });
            },
        });
    } catch (error) {
        console_error(0, `Blockfrost Proxy`, error instanceof AggregateError ? `Error: ${error.errors}` : `Error: ${error}`);
        return res.status(400).json({ error: error instanceof AggregateError ? error.errors : error });
    }
};
