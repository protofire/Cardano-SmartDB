'use client';

import { ReactNode } from 'react';

// import styles from './LoadingSpinner.module.scss';
// comment the import and set classname to 'loader' to avoid css module error

type ActionStatus = 'loading' | 'success' | 'error' | 'idle';

export function LoadingSpinner(
    { status, size, border, color, align }: { status?: ActionStatus; size?: number; border?: number; color?: string | undefined; align?: string | undefined } = {
        status: 'loading',
        size: 50,
        border: 10,
        color: undefined,
        align: undefined,
    }
) {
    return (
        <>
             <div className={`${align ? 'spinner' + align.charAt(0).toUpperCase() + align.slice(1) : ''} 'spinnerContainer'`}>
                <div className="loadingSpinner" style={{ width: size, height: size, borderWidth: border }}></div>
            </div>
        </>
    );
}
