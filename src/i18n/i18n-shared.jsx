

export const i18nConfig = {
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    defaultNS: 'common',
    load: 'languageOnly',
    ns: [
        'common',
        'academics-pages',
        'admin',
        'admission-pages',
        'all-forms',
        'error-boundary-page',
        'events-pages',
        'faqs-pages',
        'footer',
        'gallery-pages',
        'home',
        'nav',
        'students-life-pages',
        'vacancies-page',
        'corporate-home',
        'corporate-footer',
        'corporate-nav'
    ],
    detection: {
        order: ['customUrlDetector', 'localStorage', 'navigator'],
        caches: ['localStorage']
    },
    interpolation: { escapeValue: false },
};