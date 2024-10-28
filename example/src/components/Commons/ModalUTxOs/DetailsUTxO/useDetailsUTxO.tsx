import { UTxO } from 'lucid-cardano';
import { useEffect, useState } from 'react';
import { TokenMetadataFrontEndApiCalls, useAppStore, useList, UTxOWithDetails } from 'smart-db';

export const useDetailsUTxOs = ({ uTxOs }: { uTxOs: UTxO[] }) => {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const appStore = useAppStore();
    //--------------------------------------
    const loadList = async () => {
        const uTxOsWithDetails = await Promise.all(
            uTxOs.map(async (key) => {
                const assetWithDetails = await TokenMetadataFrontEndApiCalls.getAssetsWithDetailsApi(key.assets);
                return {
                    ...key,
                    assetWithDetails,
                    hasScriptRef: key.scriptRef !== undefined ? 'Yes' : 'No',
                };
            })
        );
        return uTxOsWithDetails;
    };
    //--------------------------------------
    const { isLoadingList, isLoadedList, list, current, refreshList } = useList<UTxOWithDetails>({ nameList: 'UTxOWithDetails', loadList });
    //--------------------------------------
    return {
        //--------------------------------------
        appStore,
        isRefreshing,
        isLoadingList,
        isLoadedList,
        uTxOsWithDetails: list,
        refreshList,
    };
    //--------------------------------------
};
