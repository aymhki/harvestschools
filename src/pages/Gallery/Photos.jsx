import '../../styles/Gallery.css';
import GalleryPhotoCollages from "../../modules/GalleryPhotoCollages.jsx";
import {useTranslation} from "react-i18next";

function Photos() {
    const { t } = useTranslation(['gallery-pages']);

  return (
    <div className="gallery-photos-page">
        <title>Harvest International School | Gallery | Photos</title>
        <meta name="description" content="Take a look at memories, demos, tours, and more videos and photos of Harvest International School in Borg El Arab, Egypt."/>
        <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Gallery, Photos, Videos, 360 Tour, Memories, Demos, Tours, معرض, صور, فيديوهات, جولة 360, ذكريات, عروض, جولات"/>
        <meta name="author" content="Harvest International School"/>
        <meta name="robots" content="index, follow"/>
        <meta name="googlebot" content="index, follow"/>

      <div className={'extreme-padding-container make-this-container-have-gaps'}>

        <h1>
            {t("gallery-pages.photo-gallery-page.title")}
        </h1>

        <GalleryPhotoCollages/>

      </div>
    </div>
  );
}

export default Photos;
