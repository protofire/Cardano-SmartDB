import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTokensStore, useWalletStore } from '../store/useGlobalStore.js';
import { CardanoWallet } from '../Commons/types.js';
import { pushSucessNotification, pushWarningNotification } from '../Commons/pushNotification.js';
import { explainError } from '../Commons/explainError.js';

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
    const walletStore = useWalletStore();
    const tokensStore = useTokensStore();
    //--------------------------------------
    const walletConnect = async (wallet: CardanoWallet, createSignedSession: boolean, forceConnect: boolean = false, closeModal = true, tryAgain = false) => {
        console.log('[WalletConnector] - walletConnect: ' + wallet.name);
        try {
            setWalletSelected(wallet.wallet);
            if (
                await walletStore.connectWallet({
                    session,
                    status,
                    walletNameOrSeedOrKey: wallet.wallet,
                    forceConnect,
                    tryAgain,
                    useBlockfrostToSubmit: false,
                    isWalletFromSeed: false,
                    isWalletFromKey: false,
                    createSignedSession,
                })
            ) {
                pushSucessNotification(`WalletConnector`, `Connected with <b> ${wallet.name}</b>!`, false);
            }
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletConnect - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error connecting with <b> ${wallet.name}</b><br></br> ${error_explained}`);
        } finally {
            setWalletSelected(undefined);
        }
    };
    //--------------------------------------
    const walletFromSeedConnect = async (walletSeed: string, createSignedSession: boolean, forceConnect: boolean = false, closeModal = true) => {
        console.log(`[WalletConnector] - walletFromSeedConnect`);
        try {
            setWalletSelected(walletSeed);
            if (
                await walletStore.connectWallet({
                    session,
                    status,
                    walletNameOrSeedOrKey: walletSeed,
                    forceConnect,
                    tryAgain: false,
                    useBlockfrostToSubmit: false,
                    isWalletFromSeed: true,
                    isWalletFromKey: false,
                    createSignedSession,
                })
            ) {
                pushSucessNotification(`WalletConnector`, `Connected with <b> ${walletSeed}</b>!`, false);
            }
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletFromSeedConnect - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error connecting with <b> ${walletSeed}</b><br></br> ${error_explained}`);
        } finally {
            setWalletSelected(undefined);
        }
    };
    //--------------------------------------
    const walletFromKeyConnect = async (walletKey: string, createSignedSession: boolean, forceConnect: boolean = false, closeModal = true) => {
        console.log(`[WalletConnector] - walletFromKeyConnect`);
        try {
            setWalletSelected(walletKey);
            if (
                await walletStore.connectWallet({
                    session,
                    status,
                    walletNameOrSeedOrKey: walletKey,
                    forceConnect,
                    tryAgain: false,
                    useBlockfrostToSubmit: false,
                    isWalletFromSeed: false,
                    isWalletFromKey: true,
                    createSignedSession,
                })
            ) {
                pushSucessNotification(`WalletConnector`, `Connected with <b> ${walletKey}</b>!`, false);
            }
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletFromKeyConnect - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error connecting with <b> ${walletKey}</b><br></br> ${error_explained}`);
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
        console.log('[WalletConnector] - walletRefresh: ' + walletStore.info!.walletNameOrSeedOrKey);
        try {
            await walletStore.loadWalletPrivileges();
            await walletStore.loadWalletData();
        } catch (error) {
            const error_explained = explainError(error);
            console.log(`[WalletConnector] - walletRefresh - Error: ${error_explained}`);
            pushWarningNotification(`WalletConnector`, `Error refreshing with <b> ${walletStore.info!.walletNameOrSeedOrKey}</b><br></br> ${error_explained}`);
        }
    };
    //--------------------------------------
    const walletDisconnect = async (closeModal = true) => {
        console.log(`[WalletConnector] - walletDisconnect`);
        try {
            await walletStore.disconnectWallet({ session, status });
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
            if (session && session.user && session.user.walletNameOrSeedOrKey) {
                //console.log(`[Session] - walletConnect - session.walletNameOrSeedOrKey: ${session.user.walletNameOrSeedOrKey}`)
                const foundWallet = walletStore.cardanoWallets.find((wallet) => wallet.wallet === session.user!.walletNameOrSeedOrKey);
                if (window.cardano !== undefined && (foundWallet || session.user.isWalletFromSeed || session.user.isWalletFromKey)) {
                    //si la wallet estaba conectada en la session anterior, tengo que reconectarla
                    console.log('[WalletConnector] - Triggering a connection with session wallet: ' + session.user.walletNameOrSeedOrKey);
                    await new Promise((r) => setTimeout(r, 1000));
                    if (session.user.isWalletFromSeed) {
                        await walletFromSeedConnect(session.user.walletNameOrSeedOrKey, session.user.isWalletValidatedWithSignedToken, false, false);
                    } else if (session.user.isWalletFromKey) {
                        await walletFromKeyConnect(session.user.walletNameOrSeedOrKey, session.user.isWalletValidatedWithSignedToken, false, false);
                    } else {
                        await walletConnect(foundWallet!, session.user.isWalletValidatedWithSignedToken, false, false, true);
                    }
                } else {
                    console.log('[WalletConnector] - Not connecting to any wallet. Wallet of previus session not found: ' + session.user.walletNameOrSeedOrKey);
                    throw 'Wallet of previus session not found';
                }
            } else {
                throw 'No wallet Name Or Seed Or Key in session';
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
            if (session && session.user && session.user.walletNameOrSeedOrKey) {
                const foundWallet = walletStore.cardanoWallets.find((wallet) => wallet.wallet === session.user!.walletNameOrSeedOrKey);
                if (window.cardano !== undefined && (foundWallet || session.user.isWalletFromSeed || session.user.isWalletFromKey)) {
                    console.log('[WalletConnector] - Triggering a re-connection with wallet: ' + session.user.walletNameOrSeedOrKey);
                    await new Promise((r) => setTimeout(r, 1000));
                    if (session.user.isWalletFromSeed) {
                        await walletFromSeedConnect(session.user.walletNameOrSeedOrKey, session.user.isWalletValidatedWithSignedToken, false, false);
                    } else if (session.user.isWalletFromKey) {
                        await walletFromKeyConnect(session.user.walletNameOrSeedOrKey, session.user.isWalletValidatedWithSignedToken, false, false);
                    } else {
                        await walletConnect(foundWallet!, !walletStore.info?.isWalletValidatedWithSignedToken, true, false, true);
                    }
                } else {
                    console.log('[WalletConnector] - Not connecting to any wallet. Wallet not found: ' + session.user.walletNameOrSeedOrKey);
                    throw 'Wallet not found';
                }
            } else {
                throw 'No Wallet Name Or Seed Or Key in session';
            }
        } catch (error) {
            console.log(`[WalletConnector] - handleClickToggleAdminMode - Error: ${error}`);
            await signOut({ redirect: false });
        }
    };
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
    };
    //--------------------------------------
}
