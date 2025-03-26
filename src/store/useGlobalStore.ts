import { createStore, createTypedHooks } from 'easy-peasy';
import { IAppStoreModel, AppStoreModel } from './appStoreModel.js';
import { IUseAppStore, IUseTokensStore, IUseWalletStore } from './types.js';
import { IWalletStoreModel, WalletStoreModel } from './walletStoreModel.js';
import { ITokensModel, TokensModel } from './tokensStoreModel.js';

interface IGlobalModel extends IWalletStoreModel, IAppStoreModel, ITokensModel {
    // Additional properties or methods can be defined here if needed
}
const GlobalModel: IGlobalModel = {
    ...WalletStoreModel,
    ...AppStoreModel,
    ...TokensModel,
};

export const globalStore = createStore<IGlobalModel>(GlobalModel);

const { useStoreActions, useStoreState, useStoreDispatch, useStore } = createTypedHooks<IGlobalModel>();

export function useWalletStore(): IUseWalletStore {
    const state = useStoreState((state) => state);
    const actions = useStoreActions((actions) => actions);
    return {
        emulatorDB: state.emulatorDB,
        setEmulatorDB: actions.setEmulatorDB,

        cardanoWallets: state.cardanoWallets,
        setCardanoWallets: actions.setCardanoWallets,
        getCardanoWallets: actions.getCardanoWallets,
        isGettingWalletsDone: state.isGettingWalletsDone,

        swDoNotPromtForSigning: state.swDoNotPromtForSigning,
        setSwDoNotPromtForSigning: actions.setSwDoNotPromtForSigning,
        
        swHideBalance: state.swHideBalance,
        setSwHideBalance: actions.setSwHideBalance,

        isConnecting: state.isConnecting,
        isConnected: state.isConnected,

        getLucid: actions.getLucid,
        setLucid: actions.setLucid,
        getLucidForUseAsUtils: actions.getLucidForUseAsUtils,
        setLucidForUseAsUtils: actions.setLucidForUseAsUtils,

        _lucidForUseAsUtils: state._lucidForUseAsUtils,

        protocolParameters: state.protocolParameters,

        info: state.info,

        getPkh: state.getPkh,

        loadWalletPrivileges: actions.loadWalletPrivileges,
        isLoadingAnyData: state.isLoadingAnyData,
        isWalletPrivilegesLoading: state.isWalletPrivilegesLoading,
        isWalletPrivilegesLoaded: state.isWalletPrivilegesLoaded,
        isWalletDataLoading: state.isWalletDataLoading,
        isWalletDataLoaded: state.isWalletDataLoaded,

        uTxOsAtWallet: state.uTxOsAtWallet,
        getUTxOsAtWallet: state.getUTxOsAtWallet,

        isCoreTeam: state.isCoreTeam,

        loadWalletData: actions.loadWalletData,
        checkSessionValidity: actions.checkSessionValidity,
        connectWallet: actions.connectWallet,
        disconnectWallet: actions.disconnectWallet,

        getTotalOfUnit: state.getTotalOfUnit,

        getTotalNumberOfTokens: state.getTotalNumberOfTokens,
    };
}

export function useAppStore(): IUseAppStore {
    
    const state = useStoreState((state) => state);

    const actions = useStoreActions((actions) => actions);
    return {
        swInitApiCompleted: state.swInitApiCompleted,
        setSwInitApiCompleted: actions.setSwInitApiCompleted,
        isNavigating: state.isNavigating,
        setIsNavigating: actions.setIsNavigating,
        navigationTimeoutId: state.navigationTimeoutId,
        setNavigationTimeoutId: actions.setNavigationTimeoutId,
        swExistAnyWallet: state.swExistAnyWallet,
        checkIfExistAnyWallet: actions.checkIfExistAnyWallet,
        siteSettings: state.siteSettings,
        setSiteSettings: actions.setSiteSettings,
        isAppStoreLoading: state.isAppStoreLoading,
        isAppStoreLoaded: state.isAppStoreLoaded,
        isProcessingTx: state.isProcessingTx,
        setIsProcessingTx: actions.setIsProcessingTx,
    };
}

export function useTokensStore(): IUseTokensStore {
    //--------------------------------------
    const state = useStoreState((state) => state);
    const actions = useStoreActions((actions) => actions);
    //--------------------------------------
    return {
        serverTime: state.serverTime,

        isServerTimeLoaded: state.isServerTimeLoaded,

        jobTokensToAdd: state.jobTokensToAdd,
        jobTokensToAddFinished: state.jobTokensToAddFinished,

        createJobTokensToAdd: actions.createJobTokensToAdd,

        getFinishedJobTokensToAdd: state.getFinishedJobTokensToAdd,

        isExecuting: state.isExecuting,
        executeJobsTokensToAdd: actions.executeJobsTokensToAdd,

        tokensWithDetails: state.tokensWithDetails,
        tokensWithDetailsAndValidity: state.tokensWithDetailsAndValidity,

        isAddingTokens: state.isAddingTokens,

        getServerTime: actions.getServerTime,

        intervalIdForUpdateLoop: state.intervalIdForUpdateLoop,
        setDoUpdatePricesAutomatically: actions.setDoUpdatePricesAutomatically,

        beginUpdateLoop: actions.beginUpdateLoop,
        stopUpdateLoop: actions.stopUpdateLoop,

        cleanStore: actions.cleanStore,

        addToken: actions.addToken,
        addTokens: actions.addTokens,

        removeToken: actions.removeToken,

        refreshPrices: actions.refreshPrices,

        isTokenPriceValid: state.isTokenPriceValid,
        getTokenValidity: state.getTokenValidity,
        getTokenPriceAndMetadata: state.getTokenPriceAndMetadata,
        getTokensPriceAndMetadata: state.getTokensPriceAndMetadata,
        getTokenDecimals: state.getTokenDecimals,

        showTokenPriceAndValidity: state.showTokenPriceAndValidity,

        showTokenPrice: state.showTokenPrice,
        showTokenValidity: state.showTokenValidity,

        showTokenWithAmount: state.showTokenWithAmount,
        showTokenPriceMultipliedByAmount: state.showTokenPriceMultipliedByAmount,
    };
}
