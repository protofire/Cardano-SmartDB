import { Action, Computed, Thunk, action, computed, thunk } from 'easy-peasy';
import { IWalletStoreModel } from './walletStoreModel.js';
import { SiteSettingsEntity } from '../Entities/SiteSettings.Entity.js';
import { WalletFrontEndApiCalls } from '../FrontEnd/ApiCalls/Wallet.FrontEnd.Api.Calls.js';
import { isEmulator } from '../Commons/Constants/constants.js';

//------------------------------------

export interface IAppStoreModel {
    swInitApiCompleted?: boolean;
    setSwInitApiCompleted: Action<IAppStoreModel, boolean | undefined>;

    isNavigating: boolean;
    setIsNavigating: Action<IAppStoreModel, boolean>;

    navigationTimeoutId: NodeJS.Timeout | null;
    setNavigationTimeoutId: Action<IAppStoreModel, NodeJS.Timeout | null>;

    swExistAnyWallet?: boolean;
    setSwExistAnyWallet: Action<IAppStoreModel, boolean | undefined>;
    checkIfExistAnyWallet: Thunk<IAppStoreModel, undefined, any, {}, Promise<boolean>>;

    siteSettings?: SiteSettingsEntity;
    setSiteSettings: Action<IAppStoreModel, SiteSettingsEntity | undefined>;

    isAppStoreLoading: Computed<IAppStoreModel & IWalletStoreModel, boolean>;
    isAppStoreLoaded: Computed<IAppStoreModel & IWalletStoreModel, boolean>;

    isProcessingTx: boolean;
    setIsProcessingTx: Action<IAppStoreModel, boolean>;
}

export const AppStoreModel: IAppStoreModel = {
    swInitApiCompleted: undefined,
    setSwInitApiCompleted: action((state, swInitApiCompleted) => {
        state.swInitApiCompleted = swInitApiCompleted;
    }),

    isNavigating: false,
    setIsNavigating: action((state, isNavigating) => {
        state.isNavigating = isNavigating;
    }),

    navigationTimeoutId: null,
    setNavigationTimeoutId: action((state, navigationTimeoutId) => {
        state.navigationTimeoutId = navigationTimeoutId;
    }),

    swExistAnyWallet: undefined,
    setSwExistAnyWallet: action((state, swExistAnyWallet) => {
        state.swExistAnyWallet = swExistAnyWallet;
    }),
    checkIfExistAnyWallet: thunk(async (actions, _, helpers) => {
        const state = helpers.getState();
        console.log(`[AppStore] - checkIfExistAnyWallet - Init`);
        try {
            actions.setSwExistAnyWallet(undefined);
            //--------------------------------------
            const { count } = await WalletFrontEndApiCalls.getCountApi_();
            //--------------------------------------
            const result = count > 0;
            //--------------------------------------
            actions.setSwExistAnyWallet(result);
            //--------------------------------------
            console.log(`[AppStore] - checkIfExistAnyWallet - OK`);
            //--------------------------------------
            return result;
            //--------------------------------------
        } catch (error) {
            console.log(`[AppStore] - checkIfExistAnyWallet - Error: ${error}`);
            throw error;
        }
    }),

    siteSettings: undefined,
    setSiteSettings: action((state, payload) => {
        state.siteSettings = new SiteSettingsEntity(payload);
    }),

    isAppStoreLoading: computed((state) => {
        return (
            state.swInitApiCompleted === false ||
            state.siteSettings === undefined ||
            state.swExistAnyWallet === undefined ||
            (isEmulator === true && state.emulatorDB === undefined)
        );
    }),

    isAppStoreLoaded: computed((state) => {
        return (
            state.swInitApiCompleted === true ||
            (
                state.siteSettings !== undefined &&
                state.swExistAnyWallet !== undefined &&
                (isEmulator === false || state.emulatorDB !== undefined))
        );
    }),

    isProcessingTx: false,
    setIsProcessingTx: action((state, payload) => {
        state.isProcessingTx = payload;
    }),

 
};

//------------------------------------
