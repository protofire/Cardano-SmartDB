import { Action, Computed, Thunk, action, computed, thunk } from 'easy-peasy';
import {
    TOKEN_ADA_DECIMALS,
    TOKEN_ADA_SYMBOL,
    MAX_PRICE_AGE_FOR_APROXIMATED_USE_MS,
    MAX_PRICE_AGE_FOR_USE_MS,
    SYNC_SERVER_TIME_ALWAYS_MS,
    getNumberx1e6,
    hexToStr,
    isTokenADA,
    isToken_CS_And_TN_Valid,
    PRICEx1e6_DECIMALS,
} from '../Commons/index.js';
import { CS, Decimals, TN, Token_With_Price_And_Date_And_Signature } from '../Commons/types.js';
import { TokenMetadataEntity } from '../Entities/index.js';
import { PriceFrontEndApiCalls, TokenMetadataFrontEndApiCalls } from '../FrontEnd/index.js';
import { TimeApi } from '../lib/index.js';
import { TokensToAdd as JobTokensToAdd, Token_For_Store, Token_For_Store_With_Validity } from './types.js';
import { formatAmountWithUnit } from '../Commons/formatters.js';

//------------------------------------

export interface ITokensModel {
    serverTime: number | undefined;
    setServerTime: Action<ITokensModel, number | undefined>;

    serverTimeLastFetch: number | undefined;
    setServerTimeLastFetch: Action<ITokensModel, number | undefined>;

    serverTimeDiffWithBrowser: number | undefined;
    setServerTimeDiffWithBrowser: Action<ITokensModel, number | undefined>;

    isServerTimeLoaded: boolean;
    setIsServerTimeLoaded: Action<ITokensModel, boolean>;

    getServerTime: Thunk<ITokensModel, { refresh?: boolean } | undefined, any, any, Promise<number | undefined>>;

    jobTokensToAdd: JobTokensToAdd[];
    setJobTokensToAdd: Action<ITokensModel, JobTokensToAdd[]>;

    jobTokensToAddFinished: JobTokensToAdd[];
    setJobTokensToAddFinished: Action<ITokensModel, JobTokensToAdd[]>;

    createJobTokensToAdd: Action<ITokensModel, JobTokensToAdd>;

    getFinishedJobTokensToAdd: Computed<ITokensModel, (job: string) => Token_For_Store[] | undefined>;

    isExecuting: boolean;
    setIsExecuting: Action<ITokensModel, boolean>;
    executeJobsTokensToAdd: Thunk<ITokensModel>;

    tokensWithDetails: Token_For_Store[];
    setTokensWithDetails_: Action<ITokensModel, Token_For_Store[]>;
    setTokensWithDetails: Thunk<ITokensModel, Token_For_Store[]>;

    tokensWithDetailsAndValidity: Token_For_Store_With_Validity[];
    setTokensWithDetailsAndValidity: Action<ITokensModel, Token_For_Store_With_Validity[]>;

    isAddingTokens: boolean;
    setIsAddingTokens: Action<ITokensModel, boolean>;

    intervalIdForUpdateLoop: NodeJS.Timeout | undefined;
    setIntervalIdForUpdateLoop: Action<ITokensModel, NodeJS.Timeout | undefined>;

    doUpdatePricesAutomatically: boolean;
    setDoUpdatePricesAutomatically: Action<ITokensModel, boolean>;

    beginUpdateLoop: Thunk<ITokensModel, { doUpdatePricesAutomatically?: boolean } | undefined, any, any, Promise<NodeJS.Timeout | undefined>>;
    stopUpdateLoop: Thunk<ITokensModel, { cancelFollowUp?: boolean } | undefined>;

    cleanStore: Thunk<ITokensModel>;

    addToken: Thunk<
        ITokensModel,
        { token: Partial<Token_For_Store>; swAddPrice?: boolean; swAddMetadata?: boolean; swCreateMetadataWhenNotFound?: boolean; followUp?: boolean; keepAlive?: boolean },
        Promise<Token_For_Store>
    >;

    addTokens: Thunk<
        ITokensModel,
        { tokens: Partial<Token_For_Store>[]; swAddPrice?: boolean; swAddMetadata?: boolean; swCreateMetadataWhenNotFound?: boolean; followUp?: boolean; keepAlive?: boolean },
        Promise<Token_For_Store[]>
    >;

    removeToken: Thunk<ITokensModel, { CS: CS; TN_Hex: TN }>;

    // refreshPrices: Thunk<ITokensStoreModel, { forceRefreshFT?: boolean; forceRefreshSubTokensFT?: boolean; forceUseOracle?: boolean } | undefined>;
    refreshPrices: Thunk<ITokensModel, { forceRefresh?: boolean; forceUseOracle?: boolean } | undefined>;

    isTokenPriceValid: Computed<ITokensModel, (CS: CS, TN_Hex: TN) => boolean>;
    getTokenValidity: Computed<ITokensModel, (CS: CS, TN_Hex: TN) => bigint | undefined>;
    getTokenPriceAndMetadata: Computed<ITokensModel, (CS: CS, TN_Hex: TN) => Token_For_Store | undefined>;
    getTokensPriceAndMetadata: Computed<ITokensModel, (tokens: Partial<Token_For_Store>[]) => Token_For_Store[]>;
    getTokenDecimals: Computed<ITokensModel, (CS: CS, TN_Hex: TN) => Decimals | undefined>;

    showTokenPriceAndValidity: Computed<ITokensModel, (CS: CS, TN_Hex: TN, swRounded?: boolean, showDecimals?: Decimals) => string>;
    showTokenPrice: Computed<ITokensModel, (CS: CS, TN_Hex: TN, swRounded?: boolean, showDecimals?: Decimals) => string>;
    showTokenValidity: Computed<ITokensModel, (CS: CS, TN_Hex: TN, swAddValidFor?: boolean) => string>;

    showTokenWithAmount: Computed<ITokensModel, (amount: bigint | number | undefined, CS: CS, TN_Hex: TN, swRounded?: boolean, showDecimals?: Decimals) => string>;

    showTokenPriceMultipliedByAmount: Computed<
        ITokensModel,
        (amount: bigint | number | undefined, CS: CS, TN_Hex: TN, swRounded?: boolean, showDecimals?: Decimals, decimalsInAmount?: Decimals) => string
    >;
}

export const TokensModel: ITokensModel = {
    //----------------------------
    serverTime: undefined,
    setServerTime: action((state, payload) => {
        state.serverTime = payload;
    }),
    //----------------------------
    serverTimeLastFetch: undefined,
    setServerTimeLastFetch: action((state, payload) => {
        state.serverTimeLastFetch = payload;
    }),
    //----------------------------
    serverTimeDiffWithBrowser: undefined,
    setServerTimeDiffWithBrowser: action((state, payload) => {
        state.serverTimeDiffWithBrowser = payload;
    }),
    //----------------------------
    isServerTimeLoaded: false,
    setIsServerTimeLoaded: action((state, payload) => {
        state.isServerTimeLoaded = payload;
    }),
    //----------------------------
    getServerTime: thunk(async (actions, payload, helpers): Promise<number | undefined> => {
        //----------------------------
        let state = helpers.getState();
        //----------------------------
        let serverTime: number | undefined = undefined;
        let refreshServerTime = payload?.refresh ?? false;
        //----------------
        if (refreshServerTime === false && state.serverTime !== undefined && state.serverTimeLastFetch !== undefined) {
            // si pasaron mas de 10 minutos refresca siempre
            // si no, no refresca
            //--------------------------------------
            const now = Date.now();
            //--------------------------------------
            const diff = now - state.serverTimeLastFetch;
            refreshServerTime = diff > SYNC_SERVER_TIME_ALWAYS_MS;
            //--------------------------------------
        }
        //----------------
        if (state.serverTime === undefined || state.serverTimeDiffWithBrowser === undefined || state.serverTimeLastFetch === undefined || refreshServerTime === true) {
            //--------------------------------------
            console.log(`[TokensStore] - getServerTime - get real from server`);
            //----------------------------
            serverTime = await TimeApi.getServerTimeApi();
            //--------------------------------------
            const now = Date.now();
            //--------------------------------------
            actions.setServerTime(serverTime);
            //console.log(`ServerTime: ${serverTime} - JUST FECTH FROM SERVER - ${convertMillisToTime(serverTime!)}`);
            actions.setServerTimeLastFetch(now);
            actions.setServerTimeDiffWithBrowser(serverTime - now);
            actions.setIsServerTimeLoaded(true);
            //--------------------------------------
        } else {
            //--------------------------------------
            const now = Date.now();
            serverTime = now + state.serverTimeDiffWithBrowser;
            actions.setServerTime(serverTime);
            //--------------------------------------
        }
        return serverTime;
    }),
    //---------------------------
    jobTokensToAdd: [],
    //---------------------------
    setJobTokensToAdd: action((state, payload) => {
        state.jobTokensToAdd = payload;
    }),
    //---------------------------
    jobTokensToAddFinished: [],
    //---------------------------
    setJobTokensToAddFinished: action((state, payload) => {
        state.jobTokensToAddFinished = payload;
    }),
    //---------------------------
    createJobTokensToAdd: action((state, payload) => {
        //----------------------------
        const { job, tokens, followUp, keepAlive, swAddPrice, swAddMetadata, swCreateMetadataWhenNotFound } = payload;
        //----------------------------
        if (state.jobTokensToAdd.some((job) => job.job === payload.job)) {
            console.log(`[TokensStore] - Job: ${job} - createJobTokensToAdd - error job already exists`);
            return;
        }
        //----------------------------
        console.log(
            `[TokensStore] - Job: ${job} - createJobTokensToAdd - Tokens: ${tokens
                ?.map((t) => hexToStr(t.TN_Hex))
                .join(
                    ', '
                )} - followUp: ${followUp} - swAddPrice: ${swAddPrice} - swAddMetadata: ${swAddMetadata} - swCreateMetadataWhenNotFound: ${swCreateMetadataWhenNotFound} - keepAlive: ${keepAlive}`
        );
        //----------------------------
        state.jobTokensToAdd.push(payload);
    }),
    //----------------------------
    getFinishedJobTokensToAdd: computed((state) => (job: string): Token_For_Store[] | undefined => {
        //----------------------------
        const tokensToAddJob = state.jobTokensToAddFinished.find((token) => token.job === job);
        //----------------------------
        if (tokensToAddJob === undefined) {
            return undefined;
        }
        //----------------------------
        // console.log(`[TokensStore] - Job: ${job} - getFinishedJobTokensToAdd - Init - len finished: ${state.jobTokensToAddFinished.length}`);
        //----------------------------
        const tokensToAddTokens = tokensToAddJob.tokens;
        const tokensWithMetadataAndPrice = tokensToAddTokens
            .map((token) => {
                return state.tokensWithDetails.find((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) || undefined;
            })
            .filter((token) => token !== undefined); // Filter out any null values (tokens not found)
        //----------------------------
        state.jobTokensToAddFinished = [...state.jobTokensToAddFinished].filter((tokenJob) => tokenJob.job !== job);
        //----------------------------
        // console.log(`[TokensStore] - Job: ${job} - getFinishedJobTokensToAdd - OK - len finished: ${state.jobTokensToAddFinished.length} - len tokens: ${tokensWithMetadataAndPrice.length}`);
        //-----------------------
        console.log(`[TokensStore] - Job: ${job} - getFinishedJobTokensToAdd - OK - Tokens: ${tokensWithMetadataAndPrice?.map((t) => hexToStr(t?.TN_Hex)).join(', ')}`);
        //-----------------------
        return tokensWithMetadataAndPrice as Token_For_Store[];
    }),
    //----------------------------
    isExecuting: false,
    setIsExecuting: action((state, payload) => {
        state.isExecuting = payload;
    }),
    //----------------------------
    executeJobsTokensToAdd: thunk(async (actions, payload, helpers) => {
        //----------------------------
        // console.log(`[TokensStore] - executeJobsTokensToAdd - Init`);
        //----------------------------
        let state = helpers.getState();
        //----------------------------
        const jobTokensToAdd = [...state.jobTokensToAdd];
        //----------------------------
        actions.setIsExecuting(true);
        actions.setJobTokensToAdd([]);
        //----------------------------
        // let count = 0;
        // for (const tokenToAdd of jobTokensToAdd) {
        //     console.log(`[TokensStore] - executing adding tokens - Job: ${tokenToAdd.job} - ${count++ + 1} of ${state.jobTokensToAdd.length}`);
        //     await actions.addTokens({
        //         tokens: tokenToAdd.tokens,
        //         swAddPrice: tokenToAdd.swAddPrice,
        //         swAddMetadata: tokenToAdd.swAddMetadata,
        //         followUp: tokenToAdd.followUp,
        //         keepAlive: tokenToAdd.keepAlive,
        //     });
        // }
        //----------------------------
        const groupedJobs = jobTokensToAdd.reduce((acc: Record<string, JobTokensToAdd>, tokenToAdd) => {
            //----------------------------
            const key = `${tokenToAdd.swAddPrice}-${tokenToAdd.swAddMetadata}-${tokenToAdd.swCreateMetadataWhenNotFound}-${tokenToAdd.followUp}-${tokenToAdd.keepAlive}`;
            //----------------------------
            if (!acc[key]) {
                acc[key] = {
                    tokens: [],
                    swAddPrice: tokenToAdd.swAddPrice,
                    swAddMetadata: tokenToAdd.swAddMetadata,
                    swCreateMetadataWhenNotFound: tokenToAdd.swCreateMetadataWhenNotFound,
                    followUp: tokenToAdd.followUp,
                    keepAlive: tokenToAdd.keepAlive,
                    job: '',
                } as JobTokensToAdd;
            }
            //----------------------------
            acc[key].tokens.push(...tokenToAdd.tokens);
            acc[key].job = acc[key].job + (acc[key].job.length > 0 ? ', ' : '') + tokenToAdd.job;
            //----------------------------
            return acc;
        }, {});
        //----------------------------
        let count = 0;
        //----------------------------
        const keys = Object.keys(groupedJobs);
        //----------------------------
        for (const key of keys) {
            //----------------------------
            console.log(`[TokensStore] - executing adding grouped tokens - Group: ${count + 1} of ${keys.length} - Jobs: ${groupedJobs[key].job}`);
            //----------------------------
            await actions.addTokens({
                tokens: groupedJobs[key].tokens,
                swAddPrice: groupedJobs[key].swAddPrice,
                swAddMetadata: groupedJobs[key].swAddMetadata,
                swCreateMetadataWhenNotFound: groupedJobs[key].swCreateMetadataWhenNotFound,
                followUp: groupedJobs[key].followUp,
                keepAlive: groupedJobs[key].keepAlive,
            });
            //----------------------------
            count++;
        }

        //----------------------------
        // state = helpers.getState();
        //----------------------------
        actions.setJobTokensToAddFinished([...state.jobTokensToAddFinished, ...jobTokensToAdd]);
        //----------------------------
        actions.setIsExecuting(false);
        //----------------------------
        // console.log(`[TokensStore] - executeJobsTokensToAdd - All Jobs done`);
        //----------------------------
        return true;
    }),
    //----------------------------
    tokensWithDetails: [],
    setTokensWithDetails_: action((state, payload) => {
        state.tokensWithDetails = payload;
    }),
    //----------------------------
    setTokensWithDetails: thunk(async (actions, payload, helpers) => {
        //----------------------------
        console.log(`[TokensStore] - setTokensWithDetails - ${payload.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')}`);
        //----------------------------
        const tokensWithDetails = payload;
        actions.setTokensWithDetails_(tokensWithDetails);
        //----------------
        let serverTime = await actions.getServerTime();
        //----------------
        if (serverTime === undefined) {
            throw `serverTime is undefined`;
        }
        //----------------
        const newTokensWithDetailsAndValidity: Token_For_Store_With_Validity[] = [];
        //----------------
        tokensWithDetails
            .filter((token) => token.followUp === true)
            .map((token) => {
                if (token !== undefined && token.date !== undefined) {
                    const currentTimeMs = serverTime!;
                    const priceTimeMs = Number(token.date.toString());
                    const expiryTimeMs = priceTimeMs + MAX_PRICE_AGE_FOR_USE_MS;
                    const validTimeSecs = BigInt(Math.floor((expiryTimeMs - currentTimeMs) / 1000));
                    const newTokenWithDetailsAndValidity: Token_For_Store_With_Validity = { ...token, validity: validTimeSecs };
                    newTokensWithDetailsAndValidity.push(newTokenWithDetailsAndValidity);
                }
            });
        //----------------
        actions.setTokensWithDetailsAndValidity(newTokensWithDetailsAndValidity);
        //----------------
        // if (doLoop) {
        //     await actions.beginUpdateLoop({ doUpdatePricesAutomatically: state.doUpdatePricesAutomatically });
        // }
        //----------------
    }),
    //----------------------------
    tokensWithDetailsAndValidity: [],
    setTokensWithDetailsAndValidity: action((state, payload) => {
        state.tokensWithDetailsAndValidity = payload;
    }),
    //----------------------------
    isAddingTokens: false,
    setIsAddingTokens: action((state, payload) => {
        state.isAddingTokens = payload;
    }),
    //----------------------------
    intervalIdForUpdateLoop: undefined,
    setIntervalIdForUpdateLoop: action((state, payload) => {
        state.intervalIdForUpdateLoop = payload;
    }),
    //----------------------------
    doUpdatePricesAutomatically: true,
    setDoUpdatePricesAutomatically: action((state, payload) => {
        state.doUpdatePricesAutomatically = payload;
    }),
    //----------------------------
    beginUpdateLoop: thunk(async (actions, payload, helpers): Promise<NodeJS.Timeout | undefined> => {
        //----------------------------
        console.log(`[TokensStore] - beginUpdateLoop`);
        //----------------------------
        let state = helpers.getState();
        //----------------------------
        if (state.intervalIdForUpdateLoop !== undefined) {
            clearInterval(state.intervalIdForUpdateLoop);
            actions.setIntervalIdForUpdateLoop(undefined);
        }
        //----------------------------
        let intervalIdForUpdateLoop: NodeJS.Timeout | undefined = undefined;
        //----------------
        actions.setDoUpdatePricesAutomatically(payload?.doUpdatePricesAutomatically ?? true);
        //----------------
        const updateLoop = async () => {
            //----------------------------
            // console.log(`[TokensStore] - updateLoop`);
            //----------------------------
            let state = helpers.getState();
            //----------------------------
            const newTokensWithDetailsAndValidity: Token_For_Store_With_Validity[] = [];
            const newInvalidTokensWithDetailsAndValidity: Token_For_Store_With_Validity[] = [];
            //----------------------------
            let serverTime = await actions.getServerTime();
            //----------------
            for (const token_ of state.tokensWithDetails) {
                //----------------------------
                if (token_ !== undefined && token_.date !== undefined && token_.followUp === true) {
                    //----------------------------
                    serverTime = await actions.getServerTime();
                    //----------------
                    //console.log(`ServerTime: ${serverTime} - ${convertMillisToTime(serverTime!)}`);
                    //----------------
                    if (serverTime === undefined) {
                        throw `serverTime is undefined`;
                    }
                    //----------------
                    const currentTimeMs = serverTime!;
                    const priceTimeMs = Number(token_.date.toString());
                    const expiryTimeMs = priceTimeMs + MAX_PRICE_AGE_FOR_USE_MS;
                    //----------------
                    const validTimeSecs = BigInt(Math.floor((expiryTimeMs - currentTimeMs) / 1000));
                    //----------------
                    const newTokenWithDetailsAndValidity: Token_For_Store_With_Validity = { ...token_, validity: validTimeSecs };
                    //----------------
                    newTokensWithDetailsAndValidity.push(newTokenWithDetailsAndValidity);
                    //----------------
                    if (validTimeSecs < 0 && state.doUpdatePricesAutomatically) {
                        newInvalidTokensWithDetailsAndValidity.push(newTokenWithDetailsAndValidity);
                    }
                    //----------------
                }
            }
            //----------------
            actions.setTokensWithDetailsAndValidity(newTokensWithDetailsAndValidity);
            //----------------
            if (state.doUpdatePricesAutomatically === true && newInvalidTokensWithDetailsAndValidity.length > 0) {
                //----------------
                console.log(`[TokensStore] - isLoading Previus: - ${state.isAddingTokens}`);
                // console.log ('setDoUpdatePricesAutomatically2');
                // alert('setDoUpdatePricesAutomatically2');
                //----------------
                actions.setIsAddingTokens(true);
                //----------------
                const newTokensWithDetails: Token_For_Store[] = state.tokensWithDetails;
                //----------------
                let tokensToUpdateWithNewPrices: Token_With_Price_And_Date_And_Signature[] = [];
                //----------------
                try {
                    tokensToUpdateWithNewPrices = await PriceFrontEndApiCalls.get_Tokens_PriceADAx1e6_Api(
                        newInvalidTokensWithDetailsAndValidity.map((token) => ({ CS: token.CS, TN_Hex: token.TN_Hex })),
                        true
                    );
                } catch (error) {
                    console.error(`[TokensStore] - Error getting tokens prices: ${error}`);
                }
                //----------------
                newInvalidTokensWithDetailsAndValidity.map((token) => {
                    const tokenToUpdateWithNewPrice = tokensToUpdateWithNewPrices.find((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex);
                    if (tokenToUpdateWithNewPrice !== undefined) {
                        token.priceADAx1e6 = tokenToUpdateWithNewPrice?.priceADAx1e6;
                        token.date = tokenToUpdateWithNewPrice?.date;
                        token.signature = tokenToUpdateWithNewPrice?.signature;
                        //----------------------------
                        const index = newTokensWithDetails.findIndex((token_) => token.CS === token_.CS && token.TN_Hex === token_.TN_Hex);
                        newTokensWithDetails[index] = token;
                        //----------------------------
                    }
                });
                //----------------------------
                actions.setTokensWithDetails(newTokensWithDetails);
                //----------------------------
                actions.setIsAddingTokens(false);
                //----------------------------
            }
        };
        //----------------
        await updateLoop(); // Call it once immediately
        //----------------
        intervalIdForUpdateLoop = setInterval(updateLoop, 1000); // Then set up the interval
        //----------------
        actions.setIntervalIdForUpdateLoop(intervalIdForUpdateLoop);
        //----------------
        // Handle the cleanup (interval clearing) when the component unmounts or tokensWithDetails changes
        // When you call this thunk inside a useEffect in your component,
        // it ensures that the interval gets cleared when the component unmounts or when the dependencies change.
        // useEffect(() => {
        //     return () => {
        //         tokensStore.stopUpdateLoop();
        //     };
        // }, []);
        return intervalIdForUpdateLoop;
    }),
    //----------------------------
    stopUpdateLoop: thunk(async (actions, payload, helpers) => {
        //----------------------------
        const cancelFollowUp = payload?.cancelFollowUp ?? false;
        //----------------------------
        console.log(`[TokensStore] - stopUpdateLoop`);
        //----------------------------
        let state = helpers.getState();
        //----------------------------
        if (state.intervalIdForUpdateLoop !== undefined) {
            clearInterval(state.intervalIdForUpdateLoop);
            actions.setIntervalIdForUpdateLoop(undefined);
        }
        //-----------------------
        if (cancelFollowUp === true) {
            //-----------------------
            //set followUp to false for all tokens
            const newTokensWithDetails = [...state.tokensWithDetails.map((token) => ({ ...token, followUp: false }))]; // Create a copy
            //-----------------------
            await actions.setTokensWithDetails(newTokensWithDetails);
            //----------------------------
        }
    }),
    //----------------------------
    cleanStore: thunk(async (actions, payload, helpers) => {
        //----------------------------
        console.log(`[TokensStore] - cleanStore`);
        //----------------------------
        await actions.stopUpdateLoop();
        //----------------------------
        actions.setJobTokensToAdd([]);
        actions.setJobTokensToAddFinished([]);
        await actions.setTokensWithDetails([]);
        //----------------------------
    }),
    //----------------------------
    addToken: thunk(async (actions, payload, helpers) => {
        //----------------------------
        const { token: newToken } = payload;
        const swAddPrice = payload.swAddPrice ?? true;
        const swAddMetadata = payload.swAddMetadata ?? true;
        const swCreateMetadataWhenNotFound = payload.swCreateMetadataWhenNotFound ?? true;
        const followUp = payload.followUp;
        const keepAlive = payload.keepAlive;
        //----------------------------
        const results: Token_For_Store[] = await actions.addTokens({ tokens: [newToken], swAddPrice, swAddMetadata, swCreateMetadataWhenNotFound, followUp, keepAlive });
        //----------------------------
        if (results.length > 0) {
            return results[0];
        }
        //----------------------------
    }),
    //----------------------------
    addTokens: thunk(async (actions, payload, helpers) => {
        //----------------------------
        const { tokens: newTokens } = payload;
        const swAddPrice = payload.swAddPrice ?? true;
        const swAddMetadata = payload.swAddMetadata ?? true;
        const swCreateMetadataWhenNotFound = payload.swCreateMetadataWhenNotFound ?? true;
        const followUp = payload.followUp;
        const keepAlive = payload.keepAlive;
        //----------------------------
        console.log(
            `[TokensStore] - addTokens - Tokens: ${newTokens
                .map((token) => `${hexToStr(token.TN_Hex)}`)
                .join(
                    ', '
                )} - followUp: ${followUp} - swAddPrice: ${swAddPrice} - swAddMetadata: ${swAddMetadata} - swCreateMetadataWhenNotFound: ${swCreateMetadataWhenNotFound} -keepAlive: ${keepAlive}`
        );
        //----------------------------
        let state = helpers.getState();
        //----------------------------
        const tokensAll: Partial<Token_For_Store>[] = newTokens;
        //-----------------------
        //get all the differents
        const uniqueTokensMap = new Map();
        tokensAll.forEach((token) => {
            const uniqueKey = `${token.CS}-${token.TN_Hex}`; // Combine CS and TN_Hex to create a unique key
            if (!uniqueTokensMap.has(uniqueKey)) {
                uniqueTokensMap.set(uniqueKey, token);
            }
        });
        //-----------------------
        const uniqueTokens = Array.from(uniqueTokensMap.values()) as Partial<Token_For_Store>[];
        //-----------------------
        if (
            uniqueTokens.some(
                (newToken) =>
                    (newToken.priceADAx1e6 === undefined && swAddPrice) ||
                    ((newToken.ticker === undefined || newToken.decimals === undefined || newToken.image === undefined || newToken.colorHex === undefined) && swAddMetadata)
            )
        ) {
            //    || newToken.metadata_raw === undefined
            actions.setIsAddingTokens(true);
        }
        //-----------------------
        let newTokensWithDetails = [...state.tokensWithDetails]; // Create a copy
        //-----------------------
        const tokensToUpdatePrice: Partial<Token_For_Store>[] = [];
        const tokensToUpdatePriceWithForceRefresh: Partial<Token_For_Store>[] = [];
        const tokensToUpdateMetadata: Partial<Token_For_Store>[] = [];
        //-----------------------
        for (const newToken of uniqueTokens) {
            //----------------------------
            if (!isToken_CS_And_TN_Valid(newToken.CS, newToken.TN_Hex)) {
                console.error(`[TokensStore] - addTokens - invalid CS or TN_Hex - ${newToken.CS} - ${newToken.TN_Hex}`);
                continue;
            }
            //-----------------------
            const priceIndex = newTokensWithDetails.findIndex((price) => price.CS === newToken.CS && price.TN_Hex === newToken.TN_Hex);
            //-----------------------
            if (priceIndex === -1) {
                // si no lo estoy siguiendo
                //-----------------------
                if ((newToken.priceADAx1e6 === undefined || newToken.date === undefined) && swAddPrice) {
                    //-----------------------
                    const finalFolloUp = newToken.followUp ?? followUp;
                    //-----------------------
                    if (finalFolloUp === true) {
                        tokensToUpdatePriceWithForceRefresh.push(newToken);
                    } else {
                        tokensToUpdatePrice.push(newToken);
                    }
                }
                //-----------------------
                if ((newToken.ticker === undefined || newToken.decimals === undefined || newToken.image === undefined || newToken.colorHex === undefined) && swAddMetadata) {
                    tokensToUpdateMetadata.push(newToken);
                }
            } else {
                //-----------------------
                // si lo estoy siguiendo,
                //-----------------------
                const oldToken = newTokensWithDetails[priceIndex];
                //-----------------------
                // primero reviso si el nuevo token tiene o no precio y si quiero tenerlo
                //-----------------------
                if ((newToken.priceADAx1e6 === undefined || newToken.date === undefined) && swAddPrice) {
                    //-----------------------
                    const finalFolloUp = newToken.followUp ?? followUp;
                    //-----------------------
                    if (finalFolloUp === true) {
                        tokensToUpdatePriceWithForceRefresh.push(newToken);
                    } else {
                        // si no tiene precio, quiero tenerlo, pero no es folloUp, puedo ver si el antiguo tiene, si no, lo busco
                        if (oldToken.priceADAx1e6 === undefined || oldToken.date === undefined) {
                            tokensToUpdatePrice.push(newToken);
                        }
                    }
                }
                //-----------------------
                // luego reviso si el nuevo token tiene o no metadata y si quiero tenerla
                if ((newToken.ticker === undefined || newToken.decimals === undefined || newToken.image === undefined || newToken.colorHex === undefined) && swAddMetadata) {
                    // si no tiene metadata, quiero tenerla, puedo ver si el antiguo tiene, si no, lo busco
                    if (oldToken.ticker === undefined || oldToken.decimals === undefined || oldToken.image === undefined || oldToken.colorHex === undefined) {
                        tokensToUpdateMetadata.push(newToken);
                    }
                }
            }
        }
        //-----------------------
        let tokensToUpdateWithNewPrices: Token_With_Price_And_Date_And_Signature[] = [];
        if (tokensToUpdatePrice.length > 0) {
            //-----------------------
            console.log(`[TokensStore] - addTokens - Tokens: ${tokensToUpdatePrice.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')} - Fetching prices...`);
            //-----------------------
            tokensToUpdateWithNewPrices = await PriceFrontEndApiCalls.get_Tokens_PriceADAx1e6_Api(
                tokensToUpdatePrice.map((token) => ({ CS: token.CS!, TN_Hex: token.TN_Hex! })),
                false,
                MAX_PRICE_AGE_FOR_APROXIMATED_USE_MS
            );
        }
        let tokensToUpdateWithForceRefreshWithNewPrices: Token_With_Price_And_Date_And_Signature[] = [];
        if (tokensToUpdatePriceWithForceRefresh.length > 0) {
            //-----------------------
            console.log(`[TokensStore] - addTokens - Tokens: ${tokensToUpdatePriceWithForceRefresh.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')} - Fetching prices...`);
            //-----------------------
            tokensToUpdateWithForceRefreshWithNewPrices = await PriceFrontEndApiCalls.get_Tokens_PriceADAx1e6_Api(
                tokensToUpdatePriceWithForceRefresh.map((token) => ({ CS: token.CS!, TN_Hex: token.TN_Hex! })),
                true
            );
        }
        let tokensToUpdateMetadataWithNewMetadata: TokenMetadataEntity[] = [];
        if (tokensToUpdateMetadata.length > 0) {
            //-----------------------
            console.log(`[TokensStore] - addTokens - Tokens: ${tokensToUpdateMetadata.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')} - Fetching metadatas...`);
            //-----------------------
            tokensToUpdateMetadataWithNewMetadata = await TokenMetadataFrontEndApiCalls.get_Tokens_MetadataApi(
                tokensToUpdateMetadata.map((token) => ({ CS: token.CS!, TN_Hex: token.TN_Hex! })),
                undefined,
                swCreateMetadataWhenNotFound,
                TokenMetadataEntity.optionsGetForTokenStore
            );
        }
        //----------------
        for (const newToken of uniqueTokens) {
            //-----------------------
            let tokenToUpdateWithNewPrice = tokensToUpdateWithNewPrices.find((token_) => token_.CS === newToken.CS && token_.TN_Hex === newToken.TN_Hex);
            //-----------------------
            if (tokenToUpdateWithNewPrice === undefined) {
                tokenToUpdateWithNewPrice = tokensToUpdateWithForceRefreshWithNewPrices.find((token_) => token_.CS === newToken.CS && token_.TN_Hex === newToken.TN_Hex);
            }
            //-----------------------
            if (tokenToUpdateWithNewPrice !== undefined) {
                newToken.priceADAx1e6 = tokenToUpdateWithNewPrice.priceADAx1e6;
                newToken.date = tokenToUpdateWithNewPrice.date;
                newToken.signature = tokenToUpdateWithNewPrice.signature;
            }
            //-----------------------
            const tokenToUpdateMetadataWithNewMetadata = tokensToUpdateMetadataWithNewMetadata.find((token_) => token_.CS === newToken.CS && token_.TN_Hex === newToken.TN_Hex);
            //-----------------------
            if (tokenToUpdateMetadataWithNewMetadata !== undefined) {
                newToken.ticker = tokenToUpdateMetadataWithNewMetadata.ticker;
                newToken.decimals = tokenToUpdateMetadataWithNewMetadata.decimals;
                newToken.image = tokenToUpdateMetadataWithNewMetadata.image;
                newToken.colorHex = tokenToUpdateMetadataWithNewMetadata.colorHex;
                newToken.metadata_raw = tokenToUpdateMetadataWithNewMetadata.metadata_raw;
            }
            //-----------------------
            const priceIndex = newTokensWithDetails.findIndex((price) => price.CS === newToken.CS && price.TN_Hex === newToken.TN_Hex);
            //-----------------------
            if (priceIndex === -1) {
                //-----------------------
                const newTokenToAdd: Token_For_Store = {
                    ...newToken,
                    CS: newToken.CS!,
                    TN_Hex: newToken.TN_Hex!,
                    decimals: newToken.decimals,
                    priceADAx1e6: newToken.priceADAx1e6,
                    date: newToken.date,
                    signature: newToken.signature,
                    isFT: newToken.isFT ?? false,
                    tokensInFT: newToken.tokensInFT ?? [],
                    followUp: newToken.followUp ?? followUp,
                    keepAlive: newToken.keepAlive ?? keepAlive,
                };
                //-----------------------
                newTokensWithDetails.push(newTokenToAdd); // Update the copy
                //-----------------------
                // Separate items into two lists based on `keepAlive`
                const keepAliveItems = newTokensWithDetails.filter((item) => item.keepAlive === true);
                const nonKeepAliveItems = newTokensWithDetails.filter((item) => !(item.keepAlive === true));
                // If nonKeepAliveItems list is longer than 30, remove the first item
                if (nonKeepAliveItems.length > 30) {
                    nonKeepAliveItems.shift(); // Removes the first item of the nonKeepAliveItems list
                }
                // Concatenate the modified nonKeepAliveItems list back with the keepAliveItems list
                newTokensWithDetails = [...keepAliveItems, ...nonKeepAliveItems];
                //-----------------------
            } else {
                //-----------------------
                // si lo estoy siguiendo, veo si la fecha del actual es mayor a la del guardado o si en el guardado no tenia fecha
                // ademas controlo que tenga precio antes de suplantarlo
                //-----------------------
                const oldToken = newTokensWithDetails[priceIndex];
                //-----------------------
                let oldTokenUpdated: Token_For_Store = {
                    ...oldToken,
                };
                //-----------------------
                let swUpdate = false;
                //-----------------------
                const updatePriceADA = isTokenADA(oldTokenUpdated.CS, oldTokenUpdated.TN_Hex) && newToken.priceADAx1e6 !== undefined;
                const updatePriceOthers =
                    !isTokenADA(oldTokenUpdated.CS, oldTokenUpdated.TN_Hex) &&
                    newToken.date !== undefined &&
                    newToken.priceADAx1e6 !== undefined &&
                    ((oldToken.date !== undefined && newToken.date > oldToken.date) || oldToken.priceADAx1e6 === undefined || oldToken.date === undefined);
                //-----------------------
                if (updatePriceADA || updatePriceOthers) {
                    //-----------------------
                    // si existe voy a actualizarlo
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        priceADAx1e6: newToken.priceADAx1e6,
                        date: newToken.date,
                        signature: newToken.signature,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                //-----------------------
                if (newToken.ticker !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        ticker: newToken.ticker,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                if (newToken.decimals !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        decimals: newToken.decimals,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                if (newToken.image !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        image: newToken.image,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                if (newToken.colorHex !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        colorHex: newToken.colorHex,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                if (newToken.metadata_raw !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        metadata_raw: newToken.metadata_raw,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                //-----------------------
                const finalFolloUp = newToken.followUp ?? followUp;
                //-----------------------
                if (finalFolloUp !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        followUp: finalFolloUp,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                //-----------------------
                const finalkeepAlive = newToken.keepAlive ?? keepAlive;
                //-----------------------
                if (finalkeepAlive !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        keepAlive: finalkeepAlive,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                //-----------------------
                if (newToken.isFT !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        isFT: newToken.isFT,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                //-----------------------
                if (newToken.tokensInFT !== undefined) {
                    //-----------------------
                    oldTokenUpdated = {
                        ...oldTokenUpdated,
                        tokensInFT: newToken.tokensInFT,
                    };
                    //-----------------------
                    swUpdate = true;
                    //-----------------------
                }
                //-----------------------
                if (swUpdate === true) {
                    //-----------------------
                    newTokensWithDetails[priceIndex] = oldTokenUpdated; // Update the copy
                    //-----------------------
                }
            }
        }
        //-----------------------
        await actions.setTokensWithDetails(newTokensWithDetails);
        //-----------------------
        state = helpers.getState();
        //-----------------------
        const result = state.getTokensPriceAndMetadata(uniqueTokens as Token_For_Store[]);
        //-----------------------
        actions.setIsAddingTokens(false);
        //-----------------------
        console.log(`[TokensStore] - addTokens - OK - Tokens: ${uniqueTokens.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')}`);
        //-----------------------
        return result;
        //-----------------------
    }),
    //----------------------------
    removeToken: thunk(async (actions, token, helpers) => {
        //----------------------------
        console.log(`[TokensStore] - removeToken`);
        //----------------------------
        let state = helpers.getState();
        //----------------------------
        const newTokensWithDetails = [...state.tokensWithDetails].filter((token_) => !(token_.CS === token.CS && token_.TN_Hex === token.TN_Hex));
        //----------------------------
        await actions.setTokensWithDetails(newTokensWithDetails);
        //----------------------------
        if (newTokensWithDetails.length === 0 && state.intervalIdForUpdateLoop !== undefined) {
            await actions.stopUpdateLoop();
        }
        //----------------------------
    }),
    //----------------------------
    refreshPrices: thunk(async (actions, payload, helpers) => {
        //----------------------------
        //TODO: forceRefresh estaba defualt true, no se por que, lo puse false
        const forceRefresh = payload?.forceRefresh ?? false;
        const forceUseOracle = payload?.forceUseOracle ?? false;
        //----------------------------
        console.log(`[TokensStore] - refreshPrices - forceRefresh: ${forceRefresh} - forceUseOracle: ${forceUseOracle}`);
        //----------------------------
        let state = helpers.getState();
        //----------------
        actions.getServerTime({ refresh: true });
        //----------------
        const newTokensWithDetails: Token_For_Store[] = [];
        //----------------
        const tokensToUpdate = state.tokensWithDetails.filter((token) => token.followUp === true);
        const tokensNoUpdate = state.tokensWithDetails.filter((token) => token.followUp !== true);
        //----------------
        if (tokensToUpdate.length === 0) {
            console.error(`[TokensStore] - Nothing to update`);
            return;
        }
        //----------------
        actions.setIsAddingTokens(true);
        //----------------
        let tokensToUpdateWithNewPrices: Token_With_Price_And_Date_And_Signature[] = [];
        try {
            tokensToUpdateWithNewPrices = await PriceFrontEndApiCalls.get_Tokens_PriceADAx1e6_Api(
                tokensToUpdate.map((token) => ({ CS: token.CS, TN_Hex: token.TN_Hex })),
                forceRefresh,
                undefined,
                forceUseOracle
            );
        } catch (error) {
            console.error(`[TokensStore] - Error getting tokens prices: ${error}`);
        }
        //----------------
        tokensToUpdate.map((token) => {
            const tokenToUpdateWithNewPrice = tokensToUpdateWithNewPrices.find((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex);
            if (tokenToUpdateWithNewPrice !== undefined) {
                token.priceADAx1e6 = tokenToUpdateWithNewPrice?.priceADAx1e6;
                token.date = tokenToUpdateWithNewPrice?.date;
                token.signature = tokenToUpdateWithNewPrice?.signature;
                newTokensWithDetails.push(token);
            } else {
                newTokensWithDetails.push(token);
            }
        });
        //----------------
        newTokensWithDetails.push(...tokensNoUpdate);
        //----------------
        actions.setIsAddingTokens(false);
        //----------------
        await actions.setTokensWithDetails(newTokensWithDetails);
        //----------------
    }),
    //----------------------------
    isTokenPriceValid: computed((state) => (CS: CS, TN_Hex: TN): boolean => {
        //-----------------------
        if (isTokenADA(CS, TN_Hex)) {
            return true;
        }
        //-----------------------
        const validity = state.getTokenValidity(CS, TN_Hex);
        //-----------------------
        if (validity !== undefined) {
            const secondsLeft = Number(validity);
            if (secondsLeft > 0) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }),
    //----------------------------
    getTokenValidity: computed((state) => (CS: CS, TN_Hex: TN): bigint | undefined => {
        //-----------------------
        if (isTokenADA(CS, TN_Hex)) {
            return BigInt(Number.MAX_SAFE_INTEGER);
        }
        //-----------------------
        const tokenIndex = state.tokensWithDetailsAndValidity.findIndex((token) => token.CS === CS && token.TN_Hex === TN_Hex);
        if (tokenIndex !== -1) {
            return state.tokensWithDetailsAndValidity[tokenIndex].validity;
        } else {
            return undefined;
        }
    }),
    //----------------------------
    getTokenPriceAndMetadata: computed((state) => (CS: CS, TN_Hex: TN): Token_For_Store | undefined => {
        const tokenIndex = state.tokensWithDetails.findIndex((token) => token.CS === CS && token.TN_Hex === TN_Hex);
        if (tokenIndex !== -1) {
            return state.tokensWithDetails[tokenIndex];
        }
    }),
    //----------------------------
    getTokensPriceAndMetadata: computed((state) => (tokens) => {
        //----------------------------
        // console.log('[TokensMetadataStore] - getTokens - actual length: ' + state.tokens.length);
        //----------------------------
        const res = tokens
            .map((token) => {
                return state.tokensWithDetails.find((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) || undefined;
            })
            .filter((token) => token !== undefined); // Filter out any null values (tokens not found)
        //----------------------------
        return res as Token_For_Store[];
    }),
    //--------------------------
    getTokenDecimals: computed((state) => (CS: CS, TN_Hex: TN): Decimals | undefined => {
        const tokenIndex = state.tokensWithDetails.findIndex((token) => token.CS === CS && token.TN_Hex === TN_Hex);
        if (tokenIndex !== -1) {
            return state.tokensWithDetails[tokenIndex].decimals;
        }
    }),
    //----------------------------
    showTokenValidity: computed((state) => (CS: CS, TN_Hex: TN, swAddValidFor?: boolean): string => {
        //-----------------------
        if (isTokenADA(CS, TN_Hex)) {
            return `Valid`;
        }
        //-----------------------
        const validity = state.getTokenValidity(CS, TN_Hex);
        //-----------------------
        if (validity !== undefined) {
            //-----------------------
            if (state.isAddingTokens === true) {
                return 'Refreshing...';
            } else {
                const secondsLeft = Number(validity);
                if (secondsLeft > 0) {
                    return `${swAddValidFor === true ? `Valid for: ` : ``}${secondsLeft}s`;
                } else {
                    return `Refresh Price`;
                }
            }
        } else {
            return '...';
        }
    }),
    //----------------------------
    showTokenWithAmount: computed((state) => (amount: bigint | number | undefined, CS: CS, TN_Hex: TN, swRounded: boolean = false, showDecimals: Decimals = 2) => {
        //-----------------------
        if (isTokenADA(CS, TN_Hex)) {
            return `${formatAmountWithUnit(amount, TOKEN_ADA_SYMBOL, swRounded ? showDecimals : TOKEN_ADA_DECIMALS, swRounded, TOKEN_ADA_DECIMALS)}`;
        }
        //-----------------------
        const tokenIndex = state.tokensWithDetails.findIndex((token) => token.CS === CS && token.TN_Hex === TN_Hex);
        if (tokenIndex !== -1 && state.tokensWithDetails[tokenIndex].decimals !== undefined) {
            return `${formatAmountWithUnit(
                amount,
                state.tokensWithDetails[tokenIndex].ticker,
                swRounded ? showDecimals : state.tokensWithDetails[tokenIndex].decimals,
                swRounded,
                state.tokensWithDetails[tokenIndex].decimals
            )}`;
        } else {
            if (TN_Hex !== undefined) {
                return `... ${hexToStr(TN_Hex)}`;
            } else {
                return `...`;
            }
        }
    }),
    //----------------------------
    showTokenPrice: computed((state) => (CS: CS, TN_Hex: TN, swRounded: boolean = false, showDecimals: Decimals = 2): string => {
        //-----------------------
        // console.log(`[TokensStore] - showTokenPrice - ${CS} - ${TN_Hex} - swRounded: ${swRounded} - showDecimals: ${showDecimals}`);
        //-----------------------
        if (isTokenADA(CS, TN_Hex)) {
            const priceADAx1e6 = 1000000n;
            const priceADAx1e6ofTokenBaseUnit = priceADAx1e6 * BigInt(10 ** TOKEN_ADA_DECIMALS);
            return `${formatAmountWithUnit(
                priceADAx1e6ofTokenBaseUnit,
                TOKEN_ADA_SYMBOL,
                swRounded ? showDecimals : TOKEN_ADA_DECIMALS,
                swRounded,
                (TOKEN_ADA_DECIMALS + PRICEx1e6_DECIMALS) as Decimals
            )}`;
        }
        //-----------------------
        const tokenIndex = state.tokensWithDetails.findIndex((token) => token.CS === CS && token.TN_Hex === TN_Hex);
        if (tokenIndex !== -1) {
            //-----------------------
            const priceADAx1e6ofTokenBaseUnit =
                state.tokensWithDetails[tokenIndex].priceADAx1e6 !== undefined && state.tokensWithDetails[tokenIndex].decimals !== undefined
                    ? BigInt(state.tokensWithDetails[tokenIndex].priceADAx1e6!) * BigInt(10 ** state.tokensWithDetails[tokenIndex].decimals!)
                    : undefined;
            //-----------------------
            const formatPrice = formatAmountWithUnit(
                priceADAx1e6ofTokenBaseUnit,
                TOKEN_ADA_SYMBOL,
                swRounded ? showDecimals : TOKEN_ADA_DECIMALS,
                swRounded,
                (TOKEN_ADA_DECIMALS + PRICEx1e6_DECIMALS) as Decimals
            );
            //-----------------------
            return `${formatPrice}`;
        } else {
            return `... ${TOKEN_ADA_SYMBOL}`;
        }
    }),

    //----------------------------
    showTokenPriceAndValidity: computed((state) => (CS: CS, TN_Hex: TN, swRounded: boolean = false, showDecimals: Decimals = 2): string => {
        //-----------------------
        if (isTokenADA(CS, TN_Hex)) {
            //-----------------------
            const formatPrice = state.showTokenPrice(CS, TN_Hex, swRounded, showDecimals);
            //-----------------------
            return `${formatPrice} - Valid`;
        }
        //-----------------------
        const tokenIndex = state.tokensWithDetailsAndValidity.findIndex((token) => token.CS === CS && token.TN_Hex === TN_Hex);
        if (tokenIndex !== -1) {
            //-----------------------
            const secondsLeft = state.tokensWithDetailsAndValidity[tokenIndex].validity !== undefined ? Number(state.tokensWithDetailsAndValidity[tokenIndex].validity) : 0;
            //-----------------------
            const formatPrice = state.showTokenPrice(CS, TN_Hex, swRounded, showDecimals);
            //-----------------------
            if (secondsLeft > 0) {
                return `${formatPrice} - Valid for ${secondsLeft} seconds`;
            } else {
                return `${formatPrice} - Not Valid - Refresh Price`;
            }
        } else {
            return '...';
        }
    }),
    //----------------------------
    showTokenPriceMultipliedByAmount: computed(
        (state) =>
            (amount: bigint | number | undefined, CS: CS, TN_Hex: TN, swRounded: boolean = false, showDecimals: Decimals = 2, decimalsInAmount: Decimals = 0) => {
                //-----------------------
                if (typeof amount !== 'number' && amount !== undefined) {
                    amount = Number(amount);
                }
                if (isTokenADA(CS, TN_Hex)) {
                    //-----------------------
                    const priceADAx1e6 = 1000000n;
                    const priceADAx1e6ByAmount = amount !== undefined ? Number(priceADAx1e6) * amount : undefined;
                    //-----------------------
                    // const priceADAByAmount = amount !== undefined ? Number(1000000) * amount : undefined;
                    return `${formatAmountWithUnit(
                        priceADAx1e6ByAmount,
                        TOKEN_ADA_SYMBOL,
                        swRounded ? showDecimals : ((TOKEN_ADA_DECIMALS + decimalsInAmount + TOKEN_ADA_DECIMALS) as Decimals),
                        swRounded,
                        (TOKEN_ADA_DECIMALS + decimalsInAmount + PRICEx1e6_DECIMALS) as Decimals
                    )}`;
                }
                //-----------------------
                const tokenIndex = state.tokensWithDetails.findIndex((token) => token.CS === CS && token.TN_Hex === TN_Hex);
                if (tokenIndex !== -1) {
                    const priceADAx1e6 =
                        state.tokensWithDetails[tokenIndex].priceADAx1e6 !== undefined && state.tokensWithDetails[tokenIndex].decimals !== undefined
                            ? BigInt(state.tokensWithDetails[tokenIndex].priceADAx1e6!)
                            : undefined;
                    const priceADAx1e6ByAmount = priceADAx1e6 !== undefined && amount !== undefined ? Number(priceADAx1e6) * amount : undefined;
                    //-----------------------
                    const formatPrice = formatAmountWithUnit(
                        priceADAx1e6ByAmount,
                        TOKEN_ADA_SYMBOL,
                        swRounded
                            ? showDecimals
                            : state.tokensWithDetails[tokenIndex].decimals === undefined
                            ? undefined
                            : ((TOKEN_ADA_DECIMALS + decimalsInAmount + state.tokensWithDetails[tokenIndex]!.decimals!) as Decimals),
                        swRounded,
                        (TOKEN_ADA_DECIMALS + decimalsInAmount + PRICEx1e6_DECIMALS) as Decimals
                    );
                    //-----------------------
                    return `${formatPrice}`;
                } else {
                    return `... ${TOKEN_ADA_SYMBOL}`;
                }
            }
    ),
    //----------------------------
};
