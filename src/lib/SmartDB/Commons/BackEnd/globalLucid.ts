import { isEmulator } from '@/src/utils/specific/constants';
import { Blockfrost, Lucid } from 'lucid-cardano';
import { globalEmulator } from './globalEmulator';
import { console_log } from './globalLogs';

export interface GlobalLucid {
    lucid: Lucid | undefined;
}
export const globalLucid = {
    lucid: undefined as Lucid | undefined,
} as GlobalLucid;

export async function getGlobalLucid(refresh: boolean = false): Promise<Lucid> {
    //-----------------
    console_log(0, `GlobalLucid`, `Get getGlobalLucid - refresh: ${refresh} - Loaded already: ${globalLucid.lucid !== undefined}`);
    //-----------------
    if (globalLucid.lucid === undefined || refresh === true) {
        if (isEmulator) {
            if (globalEmulator.emulatorDB === undefined) {
                throw `globalEmulator emulatorDB current not found`;
            }
            const emulatorTime = globalEmulator.emulatorDB.emulator.time;
            globalEmulator.emulatorDB.emulator.time = globalEmulator.emulatorDB.zeroTime;
            globalLucid.lucid = await Lucid.new(globalEmulator.emulatorDB.emulator);
            globalEmulator.emulatorDB.emulator.time = emulatorTime;
        } else {
            globalLucid.lucid = await Lucid.new(new Blockfrost(process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost', 'xxxx'), process.env.NEXT_PUBLIC_CARDANO_NET! as any);
        }
    }
    //-----------------
    return globalLucid.lucid;
}
