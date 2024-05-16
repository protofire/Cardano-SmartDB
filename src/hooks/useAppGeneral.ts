'use client';

import { useEffect, useState } from 'react';
import { useAppStore, useTokensStore, useWalletStore } from '../store/useGlobalStore.js';
import { SiteSettingsEntity } from '../Entities/SiteSettings.Entity.js';
import { EmulatorDBFrontEndApiCalls, SiteSettingsFrontEndApiCalls } from '../FrontEnd/index.js';
import { EmulatorEntity } from '../Entities/Emulator.Entity.js';
import { LucidToolsFrontEnd } from '../lib/Lucid/LucidTools.FrontEnd.js';
import { isEmulator } from '../Commons/Constants/constants.js';
import { pushWarningNotification } from '../Commons/pushNotification.js';
import fetchWrapper from '../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
//--------------------------------------
export const useAppGeneral = () => {
    //--------------------------------------
    const appStore = useAppStore();
    const walletStore = useWalletStore();
    const tokensStore = useTokensStore();
    //--------------------------------------
    useEffect(() => {
        // MAIN USE EFFECTS TO EXECUTE JOBS OF GETTING TOKEN METADATA, VERY IMPORTANT!!!
        if (tokensStore.jobTokensToAdd.length > 0 && tokensStore.isExecuting === false) {
            tokensStore.executeJobsTokensToAdd();
        }
    }, [tokensStore.jobTokensToAdd, tokensStore.isExecuting]);
    //--------------------------------------
    async function initApi() {
        try {
            //--------------------
            appStore.setSwInitApiCompleted(false);
            //--------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/init`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 200) {
                const datas = await response.json();
                if (!datas.token) {
                    throw `Invalid response format: Challengue Token not found`;
                }
                if (!datas.csrfToken) {
                    throw `Invalid response format: csrf Token not found`;
                }
                localStorage.setItem('challengueToken', datas.token);
                localStorage.setItem('x-csrf-token', datas.csrfToken);
                console.log(`[App] - initApi - response OK - ${datas.status}`);
                //--------------------
                appStore.setSwInitApiCompleted(true);
                //--------------------
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[App] - initApi - Error: ${error}`);
            throw `${error}`;
        }
    }
    async function loadSiteSettings(): Promise<void> {
        try {
            if (appStore.siteSettings !== undefined) {
                console.log(`[App] - Site Settings already set`);
            } else {
                //---------------
                console.log(`[App] - Site Settings not set. Preparing...`);
                //---------------
                let siteSettings: SiteSettingsEntity | undefined = undefined;
                //---------------
                let sitesSettings = await SiteSettingsFrontEndApiCalls.getByParamsApi_<SiteSettingsEntity>({ name: 'Init' });
                //---------------
                if (sitesSettings.length >= 1) {
                    //---------------
                    siteSettings = sitesSettings[0];
                    //---------------
                    if (sitesSettings.length > 1) {
                        //---------------
                        console.log(`[App] - More than one Site Settings Init found`);
                        //---------------
                        for (let i = 1; i < sitesSettings.length; i++) {
                            await SiteSettingsFrontEndApiCalls.deleteByIdApi_<SiteSettingsEntity>(sitesSettings[i]._DB_id);
                        }
                    } else {
                        console.log(`[App] - Site Settings Init found`);
                    }
                }
                //---------------
                if (siteSettings === undefined) {
                    throw `Site Settings Init does not exists`;
                    // console.log(`[App] - Site Settings Init does not exists, creating it...`);
                    // let siteSettings = await SiteSettingsApi.createInitSiteSettingsApi('Init');
                    // appStore.setSiteSettings(siteSettings);
                }
                //---------------
                appStore.setSiteSettings(siteSettings);
                //---------------
            }
            //---------------
        } catch (error) {
            console.log(`[App] - loadSiteSettings - Error: ${error}`);
            throw `${error}`;
        }
    }

    async function loadEmulatorCurrent(): Promise<EmulatorEntity> {
        try {
            //---------------
            console.log(`[App] - loadEmulator - Preparing Emulator...`);
            //---------------
            let emulatorDB: EmulatorEntity | undefined = undefined;
            //---------------
            let emulatorsDB = await EmulatorDBFrontEndApiCalls.getByParamsApi_<EmulatorEntity>({ current: true });
            //---------------
            if (emulatorsDB.length >= 1) {
                //---------------
                emulatorDB = emulatorsDB[0];
                //---------------
                if (emulatorsDB.length > 1) {
                    //---------------
                    console.log(`[App] - More than one Emulator current found`);
                    //---------------
                    for (let i = 1; i < emulatorsDB.length; i++) {
                        await EmulatorDBFrontEndApiCalls.deleteByIdApi_<SiteSettingsEntity>(emulatorsDB[i]._DB_id);
                    }
                } else {
                    console.log(`[App] - Emulator current found`);
                }
            }
            //---------------
            if (emulatorDB === undefined) {
                //---------------
                console.log(`[App] - Emulator current does not exists, searching Init one...`);
                //---------------
                emulatorsDB = await EmulatorDBFrontEndApiCalls.getByParamsApi_<EmulatorEntity>({ name: 'Init' });
                //---------------
                if (emulatorsDB.length >= 1) {
                    //---------------
                    emulatorDB = emulatorsDB[0];
                    //---------------
                    if (emulatorsDB.length > 1) {
                        //---------------
                        console.log(`[App] - More than one Emulator Init found`);
                        //---------------
                        for (let i = 1; i < emulatorsDB.length; i++) {
                            await EmulatorDBFrontEndApiCalls.deleteByIdApi_<SiteSettingsEntity>(emulatorsDB[i]._DB_id);
                        }
                    } else {
                        console.log(`[App] - Emulator Init found`);
                    }
                }
                //---------------
                if (emulatorDB === undefined) {
                    //---------------
                    // throw `Emulator Init does not exists`;
                    //---------------
                    console.log(`[App] - Emulator Init does not exists, creating Init one...`);
                    emulatorDB = await EmulatorDBFrontEndApiCalls.createInitEmulatorApi('Init', true);
                } else {
                    console.log(`[App] - Emulator Init found, setting as current...`);
                    await EmulatorDBFrontEndApiCalls.updateMeWithParamsApi(emulatorDB, { current: true });
                }
            }
            //---------------
            walletStore.setEmulatorDB(emulatorDB);
            //---------------
            return emulatorDB;
            //---------------
        } catch (error) {
            console.log(`[App] - loadEmulator - Error: ${error}`);
            throw `${error}`;
        }
    }
    //--------------------------------------
    async function initLucidForUseAsUtils(emulatorDB?: EmulatorEntity) {
        try {
            console.log(`[App] - initLucidForUseAsUtils - Preparing Lucid for use as Utils...`);
            const { lucid } = await LucidToolsFrontEnd.prepareLucidForUseAsUtils(emulatorDB);
            walletStore.setLucidForUseAsUtils(lucid);
        } catch (error) {
            console.log(`[App] - initLucidForUseAsUtils - Error: ${error}`);
            throw `${error}`;
        }
    }
    //--------------------------------------
    useEffect(() => {
        const init = async () => {
            try {
                await initApi();

                await loadSiteSettings();

                let emulatorDB: EmulatorEntity | undefined = undefined;
                if (isEmulator) {
                    emulatorDB = await loadEmulatorCurrent();
                }

                initLucidForUseAsUtils(emulatorDB);

                walletStore.getCardanoWallets();

                appStore.checkIfExistAnyWallet();

                // add_AppTokensMetadata();
            } catch (error) {
                console.log(`[App] - init - Error: ${error}`);
                pushWarningNotification(`MAYZ Protocol`, `Error initializing: ${error}`);
            }
        };
        init();
    }, []);
    //--------------------------------------
    useEffect(() => {
        // if (appStore.swExistAnyWallet === false && appStore.swExistAnyProtocol !== undefined) {
        //     router.push({
        //         pathname: ROUTES.AdminDashboard,
        //         query: { [TASK_QUERY_NAME.TASK]: TASK.WALLETS },
        //     });
        // } else {
        //     if (appStore.swExistAnyWallet === true && appStore.swExistAnyProtocol === false) {
        //         router.push({
        //             pathname: ROUTES.AdminDashboard,
        //             query: { [TASK_QUERY_NAME.TASK]: TASK.PROTOCOLS, [TASK_QUERY_NAME.PROTOCOLS]: TASK.CREATE },
        //         });
        //     }
        // }
    }, [appStore.swExistAnyWallet]);
    //--------------------------------------
};
