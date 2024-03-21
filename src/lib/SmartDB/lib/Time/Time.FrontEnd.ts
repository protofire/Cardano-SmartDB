import { convertMillisToTime } from '../../Commons';

export class TimeApi {
    public static async getServerTimeApi(): Promise<number>{
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/time/get';
            const requestOptions = {
                method: 'GET',
            };
            //----------------------------
            const response = await fetch(urlApi, requestOptions);
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
            const response = await fetch(urlApi, requestOptions);
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

    // public static async syncServerWithBlockChainTimeApi() {
    //     try {
    //         //----------------------------
    //         const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/time/sync-server-time';
    //         const requestOptions = {
    //             method: 'GET',
    //         };
    //         //----------------------------
    //         const response = await fetch(urlApi, requestOptions);
    //         //----------------------------
    //         if (response.status === 200) {
    //             const data = await response.json();
    //             if (!data.serverTime) {
    //                 throw `Invalid response format: Server Time not found`;
    //             }
    //             console.log(`[Time] - syncServerWithBlockChainTimeApi - Server Time: ${data.serverTime} - response OK`);
    //             return data.serverTime;
    //         } else {
    //             const errorData = await response.json();
    //             //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
    //             throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
    //         }
    //         //----------------------------
    //     } catch (error) {
    //         console.log(`[Time] - syncServerWithBlockChainTimeApi - Error: ${error}`);
    //         throw ` ${error}`;
    //     }
    // }

    public static async getTxCountBlockfrostApi(scriptAddress: string) {
        try {
            //----------------------------
            const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost' + '/addresses/' + scriptAddress + '/total';
            const requestOptions = {
                method: 'GET',
                headers: {
                    project_id: 'xxxxx',
                },
            };
            //----------------------------
            const response = await fetch(urlApi, requestOptions);
            //----------------------------
            if (response.status === 200) {
                const data = await response.json();
                if (!data.tx_count) {
                    throw `Invalid response format: tx_count not found`;
                }
                console.log(`[Time] - getTxCountBlockfrostApi - tx_count: ${data.tx_count} - response OK`);
                return data.tx_count;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //----------------------------
        } catch (error) {
            console.log(`[Time] - getTxCountBlockfrostApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getSlotBlockfrostApi(): Promise<number | undefined> {
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
            try {
                //----------------------------
                const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost' + '/blocks/latest';
                const requestOptions = {
                    method: 'GET',
                    headers: {
                        project_id: 'xxxxx',
                    },
                };
                //----------------------------
                const response = await fetch(urlApi, requestOptions);
                //----------------------------
                if (response.status === 200) {
                    const data = await response.json();
                    if (!data.slot) {
                        throw `Invalid response format: slot not found`;
                    }
                    console.log(`[Time] - getSlotBlockfrostApi - slot: ${data.slot} - response OK`);
                    return Number(data.slot);
                } else {
                    const errorData = await response.json();
                    //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                }
            } catch (error) {
                attempts++;
                console.log(`[Time] - getSlotBlockfrostApi - Try ${attempts}/${maxAttempts} - Error: ${error}`);
                if (attempts >= maxAttempts) {
                    console.log(`[Time] - getSlotBlockfrostApi - Error: ${error}`);
                    throw `${error}`;
                }
            }
        }
    }
}
