import { initAllDecoratorsExample } from '@example/src/lib/DummyExample/backEnd';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextApiRequestAuthenticated, console_error, initApiRequestWithContext } from 'smart-db/backEnd';
// necestary to init all decorators because all the rest of the Apis call the BackeEnd index and thet is where others do the init
initAllDecoratorsExample();

export default async function handler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    return await initApiRequestWithContext(0, `APP`, req, res, handlerWithContext, false, false, false, false);
}

async function handlerWithContext(req: NextApiRequest, res: NextApiResponse) {
    try {
        //--------------------------------------
        // TODO agregar todas las variables necesarias
        //--------------------------------------
        if (process.env.NEXT_PUBLIC_CARDANO_NET === undefined) throw `env NEXT_PUBLIC_CARDANO_NET not set`;

        //TODO agregar variables de entorno a controlar
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

        // // if (process.env.NEXT_PUBLIC_USE_BLOCKCHAIN_TIME === undefined) throw `env NEXT_PUBLIC_USE_BLOCKCHAIN_TIME not set`;

        // if (process.env.USE_DATABASE === undefined) throw `env USE_DATABASE not set`;

        // if (process.env.MONGO_URLDB === undefined) throw `env MONGO_URLDB not set`;

        res.status(200).json({ status: 'Initialization complete' });
    } catch (error) {
        console_error(0, `APP`, `${error}`);
        return res.status(500).json({ error: `An error occurred while initializeing site: ${error}` });
    }
}
