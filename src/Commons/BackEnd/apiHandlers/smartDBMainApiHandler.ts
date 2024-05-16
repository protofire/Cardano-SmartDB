import { NextApiResponse } from 'next';
import { AuthBackEnd } from '../../../lib/Auth/Auth.BackEnd.js';
import { TimeBackEndApiHandlers } from '../../../lib/Time/Time.BackEnd.Api.Handlers.js';
import { NextApiRequestAuthenticated } from '../../../lib/index.js';
import { RegistryManager } from '../../Decorators/registerManager.js';
import { console_error, console_log } from '../globalLogs.js';
import { initGlobals } from '../initGlobals.js';
import { blockfrostProxyApiHandlerWithContext } from './blockFrostApiHandler.js';
import { healthApiHandlerWithContext } from './healthApiHandler.js';
import { initApiHandlerWithContext } from './initApiHandler.js';
import { initApiRequestWithContext } from './initApiRequestWithContext.js';
import getRawBody from 'raw-body';

// entrada de todas las llamadas api. Llama al metodo mainApiHandler del backendApiHandler correspondiente

export async function smartDBMainApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    return await initApiRequestWithContext(0, `Api handler`, req, res, smartDBMainApiHandlerWithContext);
}

async function smartDBMainApiHandlerWithContext(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    try {
        // initAllDecorators();
        //--------------------
        const { query } = req.query;
        //--------------------
        if (query !== undefined && query.length > 0) {
            //--------------------
            const requestedApiRoute = (query as string[]).shift(); // Assuming API route is at index 0
            //--------------------
            console_log(1, `Api handler`, `Requested API Route: ${requestedApiRoute}`);
            //--------------------
            if (requestedApiRoute !== 'blockfrost') {
                // Manually parse the body for all routes except blockfrost
                try {
                    const rawBody = await getRawBody(req);
                    if (rawBody.length > 0) {
                        req.body = JSON.parse(rawBody.toString('utf8'));
                    } else {
                        req.body = {}; // Handle empty body case
                    }
                } catch (error) {
                    console.error('Error parsing body:', error);
                    return res.status(400).json({ error: 'Invalid Body input' });
                }
            }
            //--------------------------------------
            if (requestedApiRoute === 'init') {
                // Handle Init Route
                //--------------------------------------
                await initGlobals(true, false, false, false, false);
                //--------------------------------------
                // await initApiRequestWithContext(0, `Api handler`, req, res, initApiHandlerWithContext);
                //--------------------------------------

                await initApiHandlerWithContext(req, res);
                //--------------------------------------
                return;
            } else if (requestedApiRoute === 'health') {
                // Handle Health Route
                //--------------------------------------
                // await initApiRequestWithContext(0, `Api handler`, req, res, healthApiHandlerWithContext);
                //--------------------------------------
                await healthApiHandlerWithContext(req, res);
                //--------------------------------------
                return;
            } else if (requestedApiRoute === 'time') {
                //--------------------------------------
                const requestedApiRouteTime = (query as string[]).shift(); // Assuming API route is at index 0
                //--------------------------------------
                await initGlobals();
                //--------------------------------------
                if (requestedApiRouteTime === 'get') {
                    await TimeBackEndApiHandlers.getServerTimeApiHandlerWithContext(req, res);
                    return;
                } else if (requestedApiRouteTime === 'sync-emulator-blockchain-time') {
                    await TimeBackEndApiHandlers.syncEmulatorBlockChainWithServerTimeApiHandlerWithContext(req, res);
                    return;
                }
                //--------------------------------------
            } else if (requestedApiRoute === 'smart-db-auth' && query.length > 0) {
                //--------------------------------------
                const requestedApiRouteNextAuth = (query as string[]).shift(); // Assuming API route is at index 0
                //--------------------------------------
                if (requestedApiRouteNextAuth === 'get-challengue') {
                    // Handle NextAuth routes
                    //--------------------------------------
                    await initGlobals();
                    //--------------------------------------
                    // await initApiRequestWithContext(0, `Api handler`, req, res, AuthBackEnd.getChallengueTokenApiHandlerWithContext.bind(AuthBackEnd));
                    await AuthBackEnd.getChallengueTokenApiHandlerWithContext(req, res);
                    //--------------------------------------
                    return;
                } else if (requestedApiRouteNextAuth === 'get-token') {
                    // Handle NextAuth routes
                    //--------------------------------------
                    await initGlobals();
                    //--------------------------------------
                    // await initApiRequestWithContext(0, `Api handler`, req, res, AuthBackEnd.getJWTTokenWithCredentialsApiHandlerWithContext.bind(AuthBackEnd));
                    await AuthBackEnd.getJWTTokenWithCredentialsApiHandlerWithContext(req, res);
                    //--------------------------------------
                    return;
                }
            } else if (requestedApiRoute === 'blockfrost') {
                // Handle Blockfrost routes
                //--------------------------------------
                await initGlobals(true, false, false, false, false);
                //--------------------------------------
                try {
                    await AuthBackEnd.addCorsHeaders(req, res);
                } catch (error) {
                    console_error(0, `Api handler`, `Error: ${error}`);
                    return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                }
                //--------------------
                try {
                    await AuthBackEnd.authenticate(req, res);
                } catch (error) {
                    console_error(0, `Api handler`, `Error: ${error}`);
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                //-------------------------
                // await initApiRequestWithContext(0, `Api handler`, req, res, blockfrostProxyApiHandlerWithContext);
                await blockfrostProxyApiHandlerWithContext(req, res);
                return;
            }
            //--------------------------------------
            const allEntities = RegistryManager.getAllFromEntitiesRegistry();
            const allSmartDBEntities = RegistryManager.getAllFromSmartDBEntitiesRegistry();
            const allBackEndApiHandlers = RegistryManager.getAllFromBackEndApiHandlersRegistry();
            //--------------------------------------
            // Search for the entity in the EntitiesRegistry
            let entitiesRegistryEntity = undefined;
            for (const [name, Entity] of allEntities) {
                // console.log(`EntitiesRegistry: ${name}`);
                if (Entity._apiRoute === requestedApiRoute) {
                    entitiesRegistryEntity = Entity;
                    // console.log(`EntitiesRegistry: FOUND ${name}`);
                }
            }
            //--------------------------------------
            if (entitiesRegistryEntity === undefined) {
                for (const [name, Entity] of allSmartDBEntities) {
                    // console.log(`SmartDBEntitiesRegistry: ${name}`);
                    if (Entity._apiRoute === requestedApiRoute) {
                        entitiesRegistryEntity = Entity;
                        // console.log(`SmartDBEntitiesRegistry: FOUND ${name}`);
                    }
                }
            }
            //--------------------------------------
            if (entitiesRegistryEntity !== undefined) {
                // Search for the entity in the BackEndApiHandlersRegistry
                let backendApiHandlers = undefined;
                for (const [className, Bk] of allBackEndApiHandlers) {
                    // console.log(`BackEndApiHandlersRegistry: ${className}`);
                    if (className === entitiesRegistryEntity.className()) {
                        backendApiHandlers = Bk;
                        // console.log(`BackEndApiHandlersRegistry: FOUND ${className}`);
                        break;
                    }
                }
                //--------------------------------------
                if (backendApiHandlers !== undefined) {
                    //--------------------------------------
                    await initGlobals();
                    //--------------------------------------
                    try {
                        await AuthBackEnd.addCorsHeaders(req, res);
                    } catch (error) {
                        console_error(0, `Api handler`, `Error: ${error}`);
                        return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                    }
                    //--------------------
                    try {
                        await AuthBackEnd.authenticate(req, res);
                    } catch (error) {
                        console_error(0, `Api handler`, `Error: ${error}`);
                        return res.status(401).json({ error: 'Unauthorized' });
                    }
                    //-------------------------
                    // await initApiRequestWithContext(0, `Api handler`, req, res, backendApiHandlers.mainApiHandler(req, res).bind(entitiesRegistryEntity));
                    await backendApiHandlers.mainApiHandlerWithContext(req, res);
                    //--------------------
                    return;
                } else {
                    console_error(-1, `Api handler`, `No API handler found for entity: ${entitiesRegistryEntity._className}`);
                    res.status(500).json({ error: `No API handler found for entity: ${entitiesRegistryEntity._className}` });
                    return;
                }
            } else {
                console_error(-1, `Api handler`, `No entity found for API route: ${requestedApiRoute}`);
                res.status(404).json({ error: `No entity found for API route: ${requestedApiRoute}` });
                return;
            }
        } else {
            console_error(-1, `Api handler`, `No API route found in the request URL`);
            res.status(404).json({ error: `No API route found in the request URL` });
            return;
        }
    } catch (error) {
        console_error(-1, `Api handler`, `Error: ${error}`);
        res.status(500).json({ error: `An error occurred: ${error}` });
        return;
    }
}
