import '../styles/CorporateApp.css';
import { Suspense } from 'react';

import NavigationBar from '../modules/CorporateNavigationBar.jsx';
import Footer from '../modules/CorporateFooter.jsx';
import ErrorBoundary from '../modules/ErrorBoundary.jsx';
import { corporateRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { ROUTER_IDS } from '../routes/redirects.js';
import { makeLazyPages, useLangSync } from '../routes/shared.js';
import { GlobalLoadingFallback, GlobalSpinner } from '../services/General/GlobalLoadingService.jsx';
import { AppAssetsLoadingGate } from '../services/General/AppAssetsLoadingService.jsx';

const pages = makeLazyPages(
    import.meta.glob(['../pages/CorporateHome.jsx', '../pages/NotFound.jsx'])
);

function CorporateClientRouter() {
    useLangSync();

    return (
        <div className="App">
            <NavigationBar compactOrAdmin={false} isMobileApp={false}/>
            <div className="content">
                <ErrorBoundary ignoreLngUpdate={false}>
                    <GlobalSpinner />
                    <AppAssetsLoadingGate />

                    <Suspense fallback={<div style={{minHeight: '100vh'}}><GlobalLoadingFallback /></div>}>
                        <AppRoutes routes={corporateRoutes} pages={pages} router={ROUTER_IDS.corporate} />
                    </Suspense>
                </ErrorBoundary>
            </div>
            <Footer />
        </div>
    );
}

export default CorporateClientRouter;