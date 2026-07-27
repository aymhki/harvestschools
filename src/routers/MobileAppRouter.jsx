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
import {
    attachCalendarNotificationHandlers,
    rescheduleAllSubscriptions,
} from '../services/General/CalendarSubscriptionService.jsx';
import { rememberRestorePath } from '../services/General/AppUpdaterService.jsx';
import { mobileRoutes } from '../routes/routes.js';
import AppRoutes from '../routes/AppRoutes.jsx';
import PageTransition from '../modules/PageTransition.jsx';
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

    /* Pages that keep their own direction still rely on the document language for
     * their typeface, so it follows every language change and not only the ones
     * that travel through the address bar. */
    useEffect(() => {
        const applyDocumentLanguage = () => {
            document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = i18n.language;
        };

        applyDocumentLanguage();

        i18n.on('languageChanged', applyDocumentLanguage);

        return () => i18n.off('languageChanged', applyDocumentLanguage);
    }, [i18n]);

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

    /* Opened links are handled once, by the gate, so a widget tap does not race
     * two navigations. */

    useEffect(() => {
        const detachNotificationHandlers = attachCalendarNotificationHandlers(navigate);

        const topUpScheduledReminders = () => {
            rescheduleAllSubscriptions({
                translate: i18n.getFixedT(i18n.language, 'events-pages'),
                language: i18n.language === 'ar' ? 'ar' : 'en',
            }).catch((rescheduleError) => {
                console.warn('Could not refresh the scheduled calendar reminders', rescheduleError);
            });
        };

        const resumeListener = CapacitorApp.addListener('resume', topUpScheduledReminders);

        i18n.on('languageChanged', topUpScheduledReminders);

        topUpScheduledReminders();

        return () => {
            detachNotificationHandlers();
            i18n.off('languageChanged', topUpScheduledReminders);
            resumeListener.then(handle => handle.remove());
        };
    }, [navigate, i18n]);

    useEffect(() => {
        rememberRestorePath(location.pathname + location.search + location.hash);
    }, [location]);

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
                        <PageTransition>
                            <AppRoutes routes={mobileRoutes} pages={pages} ctx={ctx} />
                        </PageTransition>
                    </Suspense>
                </div>
                {isAdminSection ? <AdminFooter /> : !isClientChromeExcluded && <Footer />}
            </div>
        </>
    );
}

export default MobileAppRouter;
