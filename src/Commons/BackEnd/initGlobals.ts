import { getGlobalEmulator } from './globalEmulator.js';
import { console_error, console_log } from './globalLogs.js';
import { getGlobalLucid } from './globalLucid.js';
import { getGlobalSettings } from './globalSettings.js';
import { getGlobalTransactionStatusUpdater } from './globalTransactionStatusUpdater.js';
import { getGlobalBlockchainTime } from './globalBlockchainTime.js';

export const initGlobals = async (
    swUseGlobalSettings: boolean = true,
    swUseGlobalEmulator: boolean = true,
    swUseGlobalLucid: boolean = true,
    swUseGlobalBlockchainTime: boolean = true,
    swUseGlobalTransactionStatusUpdater: boolean = true
) => {
    try {
        //--------------------
        console_log(1, `initGlobals`, `Init`);
        //--------------------
        if (swUseGlobalSettings) await getGlobalSettings();
        //--------------------------------------
        // es importante llamar primero a getGlobalEmulator y luego a getGlobalLucid, por que lucid usa el emulador.
        // es importante cargar el emulador con refresh force aqui, asi en cada llamada api se refresca.
        // por ultimo se llama a getGlobalBlockchainTime, que usa el emulador y lucid y prepara el globalBlockchainTime si es que no existe o si pasaron mas de 10 minutos
        //--------------------------------------
        if (swUseGlobalEmulator) await getGlobalEmulator(true);
        //--------------------------------------
        if (swUseGlobalLucid) await getGlobalLucid();
        //--------------------------------------
        if (swUseGlobalBlockchainTime) await getGlobalBlockchainTime();
        //--------------------------------------
        if (swUseGlobalTransactionStatusUpdater) await getGlobalTransactionStatusUpdater();
        //--------------------------------------
        console_log(-1, `initGlobals`, `OK`);
        //--------------------------------------
    } catch (error) {
        console_error(-1, `initGlobals`, `Error: ${error}`);
        // return res.status(500).json({ error: `An error occurred while initGlobals: ${error}` });
        throw `An error occurred while initGlobals: ${error}`;
    }
};
