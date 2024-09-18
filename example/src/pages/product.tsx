import type { NextPage } from 'next';
import styles from './index.module.scss';
import Product from '../components/public/Product/Product';

const ProductPage: NextPage = () => {
    return (
        <>
            <main >
                <Product />
            </main>
        </>
    );
};

export default ProductPage;
