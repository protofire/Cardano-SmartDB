import { LucidEvolution, UTxO } from '@lucid-evolution/lucid';
import { User } from 'next-auth';
import {
    CS,
    CardanoWallet,
    ConnectedWalletInfo,
    Decimals,
    TN,
    Token,
    Token_With_Price_And_Date_And_Signature_And_Metadata,
    Token_With_Price_And_Date_And_Signature_And_Validity_And_Metadata,
} from '../Commons/types.js';
import { EmulatorEntity } from '../Entities/Emulator.Entity.js';
import { SiteSettingsEntity } from '../Entities/SiteSettings.Entity.js';

export interface IUseAppStore {
    swInitApiCompleted?: boolean;
    setSwInitApiCompleted: (swInitApiCompleted: boolean | undefined) => void;

    isNavigating: boolean;
    setIsNavigating: (isNavigating: boolean) => void;

    navigationTimeoutId: NodeJS.Timeout | null;
    setNavigationTimeoutId: (navigationTimeoutId: NodeJS.Timeout | null) => void;

    swExistAnyWallet?: boolean;
    checkIfExistAnyWallet: () => Promise<boolean>;

    siteSettings?: SiteSettingsEntity;
    setSiteSettings: (siteSettings: SiteSettingsEntity | undefined) => void;

    isAppStoreLoading: boolean;
    isAppStoreLoaded: boolean;

    isProcessingTx: boolean;
    setIsProcessingTx: (isProcessingTx: boolean) => void;
}

export type Token_For_Store = Token_With_Price_And_Date_And_Signature_And_Metadata & { isFT: boolean; tokensInFT: Token[]; followUp?: boolean; keepAlive?: boolean };

export type TokensToAdd = {
    tokens: Partial<Token_For_Store>[];
    swAddPrice?: boolean;
    swAddMetadata?: boolean;
    swCreateMetadataWhenNotFound?: boolean;
    followUp?: boolean;
    job: string;
    keepAlive?: boolean;
};

export type Token_For_Store_With_Validity = Token_With_Price_And_Date_And_Signature_And_Validity_And_Metadata & {
    isFT: boolean;
    tokensInFT: Token[];
    followUp?: boolean;
    keepAlive?: boolean;
};

export interface IUseTokensStore {
    serverTime: number | undefined;
    isServerTimeLoaded: boolean;
    getServerTime: (payload?: { refresh: boolean }) => Promise<number | undefined>;

    jobTokensToAdd: TokensToAdd[];
    jobTokensToAddFinished: TokensToAdd[];

    createJobTokensToAdd: (jobTokensToAdd: TokensToAdd) => void;

    getFinishedJobTokensToAdd: (job: string) => Token_For_Store[] | undefined;

    isExecuting: boolean;
    executeJobsTokensToAdd: () => Promise<void>;

    tokensWithDetails: Token_For_Store[];
    tokensWithDetailsAndValidity: Token_For_Store_With_Validity[];

    isAddingTokens: boolean;

    intervalIdForUpdateLoop?: NodeJS.Timeout;
    setDoUpdatePricesAutomatically: (doUpdatePricesAutomatically: boolean) => void;

    beginUpdateLoop: (payload?: { doUpdatePricesAutomatically: boolean }) => Promise<NodeJS.Timeout | undefined>;
    stopUpdateLoop: (payload?: { cancelFollowUp?: boolean }) => Promise<void>;

    cleanStore: () => Promise<void>;

    addToken: (payload: {
        token: Partial<Token_For_Store>;
        swAddPrice?: boolean;
        swAddMetadata?: boolean;
        swCreateMetadataWhenNotFound?: boolean;
        followUp?: boolean;
        keepAlive?: boolean;
    }) => Promise<Token_For_Store>;
    addTokens: (payload: {
        tokens: Partial<Token_For_Store>[];
        swAddPrice?: boolean;
        swAddMetadata?: boolean;
        swCreateMetadataWhenNotFound?: boolean;
        followUp?: boolean;
        keepAlive?: boolean;
    }) => Promise<Token_For_Store[]>;

    removeToken: (token: { CS: CS; TN_Hex: TN }) => Promise<void>;

    // refreshPrices: (payload?: { forceRefreshFT?: boolean; forceRefreshSubTokensFT?: boolean; forceUseOracle?: boolean }) => Promise<void>;
    refreshPrices: (payload?: { forceRefresh?: boolean; forceUseOracle?: boolean }) => Promise<void>;

    isTokenPriceValid: (CS: CS, TN_Hex: TN) => boolean;
    getTokenValidity: (CS: CS, TN_Hex: TN) => bigint | undefined;
    getTokenPriceAndMetadata: (CS: CS, TN_Hex: TN) => Token_For_Store | undefined;
    getTokensPriceAndMetadata: (tokens: Partial<Token_For_Store>[]) => Token_For_Store[];
    getTokenDecimals: (CS: CS, TN_Hex: TN) => Decimals | undefined;

    showTokenPriceAndValidity: (CS: CS, TN_Hex: TN, swRounded?: boolean, showDecimals?: Decimals) => string;
    showTokenPrice: (CS: CS, TN_Hex: TN, swRounded?: boolean, showDecimals?: Decimals) => string;
    showTokenValidity: (CS: CS, TN_Hex: TN, swAddValidFor?: boolean) => string;

    showTokenWithAmount: (amount: bigint | number | undefined, CS: CS, TN_Hex: TN, swRounded?: boolean, showADecimals?: Decimals) => string;
    showTokenPriceMultipliedByAmount: (
        amount: bigint | number | undefined,
        CS: CS,
        TN_Hex: TN,
        swRounded?: boolean,
        showDecimals?: Decimals,
        decimalsInAmount?: Decimals
    ) => string;
}

export interface IUseWalletStore {
    emulatorDB?: EmulatorEntity;
    setEmulatorDB: (emulator: EmulatorEntity) => void;

    cardanoWallets: CardanoWallet[];
    setCardanoWallets: (cardanoWallets: CardanoWallet[]) => void;
    getCardanoWallets: () => void;
    isGettingWalletsDone: boolean;

    swDoNotPromtForSigning: boolean;
    setSwDoNotPromtForSigning: (swDoNotPromtForSigning: boolean) => void;

    swHideBalance: boolean;
    setSwHideBalance: (swHideBalance: boolean) => void;

    isConnecting: boolean;
    isConnected: boolean;

    getLucid: (payload?: { emulatorDB?: EmulatorEntity }) => Promise<LucidEvolution | undefined>;
    setLucid: (lucid: LucidEvolution) => void;

    getLucidForUseAsUtils: () => Promise<LucidEvolution | undefined>;
    setLucidForUseAsUtils: (lucid: LucidEvolution) => void;
    _lucidForUseAsUtils: LucidEvolution | undefined;

    protocolParameters: unknown;

    info: ConnectedWalletInfo | undefined;

    getPkh: (swUseSession?: boolean, session?: any, status?: any) => string | undefined;
    isLoadingAnyData: boolean;

    loadWalletPrivileges: () => Promise<void>;
    isWalletPrivilegesLoading: boolean;
    isWalletPrivilegesLoaded: boolean;

    isWalletDataLoading: boolean;
    isWalletDataLoaded: boolean;

    uTxOsAtWallet: UTxO[];
    getUTxOsAtWallet: () => UTxO[];

    isCoreTeam: (swUseSession?: boolean, session?: any, status?: any) => boolean;

    loadWalletData: (payload?: {}) => Promise<void>;

    checkSessionValidity: (params: { user: User; walletInfo: ConnectedWalletInfo; isCoreTeam: boolean }) => Promise<boolean>;

    connectWallet: (params: {
        session: any;
        status: any;
        walletName: string;
        walletSeed?: string;
        walletKey?: string;
        tryAgain: boolean;
        useBlockfrostToSubmit: boolean;
        isWalletFromSeed: boolean;
        isWalletFromKey: boolean;
        forceConnect?: boolean;
        emulatorDB?: EmulatorEntity;
        createSignedSession: boolean;
    }) => Promise<boolean>;

    disconnectWallet: (params: { session: any; status: any }) => Promise<void>;

    getTotalOfUnit: (unit: string, swOnlyAvailable?: boolean) => bigint;

    getTotalNumberOfTokens: number;
}
