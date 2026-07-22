import { lazy, useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const stripPrefix = (key) => key.replace(/^.*\/pages\//, '');

export function makeLazyPages(globMap) {
    const pages = {};
    for (const key in globMap) {
        pages[stripPrefix(key)] = lazy(globMap[key]);
    }
    return pages;
}

export function makeEagerPages(globMap) {
    const pages = {};
    for (const key in globMap) {
        pages[stripPrefix(key)] = globMap[key].default;
    }
    return pages;
}



export function useLangSync() {
    const location = useLocation();
    const { i18n } = useTranslation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const langParam = searchParams.get('lang');
        if (langParam && ['en', 'ar'].includes(langParam)) {
            if (i18n.language !== langParam) {
                i18n.changeLanguage(langParam);
            }
        }
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [location.search, i18n]);
}


export function findRoute(routes, pathname) {
    return routes.find((route) => matchPath({ path: route.path, end: true }, pathname));
}
