import '../styles/App.css';
import { useLocation } from 'react-router-dom';

import NavigationBar from '../modules/NavigationBar.jsx';
import Footer from '../modules/Footer.jsx';
import ErrorBoundary from '../modules/ErrorBoundary.jsx';
import { mainRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { makeEagerPages, useLangSync, findRoute } from '../routes/shared.js';

const pages = makeEagerPages(
    import.meta.glob(
        [
            '../pages/**/*.jsx',
            '!../pages/Admin/**',
            '!../pages/CorporateHome.jsx',
        ],
        { eager: true }
    )
);

function MainServerRouter() {
    const location = useLocation();
    useLangSync();

    const shouldExclude = findRoute(mainRoutes, location.pathname)?.chromeExcluded === true;

    return (
        <div className="App">
            {!shouldExclude && <NavigationBar compactOrAdmin={false} isMobileApp={false}/>}
            <div className="content">
                <ErrorBoundary ignoreLngUpdate={false}>
                    <AppRoutes routes={mainRoutes} pages={pages} ctx={{ isMobileApp: false }} />
                </ErrorBoundary>
            </div>
            {!shouldExclude && <Footer />}
        </div>
    );
}

export default MainServerRouter;