import fetchWrapper from '../../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
import { convertMillisToTime } from '../../Commons/index.js';

export class TimeApi {
    public static async getServerTimeApi(): Promise<number> {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/time/get';
            const requestOptions = {
                method: 'GET',
            };
            //----------------------------
            const response = await fetchWrapper(urlApi, requestOptions);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.serverTime) {
                    throw `Invalid response format: Server Time not found`;
                }
                console.log(`[Time] - getServerTimeApi - Server Time: ${data.serverTime} - ${convertMillisToTime(data.serverTime)} - response OK`);
                return data.serverTime;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------------------------
        } catch (error) {
            console.log(`[Time] - getServerTimeApi - Error: ${error}`);
            throw ` ${error}`;
        }
    }

    public static async syncEmulatorBlockChainWithServerTimeApi() {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/time/sync-emulator-blockchain-time';
            const requestOptions = {
                method: 'GET',
            };
            //----------------------------
            const response = await fetchWrapper(urlApi, requestOptions);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.serverTime) {
                    throw `Invalid response format: Server Time not found`;
                }
                console.log(`[Time] - syncBlockChainWithServerTimeApi - Server Time: ${data.serverTime} - response OK`);
                return data.serverTime;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------------------------
        } catch (error) {
            console.log(`[Time] - syncBlockChainWithServerTimeApi - Error: ${error}`);
            throw ` ${error}`;
        }
    }
}
