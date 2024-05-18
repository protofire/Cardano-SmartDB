import { EmulatorEntity } from '../../Entities/Emulator.Entity.js';
import { isEmulator } from '../Constants/constants.js';
import { console_log } from './globalLogs.js';

interface GlobalEmulator {
    emulatorDB: EmulatorEntity | undefined;
}

let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}

if (!globalState.globalEmulator) {
    globalState.globalEmulator = {
        emulatorDB: undefined as EmulatorEntity | undefined,
    } as GlobalEmulator;
}

export const globalEmulator = globalState.globalEmulator;

export async function getGlobalEmulator(refresh: boolean = false): Promise<EmulatorEntity | undefined> {
    //------------------
    console_log(0, `GlobalEmulator`, `Get getGlobalEmulator - refresh: ${refresh} - Loaded already: ${globalEmulator.emulatorDB !== undefined}`);
    //------------------
    if (isEmulator && (globalEmulator.emulatorDB === undefined || refresh === true)) {
        //------------------
        const EmulatorBackEndApplied = (await import('../../BackEnd/Emulator.BackEnd.All.js')).EmulatorBackEndApplied;
        let emulatorDB: EmulatorEntity | undefined = await EmulatorBackEndApplied.getOneByParams_({ current: true });
        //------------------
        if (emulatorDB === undefined) {
            console_log(0, `GlobalEmulator`, `Emulator current does not exists, searching Init one...`);
            emulatorDB = await EmulatorBackEndApplied.getOneByParams_<EmulatorEntity>({ name: 'Init' });
            if (emulatorDB === undefined) {
                console_log(0, `GlobalEmulator`, `Emulator Init does not exists, creating Init one...`);
                try {
                    emulatorDB = await EmulatorBackEndApplied.createInit('Init', true);
                } catch (error: any) {
                    console_log(0, `GlobalEmulator`, `Emulator Init already exists...`);
                }
            } else {
                console_log(0, `GlobalEmulator`, `Emulator Init found, setting as current...`);
                // await EmulatorBackEndApplied.updateMeWithParams(emulatorDB, { current: true });
            }
        }
        //------------------
        globalEmulator.emulatorDB = emulatorDB;
    }
    return globalEmulator.emulatorDB;
}
