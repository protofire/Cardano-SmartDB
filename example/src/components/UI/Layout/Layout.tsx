import { useAppStore } from 'smart-db';
import styles from './Layout.module.scss';
import { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //-------------------------------------
    const appStore = useAppStore();
    //--------------------------------------
    return <div>{appStore.swInitApiCompleted && children}</div>;
}
