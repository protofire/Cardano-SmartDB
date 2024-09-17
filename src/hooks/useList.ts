'use client';

import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useReducer, useRef, useState } from 'react';
import { IUseWalletStore } from '../store/types.js';
import { ITEMS_PER_PAGE } from '../Commons/Constants/constants.js';
import { useWalletStore } from '../store/useGlobalStore.js';
import { toJson } from '../Commons/utils.js';
import { pushWarningNotification } from '../Commons/pushNotification.js';
import { OptionsGet } from '../Commons/types.js';


export interface ListProps<T> {
    nameList?: string;
    loadList: (swCalculateTotalPages?: boolean, currentPage?: number, itemsPerPage?: number) => Promise<T[]>;
    checkIfRestricted?: (status: string, session: Session | null, walletStore: IUseWalletStore) => boolean;
    // initialList?: T[];
    initialCurrent?: T;
    dependencies?: any[];
    checkDependencies?: () => boolean;
    itemsPerPage?: number;
    onLoadingList?: () => Promise<void>;
    onLoadedList?: () => Promise<void>;
    isHandlingListEvents?: boolean;
}

export const useList = <T>(props: ListProps<T>) => {
    //--------------------------------------
    const {
        nameList,
        loadList,
        checkIfRestricted,
        initialCurrent,
        dependencies: dependencies_,
        checkDependencies,
        itemsPerPage: itemsPerPage_,
        onLoadingList,
        onLoadedList,
        isHandlingListEvents: isHandlingListEvents_,
    } = props;
    //--------------------------------------
    const [triggerScroll, setTriggerScroll] = useState(false);
    const isHandlingListEvents = isHandlingListEvents_ ?? true;
    //--------------------------------------
    const dependencies = dependencies_ ?? [];
    const itemsPerPage = itemsPerPage_ ?? ITEMS_PER_PAGE;
    //--------------------------------------
    const { data: session, status } = useSession();
    //--------------------------------------
    const walletStore = useWalletStore();
    //--------------------------------------
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
    const [sortParams, setSortParams] = useState({});
    //--------------------------------------
    const handlePageChange = (newPage: number) => {
        if (totalPages === undefined || newPage > totalPages || newPage < 1) return;
        setCurrentPage(newPage);
        refreshList(false, newPage);
        // refreshList(false, false, newPage);
    };
    const handleSortChange = (newSortParams: {}) => {
        setSortParams(newSortParams);
    };
    //--------------------------------------
    const listDivRef = useRef<HTMLDivElement>(null);
    //--------------------------------------
    function scrollToList() {
        if (listDivRef.current) {
            const topPos = listDivRef.current.getBoundingClientRect().top + window.scrollY;
            console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] scrollToList - ${topPos}`);
            window.scrollTo({ top: topPos, behavior: 'smooth' });
        }
    }
    //--------------------------------------
    // useEffect(() => {
    //     if (router.isReady) {
    //         const newCurrentTask = isAllowedTask(task as string) ? (task as string) : undefined;
    //         if (newCurrentTask !== currentTask) {
    //             setCurrentTask(newCurrentTask);
    //         }
    //     }
    // }, [router.isReady, task, protocolId, protocolVersion, fundFactoryVersion, fundId]);
    //--------------------------------------
    type State = {
        isLoadedList: boolean;
        isLoadingList: boolean;
        // initialListUsed: boolean;
        doLoading: boolean;
        loadingParams: { swCalculateTotalPages?: boolean; newCurrentPage?: number };
        // loadingParams: { swUnsetCurrentTask?: boolean; swCalculateTotalPages?: boolean; newCurrentPage?: number };
        isRestricted: boolean;
        wasRestricted: boolean;
        list: T[];
        current: T | undefined;
    };
    type ListAction =
        | { type: 'start_loading'; payload: { swCalculateTotalPages?: boolean; newCurrentPage?: number } }
        // | { type: 'start_loading'; payload: { swUnsetCurrentTask?: boolean; swCalculateTotalPages?: boolean; newCurrentPage?: number } }
        | { type: 'finish_loading'; payload: T[] }
        | { type: 'select'; payload?: T | undefined }
        | { type: 'restrict_user' }
        | { type: 'unrestrict_user' }
        | { type: 'wasRestricted'; payload: boolean };
    // | { type: 'initialListUsed'; payload: boolean };
    //--------------------------------------
    const listReducer = (state: State, action: ListAction) => {
        // console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] Reducer State ${toJson(state)}`);
        // console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] Reducer Action ${toJson(action)}`);
        switch (action.type) {
            case 'start_loading':
                console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}start_loading - ${toJson(action.payload)}`);
                return { ...state, isLoadedList: false, isLoadingList: true, doLoading: true, loadingParams: action.payload };
            case 'finish_loading':
                console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] List loaded`);
                return { ...state, isLoadedList: true, isLoadingList: false, list: action.payload, doLoading: false };
            case 'select':
                // console.log(`select`)
                return { ...state, current: action.payload };
            case 'restrict_user':
                // console.log(`restrict_user`)
                return { ...state, isRestricted: true, list: [], isLoadedList: false };
            case 'unrestrict_user':
                // console.log(`unrestrict_user`)
                return { ...state, isRestricted: false, wasRestricted: state.isRestricted };
            case 'wasRestricted':
                // console.log(`wasRestricted`)
                return { ...state, wasRestricted: action.payload };
            // case 'initialListUsed':
            //     // console.log(`initialListUsed`)
            //     return { ...state, initialListUsed: action.payload };
            default:
                throw `Unknown dispach message`;
        }
    };
    //--------------------------------------
    const [state, dispatch] = useReducer(listReducer, {
        // isLoadedList: initialList !== undefined ? true : false,
        // isLoadingList: initialList === undefined ? true : false,
        isLoadedList: false,
        isLoadingList: false,
        // initialListUsed: false,
        doLoading: false,
        loadingParams: { swCalculateTotalPages: true, newCurrentPage: undefined },
        // loadingParams: { swUnsetCurrentTask: true, swCalculateTotalPages: true, newCurrentPage: 1 },
        isRestricted: false,
        wasRestricted: true,
        list: [],
        // list: initialList !== undefined ? initialList : [],
        current: initialCurrent,
    });
    //--------------------------------------
    const setCurrent = (current?: T) => {
        dispatch({ type: 'select', payload: current });
    };
    //--------------------------------------
    const setList = (current: T[]) => {
        dispatch({ type: 'finish_loading', payload: current });
    };
    //--------------------------------------
    useEffect(() => {
        if (state.isLoadingList === true && isHandlingListEvents === true) {
            console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] useEffects isLoadingList`);
            if (onLoadingList !== undefined) {
                onLoadingList();
            }
        }
    }, [state.isLoadingList]);
    //--------------------------------------
    useEffect(() => {
        if (state.isLoadedList === true && isHandlingListEvents === true) {
            console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] useEffects isLoadedList`);
            if (onLoadedList !== undefined) {
                onLoadedList();
            }
            setTriggerScroll(true);
        }
    }, [state.isLoadedList]);
    //--------------------------------------
    useEffect(() => {
        if (triggerScroll === true) {
            console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] useEffects triggerScroll`);
            scrollToList();
            setTriggerScroll(false);
        }
    }, [triggerScroll]);
    //--------------------------------------
    useEffect(() => {
        // este se va a usar solamente para cambiar el estado de retriccion del usuario
        if (checkIfRestricted !== undefined) {
            let isUserRestricted = checkIfRestricted(status, session, walletStore);
            // alert(`${nameList} - wallet cambio: isUserRestricted ${isUserRestricted}`);
            // console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] useEffects wallet cambio: isUserRestricted ${isUserRestricted}`);
            dispatch({ type: isUserRestricted ? 'restrict_user' : 'unrestrict_user' });
        }
    }, [status, walletStore.isWalletPrivilegesLoaded]);
    //--------------------------------------
    useEffect(() => {
        //--------------------------------------
        // console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] useEffects refreshList because was restricted or dependencies changed`);
        //--------------------------------------
        // console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] useEffects ${toJson(state)} ${toJson(dependencies)}`);
        //--------------------------------------
        if (state.isRestricted === false && state.wasRestricted === true && checkIfRestricted !== undefined) {
            // alert(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] refreshList because was restricted`);
            if (checkDependencies === undefined) {
                refreshList();
                dispatch({ type: 'wasRestricted', payload: false });
            } else {
                if (checkDependencies() === true) {
                    refreshList();
                    dispatch({ type: 'wasRestricted', payload: false });
                }
            }
        } else {
            // alert(`${nameList} - refreshList because dependencies changed`);
            if (checkDependencies === undefined) {
                refreshList();
            } else {
                if (checkDependencies() === true) {
                    refreshList();
                }
            }
        }
    }, [state.isRestricted, ...dependencies]);
    //--------------------------------------
    useEffect(() => {
        //--------------------------------------
        if (state.doLoading === true) {
            //--------------------------------------
            // if (state.initialListUsed === false && initialList !== undefined) {
            //     // siempre comienza en falso y se setea en true la primera vez que se llama refresh
            //     dispatch({ type: 'initialListUsed', payload: true });
            //     dispatch({ type: 'finish_loading', payload: initialList });
            //     setCurrentPage(1);
            //     // pero si hayuna lista inicial, no se hace nada
            //     return
            // }
            //--------------------------------------
            const fetch = async () => {
                try {
                    // console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] useEffect doLoading`);
                    //----------------
                    let currentPage_ = currentPage;
                    if (state.loadingParams.newCurrentPage !== undefined) {
                        currentPage_ = state.loadingParams.newCurrentPage;
                        setCurrentPage(currentPage_);
                    }
                    if (totalPages === undefined || state.loadingParams.swCalculateTotalPages === true) {
                        // currentPage_ = 1;
                        // setCurrentPage(currentPage_);
                        state.loadingParams.swCalculateTotalPages = true;
                    }
                    //----------------
                    let list: T[] = await loadList(state.loadingParams.swCalculateTotalPages, currentPage_, itemsPerPage);
                    //----------------
                    // if (state.loadingParams.swUnsetCurrentTask) {
                    //     setCurrentTask(undefined);
                    // }
                    //----------------
                    dispatch({ type: 'finish_loading', payload: list });
                } catch (error) {
                    console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] Error fetching list: ${error}`);
                    pushWarningNotification('SmartDB', 'Error fetching list: ' + error);
                    dispatch({ type: 'finish_loading', payload: [] });
                }
            };
            fetch();
        }
        //--------------------------------------
    }, [state.doLoading]);
    //--------------------------------------
    const refreshList = async (swCalculateTotalPages: boolean = true, newCurrentPage?: number) => {
        //----------------
        // console.log(`${nameList ? '[' + nameList + ']' + ' - ' : ''}[List] refreshList`);
        //----------------
        if (state.isRestricted === false) {
            dispatch({ type: 'start_loading', payload: { swCalculateTotalPages, newCurrentPage } });
        }
    };
    //--------------------------------------
    function addPagination(optionsGet: OptionsGet, totalPages: number, currentPage: number, itemsPerPage_?: number) {
        //--------
        optionsGet = { ...optionsGet, limit: itemsPerPage_ ?? itemsPerPage };
        //--------
        if (currentPage !== undefined && totalPages !== undefined && currentPage > totalPages) {
            currentPage = totalPages;
            setCurrentPage(currentPage);
        }
        //--------
        if (currentPage === 0) {
            currentPage = 1;
            setCurrentPage(currentPage);
        }
        //--------
        if (currentPage > 1) {
            optionsGet = { ...optionsGet, skip: (currentPage - 1) * (itemsPerPage_ ?? itemsPerPage) };
        }
        //--------
        return optionsGet;
    }
    //--------------------------------------
    return {
        isLoadingList: state.isLoadingList,
        isLoadedList: state.isLoadedList,
        list: state.list,
        current: state.current,
        refreshList,
        setCurrent,
        setList,
        listDivRef,
        scrollToList,
        setTriggerScroll,
        handlePageChange,
        setCurrentPage,
        currentPage,
        handleSortChange,
        sortParams,
        setTotalPages,
        totalPages,
        addPagination,
    };
};
