import '../../styles/Gallery.css'
import PhotoCollage from "../../modules/PhotoCollage.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

const GALLERY_VIDEOS = [
    { titleKey: 'harvest-schools-bazaar-2019', file: 'Harvest Schools Bazzar 2019.mp4', thumbnailAt: 40 },
    { titleKey: 'stem-projects', file: 'STEM learning.mp4', thumbnailAt: 25 },
    { titleKey: 'graduation-party-2019', file: 'Graduation Party 2019.mp4', thumbnailAt: 30 },
    { titleKey: 'no-bullying-interview', file: 'No Bullying Interview.mp4', thumbnailAt: 120 },
    { titleKey: 'students-union-meet-up', file: 'Students Union Meet Up Demo.mp4', thumbnailAt: 25 },
    { titleKey: 'harvest-academy-moments', file: 'Harvest Academy Announcement.mp4', thumbnailAt: 120 },
    { titleKey: 'the-unhealthy-habits-taqadam-video', file: 'Taqdam The Unhealthy Habits Video.mp4', thumbnailAt: 170 },
];

function Videos() {
    const {t} = useTranslation(['gallery-pages']);

  return (
    <div className={'gallery-videos-page'}>
        <Helmet>
            <title>Harvest International School | Gallery | Videos</title>
            <meta name="description" content="Take a look at memories, demos, tours, and more videos and photos of Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Gallery, Photos, Videos, 360 Tour, Memories, Demos, Tours, معرض, صور, فيديوهات, جولة 360, ذكريات, عروض, جولات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className={'extreme-padding-container  make-this-container-have-gaps'}>
            <h1>
                {t("gallery-pages.video-gallery-page.title")}
            </h1>

            {GALLERY_VIDEOS.map((video) => {
                const videoTitle = t(`gallery-pages.video-gallery-page.${video.titleKey}`);

                return (
                    <PhotoCollage
                        key={video.titleKey}
                        type={'slider'}
                        title={videoTitle}
                        photos={
                            [
                                {
                                    src: `/videos/Gallery/${video.file}`,
                                    alt: videoTitle,
                                    isVideo: true,
                                    thumbnailAt: video.thumbnailAt,
                                }
                            ]
                        }
                    />
                );
            })}

        </div>
    </div>
  );
}

export default Videos;
