'use client';

import { useAppGeneral } from '../../hooks/useAppGeneral.js';

export function AppGeneral() {
    useAppGeneral();
    return null; // or return <></>; if you want to return an empty fragment
}
