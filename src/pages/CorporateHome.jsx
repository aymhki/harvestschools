import PhotoSlider from "../modules/PhotoSlider.jsx";
import '../styles/CorporateHome.css';
import '../styles/Academics.css'
import {Helmet} from "react-helmet-async";
import Form from "../modules/Form.jsx";
import { useTranslation } from 'react-i18next';
import { servePublicAsset } from "../services/General/GeneralServices.jsx";

function CorporateHome() {

    const { t } = useTranslation(['corporate-home', 'academics-pages']);

    const homeSliderPhotos = [
        { id: 1, url: '/images/CorporateHome/VisionBackground.jpg', title: t("corporate-home.our-vision"), text: t("corporate-home.harvest-schools-vision") },
        { id: 2, url: '/images/CorporateHome/MissionBackground.jpg', title: t("corporate-home.our-mission"), text: t("corporate-home.harvest-schools-mission") },
    ]

    const homeStafPhotos = [
        { id: 1, url: '/images/CorporateHome/AmericanStaff.jpg', alt: 'American Staff'},
        { id: 2, url: '/images/CorporateHome/KGStaff.jpg', alt: 'KG Staff'},
        { id: 3, url: '/images/CorporateHome/IGStaff.jpg', alt: 'British Staff'},
        { id: 4, url: '/images/CorporateHome/NationalStaff.jpg', alt: 'National Staff'}
    ]

    const contactUsFormFields = [
        { id: 1, type: 'text', label: 'Name', displayLabel: t("corporate-home.contact-us-form-fields.name"), httpName: 'name', required: true, value: '', setValue: null, widthOfField: 1 },
        { id: 2, type: 'email', label: 'Email', displayLabel: t("corporate-home.contact-us-form-fields.email"), httpName: 'email', required: true, value: '', setValue: null, widthOfField: 2 },
        { id: 3, type: 'tel', label: 'Phone Number', displayLabel: t("corporate-home.contact-us-form-fields.phone-number"), httpName: 'phone', required: true, value: '', setValue: null, widthOfField: 2 },
        {id:  4, type: 'select', label: 'Subject', displayLabel: t("corporate-home.contact-us-form-fields.subject"), httpName: 'subject', required: true, value: '', setValue: null, widthOfField: 1, choices: [t("corporate-home.contact-us-form-fields.general-inquiry"), t("corporate-home.contact-us-form-fields.consultation"), t("corporate-home.contact-us-form-fields.feedback"), t("corporate-home.contact-us-form-fields.partnership")]},
        { id: 5, type: 'textarea', label: 'Message', displayLabel: t("corporate-home.contact-us-form-fields.message"), httpName: 'message', required: true, value: '', setValue: null, widthOfField: 1 }
    ]

    const imageSources = [
        "/images/AcademicsPages/Facilities/HandballField2.jpg",
        "/images/AcademicsPages/Facilities/FootballField.jpg",
        "/images/AcademicsPages/Facilities/Library.jpg",
        "/images/AcademicsPages/Facilities/Gym1.jpg",
        "/images/AcademicsPages/Facilities/BasketballField.jpg",
        "/images/AcademicsPages/Facilities/Lab1.jpg",
        "/images/AcademicsPages/Facilities/Lab2.jpg",
        "/images/AcademicsPages/Facilities/Toys.jpg",
        "/images/AcademicsPages/Facilities/HandballField1.jpg",
        "/images/AcademicsPages/Facilities/BasketballField1.jpg",
        "/images/AcademicsPages/Facilities/Lab3.jpg",
        "/images/AcademicsPages/Facilities/Gym2.jpg",
    ];

    const imageAlts = t('academics-pages.facilities.imageAlts', { returnObjects: true }) || [];

    return (

        <div className="corporate-home-page" >
            <Helmet>
                <title>Al-Fajr Al-Basem | Egypt</title>
                <meta name="description" content="Undertaking construction works, outfitting educational institutions and schools, and all import and export activities."/>
                <meta name="keywords" content="Al-Fajr Al-Basem, Al Fajr Al Basem, AlFajr AlBasem, Happy Dawn, الفجر الباسم" />
                <meta name="author" content="Al-Fajr Al-Basem" />
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className="home-page-vision-and-mission-slider">
                <PhotoSlider photos={homeSliderPhotos} darken={true} />
            </div>

            <div className="home-page-about-us-section">
                <h1>
                    {t("corporate-home.about-us")}
                </h1>
                <p>
                    {t("corporate-home.harvest-schools-about-us")}
                </p>
            </div>

            <h1>
                {t("corporate-home.our-staff")}
            </h1>

            <div className="extreme-padding-container">
                <div className="home-page-our-staff-grid ">
                    {homeStafPhotos.map((photo) => (
                        <img key={photo.id} src={photo.url} alt={photo.alt} />
                    ))}
                </div>
            </div>


            <h1>
                {t("corporate-home.our-facilities")}
            </h1>

            <div className="extreme-padding-container">
                <div className="facilities-show-case-grid">
                    {imageSources.map((src, index) => (
                        <img key={index} src={servePublicAsset(src)} alt={imageAlts[index] || ''} className="facilities-show-case-image"/>
                    ))}
                </div>
            </div>

            <div className="home-page-contact-and-visit-us-container">

                <div className="home-page-contact-us-section">
                    <h1>
                        {t("corporate-home.contact-us")}
                    </h1>

                    <p className="important-info-hyperlink-text">
                        {t("corporate-home.phone")} &nbsp;
                        <span  onClick={() => window.open('tel:+201061894477')}>
                             {t("corporate-home.01061894477,")}
                        </span> &nbsp;
                        <span  onClick={() => window.open('tel:+201118900165')}>
                            {t("corporate-home.01118900165")}
                        </span> &nbsp;
                    </p>


                    <Form fields={contactUsFormFields} sendPdf={false} mailTo={'info@alfajralbasem.com'} formTitle={'Contact Us Form Submission'} lang={"en"} captchaLength={2}/>
                </div>

                <div className="home-page-visit-us-section">
                    <h1>
                        {t("corporate-home.visit-us")}
                    </h1>

                    <p className="important-info-hyperlink-text"
                       onClick={() => window.open('https://maps.app.goo.gl/4mWYs9jX5T2gK1FL7', '_blank')}>
                        {t("corporate-home.harvest-schools-address")}
                    </p>

                    <div className="home-page-visit-us-section-map-container">
                        <iframe
                            className="home-page-visit-us-section-map"
                            frameBorder={0}
                            allowFullScreen
                            loading="lazy"
                            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3000!2d29.59631!3d30.868058!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x6e0538b2d2ee1e57!2sHarvest%20International%20School!5e0!3m2!1sen!2sus!4v1623455102421!5m2!1sen!2sus"
                        />
                    </div>

                </div>

            </div>

        </div>
    );
}

export default CorporateHome;