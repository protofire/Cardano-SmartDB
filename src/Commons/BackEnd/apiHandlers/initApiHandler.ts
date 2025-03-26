import { NextApiRequest, NextApiResponse } from 'next';
import { generateChallengueToken, generateCsrfToken } from '../../../lib/Auth/Auth.utils.js';
import { console_error, console_log } from '../globalLogs.js';

/**
 * @swagger
 * tags:
 *   name: Init
 *   description: Init endpoints
 *   post:
 *     summary: Initialize the application
 *     tags: [Init]
 *     responses:
 *       200:
 *         description: Initialization complete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: Initialization complete
 *                 token:
 *                   type: string
 *                   example: YOUR_TOKEN
 *                 csrfToken:
 *                   type: string
 *                   example: YOUR_CSRF_TOKEN
 *       500:
 *         description: Initialization failed
 */

export async function initApiHandlerWithContext(req: NextApiRequest, res: NextApiResponse) {
    try {
        //--------------------------------------
        console_log(1, `APP`, `initApiHandlerWithContext - Init`);
        //--------------------------------------
        // Generate CSRF token
        const csrfToken = generateCsrfToken();
        // Set CSRF token as a secure cookie
        res.setHeader('Set-Cookie', `x-csrf-token=${csrfToken}; Path=/; HttpOnly; SameSite=Strict`);
        //--------------------------------------
        const token = await generateChallengueToken();
        //--------------------------------------
        // //TODO agregar todas las variables necesarias
        // //--------------------------------------
        // if (process.env.NEXT_PUBLIC_CARDANO_NET === undefined) throw `env NEXT_PUBLIC_CARDANO_NET not set`;

        // if (isEmulator) {
        // } else if (process.env.NEXT_PUBLIC_CARDANO_NET === 'Mainnet') {
        //     if (process.env.BLOCKFROST_KEY_MAINNET === undefined) throw `env BLOCKFROST_KEY_MAINNET not set`;
        //     if (process.env.NEXT_PUBLIC_BLOCKFROST_URL_MAINNET === undefined) throw `env NEXT_PUBLIC_BLOCKFROST_URL_MAINNET not set`;
        //     if (process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_MAINNET === undefined) throw `env NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_MAINNET not set`;
        // } else if (process.env.NEXT_PUBLIC_CARDANO_NET === 'Preview') {
        //     if (process.env.BLOCKFROST_KEY_PREVIEW === undefined) throw `env BLOCKFROST_KEY_PREVIEW not set`;
        //     if (process.env.NEXT_PUBLIC_BLOCKFROST_URL_PREVIEW === undefined) throw `env NEXT_PUBLIC_BLOCKFROST_URL_PREVIEW not set`;
        //     if (process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREVIEW === undefined) throw `env NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREVIEW not set`;
        // } else if (process.env.NEXT_PUBLIC_CARDANO_NET === 'Preprod') {
        //     if (process.env.BLOCKFROST_KEY_PREPROD === undefined) throw `env BLOCKFROST_KEY_PREPROD not set`;
        //     if (process.env.NEXT_PUBLIC_BLOCKFROST_URL_PREPROD === undefined) throw `env NEXT_PUBLIC_BLOCKFROST_URL_PREPROD not set`;
        //     if (process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREPROD === undefined) throw `env NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREPROD not set`;
        // } else {
        //     throw `env NEXT_PUBLIC_CARDANO_NET not set correctly`;
        // }

        // if (process.env.NEXT_PUBLIC_REACT_SERVER_URL === undefined) throw `env NEXT_PUBLIC_REACT_SERVER_URL not set`;
        // if (process.env.NEXT_PUBLIC_REACT_SERVER_API_URL === undefined) throw `env NEXT_PUBLIC_REACT_SERVER_API_URL not set`;

        // if (process.env.NEXTAUTH_URL === undefined) throw `env NEXTAUTH_URL not set`;
        // if (process.env.NEXTAUTH_SECRET === undefined) throw `env NEXTAUTH_SECRET not set`;
        // if (process.env.LOGIN_JWT_SECRET_KEY === undefined) throw `env LOGIN_JWT_SECRET_KEY not set`;

        // if (process.env.ORACLE_WALLET_PRIVATEKEY_BENCH32 === undefined) throw `env ORACLE_WALLET_PRIVATEKEY_BENCH32 not set`;
        // if (process.env.ORACLE_WALLET_PRIVATEKEY_CBORHEX === undefined) throw `env ORACLE_WALLET_PRIVATEKEY_CBORHEX not set`;
        // if (process.env.NEXT_PUBLIC_ORACLE_WALLET_PUBLICKEY_CBORHEX === undefined) throw `env NEXT_PUBLIC_ORACLE_WALLET_PUBLICKEY_CBORHEX not set`;
        // if (process.env.NEXT_PUBLIC_ORACLE_INTERNAL_WALLET_PUBLICKEY_CBORHEX === undefined) throw `env NEXT_PUBLIC_ORACLE_INTERNAL_WALLET_PUBLICKEY_CBORHEX not set`;

        // if (process.env.USE_DATABASE === undefined) throw `env USE_DATABASE not set`;

        // if (process.env.MONGO_URLDB === undefined) throw `env MONGO_URLDB not set`;
        // //--------------------------------------
        console_log(-1, `APP`, `initApiHandlerWithContext - Initialization complete`);
        //--------------------------------------
        res.status(200).json({ status: 'Initialization complete', token, csrfToken });
        //--------------------------------------
    } catch (error) {
        console_error(-1, `APP`, `${error}`);
        return res.status(500).json({ error: `An error occurred while initializeing site: ${error}` });
    }
}
