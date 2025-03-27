'use client';

import { useEffect, useState } from 'react';
import { useAppStore, useTokensStore, useWalletStore } from '../store/useGlobalStore.js';
import { SiteSettingsEntity } from '../Entities/SiteSettings.Entity.js';
import { EmulatorDBFrontEndApiCalls, SiteSettingsFrontEndApiCalls, TransactionFrontEndApiCalls } from '../FrontEnd/index.js';
import { EmulatorEntity } from '../Entities/Emulator.Entity.js';
import { LucidToolsFrontEnd } from '../lib/Lucid/LucidTools.FrontEnd.js';
import { isEmulator, PROYECT_NAME } from '../Commons/Constants/constants.js';
import { pushWarningNotification } from '../Commons/pushNotification.js';
import fetchWrapper from '../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
//--------------------------------------
interface AppGeneralProps {
    onLoadComplete?: () => void;
}
export const useAppGeneral = (props: AppGeneralProps) => {
    //--------------------------------------
    const appStore = useAppStore();
    const walletStore = useWalletStore();
    const tokensStore = useTokensStore();
    //--------------------------------------
    const [isProcessingTask, setIsProcessingTask] = useState(false);
    const [isFaildedTask, setIsFaildedTask] = useState(false);
    const [isConfirmedTask, setIsConfirmedTask] = useState(false);
    const [processingTaskMessage, setProcessingTaskMessage] = useState('');
    //--------------------------------------
    useEffect(() => {
        if (props.onLoadComplete !== undefined && appStore.swInitApiCompleted === true) {
            props.onLoadComplete();
        }
    }, [appStore.swInitApiCompleted, props.onLoadComplete]);
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
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
        } catch (error) {
            console.log(`[App] - initApi - Error: ${error}`);
            throw error;
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
                siteSettings = await SiteSettingsFrontEndApiCalls.getOneByParamsApi_<SiteSettingsEntity>({ name: 'Init' });
                //---------------
                if (siteSettings === undefined) {
                    throw `Site Settings Init does not exists`;
                }
                //---------------
                appStore.setSiteSettings(siteSettings);
                //---------------
            }
            //---------------
        } catch (error) {
            console.log(`[App] - loadSiteSettings - Error: ${error}`);
            throw error;
        }
    }

    async function loadEmulatorCurrent(): Promise<EmulatorEntity> {
        try {
            //---------------
            console.log(`[App] - loadEmulator - Preparing Emulator...`);
            //---------------
            let emulatorDB: EmulatorEntity | undefined = undefined;
            //---------------
            emulatorDB = await EmulatorDBFrontEndApiCalls.getOneByParamsApi_<EmulatorEntity>({ current: true });
            //---------------
            if (emulatorDB === undefined) {
                throw `Emulator current not found`;
            }
            //---------------
            walletStore.setEmulatorDB(emulatorDB);
            //---------------
            return emulatorDB;
            //---------------
        } catch (error) {
            console.log(`[App] - loadEmulator - Error: ${error}`);
            throw error;
        }
    }

    async function initLucidForUseAsUtils(emulatorDB?: EmulatorEntity) {
        try {
            console.log(`[App] - initLucidForUseAsUtils - Preparing Lucid for use as Utils...`);
            const { lucid } = await LucidToolsFrontEnd.prepareLucidForUseAsUtils(emulatorDB);
            walletStore.setLucidForUseAsUtils(lucid);
        } catch (error) {
            console.log(`[App] - initLucidForUseAsUtils - Error: ${error}`);
            throw error;
        }
    }
    //--------------------------------------

    useEffect(() => {
        const initGeneral = async () => {
            try {
                //--------------------
                appStore.setSwInitApiCompleted(false);
                //--------------------
                await initApi();
                //--------------------
                await loadSiteSettings();
                //--------------------
                let emulatorDB: EmulatorEntity | undefined = undefined;
                if (isEmulator) {
                    emulatorDB = await loadEmulatorCurrent();
                }
                //--------------------
                await initLucidForUseAsUtils(emulatorDB);
                //--------------------
                walletStore.getCardanoWallets();
                //--------------------
                const existAnyWallet = await appStore.checkIfExistAnyWallet();
                //--------------------
                appStore.checkIfExistAnyWallet();
                //--------------------
                appStore.setSwInitApiCompleted(true);
                //--------------------
                try {
                    const swCheckAgainTxTimeOut = false;
                    const swCheckAgainTxPendingTimeOut = false;
                    const swCheckAgainTxFailed = false;
                    TransactionFrontEndApiCalls.beginStatusUpdaterJobApi(swCheckAgainTxTimeOut, swCheckAgainTxPendingTimeOut, swCheckAgainTxFailed);
                } catch (error) {
                    console.log(`Error starting Tx Updater Job: ${error}`);
                }
            } catch (error) {
                console.log(`[App] - init - Error: ${error}`);
                pushWarningNotification(`SmartDB`, `Error initializing: ${error}`);
            }
        };
        initGeneral();
    }, []);
    //--------------------------------------
    useEffect(() => {
        // if (appStore.swExistAnyWsallet === false ) {
        //     router.push({
        //         pathname: ROUTES.AdminDashboard,
        //         query: { [TASK_QUERY_NAME.TASK]: TASK.WALLETS },
        //     });
        // }
    }, [appStore.swExistAnyWallet]);
    //--------------------------------------
    return {
        appStore,
        tokensStore,
        isProcessingTask,
        setIsProcessingTask,
        isFaildedTask,
        setIsFaildedTask,
        isConfirmedTask,
        setIsConfirmedTask,
        processingTaskMessage,
        setProcessingTaskMessage,
    };
};
