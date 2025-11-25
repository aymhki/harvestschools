import './styles/App.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, lazy, Suspense } from 'react';

import NavigationBar from "./modules/NavigationBar.jsx";
import Footer from "./modules/Footer.jsx";
import ErrorBoundary from "./modules/ErrorBoundary.jsx";

const Home = lazy(() => import('./pages/Home'));
const Faqs = lazy(() => import('./pages/FAQs/FAQs.jsx'));
const MinimumStageAge = lazy(() => import('./pages/FAQs/MinimumStageAge.jsx'));
const Vacancies = lazy(() => import('./pages/Vacancies'));
const MoreInfo = lazy(() => import("./pages/FAQs/MoreInfo.jsx"));
const AdminLogin = lazy(() => import("./pages/Admin/AdminLogin.jsx"));
const Dashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const JobApplications = lazy(() => import("./pages/Admin/JobApplications.jsx"));
const BookingManagement = lazy(() => import("./pages/Admin/BookingManagement.jsx"));
const FileViewer = lazy(() => import('./pages/Admin/FileViewer.jsx'));
const Admission = lazy(() => import("./pages/Admission/Admission.jsx"));
const AdmissionProcess = lazy(() => import('./pages/Admission/AdmissionProcess'));
const AdmissionRequirements = lazy(() => import('./pages/Admission/AdmissionRequirements'));
const InsideEgyptRequirements = lazy(() => import('./pages/Admission/InsideEgyptRequirements'));
const OutsideEgyptRequirements = lazy(() => import('./pages/Admission/OutsideEgyptRequirements'));
const OutsideEgyptRequirementsForeigners = lazy(() => import('./pages/Admission/OutsideEgyptRequirementsForeigners'));
const AdmissionFees = lazy(() => import("./pages/Admission/AdmissionFees.jsx"));
const Academics = lazy(() => import('./pages/Academics/Academics.jsx'));
const British = lazy(() => import("./pages/Academics/British.jsx"));
const NationalAcademics = lazy(() => import('./pages/Academics/National'));
const AmericanAcademics = lazy(() => import('./pages/Academics/American'));
const PartnersAcademics = lazy(() => import('./pages/Academics/Partners'));
const Facilities = lazy(() => import("./pages/Academics/Facilities.jsx"));
const StaffAcademics = lazy(() => import('./pages/Academics/Staff'));
const NationalStaff = lazy(() => import('./pages/Academics/Staff/NationalStaff'));
const BritishStaff = lazy(() => import('./pages/Academics/Staff/BritishStaff'));
const AmericanStaff = lazy(() => import('./pages/Academics/Staff/AmericanStaff'));
const KindergartenStaff = lazy(() => import('./pages/Academics/Staff/KindergartenStaff'));
const StudentLife = lazy(() => import("./pages/StudentsLife/StudentsLife.jsx"));
const StudentsUnion = lazy(() => import('./pages/StudentsLife/StudentsUnion'));
const Activities = lazy(() => import('./pages/StudentsLife/Activities'));
const Library = lazy(() => import('./pages/StudentsLife/Library/Library.jsx'));
const EnglishFairyTales = lazy(() => import('./pages/StudentsLife/Library/EnglishFairyTales'));
const EnglishDrama = lazy(() => import('./pages/StudentsLife/Library/EnglishDrama'));
const EnglishLevels = lazy(() => import('./pages/StudentsLife/Library/EnglishLevels'));
const EnglishGeneral = lazy(() => import('./pages/StudentsLife/Library/EnglishGeneral'));
const ArabicInformation = lazy(() => import('./pages/StudentsLife/Library/ArabicInformation'));
const ArabicGeneral = lazy(() => import('./pages/StudentsLife/Library/ArabicGeneral'));
const ArabicReligion = lazy(() => import('./pages/StudentsLife/Library/ArabicReligion'));
const ArabicStories = lazy(() => import('./pages/StudentsLife/Library/ArabicStories'));
const Events = lazy(() => import("./pages/Events/Events.jsx"));
const NationalCalendar = lazy(() => import("./pages/Events/NationalCalendar.jsx"));
const BritishCalendar = lazy(() => import('./pages/Events/BritishCalendar'));
const AmericanCalendar = lazy(() => import('./pages/Events/AmericanCalendar'));
const KgCalendarEvents = lazy(() => import('./pages/Events/KgCalendar'));
const BookingLogin = lazy(() => import("./pages/Events/Booking/BookingLogin.jsx"));
const BookingDashboard = lazy(() => import('./pages/Events/Booking/BookingDashboard.jsx'));
const BookingMedia = lazy(() => import("./pages/Events/Booking/BookingMedia.jsx"));
const BookingExtras = lazy(() => import("./pages/Events/Booking/BookingExtras.jsx"));
const BookingStatusInfo = lazy(() => import("./pages/Events/Booking/BookingStatusInfo.jsx"));
const BookingConfirmation = lazy(() => import('./pages/Events/Booking/BookingConfirmation.jsx'));
const Gallery = lazy(() => import("./pages/Gallery/Gallery.jsx"));
const PhotosGallery = lazy(() => import('./pages/Gallery/Photos'));
const VideosGallery = lazy(() => import('./pages/Gallery/Videos'));
const Tour360Gallery = lazy(() => import('./pages/Gallery/360Tour'));
const Covid19 = lazy(() => import('./pages/FAQs/Covid19.jsx'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AppClient() {
    const location = useLocation();
    const { i18n } = useTranslation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const langParam = searchParams.get('lang');
        if (langParam && ['en', 'ar'].includes(langParam)) {
            if (i18n.language !== langParam) {
                i18n.changeLanguage(langParam);
            }
        }
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [location.search, i18n]);

    const excludePaths = ['/academics/staff', '/admin/view-job-application-file'];
    const shouldExclude = excludePaths.includes(location.pathname);

    return (
        <div className="App">
            {!shouldExclude && <NavigationBar />}
            <div className="content">
                <ErrorBoundary>
                    {/* Suspense is REQUIRED for React.lazy */}
                    <Suspense fallback={<div style={{minHeight: '50vh'}}></div>}>
                        <Routes>
                            {/* Same routes as AppServer, but using the lazy components */}
                            <Route path="/" element={<Home />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route path="/admin/dashboard" element={<Dashboard />} />
                            <Route path="/admin/job-applications" element={<JobApplications />} />
                            <Route path="/admin/view-job-application-file" element={<FileViewer />} />
                            <Route path="/admin/booking-management" element={<BookingManagement />} />
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
                            <Route path="/academics" element={<Academics />} />
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
                            <Route path="/events/kg-calendar" element={<KgCalendarEvents />} />
                            <Route path="/events/booking" element={<BookingLogin />} />
                            <Route path="/events/booking/dashboard" element={<BookingDashboard />} />
                            <Route path="/events/booking/media" element={<BookingMedia />} />
                            <Route path="/events/booking/extras" element={<BookingExtras />} />
                            <Route path="/events/booking/info" element={<BookingStatusInfo />} />
                            <Route path="/events/booking-confirmation" element={<BookingConfirmation />} />
                            <Route path="/gallery" element={<Gallery />} />
                            <Route path="/gallery/photos" element={<PhotosGallery />} />
                            <Route path="/gallery/videos" element={<VideosGallery />} />
                            <Route path="/gallery/360-tour" element={<Tour360Gallery />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>
            {!shouldExclude && <Footer />}
        </div>
    );
}

export default AppClient;