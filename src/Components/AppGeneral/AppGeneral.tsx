'use client';

import { ReactNode, useEffect } from 'react';
import { useAppGeneral } from '../../hooks/useAppGeneral.js';
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner.js';

interface AppGeneralProps {
    children: ReactNode;
    loader?: ReactNode;
    onLoadComplete?: () => void;
}

export function AppGeneral({
    children,
    loader = (
        <div>
            Loading application, please wait... <LoadingSpinner />
        </div>
    ),
    onLoadComplete,
}: AppGeneralProps) {
    //--------------------------------------
    const { appStore, tokensStore, setIsProcessingTask, isFaildedTask, setIsFaildedTask, isConfirmedTask, setIsConfirmedTask, processingTaskMessage, setProcessingTaskMessage } =
        useAppGeneral({ onLoadComplete });
    //--------------------------------------
    return <>{appStore.swInitApiCompleted === true ? children : loader}</>;
}
