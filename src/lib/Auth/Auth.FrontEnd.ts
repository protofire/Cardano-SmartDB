import { Lucid, LucidEvolution, SignedMessage } from '@lucid-evolution/lucid';
import fetchWrapper from '../../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
import { strToHex, toJson } from '../../Commons/index.js';
import { yup } from '../../Commons/yupLocale.js';
import { Credentials, CredentialsAuthenticated } from './types.js';

export class AuthApi {
    // #region generic methods
    // #endregion generic methods

    // #region api

    public static async generateAuthTokensApi(lucid: LucidEvolution, credentials: Credentials, createSignedSession: Boolean): Promise<string> {
        try {
            //-------------------------
            console.log(`[Auth] - generateAuthToken - Init`);
            //-------------------------
            if (credentials === undefined) {
                throw `Missing credentials`;
            }
            //-------------------------
            const schemaBody = yup.object().shape({
                address: yup.string().required().label('Address'),
                walletName: yup.string().required().label('Wallet name'),
                walletSeed: yup.string().label('Wallet seed'),
                walletKey: yup.string().label('Wallet key'),
                useBlockfrostToSubmit: yup.string().required().label('useBlockfrostToSubmit'),
                isWalletFromSeed: yup.string().required().label('isWalletFromSeed'),
                isWalletFromKey: yup.string().required().label('isWalletFromKey'),
            });
            //-------------------------
            let validatedCredentials: Credentials;
            try {
                validatedCredentials = await schemaBody.validate(credentials);
            } catch (error) {
                throw error;
            }
            //----------------------------
            console.log(`[Auth] - generateAuthToken - Getting Challengue Token`);
            const challengue = await this.getChallengueTokenApi();
            if (challengue === undefined) {
                throw `Can't get Challengue Token`;
            }
            //----------------------------
            let signedChallengue: SignedMessage | undefined = undefined;
            if (createSignedSession === true) {
                signedChallengue = await lucid.wallet().signMessage(validatedCredentials.address, strToHex(challengue));
            }
            //----------------------------
            const credentialAuthenticated: CredentialsAuthenticated = {
                address: credentials.address,
                walletName: credentials.walletName,
                walletSeed: credentials.walletSeed,
                walletKey: credentials.walletKey,
                useBlockfrostToSubmit: credentials.useBlockfrostToSubmit,
                isWalletFromSeed: credentials.isWalletFromSeed,
                isWalletFromKey: credentials.isWalletFromKey,
                challengue,
                signedChallengue: signedChallengue === undefined ? undefined : toJson(signedChallengue),
            };
            //----------------------------
            console.log(`[Auth] - generateAuthToken - Getting JWT Token`);
            const token = await this.getJWTTokenWithCredentialsApi(credentialAuthenticated);
            if (token === undefined) {
                throw `Can't get JWT Token`;
            }
            //----------------------------
            return token;
        } catch (error) {
            console.log(`[Auth] - generateAuthToken - Error: ${error}`);
            throw error;
        }
    }

    public static async getJWTTokenWithCredentialsApi(credentials: CredentialsAuthenticated): Promise<string> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/smart-db-auth/get-token';
            const requestOptions = {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: toJson(credentials),
            };
            //----------------------------
            const response = await fetchWrapper(urlApi, requestOptions);
            //----------------------------
            if (response.status === 200) {
                const datas = await response.json();
                if (!datas.token) {
                    throw `Invalid response format: JWT Token not found`;
                }
                //console.log(`[Auth] - getJWTTokenApi - JWT Token: ${datas.token} - response OK`);
                return datas.token;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------------------------
        } catch (error) {
            console.log(`[Auth] - getJWTTokenApi - Error: ${error}`);
            throw error;
        }
    }

    public static async getChallengueTokenApi(): Promise<string> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/smart-db-auth/get-challengue';
            const requestOptions = {
                method: 'GET',
            };
            //----------------------------
            const response = await fetchWrapper(urlApi, requestOptions, false);
            //----------------------------
            if (response.status === 200) {
                const datas = await response.json();
                if (!datas.token) {
                    throw `Invalid response format: Challengue Token not found`;
                }
                // console.log(`[Auth] - getChallengueTokenApi - Challengue Token: ${datas.token} - response OK`);
                return datas.token;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------------------------
        } catch (error) {
            console.log(`[Auth] - getChallengueTokenApi - Error: ${error}`);
            throw ` ${error}`;
        }
    }

    // #endregion api
}
