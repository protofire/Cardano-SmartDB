import NextAuth, { NextAuthOptions, User } from 'next-auth';
// import Auth0Provider from "next-auth/providers/auth0"
// import FacebookProvider from "next-auth/providers/facebook"
// import GithubProvider from "next-auth/providers/github"
// import GoogleProvider from "next-auth/providers/google"
// import TwitterProvider from "next-auth/providers/twitter"
// import EmailProvider from "next-auth/providers/email"
// import AppleProvider from "next-auth/providers/apple"

import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthBackEnd } from '@/src/lib/SmartDB/lib/Auth/backEnd';
import { v4 } from 'uuid';
import { showData, LucidLUCID_NETWORK_MAINNET_NAME, isNullOrBlank, WalletEntity, WALLET_CREATEDBY_LOGIN, VALID_SESSION_DURATION_SECONDS } from '@/src/lib/SmartDB';
import { WalletBackEndApplied } from '@/src/lib/SmartDB/BackEnd/Wallet.BackEnd.Applied';
import { initAllDecorators, requestContext, getGlobalSettings, getGlobalEmulator, getGlobalLucid, TimeBackEnd } from '@/src/lib/SmartDB/backEnd';
initAllDecorators();

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

export const authOptions: NextAuthOptions = {
    // https://next-auth.js.org/configuration/providers
    providers: [
        CredentialsProvider({
            // The name to display on the sign in form (e.g. "Sign in with...")
            name: 'Credentials',
            // The credentials is used to generate a suitable form on the sign in page.
            // You can specify whatever fields you are expecting to be submitted.
            // e.g. domain, username, password, 2FA token, etc.
            // You can pass any HTML attribute to the <input> tag through the object.
            credentials: {
                token: { label: 'token', type: 'text', placeholder: '' },
            },

            async authorize(credentials, req): Promise<User | null> {
                // console.log(`/api/auth/[...nextauth].ts - authorize - user: ${log(req)}`)
                return new Promise((resolve, reject) => {
                    requestContext.run(async () => {
                        //--------------------------------------
                        // TODO: esta es la unica api handler que no usa el helper initApiRequestWithContext para crear contexto
                        const requestId = v4();
                        //--------------------------------------
                        requestContext.set('requestId', requestId);
                        // Perform any context setup here
                        //--------------------
                        await getGlobalSettings();
                        await getGlobalEmulator(true);
                        await getGlobalLucid();
                        //--------------------------------------
                        await TimeBackEnd.getGlobalBlockchainTime();
                        //--------------------
                        console.log(`[NextAuth] - Authorize - Credentials: ${showData(credentials)} - INIT`);
                        //--------------------
                        // Add logic here to look up the user from the credentials supplied
                        try {
                            //--------------------------------------
                            if (credentials === undefined) {
                                throw `Credentials undefined`;
                            }
                            //--------------------------------------
                            const user = await AuthBackEnd.validateJWTToken(credentials.token);
                            //--------------------------------------
                            // create a user entry in our database
                            const paymentPKH = user.pkh;
                            let testnet_address,
                                mainnet_address = undefined;
                            if (process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME) {
                                mainnet_address = user.address;
                            } else {
                                testnet_address = user.address;
                            }
                            let queryConditions: Record<string, any> = [{ paymentPKH }];
                            if (!isNullOrBlank(testnet_address)) {
                                queryConditions.push({ testnet_address });
                            }
                            if (!isNullOrBlank(mainnet_address)) {
                                queryConditions.push({ mainnet_address });
                            }
                            let queryCondition = { $or: queryConditions };
                            //--------------------
                            const wallet: WalletEntity | undefined = await WalletBackEndApplied.getOneByParams_(queryCondition);
                            //--------------------
                            if (wallet === undefined) {
                                //--------------------
                                console.log(`[NextAuth] - Authorize - Creating Wallet...`);
                                //--------------------
                                const createdAt = new Date();
                                const createdBy = WALLET_CREATEDBY_LOGIN;
                                const lastConnection = createdAt;
                                const walletUsed = user.walletName;
                                //--------------------
                                const stakePKH = user.stakePkh;
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
                                await WalletBackEndApplied.create(wallet);
                            } else {
                                //--------------------
                                console.log(`[NextAuth] - Authorize - Updating Wallet...`);
                                //--------------------
                                wallet.lastConnection = new Date();
                                wallet.walletUsed = user.walletName;
                                wallet.walletValidatedWithSignedToken = user.isWalletValidatedWithSignedToken;
                                //--------------------
                                await WalletBackEndApplied.update(wallet);
                                //--------------------
                            }
                            console.log(`[NextAuth] - Authorize - User: ${showData(user, false)} - OK`);
                            //--------------------
                            resolve(user);
                        } catch (error) {
                            console.error(`[NextAuth] - Authorize - Error: ${error}`);
                            reject(null);
                        }
                    });
                });
            },
        }),

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

export default NextAuth(authOptions);
