import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
    en: {
        translation: translationEN
    },
    ar: {
        translation: translationAR
    }
};

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

const isBrowser = typeof window !== 'undefined';

const i18nInstance = i18n.use(initReactI18next);

if (isBrowser) {
    i18nInstance.use(LanguageDetector);
}

i18nInstance.init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'translation',
        detection: {
            order: ['customUrlDetector', 'localStorage', 'navigator'],
            caches: ['localStorage']
        },
        interpolation: {
            escapeValue: false
        }
    });


export default i18n;
