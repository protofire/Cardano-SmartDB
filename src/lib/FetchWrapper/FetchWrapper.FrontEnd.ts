import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { isFrontEndEnvironment } from '../../Commons/utils.js';

export const fetchWrapper = async (url: string, options: RequestInit = {}, swAddChallengue: boolean = true, retryCount: number = 0, timeout: number = 0): Promise<Response> => {
    //----------------------
    if (isFrontEndEnvironment() === false) {
        throw `fetchWrapper - Only use FronEnd environment`;
    }
    //----------------------
    const headers = new Headers(options.headers);
    //----------------------
    if (swAddChallengue === true) {
        //----------------------
        const challengueToken = localStorage.getItem('challengueToken');
        //----------------------
        if (challengueToken) {
            headers.append('x-challengue-token', challengueToken);
        }
        //----------------------
    }
    //----------------------
    const csrfToken = localStorage.getItem('x-csrf-token');
    if (csrfToken) {
        headers.append('x-csrf-token', csrfToken);
    }
    //----------------------
    return createApiRequest(url, options, headers, timeout, retryCount);
    //----------------------
};

export function createApiRequest(url: string, options: RequestInit, headers: Headers, timeout: number, retryCount: number) {
    //----------------------
    const axiosOptions: AxiosRequestConfig = {
        url,
        method: options.method as string,
        baseURL: process.env.NEXT_PUBLIC_REACT_SERVER_URL,
        headers: Object.fromEntries(headers), // Converts Headers object back to a plain object
        data: options.body,
        withCredentials: true,
        timeout: timeout > 0 ? timeout : undefined,
    };
    //----------------------
    const errors: any[] = []; // Array to store errors from each retry attempt
    //----------------------
    const retry = async (count: number): Promise<Response> => {
        try {
            //----------------------
            const response: AxiosResponse<any, any> = await axios(axiosOptions);
            //----------------------
            const fetchResponse: Response = new Response(JSON.stringify(response.data), {
                status: response.status,
                statusText: response.statusText,
                headers: new Headers(
                    Object.entries(response.headers)
                        .filter(([_, value]) => value !== undefined)
                        .map(([key, value]) => [key, value] as [string, string]) // Ensuring tuple type
                ),
            });
            //----------------------
            return fetchResponse;
            //----------------------
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const message =
                    error.response?.data?.error?.message !== undefined
                        ? error.response?.data?.error?.message
                        : error.response?.data?.error !== undefined
                        ? error.response?.data?.error
                        : error.message !== undefined
                        ? error.message
                        : 'Unknown error';
                errors.push({ attempt: count + 1, error: message });
            } else {
                const message = error.message !== undefined ? error.message : 'Unknown error';
                errors.push({ attempt: count + 1, error: message });
            }
            if (count < retryCount) {
                return retry(count + 1);
            }
            const errorMessageResponse =
                errors.length === 1 ? 'Request failed: ' + errors[0].error : 'All retries failed. ' + errors.map((err) => `Attempt ${err.attempt}: ${err.error}`).join(', ');
            const errorResponse = new Response(
                JSON.stringify({
                    error: {
                        message: errorMessageResponse,
                    },
                }),
                {
                    status: 500,
                    statusText: 'Internal Server Error',
                    headers: new Headers({ 'Content-Type': 'application/json' }),
                }
            );
            return errorResponse;
        }
    };
    //----------------------
    return retry(0);
}

export default fetchWrapper;
