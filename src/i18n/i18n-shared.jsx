

export const i18nConfig = {
    fallbackLng: 'en',
    defaultNS: 'common',
    detection: {
        order: ['customUrlDetector', 'localStorage', 'navigator'],
        caches: ['localStorage']
    },
    interpolation: { escapeValue: false },
};