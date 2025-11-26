// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';
//
// import translationEN from './locales/en/translation.json';
// import translationAR from './locales/ar/translation.json';
//
// const resources = {
//     en: {
//         translation: translationEN
//     },
//     ar: {
//         translation: translationAR
//     }
// };
//
// const customDetector = {
//     name: 'customUrlDetector',
//     lookup() {
//         const urlParams = new URLSearchParams(window.location.search);
//         const langParam = urlParams.get('lang');
//
//         if (langParam && ['en', 'ar'].includes(langParam)) {
//             return langParam;
//         }
//
//         return localStorage.getItem('i18nextLng') || 'en';
//     },
//     cacheUserLanguage(lng) {
//         localStorage.setItem('i18nextLng', lng);
//     }
// };
//
// const languageDetector = new LanguageDetector();
// languageDetector.addDetector(customDetector);
//
// const isBrowser = typeof window !== 'undefined';
//
// const i18nInstance = i18n.use(initReactI18next);
//
// if (isBrowser) {
//     i18nInstance.use(LanguageDetector);
// }
//
// i18nInstance.init({
//         resources,
//         fallbackLng: 'en',
//         defaultNS: 'translation',
//         detection: {
//             order: ['customUrlDetector', 'localStorage', 'navigator'],
//             caches: ['localStorage']
//         },
//         interpolation: {
//             escapeValue: false
//         }
//     });
//
//
// export default i18n;


import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

import translationEN from './locales/en/translation.json';

// 1. Use Vite's import.meta.glob to find all translation files.
// This guarantees that Vite knows about these files and bundles them as separate chunks.
const translationFiles = import.meta.glob('./locales/*/*.json');

const resources = {
    en: {
        translation: translationEN
    }
};

const customDetector = {
    name: 'customUrlDetector',
    lookup() {
        if (typeof window === 'undefined') return 'en';

        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');

        if (langParam && ['en', 'ar'].includes(langParam)) {
            return langParam;
        }

        return localStorage.getItem('i18nextLng') || 'en';
    },
    cacheUserLanguage(lng) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('i18nextLng', lng);
        }
    }
};

const languageDetector = new LanguageDetector();
languageDetector.addDetector(customDetector);

const isBrowser = typeof window !== 'undefined';

const i18nInstance = i18n
    .use(resourcesToBackend((language, namespace, callback) => {
        // 2. Look up the specific file in the glob result
        const path = `./locales/${language}/${namespace}.json`;
        const loader = translationFiles[path];

        if (!loader) {
            console.error(`Translation file not found for ${language}: ${path}`);
            callback(new Error(`Translation file not found: ${path}`), null);
            return;
        }

        // 3. Load the file dynamically
        loader()
            .then((module) => {
                callback(null, module.default || module);
            })
            .catch((error) => {
                console.error(`Error loading translation for ${language}:`, error);
                callback(error, null);
            });
    }))
    .use(initReactI18next);

if (isBrowser) {
    i18nInstance.use(LanguageDetector);
}

i18nInstance.init({
    resources, // English is pre-loaded

    // 4. Important: tells i18next that 'resources' is incomplete and it should
    // use the backend to fetch other languages (like 'ar').
    partialBundledLanguages: true,

    fallbackLng: 'en',
    defaultNS: 'translation',

    // 5. Important: 'languageOnly' ensures that if the browser detects 'ar-EG',
    // it converts it to 'ar' before trying to load the file.
    load: 'languageOnly',

    detection: {
        order: ['customUrlDetector', 'localStorage', 'navigator'],
        caches: ['localStorage']
    },
    interpolation: {
        escapeValue: false
    }
});

export default i18n;