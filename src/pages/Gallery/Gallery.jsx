import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/Gallery.css';

function Gallery() {

    const options = [
        {
            title: "Photos",
            image: "/assets/images/GalleryPages/Photos1.png",
            description: "View photos of the school facilities and fun days.",
            link: "/gallery/photos",
            buttonText: "Select"
        },
        {
            title: "Videos",
            image: "/assets/images/GalleryPages/Videos1.png",
            description: "View videos of the school projects and parties.",
            link: "/gallery/videos",
            buttonText: "Select"
        },
        {
            title: "360 Tour",
            image: "/assets/images/GalleryPages/360Tour1.png",
            description: "Take a 360 tour in the school.",
            link: "/gallery/360-tour",
            buttonText: "Select"
        },
    ];

    return (
        <div className={"gallery-page"}>
            <OptionsGrid title="Gallery" options={options}/>
        </div>
    );
}

export default Gallery;