import { isFrontEndEnvironment } from '../../Commons/utils.js';
import { generateChallengueToken, generateCsrfToken } from '../Auth/Auth.utils.js';
import { createApiRequest } from './FetchWrapper.FrontEnd.js';

export const fetchWrapperBackEnd = async (
    url: string,
    options: RequestInit = {},
    swAddChallengue: boolean = true,
    retryCount: number = 0,
    timeout: number = 0
): Promise<Response> => {
    //----------------------
    if (isFrontEndEnvironment()) {
        throw `Can't run this method in the Browser`;
    }
    //----------------------
    const headers = new Headers(options.headers);
    //----------------------
    if (swAddChallengue === true) {
        //----------------------
        const challengueToken = await generateChallengueToken();
        //----------------------
        if (challengueToken) {
            headers.append('x-challengue-token', challengueToken);
        }
        //----------------------
    }
    //-----------------------
    const csrfToken = generateCsrfToken();
    if (csrfToken) {
        headers.append('x-csrf-token', csrfToken);
        headers.append('Cookie', `x-csrf-token=${csrfToken}; Path=/; HttpOnly; SameSite=Strict`);
    }
    //----------------------
    return createApiRequest(url, options, headers, timeout, retryCount);
    //----------------------
};

export default fetchWrapperBackEnd;
