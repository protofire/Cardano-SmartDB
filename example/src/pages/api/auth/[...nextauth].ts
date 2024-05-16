import NextAuth, { NextAuthOptions, User } from 'next-auth';
import { initAllDecoratorsExample } from '@example/src/lib/DummyExample/backEnd';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
    AuthBackEnd,
    LucidLUCID_NETWORK_MAINNET_NAME,
    WALLET_CREATEDBY_LOGIN,
    WalletBackEndApplied,
    WalletEntity,
    authOptionsBase,
    console_error,
    console_log,
    credentialProviderConfig,
    flushLogs,
    getGlobalBlockchainTime,
    getGlobalEmulator,
    getGlobalLucid,
    getGlobalSettings,
    isNullOrBlank,
    requestContext,
    showData
} from 'smart-db/backEnd';
import { v4 } from 'uuid';
initAllDecoratorsExample();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *   schemas:
 *     WalletSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The wallet's public key hash
 *         pkh:
 *           type: string
 *           description: Public key hash
 *         walletName:
 *           type: string
 *           description: Name of the wallet
 *         useBlockfrostToSubmit:
 *           type: boolean
 *           description: Whether to use Blockfrost for submission or not
 *         isWalletFromSeedOrKey:
 *           type: boolean
 *           description: Is the wallet from seed
 * /api/auth:
 *   post:
 *     summary: Authenticate a wallet using custom credentials
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pkh
 *               - walletName
 *             properties:
 *               pkh:
 *                 type: string
 *                 description: Public Key Hash of the wallet
 *               walletName:
 *                 type: string
 *                 description: Wallet name
 *               useBlockfrostToSubmit:
 *                 type: boolean
 *                 description: Should use Blockfrost to submit
 *               isWalletFromSeedOrKey:
 *                 type: boolean
 *                 description: Is wallet from seed
 *     responses:
 *       200:
 *         description: The wallet was successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletSession'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad Request
 */

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options


export const credentialProviderConfig2 = {
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
                const requestId = v4();
                //--------------------------------------
                requestContext.set('requestId', requestId);
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
                    const TimeBackEnd = (await import('smart-db/backEnd')).TimeBackEnd;
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

export const authOptions: NextAuthOptions = {
    ...authOptionsBase,
    providers: [CredentialsProvider(credentialProviderConfig2)],
};

export default NextAuth(authOptions);
