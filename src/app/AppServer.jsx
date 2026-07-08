import '../styles/App.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import NavigationBar from "../modules/NavigationBar.jsx";
import Footer from "../modules/Footer.jsx";
import ErrorBoundary from "../modules/ErrorBoundary.jsx";
import Home from '../pages/Home.jsx';
import Faqs from '../pages/FAQs/FAQs.jsx';
import MinimumStageAge from '../pages/FAQs/MinimumStageAge.jsx';
import Vacancies from '../pages/Vacancies.jsx';
import MoreInfo from "../pages/FAQs/MoreInfo.jsx";
import Admission from "../pages/Admission/Admission.jsx";
import AdmissionProcess from '../pages/Admission/AdmissionProcess.jsx';
import AdmissionRequirements from '../pages/Admission/AdmissionRequirements.jsx';
import InsideEgyptRequirements from '../pages/Admission/InsideEgyptRequirements.jsx';
import OutsideEgyptRequirements from '../pages/Admission/OutsideEgyptRequirements.jsx';
import OutsideEgyptRequirementsForeigners from '../pages/Admission/OutsideEgyptRequirementsForeigners.jsx';
import AdmissionFees from "../pages/Admission/AdmissionFees.jsx";
import Academics from '../pages/Academics/Academics.jsx';
import British from "../pages/Academics/British.jsx";
import KindergartenAcademics from "../pages/Academics/KindergartenAcademics.jsx";
import KindergartenNationalAcademics from "../pages/Academics/KindergartenNationalAcademics.jsx";
import KindergartenInternationalAcademics from "../pages/Academics/KindergartenInternationalAcademics.jsx";
import PreKindergartenAcademics from "../pages/Academics/PreKindergartenAcademics.jsx";
import NationalAcademics from '../pages/Academics/National.jsx';
import AmericanAcademics from '../pages/Academics/American.jsx';
import PartnersAcademics from '../pages/Academics/Partners.jsx';
import Facilities from "../pages/Academics/Facilities.jsx";
import StaffAcademics from '../pages/Academics/Staff.jsx';
import NationalStaff from '../pages/Academics/Staff/NationalStaff.jsx';
import BritishStaff from '../pages/Academics/Staff/BritishStaff.jsx';
import AmericanStaff from '../pages/Academics/Staff/AmericanStaff.jsx';
import KindergartenStaff from '../pages/Academics/Staff/KindergartenStaff.jsx';
import StudentLife from "../pages/StudentsLife/StudentsLife.jsx";
import StudentsUnion from '../pages/StudentsLife/StudentsUnion.jsx';
import Activities from '../pages/StudentsLife/Activities.jsx';
import Library from '../pages/StudentsLife/Library/Library.jsx';
import EnglishFairyTales from '../pages/StudentsLife/Library/EnglishFairyTales.jsx';
import EnglishDrama from '../pages/StudentsLife/Library/EnglishDrama.jsx';
import EnglishLevels from '../pages/StudentsLife/Library/EnglishLevels.jsx';
import EnglishGeneral from '../pages/StudentsLife/Library/EnglishGeneral.jsx';
import ArabicInformation from '../pages/StudentsLife/Library/ArabicInformation.jsx';
import ArabicGeneral from '../pages/StudentsLife/Library/ArabicGeneral.jsx';
import ArabicReligion from '../pages/StudentsLife/Library/ArabicReligion.jsx';
import ArabicStories from '../pages/StudentsLife/Library/ArabicStories.jsx';
import Events from "../pages/Events/Events.jsx";
import NationalCalendar from "../pages/Events/NationalCalendar.jsx";
import BritishCalendar from '../pages/Events/BritishCalendar.jsx';
import AmericanCalendar from '../pages/Events/AmericanCalendar.jsx';
import KgCalendarEvents from '../pages/Events/KGCalendars.jsx';
import AmericanKGCalendar from "../pages/Events/AmericanKGCalendar.jsx";
import BritishKGCalendar from "../pages/Events/BritishKGCalendar.jsx";
import NationalKGCalendar from "../pages/Events/NationalKGCalendar.jsx";
import GraduationBookingLogin from "../pages/Events/GraduationBooking/GraduationBookingLogin.jsx";
import GraduationBookingDashboard from '../pages/Events/GraduationBooking/GraduationBookingDashboard.jsx';
import GraduationBookingMedia from "../pages/Events/GraduationBooking/GraduationBookingMedia.jsx";
import GraduationBookingExtras from "../pages/Events/GraduationBooking/GraduationBookingExtras.jsx";
import GraduationBookingStatusInfo from "../pages/Events/GraduationBooking/GraduationBookingStatusInfo.jsx";
import GraduationBookingConfirmation from '../pages/Events/GraduationBooking/GraduationBookingConfirmation.jsx';
import OpenDaySignup from "../pages/Events/OpenDaySignup.jsx";
import Gallery from "../pages/Gallery/Gallery.jsx";
import PhotosGallery from '../pages/Gallery/Photos.jsx';
import VideosGallery from '../pages/Gallery/Videos.jsx';
import Tour360Gallery from '../pages/Gallery/360Tour.jsx';
import Covid19 from '../pages/FAQs/Covid19.jsx';
import NotFound from '../pages/NotFound.jsx';

function AppServer() {
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

    const excludePaths = ['/academics/staff'];
    const shouldExclude = excludePaths.includes(location.pathname);

    return (
        <div className="App">
            {!shouldExclude && <NavigationBar compactOrAdmin={false} isMobileApp={false}/>}
            <div className="content">
                <ErrorBoundary ignoreLngUpdate={false}>
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
                        <Route path="/academics" element={<Academics isMobileApp={false}/>} />
                        <Route path="/academics/kindergarten" element={<KindergartenAcademics />} />
                        <Route path="/academics/kindergarten-national" element={<KindergartenNationalAcademics />} />
                        <Route path="/academics/kindergarten-international" element={<KindergartenInternationalAcademics />} />
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
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </ErrorBoundary>
            </div>
            {!shouldExclude && <Footer />}
        </div>
    );
}

export default AppServer;