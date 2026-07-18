import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { i18nConfig } from './i18n-shared';
import { Capacitor } from '@capacitor/core';


const i18nInstance = i18n.use(initReactI18next);


if (typeof window !== 'undefined') {
    const customDetector = {
        name: 'customUrlDetector',
        lookup() {
            const urlParams = new URLSearchParams(window.location.search);
            const langParam = urlParams.get('lang');

            if (langParam && ['en', 'ar'].includes(langParam)) {
                return langParam;
            }

            return localStorage.getItem('i18nextLng') || 'en';
        },
        cacheUserLanguage(lng) {
            localStorage.setItem('i18nextLng', lng);
        }
    };

    const languageDetector = new LanguageDetector();
    languageDetector.addDetector(customDetector);
    i18nInstance.use(languageDetector);
}

const LOCALES_VERSION = import.meta.env.VITE_LOCALES_VERSION || 'dev';

const getLocalesLoadPath = () => {
    const base = Capacitor.isNativePlatform()
        ? 'https://harvestschools.com/locales/{{lng}}/{{ns}}.json'
        : '/locales/{{lng}}/{{ns}}.json';
    return `${base}?v=${LOCALES_VERSION}`;
};

i18nInstance
    .use(Backend)
    .init({
        ...i18nConfig,
        backend: { loadPath: getLocalesLoadPath() },
        react: { useSuspense: false },
    });

export default i18n;