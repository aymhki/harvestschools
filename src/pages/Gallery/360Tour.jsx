import '../../styles/Gallery.css'
import {Helmet} from "react-helmet-async";
import {useState} from "react";
import {useTranslation} from "react-i18next";

function Tour360() {
    const { t, i18n } = useTranslation();

    const sections = [
        { title: t("gallery-pages.360-tour-page.computer-lab"), src: "https://www.google.com/maps/embed?pb=!4v1717092186299!6m8!1m7!1sCAoSLEFGMVFpcE5RbGxsODJXalhJdkVCbGNUWFFqdmlRVHdsT3ZFVWJBRFg0UlBm!2m2!1d30.8717701!2d29.6004104!3f180!4f0!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.swimming-pool"), src: "https://www.google.com/maps/embed?pb=!4v1717092806906!6m8!1m7!1sCAoSLEFGMVFpcE1oZ1R0VzlDLW5WQ2lnMXFDZXNxWkk3Uk92RGVZSEFiTUI3ZHYt!2m2!1d30.8717701!2d29.6004104!3f160!4f20!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.library"), src: "https://www.google.com/maps/embed?pb=!4v1717092949048!6m8!1m7!1sCAoSLEFGMVFpcE85LWozb2VuZFZoTEpVX2I4X3gweElIUURBSkNadHpCWjItZGZt!2m2!1d30.8717701!2d29.6004104!3f0!4f0!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.science-labs"), src: "https://www.google.com/maps/embed?pb=!4v1717099635046!6m8!1m7!1sCAoSLEFGMVFpcE1RZTlDVEpWUmZyS2M3MHg4aENXOVQzc3dfenlURzhmZXlRMkF1!2m2!1d30.8718058!2d29.6010786!3f220!4f0!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.science-labs"), src: "https://www.google.com/maps/embed?pb=!4v1717099669971!6m8!1m7!1sCAoSLEFGMVFpcE9Ld0Rad05GZXBudUJpUXNsREtsZEF0eVpGYXBmX0JDZUdoMjJs!2m2!1d30.8714784!2d29.6003987!3f260!4f0!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.science-labs"), src: "https://www.google.com/maps/embed?pb=!4v1717099706538!6m8!1m7!1sCAoSLEFGMVFpcE16a1hKazh1WUtCb0p4MndOUWZaZ1NLaXB4X0t6VU9sYjN2WXBo!2m2!1d30.8714959!2d29.6008252!3f240!4f0!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.football-court"), src: "https://www.google.com/maps/embed?pb=!4v1717099864284!6m8!1m7!1sCAoSLEFGMVFpcE9nUTctSFEyMmZHeEVObEpCdVc2UWlGOFdZanNvZ2R3SHdUWjFr!2m2!1d30.8717701!2d29.6004104!3f180!4f20!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.basketball-court"), src: "https://www.google.com/maps/embed?pb=!4v1717099918997!6m8!1m7!1sCAoSLEFGMVFpcFBLMVRWbVNFcTVOODNpNnBOaTBmN1pmcURaS3o4aUxnaGZDTDhk!2m2!1d30.8717701!2d29.6004104!3f179.88747!4f0.11253999999999564!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.classrooms"), src: "https://www.google.com/maps/embed?pb=!4v1717100059488!6m8!1m7!1sCAoSLEFGMVFpcE9qaXpDalVfenQ1V1BWMVFSYUR6cDNCWFhzVElaU2dnTmRKWjFB!2m2!1d30.8717701!2d29.6004104!3f339.5160217848912!4f-0.04402518003266209!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.classrooms"), src: "https://www.google.com/maps/embed?pb=!4v1717100118155!6m8!1m7!1sCAoSLEFGMVFpcFBEbzdIUmo4Y2U5V0dHb1I5UndqMUZCYWNSUWVvVjlQWm5WdlU0!2m2!1d30.8717701!2d29.6004104!3f340!4f0!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.classrooms"), src: "https://www.google.com/maps/embed?pb=!4v1717100167463!6m8!1m7!1sCAoSLEFGMVFpcE5vSXNkRzRBQXNSYjVLc29ESk5YOHZrMk1mS1lLNkZPV0lNV2Zn!2m2!1d30.8717701!2d29.6004104!3f191.91822655109533!4f-7.563219385724608!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.classrooms"), src: "https://www.google.com/maps/embed?pb=!4v1717100266534!6m8!1m7!1sCAoSLEFGMVFpcE1ma1o4X2VneXFpclU0QjUxeWJObnNwUi1TRVFGZDZkOHRBbG1Y!2m2!1d30.8717701!2d29.6004104!3f358.31634689502863!4f-5.069005539892331!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.classrooms"), src: "https://www.google.com/maps/embed?pb=!4v1717100453094!6m8!1m7!1sCAoSLEFGMVFpcE1wNGJCdlNNRzgteFk4SXl5dlN3ZnVrb0Z6aDRMR1VrMER4Tlhu!2m2!1d30.8717701!2d29.6004104!3f72.47675696504018!4f12.128135526614287!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.classrooms"), src: "https://www.google.com/maps/embed?pb=!4v1717100502285!6m8!1m7!1sCAoSLEFGMVFpcE9penFOUjQ2ejB6THZuZkVmeHh3WDVSSFVWVExWN3l4YzhrRmFS!2m2!1d30.8717701!2d29.6004104!3f344.7785670427138!4f0!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.hallways"), src: "https://www.google.com/maps/embed?pb=!4v1717144100347!6m8!1m7!1sCAoSLEFGMVFpcE9aZDktWmUzdGdwWEgxcGh6NEV0c1dpQWRMTFZ6OEZHdzB4X09C!2m2!1d30.8717701!2d29.6004104!3f180!4f10!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.hallways"), src: "https://www.google.com/maps/embed?pb=!4v1717144148548!6m8!1m7!1sCAoSLEFGMVFpcE9VdjFyMVdzaW01eTZKX1hodVFmTmRIOXVLUmJHNW5mMDZJY1Vm!2m2!1d30.8717701!2d29.6004104!3f290.98121937863465!4f-0.8638499621877855!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.hallways"), src: "https://www.google.com/maps/embed?pb=!4v1717144181304!6m8!1m7!1sCAoSLEFGMVFpcE1PSzJURG9MZ25Pa2hKdU5UTUdCWHdQMDIwWGE3TzI4TUNlbDRj!2m2!1d30.8717701!2d29.6004104!3f0!4f20!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.hallways"), src: "https://www.google.com/maps/embed?pb=!4v1717144217016!6m8!1m7!1sCAoSLEFGMVFpcE5sQVgzYTRkZG1WVWFxbDNUWFROR0MzaDBCYmRvZGlfRmJtTmFl!2m2!1d30.8717701!2d29.6004104!3f0!4f20!5f0.7820865974627469&z=0" },
        { title: t("gallery-pages.360-tour-page.hallways"), src: "https://www.google.com/maps/embed?pb=!4v1717144258153!6m8!1m7!1sCAoSLEFGMVFpcFBTbzJzcDJLMXJleEp0SGpsaW8yQ0ItdHV1bjRRN05mTG16VXg0!2m2!1d30.8717701!2d29.6004104!3f0!4f20!5f0.7820865974627469&z=0" },
    ];

    const numberFormatter = new Intl.NumberFormat(i18n.language ==='ar' ? 'ar-EG' : 'en-US');


    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

    const goToPreviousSection = () => {
        setCurrentSectionIndex((prevIndex) =>
            prevIndex === 0 ? sections.length - 1 : prevIndex - 1
        );
    };

    const goToNextSection = () => {
        setCurrentSectionIndex((prevIndex) =>
            prevIndex === sections.length - 1 ? 0 : prevIndex + 1
        );
    };


    return (
        <div className="gallery-360-tour-page">
            <Helmet>
                <title>Harvest International School | Gallery | 360 Tour</title>
                <meta name="description" content="Take a look at memories, demos, tours, and more videos and photos of Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Gallery, Photos, Videos, 360 Tour, Memories, Demos, Tours, معرض, صور, فيديوهات, جولة 360, ذكريات, عروض, جولات"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className="extreme-padding-container">
                <h1>
                    {t("gallery-pages.360-tour-page.title")}
                </h1>

                <div>

                    <div className={"gallery-360-tour-index-wrapper"}>
                        <h2>{sections[currentSectionIndex].title}  ↺</h2>

                        <p>
                            {numberFormatter.format(currentSectionIndex + 1)} {t("gallery-pages.360-tour-page.of-separator")} {numberFormatter.format(sections.length)}
                        </p>
                    </div>


                    <iframe
                        src={sections[currentSectionIndex].src}
                        title={sections[currentSectionIndex].title}
                        allowFullScreen=""
                        frameBorder={0}
                        loading="lazy"
                        className="gallery-360-tour-iframe"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>

                <div className={"gallery-360-tour-buttons-wrapper"}>
                    <button onClick={goToPreviousSection}>
                        {t("gallery-pages.360-tour-page.previous-btn")}
                    </button>


                    <button onClick={goToNextSection}>
                        {t("gallery-pages.360-tour-page.next-btn")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Tour360;


