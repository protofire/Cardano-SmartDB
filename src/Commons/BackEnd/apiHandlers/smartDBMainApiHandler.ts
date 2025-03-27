import { NextApiResponse } from 'next';
import { NextAuthOptions } from 'next-auth';
import qs from 'qs';
import getRawBody from 'raw-body';
import { AuthBackEnd, authOptionsBase, credentialProviderConfig } from '../../../lib/Auth/Auth.BackEnd.js';
import { TimeBackEndApiHandlers } from '../../../lib/Time/Time.BackEnd.Api.Handlers.js';
import { NextApiRequestAuthenticated } from '../../../lib/index.js';
import { RegistryManager } from '../../Decorators/registerManager.js';
import { showData } from '../../utils.js';
import { console_error, console_log, flushLogs } from '../globalLogs.js';
import { initGlobals } from '../initGlobals.js';
import { blockfrostProxyApiHandlerWithContext } from './blockFrostApiHandler.js';
import { healthApiHandlerWithContext } from './healthApiHandler.js';
import { initApiHandlerWithContext } from './initApiHandler.js';
import { initApiRequestWithContext } from './initApiRequestWithContext.js';
import { globalInitJobsExecuteOnlyOnce } from '../globalInitJobs.js';

const CredentialsProvider = require('next-auth/providers/credentials').default;
const NextAuth = require('next-auth').default;

export async function parseBody(req: NextApiRequestAuthenticated) {
    const rawBody = await getRawBody(req);
    if (rawBody.length === 0) {
        return {}; // Handle empty body case
    }
    const contentType = req.headers['content-type'];
    if (contentType === 'application/json') {
        return JSON.parse(rawBody.toString('utf8'));
    } else if (contentType === 'application/x-www-form-urlencoded') {
        return qs.parse(rawBody.toString('utf8'));
    } else {
        throw new Error(`Unsupported content type: ${contentType}`);
    }
}

// entrada de todas las llamadas api. Llama al metodo mainApiHandler del backendApiHandler correspondiente

export async function smartDBMainApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    return await initApiRequestWithContext(0, `Api handler`, req, res, smartDBMainApiHandlerWithContext);
}

async function smartDBMainApiHandlerWithContext(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    try {
        //--------------------
        console_log(1, `Api handler`, `Requested API URL: ${req.url} - req.method ${req.method} - req.query: ${showData(req.query, false)}`);
        //--------------------
        // Extract the full API route path
        const fullApiRoute =
            req.url
                ?.split('?')[0]
                .replace(/^\/api\//, '')
                .split('/') || [];
        //--------------------
        if (fullApiRoute.length > 0) {
            //--------------------
            // Extract the requested API route
            const requestedApiRoute = fullApiRoute.shift();
            //--------------------
            // Adjust the query object
            req.query.query = fullApiRoute;
            //--------------------
            console_log(0, `Api handler`, `Requested API Route: ${requestedApiRoute}`);
            //--------------------
            if (requestedApiRoute !== 'blockfrost') {
                //--------------------------------------
                // Manually parse the body for all routes except blockfrost
                //--------------------------------------
                try {
                    console_log(0, `Api handler`, `Parsing Body...`);
                    req.body = await parseBody(req);
                    console_log(0, `Api handler`, `Body: ${showData(req.body, false)}`);
                } catch (error) {
                    console_error(-1, `Api handler`, `Error parsing body: ${error}`);
                    return res.status(400).json({ error: 'Invalid Body input' });
                }
            }
            //--------------------------------------
            if (requestedApiRoute === 'init') {
                //--------------------------------------
                // Handle Init Route
                //--------------------------------------
                console_log(0, `Api handler`, `Handle Init Route`);
                //--------------------
                await initGlobals(true, false, false, false, false);
                //--------------------------------------
                try {
                    await AuthBackEnd.addCorsHeaders(req, res);
                } catch (error) {
                    console_error(-1, `Api handler`, `Error: ${error}`);
                    return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                }
                //--------------------------------------
                await globalInitJobsExecuteOnlyOnce();
                //--------------------------------------
                await initApiHandlerWithContext(req, res);
                //--------------------------------------
                return;
            } else if (requestedApiRoute === 'health') {
                //--------------------------------------
                // Handle Health Route
                //--------------------------------------
                console_log(0, `Api handler`, `Handle Health Route`);
                //--------------------
                await initGlobals(true, false, false, false, false);
                //--------------------------------------
                try {
                    await AuthBackEnd.addCorsHeaders(req, res);
                } catch (error) {
                    console_error(-1, `Api handler`, `Error: ${error}`);
                    return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                }
                //--------------------------------------
                await healthApiHandlerWithContext(req, res);
                //--------------------------------------
                return;
            } else if (requestedApiRoute === 'time' && fullApiRoute.length > 0) {
                //--------------------------------------
                // Handle Time Route
                //--------------------------------------
                console_log(0, `Api handler`, `Handle Time Route`);
                //--------------------
                await initGlobals();
                //--------------------------------------
                try {
                    await AuthBackEnd.addCorsHeaders(req, res);
                } catch (error) {
                    console_error(-1, `Api handler`, `Error: ${error}`);
                    return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                }
                //--------------------------------------
                const requestedApiRouteTime = fullApiRoute.shift();
                //--------------------
                // Adjust the query object
                req.query.query = fullApiRoute;
                //--------------------
                if (requestedApiRouteTime === 'get') {
                    await TimeBackEndApiHandlers.getServerTimeApiHandlerWithContext(req, res);
                    return;
                } else if (requestedApiRouteTime === 'sync-emulator-blockchain-time') {
                    await TimeBackEndApiHandlers.syncEmulatorBlockChainWithServerTimeApiHandlerWithContext(req, res);
                    return;
                }
                //--------------------------------------
            } else if (requestedApiRoute === 'auth') {
                //--------------------------------------
                // Handle nexth-auth routes
                //--------------------------------------
                console_log(0, `Api handler`, `Handle nexth-auth Route`);
                //--------------------
                await initGlobals(true, false, false, false, false);
                //--------------------------------------
                try {
                    await AuthBackEnd.addCorsHeaders(req, res);
                } catch (error) {
                    console_error(-1, `Api handler`, `Error: ${error}`);
                    return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                }
                //--------------------------------------
                //TODO: aqui se podria implementar tomar del globalconfig las options y providers
                // para que el usuario pueda sobreescribir esos metodos
                const authOptions: NextAuthOptions = {
                    ...authOptionsBase,
                    providers: [CredentialsProvider(credentialProviderConfig)],
                };
                //--------------------------------------
                await NextAuth(req, res, authOptions);
                //--------------------------------------
                flushLogs();
                //--------------------------------------
                return;
                //--------------------------------------
            } else if (requestedApiRoute === 'smart-db-auth' && fullApiRoute.length > 0) {
                //--------------------------------------
                // Handle smart-db-auth routes
                //--------------------------------------
                console_log(0, `Api handler`, `Handle smart-db-auth Route`);
                //--------------------
                await initGlobals();
                //--------------------------------------
                try {
                    await AuthBackEnd.addCorsHeaders(req, res);
                } catch (error) {
                    console_error(-1, `Api handler`, `Error: ${error}`);
                    return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                }
                //--------------------------------------
                const requestedApiRouteNextAuth = fullApiRoute.shift();
                //--------------------
                // Adjust the query object
                req.query.query = fullApiRoute;
                //--------------------
                if (requestedApiRouteNextAuth === 'get-challengue') {
                    //--------------------------------------
                    await AuthBackEnd.getChallengueTokenApiHandlerWithContext(req, res);
                    //--------------------------------------
                    return;
                } else if (requestedApiRouteNextAuth === 'get-token') {
                    //--------------------------------------
                    await AuthBackEnd.getJWTTokenWithCredentialsApiHandlerWithContext(req, res);
                    //--------------------------------------
                    return;
                }
            } else if (requestedApiRoute === 'blockfrost') {
                //--------------------------------------
                // Handle Blockfrost routes
                //--------------------------------------
                console_log(0, `Api handler`, `Handle Blockfrost Route`);
                //--------------------
                await initGlobals(true, false, false, false, false);
                //--------------------------------------
                try {
                    await AuthBackEnd.addCorsHeaders(req, res);
                } catch (error) {
                    console_error(-1, `Api handler`, `Error: ${error}`);
                    return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                }
                //--------------------
                try {
                    await AuthBackEnd.authenticate(req, res);
                } catch (error) {
                    console_error(-1, `Api handler`, `Error: ${error}`);
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                //-------------------------
                await blockfrostProxyApiHandlerWithContext(req, res);
                //-------------------------
                flushLogs();
                //-------------------------
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
                        console_error(-1, `Api handler`, `Error: ${error}`);
                        return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
                    }
                    //--------------------
                    try {
                        await AuthBackEnd.authenticate(req, res);
                    } catch (error) {
                        console_error(-1, `Api handler`, `Error: ${error}`);
                        return res.status(401).json({ error: 'Unauthorized' });
                    }
                    //--------------------------------------
                    console_log(0, `Api handler`, `Handle Entity Route`);
                    //--------------------
                    await backendApiHandlers.mainApiHandlerWithContext(req, res);
                    //--------------------------------------
                    return;
                } else {
                    console_error(-1, `Api handler`, `No API handler found for entity: ${entitiesRegistryEntity._className}`);
                    res.status(500).json({ error: `No API handler found for entity: ${entitiesRegistryEntity._className}` });
                    return;
                }
            } else {
                console_error(-1, `Api handler`, `No API handler found for route: ${requestedApiRoute}`);
                res.status(404).json({ error: `No API handler found for route: ${requestedApiRoute}` });
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
