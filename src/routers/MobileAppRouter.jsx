import { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Spinner from '../modules/Spinner.jsx';
import AdminSidebar from '../modules/AdminSidebar.jsx';
import AdminFooter from '../modules/AdminFooter.jsx';
import NavigationBar from '../modules/NavigationBar.jsx';
import Footer from '../modules/Footer.jsx';
import '../styles/App.css';
import { headToAdminLoginOnInvalidSessionFromAdminDashboard } from '../services/Admin/Session/AdminNavigationServices.jsx';
import { App as CapacitorApp } from '@capacitor/app';
import { useToggleLanguage } from '../services/General/GeneralUtils.jsx';
import { serveAlumniFile } from '../services/Admin/AlumniStudents/AdminAlumniStudentsManagementServices.jsx';
import { serveJobApplicationFile } from '../services/Admin/JobApplications/AdminJobApplicationsManagementServices.jsx';
import '../styles/AppUpdateGate.css';
import { mobileRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import { makeLazyPages, findRoute } from '../routes/shared.js';

const pages = makeLazyPages(
    import.meta.glob(['../pages/**/*.jsx', '!../pages/CorporateHome.jsx'])
);

const services = { serveAlumniFile, serveJobApplicationFile };

const SHARE_HOSTS = { admin: 'admin.harvestschools.com', client: 'harvestschools.com' };

function MobileAppRouter() {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();

    const activeRoute = findRoute(mobileRoutes, location.pathname);
    const isAdminSection = activeRoute?.section === 'admin';
    const isAdminLoginPath = activeRoute?.adminEntry === true;
    const isClientChromeExcluded = activeRoute?.chromeExcluded === true;

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
    const toggleLanguage = useToggleLanguage({ ignoreDocUpdate: true });

    const handleTogglePin = () => {
        setIsSidebarPinned(prev => !prev);
    };

    useEffect(() => {
        localStorage.setItem('isSidebarPinned', isSidebarPinned);
    }, [isSidebarPinned]);

    useEffect(() => {
        if (!isAdminSection) {
            const searchParams = new URLSearchParams(location.search);
            const langParam = searchParams.get('lang');
            if (langParam && ['en', 'ar'].includes(langParam)) {
                if (i18n.language !== langParam) {
                    i18n.changeLanguage(langParam);
                }
            }
            document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = i18n.language;
        } else {
            toggleLanguage({ lng: 'en' });
        }
    }, [location.search, i18n, isAdminSection, toggleLanguage]);

    useEffect(() => {
        if (!isAdminSection) {
            return;
        }

        if (isAdminLoginPath) {
            setAdminLinks([]);
            setUserDataWereNeverFetched(true);
            return;
        }

        if ((adminLinks.length === 0 && userDataWereNeverFetched) || refreshCurrentUserData) {
            headToAdminLoginOnInvalidSessionFromAdminDashboard(navigate, setAdminLinks, setIsAuthLoading, setLoggedInName, setLoggedInUsername, setAdminPermissions, setLoggedInUserId);
            setUserDataWereNeverFetched(false);
            setRefreshCurrentUserData(false);
        }

    }, [isAdminSection, isAdminLoginPath, navigate, adminLinks.length, refreshCurrentUserData, userDataWereNeverFetched]);

    useEffect(() => {
        const handleInAppRouting = (url) => {
            if (!url) return;

            try {
                const urlObj = new URL(url);
                const slug = urlObj.pathname + urlObj.search + urlObj.hash;

                if (slug && slug !== '/') {
                    navigate(slug);
                }

            } catch (error) {
                console.error('Failed to parse incoming Universal Link:', error);
            }

        };

        const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
            handleInAppRouting(event.url);
        });

        return () => {
            listener.then(handle => handle.remove());
        };
    }, [navigate]);

    useEffect(() => {
        const host = isAdminSection ? SHARE_HOSTS.admin : SHARE_HOSTS.client;
        const shareUrl = `https://${host}${location.pathname}${location.search}${location.hash}`;

        if (window.webkit?.messageHandlers?.nativeShareUrl) {

            window.webkit.messageHandlers.nativeShareUrl.postMessage(shareUrl);

        } else if (window.AndroidNativeBridge?.setShareUrl) {

            window.AndroidNativeBridge.setShareUrl(shareUrl);

        }

    }, [location, isAdminSection]);

    const ctx = useMemo(() => ({
        isMobileApp: true,
        services,
        adminLinks,
        isAuthLoading,
        loggedInName,
        loggedInUserId,
        loggedInUsername,
        setRefreshCurrentUserData,
        adminPermissions,
    }), [adminLinks, isAuthLoading, loggedInName, loggedInUserId, loggedInUsername, adminPermissions]);

    return (
        <>
            <div className={`App ${isAdminSection ? 'admin-app' : ''} mobile-app`}>
                {isAdminSection
                    ? isAdminLoginPath && <NavigationBar compactOrAdmin={true} isMobileApp={true} />
                    : !isClientChromeExcluded && <NavigationBar compactOrAdmin={false} isMobileApp={true} />}
                <div className={isAdminSection ? `content ${!isAdminLoginPath ? 'admin-content' : ''} ${isSidebarPinned ? 'pinned' : ''}` : 'content'}>
                    {isAdminSection && !isAdminLoginPath && (
                        <AdminSidebar
                            adminLinks={adminLinks}
                            loggedInUsername={loggedInName}
                            isPinned={isSidebarPinned}
                            onTogglePin={handleTogglePin}
                            adminPermissions={adminPermissions}
                            setRefreshCurrentUserData={setRefreshCurrentUserData}
                        />
                    )}
                    <Suspense fallback={<div className="app-update-gate"><Spinner /></div>}>
                        <AppRoutes routes={mobileRoutes} pages={pages} ctx={ctx} />
                    </Suspense>
                </div>
                {isAdminSection ? <AdminFooter /> : !isClientChromeExcluded && <Footer />}
            </div>
        </>
    );
}

export default MobileAppRouter;
