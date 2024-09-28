import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { AuthApi, Credentials, pushSucessNotification, useDetails, useWalletStore } from 'smart-db';

export const useWalletApiKey = () => {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const loadDetails = async () => {
        let token: string | undefined;
        const lucid = await walletStore.getLucid();
        if (status === 'authenticated' && lucid !== undefined && session && session.user && apiToken === '') {
            const credentials: Credentials = {
                address: session.user.address,
                walletNameOrSeedOrKey: session.user.walletNameOrSeedOrKey,
                useBlockfrostToSubmit: session.user.useBlockfrostToSubmit ? 'true' : 'false',
                isWalletFromSeed: session.user.isWalletFromSeed ? 'true' : 'false',
                isWalletFromKey: session.user.isWalletFromKey ? 'true' : 'false',
            };
            //--------------------------------------
            token = await AuthApi.generateAuthTokensApi(lucid, credentials, true);
        }
        return token;
    };
    //--------------------------------------
    function checkDependencies() {
        let doLoadDetails = false;
        if (isOpen === true) {
            doLoadDetails = true;
        }
        return doLoadDetails;
    }
    //--------------------------------------
    const [isOpen, setIsOpen] = useState(false);
    //--------------------------------------
    const { isLoadingDetails, isLoadedDetails, current } = useDetails<string>({
        nameDetails: 'Api Token',
        loadDetails,
        checkDependencies,
        dependencies: [isOpen],
    });
    //--------------------------------------
    const handleOpen = () => {
        setIsOpen(true);
    };
    const handleClose = () => setIsOpen(false);
    //--------------------------------------
    const handleCopy = () => {
        navigator.clipboard.writeText(apiToken);
        pushSucessNotification(`SmartDB`, `Copied to clipboard!`, false);
    };
    //--------------------------------------
    const { data: session, status } = useSession();
    //--------------------------------------
    const [apiToken, setApiToken] = useState('');
    const [isReady, setIsReady] = useState(false);
    //--------------------------------------
    const walletStore = useWalletStore();
    //--------------------------------------
    useEffect(() => {
        if (current !== undefined) {
            setApiToken(current);
        }
    }, [current]);
    //--------------------------------------
    useEffect(() => {
        if (status === 'authenticated' && walletStore.isConnected === true) {
            setIsReady(true);
        }
    }, [status, walletStore.isConnected]);
    //--------------------------------------
    return {
        isRefreshing,
        walletStore,
        isReady,
        isLoadedDetails,
        isLoadingDetails,
        apiToken,
        isOpen,
        handleOpen,
        handleClose,
        handleCopy,
    };
    //--------------------------------------
};
