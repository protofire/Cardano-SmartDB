import { Lucid, LucidEvolution, ProtocolParameters } from '@lucid-evolution/lucid';
import { isEmulator, LUCID_NETWORK_CUSTOM_NAME } from '../Constants/constants.js';
import { globalEmulator } from './globalEmulator.js';
import { console_log } from './globalLogs.js';
import { BlockfrostCustomProviderBackEnd } from '../../lib/BlockFrost/BlockFrost.BackEnd.js';
import { protocolParametersForLucid } from '../Constants/protocolParameters.js';

interface GlobalLucid {
    lucid: LucidEvolution | undefined;
}

let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}

if (!globalState.globalLucid) {
    globalState.globalLucid = {
        lucid: undefined as LucidEvolution | undefined,
    } as GlobalLucid;
}

export const globalLucid = globalState.globalLucid as GlobalLucid;

export async function getGlobalLucid(refresh: boolean = false): Promise<LucidEvolution> {
    //-----------------
    console_log(0, `GlobalLucid`, `Get getGlobalLucid - refresh: ${refresh} - Loaded already: ${globalLucid.lucid !== undefined}`);
    //-----------------
    if (globalLucid.lucid === undefined || refresh === true) {
        //-----------------
        const protocolParameters = protocolParametersForLucid[process.env.NEXT_PUBLIC_CARDANO_NET! as keyof typeof protocolParametersForLucid] as ProtocolParameters;
        //-----------------
        if (isEmulator) {
            if (globalEmulator.emulatorDB === undefined) {
                throw `globalEmulator emulatorDB current not found`;
            }
            const emulatorTime = globalEmulator.emulatorDB.emulator.time;
            globalEmulator.emulatorDB.emulator.time = Number(globalEmulator.emulatorDB.zeroTime.toString());
            globalLucid.lucid = await Lucid(globalEmulator.emulatorDB.emulator, LUCID_NETWORK_CUSTOM_NAME, { presetProtocolParameters: protocolParameters });
            globalEmulator.emulatorDB.emulator.time = emulatorTime;
        } else {
            globalLucid.lucid = await Lucid(
                new BlockfrostCustomProviderBackEnd(process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost', 'xxxx'),
                process.env.NEXT_PUBLIC_CARDANO_NET! as any,
                {
                    presetProtocolParameters: protocolParameters,
                }
            );
        }
    }
    //-----------------
    return globalLucid.lucid;
}
