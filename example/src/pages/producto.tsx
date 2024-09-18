import type { NextPage } from 'next';
import styles from './index.module.scss';
import Producto from '../components/public/Producto/Producto';

const ProductoPage: NextPage = () => {
    return (
        <>
            <main >
                <Producto />
            </main>
        </>
    );
};

export default ProductoPage;
