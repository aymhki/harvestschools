import '../styles/CorporateApp.css';

import NavigationBar from '../modules/CorporateNavigationBar.jsx';
import Footer from '../modules/CorporateFooter.jsx';
import ErrorBoundary from '../modules/ErrorBoundary.jsx';
import { corporateRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { makeEagerPages, useLangSync } from '../routes/shared.js';

const pages = makeEagerPages(
    import.meta.glob(['../pages/CorporateHome.jsx', '../pages/NotFound.jsx'], { eager: true })
);

function CorporateServerRouter() {
    useLangSync();

    return (
        <div className="App">
            <NavigationBar compactOrAdmin={false} isMobileApp={false}/>
            <div className="content">
                <ErrorBoundary ignoreLngUpdate={false}>
                    <AppRoutes routes={corporateRoutes} pages={pages} />
                </ErrorBoundary>
            </div>
            <Footer />
        </div>
    );
}

export default CorporateServerRouter;