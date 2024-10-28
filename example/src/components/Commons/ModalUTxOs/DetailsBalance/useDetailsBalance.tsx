import { UTxO } from 'lucid-cardano';
import { useEffect, useState } from 'react';
import { getAssetOfUTxOs, TokenMetadataFrontEndApiCalls, TokensWithMetadataAndAmount, useAppStore, useDetails } from 'smart-db';

export const useDetailsBalance = ({ uTxOs }: { uTxOs: UTxO[] }) => {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const appStore = useAppStore();
    //--------------------------------------
    const loadDetails = async () => {
        const totalAssets = getAssetOfUTxOs(uTxOs);
        const assetDetails = await TokenMetadataFrontEndApiCalls.getAssetsWithDetailsApi(totalAssets);
        return assetDetails;
    };
    //--------------------------------------
    const { isLoadingDetails, isLoadedDetails, current, refreshDetails } = useDetails<TokensWithMetadataAndAmount>({ nameDetails: 'Balance', loadDetails });
    //--------------------------------------
    return {
        appStore,
        isRefreshing,
        isLoadingDetails,
        isLoadedDetails,
        current,
        refreshDetails,
    };
    //--------------------------------------
};
