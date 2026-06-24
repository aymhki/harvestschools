import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';


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
    i18nInstance
        .use(Backend)
        .use(languageDetector);
}

i18nInstance.init({
        fallbackLng: 'en',
        defaultNS: 'common',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        detection: {
            order: ['customUrlDetector', 'localStorage', 'navigator'],
            caches: ['localStorage']
        },
        interpolation: {
            escapeValue: false
        }
});


export default i18n;
