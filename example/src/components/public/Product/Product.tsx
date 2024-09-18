import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import styles from './Product.module.scss';
import { ProductEntity } from '../../../lib/SmartDB/Entities/Product.Entity';
import { ProductApi } from '../../../lib/SmartDB/FrontEnd/Product.FrontEnd.Api.Calls';

export default function Product() {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //----------------------------
    const [list, setList] = useState<ProductEntity[]>();
    //----------------------------
    useEffect(() => {
        const fetch = async () => {
            try {
                const list: ProductEntity[] = await ProductApi.getAllApi_();
                setList(list);
            } catch (e) {
                console.error(e);
            }
        };
        fetch();
    }, []);
    //----------------------------
    const handleBtnCreate = async () => {
        let product = new ProductEntity({ name: 'TEST', description: 'DESC', precio: 11 });
        await ProductApi.createApi(product);
    };
    //----------------------------
    return (
        <div className={styles.content}>
            Create Product
            <div>
                <div className={styles.subTitle}>CREATE</div>
                <button onClick={handleBtnCreate}>Create</button>
            </div>
            List of Product
            <div>
                <div className={styles.subTitle}>LIST</div>
                {list?.map((item, index) => (
                    <>
                        <div> {item.name} </div>
                        <div> {item.description} </div>
                        <div> {item.precio} </div>
                    </>
                ))}
            </div>
        </div>
    );
}

Modal.setAppElement('#__next');
