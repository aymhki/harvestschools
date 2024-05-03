import {BrowserRouter, Route, Routes, Navigate} from 'react-router-dom';
import NavigationBar from "../modules/NavigationBar.jsx";
import Footer from "../modules/Footer.jsx";
import Home from '../pages/Home';
import Faqs from '../pages/FAQs/FAQs.jsx';
import MinimumStageAge from '../pages/FAQs/MinimumStageAge.jsx';
import Vacancies from '../pages/Vacancies';
import Admission from "../pages/Admission/Admission.jsx";
import AdmissionProcess from '../pages/Admission/AdmissionProcess';
import AdmissionRequirements from '../pages/Admission/AdmissionRequirements';
import InsideEgyptRequirements from '../pages/Admission/InsideEgyptRequirements';
import OutsideEgyptRequirements from '../pages/Admission/OutsideEgyptRequirements';
import OutsideEgyptRequirementsForeigners from '../pages/Admission/OutsideEgyptRequirementsForeigners';
import Academics from '../pages/Academics/Academics.jsx';
import British from "../pages/Academics/British.jsx";
import NationalAcademics from '../pages/Academics/National';
import AmericanAcademics from '../pages/Academics/American';
import PartnersAcademics from '../pages/Academics/Partners';
import StaffAcademics from '../pages/Academics/Staff';
import NationalStaff from '../pages/Academics/Staff/NationalStaff';
import BritishStaff from '../pages/Academics/Staff/BritishStaff';
import AmericanStaff from '../pages/Academics/Staff/AmericanStaff';
import KindergartenStaff from '../pages/Academics/Staff/KindergartenStaff';
import StudentLife from "../pages/StudentsLife/StudentLife.jsx";
import StudentsUnion from '../pages/StudentsLife/StudentsUnion';
import Activities from '../pages/StudentsLife/Activities';
import Library from '../pages/StudentsLife/Library/EnglishOrArabic';
import EnglishLibrary from '../pages/StudentsLife/Library/EnglishLibrary';
import ArabicLibrary from '../pages/StudentsLife/Library/ArabicLibrary';
import EnglishFairyTails from '../pages/StudentsLife/Library/EnglishFairyTails';
import EnglishDrama from '../pages/StudentsLife/Library/EnglishDrama';
import EnglishLevels from '../pages/StudentsLife/Library/EnglishLevels';
import EnglishGeneral from '../pages/StudentsLife/Library/EnglishGeneral';
import ArabicInformation from '../pages/StudentsLife/Library/ArabicInformation';
import ArabicGeneral from '../pages/StudentsLife/Library/ArabicGeneral';
import ArabicReligion from '../pages/StudentsLife/Library/ArabicReligion';
import ArabicStories from '../pages/StudentsLife/Library/ArabicStories';
import Events from "../pages/Events/Events.jsx";
import BritishCalendar from '../pages/Events/BritishCalendar';
import AmericanCalendar from '../pages/Events/AmericanCalendar';
import NationalCalendar from "../pages/Events/NationalCalendar.jsx";
import KgCalendarEvents from '../pages/Events/KgCalendar';
import Gallery from "../pages/Gallery/Gallery.jsx";
import PhotosGallery from '../pages/Gallery/Photos';
import VideosGallery from '../pages/Gallery/Videos';
import Tour360Gallery from '../pages/Gallery/360Tour';
import Covid19 from '../pages/FAQs/Covid19/EnglishOrArabic';
import Covid19EnglishRead from '../pages/FAQs/Covid19/Covid19EnglishRead';
import Covid19ArabicRead from '../pages/FAQs/Covid19/Covid19ArabicRead';
import Covid19English from '../pages/FAQs/Covid19/Covid19English';
import Covid19Arabic from '../pages/FAQs/Covid19/Covid19Arabic';
import MoreInfo from "../pages/FAQs/MoreInfo.jsx";
import NotFound from '../pages/NotFound';

function Router() {
    return (
        <BrowserRouter>
            <NavigationBar/>
            <Routes>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="/home" element={<Home />} />

                <Route path="/more-info" element={<MoreInfo />} />
                <Route path="/faqs" element={<Faqs />} />
                <Route path="/minimum-stage-age" element={<MinimumStageAge />} />
                <Route path="/covid-19" element={<Covid19 />} />
                <Route path="/covid-19/covid-19-english-read" element={<Covid19EnglishRead />} />
                <Route path="/covid-19/covid-19-arabic-read" element={<Covid19ArabicRead />} />
                <Route path="/covid-19/covid-19-english" element={<Covid19English />} />
                <Route path="/covid-19/covid-19-arabic" element={<Covid19Arabic />} />

                <Route path="/vacancies" element={<Vacancies />} />

                <Route path="/admission" element={<Admission />} />
                <Route path="/admission/admission-process" element={<AdmissionProcess />} />
                <Route path="/admission/admission-requirements" element={<AdmissionRequirements />} />
                <Route path="/admission/inside-egypt-requirements" element={<InsideEgyptRequirements />} />
                <Route path="/admission/outside-egypt-requirements" element={<OutsideEgyptRequirements />} />
                <Route path="/admission/outside-egypt-requirements-foreigners" element={<OutsideEgyptRequirementsForeigners />} />

                <Route path="/academics" element={<Academics />} />
                <Route path="/academics/british" element={<British />} />
                <Route path="/academics/national" element={<NationalAcademics />} />
                <Route path="/academics/american" element={<AmericanAcademics />} />
                <Route path="/academics/partners" element={<PartnersAcademics />} />
                <Route path="/academics/staff" element={<StaffAcademics />} />
                <Route path="/academics/staff/national-staff" element={<NationalStaff />} />
                <Route path="/academics/staff/british-staff" element={<BritishStaff />} />
                <Route path="/academics/staff/american-staff" element={<AmericanStaff />} />
                <Route path="/academics/staff/kindergarten-staff" element={<KindergartenStaff />} />

                <Route path="/students-life" element={<StudentLife />} />
                <Route path="/students-life/students-union" element={<StudentsUnion />} />
                <Route path="/students-life/activities" element={<Activities />} />
                <Route path="/students-life/library" element={<Library />} />
                <Route path="/students-life/library/english-library" element={<EnglishLibrary />} />
                <Route path="/students-life/library/arabic-library" element={<ArabicLibrary />} />
                <Route path="/students-life/library/english-fairy-tails" element={<EnglishFairyTails />} />
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

                <Route path="/gallery" element={<Gallery />} />
                <Route path="/gallery/photos" element={<PhotosGallery />} />
                <Route path="/gallery/videos" element={<VideosGallery />} />
                <Route path="/gallery/360-tour" element={<Tour360Gallery />} />

                <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer/>
        </BrowserRouter>
    );
}

export default Router;




