import {useCallback} from "react";


const useFormCache = (formTitle, fields, t) => {
    const CACHE_DURATION_IN_HOURS = 4;
    const CACHE_DURATION = CACHE_DURATION_IN_HOURS * 60 * 60 * 1000;

    const getStorageKey = (formTitle, fieldId, fieldLabel) => {
        return `form_${formTitle}_${fieldLabel}_${fieldId}`;
    };

    const getTimestampKey = (formTitle) => {
        return `form_${formTitle}_timestamp`;
    };

    const loadCachedValues = useCallback(() => {
        const timestampKey = getTimestampKey(formTitle);
        const cachedTimestamp = localStorage.getItem(timestampKey);

        if (cachedTimestamp) {
            const cacheTime = parseInt(cachedTimestamp, 10);
            const currentTime = Date.now();
            const timeDifference = currentTime - cacheTime;

            if (timeDifference > CACHE_DURATION) {
                clearCache();
                return {};
            }
        } else {
            return {};
        }

        const cachedValues = {};
        fields.forEach(field => {
            const storageKey = getStorageKey(formTitle, field.id, field.label);
            const cachedValue = localStorage.getItem(storageKey);
            if (cachedValue !== null) {
                cachedValues[field.id] = cachedValue;
            }
        });
        return cachedValues;
    }, [formTitle, fields, CACHE_DURATION, t]);

    const saveToCache = useCallback((field, value) => {
        const storageKey = getStorageKey(formTitle, field.id, field.label);
        const timestampKey = getTimestampKey(formTitle);

        if (value) {
            localStorage.setItem(storageKey, value);
            localStorage.setItem(timestampKey, Date.now().toString());
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [formTitle]);

    const clearCache = useCallback(() => {
        const timestampKey = getTimestampKey(formTitle);

        fields.forEach(field => {
            const storageKey = getStorageKey(formTitle, field.id, field.label);
            localStorage.removeItem(storageKey);
        });

        localStorage.removeItem(timestampKey);
    }, [fields, formTitle]);

    return { loadCachedValues, saveToCache, clearCache };
};


export { useFormCache };