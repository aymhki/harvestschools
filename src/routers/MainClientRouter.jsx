import '../styles/App.css';
import { Suspense } from 'react';
import { useLocation } from 'react-router-dom';

import NavigationBar from '../modules/NavigationBar.jsx';
import Footer from '../modules/Footer.jsx';
import ErrorBoundary from '../modules/ErrorBoundary.jsx';
import { mainRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { makeLazyPages, useLangSync, findRoute } from '../routes/shared.js';

const pages = makeLazyPages(
    import.meta.glob([
        '../pages/**/*.jsx',
        '!../pages/Admin/**',
        '!../pages/CorporateHome.jsx',
    ])
);

function MainClientRouter() {
    const location = useLocation();
    useLangSync();

    const shouldExclude = findRoute(mainRoutes, location.pathname)?.chromeExcluded === true;

    return (
        <div className="App">
            {!shouldExclude && <NavigationBar compactOrAdmin={false} isMobileApp={false}/>}
            <div className="content">
                <ErrorBoundary ignoreLngUpdate={false}>
                    <Suspense fallback={<div style={{minHeight: '100vh'}}></div>}>
                        <AppRoutes routes={mainRoutes} pages={pages} ctx={{ isMobileApp: false }} />
                    </Suspense>
                </ErrorBoundary>
            </div>
            {!shouldExclude && <Footer />}
        </div>
    );
}

export default MainClientRouter;