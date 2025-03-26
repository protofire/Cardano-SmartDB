import { isEmulator, SYNC_SERVER_TIME_ALWAYS_MS, SYNC_SERVER_TIME_OPTIONAL_MS } from '../Constants/constants.js';
import { convertMillisToTime } from '../utils.js';
import { console_log } from './globalLogs.js';

interface GlobalBlockChainTime {
    time: number | undefined;
    diffWithBlochain: number | undefined;
    lastFetch: number | undefined;
}

let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}

if (!globalState.globalBlockChainTime) {
    globalState.globalBlockChainTime = {
        time: undefined,
        diffWithBlochain: undefined,
        lastFetch: undefined,
    } as GlobalBlockChainTime;
}

export const globalBlockChainTime = globalState.globalBlockChainTime;

export async function getGlobalBlockchainTime(refresh: boolean = false): Promise<number | undefined> {
    //----------------ó
    console_log(1, `GlobalBlockChainTime`, `get GlobalBlockchainTime - refresh: ${refresh} - Loaded already: ${globalBlockChainTime.time !== undefined} - Init`);
    //----------------
    // si paso mas de 10 minutos desde la ultima vez del fetch, pido serverTime from blockchain de nuevo
    // si no, devuelvo el mismo valor plus la diferencia de tiempo
    //----------------
    if (isEmulator) {
        //--------------------------------------
        const TimeBackEnd = (await import('../../lib/Time/Time.BackEnd.js')).TimeBackEnd;
        //-------------------------
        // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
        await TimeBackEnd.syncEmulatorBlockChainWithServerTime();
    }
    //----------------
    // este deberia ser el unico lugar donde se pide Date.now() que es la hora del server
    // a partir de aca, se usa el globalTime.time, que es un calculo de la hora del server a partir de la hora de la blockchain
    if (globalBlockChainTime.time !== undefined && globalBlockChainTime.lastFetch !== undefined) {
        //----------------
        // si pasaron mas de SYNC_SERVER_TIME_ALWAYS refresca siempre
        // si pasaron mas de 2 minutos refresca si refresh es true
        // si no, no refresca
        //----------------
        const now = Date.now();
        //----------------
        const diff = now - globalBlockChainTime.lastFetch;
        if (diff > SYNC_SERVER_TIME_ALWAYS_MS) {
            refresh = true;
        } else if (refresh === true && diff > SYNC_SERVER_TIME_OPTIONAL_MS) {
            refresh = true;
        } else {
            refresh = false;
        }
    }
    //----------------
    if (globalBlockChainTime.time === undefined || globalBlockChainTime.diffWithBlochain === undefined || globalBlockChainTime.lastFetch === undefined || refresh === true) {
        //--------------------------------------
        const TimeBackEnd = (await import('../../lib/Time/Time.BackEnd.js')).TimeBackEnd;
        //-------------------------
        const blockChainTime = await TimeBackEnd.getBlockChainTime();
        //----------------
        const now = Date.now();
        //----------------
        globalBlockChainTime.time = blockChainTime;
        globalBlockChainTime.lastFetch = now;
        globalBlockChainTime.diffWithBlochain = globalBlockChainTime.time - now;
        //--------------------------------------
    } else {
        //----------------
        const now = Date.now();
        //----------------
        globalBlockChainTime.time = now + globalBlockChainTime.diffWithBlochain;
        //--------------------------------------
    }
    //----------------
    console_log(-1, `GlobalBlockChainTime`, `get GlobalBlockchainTime - time: ${globalBlockChainTime.time}  - time: ${convertMillisToTime(globalBlockChainTime.time)} - OK`);
    //----------------
    return globalBlockChainTime.time;
}
