'use client';

import { useState } from 'react';
import { toJson } from '../Commons/utils.js';

//Para guardar datos de forma persistente en el navegador

// Hook
export function useLocalStorage(key: string, initialValue: any) {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);
            // Parse stored json or if none return initialValue
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // If error also return initialValue
            console.log(`useLocalStorage - Error: ${error}`);
            return initialValue;
        }
    });
    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value: (arg0: any) => any) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, toJson(valueToStore));
            }
        } catch (error) {
            // A more advanced implementation would handle the error case
            console.log(`useLocalStorage - setValue - Error: ${error}`);
        }
    };
    return [storedValue, setValue];
}
