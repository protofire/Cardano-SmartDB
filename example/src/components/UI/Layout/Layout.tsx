import { useEffect, useState } from 'react';
import { useAppStore } from 'smart-db';

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
