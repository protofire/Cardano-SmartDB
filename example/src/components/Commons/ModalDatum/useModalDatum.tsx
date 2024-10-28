import { DummyEntity, FreeEntity } from '@example/src/lib/SmartDB/Entities';
import { UTxO } from 'lucid-cardano';
import { useEffect, useState } from 'react';
import { AddressToFollowFrontEndApiCalls, useAppStore } from 'smart-db';

export const useModalDatum = ({ uTxO }: { uTxO: UTxO }) => {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const appStore = useAppStore();
    //--------------------------------------
    const [datumType, setDatumType] = useState<string>();
    const [datumObject, setDatumObject] = useState<any>(undefined);
    //--------------------------------------
    const [isOpen, setIsOpen] = useState(false);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    //--------------------------------------
    useEffect(() => {
        const fetchData = async () => {
            if (uTxO.datum !== undefined && uTxO.datum !== null) {
                let datum = undefined;
                const addressesToFollow = await AddressToFollowFrontEndApiCalls.getByAddressApi(uTxO.address);
                const possibleDatums: string[] = [];
                addressesToFollow.forEach((addressToFollow) => possibleDatums.push(addressToFollow.datumType));
                possibleDatums.forEach((datumType) => {
                    if (uTxO.datum !== undefined && uTxO.datum !== null) {
                        if (datumType === DummyEntity.className()) {
                            try {
                                datum = DummyEntity.mkDatumFromDatumCborHex(uTxO.datum);
                                setDatumType(DummyEntity.className());
                            } catch (error) {}
                            return;
                        } else if (datumType === FreeEntity.className()) {
                            try {
                                datum = FreeEntity.mkDatumFromDatumCborHex(uTxO.datum);
                                setDatumType(FreeEntity.className());
                            } catch (error) {}
                        } 
                    }
                });
                if (datum !== undefined) {
                    setDatumObject(datum);
                }
            }
        };
        fetchData();
    }, []);
    //--------------------------------------
    return {
        appStore,
        isRefreshing,
        datumType,
        datumObject,
        isOpen,
        handleOpen,
        handleClose,
    };
    //--------------------------------------
};
