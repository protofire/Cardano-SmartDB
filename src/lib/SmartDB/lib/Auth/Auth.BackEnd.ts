import { LucidToolsBackEnd } from '@/src/lib/SmartDB/lib/Lucid/backEnd';
import { SiteSettingsEntity } from '@/src/lib/MayzSmartDB/Entities/index.exports';
import { PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER, PUBLIC_ENDPOINTS_FROM_INTERNET, VALID_SESSION_DURATION_MS, VALID_SESSION_DURATION_STR } from '@/src/utils/specific/constants';
import { isNullOrBlank, showData, sanitizeForDatabase, strToHex } from '@/src/utils/commons/utils';
import yup from '@/src/utils/commons/yupLocale';
import Cors from 'cors';
import { sign, verify } from 'jsonwebtoken';
import { SignedMessage } from 'lucid-cardano';
import { NextApiRequest, NextApiResponse } from 'next';
import { User } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { ChallengueJWTPayload, CredentialsAuthenticated, NextApiRequestAuthenticated, TokenJWTPayload } from './types';
import { TimeBackEnd } from '../Time/Time.BackEnd';
import {
    addressToPaymentPubKeyHashAndStakePubKeyHash,
    console_error,
    console_log,
    globalLucid,
    globalSettings,
    initApiRequestWithContext,
    initGlobals,
} from '../../Commons/index.BackEnd';

type MiddlewareFunction = (req: NextApiRequestAuthenticated, res: NextApiResponse, next: (result: any) => void) => void;

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
                user = await this.validateJWTToken(token);
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

        if (user === undefined) {
            console_log(0, `Auth`, `authenticate - Checking if the request is for a public endpoint and from our site...`);
            //---------------------
            const requestUrl = req.url;
            const referer = req.headers.referer;
            //---------------------
            const isPublicForLocal =
                requestUrl !== undefined && PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.length > 0 && PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.some((pattern) => pattern.test(requestUrl));
            const isPublicFromOutside =
                requestUrl !== undefined && PUBLIC_ENDPOINTS_FROM_INTERNET.length > 0 && PUBLIC_ENDPOINTS_FROM_INTERNET.some((pattern) => pattern.test(requestUrl));
            const isRefererOurSite = referer !== undefined && referer.startsWith(process.env.NEXT_PUBLIC_REACT_SERVER_URL!);
            //---------------------
            if (isPublicFromOutside) {
                console_log(-1, `Auth`, `authenticate - Api is public from Internet - No authentication needed`);
                return;
            } else {
                if (isPublicForLocal && isRefererOurSite) {
                    console_log(-1, `Auth`, `authenticate - Api is public for localhsot and referer is our site - No authentication needed`);
                    return;
                } else {
                    console_error(
                        -1,
                        `Auth`,
                        `authenticate - Api is not isPublicFromOutside: ${isPublicFromOutside} nor is isPublicForLocal: ${isPublicForLocal} and referer is not our site: ${isRefererOurSite} - requestUrl: ${requestUrl} - referer: ${referer}`
                    );
                    error_ = (isNullOrBlank(error_) ? '' : error_ + ' and ') + 'Api is not public or referer is not our site';
                    throw `${error_}`;
                }
            }
        } else {
            //---------------------
            req.user = user;
            //---------------------
            if (user.isWalletValidatedWithSignedToken === false) {
                // REVIEW: por ahora estoy haciendo el mismo chequeo que cuando el usuario no esta logueado...., no se si hace falta dar algun acceso especial a los logueados pero sin firmar
                //---------------------
                console_log(0, `Auth`, `authenticate - Found user but is not fully validated with signed message`);
                const requestUrl = req.url;
                const referer = req.headers.referer;
                //---------------------
                const isPublicForLocal =
                    requestUrl !== undefined && PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.length > 0 && PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER.some((pattern) => pattern.test(requestUrl));
                const isPublicFromOutside =
                    requestUrl !== undefined && PUBLIC_ENDPOINTS_FROM_INTERNET.length > 0 && PUBLIC_ENDPOINTS_FROM_INTERNET.some((pattern) => pattern.test(requestUrl));
                const isRefererOurSite = referer !== undefined && referer.startsWith(process.env.NEXT_PUBLIC_REACT_SERVER_URL!);
                //---------------------
                if (isPublicFromOutside) {
                    console_log(-1, `Auth`, `authenticate - Api is public from Internet - No authentication needed`);
                    return;
                } else {
                    if (isPublicForLocal && isRefererOurSite) {
                        console_log(-1, `Auth`, `authenticate - Api is public for localhsot and referer is our site - No authentication needed`);
                        return;
                    } else {
                        console_error(
                            -1,
                            `Auth`,
                            `authenticate - Api is not isPublicFromOutside: ${isPublicFromOutside} nor is isPublicForLocal: ${isPublicForLocal} and referer is not our site: ${isRefererOurSite} - requestUrl: ${requestUrl} - referer: ${referer}`
                        );
                        error_ = (isNullOrBlank(error_) ? '' : error_ + ' and ') + 'Api is not public or referer is not our site';
                        throw `${error_}`;
                    }
                }
            } else {
                console_log(0, `Auth`, `authenticate - User authenticated - User: ${showData(user)}`);
                console_log(-1, `Auth`, `authenticate - OK`);
            }
        }
        //---------------------
        return;
    };

    //----------------------------------------------------------------------

    public static async validateJWTToken(token: string): Promise<User> {
        try {
            //-------------------------
            console_log(1, `Auth`, `validateJWTToken - Init`);
            //-------------------------
            if (isNullOrBlank(token)) {
                throw `Missing JWT Token`;
            }
            //-------------------------
            const secret = process.env.LOGIN_JWT_SECRET_KEY!;
            //-------------------------
            let jwtPayload: TokenJWTPayload;
            try {
                jwtPayload = verify(token, secret) as TokenJWTPayload;
            } catch (error) {
                throw `JWT Token verification failed`;
            }
            //--------------------------------------
            // console_log(0, `Auth`, `validateJWTToken - ${showData({ jwtPayload }, false)}`);
            //--------------------------------------
            const siteSecret = jwtPayload.siteSecret;
            const timestamp = jwtPayload.timestamp;
            const exp = jwtPayload.exp;
            //-------------------------
            // using global settings now
            // const SiteSettingsBackEndApplied = (await import('../MayzSmartDB/BackEnd/index.exports')).SiteSettingsBackEndApplied;
            // const siteSettings: SiteSettingsEntity | undefined = await SiteSettingsBackEndApplied.getOneByParams_({ name: 'Init' });
            // if (siteSettings === undefined) {
            //     throw `No Site Settings found`;
            // }
            //-------------------------
            if (siteSecret === undefined || siteSecret !== globalSettings.siteSettings!.siteSecret || timestamp === undefined || exp === undefined) {
                throw `JWT Token Invalid`;
            }
            //--------------------------------------
            const serverTime = await TimeBackEnd.getServerTime();
            //------------------------------------
            if (serverTime > timestamp + VALID_SESSION_DURATION_MS || serverTime > exp * 1000) {
                throw `JWT Token Expired`;
            }
            //-------------------------
            const credentials = jwtPayload.credentials;
            //-------------------------
            const { paymentPkh, stakePkh } = addressToPaymentPubKeyHashAndStakePubKeyHash(credentials.address);
            //-------------------------
            if (paymentPkh === undefined) {
                throw `Invalid address`;
            }
            //-------------------------
            const WalletBackEndApplied = (await import('../../../MayzSmartDB/BackEnd')).WalletBackEndApplied;
            const ProtocolBackEndApplied = (await import('../../../MayzSmartDB/BackEnd')).ProtocolBackEndApplied;
            const FundBackEndApplied = (await import('../../../MayzSmartDB/BackEnd')).FundBackEndApplied;
            //-------------------------
            const isCoreTeam = await WalletBackEndApplied.isCoreTeam(paymentPkh);
            const isProtocolAdmin = await ProtocolBackEndApplied.isAdmin(paymentPkh);
            const isFundAdmin = await FundBackEndApplied.isAdmin(paymentPkh);
            // TODO: calcular si es MAYZ HOLDER
            const isMAYZHolder = true;
            //-------------------------
            const user: User = {
                id: paymentPkh,
                address: credentials?.address,
                pkh: paymentPkh,
                stakePkh: isNullOrBlank(stakePkh) ? undefined : stakePkh,
                walletName: credentials.walletName,
                useBlockfrostToSubmit: credentials.useBlockfrostToSubmit === 'true' ? true : false,
                isWalletFromSeedOrKey: credentials.isWalletFromSeedOrKey === 'true' ? true : false,
                network: process.env.NEXT_PUBLIC_CARDANO_NET!,
                isCoreTeam,
                isProtocolAdmin,
                isFundAdmin,
                isMAYZHolder,
                isWalletValidatedWithSignedToken: credentials.signedChallengue !== undefined ? true : false,
            };
            //-------------------------
            console_log(-1, `Auth`, `validateJWTToken - OK`);
            //-------------------------
            return user;
        } catch (error) {
            console_error(-1, `Auth`, ` validateJWTToken - Error: ${error}`);
            throw `${error}`;
        }
    }

    //----------------------------------------------------------------------

    public static async getSessionUser(req: NextApiRequest): Promise<User | undefined> {
        const token = await getToken({ req });
        const user = token !== null ? (token.user as User) : undefined;
        if (user !== undefined) {
            //-------------------------
            const WalletBackEndApplied = (await import('../../../MayzSmartDB/BackEnd')).WalletBackEndApplied;
            const ProtocolBackEndApplied = (await import('../../../MayzSmartDB/BackEnd')).ProtocolBackEndApplied;
            const FundBackEndApplied = (await import('../../../MayzSmartDB/BackEnd')).FundBackEndApplied;
            //-------------------------
            const isCoreTeam = await WalletBackEndApplied.isCoreTeam(user.pkh);
            const isProtocolAdmin = await ProtocolBackEndApplied.isAdmin(user.pkh);
            const isFundAdmin = await FundBackEndApplied.isAdmin(user.pkh);
            // TODO: calcular si es MAYZ HOLDER
            const isMAYZHolder = true;
            //-------------------------
            user.isCoreTeam = isCoreTeam;
            user.isProtocolAdmin = isProtocolAdmin;
            user.isFundAdmin = isFundAdmin;
            user.isMAYZHolder = isMAYZHolder;
        }
        return user;
    }

    // #endregion generic methods
    // #region api handlers

    public static async getJWTTokenApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        return await initApiRequestWithContext(0, `Auth`, req, res, this.getJWTTokenApiHandlerWithContext.bind(this));
    }

    public static async getJWTTokenApiHandlerWithContext(req: NextApiRequest, res: NextApiResponse) {
        //--------------------------------------
        await initGlobals(req, res);
        //--------------------------------------
        if (req.method === 'POST') {
            console_log(1, `Auth`, `JWT Token - POST - Init`);
            console_log(0, `Auth`, `JWT Token - query: ${showData(req.query, false)}`);
            console_log(0, `Auth`, `JWT Token - body: ${showData(req.body, false)}`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    address: yup.string().required().label('Address'),
                    walletName: yup.string().required().label('Wallet name'),
                    useBlockfrostToSubmit: yup.string().required().label('useBlockfrostToSubmit'),
                    isWalletFromSeedOrKey: yup.string().required().label('isWalletFromSeedOrKey'),
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
                // using global settings now
                // const SiteSettingsBackEndApplied = (await import('../MayzSmartDB/BackEnd/index.exports')).SiteSettingsBackEndApplied;
                // const siteSettings: SiteSettingsEntity | undefined = await SiteSettingsBackEndApplied.getOneByParams_( { name: 'Init' });
                // if (siteSettings === undefined) {
                //     throw `No site settings found`;
                // }
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
                const serverTime = await TimeBackEnd.getServerTime();
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

    public static async getChallengueTokenApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        return await initApiRequestWithContext(0, `Auth`, req, res, this.getChallengueTokenApiHandlerWithContext.bind(this));
    }

    public static async getChallengueTokenApiHandlerWithContext(req: NextApiRequest, res: NextApiResponse) {
        //--------------------------------------
        await initGlobals(req, res);
        //--------------------------------------
        if (req.method === 'GET') {
            console_log(1, `Auth`, `Challengue Token - GET - Init`);
            console_log(0, `Auth`, `Challengue Token - query: ${showData(req.query)}`);
            try {
                //-------------------------
                const secret = process.env.LOGIN_JWT_SECRET_KEY!;
                //-------------------------
                const serverTime = await TimeBackEnd.getServerTime();
                //------------------------------------
                // Create JWT token
                //--------------------------------------
                const jwtPayload: ChallengueJWTPayload = {
                    siteSecret: globalSettings.siteSettings!.siteSecret,
                    timestamp: serverTime,
                };
                const token = sign(jwtPayload, secret, { expiresIn: VALID_SESSION_DURATION_STR });
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
