import { Address, Lucid, Script, SpendingValidator } from 'lucid-cardano';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import {
    ADA_UI,
    BaseSmartDBFrontEndApiCalls,
    BaseSmartDBFrontEndBtnHandlers,
    CS,
    LucidToolsFrontEnd,
    formatHash,
    formatTokenAmount,
    formatUTxO,
    pushSucessNotification,
    pushWarningNotification,
    useWalletStore,
} from 'smart-db';
import LoaderButton from '../../Commons/LoaderButton/LoaderButton';
import WalletConnector from '../../Commons/WalletConnector/WalletConnector';
import styles from './Producto.module.scss';
import { ClaimTxParams, CreateTxParams, UpdateTxParams } from '@example/src/lib/Commons/Constants/transactions';
import { ProductoEntity } from '@example/src/lib/SmartDB/Entities';
import { ProductoApi } from '@example/src/lib/SmartDB/FrontEnd/Producto.FrontEnd.Api.Calls';

export default function Producto() {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //----------------------------
    const [list, setList] = useState<ProductoEntity[]>();
    //----------------------------
    useEffect(() => {
        const fetch = async () => {
            try {
                const list: ProductoEntity[] = await ProductoApi.getAllApi_();
                setList(list);
            } catch (e) {
                console.error(e);
            }
        };
        fetch();
    }, []);
    //----------------------------
    const handleBtnCreate = async () => {
        let product = new ProductoEntity({ name: 'TEST', description: 'DESC', precio: 11 });
        await ProductoApi.createApi(product);
    };
    //----------------------------
    return (
        <div className={styles.content}>
            Create Producto
            <div>
                <div className={styles.subTitle}>CREATE</div>
                <button onClick={handleBtnCreate}>Create</button>
            </div>
            List of Producto
            <div>
                <div className={styles.subTitle}>LIST</div>
                {list?.map((item, index) => (
                    <>
                        <div> {item.name } </div>
                        <div> {item.description } </div>
                        <div> {item.precio } </div>
                    </>
                ))}
            </div>
        </div>
    );
}

Modal.setAppElement('#__next');
