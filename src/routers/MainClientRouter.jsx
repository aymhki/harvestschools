import '../styles/App.css';
import { Suspense } from 'react';
import { useLocation } from 'react-router';

import NavigationBar from '../modules/NavigationBar.jsx';
import Footer from '../modules/Footer.jsx';
import ErrorBoundary from '../modules/ErrorBoundary.jsx';
import { mainRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { ROUTER_IDS } from '../routes/redirects.js';
import { makeLazyPages, useLangSync, findRoute } from '../routes/shared.js';
import { GlobalLoadingFallback, GlobalSpinner } from '../services/General/GlobalLoadingService.jsx';
import { AppAssetsLoadingGate } from '../services/General/AppAssetsLoadingService.jsx';
import { useScrollToTopOnNavigation } from '../services/General/ScrollToTopService.jsx';

const pages = makeLazyPages(
    import.meta.glob([
        '../pages/**/*.jsx',
        '!../pages/Admin/**',
        '!../pages/CorporateHome.jsx',
        '!../pages/SchoolEverywhere.jsx',
    ])
);

function MainClientRouter() {
    useScrollToTopOnNavigation();
    const location = useLocation();
    useLangSync();

    const shouldExclude = findRoute(mainRoutes, location.pathname)?.chromeExcluded === true;

    return (
        <div className="App">
            {!shouldExclude && <NavigationBar compactOrAdmin={false} isMobileApp={false}/>}
            <div className="content">
                <ErrorBoundary ignoreLngUpdate={false}>
                    <GlobalSpinner />
                    <AppAssetsLoadingGate />

                    <Suspense fallback={<div style={{minHeight: '100vh'}}><GlobalLoadingFallback /></div>}>
                        <AppRoutes routes={mainRoutes} pages={pages} ctx={{ isMobileApp: false }} router={ROUTER_IDS.main} />
                    </Suspense>
                </ErrorBoundary>
            </div>
            {!shouldExclude && <Footer />}
        </div>
    );
}

export default MainClientRouter;