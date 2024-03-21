import { NextApiRequestAuthenticated, console_error, console_log, console_logLv1, enhanceResWithLogFlushing, initAllDecorators, initApiRequestWithContext, requestContext } from '@/src/lib/MayzSmartDB/backEnd';
import { initGlobals } from '@/src/lib/SmartDB/backEnd';
import { showData } from '@/src/utils/commons/utils';
import { isEmulator } from '@/src/utils/specific/constants';
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 } from 'uuid';
// necestary to init all decorators because all the rest of the Apis call the BackeEnd index and thet is where others do the init
initAllDecorators();

export default async function handler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    return await initApiRequestWithContext(0, `APP`, req, res, handlerWithContext, false, false, false, false);
}

async function handlerWithContext(req: NextApiRequest, res: NextApiResponse) {
    try {
        //--------------------------------------
        // TODO agregar todas las variables necesarias
        //--------------------------------------
        if (process.env.NEXT_PUBLIC_CARDANO_NET === undefined) throw `env NEXT_PUBLIC_CARDANO_NET not set`;

        if (isEmulator) {
        } else if (process.env.NEXT_PUBLIC_CARDANO_NET === 'Mainnet') {
            if (process.env.BLOCKFROST_KEY_MAINNET === undefined) throw `env BLOCKFROST_KEY_MAINNET not set`;
            if (process.env.NEXT_PUBLIC_BLOCKFROST_URL_MAINNET === undefined) throw `env NEXT_PUBLIC_BLOCKFROST_URL_MAINNET not set`;
            if (process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_MAINNET === undefined) throw `env NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_MAINNET not set`;
        } else if (process.env.NEXT_PUBLIC_CARDANO_NET === 'Preview') {
            if (process.env.BLOCKFROST_KEY_PREVIEW === undefined) throw `env BLOCKFROST_KEY_PREVIEW not set`;
            if (process.env.NEXT_PUBLIC_BLOCKFROST_URL_PREVIEW === undefined) throw `env NEXT_PUBLIC_BLOCKFROST_URL_PREVIEW not set`;
            if (process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREVIEW === undefined) throw `env NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREVIEW not set`;
        } else if (process.env.NEXT_PUBLIC_CARDANO_NET === 'Preprod') {
            if (process.env.BLOCKFROST_KEY_PREPROD === undefined) throw `env BLOCKFROST_KEY_PREPROD not set`;
            if (process.env.NEXT_PUBLIC_BLOCKFROST_URL_PREPROD === undefined) throw `env NEXT_PUBLIC_BLOCKFROST_URL_PREPROD not set`;
            if (process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREPROD === undefined) throw `env NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREPROD not set`;
        } else {
            throw `env NEXT_PUBLIC_CARDANO_NET not set correctly`;
        }

        if (process.env.NEXT_PUBLIC_REACT_SERVER_URL === undefined) throw `env NEXT_PUBLIC_REACT_SERVER_URL not set`;
        if (process.env.NEXT_PUBLIC_REACT_SERVER_API_URL === undefined) throw `env NEXT_PUBLIC_REACT_SERVER_API_URL not set`;

        if (process.env.NEXTAUTH_URL === undefined) throw `env NEXTAUTH_URL not set`;
        if (process.env.NEXTAUTH_SECRET === undefined) throw `env NEXTAUTH_SECRET not set`;
        if (process.env.LOGIN_JWT_SECRET_KEY === undefined) throw `env LOGIN_JWT_SECRET_KEY not set`;

        if (process.env.NEXT_PUBLIC_ORACLE_WALLET_PUBLICKEY === undefined) throw `env NEXT_PUBLIC_ORACLE_WALLET_PUBLICKEY not set`;
        if (process.env.ORACLE_INTERNAL_WALLET_PRIVATEKEY_CBORHEX === undefined) throw `env ORACLE_INTERNAL_WALLET_PRIVATEKEY_CBORHEX not set`;
        if (process.env.NEXT_PUBLIC_ORACLE_INTERNAL_WALLET_PUBLICKEY_CBORHEX === undefined) throw `env NEXT_PUBLIC_ORACLE_INTERNAL_WALLET_PUBLICKEY_CBORHEX not set`;

        // if (process.env.NEXT_PUBLIC_USE_BLOCKCHAIN_TIME === undefined) throw `env NEXT_PUBLIC_USE_BLOCKCHAIN_TIME not set`;

        if (process.env.USE_DATABASE === undefined) throw `env USE_DATABASE not set`;

        if (process.env.MONGO_URLDB === undefined) throw `env MONGO_URLDB not set`;

        res.status(200).json({ status: 'Initialization complete' });
    } catch (error) {
        console_error(0, `APP`, `${error}`);
        return res.status(500).json({ error: `An error occurred while initializeing site: ${error}` });
    }
}
