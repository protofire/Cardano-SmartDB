import { Action, Computed, Thunk, action, computed, thunk } from 'easy-peasy';
import { Lucid, UTxO } from 'lucid-cardano';
import { User } from 'next-auth';
import { signIn, signOut } from 'next-auth/react';
import { EmulatorEntity } from '../Entities/Emulator.Entity.js';
import { CardanoWallet, ConnectedWalletInfo } from '../Commons/types.js';
import { CARDANO_WALLETS } from '../Commons/Constants/wallets.js';
import { LUCID_NETWORK_MAINNET_INT, LUCID_NETWORK_TESTNET_INT, isEmulator, isMainnet, isTestnet } from '../Commons/Constants/constants.js';
import { EmulatorDBFrontEndApiCalls, WalletFrontEndApiCalls } from '../FrontEnd/index.js';
import { toJson } from '../Commons/utils.js';
import { LucidToolsFrontEnd } from '../lib/Lucid/LucidTools.FrontEnd.js';
import { explainError } from '../Commons/explainError.js';
import { Credentials } from '../lib/Auth/types.js';
import { AuthApi } from '../lib/Auth/Auth.FrontEnd.js';
import { getTotalOfUnitInUTxOList } from '../Commons/helpers.js';

//------------------------------------

export interface IWalletStoreModel {
    emulatorDB?: EmulatorEntity;
    setEmulatorDB: Action<IWalletStoreModel, EmulatorEntity>;

    cardanoWallets: CardanoWallet[];
    setCardanoWallets: Action<IWalletStoreModel, CardanoWallet[]>;

    isGettingWalletsDone: boolean;
    setIsGettingWalletsDone: Action<IWalletStoreModel, boolean>;

    getCardanoWallets: Thunk<IWalletStoreModel, undefined, any, any, Promise<void>>;

    initWallet: Action<IWalletStoreModel>;

    isConnecting: boolean;
    setIsConnecting: Action<IWalletStoreModel, boolean>;

    isConnected: boolean;
    setIsConnected: Action<IWalletStoreModel, boolean>;

    swHideBalance: boolean;
    setSwHideBalance: Action<IWalletStoreModel, boolean>;

    _lucid: Lucid | undefined;
    getLucid: Thunk<IWalletStoreModel, { emulatorDB?: EmulatorEntity } | undefined, any, any, Promise<Lucid | undefined>>;
    setLucid: Action<IWalletStoreModel, Lucid>;

    _lucidForUseAsUtils?: Lucid;
    getLucidForUseAsUtils: Thunk<IWalletStoreModel, undefined, any, any, Promise<Lucid | undefined>>;
    setLucidForUseAsUtils: Action<IWalletStoreModel, Lucid>;

    protocolParameters: unknown;
    setProtocolParameters: Action<IWalletStoreModel, unknown>;

    info: ConnectedWalletInfo | undefined;
    setInfo: Action<IWalletStoreModel, ConnectedWalletInfo>;

    getPkh: Computed<IWalletStoreModel, (swUseSession?: boolean, session?: any, status?: any) => string | undefined>;

    isLoadingAnyData: Computed<IWalletStoreModel, boolean>;

    isWalletPrivilegesLoading: boolean;
    setIsLoadingWallePrivileges: Action<IWalletStoreModel, boolean>;
    isWalletPrivilegesLoaded: boolean;
    setIsWalletPrivilegesLoaded: Action<IWalletStoreModel, boolean>;

    loadWalletPrivileges: Thunk<IWalletStoreModel>;

    isWalletDataLoading: boolean;
    setIsWalletDataLoading: Action<IWalletStoreModel, boolean>;
    isWalletDataLoaded: boolean;
    setIsWalletDataLoaded: Action<IWalletStoreModel, boolean>;

    loadWalletData: Thunk<IWalletStoreModel, {} | undefined>;

    uTxOsAtWallet: UTxO[];
    setUTxOsAtWallet: Action<IWalletStoreModel, UTxO[]>;
    getUTxOsAtWallet: Computed<IWalletStoreModel, () => UTxO[]>;

    _isCoreTeam: boolean;
    isCoreTeam: Computed<IWalletStoreModel, (swUseSession?: boolean, session?: any, status?: any) => boolean>;
    setIsCoreTeam: Action<IWalletStoreModel, boolean>;

    checkSessionValidity: Thunk<IWalletStoreModel, { user: User; walletInfo: ConnectedWalletInfo; isCoreTeam: boolean }>;

    connectWallet: Thunk<
        IWalletStoreModel,
        {
            session: any;
            status: any;
            walletNameOrSeedOrKey: string;
            tryAgain: boolean;
            useBlockfrostToSubmit: boolean;
            isWalletFromSeed: boolean;
            isWalletFromKey: boolean;
            forceConnect?: boolean;
            emulatorDB?: EmulatorEntity;
            createSignedSession: boolean;
        }
    >;

    disconnectWallet: Thunk<IWalletStoreModel, { session: any; status: any }>;

    getTotalOfUnit: Computed<IWalletStoreModel, (unit: string, swOnlyAvailable?: boolean) => bigint>;

    getTotalNumberOfTokens: Computed<IWalletStoreModel, number>;
}

export const WalletStoreModel: IWalletStoreModel = {
    emulatorDB: undefined,
    setEmulatorDB: action((state, payload) => {
        state.emulatorDB = payload;
    }),

    cardanoWallets: CARDANO_WALLETS,
    setCardanoWallets: action((state, cardanoWallets) => {
        state.cardanoWallets = cardanoWallets;
    }),

    // si es emulador no tiene que cargar wallets
    isGettingWalletsDone: isEmulator,
    setIsGettingWalletsDone: action((state, isGettingWalletsDone) => {
        state.isGettingWalletsDone = isGettingWalletsDone;
    }),

    getCardanoWallets: thunk(async (actions, payload, helpers) => {
        const pollWallets = async (pollWalletsCount: number = 0): Promise<void> => {
            let walletsFound = [];
            if (window.cardano !== undefined) {
                for (const key in window.cardano) {
                    if (window.cardano[key].enable! && walletsFound.indexOf(key) === -1) {
                        walletsFound.push(key);
                    }
                }
            }

            // Proceed if wallets are found or if it's the third attempt
            if (walletsFound.length > 0 || pollWalletsCount === 2) {
                // Get current cardanoWallets from state
                const state = helpers.getState();
                const cardanoWallets = state.cardanoWallets;

                // Update isInstalled flags for found wallets
                walletsFound.forEach((walletName) => {
                    const wallet = cardanoWallets.find((w) => w.wallet === walletName);
                    if (wallet) {
                        wallet.isInstalled = true;
                    }
                });
                // Sort and set new state
                cardanoWallets.sort((a, b) => {
                    // First, sort by isInstalled status
                    if (a.isInstalled && !b.isInstalled) {
                        return -1; // a comes first
                    } else if (!a.isInstalled && b.isInstalled) {
                        return 1; // b comes first
                    } else {
                        // If both have the same isInstalled status, sort alphabetically by name
                        // Assuming the property to sort by is 'name' instead of 'wallet'
                        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
                    }
                });
                actions.setCardanoWallets([...cardanoWallets]);
                actions.setIsGettingWalletsDone(true);
            } else if (pollWalletsCount < 2) {
                // Use 2 since count starts from 0 (0, 1, 2)
                setTimeout(() => {
                    pollWallets(pollWalletsCount + 1);
                }, 1000);
            } else {
                // Ensure setIsGettingWalletsDone is called even when no wallets are found
                const state = helpers.getState();
                const cardanoWallets = state.cardanoWallets;
                // Sort and set new state
                cardanoWallets.sort((a, b) => {
                    // First, sort by isInstalled status
                    if (a.isInstalled && !b.isInstalled) {
                        return -1; // a comes first
                    } else if (!a.isInstalled && b.isInstalled) {
                        return 1; // b comes first
                    } else {
                        // If both have the same isInstalled status, sort alphabetically by name
                        // Assuming the property to sort by is 'name' instead of 'wallet'
                        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
                    }
                });
                actions.setCardanoWallets([...cardanoWallets]);
                actions.setIsGettingWalletsDone(true);
            }
        };
        if (process.env.NEXT_PUBLIC_CARDANO_NET !== 'Emulator') {
            await pollWallets();
        }
    }),

    initWallet: action((state) => {
        console.log(`[WalletStore] - initWallet`);

        // state.emulatorDB = undefined;

        state.swHideBalance = true;
        state.isConnecting = false;
        state.isConnected = false;
        state._lucid = undefined;
        state.protocolParameters = undefined;
        state.info = undefined;

        state.isWalletPrivilegesLoading = false;
        state.isWalletPrivilegesLoaded = false;

        state.isWalletDataLoading = false;
        state.isWalletDataLoaded = false;

        state.uTxOsAtWallet = [];
        state._isCoreTeam = false;
    }),

    swHideBalance: true,
    setSwHideBalance: action((state, swHideBalance) => {
        state.swHideBalance = swHideBalance;
    }),

    isConnecting: false,
    setIsConnecting: action((state, isConnecting) => {
        state.isConnecting = isConnecting;
    }),

    isConnected: false,
    setIsConnected: action((state, isConnected) => {
        state.isConnected = isConnected;
    }),

    _lucid: undefined,
    setLucid: action((state, newLucid) => {
        state._lucid = newLucid;
    }),

    getLucid: thunk(async (actions, payload = {}, helpers): Promise<Lucid | undefined> => {
        //-------------------------
        // normalmente lucid contiene el provider del emulador siempre actualizado en la misma ventan
        // pero si el emulador fue usado en otro lado, de esta forma me aseguro que se lea de la base de datos y se actualice en lucid
        //-------------------------
        let { emulatorDB } = payload;
        //-------------------------
        let state = helpers.getState();
        //-------------------------
        let lucid = state._lucid;
        //-------------------------
        if (lucid !== undefined) {
            if (isEmulator) {
                if (emulatorDB === undefined) {
                    console.log(`[WalletStore] - getLucid - Getting last updated emulatorDB...`);
                    emulatorDB = await EmulatorDBFrontEndApiCalls.getOneByParamsApi<EmulatorEntity>(EmulatorEntity, { current: true });
                }
                if (emulatorDB === undefined) {
                    throw 'emulatorDB current not defined';
                } else {
                    lucid.provider = emulatorDB.emulator;
                    actions.setLucid(lucid);
                    actions.setEmulatorDB(emulatorDB);
                }
            }
        }
        return lucid;
    }),

    _lucidForUseAsUtils: undefined,

    setLucidForUseAsUtils: action((state, payload) => {
        state._lucidForUseAsUtils = payload;
    }),

    getLucidForUseAsUtils: thunk(async (actions, payload, helpers): Promise<Lucid | undefined> => {
        // normalmente lucid contiene el provider del emulador siempre actualizado en la misma ventan
        // pero si el emulador fue usado en otro lado, de esta forma me aseguro que se lea de la base de datos y se actualice en lucid
        //-------------------------
        let state = helpers.getState();
        //-------------------------
        let lucid = state._lucidForUseAsUtils;
        //-------------------------
        if (lucid !== undefined) {
            if (isEmulator) {
                console.log(`[WalletStore] - getLucidForUseAsUtils - Getting last updated emulatorDB...`);
                let emulatorDB = await EmulatorDBFrontEndApiCalls.getOneByParamsApi<EmulatorEntity>(EmulatorEntity, { current: true });
                if (emulatorDB === undefined) {
                    throw 'emulatorDB current not defined';
                } else {
                    lucid.provider = emulatorDB.emulator;
                    actions.setLucidForUseAsUtils(lucid);
                }
            }
        }
        return lucid;
    }),

    protocolParameters: undefined,
    setProtocolParameters: action((state, newProtocolParameters) => {
        state.protocolParameters = newProtocolParameters;
    }),

    info: undefined,
    setInfo: action((state, newInfo) => {
        state.info = newInfo;
    }),

    getPkh: computed((state) => (swUseSession = false, session: any, status: any): string | undefined => {
        if (state.isConnected && state.info) {
            return state.info.pkh;
        } else if (swUseSession === true && status === 'authenticated') {
            if (session && session.user) {
                return session.user.pkh;
            }
        }
        return undefined;
    }),

    isLoadingAnyData: computed((state) => {
        return state.isWalletPrivilegesLoading || state.isWalletDataLoading;
    }),

    loadWalletPrivileges: thunk(async (actions, _, helpers) => {
        const state = helpers.getState();
        console.log(`[WalletStore] - loadWalletPrivileges - Init`);
        try {
            if (state._lucid && state.info) {
                actions.setIsWalletPrivilegesLoaded(false);
                actions.setIsLoadingWallePrivileges(true);
                const isCoreTeam = await WalletFrontEndApiCalls.isCoreTeamApi(state.info.pkh);
                actions.setIsCoreTeam(isCoreTeam ? true : false);
                actions.setIsWalletPrivilegesLoaded(true);
                actions.setIsLoadingWallePrivileges(false);

                console.log(`[WalletStore] - loadWalletPrivileges - OK`);
            }
        } catch (error) {
            console.log(`[WalletStore] - loadWalletPrivileges - Error: ${error}`);
            actions.setIsLoadingWallePrivileges(false);
            throw error;
        }
    }),

    loadWalletData: thunk(async (actions, payload, helpers) => {
        //----------
        const state = helpers.getState();
        //----------
        console.log(`[WalletStore] - loadWalletData Init`);
        try {
            if (state.isConnected && state._lucid && state.info) {
                actions.setIsWalletDataLoaded(false);
                actions.setIsWalletDataLoading(true);
                const lucid = await actions.getLucid();
                let uTxOsAtWallet: UTxO[] = [];
                try {
                    uTxOsAtWallet = await lucid!.wallet.getUtxos();
                } catch (error) {}
                console.log('[WalletStore] - loadWalletData - uTxOsAtWallet: ' + uTxOsAtWallet.length);
                actions.setUTxOsAtWallet(uTxOsAtWallet);
                if (uTxOsAtWallet.length === 0) {
                    console.log(`[WalletStore] - loadWalletData: There are no UTxOs available in your Wallet`);
                }
                //--------------------------------------
                actions.setIsWalletDataLoaded(true);
                actions.setIsWalletDataLoading(false);
                //--------------------------------------
                console.log(`[WalletStore] - loadWalletData - OK`);
            }
        } catch (error) {
            console.log(`[WalletStore] - loadWalletData - Error: ${error}`);
            actions.setIsWalletDataLoading(false);
            throw error;
        }
    }),

    isWalletPrivilegesLoading: false,
    setIsLoadingWallePrivileges: action((state, isLoading) => {
        state.isWalletPrivilegesLoading = isLoading;
    }),

    isWalletPrivilegesLoaded: false,
    setIsWalletPrivilegesLoaded: action((state, isLoaded) => {
        state.isWalletPrivilegesLoaded = isLoaded;
    }),

    isWalletDataLoading: false,
    setIsWalletDataLoading: action((state, isLoading) => {
        state.isWalletDataLoading = isLoading;
    }),

    isWalletDataLoaded: false,
    setIsWalletDataLoaded: action((state, isLoaded) => {
        state.isWalletDataLoaded = isLoaded;
    }),

    uTxOsAtWallet: [],
    setUTxOsAtWallet: action((state, newUTxOs) => {
        state.uTxOsAtWallet = newUTxOs;
    }),
    getUTxOsAtWallet: computed((state) => (): UTxO[] => {
        return state.uTxOsAtWallet;
    }),

    _isCoreTeam: false,
    setIsCoreTeam: action((state, isCore) => {
        state._isCoreTeam = isCore;
    }),
    isCoreTeam: computed((state) => (swUseSession?: boolean, session?: any, status?: any) => {
        if (state.isWalletPrivilegesLoaded) {
            return state._isCoreTeam;
        } else if (swUseSession === true && status === 'authenticated') {
            if (session && session.user && session.user.isCoreTeam) {
                return session.user.isCoreTeam;
            }
        }
        return false;
    }),

    checkSessionValidity: thunk(async (actions, payload, helpers) => {
        //------------------------------
        const { user, walletInfo, isCoreTeam } = payload;
        //------------------------------
        const swSettedSessionOk =
            user.address !== undefined &&
            user.pkh !== undefined &&
            (walletInfo.stakePkh === undefined || user.stakePkh !== undefined) &&
            user.walletNameOrSeedOrKey !== undefined &&
            user.useBlockfrostToSubmit !== undefined &&
            user.isWalletFromSeed !== undefined &&
            user.isWalletFromKey !== undefined &&
            user.isCoreTeam !== undefined &&
            user.network !== undefined &&
            (walletInfo.isWalletValidatedWithSignedToken === undefined || user.isWalletValidatedWithSignedToken !== undefined);
        //------------------------------
        const prevUser = {
            address: user.address,
            pkh: user.pkh,
            stakePkh: user.stakePkh,
            walletNameOrSeedOrKey: user.walletNameOrSeedOrKey,
            useBlockfrostToSubmit: user.useBlockfrostToSubmit,
            isWalletFromSeed: user.isWalletFromSeed,
            isWalletFromKey: user.isWalletFromKey,
            isCoreTeam: user.isCoreTeam,
            network: user.network,
            isWalletValidatedWithSignedToken: user.isWalletValidatedWithSignedToken,
        };
        //------------------------------
        const currentUser = {
            address: walletInfo.address,
            pkh: walletInfo.pkh,
            stakePkh: walletInfo.stakePkh,
            walletNameOrSeedOrKey: walletInfo.walletNameOrSeedOrKey,
            useBlockfrostToSubmit: walletInfo.useBlockfrostToSubmit,
            isWalletFromSeed: walletInfo.isWalletFromSeed,
            isWalletFromKey: walletInfo.isWalletFromKey,
            isCoreTeam: isCoreTeam,
            network: process.env.NEXT_PUBLIC_CARDANO_NET,
            isWalletValidatedWithSignedToken: walletInfo.isWalletValidatedWithSignedToken,
        };
        //------------------------------
        const swSessionOk =
            prevUser.address === currentUser.address &&
            prevUser.pkh === currentUser.pkh &&
            prevUser.stakePkh === currentUser.stakePkh &&
            prevUser.walletNameOrSeedOrKey === currentUser.walletNameOrSeedOrKey &&
            prevUser.useBlockfrostToSubmit === currentUser.useBlockfrostToSubmit &&
            prevUser.isWalletFromSeed === currentUser.isWalletFromSeed &&
            prevUser.isWalletFromKey === currentUser.isWalletFromKey &&
            prevUser.isCoreTeam === currentUser.isCoreTeam &&
            prevUser.network === currentUser.network &&
            prevUser.isWalletValidatedWithSignedToken === currentUser.isWalletValidatedWithSignedToken;
        //------------------------------
        const isSessionValid = swSessionOk && swSettedSessionOk;
        //------------------------------
        const updatedValues = {};
        Object.entries(prevUser).forEach(([key, value]) => {
            if ((currentUser as any)[key] !== value) {
                (updatedValues as any)[key] = {
                    from: value,
                    to: (currentUser as any)[key],
                };
            }
        });
        //------------------------------
        console.log(
            `[WalletStore] - checkSessionValidity - all set: ${swSettedSessionOk.toString()} - updated: ${swSessionOk.toString()} - which fields: ${
                !swSessionOk ? toJson({ updatedValues }) : null
            }`
        );
        //------------------------------
        return isSessionValid;
    }),

    connectWallet: thunk(async (actions, payload, helpers) => {
        console.log(`[WalletStore] - Connecting Wallet...`);
        //----------------------------
        const { session, status, walletNameOrSeedOrKey, tryAgain, useBlockfrostToSubmit, isWalletFromSeed, isWalletFromKey, forceConnect, createSignedSession } = payload;
        let { emulatorDB } = payload;
        //----------------------------
        let isNewConnection = false;
        //----------------------------
        try {
            let state = helpers.getState();
            //----------------------------
            if (isWalletFromSeed === false && isWalletFromKey === false && window.cardano === undefined) {
                throw `Install a Cardano Wallet and please try again...`;
            }
            const isWalletApiEnabled = isWalletFromSeed || isWalletFromKey || (await window.cardano[walletNameOrSeedOrKey]?.isEnabled());
            const isStoreWalletConnected = state.isConnected && state.info?.walletNameOrSeedOrKey === walletNameOrSeedOrKey;
            //----------------------------
            let swConnect = forceConnect === true || isWalletApiEnabled === false || isStoreWalletConnected === false;
            //----------------------------
            let isSessionInvalidOrNoExists = undefined;
            if (!swConnect) {
                isSessionInvalidOrNoExists = true;
                if (state.info) {
                    const isSessionValid = await actions.checkSessionValidity({
                        user: session.user,
                        walletInfo: state.info,
                        isCoreTeam: state._isCoreTeam,
                    });
                    isSessionInvalidOrNoExists = !isSessionValid;
                }
                swConnect = isSessionInvalidOrNoExists;
            }
            //----------------------------
            if (swConnect) {
                //----------------------------
                isNewConnection = true;
                //----------------------------
                if (isEmulator) {
                    if (emulatorDB === undefined) {
                        console.log(`[WalletStore] - Connecting Wallet with Emulator. Getting last updated emulatorDB...`);
                        emulatorDB = await EmulatorDBFrontEndApiCalls.getOneByParamsApi<EmulatorEntity>(EmulatorEntity, { current: true });
                    }
                    if (emulatorDB === undefined) {
                        throw `Emulator engine not ready for connect, please try again...`;
                    }
                }
                //----------------------------
                console.log(
                    `[WalletStore] - Wallet will be connected because its needed: wallet Api not enabled - ${!isWalletApiEnabled} - or wallet not connected - ${!state.isConnected} - or force connect - ${forceConnect} - or invalid session: ${isSessionInvalidOrNoExists}`
                );
                //----------------------------
                actions.initWallet();
                actions.setIsConnecting(true);
                //----------------------------
                let lucid: Lucid | undefined = undefined;
                //----------------------------
                if (isWalletFromSeed || isWalletFromKey) {
                    //----------------------------
                    // let walletSeed = '';
                    // let walletPrivateKey = '';
                    //----------------------------
                    // const walletMasterSeed1 = process.env.NEXT_PUBLIC_walletMasterSeed1;
                    // const walletMasterSeed2 = process.env.NEXT_PUBLIC_walletMasterSeed2;
                    // //----------------------------
                    // if (walletName === 'Master1') {
                    //     walletSeed = walletMasterSeed1 != null ? walletMasterSeed1 : '';
                    // } else if (walletName === 'Master2') {
                    //     walletSeed = walletMasterSeed2 != null ? walletMasterSeed2 : '';
                    // } else if (isEmulator) {
                    //     const key = emulatorDB!.privateKeys.find((_, index) => walletName === `Emulator${index + 1}`);
                    //     if (key === undefined) {
                    //         throw `Emulator Wallet Key does not exists...`;
                    //     }
                    //     walletPrivateKey = key;
                    // } else {
                    //     throw `Seed Wallet or Key does not exists...`;
                    // }
                    //----------------------------
                    try {
                        if (isEmulator) {
                            if (isWalletFromSeed) {
                                console.log(`[WalletStore] - Init Lucid with Emulator and Private Key...`);
                                lucid = await LucidToolsFrontEnd.initializeLucidWithEmulatorAndWalletFromSeed(emulatorDB!, walletNameOrSeedOrKey, {
                                    addressType: 'Base',
                                    accountIndex: 0,
                                });
                            } else if (isWalletFromKey) {
                                console.log(`[WalletStore] - Init Lucid with Emulator and Private Key...`);
                                lucid = await LucidToolsFrontEnd.initializeLucidWithEmulatorAndWalletFromPrivateKey(emulatorDB!, walletNameOrSeedOrKey);
                            }
                        } else {
                            if (isWalletFromSeed) {
                                console.log(`[WalletStore] - Init Lucid with Wallet from Seed...`);
                                lucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrostAndWalletFromSeed(walletNameOrSeedOrKey, { addressType: 'Base', accountIndex: 0 });
                            } else if (isWalletFromKey) {
                                console.log(`[WalletStore] - Init Lucid with Emulator and Private Key...`);
                                lucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrostAndWalletFromPrivateKey(walletNameOrSeedOrKey);
                            }
                        }
                    } catch (error) {
                        throw `${error}`;
                    }
                    //----------------------------
                } else {
                    //----------------------------
                    let walletApi = undefined;
                    if (isWalletApiEnabled === false) {
                        console.log(`[WalletStore] - Enabling Wallet Api...`);
                        let countError = 0;
                        let errorStr = '';
                        const maxError = tryAgain ? 2 : 1;
                        while (countError < maxError) {
                            try {
                                if (countError > 0) await new Promise((r) => setTimeout(r, 4000)); //espero 4 segundos para que se cargue la wallet
                                walletApi = await window.cardano[walletNameOrSeedOrKey].enable();
                                break;
                            } catch (error) {
                                console.log('[WalletStore] - Try ' + countError + ' of ' + maxError + ' - Error: ' + error);
                                errorStr = explainError(error);
                                countError++;
                            }
                        }
                        if (!walletApi) {
                            throw errorStr;
                        }
                    } else {
                        console.log(`[WalletStore] - Wallet Api is already enabled`);
                        // deberia tener guardada la wallet api?
                        walletApi = window.cardano[walletNameOrSeedOrKey];
                        walletApi = await window.cardano[walletNameOrSeedOrKey].enable();
                    }
                    //----------------------------
                    try {
                        console.log(`[WalletStore] - Init Lucid with Wallet Api...`);
                        const networkId = await walletApi.getNetworkId();
                        console.log(`[WalletStore] - NetworkId: ${networkId}`);
                        if (isMainnet && networkId !== LUCID_NETWORK_MAINNET_INT) {
                            throw `Must connect with a Mainnet Cardano Wallet`;
                        }
                        if (isTestnet && networkId !== LUCID_NETWORK_TESTNET_INT) {
                            throw `Must connect with a ${process.env.NEXT_PUBLIC_CARDANO_NET!} Testnet Cardano Wallet`;
                        }
                        lucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrostAndWalletApi(walletApi);
                    } catch (error) {
                        throw `${error}`;
                    }
                }
                //----------------------------
                if (lucid === undefined) {
                    throw 'Lucid is not defined';
                }
                //----------------------------
                const addressWallet = await lucid.wallet.address();
                const pkh = lucid!.utils.getAddressDetails(addressWallet)?.paymentCredential?.hash;
                const stakePkh = lucid!.utils.getAddressDetails(addressWallet)?.stakeCredential?.hash;
                // const stakePkh = addrToStakePubKeyHash (addressWallet)
                //----------------------------
                if (!pkh) {
                    throw `Can't get Payment Credentials from address`;
                }
                //----------------------------
                console.log('[WalletStore] - Wallet connected with Lucid: pkh: ' + pkh);
                console.log('[WalletStore] - Loading Wallet details...');
                //----------------------------
                const protocolParameters = await lucid.provider.getProtocolParameters();
                //----------------------------
                // let useBlockfrostToSubmit_ = useBlockfrostToSubmit;
                // if (status === 'authenticated') {
                //     if (session && session.user && session.user.useBlockfrostToSubmit) {
                //         useBlockfrostToSubmit_ = session.user.useBlockfrostToSubmit;
                //     }
                // }
                // //----------------------------
                // //seteo a la fuerza el no enviar por blockfrost, por las dudas de que alguien haya creado ya la session con este campo
                // //y yo lo estoy sacando del formulario, no podria desacativarlo
                // useBlockfrostToSubmit_ = false;
                //----------------------------
                const info: ConnectedWalletInfo = {
                    walletNameOrSeedOrKey,
                    address: addressWallet,
                    pkh,
                    stakePkh,
                    useBlockfrostToSubmit: useBlockfrostToSubmit,
                    isWalletFromSeed,
                    isWalletFromKey,
                    network: process.env.NEXT_PUBLIC_CARDANO_NET!,
                    isWalletValidatedWithSignedToken: createSignedSession,
                };
                //----------------------------
                actions.setLucid(lucid);
                if (emulatorDB !== undefined) {
                    actions.setEmulatorDB(emulatorDB);
                }
                actions.setProtocolParameters(protocolParameters);
                actions.setInfo(info);
                //----------------------------
                await actions.loadWalletPrivileges();
                //----------------------------
                state = helpers.getState();
                //----------------------------
                console.log('[WalletStore] - Creating or Updating session... - status: ' + status + ' - session.user.pkh: ' + session?.user?.pkh + ' - pkh: ' + pkh);
                //----------------------------
                let swUpdateSession = status !== 'authenticated';
                if (status === 'authenticated' && session && session.user) {
                    //all the fields must be setted in the session.user
                    let isSessionInvalidOrNoExists = true;
                    if (state.info) {
                        const isSessionValid = await actions.checkSessionValidity({
                            user: session.user,
                            walletInfo: state.info,
                            isCoreTeam: state._isCoreTeam,
                        });
                        isSessionInvalidOrNoExists = !isSessionValid;
                    }
                    swUpdateSession = swUpdateSession || isSessionInvalidOrNoExists;
                }
                //----------------------------
                if (swUpdateSession) {
                    //----------------------------
                    console.log(`[WalletStore] - Need to update Session`);
                    // await signOut({ redirect: false });
                    //--------------------------------------
                    const credentials: Credentials = {
                        address: info.address,
                        walletNameOrSeedOrKey: info.walletNameOrSeedOrKey,
                        useBlockfrostToSubmit: state.info?.useBlockfrostToSubmit ? 'true' : 'false',
                        isWalletFromSeed: state.info?.isWalletFromSeed ? 'true' : 'false',
                        isWalletFromKey: state.info?.isWalletFromKey ? 'true' : 'false',
                    };
                    //--------------------------------------
                    const token = await AuthApi.generateAuthTokensApi(lucid, credentials, createSignedSession);
                    //--------------------------------------
                    console.log(`[WalletStore] - Signin with JWT Token...`);
                    //--------------------------------------
                    const sessionStatus = await signIn('credentials', {
                        token,
                        redirect: false,
                    });
                    //--------------------------------------
                    if (sessionStatus?.ok === false) {
                        throw sessionStatus.error;
                    }
                    //--------------------------------------
                }
                //----------------------------
                actions.setIsConnected(true);
                actions.setIsConnecting(false);
                //----------------------------
                actions.loadWalletData();
                //----------------------------
                console.log(`[WalletStore] - Wallet connected and session OK`);
                //----------------------------
                return isNewConnection;
            } else {
                console.log(`[WalletStore] - Wallet already enabled and connected`);
            }
            //----------------------------
        } catch (error) {
            console.log(`[WalletStore] - connectWallet - Error: ${error}`);
            if (status === 'authenticated') {
                try {
                    await signOut({ redirect: false });
                } catch (error2) {
                    console.log(`[WalletStore] - connectWallet - Error: ${error}`);
                    throw error + ' | ' + error2;
                }
            }
            throw error;
        } finally {
            actions.setIsConnecting(false);
        }
    }),

    disconnectWallet: thunk(async (actions, payload, helpers) => {
        console.log(`[WalletStore] - disconnectWallet - Init`);
        const { session, status } = payload;
        actions.initWallet();
        try {
            if (status === 'authenticated') {
                await signOut({ redirect: false });
            }
        } catch (error) {
            console.log(`[WalletStore] - disconnectWallet - Error: ${error}`);
            throw error;
        }
    }),

    getTotalOfUnit: computed((state) => (unit: string, swOnlyAvailable: boolean = false) => {
        return getTotalOfUnitInUTxOList(unit, state.uTxOsAtWallet, swOnlyAvailable);
    }),

    getTotalNumberOfTokens: computed((state) => {
        const UTxOs = state.uTxOsAtWallet;

        // Collect all token keys from each UTxO's assets
        const allTokenKeys = UTxOs.reduce((accumulatedKeys: string[], utxo) => {
            const assetKeys = Object.keys(utxo.assets || {});
            return accumulatedKeys.concat(assetKeys);
        }, []);

        // Deduplicate the keys to count unique tokens
        const uniqueTokenKeys = new Set(allTokenKeys);

        // The size of the Set represents the count of unique tokens
        const uniqueTokenCount = uniqueTokenKeys.size;

        // console.log(`[WalletStore] - Total unique tokens: ${uniqueTokenCount}`);

        return uniqueTokenCount;
    }),
};
