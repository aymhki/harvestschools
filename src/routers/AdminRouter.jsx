import { Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Spinner from '../modules/Spinner.jsx';
import AdminSidebar from '../modules/AdminSidebar.jsx';
import AdminFooter from '../modules/AdminFooter.jsx';
import NavigationBar from '../modules/NavigationBar.jsx';
import '../styles/App.css';
import { headToAdminLoginOnInvalidSessionFromAdminDashboard } from '../services/Admin/Session/AdminNavigationServices.jsx';
import { serveAlumniFile } from '../services/Admin/AlumniStudents/AdminAlumniStudentsManagementServices.jsx';
import { serveJobApplicationFile } from '../services/Admin/JobApplications/AdminJobApplicationsManagementServices.jsx';
import { adminRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { makeLazyPages, findRoute } from '../routes/shared.js';

const pages = makeLazyPages(
    import.meta.glob(['../pages/Admin/**/*.jsx', '../pages/NotFound.jsx'])
);

const services = { serveAlumniFile, serveJobApplicationFile };

function AdminRouter() {
    const location = useLocation();
    const navigate = useNavigate();
    const [adminLinks, setAdminLinks] = useState([]);
    const [loggedInName, setLoggedInName] = useState('Admin');
    const [loggedInUsername, setLoggedInUsername] = useState('admin');
    const [loggedInUserId, setLoggedInUserId] = useState(-1);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
        const savedPreference = localStorage.getItem('isSidebarPinned');
        return savedPreference === 'true';
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

                <Suspense fallback={<div style={{ minHeight: '100vh' }}><Spinner /></div>}>
                    <AppRoutes routes={adminRoutes} pages={pages} ctx={ctx} />
                </Suspense>
            </div>
            <AdminFooter />
        </div>
    );
}

export default AdminRouter;
