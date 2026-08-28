import { Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import AdminSidebar from '../modules/AdminSidebar.jsx';
import AdminFooter from '../modules/AdminFooter.jsx';
import NavigationBar from '../modules/NavigationBar.jsx';
import '../styles/App.css';
import { headToAdminLoginOnInvalidSessionFromAdminDashboard } from '../services/Admin/Session/AdminNavigationServices.jsx';
import { serveAlumniFile } from '../services/Admin/AlumniStudents/AdminAlumniStudentsManagementServices.jsx';
import { serveJobApplicationFile } from '../services/Admin/JobApplications/AdminJobApplicationsManagementServices.jsx';
import { serveGalleryFile } from '../services/Admin/Gallery/AdminGalleryServices.jsx';
import { adminRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { ROUTER_IDS } from '../routes/redirects.js';
import { makeLazyPages, findRoute } from '../routes/shared.js';
import { useLoading, GlobalLoadingFallback, GlobalSpinner } from '../services/General/GlobalLoadingService.jsx';
import { AppAssetsLoadingGate } from '../services/General/AppAssetsLoadingService.jsx';
import { useScrollToTopOnNavigation } from '../services/General/ScrollToTopService.jsx';

const pages = makeLazyPages(
    import.meta.glob(['../pages/Admin/**/*.jsx', '../pages/NotFound.jsx'])
);

const services = { serveAlumniFile, serveJobApplicationFile, serveGalleryFile };

function AdminRouter() {
    useScrollToTopOnNavigation();
    const location = useLocation();
    const navigate = useNavigate();
    const [adminLinks, setAdminLinks] = useState([]);
    const [loggedInName, setLoggedInName] = useState('Admin');
    const [loggedInUsername, setLoggedInUsername] = useState('admin');
    const [loggedInUserId, setLoggedInUserId] = useState(-1);
    const [isAuthLoading, setIsAuthLoading] = useLoading(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
        const savedPreference = localStorage.getItem('isSidebarPinned');
        return (savedPreference !== undefined && savedPreference !== null) ? savedPreference === 'true' : false;
    });
    const [adminPermissions, setAdminPermissions] = useState([]);
    const [refreshCurrentUserData, setRefreshCurrentUserData] = useState(false);
    const [userDataWereNeverFetched, setUserDataWereNeverFetched] = useState(true);

    const shouldExclude = findRoute(adminRoutes, location.pathname)?.adminEntry === true;

    const handleTogglePin = () => {
        setIsSidebarPinned(prev => !prev);
    };

    useEffect(() => {
        localStorage.setItem('isSidebarPinned', isSidebarPinned);
    }, [isSidebarPinned]);

    useEffect(() => {
        if (shouldExclude) {
            setAdminLinks([]);
            setUserDataWereNeverFetched(true);
        } else if ((adminLinks.length === 0 && userDataWereNeverFetched) || refreshCurrentUserData) {
            headToAdminLoginOnInvalidSessionFromAdminDashboard(navigate, setAdminLinks, setIsAuthLoading, setLoggedInName, setLoggedInUsername, setAdminPermissions, setLoggedInUserId);
            setUserDataWereNeverFetched(false);
            setRefreshCurrentUserData(false);
        }
    }, [shouldExclude, navigate, adminLinks.length, refreshCurrentUserData, userDataWereNeverFetched]);

    const ctx = {
        isMobileApp: false,
        services,
        adminLinks,
        adminPermissions,
        isAuthLoading,
        loggedInName,
        loggedInUsername,
        loggedInUserId,
        setRefreshCurrentUserData,
    };

    return (
        <div className="App admin-app">
            {shouldExclude && <NavigationBar compactOrAdmin={true} isMobileApp={false} />}
            <div className={`content ${!shouldExclude ? 'admin-content' : ''} ${isSidebarPinned ? 'pinned' : ''}`}>
                {!shouldExclude && (
                    <AdminSidebar
                        adminLinks={adminLinks}
                        loggedInUsername={loggedInName}
                        isPinned={isSidebarPinned}
                        onTogglePin={handleTogglePin}
                        adminPermissions={adminPermissions}
                        setRefreshCurrentUserData={setRefreshCurrentUserData}
                    />
                )}

                <GlobalSpinner />
                <AppAssetsLoadingGate />

                <Suspense fallback={<div style={{ minHeight: '100vh' }}><GlobalLoadingFallback /></div>}>
                    <AppRoutes routes={adminRoutes} pages={pages} ctx={ctx} router={ROUTER_IDS.admin} />
                </Suspense>

                <AdminFooter />
            </div>

        </div>
    );
}

export default AdminRouter;
