import '../../styles/Gallery.css';
import PhotoCollage from "../../modules/PhotoCollage.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function Photos() {
    const { t } = useTranslation();

  return (
    <div className="gallery-photos-page">
        <Helmet>
            <title>Harvest International School | Gallery | Photos</title>
            <meta name="description" content="Take a look at memories, demos, tours, and more videos and photos of Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Gallery, Photos, Videos, 360 Tour, Memories, Demos, Tours, معرض, صور, فيديوهات, جولة 360, ذكريات, عروض, جولات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

      <div className={'extreme-padding-container make-this-container-have-gaps'}>

        <h1>
            {t("gallery-pages.photo-gallery-page.title")}
        </h1>

        <PhotoCollage type={"slider"} title={t("gallery-pages.photo-gallery-page.about-that-team-work")} photos={
            [
          {
            src: "/assets/images/Gallery/Photos/TeamWork/TeamWork10.jpg",
            alt: "TeamWork10"
          },
          {
            src: "/assets/images/Gallery/Photos/TeamWork/TeamWork1.jpg",
            alt: "TeamWork1"
          },
            {
                src: "/assets/images/Gallery/Photos/TeamWork/TeamWork2.jpg",
                alt: "TeamWork2"
            },
            {
                src: "/assets/images/Gallery/Photos/TeamWork/TeamWork3.jpg",
                alt: "TeamWork3"
            },
            {
                src: "/assets/images/Gallery/Photos/TeamWork/TeamWork4.jpg",
                alt: "TeamWork4"
            },
            {
                src: "/assets/images/Gallery/Photos/TeamWork/TeamWork5.jpg",
                alt: "TeamWork5"
            },
            {
                src: "/assets/images/Gallery/Photos/TeamWork/TeamWork6.jpg",
                alt: "TeamWork6"
            },
            {
                src: "/assets/images/Gallery/Photos/TeamWork/TeamWork7.jpg",
                alt: "TeamWork7"
            },
            {
                src: "/assets/images/Gallery/Photos/TeamWork/TeamWork8.jpg",
                alt: "TeamWork8"
            },
            {
                src: "/assets/images/Gallery/Photos/TeamWork/TeamWork9.jpg",
                alt: "TeamWork9"
            },


        ]} />

        <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.harvest-academy-moments")
        } photos={
            [
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy6.jpg",
              alt: "HarvestAcademy6"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy1.jpg",
              alt: "HarvestAcademy1"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy2.jpg",
              alt: "HarvestAcademy2"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy3.jpg",
              alt: "HarvestAcademy3"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy4.jpg",
              alt: "HarvestAcademy4"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy5.jpg",
              alt: "HarvestAcademy5"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy7.jpg",
              alt: "HarvestAcademy7"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy8.jpg",
              alt: "HarvestAcademy8"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy9.jpg",
              alt: "HarvestAcademy9"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy10.jpg",
              alt: "HarvestAcademy10"
            },
            {
              src: "/assets/images/Gallery/Photos/HarvestAcademy/HarvestAcademy11.jpg",
              alt: "HarvestAcademy11"
            },

            ]} />

        <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.best-fun-day-ever")
        } photos={
            [
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay10.jpg",
              alt: "FunDay10"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay1.jpg",
              alt: "FunDay1"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay2.jpg",
              alt: "FunDay2"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay3.jpg",
              alt: "FunDay3"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay4.jpg",
              alt: "FunDay4"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay5.jpg",
              alt: "FunDay5"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay6.jpg",
              alt: "FunDay6"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay7.jpg",
              alt: "FunDay7"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay8.jpg",
              alt: "FunDay8"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay9.jpg",
              alt: "FunDay9"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay11.jpg",
              alt: "FunDay11"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay12.jpg",
              alt: "FunDay12"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay13.jpg",
              alt: "FunDay13"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay14.jpg",
              alt: "FunDay14"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay15.jpg",
              alt: "FunDay15"
            },
            {
              src: "/assets/images/Gallery/Photos/FunDay/FunDay16.jpg",
                alt: "FunDay16"
            },
            {
                src: "/assets/images/Gallery/Photos/FunDay/FunDay17.jpg",
                alt: "FunDay17"
            },
            {
                src: "/assets/images/Gallery/Photos/FunDay/FunDay18.jpg",
                alt: "FunDay18"
            },
            {
                src: "/assets/images/Gallery/Photos/FunDay/FunDay19.jpg",
                alt: "FunDay19"
            },
            {
                src: "/assets/images/Gallery/Photos/FunDay/FunDay20.jpg",
                alt: "FunDay20"
            },
            ]} />

        <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.first-day")
        } photos={
            [
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay2.jpg",
              alt: "FirstDay2"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay1.jpg",
              alt: "FirstDay1"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay3.jpg",
              alt: "FirstDay3"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay4.jpg",
              alt: "FirstDay4"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay5.jpg",
              alt: "FirstDay5"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay6.jpg",
              alt: "FirstDay6"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay7.jpg",
              alt: "FirstDay7"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay8.jpg",
              alt: "FirstDay8"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay9.jpg",
              alt: "FirstDay9"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay10.jpg",
              alt: "FirstDay10"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay11.jpg",
              alt: "FirstDay11"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay12.jpg",
              alt: "FirstDay12"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay13.jpg",
              alt: "FirstDay13"
            },
            {
              src: "/assets/images/Gallery/Photos/FirstDay/FirstDay14.jpg",
              alt: "FirstDay14"
            },
            ]} />

        <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.science-fair-and-art-gallery-2018")
        } photos={
            [
          {
            src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery14.jpg",
            alt: "ScienceFairAndArtGallery14"
          },
          {
            src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery16.jpg",
            alt: "ScienceFairAndArtGallery16"
          },
          {
            src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery15.jpg",
            alt: "ScienceFairAndArtGallery15"
          },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery1.jpg",
              alt: "ScienceFairAndArtGallery1"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery2.jpg",
              alt: "ScienceFairAndArtGallery2"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery3.jpg",
              alt: "ScienceFairAndArtGallery3"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery4.jpg",
              alt: "ScienceFairAndArtGallery4"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery5.jpg",
              alt: "ScienceFairAndArtGallery5"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery6.jpg",
              alt: "ScienceFairAndArtGallery6"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery7.jpg",
              alt: "ScienceFairAndArtGallery7"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery8.jpg",
              alt: "ScienceFairAndArtGallery8"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery9.jpg",
              alt: "ScienceFairAndArtGallery9"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery10.jpg",
              alt: "ScienceFairAndArtGallery10"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery11.jpg",
              alt: "ScienceFairAndArtGallery11"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery12.jpg",
              alt: "ScienceFairAndArtGallery12"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery13.jpg",
              alt: "ScienceFairAndArtGallery13"
            },


            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery17.jpg",
              alt: "ScienceFairAndArtGallery17"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery18.jpg",
              alt: "ScienceFairAndArtGallery18"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery19.jpg",
              alt: "ScienceFairAndArtGallery19"
            },
            {
              src: "/assets/images/Gallery/Photos/ScienceFairAndArtGallery/ScienceFairAndArtGallery20.jpg",
              alt: "ScienceFairAndArtGallery20"
            },
            ]} />

        <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.harvest-schools-bazaar-2019")
        } photos={
            [
          {
            src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar16.jpg",
            alt: "SchoolsBazaar16"
          },
          {
            src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar1.jpg",
            alt: "SchoolsBazaar1"
          },
          {
            src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar2.jpg",
            alt: "SchoolsBazaar2"
          },
          {
            src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar3.jpg",
            alt: "SchoolsBazaar3"
          },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar4.jpg",
              alt: "SchoolsBazaar4"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar5.jpg",
              alt: "SchoolsBazaar5"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar6.jpg",
              alt: "SchoolsBazaar6"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar7.jpg",
              alt: "SchoolsBazaar7"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar8.jpg",
              alt: "SchoolsBazaar8"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar9.jpg",
              alt: "SchoolsBazaar9"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar10.jpg",
              alt: "SchoolsBazaar10"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar11.jpg",
              alt: "SchoolsBazaar11"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar12.jpg",
              alt: "SchoolsBazaar12"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar13.jpg",
              alt: "SchoolsBazaar13"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar14.jpg",
              alt: "SchoolsBazaar14"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar15.jpg",
              alt: "SchoolsBazaar15"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar16.jpg",
              alt: "SchoolsBazaar16"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar17.jpg",
              alt: "SchoolsBazaar17"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar18.jpg",
              alt: "SchoolsBazaar18"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar19.jpg",
              alt: "SchoolsBazaar19"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar20.jpg",
              alt: "SchoolsBazaar20"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar21.jpg",
              alt: "SchoolsBazaar21"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar22.jpg",
              alt: "SchoolsBazaar22"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar23.jpg",
              alt: "SchoolsBazaar23"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar24.jpg",
              alt: "SchoolsBazaar24"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar25.jpg",
              alt: "SchoolsBazaar25"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar26.jpg",
              alt: "SchoolsBazaar26"
            },
            {
              src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar27.jpg",
                alt: "SchoolsBazaar27"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar28.jpg",
                alt: "SchoolsBazaar28"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar29.jpg",
                alt: "SchoolsBazaar29"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar30.jpg",
                alt: "SchoolsBazaar30"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar31.jpg",
                alt: "SchoolsBazaar31"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar32.jpg",
                alt: "SchoolsBazaar32"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar33.jpg",
                alt: "SchoolsBazaar33"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar34.jpg",
                alt: "SchoolsBazaar34"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar35.jpg",
                alt: "SchoolsBazaar35"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar36.jpg",
                alt: "SchoolsBazaar36"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar37.jpg",
                alt: "SchoolsBazaar37"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar38.jpg",
                alt: "SchoolsBazaar38"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar39.jpg",
                alt: "SchoolsBazaar39"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar40.jpg",
                alt: "SchoolsBazaar40"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar41.jpg",
                alt: "SchoolsBazaar41"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar42.jpg",
                alt: "SchoolsBazaar42"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar43.jpg",
                alt: "SchoolsBazaar43"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar44.jpg",
                alt: "SchoolsBazaar44"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar45.jpg",
                alt: "SchoolsBazaar45"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar46.jpg",
                alt: "SchoolsBazaar46"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar47.jpg",
                alt: "SchoolsBazaar47"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar48.jpg",
                alt: "SchoolsBazaar48"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar49.jpg",
                alt: "SchoolsBazaar49"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar50.jpg",
                alt: "SchoolsBazaar50"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar51.jpg",
                alt: "SchoolsBazaar51"
            },
            {
                src: "/assets/images/Gallery/Photos/SchoolsBazaar/SchoolsBazaar52.jpg",
                alt: "SchoolsBazaar52"
            },
            ]} />

        <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.trip-to-farag-allah-factory-2019")
        } photos={
            [
          {
            src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip15.jpg",
            alt: "FaragAllahFactoryTrip15"
          },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip1.jpg",
              alt: "FaragAllahFactoryTrip1"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip2.jpg",
              alt: "FaragAllahFactoryTrip2"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip3.jpg",
              alt: "FaragAllahFactoryTrip3"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip4.jpg",
              alt: "FaragAllahFactoryTrip4"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip5.jpg",
              alt: "FaragAllahFactoryTrip5"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip6.jpg",
              alt: "FaragAllahFactoryTrip6"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip7.jpg",
              alt: "FaragAllahFactoryTrip7"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip8.jpg",
              alt: "FaragAllahFactoryTrip8"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip9.jpg",
              alt: "FaragAllahFactoryTrip9"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip10.jpg",
              alt: "FaragAllahFactoryTrip10"
            },
            {
              src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip11.jpg",
              alt: "FaragAllahFactoryTrip11"
            },
            {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip12.jpg",
                alt: "FaragAllahFactoryTrip12"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip13.jpg",
                alt: "FaragAllahFactoryTrip13"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip14.jpg",
                alt: "FaragAllahFactoryTrip14"
                },

                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip16.jpg",
                alt: "FaragAllahFactoryTrip16"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip17.jpg",
                alt: "FaragAllahFactoryTrip17"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip18.jpg",
                alt: "FaragAllahFactoryTrip18"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip19.jpg",
                alt: "FaragAllahFactoryTrip19"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip20.jpg",
                alt: "FaragAllahFactoryTrip20"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip21.jpg",
                alt: "FaragAllahFactoryTrip21"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip22.jpg",
                alt: "FaragAllahFactoryTrip22"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip23.jpg",
                alt: "FaragAllahFactoryTrip23"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip24.jpg",
                alt: "FaragAllahFactoryTrip24"
                },
                {
                src: "/assets/images/Gallery/Photos/FaragAllahFactoryTrip/FaragAllahFactoryTrip25.jpg",
                alt: "FaragAllahFactoryTrip25"
                },
            ]} />

        <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.trip-to-al-bawadi-factory-2019")
        } photos={
            [
          {
            src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip2.jpg",
            alt: "BawadiFactoryTrip2"
          },
          {
            src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip1.jpg",
            alt: "BawadiFactoryTrip1"
          },

          {
            src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip3.jpg",
            alt: "BawadiFactoryTrip3"
          },
          {
            src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip4.jpg",
            alt: "BawadiFactoryTrip4"
          },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip5.jpg",
              alt: "BawadiFactoryTrip5"
            },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip6.jpg",
              alt: "BawadiFactoryTrip6"
            },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip7.jpg",
              alt: "BawadiFactoryTrip7"
            },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip8.jpg",
              alt: "BawadiFactoryTrip8"
            },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip9.jpg",
              alt: "BawadiFactoryTrip9"
            },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip10.jpg",
              alt: "BawadiFactoryTrip10"
            },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip11.jpg",
              alt: "BawadiFactoryTrip11"
            },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip12.jpg",
              alt: "BawadiFactoryTrip12"
            },
            {
              src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip13.jpg",
                alt: "BawaiFactoryTrip13"
            },
            {
                src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip14.jpg",
                alt: "BawadiFactoryTrip14"
            },
            {
                src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip15.jpg",
                alt: "BawadiFactoryTrip15"
            },
            {
                src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip16.jpg",
                alt: "BawadiFactoryTrip16"
            },
            {
                src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip17.jpg",
                alt: "BawadiFactoryTrip17"
            },
            {
                src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip18.jpg",
                alt: "BawadiFactoryTrip18"
            },
            {
                src: "/assets/images/Gallery/Photos/BawadiFactoryTrip/BawadiFactoryTrip19.jpg",
                alt: "BawadiFactoryTrip19"
            },
            ]} />

        <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.trip-to-khan-khadija-resort-2019")
        } photos={
            [
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip1.jpg",
            alt: "KhanKhadijaResortTrip1"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip2.jpg",
            alt: "KhanKhadijaResortTrip2"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip3.jpg",
            alt: "KhanKhadijaResortTrip3"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip4.jpg",
            alt: "KhanKhadijaResortTrip4"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip5.jpg",
            alt: "KhanKhadijaResortTrip5"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip6.jpg",
            alt: "KhanKhadijaResortTrip6"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip7.jpg",
            alt: "KhanKhadijaResortTrip7"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip8.jpg",
            alt: "KhanKhadijaResortTrip8"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip9.jpg",
            alt: "KhanKhadijaResortTrip9"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip10.jpg",
            alt: "KhanKhadijaResortTrip10"
          },
          {
            src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip11.jpg",
            alt: "KhanKhadijaResortTrip11"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip12.jpg",
              alt: "KhanKhadijaResortTrip12"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip13.jpg",
              alt: "KhanKhadijaResortTrip13"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip14.jpg",
              alt: "KhanKhadijaResortTrip14"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip15.jpg",
              alt: "KhanKhadijaResortTrip15"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip16.jpg",
              alt: "KhanKhadijaResortTrip16"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip17.jpg",
              alt: "KhanKhadijaResortTrip17"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip18.jpg",
              alt: "KhanKhadijaResortTrip18"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip19.jpg",
              alt: "KhanKhadijaResortTrip19"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip20.jpg",
              alt: "KhanKhadijaResortTrip20"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip21.jpg",
              alt: "KhanKhadijaResortTrip21"
            },
            {
              src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip22.jpg",
                alt: "KhanKhadijaResortTrip22"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip23.jpg",
                alt: "KhanKhadijaResortTrip23"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip24.jpg",
                alt: "KhanKhadijaResortTrip24"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip25.jpg",
                alt: "KhanKhadijaResortTrip25"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip26.jpg",
                alt: "KhanKhadijaResortTrip26"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip27.jpg",
                alt: "KhanKhadijaResortTrip27"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip28.jpg",
                alt: "KhanKhadijaResortTrip28"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip29.jpg",
                alt: "KhanKhadijaResortTrip29"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip30.jpg",
                alt: "KhanKhadijaResortTrip30"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip31.jpg",
                alt: "KhanKhadijaResortTrip31"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip32.jpg",
                alt: "KhanKhadijaResortTrip32"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip33.jpg",
                alt: "KhanKhadijaResortTrip33"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip34.jpg",
                alt: "KhanKhadijaResortTrip34"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip35.jpg",
                alt: "KhanKhadijaResortTrip35"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip36.jpg",
                alt: "KhanKhadijaResortTrip36"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip37.jpg",
                alt: "KhanKhadijaResortTrip37"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip38.jpg",
                alt: "KhanKhadijaResortTrip38"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip39.jpg",
                alt: "KhanKhadijaResortTrip39"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip40.jpg",
                alt: "KhanKhadijaResortTrip40"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip41.jpg",
                alt: "KhanKhadijaResortTrip41"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip42.jpg",
                alt: "KhanKhadijaResortTrip42"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip43.jpg",
                alt: "KhanKhadijaResortTrip43"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip44.jpg",
                alt: "KhanKhadijaResortTrip44"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip45.jpg",
                alt: "KhanKhadijaResortTrip45"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip46.jpg",
                alt: "KhanKhadijaResortTrip46"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip47.jpg",
                alt: "KhanKhadijaResortTrip47"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip48.jpg",
                alt: "KhanKhadijaResortTrip48"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip49.jpg",
                alt: "KhanKhadijaResortTrip49"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip50.jpg",
                alt: "KhanKhadijaResortTrip50"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip51.jpg",
                alt: "KhanKhadijaResortTrip51"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip52.jpg",
                alt: "KhanKhadijaResortTrip52"
            },
            {
                src: "/assets/images/Gallery/Photos/KhanKhadijaResortTrip/KhanKhadijaResortTrip53.jpg",
                alt: "KhanKhadijaResortTrip53"
            },
            ]} />

        <div className={"narrow-sliders-grid"}>

          <PhotoCollage type={"slider"} title={
            t("gallery-pages.photo-gallery-page.techno-kids-competition-2019")
          } photos={
              [
            {
              src: "/assets/images/Gallery/Photos/TechnoKidsCompetition/TechnoKidsCompetition3.jpg",
              alt: "TechnoKidsCompetition3"
            },
            {
              src: "/assets/images/Gallery/Photos/TechnoKidsCompetition/TechnoKidsCompetition4.jpg",
              alt: "TechnoKidsCompetition4"
            },
            {
              src: "/assets/images/Gallery/Photos/TechnoKidsCompetition/TechnoKidsCompetition1.jpg",
              alt: "TechnoKidsCompetition1"
            },
            {
              src: "/assets/images/Gallery/Photos/TechnoKidsCompetition/TechnoKidsCompetition2.jpg",
              alt: "TechnoKidsCompetition2"
            },


            ]} />

          <PhotoCollage type={"slider"} title={
              t("gallery-pages.photo-gallery-page.art-competition-2019")
          } photos={
              [
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition1.jpg",
                  alt: "ArtCompetition1"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition2.jpg",
                  alt: "ArtCompetition2"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition3.jpg",
                  alt: "ArtCompetition3"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition4.jpg",
                  alt: "ArtCompetition4"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition5.jpg",
                  alt: "ArtCompetition5"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition6.jpg",
                  alt: "ArtCompetition6"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition7.jpg",
                  alt: "ArtCompetition7"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition8.jpg",
                  alt: "ArtCompetition8"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition9.jpg",
                  alt: "ArtCompetition9"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition10.jpg",
                  alt: "ArtCompetition10"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition11.jpg",
                  alt: "ArtCompetition11"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition12.jpg",
                  alt: "ArtCompetition12"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition13.jpg",
                  alt: "ArtCompetition13"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition14.jpg",
                  alt: "ArtCompetition14"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition15.jpg",
                  alt: "ArtCompetition15"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition16.jpg",
                  alt: "ArtCompetition16"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition17.jpg",
                  alt: "ArtCompetition17"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition18.jpg",
                  alt: "ArtCompetition18"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition19.jpg",
                  alt: "ArtCompetition19"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition20.jpg",
                  alt: "ArtCompetition20"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition21.jpg",
                  alt: "ArtCompetition21"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition22.jpg",
                  alt: "ArtCompetition22"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition23.jpg",
                  alt: "ArtCompetition23"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition24.jpg",
                  alt: "ArtCompetition24"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition25.jpg",
                  alt: "ArtCompetition25"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition26.jpg",
                  alt: "ArtCompetition26"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition27.jpg",
                  alt: "ArtCompetition27"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition28.jpg",
                  alt: "ArtCompetition28"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition29.jpg",
                  alt: "ArtCompetition29"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition30.jpg",
                  alt: "ArtCompetition30"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition31.jpg",
                  alt: "ArtCompetition31"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition32.jpg",
                  alt: "ArtCompetition32"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition33.jpg",
                  alt: "ArtCompetition33"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition34.jpg",
                  alt: "ArtCompetition34"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition35.jpg",
                  alt: "ArtCompetition35"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition36.jpg",
                  alt: "ArtCompetition36"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition37.jpg",
                  alt: "ArtCompetition37"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition38.jpg",
                  alt: "ArtCompetition38"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition39.jpg",
                  alt: "ArtCompetition39"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition40.jpg",
                  alt: "ArtCompetition40"
              },
              {
                  src: "/assets/images/Gallery/Photos/ArtCompetition/ArtCompetition41.jpg",
                  alt: "ArtCompetition41"
              },
              ]} />

          <PhotoCollage type={"slider"} title={
              t("gallery-pages.photo-gallery-page.kindergarten-welcome-party-2019")
          } photos={
              [
            {
              src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty15.jpg",
              alt: "KindergartenWelcomeParty15"
            },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty1.jpg",
                  alt: "KindergartenWelcomeParty1"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty2.jpg",
                  alt: "KindergartenWelcomeParty2"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty3.jpg",
                  alt: "KindergartenWelcomeParty3"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty4.jpg",
                  alt: "KindergartenWelcomeParty4"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty5.jpg",
                  alt: "KindergartenWelcomeParty5"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty6.jpg",
                  alt: "KindergartenWelcomeParty6"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty7.jpg",
                  alt: "KindergartenWelcomeParty7"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty8.jpg",
                  alt: "KindergartenWelcomeParty8"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty9.jpg",
                  alt: "KindergartenWelcomeParty9"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty10.jpg",
                  alt: "KindergartenWelcomeParty10"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty11.jpg",
                  alt: "KindergartenWelcomeParty11"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty12.jpg",
                  alt: "KindergartenWelcomeParty12"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty13.jpg",
                  alt: "KindergartenWelcomeParty13"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty14.jpg",
                  alt: "KindergartenWelcomeParty14"
              },

              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty16.jpg",
                  alt: "KindergartenWelcomeParty16"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty17.jpg",
                  alt: "KindergartenWelcomeParty17"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty18.jpg",
                  alt: "KindergartenWelcomeParty18"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty19.jpg",
                  alt: "KindergartenWelcomeParty19"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty20.jpg",
                  alt: "KindergartenWelcomeParty20"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty21.jpg",
                  alt: "KindergartenWelcomeParty21"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty22.jpg",
                  alt: "KindergartenWelcomeParty22"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty23.jpg",
                  alt: "KindergartenWelcomeParty23"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty24.jpg",
                  alt: "KindergartenWelcomeParty24"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty25.jpg",
                  alt: "KindergartenWelcomeParty25"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty26.jpg",
                  alt: "KindergartenWelcomeParty26"
              },
              {
                  src: "/assets/images/Gallery/Photos/KindergartenWelcomeParty/KindergartenWelcomeParty27.jpg",
                  alt: "KindergartenWelcomeParty27"
              },
              ]} />

        </div>
      </div>
    </div>
  );
}

export default Photos;