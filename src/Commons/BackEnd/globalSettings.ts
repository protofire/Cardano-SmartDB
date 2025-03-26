import { SiteSettingsEntity } from '../../Entities/SiteSettings.Entity.js';
import { console_log } from './globalLogs.js';

interface GlobalSettings {
    siteSettings: SiteSettingsEntity | undefined;
}

let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}

if (!globalState.globalSettings) {
    globalState.globalSettings = {
        siteSettings: undefined as SiteSettingsEntity | undefined,
    } as GlobalSettings;
}

export const globalSettings = globalState.globalSettings;

export async function getGlobalSettings(refresh: boolean = false) {
    console_log(0, `Global Settings`, `getGlobalSettings - refresh: ${refresh} - Loaded already: ${globalSettings.siteSettings !== undefined}`);
    if (globalSettings.siteSettings === undefined || refresh === true) {
        let siteSettings: SiteSettingsEntity | undefined;
        const JobBackEndApplied = (await import('../../BackEnd/Job.BackEnd.All.js')).JobBackEndApplied;
        await JobBackEndApplied.executeWithJobLock(
            `Init Global Settings`,
            async () => {
                const SiteSettingsBackEndApplied = (await import('../../BackEnd/SiteSettings.BackEnd.Applied.js')).SiteSettingsBackEndApplied;
                siteSettings = await SiteSettingsBackEndApplied.getOneByParams_({ name: 'Init' });
                if (siteSettings === undefined) {
                    console_log(0, `Global Settings`, `Site Settings Init does not exists, creating it...`);
                    // await sleep(1000);
                    // para evitar que se cree mas de una vez, se hace un timeout de 1 segundo
                    try {
                        siteSettings = await SiteSettingsBackEndApplied.createInit();
                    } catch (error: any) {
                        // if (error.code === 11000) {
                        //     console.log('Initial record already exists.');
                        // } else {
                        throw error; // Rethrow the error if it's not a duplication error
                        // }
                    }
                }
            },
            {
                swLog: true,
            }
        );
        globalSettings.siteSettings = siteSettings;
    }
}
