import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import navEN from './locales/en/nav.json';
import navAR from './locales/ar/nav.json';

import footerEN from './locales/en/footer.json'
import footerAR from './locales/ar/footer.json'

import homeEN from './locales/en/home.json'
import homeAR from './locales/ar/home.json'

import commonEN from './locales/en/common.json'
import commonAR from './locales/ar/common.json'

import allFormsEN from './locales/en/all-forms.json'
import allFormsAR from './locales/ar/all-forms.json'

import academicsEN from './locales/en/academics-pages.json'
import academicsAR from './locales/ar/academics-pages.json'

import adminEN from './locales/en/admin.json'
import adminAR from './locales/ar/admin.json'

import admissionEN from './locales/en/admission-pages.json'
import admissionAR from './locales/ar/admission-pages.json'

import errorBoundaryEN from './locales/en/error-boundary-page.json'
import errorBoundaryAR from './locales/ar/error-boundary-page.json'

import eventsEN from './locales/en/events-pages.json'
import eventsAR from './locales/ar/events-pages.json'

import faqsEN from './locales/en/faqs-pages.json'
import faqsAR from './locales/ar/faqs-pages.json'

import galleryEN from './locales/en/gallery-pages.json'
import galleryAR from './locales/ar/gallery-pages.json'

import studentsLifeEN from './locales/en/students-life-pages.json'
import studentsLifeAR from './locales/ar/students-life-pages.json'

import vacanciesEN from './locales/en/vacancies-page.json'
import vacanciesAR from './locales/ar/vacancies-page.json'


const resources = {
    en: {
        'nav': navEN,
        'footer': footerEN,
        'home': homeEN,
        'common': commonEN,
        'all-forms': allFormsEN,
        'academics-pages': academicsEN,
        'admin': adminEN,
        'admission-pages': admissionEN,
        'error-boundary-page': errorBoundaryEN,
        'events-pages': eventsEN,
        'faqs-pages': faqsEN,
        'gallery-pages': galleryEN,
        'students-life-pages': studentsLifeEN,
        'vacancies-page': vacanciesEN
    },
    ar: {
        'nav': navAR,
        'footer': footerAR,
        'home': homeAR,
        'common': commonAR,
        'all-forms': allFormsAR,
        'academics-pages': academicsAR,
        'admin': adminAR,
        'admission-pages': admissionAR,
        'error-boundary-page': errorBoundaryAR,
        'events-pages': eventsAR,
        'faqs-pages': faqsAR,
        'gallery-pages': galleryAR,
        'students-life-pages': studentsLifeAR,
        'vacancies-page': vacanciesAR
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
        defaultNS: 'common',
        detection: {
            order: ['customUrlDetector', 'localStorage', 'navigator'],
            caches: ['localStorage']
        },
        interpolation: {
            escapeValue: false
        }
    });


export default i18n;
