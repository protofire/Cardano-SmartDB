import styles from './Home.module.scss';
import { useState, useEffect } from 'react';

export default function Home() {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //-------------------------------------
    return <div>Home</div>;
}
