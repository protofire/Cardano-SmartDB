import type { NextPage } from 'next';
import styles from './index.module.scss';
import Products from '../components/public/Products/Products';

const ProductsPage: NextPage = () => {
    return (
        <>
            <main >
                <Products />
            </main>
        </>
    );
};

export default ProductsPage;
