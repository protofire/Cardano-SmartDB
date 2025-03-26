'use client';

import { Action } from 'easy-peasy';
import { useRouter } from 'next/router.js';
import { useEffect, useMemo, useState } from 'react';
import { hexToStr } from '../Commons/utils.js';
import { Token_For_Store } from '../store/types.js';
import { useTokensStore } from '../store/useGlobalStore.js';

interface TokensStoreGeneralProps {
    name: string;
    swAddTimeToName?: boolean;
    tokensToGet?: Partial<Token_For_Store>[];
    swHandleCreateJob?: boolean;
    conditionInit?: () => boolean;
    dependenciesInit?: any[];
    followUp?: boolean;
    swAddPrice?: boolean;
    swAddMetadata?: boolean;
    swCreateMetadataWhenNotFound?: boolean;
    keepAlive?: boolean;
    // NOTE: Puedo cargar muchos tokens con followUp, pero en solo un useTokensStoreGeneral deberia setear el price Updater.
    // NOTE: si esta verdadero, se hace follow Up actomaticamente.
    initPriceUpdater?: boolean;
}
interface StoreModel {
    items: string[];
    addItem: Action<StoreModel, string>;
}
export const useTokensStoreGeneral = (props: TokensStoreGeneralProps) => {
    //--------------------------------------
    const { name, followUp, keepAlive, swAddPrice, swAddMetadata, swCreateMetadataWhenNotFound, tokensToGet: tokensToGet_ } = props;
    //--------------------------------------
    const swAddTimeToName = props.swAddTimeToName === undefined ? true : props.swAddTimeToName;
    const initPriceUpdater = props.initPriceUpdater === undefined ? false : props.initPriceUpdater;
    const swHandleCreateJob = props.swHandleCreateJob === undefined ? true : props.swHandleCreateJob;
    //--------------------------------------
    const [random, setRandom] = useState((Math.random() * 100).toString());
    //--------------------------------------
    const tokensStore = useTokensStore();
    //--------------------------------------
    const router = useRouter();
    //--------------------------------------
    const [tokensToGet, setTokensToGet] = useState<Partial<Token_For_Store>[]>(tokensToGet_ ?? []);
    const [tokensFromStore, setTokensFromStore] = useState<Token_For_Store[]>([]);
    const [isTokensStoreReady, setIsTokensStoreReady] = useState(false);
    const [isTokensStoreLoading, setIsTokensStoreLoading] = useState(false);
    //--------------------------------------
    const conditionInitTokensStoreGeneral = useMemo(() => {
        return () => {
            if (props.conditionInit) {
                const results = props.conditionInit();
                if (results === true) {
                    console.log(`[TokensStore] - Job: ${name}${swAddTimeToName ? random : ''} - conditionInit: ${results}`);
                }
                return results;
            } else {
                const results = tokensToGet !== undefined && tokensToGet.length > 0;
                if (results === true) {
                    console.log(`[TokensStore] - Job: ${name}${swAddTimeToName ? random : ''} - conditionInit: ${results}`);
                }
                return results;
            }
        };
    }, [props.conditionInit, tokensToGet, name, swAddTimeToName]);
    //--------------------------------------
    const conditionInit = conditionInitTokensStoreGeneral;
    //--------------------------------------
    const dependenciesInit = props.dependenciesInit === undefined ? [] : props.dependenciesInit;
    //--------------------------------------
    useEffect(() => {
        if (isTokensStoreReady === false && tokensStore.jobTokensToAddFinished.length > 0 && tokensStore.isExecuting === false) {
            //--------------------------------------
            const tokens = tokensStore.getFinishedJobTokensToAdd(`${name}${swAddTimeToName ? random : ''}`);
            if (tokens !== undefined) {
                setIsTokensStoreReady(true);
                setIsTokensStoreLoading(false);
                setTokensFromStore(tokens);
                if (initPriceUpdater === true) {
                    tokensStore.beginUpdateLoop({ doUpdatePricesAutomatically: true });
                }
            }
        }
    }, [tokensStore.jobTokensToAddFinished.length, tokensStore.isExecuting]);
    //--------------------------------------
    useEffect(() => {
        const initStore2 = async () => {
            //--------------------------------------
            console.log(`[TokensStore] - Job: ${name}${swAddTimeToName ? random : ''} - initStore2 - Tokens: ${tokensToGet?.map((t) => hexToStr(t.TN_Hex)).join(', ')}`);
            //--------------------------------------
            tokensStore.createJobTokensToAdd({
                job: `${name}${swAddTimeToName ? random : ''}`,
                tokens: tokensToGet,
                followUp: initPriceUpdater === true ? true : followUp,
                swAddPrice,
                swAddMetadata,
                swCreateMetadataWhenNotFound,
                keepAlive,
            });
            //--------------------------------------
        };
        if (swHandleCreateJob === true && isTokensStoreLoading === true) {
            initStore2();
        }
    }, [isTokensStoreLoading]);
    //--------------------------------------
    useEffect(() => {
        const initStore1 = async () => {
            //--------------------------------------
            setIsTokensStoreReady(false);
            setIsTokensStoreLoading(true);
            //--------------------------------------
            console.log(
                `[TokensStore] - Job: ${name}${swAddTimeToName ? random : ''} - initStore1 - swHandleCreateJob: ${swHandleCreateJob} - Tokens: ${tokensToGet
                    ?.map((t) => hexToStr(t.TN_Hex))
                    .join(', ')}`
            );
        };
        if (isTokensStoreLoading === false && conditionInit() === true) {
            initStore1();
        }
    }, [tokensToGet.length, ...dependenciesInit]);
    //--------------------------------------
    useEffect(() => {
        // const handleRouteChange = () => {
        //     console.log(`[TokensStore] - Job: ${name}${swAddTimeToName ? random : ''} - handleRouteChange`);
        //     if (tokensStore !== undefined && initPriceUpdater === true) {
        //         tokensStore.stopUpdateLoop({ cancelFollowUp: true });
        //     }
        // };
        // router.events.on('routeChangeStart', handleRouteChange);
        return () => {
            console.log(`[TokensStore] - Job: ${name}${swAddTimeToName ? random : ''} - stopUpdateLoop`);
            // router.events.off('routeChangeStart', handleRouteChange);
            if (tokensStore !== undefined && initPriceUpdater === true) {
                tokensStore.stopUpdateLoop({ cancelFollowUp: true });
            }
        };
    }, [router.events]);
    //--------------------------------------
    return {
        tokensStore,
        isTokensStoreReady,
        setIsTokensStoreReady,
        isTokensStoreLoading,
        setIsTokensStoreLoading,
        tokensFromStore,
        setTokensToGet,
        initPriceUpdater,
        isAddingTokens: tokensStore.isAddingTokens,
    };
    //--------------------------------------
};
