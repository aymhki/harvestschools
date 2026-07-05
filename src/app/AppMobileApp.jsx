import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
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


const ADMIN_PATHS = [
    '/admin-login',
    '/admin-dashboard',
    '/job-applications',
    '/graduation-booking-management',
    '/open-day-signups-management',
    '/borrowing-system-management',
    '/info-system-management',
    '/view-job-application-file',
    '/admin-users-management',
    '/alumni-students-management',
]

const CLIENT_CHROME_EXCLUDED_PATHS = ['/academics/staff']

function AppMobileApp() {
    const location = useLocation()
    const navigate = useNavigate()
    const { i18n } = useTranslation()

    const isAdminSection = ADMIN_PATHS.includes(location.pathname)
    const isAdminLoginPath = location.pathname === '/admin-login'

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
        }
    }, [location.search, i18n]);

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


    const isClientChromeExcluded = CLIENT_CHROME_EXCLUDED_PATHS.includes(location.pathname)

    return (
        <>
            <div className={`App ${isAdminSection ? 'admin-app' : ''} mobile-app`}>
            {isAdminSection
                ? isAdminLoginPath && <NavigationBar compactOrAdmin={true} isMobileApp={true} addViewPortPaddingForMobileApp={true}/>
                : !isClientChromeExcluded && <NavigationBar compactOrAdmin={false} isMobileApp={true} addViewPortPaddingForMobileApp={true}/>}

            <div className={isAdminSection
                ? `content ${!isAdminLoginPath ? 'admin-content' : ''} ${isSidebarPinned ? 'pinned' : ''} mobile-app-top-padding-for-view-port` : 'content'}
            >
                {isAdminSection && !isAdminLoginPath && (
                    <AdminSidebar
                        adminLinks={adminLinks}
                        loggedInUsername={loggedInName}
                        isPinned={isSidebarPinned}
                        onTogglePin={handleTogglePin}
                        addViewPortPaddingForMobileApp={true}
                    />
                )}
                <ErrorBoundary ignoreLngUpdate={isAdminSection}>
                    <Suspense fallback={<div style={{ minHeight: '100vh' }}><Spinner /></div>}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/more-info" element={<MoreInfo />} />
                            <Route path="/faqs" element={<Faqs />} />
                            <Route path="/minimum-stage-age" element={<MinimumStageAge />} />
                            <Route path="/covid-19" element={<Covid19 />} />
                            <Route path="/vacancies" element={<Vacancies />} />
                            <Route path="/admission" element={<Admission />} />
                            <Route path="/admission/admission-process" element={<AdmissionProcess />} />
                            <Route path="/admission/admission-requirements" element={<AdmissionRequirements />} />
                            <Route path="/admission/inside-egypt-requirements" element={<InsideEgyptRequirements />} />
                            <Route path="/admission/outside-egypt-requirements" element={<OutsideEgyptRequirements />} />
                            <Route path="/admission/outside-egypt-requirements-foreigners" element={<OutsideEgyptRequirementsForeigners />} />
                            <Route path="/admission/admission-fees" element={<AdmissionFees />} />
                            <Route path="/academics" element={<Academics isMobileApp={true}/>} />
                            <Route path="/academics/kindergarten" element={<KindergartenAcademics />} />
                            <Route path="/academics/kindergarten-international" element={<KindergartenInternationalAcademics />} />
                            <Route path="/academics/kindergarten-national" element={<KindergartenNationalAcademics />} />
                            <Route path="/academics/pre-kindergarten" element={<PreKindergartenAcademics />} />
                            <Route path="/academics/british" element={<British />} />
                            <Route path="/academics/national" element={<NationalAcademics />} />
                            <Route path="/academics/american" element={<AmericanAcademics />} />
                            <Route path="/academics/partners" element={<PartnersAcademics />} />
                            <Route path="/academics/facilities" element={<Facilities />} />
                            <Route path="/academics/staff" element={<StaffAcademics />} />
                            <Route path="/academics/staff/national-staff" element={<NationalStaff />} />
                            <Route path="/academics/staff/british-staff" element={<BritishStaff />} />
                            <Route path="/academics/staff/american-staff" element={<AmericanStaff />} />
                            <Route path="/academics/staff/kindergarten-staff" element={<KindergartenStaff />} />
                            <Route path="/students-life" element={<StudentLife />} />
                            <Route path="/students-life/students-union" element={<StudentsUnion />} />
                            <Route path="/students-life/activities" element={<Activities />} />
                            <Route path="/students-life/library" element={<Library />} />
                            <Route path="/students-life/library/english-fairy-tales" element={<EnglishFairyTales />} />
                            <Route path="/students-life/library/english-drama" element={<EnglishDrama />} />
                            <Route path="/students-life/library/english-levels" element={<EnglishLevels />} />
                            <Route path="/students-life/library/english-general" element={<EnglishGeneral />} />
                            <Route path="/students-life/library/arabic-information" element={<ArabicInformation />} />
                            <Route path="/students-life/library/arabic-general" element={<ArabicGeneral />} />
                            <Route path="/students-life/library/arabic-religion" element={<ArabicReligion />} />
                            <Route path="/students-life/library/arabic-stories" element={<ArabicStories />} />
                            <Route path="/events" element={<Events />} />
                            <Route path="/events/national-calendar" element={<NationalCalendar />} />
                            <Route path="/events/british-calendar" element={<BritishCalendar />} />
                            <Route path="/events/american-calendar" element={<AmericanCalendar />} />
                            <Route path="/events/kg-calendars" element={<KgCalendarEvents />} />
                            <Route path="/events/american-kg-calendar" element={<AmericanKGCalendar />} />
                            <Route path="/events/british-kg-calendar" element={<BritishKGCalendar />} />
                            <Route path="/events/national-kg-calendar" element={<NationalKGCalendar />} />
                            <Route path="/events/graduation-booking" element={<GraduationBookingLogin />} />
                            <Route path="/events/graduation-booking/dashboard" element={<GraduationBookingDashboard />} />
                            <Route path="/events/graduation-booking/media" element={<GraduationBookingMedia />} />
                            <Route path="/events/graduation-booking/extras" element={<GraduationBookingExtras />} />
                            <Route path="/events/graduation-booking/info" element={<GraduationBookingStatusInfo />} />
                            <Route path="/events/graduation-booking-confirmation" element={<GraduationBookingConfirmation />} />
                            <Route path="/events/open-day-signup" element={<OpenDaySignup />} />
                            <Route path="/gallery" element={<Gallery />} />
                            <Route path="/gallery/photos" element={<PhotosGallery />} />
                            <Route path="/gallery/videos" element={<VideosGallery />} />
                            <Route path="/gallery/360-tour" element={<Tour360Gallery />} />

                            <Route path="/admin-login" element={<AdminLogin />} />
                            <Route path="/admin-dashboard" element={<AdminDashboard dashboardOptions={adminLinks} isLoading={isAuthLoading} loggedInName={loggedInName} />} />
                            <Route path="/job-applications" element={<JobApplications />} />
                            <Route path="/graduation-booking-management" element={<GraduationBookingManagement />} />
                            <Route path="/open-day-signups-management" element={<OpenDaySignupsManagement />} />
                            <Route path="/borrowing-system-management" element={<BorrowingSystemManagement />} />
                            <Route path="/info-system-management" element={<InfoSystemManagement />} />
                            <Route path="/view-job-application-file" element={<FileViewer />} />
                            <Route path="/admin-users-management" element={<AdminUsersManagement loggedInUserId={loggedInUserId} setRefreshCurrentUserData={setRefreshCurrentUserData} />} />
                            <Route path="/alumni-students-management" element={<AlumniStudentsManagement />} />

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>

            {isAdminSection ? <AdminFooter /> : !isClientChromeExcluded && <Footer />}
        </div>
        </>
    )
}

export default AppMobileApp
