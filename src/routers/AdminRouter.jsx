import {Suspense, lazy, useEffect, useState} from 'react'
import {Routes, Route, Navigate, useLocation, useNavigate} from 'react-router-dom'
import Spinner from '../modules/Spinner.jsx'
import ErrorBoundary from "../modules/ErrorBoundary.jsx";
import AdminSidebar from "../modules/AdminSidebar.jsx";
import AdminFooter from "../modules/AdminFooter.jsx";
import NavigationBar from "../modules/NavigationBar.jsx";
import '../styles/App.css';
import { headToAdminLoginOnInvalidSessionFromAdminDashboard } from "../services/Admin/Session/AdminNavigationServices.jsx";

const NotFound = lazy(() => import('../pages/NotFound.jsx'))
const AdminLogin = lazy(() => import('../pages/Admin/AdminLogin.jsx'))
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard.jsx'))
const BorrowingSystemManagement = lazy(() => import('../pages/Admin/BorrowingSystemManagement.jsx'))
const GraduationBookingManagement = lazy(() => import('../pages/Admin/GraduationBookingManagement.jsx'))
const InfoSystemManagement = lazy(() => import('../pages/Admin/InfoSystemManagement.jsx'))
const JobApplications = lazy(() => import('../pages/Admin/JobApplications.jsx'))
const OpenDaySignupsManagement = lazy(() => import('../pages/Admin/OpenDaySignupsManagement.jsx'))
const FileViewer = lazy(() => import('../pages/Admin/FileViewer.jsx'))
const AdminUsersManagement = lazy(() => import('../pages/Admin/AdminUsersManagement.jsx'))
const AlumniStudentsManagement = lazy(() => import('../pages/Admin/AlumniStudentsManagement.jsx'))

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
    const [refreshCurrentUserData, setRefreshCurrentUserData] = useState(false);
    const [userDataWereNeverFetched, setUserDataWereNeverFetched] = useState(true);
    const excludePaths = ['/admin-login'];
    const shouldExclude = excludePaths.includes(location.pathname);

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
            headToAdminLoginOnInvalidSessionFromAdminDashboard(navigate, setAdminLinks, setIsAuthLoading, setLoggedInName, setLoggedInUsername, setLoggedInUserId);
            setUserDataWereNeverFetched(false);
            setRefreshCurrentUserData(false);
        }
    }, [shouldExclude, navigate, adminLinks.length, refreshCurrentUserData, userDataWereNeverFetched]);

    return (
        <div className="App admin-app">
            {shouldExclude && <NavigationBar compactOrAdmin={true} isMobileApp={false}/>}
            <div className={`content ${!shouldExclude ?  'admin-content' : '' } ${isSidebarPinned ? 'pinned' : ''}`}>
                {!shouldExclude && (
                    <AdminSidebar
                        adminLinks={adminLinks}
                        loggedInUsername={loggedInName}
                        isPinned={isSidebarPinned}
                        onTogglePin={handleTogglePin}
                    />
                )}
                <ErrorBoundary ignoreLngUpdate={true}>
                    <Suspense fallback={<div style={{minHeight: '100vh'}}><Spinner /></div>}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/admin-login" replace />} />
                            <Route path="/admin-login" element={<AdminLogin isMobileApp={false}/>} />
                            <Route path="/admin-dashboard" element={<AdminDashboard dashboardOptions={adminLinks} isLoading={isAuthLoading} loggedInName={loggedInName}/>} />
                            <Route path="/job-applications" element={<JobApplications />} />
                            <Route path="/graduation-booking-management" element={<GraduationBookingManagement />} />
                            <Route path="/open-day-signups-management" element={<OpenDaySignupsManagement />} />
                            <Route path="/borrowing-system-management" element={<BorrowingSystemManagement />} />
                            <Route path="/info-system-management" element={<InfoSystemManagement />} />
                            <Route path="/view-job-application-file" element={<FileViewer />} />
                            <Route path="/admin-users-management" element={<AdminUsersManagement loggedInUserId={loggedInUserId} setRefreshCurrentUserData={setRefreshCurrentUserData}/>} />
                            <Route path="/alumni-students-management" element={<AlumniStudentsManagement />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>
            <AdminFooter />
        </div>
    )
}

export default AdminRouter;