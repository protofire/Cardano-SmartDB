import { convertMillisToTime } from '../../Commons';
import { SYNC_SERVER_TIME_10M_MS, SYNC_SERVER_TIME_2M_MS, VALID_TX_TIME_RANGE, isEmulator } from '@/src/utils/specific/constants';
import { TimeApi } from './Time.FrontEnd';
import { console_log } from '../../Commons/BackEnd/globalLogs';
import { globalTime } from '../../Commons/BackEnd/globalBlockchainTime';
import { globalEmulator } from '../../Commons/BackEnd/globalEmulator';
import { globalLucid } from '../../Commons/BackEnd/globalLucid';

export class TimeBackEnd {
    //---------------------------------------------------------------

    public static async getGlobalBlockchainTime(refresh: boolean = false): Promise<number | undefined> {
        //----------------
        console_log(1, `Time`, `getGlobalBlockchainTime - refresh: ${refresh} - Loaded already: ${globalTime.time !== undefined} - Init`);
        //----------------
        // si paso mas de 10 minutos desde la ultima vez del fetch, pido serverTime from blockchain de nuevo
        // si no, devuelvo el mismo valor plus la diferencia de tiempo
        //----------------
        // este deberia ser el unico lugar donde se pide Date.now() que es la hora del server
        // a partir de aca, se usa el globalTime.time, que es un calculo de la hora del server a partir de la hora de la blockchain
        if (globalTime.time !== undefined && globalTime.lastFetch !== undefined) {
            // si pasaron mas de 10 minutos refresca siempre
            // si pasaron mas de 2 minutos refresca si refresh es true
            // si no, no refresca
            //----------------
            const now = Date.now();
            //----------------
            const diff = now - globalTime.lastFetch;
            const diffSeconds = diff / 1000;
            const diffMinutes = Math.floor(diffSeconds / 60);
            if (diffMinutes > SYNC_SERVER_TIME_10M_MS) {
                refresh = true;
            } else if (refresh === true && diffMinutes > SYNC_SERVER_TIME_2M_MS) {
                refresh = true;
            } else {
                refresh = false;
            }
        }
        //----------------
        if (globalTime.time === undefined || globalTime.diffWithBlochain === undefined || globalTime.lastFetch === undefined || refresh === true) {
            //--------------------------------------
            const blockChainTime = await this.getBlockChainTime();
            //----------------
            const now = Date.now();
            //----------------
            globalTime.time = blockChainTime;
            globalTime.lastFetch = now;
            globalTime.diffWithBlochain = globalTime.time - now;
            //--------------------------------------
        } else {
            //----------------
            const now = Date.now();
            //----------------
            globalTime.time = now + globalTime.diffWithBlochain;
            //--------------------------------------
        }
        //----------------
        console_log(-1, `Time`, `getGlobalBlockchainTime - time: ${globalTime.time}  - time: ${convertMillisToTime(globalTime.time)} - OK`);
        //----------------
        return globalTime.time;
    }

    //---------------------------------------------------------------

    public static async getServerTime(useBlockChainTime: boolean = true, refresh: boolean = false) {
        // //----------------------------
        // useBlockChainTime = useBlockChainTime || globalSettings.siteSettings?.use_blockchain_time === true;
        //--------------------------------------
        console_log(1, `Time`, `getServerTime - Init - useBlockChainTime: ${useBlockChainTime} - refresh: ${refresh}`);
        //--------------------------------------
        const now = Date.now();
        //----------------------------
        const serverTime = useBlockChainTime ? await this.getGlobalBlockchainTime(refresh) : now;
        //----------------------------
        if (serverTime === undefined) {
            throw `serverTime not found`;
        }
        //----------------------------
        console_log(-1, `Time`, `getServerTime - OK - Time: ${now} - ${convertMillisToTime(now)}`);
        //----------------------------
        return now;
    }

    public static async syncEmulatorBlockChainWithServerTime() {
        //--------------------------------------
        if (isEmulator) {
            //--------------------------------------
            // aqui voy a simular el paso del tiempo avanzando slots si es necesario
            // solo lo uso en emulador
            //--------------------------------------
            const now = Date.now();
            //--------------------------------------
            if (globalEmulator.emulatorDB === undefined) {
                throw `globalEmulator emulatorDB not set`;
            }
            //--------------------------------------
            const emulatorSlot = globalEmulator.emulatorDB.emulator.slot;
            const emulatorTime = globalEmulator.emulatorDB.emulator.time;
            //--------------------------------------
            console_log(
                1,
                `Time`,
                `syncEmulatorBlockChainWithServerTime - Init - Old Blockchain Slot: ${emulatorSlot} - Old Blockchain Time: ${convertMillisToTime(emulatorTime)}`
            );
            //--------------------------------------
            if (now > emulatorTime) {
                //--------------------------------------
                const diffSeconds = Math.floor((now - emulatorTime) / 1000);
                //--------------------------------------
                globalEmulator.emulatorDB.emulator.awaitSlot(diffSeconds);
                //--------------------------------------
                if (globalEmulator.emulatorDB.emulator.slot !== emulatorSlot) {
                    //--------------------------------------
                    const EmulatorBackEndApplied = (await import('../../../MayzSmartDB/BackEnd/index.exports')).EmulatorBackEndApplied;
                    await EmulatorBackEndApplied.update(globalEmulator.emulatorDB);
                }
            }
            //--------------------------------------
            console_log(
                -1,
                `Time`,
                `syncEmulatorBlockChainWithServerTime - OK - New Blockchain Slot: ${globalEmulator.emulatorDB.emulator.slot} - New Blockchain Time: ${convertMillisToTime(
                    globalEmulator.emulatorDB.emulator.time
                )} - OK`
            );
            //--------------------------------------
            return { serverTime: globalEmulator.emulatorDB.emulator.time };
        }
        //--------------------------------------
    }

    // public static async syncServerWithBlockChainTime() {
    //     //--------------------------------------
    //     const { lucid, emulatorDB } = await LucidToolsBackEnd.prepareLucidBackEnd();
    //     //--------------------------------------
    //     const now = await this.getBlockChainTime(lucid, emulatorDB);
    //     console_log(0, `Time`, `sync - Blockchain Time: ${now}`);
    //     console_log(0, `Time`, `sync - Old Server Time: ${Date.now()}`);
    //     //--------------------------------------
    //     const date = new Date(now);
    //     //--------------------------------------
    //     const command = `sudo date --set="${date.toISOString()}"`;
    //     console_log(0, `Time`, `sync - command: ${command}`);
    //     try {
    //         const exec = promisify(execCb);
    //         await exec(command);
    //         console_log(0, `Time`, `sync - Time set successfully`);
    //         console_log(0, `Time`, `sync - New Server Time: ${Date.now()}`);
    //     } catch (error) {
    //         console_log(0, `Time`, `sync - An error occurred: ${error}`);
    //         throw `${error} - Executing: ${command}`;
    //     }
    //     return now;
    // }

    public static async getTxTimeRange() {
        const serverTime = await this.getServerTime(true, true);
        return this.getTxTimeRangeFromTime(serverTime);
    }

    public static async getTxTimeRangeFromTime(serverTime: number) {
        const from = serverTime - 1 * 60 * 1000; // - (5 * 60 * 1000) TODO: for safety
        const until = serverTime + VALID_TX_TIME_RANGE + 1 * 60 * 1000; // - (5 * 60 * 1000)
        return { from, until };
    }

    public static async getBlockChainTime() {
        //--------------------------------------
        console_log(1, `Time`, `getBlockChainTime - Init`);
        //--------------------------------------
        let blockchainTime;
        //--------------------------------------
        if (isEmulator) {
            // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
            await this.syncEmulatorBlockChainWithServerTime();
            //----------------
            if (globalEmulator.emulatorDB === undefined) {
                throw `globalEmulator emulatorDB not set`;
            }
            //----------------
            // blockchainTime = globalEmulator.emulatorDB.emulator.now() as number;
            //----------------
            // en emulador lo que hago es usar el tiempo del server para updatear el tiempo del emulador
            // ese proceso lleva unos segundos
            // por eso ahora voy a devolver nuevamente el tiempo del server, por que va a ser mas preciso
            // de todas formas queda actualizado el emulador lo mas parecido posible
            //----------------
            blockchainTime = Date.now();
            //----------------
        } else {
            var slot: number | undefined = await TimeApi.getSlotBlockfrostApi();
            if (slot === undefined) {
                throw `Slot not found`;
            }
            // console.log('slot: ' + slot);
            if (globalLucid.lucid === undefined) {
                throw `globalLucid lucid not set`;
            }
            blockchainTime = globalLucid.lucid.utils.slotToUnixTime(slot); // slot es en segundots
        }
        //--------------------------------------
        console_log(-1, `Time`, `getBlockChainTime: ${blockchainTime} - OK`);
        //--------------------------------------
        return blockchainTime;
    }
}
