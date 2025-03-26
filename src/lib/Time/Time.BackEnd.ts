import { LucidEvolution, slotToUnixTime } from '@lucid-evolution/lucid';
import { getGlobalBlockchainTime } from '../../Commons/BackEnd/globalBlockchainTime.js';
import { globalEmulator } from '../../Commons/BackEnd/globalEmulator.js';
import { console_log } from '../../Commons/BackEnd/globalLogs.js';
import { globalLucid } from '../../Commons/BackEnd/globalLucid.js';
import { VALID_TX_TIME_RANGE_MS, VALID_TX_TIME_BEFORE_MS, isEmulator } from '../../Commons/Constants/constants.js';
import { convertMillisToTime } from '../../Commons/utils.js';
import { calculateEpochFromSlot } from '../../Commons/helpers.js';

export class TimeBackEnd {
    //---------------------------------------------------------------

    public static async getServerTime(useBlockChainTime: boolean = true, refresh: boolean = false) {
        // //----------------------------
        // useBlockChainTime = useBlockChainTime || globalSettings.siteSettings?.use_blockchain_time === true;
        //--------------------------------------
        console_log(1, `Time`, `getServerTime - Init - useBlockChainTime: ${useBlockChainTime} - refresh: ${refresh}`);
        //--------------------------------------
        const serverTime = useBlockChainTime ? await getGlobalBlockchainTime(refresh) : Date.now();
        //----------------------------
        if (serverTime === undefined) {
            throw `serverTime not found`;
        }
        //----------------------------
        console_log(-1, `Time`, `getServerTime - OK - Time: ${serverTime} - ${convertMillisToTime(serverTime)}`);
        //----------------------------
        return serverTime;
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
        const from = serverTime - VALID_TX_TIME_BEFORE_MS; // - (5 * 60 * 1000) TODO: for safety
        const until = serverTime + Math.round(VALID_TX_TIME_RANGE_MS) - VALID_TX_TIME_BEFORE_MS; // - (5 * 60 * 1000)
        return { from, until };
    }

    public static async getBlockChainTime() {
        //--------------------------------------
        console_log(1, `Time`, `getBlockChainTime - Init`);
        //--------------------------------------
        let blockChainTime, blockChainTimeEmulator, slot;
        //--------------------------------------
        if (isEmulator) {
            // NOTE: movi esto a cuando se llama a getGlobalBlockchainTime... que sucede siempre al calcular rangos de tx
            // es que getGlobalBlockchainTime llma a a este evento, pero no siempre, a veces calcula el tiempo con diff
            // // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
            // await this.syncEmulatorBlockChainWithServerTime();
            //----------------
            if (globalEmulator.emulatorDB === undefined) {
                throw `globalEmulator emulatorDB not set`;
            }
            slot = globalEmulator.emulatorDB.emulator.slot;
            //----------------
            blockChainTimeEmulator = globalEmulator.emulatorDB.emulator.now() as number;
            //----------------
            // NOTE: en emulador lo que hago es usar el tiempo del server para updatear el tiempo del emulador
            // ese proceso lleva unos segundos
            // por eso ahora voy a devolver nuevamente el tiempo del server, por que va a ser mas preciso
            // de todas formas queda actualizado el emulador lo mas parecido posible
            //----------------
            blockChainTime = Date.now();
            //----------------
            console_log(
                -1,
                `Time`,
                `getBlockChainTime: ${convertMillisToTime(blockChainTime)} - blockchainTimeEmulator: ${convertMillisToTime(blockChainTimeEmulator)} - slot: ${slot} - OK`
            );
        } else {
            //----------------
            const BlockFrostBackEnd = (await import('../../lib/BlockFrost/BlockFrost.BackEnd.js')).BlockFrostBackEnd;
            //----------------
            slot = await BlockFrostBackEnd.getLatestSlot_Api();
            //----------------
            if (slot === undefined) {
                throw `Slot not found`;
            }
            if (globalLucid.lucid === undefined) {
                throw `globalLucid lucid not set`;
            }
            blockChainTime = slotToUnixTime(globalLucid.lucid.config().network!, slot) as number; // slot es en segundots
            //----------------
            console_log(-1, `Time`, `getBlockChainTime: ${convertMillisToTime(blockChainTime)} - slot: ${convertMillisToTime(blockChainTime)} - OK`);
        }
        return blockChainTime;
    }

    public static async calculateEpochsAndSlotsForDateRange(
        lucid: LucidEvolution,
        startDate: Date,
        endDate: Date
    ): Promise<{ slotStart: number; slotEnd: number; epochStart: number; epochEnd: number }> {
        //----------------
        const BlockFrostBackEnd = (await import('../../lib/BlockFrost/BlockFrost.BackEnd.js')).BlockFrostBackEnd;
        //----------------
        const slotStartDate = lucid.unixTimeToSlot(startDate.getTime());
        const slotEndDate = lucid.unixTimeToSlot(endDate.getTime());
        //---------------
        let epochStart = calculateEpochFromSlot(slotStartDate);
        let epochEnd = calculateEpochFromSlot(slotEndDate);
        //---------------
        let epochStartData = await BlockFrostBackEnd.getEpoch_Api(epochStart);
        //---------------
        while (startDate.getTime() < epochStartData.start_time * 1000 || startDate.getTime() > epochStartData.end_time * 1000 - 1) {
            epochStart = startDate.getTime() < epochStartData.start_time * 1000 ? epochStart - 1 : epochStart + 1;
            //---------------
            epochStartData = await BlockFrostBackEnd.getEpoch_Api(epochStart);
        }
        //---------------
        let epochEndData = epochStartData;
        if (epochStart !== epochEnd) {
            epochEndData = await BlockFrostBackEnd.getEpoch_Api(epochEnd);
        }
        //---------------
        while (endDate.getTime() < epochEndData.start_time * 1000 || endDate.getTime() > epochEndData.end_time * 1000 - 1) {
            //---------------
            epochEnd = endDate.getTime() < epochEndData.start_time * 1000 ? epochEnd - 1 : epochEnd + 1;
            //---------------
            epochEndData = await BlockFrostBackEnd.getEpoch_Api(epochEnd);
        }
        //---------------
        const firstBlockTime = epochStartData.first_block_time;
        const lastBlockTime = epochEndData.last_block_time;
        //---------------
        const slotFirstBlock = lucid.unixTimeToSlot(firstBlockTime * 1000); // converting to milliseconds
        const slotLastBlock = lucid.unixTimeToSlot(lastBlockTime * 1000); // converting to milliseconds
        //---------------
        return {
            slotStart: slotFirstBlock,
            epochStart: epochStart,
            slotEnd: slotLastBlock,
            epochEnd: epochEnd,
        };
    }
}
