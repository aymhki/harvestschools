import '../styles/CorporateApp.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import {lazy, Suspense, useEffect} from 'react';
import NavigationBar from "../modules/CorporateNavigationBar.jsx";
import Footer from "../modules/CorporateFooter.jsx";
import ErrorBoundary from "../modules/ErrorBoundary.jsx";
import {useTranslation} from "react-i18next";

const Home = lazy(() => import('../pages/CorporateHome.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));

function CorporateClientRouter() {
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

    return (
        <div className="App">
             <NavigationBar compactOrAdmin={false} isMobileApp={false}/>
            <div className="content">
                <ErrorBoundary ignoreLngUpdate={false}>
                    <Suspense fallback={<div style={{minHeight: '100vh'}}></div>}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>
            <Footer />
        </div>
    );
}

export default CorporateClientRouter;