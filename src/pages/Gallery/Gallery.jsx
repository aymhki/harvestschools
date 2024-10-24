import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/Gallery.css';
import {Helmet} from "react-helmet";

function Gallery() {

    const options = [
        {
            title: "Photos",
            image: "/assets/images/GalleryPages/Photos1.png",
            description: "View photos of the school facilities and fun days.",
            link: "/gallery/photos",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Videos",
            image: "/assets/images/GalleryPages/Videos1.png",
            description: "View videos of the school projects and parties.",
            link: "/gallery/videos",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "360 Tour",
            image: "/assets/images/GalleryPages/360Tour1.png",
            description: "Take a 360 tour in the school.",
            link: "/gallery/360-tour",
            buttonText: "Select",
            titleInArabic: false,
            descriptionInArabic: false
        },
    ];

    return (
        <div className={"gallery-page"}>
            <Helmet>
                <title>Harvest International School | Gallery</title>
                <meta name="description"
                      content="Take a look at memories, demos, tours, and more videos and photos of Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Gallery, Photos, Videos, 360 Tour, Memories, Demos, Tours, معرض, صور, فيديوهات, جولة 360, ذكريات, عروض, جولات"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <OptionsGrid title="Gallery" titleInArabic={false} options={options}/>
        </div>
    );
}

export default Gallery;