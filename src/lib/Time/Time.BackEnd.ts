import { getGlobalBlockchainTime, globalBlockChainTime } from '../../Commons/BackEnd/globalBlockchainTime.js';
import { globalEmulator } from '../../Commons/BackEnd/globalEmulator.js';
import { console_log } from '../../Commons/BackEnd/globalLogs.js';
import { globalLucid } from '../../Commons/BackEnd/globalLucid.js';
import { SYNC_SERVER_TIME_10M_MS, SYNC_SERVER_TIME_2M_MS, VALID_TX_TIME_RANGE, isEmulator } from '../../Commons/Constants/constants.js';
import { convertMillisToTime } from '../../Commons/utils.js';


export class TimeBackEnd {
    //---------------------------------------------------------------

    public static async getServerTime(useBlockChainTime: boolean = true, refresh: boolean = false) {
        // //----------------------------
        // useBlockChainTime = useBlockChainTime || globalSettings.siteSettings?.use_blockchain_time === true;
        //--------------------------------------
        console_log(1, `Time`, `getServerTime - Init - useBlockChainTime: ${useBlockChainTime} - refresh: ${refresh}`);
        //--------------------------------------
        const now = Date.now();
        //----------------------------
        const serverTime = useBlockChainTime ? await getGlobalBlockchainTime(refresh) : now;
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
                    const EmulatorBackEndApplied = (await import('../../BackEnd/Emulator.BackEnd.All.js')).EmulatorBackEndApplied;
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
            //----------------
            const BlockFrostBackEnd = (await import('../../lib/BlockFrost/BlockFrost.BackEnd.js')).BlockFrostBackEnd;
            //----------------
            var slot: number | undefined = await BlockFrostBackEnd.getLatestSlot_Api();
            //----------------
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
