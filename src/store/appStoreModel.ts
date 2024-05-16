import { Action, Computed, Thunk, action, computed, thunk } from 'easy-peasy';
import { IWalletStoreModel } from './walletStoreModel.js';
import { SiteSettingsEntity } from '../Entities/SiteSettings.Entity.js';
import { WalletFrontEndApiCalls } from '../FrontEnd/ApiCalls/Wallet.FrontEnd.Api.Calls.js';
import { isEmulator } from '../Commons/Constants/constants.js';

//------------------------------------

export interface IAppStoreModel {
    swInitApiCompleted?: boolean;
    setSwInitApiCompleted: Action<IAppStoreModel, boolean | undefined>;

    swExistAnyWallet?: boolean;
    setSwExistAnyWallet: Action<IAppStoreModel, boolean | undefined>;
    checkIfExistAnyWallet: Thunk<IAppStoreModel>;

    siteSettings?: SiteSettingsEntity;
    setSiteSettings: Action<IAppStoreModel, SiteSettingsEntity | undefined>;

    isAppStoreLoading: Computed<IAppStoreModel & IWalletStoreModel, boolean>;
    isAppStoreLoaded: Computed<IAppStoreModel & IWalletStoreModel, boolean>;
}

export const AppStoreModel: IAppStoreModel = {
    swInitApiCompleted: undefined,
    setSwInitApiCompleted: action((state, swInitApiCompleted) => {
        state.swInitApiCompleted = swInitApiCompleted;
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
            const count = await WalletFrontEndApiCalls.getCountApi_();
            if (count > 0) {
                actions.setSwExistAnyWallet(true);
            } else {
                actions.setSwExistAnyWallet(false);
            }
            //--------------------------------------
            console.log(`[AppStore] - checkIfExistAnyWallet - OK`);
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
            state.siteSettings === undefined ||
            // state.swExistAnyProtocol === undefined ||
            // state.swExistAnyWallet === undefined ||
            // (state.swExistAnyProtocol === true && (state.protocol === undefined || state.protocols === undefined)) ||
            (isEmulator === true && state.emulatorDB === undefined)
        );
    }),

    isAppStoreLoaded: computed((state) => {
        return state.siteSettings !== undefined && state.swExistAnyWallet !== undefined && (isEmulator === false || state.emulatorDB !== undefined);
    }),
};

//------------------------------------
