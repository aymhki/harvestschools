import PhotoSlider from "../modules/PhotoSlider.jsx";
import '../styles/Home.css';
import {Helmet} from "react-helmet-async";
import ParallaxScrollSection from "../modules/ParallaxScrollSection.jsx";
import Form from "../modules/Form.jsx";
import { useTranslation } from 'react-i18next';

function Home() {

    const { t } = useTranslation();
    

    const homeSliderPhotos = [
        { id: 1, url: '/assets/images/HomePage/VisionBackground.jpg', title: t("home.our-vision"), text: t("home.harvest-schools-vision") },
        { id: 2, url: '/assets/images/HomePage/MissionBackground.jpg', title: t("home.our-mission"), text: t("home.harvest-schools-mission") },
    ]

    const contactUsFormFields = [
        { id: 1, type: 'text', label: 'Name', displayLabel: t("home.contact-us-form-fields.name"), httpName: 'name', required: true, value: '', setValue: null, widthOfField: 1 },
        { id: 2, type: 'email', label: 'Email', displayLabel: t("home.contact-us-form-fields.email"), httpName: 'email', required: true, value: '', setValue: null, widthOfField: 2 },
        { id: 3, type: 'tel', label: 'Phone Number', displayLabel: t("home.contact-us-form-fields.phone-number"), httpName: 'phone', required: true, value: '', setValue: null, widthOfField: 2 },
        {id:  4, type: 'select', label: 'Subject', displayLabel: t("home.contact-us-form-fields.subject"), httpName: 'subject', required: true, value: '', setValue: null, widthOfField: 1, choices: [t("home.contact-us-form-fields.admissions"), t("home.contact-us-form-fields.general-inquiry"), t("home.contact-us-form-fields.feedback"), t("home.contact-us-form-fields.other")]},
        { id: 5, type: 'textarea', label: 'Message', displayLabel: t("home.contact-us-form-fields.message"), httpName: 'message', required: true, value: '', setValue: null, widthOfField: 1 }
    ]

    return (

        <div className="home-page" >
            <Helmet>
                <title>Harvest International School | Egypt</title>
                <meta name="description"
                      content="Harvest International School (HIS) was founded in 2016 by Eng. Hassan Khalil Ibrahim to be the first international school in Borg El-Arab recruiting highly qualified teachers and administrators. "/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, International School, British Syllabus, American Syllabus, Egyptian Syllabus, Education, School, Learning, Teaching, Students, Teachers, World-Class Educational Facility, Sports Fields, Gymnasium, Swimming Pool, Twenty-First Century, Education, Eng. Hassan Khalil Ibrahim, مدارس هارفست, برج العرب, مدرسة, هارفست"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className="home-page-vision-and-mission-slider">
                <PhotoSlider photos={homeSliderPhotos} darken={true} />
            </div>

            <div className="home-page-about-us-section">
                <h1>
                    {t("home.about-us")}
                </h1>
                <p>
                    {t("home.harvest-schools-about-us")}
                </p>

                <div className="home-page-about-us-video">
                    {/*<iframe className="home-page-about-us-video"*/}
                    {/*        src="https://www.youtube.com/embed/c_NWecZZ01M"*/}
                    {/*        title="YouTube video player"*/}
                    {/*        frameBorder={0}*/}
                    {/*        loading={"lazy"}*/}
                    {/*        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"*/}
                    {/*        allowFullScreen/>*/}


                    <iframe
                            className={"home-page-about-us-video"}
                            src="https://www.youtube-nocookie.com/embed/BoRMW82VEIc?si=2pP32Q9CJSw-zx_F"
                            title="YouTube video player" frameBorder="0"
                            loading={"lazy"}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                </div>
            </div>

            <div className="home-page-accreditations-section-container">
                <div className="home-page-accreditations-section">
                    <img className="accreditation-photo" src="/assets/images/HomePage/AccreditedCognia.png"
                         alt="Cognia Accredited"/>
                    <img className="accreditation-photo" src="/assets/images/HomePage/CICIS.png" alt="University of Cambridge Accredited" />
                </div>
            </div>

            <div className="home-page-admission-section">
                <ParallaxScrollSection
                    title={t("home.elearning-and-academics")}
                    text={t("home.harvest-schools-elearning-and-academics")}
                    backgroundImage="/assets/images/HomePage/E-Learning&Academics.jpg"
                    darken={true}
                    buttonText={t("common.learn-more")}
                    buttonLink="/academics/partners"
                />
            </div>


            <div className="home-page-explore-section">
                <ParallaxScrollSection title={null} text={null} backgroundImage={'/assets/images/HomePage/Explore360.jpg'} darken={true} buttonText={t("common.explore")} buttonLink={'/gallery/360-tour'} />
            </div>

            <div className="home-page-contact-and-visit-us-container">
                <div className="home-page-contact-us-section">
                    <h1>
                        {t("home.contact-us")}
                    </h1>

                    <p className="important-info-hyperlink-text">
                        {t("home.phone")} &nbsp;
                        <span  onClick={() => window.open('tel:+201028329668')}>
                             {t("home.01028329668,")}
                        </span> &nbsp;
                        <span  onClick={() => window.open('tel:+201097875407')}>
                            {t("home.01097875407,")}
                        </span> &nbsp;
                        <span onClick={() => window.open('tel:+201028940675')}>
                            {t("home.01028940675")}
                        </span>
                    </p>


                    <Form fields={contactUsFormFields} sendPdf={false} mailTo={'asmaa.samir@harvestschools.com'} formTitle={'Contact Us Form Submission'} lang={"en"} captchaLength={2}/>
                </div>

                <div className="home-page-visit-us-section">
                    <h1>
                        {t("home.visit-us")}
                    </h1>

                    <p className="important-info-hyperlink-text"
                       onClick={() => window.open('https://maps.app.goo.gl/4mWYs9jX5T2gK1FL7', '_blank')}>
                        {t("home.harvest-schools-address")}
                    </p>

                    <div className="home-page-visit-us-section-map-container">
                        <iframe className="home-page-visit-us-section-map"
                            frameBorder={0}
                            allowFullScreen
                            loading="lazy"
                            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13698.65926645064!2d29.59631!3d30.868058!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x6e0538b2d2ee1e57!2sHarvest%20International%20School!5e0!3m2!1sen!2sus!4v1623455102421!5m2!1sen!2sus;output=embed;frameborder=0;loading=lazy;"/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;