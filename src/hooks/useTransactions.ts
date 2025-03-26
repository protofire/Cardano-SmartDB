import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Token_With_Metadata_And_Amount, TxComponentProps, WalletTxParams } from "../Commons/types.js";
import { useRouter } from "next/router.js";
import { useSession } from "next-auth/react";
import { useAppStore, useTokensStore, useWalletStore } from "../store/useGlobalStore.js";
import { TransactionFrontEndApiCalls } from "../FrontEnd/ApiCalls/Transaction.FrontEnd.Api.Calls.js";
import { IUseWalletStore } from "../store/types.js";
import { Lucid, LucidEvolution } from '@lucid-evolution/lucid';
import { explainErrorTx, isNullOrBlank, pushWarningNotification } from "../Commons/index.js";
import { BaseSmartDBEntity, EmulatorEntity } from "../Entities/index.js";


interface TransactionProps {
    dependenciesValidTx?: any[];
    checkIsValidTx?: () => Promise<boolean>;
}

export const useTransactions = (props: TransactionProps & TxComponentProps) => {
    //--------------------------------------
    const { checkIsValidTx } = props;
    //--------------------------------------
    const dependenciesValidTx = props.dependenciesValidTx ?? [];
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const router = useRouter();
    //--------------------------------------
    const { data: session, status } = useSession();
    //--------------------------------------
    const walletStore = useWalletStore();
    const appStore = useAppStore();
    const tokensStore = useTokensStore();
    //--------------------------------------
    const [available_ADA_in_Wallet, setAvailable_ADA_in_Wallet] = useState(0n);
    const [available_forSpend_ADA_in_Wallet, setAvailable_forSpend_ADA_in_Wallet] = useState(0n);
    const [isMaxAmountLoaded, setIsMaxAmountLoaded] = useState(false);
    //--------------------------------------
    useEffect(() => {
        console.log('[Transactions] Component mounted');
        // Function to release UTXOs when page closes or component unmounts
        const releaseUTXOs = async () => {
            if (!isNullOrBlank(processingTxHash)) {
                console.warn(`[Transactions] - Releasing locked isPreparing UTXOs for txHash: ${processingTxHash}`);
                await TransactionFrontEndApiCalls.releaseUTxOsApi(processingTxHash, true, false);
            }
        };
        // Ensure UTXOs are released when page closes
        window.addEventListener('beforeunload', releaseUTXOs);
        return () => {
            console.log('[Transactions] Component unmounted');
            // Ensure UTXOs are released when component is unmounted
            releaseUTXOs();
            // Cleanup event listener to prevent memory leaks
            window.removeEventListener('beforeunload', releaseUTXOs);
        };
    }, []); // Runs only on mount/unmount

    //--------------------------------------
    useEffect(() => {
        if (walletStore.isWalletDataLoaded === true) {
            //--------------------------------------
            setIsMaxAmountLoaded(false);
            //--------------------------------------
            const available_ADA_in_Wallet = walletStore.getTotalOfUnit('lovelace');
            const available_forSpend_ADA_in_Wallet = walletStore.getTotalOfUnit('lovelace', true);
            //-----------
            setAvailable_ADA_in_Wallet(available_ADA_in_Wallet);
            setAvailable_forSpend_ADA_in_Wallet(available_forSpend_ADA_in_Wallet);
            //--------------------------------------
            setIsMaxAmountLoaded(true);
            //-----------
        }
    }, [walletStore.isWalletDataLoaded]);
    //--------------------------------------
    const [showUserConfirmation, setShowUserConfirmation] = useState(false);
    const [showProcessingTx, setShowProcessingTx] = useState(true);
    const [isProcessingTx, setIsProcessingTx] = useState(false);
    const [isFaildedTx, setIsFaildedTx] = useState(false);
    const [isConfirmedTx, setIsConfirmedTx] = useState(false);
    const [processingTxMessage, setProcessingTxMessage] = useState('');
    const [processingTxHash, setProcessingTxHash] = useState('');
    const [isValidTx, setIsValidTx] = useState(true);
    //--------------------------------------
    const [tokensGiveWithMetadata, setTokensGiveWithMetadata] = useState<Token_With_Metadata_And_Amount[]>([]);
    const [tokensGetWithMetadata, setTokensGetWithMetadata] = useState<Token_With_Metadata_And_Amount[]>([]);
    //--------------------------------------
    useEffect(() => {
        appStore.setIsProcessingTx(isProcessingTx);
    }, [isProcessingTx]);
    //--------------------------------------
    useEffect(() => {
        if (checkIsValidTx) {
            const check = async () => {
                const isValidTx = await checkIsValidTx();
                setIsValidTx(isValidTx);
            };
            check();
        }
    }, [available_ADA_in_Wallet,  isMaxAmountLoaded, ...dependenciesValidTx]);
    //--------------------------------------
   
    const resetTx = async () => {
        // setShowUserConfirmation(false);
        // setShowProcessingTx(false);
        // setIsProcessingTx(false);
        // setIsFaildedTx(false);
        // setIsConfirmedTx(false);
        // setProcessingTxMessage('');
        // setProcessingTxHash('');
        setTokensGiveWithMetadata([]);
        setTokensGetWithMetadata([]);
        // if (props.resetForm !== undefined) {
        //     await props.resetForm();
        // }
    };
    //--------------------------------------
    const handleBtnShowUserConfirmation = async () => {
        setShowUserConfirmation(true);
    };
    //--------------------------------------
    // NOTE: funciona ok, pero delega el control de errores al handle button with error control
    const handleBtnDoTransaction_NoErrorControl = async (
        handleBtnTxWithErrorControl: (
            setProcessingTxMessage: Dispatch<SetStateAction<string>>,
            setProcessingTxHash: Dispatch<SetStateAction<string>>,
            walletStore: IUseWalletStore
        ) => Promise<boolean>
    ): Promise<void> => {
        try {
            setShowUserConfirmation(false);
            setShowProcessingTx(true);
            setIsProcessingTx(true);
            setIsFaildedTx(false);
            setIsConfirmedTx(false);
            setProcessingTxMessage('');
            setProcessingTxHash('');
            if (isValidTx) {
                const result = await handleBtnTxWithErrorControl(setProcessingTxMessage, setProcessingTxHash, walletStore);
                if (result === true) {
                    if (props.onTx !== undefined) {
                        await props.onTx();
                    }
                    setIsConfirmedTx(true);
                    await resetTx();
                } else {
                    setIsFaildedTx(true);
                }
            } else {
                setIsFaildedTx(true);
            }
        } catch (error) {
            setIsFaildedTx(true);
        } finally {
            setIsProcessingTx(false);
        }
    };

    //--------------------------------------
    const handleBtnDoTransaction_WithErrorControl = async (
        Entity: typeof BaseSmartDBEntity,
        modalTitleTx: string,
        messageActionTx: string,
        txApiRoute: string,
        fetchParams: () => Promise<{
            lucid: LucidEvolution;
            emulatorDB: EmulatorEntity | undefined;
            walletTxParams: WalletTxParams;
            txParams: any;
        }>,
        txApiCall: (Entity: typeof BaseSmartDBEntity, txApiRoute: string, walletTxParams: WalletTxParams, txParams: any) => Promise<any>,
        handleBtnTxNoErrorControl: (
            Entity: typeof BaseSmartDBEntity,
            modalTitleTx: string,
            messageActionTx: string,
            lucid: LucidEvolution,
            emulatorDB: EmulatorEntity | undefined,
            apiTxCall: () => Promise<any>,
            setProcessingTxMessage: (value: string) => void,
            setProcessingTxHash: (value: string) => void,
            walletStore: IUseWalletStore
        ) => Promise<void>
    ): Promise<void> => {
        try {
            setShowUserConfirmation(false);
            setShowProcessingTx(true);
            setIsProcessingTx(true);
            setIsFaildedTx(false);
            setIsConfirmedTx(false);
            setProcessingTxMessage('Preparing...');
            setProcessingTxHash('');
            if (isValidTx) {
                const { lucid, emulatorDB, walletTxParams, txParams } = await fetchParams();
                const api = txApiCall.bind(txApiCall, Entity, txApiRoute, walletTxParams, txParams);
                await handleBtnTxNoErrorControl(Entity, modalTitleTx, messageActionTx, lucid, emulatorDB, api, setProcessingTxMessage, setProcessingTxHash, walletStore);
                if (props.onTx !== undefined) {
                    await props.onTx();
                }
                setIsConfirmedTx(true);
                await resetTx();
            } else {
                throw new Error('Transaction is not valid');
            }
        } catch (error) {
            setIsFaildedTx(true);
            const error_explained = explainErrorTx(error);
            console.log(`[${Entity.className()}] - handleBtnDoTransactionExtended - Error: ${error_explained}`);
            pushWarningNotification(`${Entity.className()} ${modalTitleTx}`, error_explained);
            setProcessingTxMessage(error_explained);
        } finally {
            setIsProcessingTx(false);
        }
    };
    //--------------------------------------
    return {
        appStore,
        walletStore,
        tokensStore,
        session,
        status,
        showUserConfirmation,
        setShowUserConfirmation,
        showProcessingTx,
        setShowProcessingTx,
        isProcessingTx,
        setIsProcessingTx,
        isFaildedTx,
        setIsFaildedTx,
        isConfirmedTx,
        setIsConfirmedTx,
        processingTxMessage,
        setProcessingTxMessage,
        processingTxHash,
        setProcessingTxHash,
        isValidTx,
        setIsValidTx,
        tokensGiveWithMetadata,
        setTokensGiveWithMetadata,
        tokensGetWithMetadata,
        setTokensGetWithMetadata,
        available_ADA_in_Wallet,
        available_forSpend_ADA_in_Wallet,
        isMaxAmountLoaded,
        handleBtnShowUserConfirmation,
        handleBtnDoTransaction_NoErrorControl,
        handleBtnDoTransaction_WithErrorControl,
    };
    //--------------------------------------
};
