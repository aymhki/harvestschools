import './styles/App.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import NavigationBar from "./modules/NavigationBar.jsx";
import Footer from "./modules/Footer.jsx";
import ErrorBoundary from "./modules/ErrorBoundary.jsx";

// Top Level components
import Home from './pages/Home';
import Faqs from './pages/FAQs/FAQs.jsx';
import MinimumStageAge from './pages/FAQs/MinimumStageAge.jsx';
import Vacancies from './pages/Vacancies';
import MoreInfo from "./pages/FAQs/MoreInfo.jsx";

// Admin pages
import AdminLogin from "./pages/Admin/AdminLogin.jsx";
import Dashboard from "./pages/Admin/./AdminDashboard";
import JobApplications from "./pages/Admin/JobApplications.jsx";
import BookingManagement from "./pages/Admin/BookingManagement.jsx";
import FileViewer from './pages/Admin/FileViewer.jsx';

// Admission pages
import Admission from "./pages/Admission/Admission.jsx";
import AdmissionProcess from './pages/Admission/AdmissionProcess';
import AdmissionRequirements from './pages/Admission/AdmissionRequirements';
import InsideEgyptRequirements from './pages/Admission/InsideEgyptRequirements';
import OutsideEgyptRequirements from './pages/Admission/OutsideEgyptRequirements';
import OutsideEgyptRequirementsForeigners from './pages/Admission/OutsideEgyptRequirementsForeigners';
import AdmissionFees from "./pages/Admission/AdmissionFees.jsx";

// Academic pages
import Academics from './pages/Academics/Academics.jsx';
import British from "./pages/Academics/British.jsx";
import NationalAcademics from './pages/Academics/National';
import AmericanAcademics from './pages/Academics/American';
import PartnersAcademics from './pages/Academics/Partners';
import Facilities from "./pages/Academics/Facilities.jsx";
import StaffAcademics from './pages/Academics/Staff';
import NationalStaff from './pages/Academics/Staff/NationalStaff';
import BritishStaff from './pages/Academics/Staff/BritishStaff';
import AmericanStaff from './pages/Academics/Staff/AmericanStaff';
import KindergartenStaff from './pages/Academics/Staff/KindergartenStaff';

// Student life pages
import StudentLife from "./pages/StudentsLife/StudentsLife.jsx";
import StudentsUnion from './pages/StudentsLife/StudentsUnion';
import Activities from './pages/StudentsLife/Activities';
import Library from './pages/StudentsLife/Library/Library.jsx';
import EnglishFairyTales from './pages/StudentsLife/Library/EnglishFairyTales';
import EnglishDrama from './pages/StudentsLife/Library/EnglishDrama';
import EnglishLevels from './pages/StudentsLife/Library/EnglishLevels';
import EnglishGeneral from './pages/StudentsLife/Library/EnglishGeneral';
import ArabicInformation from './pages/StudentsLife/Library/ArabicInformation';
import ArabicGeneral from './pages/StudentsLife/Library/ArabicGeneral';
import ArabicReligion from './pages/StudentsLife/Library/ArabicReligion';
import ArabicStories from './pages/StudentsLife/Library/ArabicStories';

// Events pages
import Events from "./pages/Events/Events.jsx";
import NationalCalendar from "./pages/Events/NationalCalendar.jsx";
import BritishCalendar from './pages/Events/BritishCalendar';
import AmericanCalendar from './pages/Events/AmericanCalendar';
import KgCalendarEvents from './pages/Events/KgCalendar';
import BookingLogin from "./pages/Events/Booking/BookingLogin.jsx";
import BookingDashboard from './pages/Events/Booking/BookingDashboard.jsx';
import BookingMedia from "./pages/Events/Booking/BookingMedia.jsx";
import BookingExtras from "./pages/Events/Booking/BookingExtras.jsx";
import BookingStatusInfo from "./pages/Events/Booking/BookingStatusInfo.jsx";
import BookingConfirmation from './pages/Events/Booking/BookingConfirmation.jsx';

// Gallery pages
import Gallery from "./pages/Gallery/Gallery.jsx";
import PhotosGallery from './pages/Gallery/Photos';
import VideosGallery from './pages/Gallery/Videos';
import Tour360Gallery from './pages/Gallery/360Tour';

// Covid pages
import Covid19 from './pages/FAQs/Covid19.jsx';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// Error page
import NotFound from './pages/NotFound';

function App() {
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
        // else
        // {
        //     if (i18n.language !== 'en')
        //     {
        //         i18n.changeLanguage('en');
        //     }
        // }

        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [location.search, i18n]);


    const excludePaths = [
        '/academics/staff',
        '/admin/view-file'
    ];

    const shouldExclude = excludePaths.includes(location.pathname);

    return (
        <div className="App">
            {!shouldExclude && <NavigationBar />}
            <div className="content">
                <ErrorBoundary>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/home" element={<Home />} />

                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin/dashboard" element={<Dashboard />} />
                        <Route path="/admin/job-applications" element={<JobApplications />} />
                        <Route path="/admin/view-file" element={<FileViewer />} />
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
                </ErrorBoundary>
            </div>
            {!shouldExclude && <Footer />}
        </div>
    );
}

export default App;
