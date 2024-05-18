'use client';

import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useReducer, useRef, useState } from 'react';
import { IUseWalletStore } from '../store/types.js';
import { useWalletStore } from '../store/useGlobalStore.js';
import { pushWarningNotification } from '../Commons/pushNotification.js';

export interface DetailsProps<T> {
    nameDetails?: string;
    loadDetails: (new_id?: string) => Promise<T | undefined>;
    checkIfRestricted?: (status: string, session: Session | null, walletStore: IUseWalletStore) => boolean;
    // initialDetails?: T;
    dependencies?: any[];
    checkDependencies?: () => boolean;
    onLoadingDetails?: () => Promise<void>;
    onLoadedDetails?: () => Promise<void>;
    isHandlingDetailsEvents?: boolean;
}

export const useDetails = <T>(props: DetailsProps<T>) => {
    //--------------------------------------
    const {
        nameDetails,
        loadDetails,
        checkIfRestricted,
        dependencies: dependencies_,
        checkDependencies,
        onLoadingDetails,
        onLoadedDetails,
        isHandlingDetailsEvents: isHandlingDetailsEvents_,
    } = props;
    //--------------------------------------
    const [triggerScroll, setTriggerScroll] = useState(false);
    const isHandlingDetailsEvents = isHandlingDetailsEvents_ ?? true;
    //--------------------------------------
    const dependencies = dependencies_ ?? [];
    //--------------------------------------
    const { data: session, status } = useSession();
    //--------------------------------------
    const walletStore = useWalletStore();
    //--------------------------------------
    const detailsDivRef = useRef<HTMLDivElement>(null);
    //--------------------------------------
    function scrollToDetails() {
        if (detailsDivRef.current) {
            const topPos = detailsDivRef.current.getBoundingClientRect().top + window.scrollY;
            console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] scrollToDetails - ${topPos}`);
            window.scrollTo({ top: topPos, behavior: 'smooth' });
        }
    }
    //--------------------------------------
    type State = {
        isLoadedDetails: boolean;
        isLoadingDetails: boolean;
        doLoading: boolean;
        loadingParams: { new_id?: string };
        // loadingParams: { swUnsetCurrentTask?: boolean; new_id?: string };
        isRestricted: boolean;
        wasRestricted: boolean;
        current: T | undefined;
    };
    type ListAction =
        // | { type: 'start_loading'; payload: { swUnsetCurrentTask?: boolean; new_id?: string } }
        | { type: 'start_loading'; payload: { new_id?: string } }
        | { type: 'finish_loading'; payload: T | undefined }
        | { type: 'restrict_user' }
        | { type: 'unrestrict_user' }
        | { type: 'wasRestricted'; payload: boolean };
    //--------------------------------------
    const listReducer = (state: State, action: ListAction) => {
        switch (action.type) {
            case 'start_loading':
                // console.log(`${nameDetails ? '[' + nameDetails + "]" + ' - ' : ''}start_loading`);
                return { ...state, isLoadedDetails: false, isLoadingDetails: true, doLoading: true, loadingParams: action.payload };
            case 'finish_loading':
                console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] Details loaded`);
                return { ...state, isLoadedDetails: true, isLoadingDetails: false, current: action.payload, doLoading: false };
            case 'restrict_user':
                return { ...state, isRestricted: true, current: undefined, isLoadedDetails: false };
            case 'unrestrict_user':
                return { ...state, isRestricted: false };
            case 'wasRestricted':
                // console.log(`wasRestricted`)
                return { ...state, wasRestricted: action.payload };
            default:
                throw `Unknown dispach message`;
        }
    };
    //--------------------------------------
    const [state, dispatch] = useReducer(listReducer, {
        isLoadedDetails: false,
        isLoadingDetails: false,
        // isLoadedDetails: initialDetails !== undefined ? true : false,
        // isLoadingDetails: initialDetails === undefined ? true : false,
        doLoading: false,
        // loadingParams: { swUnsetCurrentTask: false, new_id: undefined },
        loadingParams: { new_id: undefined },
        isRestricted: false,
        wasRestricted: true,
        // current: initialDetails,
        current: undefined,
    });
    //--------------------------------------
    useEffect(() => {
        if (state.isLoadingDetails === true && isHandlingDetailsEvents === true) {
            console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] useEffects isLoadingDetails`);
            if (onLoadingDetails !== undefined) {
                onLoadingDetails();
            }
        }
    }, [state.isLoadingDetails]);
    //--------------------------------------
    useEffect(() => {
        if (state.isLoadedDetails === true && isHandlingDetailsEvents === true) {
            console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] useEffects isLoadedDetails`);
            if (onLoadedDetails !== undefined) {
                onLoadedDetails();
            }
            setTriggerScroll(true);
        }
    }, [state.isLoadedDetails]);
    //--------------------------------------
    useEffect(() => {
        if (triggerScroll === true) {
            console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] useEffects triggerScroll`);
            scrollToDetails();
            setTriggerScroll(false);
        }
    }, [triggerScroll]);
    //--------------------------------------


    //--------------------------------------
    useEffect(() => {
        // este se va a usar solamente para cambiar el estado de retriccion del usuario
        if (checkIfRestricted !== undefined) {
            let isUserRestricted = checkIfRestricted(status, session, walletStore);
            // alert(`${nameDetails} - wallet cambio: isUserRestricted ${isUserRestricted}`);
            // console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] useEffects wallet cambio: isUserRestricted ${isUserRestricted}`);
            dispatch({ type: isUserRestricted ? 'restrict_user' : 'unrestrict_user' });
        }
    }, [status, walletStore.isWalletPrivilegesLoaded]);
    //--------------------------------------
    useEffect(() => {
        //--------------------------------------
        // console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] useEffects refreshDetails because was restricted or dependencies changed`);
        //--------------------------------------
        // console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] useEffects ${toJson(state)} ${toJson(dependencies)}`);
        //--------------------------------------
        if (state.isRestricted === false && state.wasRestricted === true && checkIfRestricted !== undefined) {
            // alert(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] refreshDetails because was restricted`);
            if (checkDependencies === undefined) {
                refreshDetails();
                dispatch({ type: 'wasRestricted', payload: false });
            } else {
                if (checkDependencies() === true) {
                    refreshDetails();
                    dispatch({ type: 'wasRestricted', payload: false });
                }
            }
        } else {
            // alert(`${nameDetails} - refreshDetails because dependencies changed`);
            if (checkDependencies === undefined) {
                refreshDetails();
            } else {
                if (checkDependencies() === true) {
                    refreshDetails();
                }
            }
        }
    }, [state.isRestricted, ...dependencies]);
    //--------------------------------------
    useEffect(() => {
        //--------------------------------------
        if (state.doLoading === true) {
            const fetch = async () => {
                try {
                    let details: T | undefined = await loadDetails(state.loadingParams.new_id);
                    // if (state.loadingParams.swUnsetCurrentTask) {
                    //     setCurrentTask(undefined);
                    // }
                    dispatch({ type: 'finish_loading', payload: details });
                } catch (error) {
                    console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] Error fetching details: ${error}`);
                    pushWarningNotification('MAYZ Protocol', 'Error fetching details: ' + error);
                    dispatch({ type: 'finish_loading', payload: undefined });
                }
            };
            fetch();
        }
        //--------------------------------------
    }, [state.doLoading]);
    //--------------------------------------
    const refreshDetails = async (new_id?: string) => {
        // const refreshDetails = async (swUnsetCurrentTask: boolean = true, new_id?: string) => {
        //----------------
        // console.log(`${nameDetails ? '[' + nameDetails + ']' + ' - ' : ''}[Details] refreshDetails`);
        //----------------
        if (state.isRestricted === false) {
            dispatch({ type: 'start_loading', payload: { new_id } });
        }
    };
    //--------------------------------------
    const setCurrent = (current: T | undefined) => {
        dispatch({ type: 'finish_loading', payload: current });
    };
    //--------------------------------------
    return {
        isLoadingDetails: state.isLoadingDetails,
        isLoadedDetails: state.isLoadedDetails,
        current: state.current,
        setCurrent,
        refreshDetails,
        detailsDivRef,
        scrollToDetails,setTriggerScroll
    };
};
