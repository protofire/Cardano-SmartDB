import Cors from 'cors';
import { sign, verify } from 'jsonwebtoken';
import { SignedMessage } from 'lucid-cardano';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextAuthOptions, User } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { v4 } from 'uuid';
import { WalletBackEndApplied } from '../../BackEnd/Wallet.BackEnd.Applied.js';
import { EndpointsManager } from '../../Commons/BackEnd/endPointsManager.js';
import { requestContext, requestId } from '../../Commons/BackEnd/globalContext.js';
import { getGlobalEmulator } from '../../Commons/BackEnd/globalEmulator.js';
import { console_error, console_log, flushLogs } from '../../Commons/BackEnd/globalLogs.js';
import { getGlobalLucid, globalLucid } from '../../Commons/BackEnd/globalLucid.js';
import { getGlobalSettings, globalSettings } from '../../Commons/BackEnd/globalSettings.js';
import { initGlobals } from '../../Commons/BackEnd/initGlobals.js';
import {
    LucidLUCID_NETWORK_MAINNET_NAME,
    VALID_SESSION_DURATION_MS,
    VALID_SESSION_DURATION_SECONDS,
    VALID_SESSION_DURATION_STR,
    WALLET_CREATEDBY_LOGIN,
} from '../../Commons/Constants/constants.js';
import { addressToPaymentPubKeyHashAndStakePubKeyHash } from '../../Commons/helpers.js';
import { isNullOrBlank, sanitizeForDatabase, showData, strToHex } from '../../Commons/utils.js';
import yup from '../../Commons/yupLocale.js';
import { WalletEntity } from '../../Entities/Wallet.Entity.js';
import { generateChallengueToken, isValidChallengueToken, isValidCsrfToken, validateChallengueToken } from './Auth.utils.js';
import { ChallengueJWTPayload, CredentialsAuthenticated, NextApiRequestAuthenticated, TokenJWTPayload } from './types.js';
import { getGlobalBlockchainTime } from '../../Commons/BackEnd/globalBlockchainTime.js';

// import CredentialsProvider from "next-auth/providers/credentials";
// import Auth0Provider from "next-auth/providers/auth0"
// import FacebookProvider from "next-auth/providers/facebook"
// import GithubProvider from "next-auth/providers/github"
// import GoogleProvider from "next-auth/providers/google"
// import TwitterProvider from "next-auth/providers/twitter"
// import EmailProvider from "next-auth/providers/email"
// import AppleProvider from "next-auth/providers/apple"

type MiddlewareFunction = (req: NextApiRequestAuthenticated, res: NextApiResponse, next: (result: any) => void) => void;

export const credentialProviderConfig = {
    // The name to display on the sign in form (e.g. "Sign in with...")
    name: 'Credentials',
    // The credentials is used to generate a suitable form on the sign in page.
    // You can specify whatever fields you are expecting to be submitted.
    // e.g. domain, username, password, 2FA token, etc.
    // You can pass any HTML attribute to the <input> tag through the object.
    credentials: {
        token: { label: 'token', type: 'text', placeholder: '' },
    },

    async authorize(credentials: { token: string } | undefined, req: any): Promise<User | null> {
        return new Promise((resolve, reject) => {
            requestContext.run(async () => {
                //--------------------------------------
                // TODO: esta es la unica api handler que no usa el helper initApiRequestWithContext para crear contexto
                //--------------------------------------
                requestId();
                //--------------------------------------
                // Perform any context setup here
                //--------------------
                console_log(1, `NextAuth`, `Authorize - Credentials: ${showData(credentials, false)} - INIT`);
                //--------------------
                await getGlobalSettings();
                await getGlobalEmulator(true);
                await getGlobalLucid();
                await getGlobalBlockchainTime();
                //--------------------
                // Add logic here to look up the user from the credentials supplied
                try {
                    //--------------------------------------
                    if (credentials === undefined) {
                        throw `Credentials undefined`;
                    }
                    //--------------------------------------
                    const user = await AuthBackEnd.validateJWTTokenWithCredentials(credentials.token);
                    //--------------------------------------
                    // create a user entry in our database
                    const paymentPKH = user.pkh;
                    //--------------------------------------
                    if (paymentPKH === undefined) {
                        throw `paymentPKH undefined`;
                    }
                    //--------------------------------------
                    let testnet_address,
                        mainnet_address = undefined;
                    //--------------------------------------
                    if (process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME) {
                        mainnet_address = user.address;
                    } else {
                        testnet_address = user.address;
                    }
                    //--------------------------------------
                    let queryConditions: Record<string, any> = [{ paymentPKH }];
                    //--------------------------------------
                    if (!isNullOrBlank(testnet_address)) {
                        queryConditions.push({ testnet_address });
                    }
                    if (!isNullOrBlank(mainnet_address)) {
                        queryConditions.push({ mainnet_address });
                    }
                    //--------------------
                    let queryCondition = { $or: queryConditions };
                    //--------------------
                    const wallet: WalletEntity | undefined = await WalletBackEndApplied.getOneByParams_(queryCondition);
                    //--------------------
                    //-------------------------
                    const TimeBackEnd = (await import('../../lib/Time/Time.BackEnd.js')).TimeBackEnd;
                    //-------------------------
                    const serverTime = await TimeBackEnd.getServerTime(false);
                    //------------------------------------
                    if (wallet === undefined) {
                        //--------------------
                        console_log(0, `NextAuth`, `Authorize - Creating Wallet...`);
                        //--------------------
                        const count = await WalletBackEndApplied.getCount_();
                        //------
                        if (count > 0 || true) {
                            //-------------------------
                            const createdAt = new Date(serverTime);
                            const createdBy = WALLET_CREATEDBY_LOGIN;
                            const lastConnection = createdAt;
                            const walletUsed = user.walletNameOrSeedOrKey;
                            //--------------------
                            const stakePKH = user.stakePkh;
                            //--------------------
                            const wallet: WalletEntity = new WalletEntity({
                                createdAt,
                                createdBy,
                                lastConnection,
                                walletUsed,
                                walletValidatedWithSignedToken: user.isWalletValidatedWithSignedToken,
                                paymentPKH,
                                stakePKH,
                                name: user.name,
                                email: user.email,
                                isCoreTeam: false,
                                testnet_address,
                                mainnet_address,
                            });
                            //--------------------
                            console.log(0, `NextAuth`, `Authorize - wallet5 ${showData(wallet.paymentPKH, false)}`);
                            console.log(0, `NextAuth`, `Authorize - wallet5 ${showData(wallet, false)}`);

                            console_log(0, `NextAuth`, `Authorize - wallet ${showData(wallet, false)}`);
                            //--------------------
                            await WalletBackEndApplied.create(wallet);
                        }
                    } else {
                        //--------------------
                        console_log(0, `NextAuth`, `Authorize - Updating Wallet...`);
                        //--------------------
                        wallet.lastConnection = new Date(serverTime);
                        wallet.walletUsed = user.walletNameOrSeedOrKey;
                        wallet.walletValidatedWithSignedToken = user.isWalletValidatedWithSignedToken;
                        //--------------------
                        await WalletBackEndApplied.update(wallet);
                        //--------------------
                    }
                    console_log(0, `NextAuth`, `Authorize - User: ${showData(user, false)} - OK`);
                    //--------------------
                    flushLogs();
                    //--------------------
                    resolve(user);
                } catch (error: any) {
                    //--------------------
                    console_error(-1, `NextAuth`, `Authorize - Error: ${error}`);
                    //--------------------
                    flushLogs();
                    //--------------------
                    reject(new Error(error));
                }
            });
        });
    },
};

export const authOptionsBase: NextAuthOptions = {
    // https://next-auth.js.org/configuration/providers
    //NOTE: must be empty and set in final use case
    // ...authOptionsBase,
    // providers: [CredentialsProvider(credentialProviderConfig)],
    providers: [
        // CredentialsProvider(credentialProviderConfig),
        // EmailProvider({
        //   server: process.env.EMAIL_SERVER,
        //   from: process.env.EMAIL_FROM,
        // }),
        // AppleProvider({
        //   clientId: process.env.APPLE_ID,
        //   clientSecret: {
        //     appleId: process.env.APPLE_ID,
        //     teamId: process.env.APPLE_TEAM_ID,
        //     privateKey: process.env.APPLE_PRIVATE_KEY,
        //     keyId: process.env.APPLE_KEY_ID,
        //   },
        // }),
        // Auth0Provider({
        //   clientId: process.env.AUTH0_ID,
        //   clientSecret: process.env.AUTH0_SECRET,
        //   // @ts-ignore
        //   domain: process.env.AUTH0_DOMAIN,
        // }),
        // FacebookProvider({
        //   clientId: process.env.FACEBOOK_ID,
        //   clientSecret: process.env.FACEBOOK_SECRET,
        // }),
        // GithubProvider({
        //   clientId: process.env.GITHUB_ID,
        //   clientSecret: process.env.GITHUB_SECRET,
        //   // https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
        //   // @ts-ignore
        //   scope: "read:user",
        // }),
        // GoogleProvider({
        //   clientId: process.env.GOOGLE_ID,
        //   clientSecret: process.env.GOOGLE_SECRET,
        // }),
        // TwitterProvider({
        //   clientId: process.env.TWITTER_ID,
        //   clientSecret: process.env.TWITTER_SECRET,
        // }),
    ],
    // Database optional. MySQL, Maria DB, Postgres and MongoDB are supported.
    // https://next-auth.js.org/configuration/databases
    //
    // Notes:
    // * You must install an appropriate node_module for your database
    // * The Email provider requires a database (OAuth providers do not)
    // database: process.env.DATABASE_URL,

    // The secret should be set to a reasonably long random string.
    // It is used to sign cookies and to sign and encrypt JSON Web Tokens, unless
    // a separate secret is defined explicitly for encrypting the JWT.
    secret: process.env.NEXTAUTH_SECRET,

    session: {
        // Use JSON Web Tokens for session instead of database sessions.
        // This option can be used with or without a database for users/accounts.
        // Note: `strategy` should be set to 'jwt' if no database is used.
        strategy: 'jwt',

        // Seconds - How long until an idle session expires and is no longer valid.
        maxAge: VALID_SESSION_DURATION_SECONDS, // 30 days

        // Seconds - Throttle how frequently to write to database to extend a session.
        // Use it to limit write operations. Set to 0 to always update the database.
        // Note: This option is ignored if using JSON Web Tokens
        // updateAge: 24 * 60 * 60, // 24 hours
    },

    // JSON Web tokens are only used for sessions if the `strategy: 'jwt'` session
    // option is set - or by default if no database is specified.
    // https://next-auth.js.org/configuration/options#jwt
    jwt: {
        // A secret to use for key generation (you should set this explicitly)
        secret: process.env.NEXTAUTH_SECRET,
        // Set to true to use encryption (default: false)
        // encryption: true,
        // You can define your own encode/decode functions for signing and encryption
        // if you want to override the default behaviour.
        // encode: async ({ secret, token, maxAge }) => {},
        // decode: async ({ secret, token, maxAge }) => {},
    },

    // You can define custom pages to override the built-in ones. These will be regular Next.js pages
    // so ensure that they are placed outside of the '/api' folder, e.g. signIn: '/auth/mycustom-signin'
    // The routes shown here are the default URLs that will be used when a custom
    // pages is not specified for that route.
    // https://next-auth.js.org/configuration/pages
    pages: {
        // signIn: '/auth/signin',  // Displays signin buttons
        // signOut: '/auth/signout', // Displays form with sign out button
        // error: '/auth/error', // Error code passed in query string as ?error=
        // verifyRequest: '/auth/verify-request', // Used for check email page
        // newUser: null // If set, new users will be directed here on first sign in
    },

    // Callbacks are asynchronous functions you can use to control what happens
    // when an action is performed.
    // https://next-auth.js.org/configuration/callbacks
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            // console.log("/api/auth/[...nextauth].ts - signIn: " )
            return true;
        },
        // async redirect({ url, baseUrl }) { return baseUrl },
        async jwt({ token, user, account, profile, isNewUser }) {
            // console.log(`/api/auth/[...nextauth].ts - jwt - token: ${log(token)}`)
            // console.log(`/api/auth/[...nextauth].ts - jwt - user: ${log(user)}`)
            // console.log(`/api/auth/[...nextauth].ts - jwt - account: ${log(account)}`)
            // console.log(`/api/auth/[...nextauth].ts - jwt - profile: ${log(profile)}`)
            // console.log(`/api/auth/[...nextauth].ts - jwt - isNewUser: ${log(isNewUser)}`)

            user && (token.user = user);
            return token;
        },

        session({ session, token }) {
            // console.log(`/api/auth/[...nextauth].ts - session - user: ${log(session)}`)
            // console.log(`/api/auth/[...nextauth].ts - session - user: ${log(user)}`)
            // console.log(`/api/auth/[...nextauth].ts - session - token: ${log(token)}`)

            const user = token.user as User;
            if (user !== undefined) {
                // if ('error' in user) {
                //     session.error = user.error;
                // } else{
                session.user = user;
                // }
            } else {
                // session.error = `Invalid Session Token`
            }

            return session; // The return type will match the one returned in `useSession()`
        },
    },

    // Events are useful for logging
    // https://next-auth.js.org/configuration/events
    events: {},

    // Enable debug messages in the console if you are having problems
    debug: true,
};

export class AuthBackEnd {
    // #region generic methods

    public static runMiddleware = async (req: NextApiRequestAuthenticated, res: NextApiResponse, fn: MiddlewareFunction): Promise<any> => {
        return new Promise((resolve, reject) => {
            fn(req, res, (result) => {
                if (result instanceof Error) {
                    reject(result);
                } else {
                    resolve(result);
                }
            });
        });
    };

    public static addCorsHeaders = async (req: NextApiRequestAuthenticated, res: NextApiResponse): Promise<any> => {
        try {
            //---------------------
            console_log(1, `Auth`, `addCorsHeaders - Init`);
            //-------------------------
            const options: Cors.CorsOptions = {
                methods: ['GET', 'HEAD', 'POST'],
                credentials: true,
                origin: globalSettings.siteSettings?.corsAllowedOrigin,
            };
            //-------------------------
            // Initializing the cors middleware
            const cors = Cors(options);
            //-------------------------
            await this.runMiddleware(req, res, cors);
            //---------------------
            console_log(-1, `Auth`, `addCorsHeaders - OK`);
            //---------------------
        } catch (error) {
            console_error(-1, `Auth`, ` addCorsHeaders - Error: ${error}`);
            throw `${error}`;
        }
    };

    public static authenticate = async (req: NextApiRequestAuthenticated, res: NextApiResponse): Promise<void> => {
        //---------------------
        console_log(1, `Auth`, `authenticate - Init`);
        //---------------------
        let user;
        let error_;
        //---------------------
        console_log(0, `Auth`, `authenticate - Try to authenticate using JWT...`);
        //---------------------
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                user = await this.validateJWTTokenWithCredentials(token);
            } catch (error) {
                console_log(0, `Auth`, `authenticate - JWT authentication failed, continue to check the session...`);
                error_ = error as string;
            }
        } else {
            error_ = (isNullOrBlank(error_) ? '' : error_ + ' and ') + 'authHeader is not set';
            console_log(0, `Auth`, `authenticate - No JWT Token found, continue to check the session...`);
        }
        //---------------------
        if (user === undefined) {
            console_log(0, `Auth`, `authenticate - Checking the session...`);
            user = await this.getSessionUser(req);
            if (user === undefined) {
                console_log(0, `Auth`, `authenticate - Session authentication failed, continue to check the if the Api is Public...`);
                error_ = (isNullOrBlank(error_) ? '' : error_ + ' and ') + 'User is not logged';
            }
        }
        //---------------------
        const endpointsManager = EndpointsManager.getInstance();
        const PUBLIC_ENDPOINTS_FROM_INTERNET = endpointsManager.getPublicEndPointsInternet();
        const PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER = endpointsManager.getPublicEndPointsLocal();
        //---------------------
        if (user !== undefined) {
            req.user = user;
        }
        //---------------------
        if (user === undefined || user.isWalletValidatedWithSignedToken === false) {
            //---------------------
            if (user !== undefined && user.isWalletValidatedWithSignedToken === false) {
                console_log(0, `Auth`, `authenticate - Found user but is not fully validated with signed message`);
            }
            //---------------------
            const requestUrl = req.url;
            // const referer = req.headers.referer;
            //TODO: como realmente saber el refeerer? por que puedo poner el referer que quiera en el header
            //---------------------
            // console_log(0, `Auth`, `authenticate - req.headers: ${showData(req.headers, false)}`);
            console_log(0, `Auth`, `authenticate - Checking if the request ${req.url} is for a public endpoint and from our site...`);
            //---------------------
            // for (const endpoint of PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER) {
            //     console_log(0,`Auth`, `PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER222: ${endpoint} - test : ${endpoint.test(requestUrl!)}`);
            // }
            // for (const endpoint of PUBLIC_ENDPOINTS_FROM_INTERNET) {
            //     console_log(0,`Auth`, `PUBLIC_ENDPOINTS_FROM_INTERNET22: ${endpoint} - test : ${endpoint.test(requestUrl!)}`);
            // }
            //---------------------
            const isPublicForLocal =
                requestUrl !== undefined && PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.length > 0 && PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.some((pattern) => pattern.test(requestUrl));
            const isPublicFromOutside =
                requestUrl !== undefined && PUBLIC_ENDPOINTS_FROM_INTERNET.length > 0 && PUBLIC_ENDPOINTS_FROM_INTERNET.some((pattern) => pattern.test(requestUrl));
            //---------------------
            // const isRefererOurSite =
            //     referer !== undefined &&
            //     referer.startsWith(process.env.NEXT_PUBLIC_REACT_SERVER_URL!) &&
            //     req.headers['x-forwarded-host'] === process.env.NEXT_PUBLIC_REACT_SERVER_URL!;
            //---------------------
            // console_log(0, `Auth`, ` requestUrl !== undefined ${ requestUrl !== undefined} - PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.length > 0 ${PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.length > 0} - PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.some((pattern) => pattern.test(requestUrl)) ${PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.some((pattern) => pattern.test(requestUrl!))}`);
            // console_log(0, `Auth`, ` requestUrl !== undefined ${ requestUrl !== undefined} - PUBLIC_ENDPOINTS_FROM_INTERNET.length > 0 ${PUBLIC_ENDPOINTS_FROM_INTERNET.length > 0} - PUBLIC_ENDPOINTS_FROM_INTERNET.some((pattern) => pattern.test(requestUrl)) ${PUBLIC_ENDPOINTS_FROM_INTERNET.some((pattern) => pattern.test(requestUrl!))}`);
            //---------------------
            if (isPublicFromOutside) {
                console_log(-1, `Auth`, `authenticate - Api is Public from Internet - No authentication needed`);
                return;
            } else if (isPublicForLocal) {
                //---------------------
                const challengueToken = req.headers['x-challengue-token'] as string;
                //---------------------
                const isValidChallengue = await isValidChallengueToken(challengueToken);
                const isValidCsrf = isValidCsrfToken(req);
                //---------------------
                if (isValidChallengue && isValidCsrf) {
                    console_log(-1, `Auth`, `authenticate - Api is Public For Local and ChallengueToken is valid: ${isValidChallengue} and CsrfToken is valid: ${isValidCsrf}`);
                    return;
                } else {
                    console_error(
                        -1,
                        `Auth`,
                        `authenticate - Api is Public For Local: ${isPublicForLocal} but ChallengueToken is not valid: ${isValidChallengue} or CsrfToken is not valid: ${isValidCsrf}`
                    );
                    error_ = (isNullOrBlank(error_) ? '' : error_ + ' and ') + 'Api is Public For Local but ChallengueToken is not valid or CsrfToken is not valid';
                    throw `${error_}`;
                }
            } else {
                console_error(
                    -1,
                    `Auth`,
                    `authenticate - Api is not Public from Internet: ${isPublicFromOutside} nor is Public For Local: ${isPublicForLocal} - Authentication needed`
                );
                error_ = (isNullOrBlank(error_) ? '' : error_ + ' and ') + 'Api is not Public - Authentication needed';
                throw `${error_}`;
            }
        } else {
            console_log(0, `Auth`, `authenticate - User authenticated - User: ${showData(user)}`);
            console_log(-1, `Auth`, `authenticate - OK`);
        }
        //---------------------
        return;
    };

    //----------------------------------------------------------------------

    public static async validateJWTTokenWithCredentials(token: string): Promise<User> {
        try {
            //-------------------------
            console_log(1, `Auth`, `validateJWTTokenWithCredentials - Init`);
            //-------------------------
            if (isNullOrBlank(token)) {
                throw `Missing JWT Token`;
            }
            //-------------------------
            let jwtPayload: TokenJWTPayload = await validateChallengueToken(token);
            //--------------------------------------
            // console_log(0, `Auth`, `validateJWTTokenWithCredentials - ${showData({ jwtPayload }, false)}`);
            //--------------------------------------
            const credentials = jwtPayload.credentials;
            //-------------------------
            if (credentials === undefined) {
                throw `JWT Token Invalid`;
            }
            //-------------------------
            const { paymentPkh, stakePkh } = addressToPaymentPubKeyHashAndStakePubKeyHash(credentials.address);
            //-------------------------
            if (paymentPkh === undefined) {
                throw `Invalid address`;
            }
            //-------------------------
            const WalletBackEndApplied = (await import('../../BackEnd/Wallet.BackEnd.Applied.js')).WalletBackEndApplied;
            //-------------------------
            const isCoreTeam = await WalletBackEndApplied.isCoreTeam(paymentPkh);
            //-------------------------
            const user: User = {
                id: paymentPkh,
                address: credentials?.address,
                pkh: paymentPkh,
                stakePkh: isNullOrBlank(stakePkh) ? undefined : stakePkh,
                walletNameOrSeedOrKey: credentials.walletNameOrSeedOrKey,
                useBlockfrostToSubmit: credentials.useBlockfrostToSubmit === 'true' ? true : false,
                isWalletFromSeed: credentials.isWalletFromSeed === 'true' ? true : false,
                isWalletFromKey: credentials.isWalletFromKey === 'true' ? true : false,
                network: process.env.NEXT_PUBLIC_CARDANO_NET!,
                isCoreTeam,
                isWalletValidatedWithSignedToken: credentials.signedChallengue !== undefined ? true : false,
            };
            //-------------------------
            console_log(-1, `Auth`, `validateJWTTokenWithCredentials - OK`);
            //-------------------------
            return user;
        } catch (error) {
            console_error(-1, `Auth`, ` validateJWTTokenWithCredentials - Error: ${error}`);
            throw `${error}`;
        }
    }

    //----------------------------------------------------------------------

    public static async getSessionUser(req: NextApiRequest): Promise<User | undefined> {
        const token = await getToken({ req });
        const user = token !== null ? (token.user as User) : undefined;
        if (user !== undefined) {
            //-------------------------
            const WalletBackEndApplied = (await import('../../BackEnd/Wallet.BackEnd.Applied.js')).WalletBackEndApplied;
            //-------------------------
            const isCoreTeam = await WalletBackEndApplied.isCoreTeam(user.pkh);
            //-------------------------
            user.isCoreTeam = isCoreTeam;
        }
        return user;
    }

    // #endregion generic methods
    // #region api handlers

    // public static async getJWTTokenWithCredentialsApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    //     return await initApiRequestWithContext(0, `Auth`, req, res, this.getJWTTokenWithCredentialsApiHandlerWithContext.bind(this));
    // }

    public static async getJWTTokenWithCredentialsApiHandlerWithContext(req: NextApiRequest, res: NextApiResponse) {
        //--------------------------------------
        // await initGlobals(req, res);
        //--------------------------------------
        if (req.method === 'POST') {
            console_log(1, `Auth`, `JWT Token - POST - Init`);
            console_log(0, `Auth`, `JWT Token - query: ${showData(req.query, false)}`);
            console_log(0, `Auth`, `JWT Token - body: ${showData(req.body, false)}`);
            try {
                //-------------------------
                await initGlobals();
                //--------------------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    address: yup.string().required().label('Address'),
                    walletNameOrSeedOrKey: yup.string().required().label('Wallet name Or Seed Or Key'),
                    useBlockfrostToSubmit: yup.string().required().label('useBlockfrostToSubmit'),
                    isWalletFromSeed: yup.string().required().label('isWalletFromSeed'),
                    isWalletFromKey: yup.string().required().label('isWalletFromKey'),
                    challengue: yup.string().required().label('Challengue'),
                    signedChallengue: yup.string().label('Signed Challengue'),
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, `Auth`, ` JWT Token - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const credentials: CredentialsAuthenticated = { ...validatedBody };
                //-------------------------
                if (globalLucid.lucid === undefined) {
                    throw `globalLucid lucid not found`;
                }
                const lucid = globalLucid.lucid;
                //-------------------------
                const { paymentPkh, stakePkh } = addressToPaymentPubKeyHashAndStakePubKeyHash(credentials.address);
                //-------------------------
                if (paymentPkh === undefined) {
                    throw `Invalid address`;
                }
                //-------------------------
                const secret = process.env.LOGIN_JWT_SECRET_KEY!;
                //-------------------------
                let jwtPayloadChallengue: ChallengueJWTPayload;
                try {
                    jwtPayloadChallengue = verify(credentials.challengue, secret) as ChallengueJWTPayload;
                } catch (error) {
                    throw `Token verification failed`;
                }
                //-------------------------
                const siteSecret = jwtPayloadChallengue.siteSecret;
                const timestamp = jwtPayloadChallengue.timestamp;
                const exp = jwtPayloadChallengue.exp;
                //-------------------------
                if (siteSecret === undefined || siteSecret !== globalSettings.siteSettings!.siteSecret || timestamp === undefined || exp === undefined) {
                    throw `Challengue Token Invalid`;
                }
                //--------------------------------------
                const TimeBackEnd = (await import('../../lib/Time/Time.BackEnd.js')).TimeBackEnd;
                //-------------------------
                const serverTime = await TimeBackEnd.getServerTime(false);
                //------------------------------------
                if (serverTime > timestamp + VALID_SESSION_DURATION_MS || serverTime > exp * 1000) {
                    throw `Challengue Token Expired`;
                }
                //-------------------------
                let signedChallengue: SignedMessage | undefined;
                //-------------------------
                try {
                    signedChallengue = credentials.signedChallengue === undefined ? undefined : JSON.parse(credentials.signedChallengue);
                } catch (error) {
                    throw `Invalid signedChallengue`;
                }
                //-------------------------
                if (signedChallengue !== undefined) {
                    const isValidSignature = lucid.verifyMessage(credentials.address, strToHex(credentials.challengue), signedChallengue);
                    if (!isValidSignature) {
                        throw `Invalid signature`;
                    }
                }
                //--------------------------------------
                // Create JWT token
                const jwtPayload: TokenJWTPayload = {
                    siteSecret: globalSettings.siteSettings!.siteSecret,
                    timestamp: serverTime,
                    credentials,
                };
                const token = sign(jwtPayload, secret, { expiresIn: VALID_SESSION_DURATION_STR });
                //-------------------------
                console_log(-1, `Auth`, `JWT Token - GET - OK`);
                //-------------------------
                // Send token back to client
                return res.status(200).json({ token });
            } catch (error) {
                console_error(-1, `Auth`, ` JWT Token - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while generating JWT Token: ${error}` });
            }
        } else {
            console_error(-1, `Auth`, ` JWT Token - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // public static async getChallengueTokenApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
    //     return await initApiRequestWithContext(0, `Auth`, req, res, this.getChallengueTokenApiHandlerWithContext.bind(this));
    // }

    public static async getChallengueTokenApiHandlerWithContext(req: NextApiRequest, res: NextApiResponse) {
        //--------------------------------------
        if (req.method === 'GET') {
            console_log(1, `Auth`, `Challengue Token - GET - Init`);
            console_log(0, `Auth`, `Challengue Token - query: ${showData(req.query)}`);
            try {
                //-------------------------

                const token = await generateChallengueToken();
                //-------------------------
                console_log(-1, `Auth`, `Challengue Token - GET - OK`);
                //-------------------------
                // Send token back to client
                return res.status(200).json({ token });
            } catch (error) {
                console_error(-1, `Auth`, ` Challengue Token - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while generating Challengue Token: ${error}` });
            }
        } else {
            console_error(-1, `Auth`, ` Challengue Token - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers
}
