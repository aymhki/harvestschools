import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate, matchPath } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Spinner from '../modules/Spinner.jsx'
import ErrorBoundary from '../modules/ErrorBoundary.jsx'
import AdminSidebar from '../modules/AdminSidebar.jsx'
import AdminFooter from '../modules/AdminFooter.jsx'
import NavigationBar from '../modules/NavigationBar.jsx'
import Footer from '../modules/Footer.jsx'
import '../styles/App.css'
import { headToAdminLoginOnInvalidSessionFromAdminDashboard } from '../services/Admin/Session/AdminNavigationServices.jsx'
import { App as CapacitorApp } from '@capacitor/app';
import {useToggleLanguage} from "../services/General/GeneralUtils.jsx";

const Home = lazy(() => import('../pages/Home.jsx'))
const Faqs = lazy(() => import('../pages/FAQs/FAQs.jsx'))
const MinimumStageAge = lazy(() => import('../pages/FAQs/MinimumStageAge.jsx'))
const Vacancies = lazy(() => import('../pages/Vacancies.jsx'))
const MoreInfo = lazy(() => import('../pages/FAQs/MoreInfo.jsx'))
const Admission = lazy(() => import('../pages/Admission/Admission.jsx'))
const AdmissionProcess = lazy(() => import('../pages/Admission/AdmissionProcess.jsx'))
const AdmissionRequirements = lazy(() => import('../pages/Admission/AdmissionRequirements.jsx'))
const InsideEgyptRequirements = lazy(() => import('../pages/Admission/InsideEgyptRequirements.jsx'))
const OutsideEgyptRequirements = lazy(() => import('../pages/Admission/OutsideEgyptRequirements.jsx'))
const OutsideEgyptRequirementsForeigners = lazy(() => import('../pages/Admission/OutsideEgyptRequirementsForeigners.jsx'))
const AdmissionFees = lazy(() => import('../pages/Admission/AdmissionFees.jsx'))
const Academics = lazy(() => import('../pages/Academics/Academics.jsx'))
const British = lazy(() => import('../pages/Academics/British.jsx'))
const NationalAcademics = lazy(() => import('../pages/Academics/National.jsx'))
const AmericanAcademics = lazy(() => import('../pages/Academics/American.jsx'))
const KindergartenAcademics = lazy(() => import('../pages/Academics/KindergartenAcademics.jsx'))
const KindergartenInternationalAcademics = lazy(() => import('../pages/Academics/KindergartenInternationalAcademics.jsx'))
const KindergartenNationalAcademics = lazy(() => import('../pages/Academics/KindergartenNationalAcademics.jsx'))
const PreKindergartenAcademics = lazy(() => import('../pages/Academics/PreKindergartenAcademics.jsx'))
const PartnersAcademics = lazy(() => import('../pages/Academics/Partners.jsx'))
const Facilities = lazy(() => import('../pages/Academics/Facilities.jsx'))
const StaffAcademics = lazy(() => import('../pages/Academics/Staff.jsx'))
const NationalStaff = lazy(() => import('../pages/Academics/Staff/NationalStaff.jsx'))
const BritishStaff = lazy(() => import('../pages/Academics/Staff/BritishStaff.jsx'))
const AmericanStaff = lazy(() => import('../pages/Academics/Staff/AmericanStaff.jsx'))
const KindergartenStaff = lazy(() => import('../pages/Academics/Staff/KindergartenStaff.jsx'))
const StudentLife = lazy(() => import('../pages/StudentsLife/StudentsLife.jsx'))
const StudentsUnion = lazy(() => import('../pages/StudentsLife/StudentsUnion.jsx'))
const Activities = lazy(() => import('../pages/StudentsLife/Activities.jsx'))
const Library = lazy(() => import('../pages/StudentsLife/Library/Library.jsx'))
const EnglishFairyTales = lazy(() => import('../pages/StudentsLife/Library/EnglishFairyTales.jsx'))
const EnglishDrama = lazy(() => import('../pages/StudentsLife/Library/EnglishDrama.jsx'))
const EnglishLevels = lazy(() => import('../pages/StudentsLife/Library/EnglishLevels.jsx'))
const EnglishGeneral = lazy(() => import('../pages/StudentsLife/Library/EnglishGeneral.jsx'))
const ArabicInformation = lazy(() => import('../pages/StudentsLife/Library/ArabicInformation.jsx'))
const ArabicGeneral = lazy(() => import('../pages/StudentsLife/Library/ArabicGeneral.jsx'))
const ArabicReligion = lazy(() => import('../pages/StudentsLife/Library/ArabicReligion.jsx'))
const ArabicStories = lazy(() => import('../pages/StudentsLife/Library/ArabicStories.jsx'))
const Events = lazy(() => import('../pages/Events/Events.jsx'))
const NationalCalendar = lazy(() => import('../pages/Events/NationalCalendar.jsx'))
const BritishCalendar = lazy(() => import('../pages/Events/BritishCalendar.jsx'))
const AmericanCalendar = lazy(() => import('../pages/Events/AmericanCalendar.jsx'))
const KgCalendarEvents = lazy(() => import('../pages/Events/KGCalendars.jsx'))
const AmericanKGCalendar = lazy(() => import('../pages/Events/AmericanKGCalendar.jsx'))
const BritishKGCalendar = lazy(() => import('../pages/Events/BritishKGCalendar.jsx'))
const NationalKGCalendar = lazy(() => import('../pages/Events/NationalKGCalendar.jsx'))
const GraduationBookingLogin = lazy(() => import('../pages/Events/GraduationBooking/GraduationBookingLogin.jsx'))
const GraduationBookingDashboard = lazy(() => import('../pages/Events/GraduationBooking/GraduationBookingDashboard.jsx'))
const GraduationBookingMedia = lazy(() => import('../pages/Events/GraduationBooking/GraduationBookingMedia.jsx'))
const GraduationBookingExtras = lazy(() => import('../pages/Events/GraduationBooking/GraduationBookingExtras.jsx'))
const GraduationBookingStatusInfo = lazy(() => import('../pages/Events/GraduationBooking/GraduationBookingStatusInfo.jsx'))
const GraduationBookingConfirmation = lazy(() => import('../pages/Events/GraduationBooking/GraduationBookingConfirmation.jsx'))
const OpenDaySignup = lazy(() => import('../pages/Events/OpenDaySignup.jsx'))
const Gallery = lazy(() => import('../pages/Gallery/Gallery.jsx'))
const PhotosGallery = lazy(() => import('../pages/Gallery/Photos.jsx'))
const VideosGallery = lazy(() => import('../pages/Gallery/Videos.jsx'))
const Tour360Gallery = lazy(() => import('../pages/Gallery/360Tour.jsx'))
const Covid19 = lazy(() => import('../pages/FAQs/Covid19.jsx'))
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
const NotFound = lazy(() => import('../pages/NotFound.jsx'))


const routeConfig = [
    { path: '/', element: () => <Home /> },
    { path: '/home', element: () => <Home /> },
    { path: '/more-info', element: () => <MoreInfo /> },
    { path: '/faqs', element: () => <Faqs /> },
    { path: '/minimum-stage-age', element: () => <MinimumStageAge /> },
    { path: '/covid-19', element: () => <Covid19 /> },
    { path: '/vacancies', element: () => <Vacancies /> },
    { path: '/admission', element: () => <Admission /> },
    { path: '/admission/admission-process', element: () => <AdmissionProcess /> },
    { path: '/admission/admission-requirements', element: () => <AdmissionRequirements /> },
    { path: '/admission/inside-egypt-requirements', element: () => <InsideEgyptRequirements /> },
    { path: '/admission/outside-egypt-requirements', element: () => <OutsideEgyptRequirements /> },
    { path: '/admission/outside-egypt-requirements-foreigners', element: () => <OutsideEgyptRequirementsForeigners /> },
    { path: '/admission/admission-fees', element: () => <AdmissionFees /> },
    { path: '/academics', element: () => <Academics isMobileApp={true} /> },
    { path: '/academics/kindergarten', element: () => <KindergartenAcademics /> },
    { path: '/academics/kindergarten-international', element: () => <KindergartenInternationalAcademics /> },
    { path: '/academics/kindergarten-national', element: () => <KindergartenNationalAcademics /> },
    { path: '/academics/pre-kindergarten', element: () => <PreKindergartenAcademics /> },
    { path: '/academics/british', element: () => <British /> },
    { path: '/academics/national', element: () => <NationalAcademics /> },
    { path: '/academics/american', element: () => <AmericanAcademics /> },
    { path: '/academics/partners', element: () => <PartnersAcademics /> },
    { path: '/academics/facilities', element: () => <Facilities /> },
    { path: '/academics/staff', chromeExcluded: true, element: () => <StaffAcademics /> },
    { path: '/academics/staff/national-staff', element: () => <NationalStaff /> },
    { path: '/academics/staff/british-staff', element: () => <BritishStaff /> },
    { path: '/academics/staff/american-staff', element: () => <AmericanStaff /> },
    { path: '/academics/staff/kindergarten-staff', element: () => <KindergartenStaff /> },
    { path: '/students-life', element: () => <StudentLife /> },
    { path: '/students-life/students-union', element: () => <StudentsUnion /> },
    { path: '/students-life/activities', element: () => <Activities /> },
    { path: '/students-life/library', element: () => <Library /> },
    { path: '/students-life/library/english-fairy-tales', element: () => <EnglishFairyTales /> },
    { path: '/students-life/library/english-drama', element: () => <EnglishDrama /> },
    { path: '/students-life/library/english-levels', element: () => <EnglishLevels /> },
    { path: '/students-life/library/english-general', element: () => <EnglishGeneral /> },
    { path: '/students-life/library/arabic-information', element: () => <ArabicInformation /> },
    { path: '/students-life/library/arabic-general', element: () => <ArabicGeneral /> },
    { path: '/students-life/library/arabic-religion', element: () => <ArabicReligion /> },
    { path: '/students-life/library/arabic-stories', element: () => <ArabicStories /> },
    { path: '/events', element: () => <Events /> },
    { path: '/events/national-calendar', element: () => <NationalCalendar /> },
    { path: '/events/british-calendar', element: () => <BritishCalendar /> },
    { path: '/events/american-calendar', element: () => <AmericanCalendar /> },
    { path: '/events/kg-calendars', element: () => <KgCalendarEvents /> },
    { path: '/events/american-kg-calendar', element: () => <AmericanKGCalendar /> },
    { path: '/events/british-kg-calendar', element: () => <BritishKGCalendar /> },
    { path: '/events/national-kg-calendar', element: () => <NationalKGCalendar /> },
    { path: '/events/graduation-booking', element: () => <GraduationBookingLogin /> },
    { path: '/events/graduation-booking/dashboard', element: () => <GraduationBookingDashboard /> },
    { path: '/events/graduation-booking/media', element: () => <GraduationBookingMedia /> },
    { path: '/events/graduation-booking/extras', element: () => <GraduationBookingExtras /> },
    { path: '/events/graduation-booking/info', element: () => <GraduationBookingStatusInfo /> },
    { path: '/events/graduation-booking-confirmation', element: () => <GraduationBookingConfirmation /> },
    { path: '/events/open-day-signup', element: () => <OpenDaySignup /> },
    { path: '/gallery', element: () => <Gallery /> },
    { path: '/gallery/photos', element: () => <PhotosGallery /> },
    { path: '/gallery/videos', element: () => <VideosGallery /> },
    { path: '/gallery/360-tour', element: () => <Tour360Gallery /> },
    { path: '/admin-login', section: 'admin', isAdminEntry: true, element: () => <AdminLogin isMobileApp={true}/> },
    {
        path: '/admin-dashboard',
        section: 'admin',
        element: (ctx) => (
            <AdminDashboard dashboardOptions={ctx.adminLinks} isLoading={ctx.isAuthLoading} loggedInName={ctx.loggedInName} />
        ),
    },
    { path: '/job-applications', section: 'admin', element: () => <JobApplications /> },
    { path: '/graduation-booking-management', section: 'admin', element: () => <GraduationBookingManagement /> },
    { path: '/open-day-signups-management', section: 'admin', element: () => <OpenDaySignupsManagement /> },
    { path: '/borrowing-system-management', section: 'admin', element: () => <BorrowingSystemManagement /> },
    { path: '/info-system-management', section: 'admin', element: () => <InfoSystemManagement /> },
    { path: '/view-job-application-file', section: 'admin', element: () => <FileViewer /> },
    {
        path: '/admin-users-management',
        section: 'admin',
        element: (ctx) => (
            <AdminUsersManagement loggedInUserId={ctx.loggedInUserId} setRefreshCurrentUserData={ctx.setRefreshCurrentUserData} />
        ),
    },
    { path: '/alumni-students-management', section: 'admin', element: () => <AlumniStudentsManagement /> },
    { path: '*', element: () => <NotFound /> },
]

function findRouteConfig(pathname) {
    return routeConfig.find((route) => matchPath({ path: route.path, end: true }, pathname))
}

const SHARE_HOSTS = { admin: 'admin.harvestschools.com', client: 'harvestschools.com' }

function MobileAppRouter() {
    const location = useLocation()
    const navigate = useNavigate()
    const { i18n } = useTranslation()

    const activeRoute = findRouteConfig(location.pathname)
    const isAdminSection = activeRoute?.section === 'admin'
    const isAdminLoginPath = activeRoute?.isAdminEntry === true
    const isClientChromeExcluded = activeRoute?.chromeExcluded === true

    const [adminLinks, setAdminLinks] = useState([])
    const [loggedInName, setLoggedInName] = useState('Admin')
    const [loggedInUsername, setLoggedInUsername] = useState('admin')
    const [loggedInUserId, setLoggedInUserId] = useState(-1)
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
        const savedPreference = localStorage.getItem('isSidebarPinned')
        return savedPreference === 'true'
    })
    const [refreshCurrentUserData, setRefreshCurrentUserData] = useState(false)
    const [userDataWereNeverFetched, setUserDataWereNeverFetched] = useState(true)
    const toggleLanguage = useToggleLanguage({ignoreDocUpdate: true} );

    const handleTogglePin = () => {
        setIsSidebarPinned(prev => !prev)
    }

    useEffect(() => {
        localStorage.setItem('isSidebarPinned', isSidebarPinned)
    }, [isSidebarPinned])

    useEffect(() => {
        if (!isAdminSection) {
            const searchParams = new URLSearchParams(location.search)
            const langParam = searchParams.get('lang')
            if (langParam && ['en', 'ar'].includes(langParam)) {
                if (i18n.language !== langParam) {
                    i18n.changeLanguage(langParam)
                }
            }
            document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
            document.documentElement.lang = i18n.language
        } else {
            toggleLanguage({lng: 'en'})
        }
    }, [location.search, i18n, isAdminSection, toggleLanguage]);

    useEffect(() => {
        if (!isAdminSection) {
            return
        }

        if (isAdminLoginPath) {
            setAdminLinks([])
            setUserDataWereNeverFetched(true)
            return
        }

        if ((adminLinks.length === 0 && userDataWereNeverFetched) || refreshCurrentUserData) {
            headToAdminLoginOnInvalidSessionFromAdminDashboard(navigate, setAdminLinks, setIsAuthLoading, setLoggedInName, setLoggedInUsername, setLoggedInUserId)
            setUserDataWereNeverFetched(false)
            setRefreshCurrentUserData(false)
        }

    }, [isAdminSection, isAdminLoginPath, navigate, adminLinks.length, refreshCurrentUserData, userDataWereNeverFetched])

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
        const host = isAdminSection ? SHARE_HOSTS.admin : SHARE_HOSTS.client
        const shareUrl = `https://${host}${location.pathname}${location.search}${location.hash}`

        if (window.webkit?.messageHandlers?.nativeShareUrl) {

            window.webkit.messageHandlers.nativeShareUrl.postMessage(shareUrl)

        } else if (window.AndroidNativeBridge?.setShareUrl) {

            window.AndroidNativeBridge.setShareUrl(shareUrl)

        }

    }, [location, isAdminSection])

    const routeContext = useMemo(() => ({
        adminLinks,
        isAuthLoading,
        loggedInName,
        loggedInUserId,
        loggedInUsername,
        setRefreshCurrentUserData,
    }), [adminLinks, isAuthLoading, loggedInName, loggedInUserId, loggedInUsername])

    return (
        <>
            <div className={`App ${isAdminSection ? 'admin-app' : ''} mobile-app`}>
                {isAdminSection
                    ? isAdminLoginPath && <NavigationBar compactOrAdmin={true} isMobileApp={true}/>
                    : !isClientChromeExcluded && <NavigationBar compactOrAdmin={false} isMobileApp={true}/>}
                <div className={isAdminSection ? `content ${!isAdminLoginPath ? 'admin-content' : ''} ${isSidebarPinned ? 'pinned' : ''}` : 'content'}>
                    {isAdminSection && !isAdminLoginPath && (
                        <AdminSidebar
                            adminLinks={adminLinks}
                            loggedInUsername={loggedInName}
                            isPinned={isSidebarPinned}
                            onTogglePin={handleTogglePin}
                        />
                    )}
                    <ErrorBoundary ignoreLngUpdate={isAdminSection}>
                        <Suspense fallback={<div style={{ minHeight: '100vh' }}><Spinner /></div>}>
                            <Routes>
                                {routeConfig.map(({ path, element }) => (
                                    <Route key={path} path={path} element={element(routeContext)} />
                                ))}
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </div>
                {isAdminSection ? <AdminFooter /> : !isClientChromeExcluded && <Footer />}
            </div>
        </>
    )
}
export default MobileAppRouter