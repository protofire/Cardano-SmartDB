import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTokensStore, useWalletStore } from '../store/useGlobalStore.js';
import { CardanoWallet } from '../Commons/types.js';
import { pushSucessNotification, pushWarningNotification } from '../Commons/pushNotification.js';
import { explainError } from '../Commons/explainError.js';
import { sleep } from '../Commons/utils.js';
import { CONNECT_WALLET_WAIT_FOR_WALLET_ACTIVATION_MS } from '../Commons/Constants/constants.js';
import { useLocalStorage } from './useLocalStorage.js';

export function useWalletSession() {
    //--------------------------------------
    const { data: session, status } = useSession();
    //--------------------------------------
    const { checkSessionAndConnectIfNeeded } = useWalletActions();
    //--------------------------------------
    useEffect(() => {
        if (status === 'authenticated') {
            console.log(`[WalletConnector] - Session authenticated, might trigger a wallet connection... (status: ${status})`);
            checkSessionAndConnectIfNeeded();
        } else if (status === 'unauthenticated') {
            console.log(`[WalletConnector] - No Session`);
        } else if (status === 'loading') {
            console.log(`[WalletConnector] - Loading Session`);
        }
    }, [status]);
}

export function useWalletActions() {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const { data: session, status } = useSession();
    //--------------------------------------
    const [walletSelected, setWalletSelected] = useState<string | undefined>();
    //--------------------------------------
    const [createSignedSession, setCreateSignedSession] = useState(false);
    //--------------------------------------
    const [swHideBalance, setHideBalance] = useLocalStorage<boolean | undefined>('HideBalance', undefined);
    const [swDoNotPromtForSigning, setSwDoNotPromtForSigning] = useLocalStorage<boolean | undefined>('DoNotPromtForSigning', undefined);
    //--------------------------------------
    const walletStore = useWalletStore();
    const tokensStore = useTokensStore();
     //--------------------------------------
     useEffect(() => {
        if (walletStore.swDoNotPromtForSigning !== swDoNotPromtForSigning && swDoNotPromtForSigning !== undefined) {
            walletStore.setSwDoNotPromtForSigning(swDoNotPromtForSigning);
        }
    }, [swDoNotPromtForSigning]);
     //--------------------------------------
     useEffect(() => {
        if (walletStore.swHideBalance !== swHideBalance && swHideBalance !== undefined) {
            walletStore.setSwHideBalance(swHideBalance);
        }
    }, [swHideBalance]);
     //--------------------------------------
     const handleToggleIsHide = () => {
        // walletStore.setSwHideBalance(!walletStore.swHideBalance);
        setHideBalance(!swHideBalance);
    };
    //--------------------------------------
    const handleClickToggleDontPromtForSigning = () => {
        // walletStore.setSwDoNotPromtForSigning(!walletStore.swDoNotPromtForSigning);
        setSwDoNotPromtForSigning(!swDoNotPromtForSigning);
    };
    //--------------------------------------
    const walletConnect = async (wallet: CardanoWallet, createSignedSession: boolean, forceConnect: boolean = false, tryAgain = false, closeModal?: () => void) => {
        console.log('[WalletConnector] - walletConnect: ' + wallet.wallet);
        try {
            setWalletSelected(wallet.wallet);
            if (
                await walletStore.connectWallet({
                    session,
                    status,
                    walletName: wallet.wallet,
                    forceConnect,
                    tryAgain,
                    useBlockfrostToSubmit: false,
                    isWalletFromSeed: false,
                    isWalletFromKey: false,
                    createSignedSession,
                })
            ) {
                pushSucessNotification(`WalletConnector`, `Connected with <b> ${wallet.wallet}</b>!`, false);
                if (closeModal) {
                    closeModal();
                }
            }
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletConnect - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error connecting with <b> ${wallet.wallet}</b><br></br> ${error_explained}`);
        } finally {
            setWalletSelected(undefined);
        }
    };
    //--------------------------------------
    const walletFromSeedConnect = async (walletName: string, walletSeed: string, createSignedSession: boolean, forceConnect: boolean = false, closeModal?: () => void) => {
        console.log(`[WalletConnector] - walletFromSeedConnect`);
        try {
            setWalletSelected(walletName);
            if (
                await walletStore.connectWallet({
                    session,
                    status,
                    walletName: walletName,
                    walletSeed: walletSeed,
                    forceConnect,
                    tryAgain: false,
                    useBlockfrostToSubmit: false,
                    isWalletFromSeed: true,
                    isWalletFromKey: false,
                    createSignedSession,
                })
            ) {
                pushSucessNotification(`WalletConnector`, `Connected with <b> ${walletName}</b>!`, false);
                if (closeModal) {
                    closeModal();
                }
            }
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletFromSeedConnect - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error connecting with <b> ${walletName}</b><br></br> ${error_explained}`);
        } finally {
            setWalletSelected(undefined);
        }
    };
    //--------------------------------------
    const walletFromKeyConnect = async (walletName: string, walletKey: string, createSignedSession: boolean, forceConnect: boolean = false, closeModal?: () => void) => {
        console.log(`[WalletConnector] - walletFromKeyConnect`);
        try {
            setWalletSelected(walletName);
            if (
                await walletStore.connectWallet({
                    session,
                    status,
                    walletName: walletName,
                    walletKey: walletKey,
                    forceConnect,
                    tryAgain: false,
                    useBlockfrostToSubmit: false,
                    isWalletFromSeed: false,
                    isWalletFromKey: true,
                    createSignedSession,
                })
            ) {
                pushSucessNotification(`WalletConnector`, `Connected with <b> ${walletName}</b>!`, false);
                if (closeModal) {
                    closeModal();
                }
            }
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletFromKeyConnect - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error connecting with <b> ${walletName}</b><br></br> ${error_explained}`);
        } finally {
            setWalletSelected(undefined);
        }
    };
    //--------------------------------------
    const walletInstall = async (wallet: CardanoWallet) => {
        try {
            const url = wallet.link;
            window.open(url, '_blank');
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - Error opening install link: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error opening install link<br></br> ${error_explained}`);
        }
    };

    const walletRefresh = async () => {
        console.log('[WalletConnector] - walletRefresh: ' + walletStore.info!.walletName);
        try {
            await walletStore.loadWalletPrivileges();
            await walletStore.loadWalletData();
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletRefresh - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error refreshing with <b> ${walletStore.info!.walletName}</b><br></br> ${error_explained}`);
        }
    };
    //--------------------------------------
    const walletDisconnect = async (closeModal?: () => void) => {
        console.log(`[WalletConnector] - walletDisconnect`);
        try {
            await walletStore.disconnectWallet({ session, status });
            if (closeModal) {
                closeModal();
            }
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletDisconnect - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error Disconnecting Wallet: ${error_explained}`);
            if (status === 'authenticated') {
                await signOut({ redirect: false });
            }
        }
    };
    //--------------------------------------
    async function sessionWalletConnect() {
        try {
            if (session && session.user && session.user.walletName) {
                //console.log(`[Session] - walletConnect - session.walletName: ${session.user.walletName}`)
                const foundWallet = walletStore.cardanoWallets.find((wallet) => wallet.wallet === session.user!.walletName);
                if (window.cardano !== undefined && (foundWallet || session.user.isWalletFromSeed || session.user.isWalletFromKey)) {
                    //si la wallet estaba conectada en la session anterior, tengo que reconectarla
                    console.log('[WalletConnector] - Triggering a connection with session wallet: ' + session.user.walletName);
                    if (session.user.isWalletFromSeed) {
                        if (session.user.walletSeed === undefined) {
                            throw 'No walletSeed in session';
                        }
                        await walletFromSeedConnect(session.user.walletName, session.user.walletSeed, session.user.isWalletValidatedWithSignedToken, false);
                    } else if (session.user.isWalletFromKey) {
                        if (session.user.walletKey === undefined) {
                            throw 'No walletKey in session';
                        }
                        await walletFromKeyConnect(session.user.walletName, session.user.walletKey, session.user.isWalletValidatedWithSignedToken, false);
                    } else {
                        await sleep(CONNECT_WALLET_WAIT_FOR_WALLET_ACTIVATION_MS);
                        await walletConnect(foundWallet!, session.user.isWalletValidatedWithSignedToken, false, true);
                    }
                } else {
                    console.log('[WalletConnector] - Not connecting to any wallet. Wallet of previus session not found: ' + session.user.walletName);
                    throw 'Wallet of previus session not found';
                }
            } else {
                throw 'No wallet in session';
            }
        } catch (error) {
            console.log(`[WalletConnector] - sessionWalletConnect - Error: ${error}`);
            await signOut({ redirect: false });
        }
    }
    //--------------------------------------
    async function checkSessionAndConnectIfNeeded() {
        if (walletStore.isConnected) {
            let isSessionValid = false;
            if (session && session.user && walletStore.info) {
                isSessionValid = await walletStore.checkSessionValidity({
                    user: session.user,
                    walletInfo: walletStore.info,
                    isCoreTeam: walletStore.isCoreTeam(),
                });
            }
            const swUpdateSession = !isSessionValid;
            if (swUpdateSession) {
                console.log(
                    `[WalletConnector] - Session authenticated and wallet is already connected but not all fields match. Must reconnect wallet. Triggering a connection...`
                );
                await sessionWalletConnect();
            } else {
                console.log(`[WalletConnector] - Session authenticated and wallet is already connected and all fields match.`);
            }
        } else {
            if (walletStore.isConnecting) {
                console.log(`[WalletConnector] - Session authenticated and wallet is already connecting... must wait`);
            } else {
                console.log(`[WalletConnector] - Session authenticated and wallet is not Connected. Triggering a connection...`);
                await sessionWalletConnect();
            }
        }
    }
    //--------------------------------------
    const handleClickToggleAdminMode = async () => {
        try {
            if (session && session.user && session.user.walletName) {
                const foundWallet = walletStore.cardanoWallets.find((wallet) => wallet.wallet === session.user!.walletName);
                if (window.cardano !== undefined && (foundWallet || session.user.isWalletFromSeed || session.user.isWalletFromKey)) {
                    console.log('[WalletConnector] - Triggering a re-connection with wallet: ' + session.user.walletName);
                    if (session.user.isWalletFromSeed) {
                        if (session.user.walletSeed === undefined) {
                            throw 'No walletSeed in session';
                        }
                        await walletFromSeedConnect(session.user.walletName, session.user.walletSeed, !walletStore.info?.isWalletValidatedWithSignedToken, true);
                    } else if (session.user.isWalletFromKey) {
                        if (session.user.walletKey === undefined) {
                            throw 'No walletKey in session';
                        }
                        await walletFromKeyConnect(session.user.walletName, session.user.walletKey, !walletStore.info?.isWalletValidatedWithSignedToken, true);
                    } else {
                        await sleep(CONNECT_WALLET_WAIT_FOR_WALLET_ACTIVATION_MS);
                        await walletConnect(foundWallet!, !walletStore.info?.isWalletValidatedWithSignedToken, true, true);
                    }
                } else {
                    console.log('[WalletConnector] - Not connecting to any wallet. Wallet not found: ' + session.user.walletName);
                    throw 'Wallet not found';
                }
            } else {
                throw 'No wallet in session';
            }
        } catch (error) {
            console.log(`[WalletConnector] - handleClickToggleAdminMode - Error: ${error}`);
            await signOut({ redirect: false });
        }
    };
    //--------------------------------------
    return {
        isRefreshing,
        tokensStore,
        session,
        status,
        walletStore,
        walletSelected,
        setWalletSelected,
        createSignedSession,
        setCreateSignedSession,
        walletConnect,
        walletFromSeedConnect,
        walletFromKeyConnect,
        walletInstall,
        walletRefresh,
        walletDisconnect,
        checkSessionAndConnectIfNeeded,
        handleClickToggleAdminMode,
        handleClickToggleDontPromtForSigning,
        handleToggleIsHide,
    };
    //--------------------------------------
}
