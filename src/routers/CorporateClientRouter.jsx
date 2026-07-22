import '../styles/CorporateApp.css';
import { Suspense } from 'react';

import NavigationBar from '../modules/CorporateNavigationBar.jsx';
import Footer from '../modules/CorporateFooter.jsx';
import ErrorBoundary from '../modules/ErrorBoundary.jsx';
import { corporateRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { makeLazyPages, useLangSync } from '../routes/shared.js';

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
                    <Suspense fallback={<div style={{minHeight: '100vh'}}></div>}>
                        <AppRoutes routes={corporateRoutes} pages={pages} />
                    </Suspense>
                </ErrorBoundary>
            </div>
            <Footer />
        </div>
    );
}

export default CorporateClientRouter;