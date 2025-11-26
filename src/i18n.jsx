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

// Define English synchronously so it's available immediately for SSR/Prerender
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

// Use resourcesToBackend to lazy load other languages (Arabic)
const i18nInstance = i18n
    .use(resourcesToBackend((language, namespace, callback) => {
        if (language === 'en') {
            callback(null, translationEN);
            return;
        }
        // Dynamically import the Arabic JSON. Vite will split this into a separate chunk.
        import(`./locales/${language}/${namespace}.json`)
            .then((resources) => {
                callback(null, resources.default || resources);
            })
            .catch((error) => {
                callback(error, null);
            });
    }))
    .use(initReactI18next);

if (isBrowser) {
    i18nInstance.use(LanguageDetector);
}

i18nInstance.init({
    // No 'resources' key here because we are using resourcesToBackend
    // However, we can pre-load English to prevent flicker if desired,
    // but the backend loader handles it.
    // For SSR safety, we can pass the initial store if needed,
    // but usually 'partialBundledLanguages' is used for this pattern.

    // Ideally, just letting the backend handle it is enough,
    // but since we imported EN statically, we can initialize the store:
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
