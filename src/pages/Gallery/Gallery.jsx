import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/Gallery.css';
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function Gallery() {

    const { t } = useTranslation();

    const options = [
        {
            title: t("gallery-pages.options-page.photo-gallery-option"),
            image: "/assets/images/GalleryPages/Photos1.png",
            description: t("gallery-pages.options-page.photo-gallery-option-description"),
            link: "/gallery/photos",
            buttonText: t("common.select"),
        },
        {
            title: t("gallery-pages.options-page.video-gallery-option"),
            image: "/assets/images/GalleryPages/Videos1.png",
            description: t("gallery-pages.options-page.video-gallery-option-description"),
            link: "/gallery/videos",
            buttonText: t("common.select"),
        },
        {
            title: t("gallery-pages.options-page.360-tour-option"),
            image: "/assets/images/GalleryPages/360Tour1.png",
            description: t("gallery-pages.options-page.360-tour-option-description"),
            link: "/gallery/360-tour",
            buttonText: t("common.select"),
        },
    ];

    return (
        <div className={"gallery-page"}>
            <Helmet>
                <title>Harvest International School | Gallery</title>
                <meta name="description" content="Take a look at memories, demos, tours, and more videos and photos of Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Gallery, Photos, Videos, 360 Tour, Memories, Demos, Tours, معرض, صور, فيديوهات, جولة 360, ذكريات, عروض, جولات"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <OptionsGrid title={t("gallery-pages.options-page.title")} titleInArabic={false} options={options}/>
        </div>
    );
}

export default Gallery;