import '../../styles/Academics.css'
import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function Facilities() {
    const { t } = useTranslation();

    const imageSources = [
        "/assets/images/AcademicsPages/Facilities/HandballField2.jpg",
        "/assets/images/AcademicsPages/Facilities/FootballField.jpg",
        "/assets/images/AcademicsPages/Facilities/Library.jpg",
        "/assets/images/AcademicsPages/Facilities/Gym1.jpg",
        "/assets/images/AcademicsPages/Facilities/BasketballField.jpg",
        "/assets/images/AcademicsPages/Facilities/Lab1.jpg",
        "/assets/images/AcademicsPages/Facilities/Lab2.jpg",
        "/assets/images/AcademicsPages/Facilities/Toys.jpg",
        "/assets/images/AcademicsPages/Facilities/HandballField1.jpg",
        "/assets/images/AcademicsPages/Facilities/BasketballField1.jpg",
        "/assets/images/AcademicsPages/Facilities/Lab3.jpg",
        "/assets/images/AcademicsPages/Facilities/Gym2.jpg",
    ];

    const imageAlts = t('academics-pages.facilities.imageAlts', { returnObjects: true }) || [];
    const computerLabRules = t('academics-pages.facilities.computerLab.rules', { returnObjects: true }) || [];
    const computerLabResponsibilities = t('academics-pages.facilities.computerLab.responsibilities', { returnObjects: true }) || [];
    const libraryRules = t('academics-pages.facilities.library.rules', { returnObjects: true }) || [];
    const canteenRules = t('academics-pages.facilities.canteen.rules', { returnObjects: true }) || [];
    const gymList = t('academics-pages.facilities.sports.gymList', { returnObjects: true }) || [];
    const outdoorCourtsList = t('academics-pages.facilities.sports.outdoorCourtsList', { returnObjects: true }) || [];
    const gymRules = t('academics-pages.facilities.sports.gymRules', { returnObjects: true }) || [];
    const swimmingPoolRules = t('academics-pages.facilities.sports.swimmingPoolRules', { returnObjects: true }) || [];

    return (
        <div className="academics-facilities-page">
            <Helmet>
                <title>{t('nav.facilities')} | {t('nav.home')}</title>
                <meta name="description"
                      content="Learn more about the classrooms, labs, libraries, canteens, sports facilities, and more at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>
            <div className={"extreme-padding-container"}>
                <h1>{t('academics-pages.facilities.pageTitle')}</h1>

                <div className="facilities-show-case-grid">
                    {imageSources.map((src, index) => (
                        <img key={index} src={src} alt={imageAlts[index] || ''} className="facilities-show-case-image"/>
                    ))}
                </div>

            </div>

            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/ComputerLab.jpg"} title={t('academics-pages.facilities.computerLab.title')} darken={true}
                                   divElements={[
                                       (
                                           <div className={"computer-lab-policy"} key={"computer-lab-policy"}>
                                               <p>{t('academics-pages.facilities.computerLab.intro')}</p>
                                               <ul className={"computer-lab-policy-list"}>
                                                   {computerLabRules.map((rule, index) => <li key={index}><p>{rule}</p></li>)}
                                               </ul>

                                               <p>{t('academics-pages.facilities.computerLab.responsibilitiesIntro')}</p>
                                               <ul className={"computer-lab-policy-list"}>
                                                   {computerLabResponsibilities.map((resp, index) => <li key={index}><p>{resp}</p></li>)}
                                               </ul>
                                           </div>
                                       )]}/>

            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/Library.jpg"} title={t('academics-pages.facilities.library.title')} darken={true}
                                   divElements={[(
                                       <div className={"library-policy"} key={"library-policy"}>
                                           <p>{t('academics-pages.facilities.library.lessons')}</p>
                                           <p>{t('academics-pages.facilities.library.circulationTitle')}</p>
                                           <ul className={"library-policy-list"}>
                                               {libraryRules.map((rule, index) => <li key={index}><p>{rule}</p></li>)}
                                           </ul>
                                       </div>
                                   )]}/>


            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/Canteen.jpg"} title={t('academics-pages.facilities.canteen.title')} darken={true}
                                   divElements={[(
                                       <div className={"canteen-policy"} key={"canteen-policy"}>
                                           <p>{t('academics-pages.facilities.canteen.intro')}</p>
                                           <p>{t('academics-pages.facilities.canteen.policyTitle')}</p>
                                           <ul className={"canteen-policy-list"}>
                                               {canteenRules.map((rule, index) => <li key={index}><p>{rule}</p></li>)}
                                           </ul>
                                       </div>
                                   )]}/>

            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/Classroom.jpg"} title={t('academics-pages.facilities.smartClasses.title')} darken={true}
                                   divElements={[(
                                       <div className={"smart-classes-policy"} key={"smart-classes-policy"}>
                                           <p>{t('academics-pages.facilities.smartClasses.description')}</p>
                                       </div>
                                   )]}/>

            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/Gym2.jpg"} title={t('academics-pages.facilities.sports.title')} darken={true}
                                   divElements={[(
                                       <div className={"sports-policy"} key={"sports-policy"}>
                                           <p>{t('academics-pages.facilities.sports.intro')}</p>
                                           <p>{t('academics-pages.facilities.sports.gymTitle')}</p>
                                           <ul className={"gym-list"}>
                                               {gymList.map((item, index) => <li key={index}><p>{item}</p></li>)}
                                           </ul>

                                           <p>{t('academics-pages.facilities.sports.outdoorCourtsTitle')}</p>
                                           <ul className={"outdoor-courts-list"}>
                                               {outdoorCourtsList.map((item, index) => <li key={index}><p>{item}</p></li>)}
                                           </ul>

                                           <p>{t('academics-pages.facilities.sports.gymnasiumsTitle')}</p>
                                           <p>{t('academics-pages.facilities.sports.gymRulesIntro')}</p>
                                           <ul className={"gym-rules"}>
                                               {gymRules.map((rule, index) => <li key={index}><p>{rule}</p></li>)}
                                           </ul>

                                           <p>{t('academics-pages.facilities.sports.swimmingPoolTitle')}</p>
                                           <ul className={"swimming-pool-rules"}>
                                               {swimmingPoolRules.map((rule, index) => <li key={index}><p>{rule}</p></li>)}
                                           </ul>
                                       </div>
                                   )]}/>
            

        </div>
    );
}

export default Facilities;
