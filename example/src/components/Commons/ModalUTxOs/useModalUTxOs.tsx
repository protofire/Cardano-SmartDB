import { UTxO } from 'lucid-cardano';
import { useEffect, useState } from 'react';
import { useWalletStore, useAppStore, useList } from 'smart-db';

export const useModalUTxOsAndBalance = ({ address, uTxOs, showBalance = false }: { address: string; uTxOs?: UTxO[]; showBalance?: boolean }) => {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const walletStore = useWalletStore();
    const appStore = useAppStore();
    //--------------------------------------
    const loadList = async () => {
        let fetchedUTxOs: UTxO[] = [];
        if (uTxOs === undefined) {
            const lucid = (await walletStore.getLucid()) || (await walletStore.getLucidForUseAsUtils());
            if (lucid) {
                fetchedUTxOs = await lucid.utxosAt(address);
            }
        } else {
            fetchedUTxOs = uTxOs;
        }
        return fetchedUTxOs;
    };
    //--------------------------------------
    const [isOpen, setIsOpen] = useState(false);
    //--------------------------------------
    function checkDependencies() {
        let doLoadList = false;
        if (isOpen === true) {
            doLoadList = true;
        }
        return doLoadList;
    }
    //--------------------------------------
    const { isLoadingList, isLoadedList, list, current, refreshList } = useList<UTxO>({
        nameList: 'UTxOs',
        loadList,
        checkDependencies,
        dependencies: [isOpen],
    });
    //--------------------------------------
    const [showBalance_, setShowBalance] = useState(showBalance);
    //--------------------------------------
    const handleOpen = () => {
        setIsOpen(true);
    };
    const handleClose = () => setIsOpen(false);
    //--------------------------------------
    useEffect(() => {
        setShowBalance(showBalance);
    }, []);
    //--------------------------------------
    return {
        appStore,
        isRefreshing,
        isLoadingList,
        list,
        showBalance_,
        isOpen,
        handleOpen,
        handleClose,
        setShowBalance,
    };
    //--------------------------------------
};
