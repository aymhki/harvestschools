import {Suspense, lazy, useEffect, useState} from 'react'
import {Routes, Route, Navigate, useLocation, useNavigate} from 'react-router-dom'
import Spinner from './modules/Spinner'
import ErrorBoundary from "./modules/ErrorBoundary.jsx";
import AdminSidebar from "./modules/AdminSidebar.jsx";
import AdminFooter from "./modules/AdminFooter.jsx";
import NavigationBar from "./modules/NavigationBar.jsx";
import './styles/App.css';
import {useTranslation} from "react-i18next";
import { headToAdminLoginOnInvalidSessionFromAdminDashboard } from "./services/Admin/Session/AdminNavigationServices.jsx";

const NotFound = lazy(() => import('./pages/NotFound'))
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const BorrowingSystemManagement = lazy(() => import('./pages/Admin/BorrowingSystemManagement'))
const GraduationBookingManagement = lazy(() => import('./pages/Admin/GraduationBookingManagement'))
const InfoSystemManagement = lazy(() => import('./pages/Admin/InfoSystemManagement'))
const JobApplications = lazy(() => import('./pages/Admin/JobApplications'))
const OpenDaySignupsManagement = lazy(() => import('./pages/Admin/OpenDaySignupsManagement'))
const FileViewer = lazy(() => import('./pages/Admin/FileViewer'))

export default function AppAdmin() {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const [adminLinks, setAdminLinks] = useState([]);
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const langParam = searchParams.get('lang');
        if (langParam && ['en', 'ar'].includes(langParam)) {
            if (i18n.language !== langParam) {
                i18n.changeLanguage(langParam);
            }
        }
    }, [location.search, i18n]);

    const excludePaths = ['/login'];
    const shouldExclude = excludePaths.includes(location.pathname);

    useEffect(() => {
        if (shouldExclude) {
            setAdminLinks([]);
        } else if (adminLinks.length === 0) {
            headToAdminLoginOnInvalidSessionFromAdminDashboard(navigate, setAdminLinks, setIsAuthLoading);
        }
    }, [shouldExclude, navigate, adminLinks.length]);

    return (
        <div className="App admin-app">
            {shouldExclude && <NavigationBar compactOrAdmin={true}/>}
            <div className={`content ${!shouldExclude ?  'admin-content' : '' }`}>
                {!shouldExclude && <AdminSidebar adminLinks={adminLinks} />}
                <ErrorBoundary>
                    <Suspense fallback={<div style={{minHeight: '50vh'}}><Spinner /></div>}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="/login" element={<AdminLogin />} />
                            <Route path="/dashboard" element={<AdminDashboard dashboardOptions={adminLinks} isLoading={isAuthLoading}/>} />
                            <Route path="/job-applications" element={<JobApplications />} />
                            <Route path="/graduation-booking-management" element={<GraduationBookingManagement />} />
                            <Route path="/open-day-signups-management" element={<OpenDaySignupsManagement />} />
                            <Route path="/borrowing-system-management" element={<BorrowingSystemManagement />} />
                            <Route path="/info-system-management" element={<InfoSystemManagement />} />
                            <Route path="/view-job-application-file" element={<FileViewer />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>
            <AdminFooter />
        </div>
    )
}