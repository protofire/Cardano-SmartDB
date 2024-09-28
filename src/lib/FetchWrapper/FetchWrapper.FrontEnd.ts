import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { delay, isFrontEndEnvironment, toJson } from '../../Commons/utils.js';
import { API_TRY_AGAIN } from '../../Commons/Constants/constants.js';

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
            const fetchResponse: Response = new Response(toJson(response.data), {
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
            let errorInfo: any = {
                attempt: count + 1,
                error: 'Unknown error',
                message: 'Unknown error',
                status: 500,
                status_code: 500,
                statusText: 'Internal Server Error',
            };
            if (axios.isAxiosError(error)) {
                errorInfo = {
                    attempt: count + 1,
                    error: error.response?.data?.error || error.response?.data || error.message || error.response?.statusText || 'Unknown error',
                    message: error.response?.data?.message || error.message || error.response?.statusText || 'Unknown error',
                    status: error.response?.status || 500,
                    status_code: error.response?.data?.satus_code || error.response?.status || 500, 
                    statusText: error.response?.statusText || 'Internal Server Error',
                    config: error.config,
                    code: error.code,
                };
            } else if (error?.code === 'ECONNABORTED') {
                errorInfo = {
                    attempt: count + 1,
                    error: 'Request timed out',
                    message: 'Request timed out',   
                    status: 408,
                    status_code: 408,
                    statusText: 'Request Timeout',
                    code: error.code,
                };
            } else if (error instanceof Error) {
                errorInfo = {
                    attempt: count + 1,
                    error: error.message || 'Unknown error',
                    message: error.message || 'Unknown error',
                    status: 500,
                    status_code: 500,
                    statusText: 'Internal Server Error',
                    name: error.name,
                    stack: error.stack,
                };
            } else {
                // Capturar cualquier otro tipo de error
                errorInfo = {
                    attempt: count + 1,
                    error: error || error.message || error.statusText || 'Unknown error',
                    message: error.message || error.statusText || 'Unknown error',
                    status: error.status || 500,
                    status_code: error.status || 500,
                    statusText: error.statusText || 'Internal Server Error',
                };
            }
            //----------------------
            errors.push(errorInfo);
            //----------------------
            // Retry mechanism
            if (count < retryCount) {
                await delay(API_TRY_AGAIN); // Delay before retrying
                return retry(count + 1);
            }
            //----------------------
            let errorBody: any;
            let responseStatus: number;
            let responseStatusText: string;
            //----------------------
            const uniqueErrors = new Set(errors.map(err => err.status));
            //----------------------
            if (errors.length === 1 || uniqueErrors.size === 1) {
                const singleError = errors[0];
                errorBody = singleError;
                responseStatus = errorBody.status || 500;
                responseStatusText = errorBody.statusText || 'Internal Server Error';
            } else {
                errorBody = {
                    error: 'Multiple errors occurred',
                    details: errors
                };
                responseStatus = 500;
                responseStatusText = 'Internal Server Error';
            }
            //----------------------
            const errorResponse = new Response(toJson(errorBody), {
                status: responseStatus,
                statusText: responseStatusText,
                headers: new Headers({ 'Content-Type': 'application/json' }),
            });
            //----------------------
            return errorResponse;
        }
    };
    //----------------------
    return retry(0);
}

export default fetchWrapper;
