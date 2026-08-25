import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import PhotoCollage from './PhotoCollage.jsx'
import {PUBLIC_GALLERY_MEDIA_ROOT, fetchGallerySection} from '../services/Public/Gallery/PublicGalleryServices.jsx'
import {usePreloadedData} from '../services/General/PrerenderDataContext.jsx'
import { useLoading } from '../services/General/GlobalLoadingService.jsx'

function GalleryVideoCards() {
    const {t, i18n} = useTranslation(['gallery-pages'])

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const preloaded = usePreloadedData(`gallery:videos:${language}`)

    const [gallery, setGallery] = useState(preloaded)
    const [, setIsLoading] = useLoading(!preloaded)
    const [hasFailed, setHasFailed] = useState(false)

    useEffect(() => {
        let isActive = true

        if (!preloaded) {
            setIsLoading(true)
            setHasFailed(false)
        }

        fetchGallerySection('videos', language)
            .then((data) => {
                if (!isActive) {
                    return
                }

                if (data) {
                    setGallery(data)
                    setHasFailed(false)
                } else if (!preloaded) {
                    setGallery(null)
                    setHasFailed(true)
                }
            })
            .catch(() => {
                if (isActive && !preloaded) {
                    setGallery(null)
                    setHasFailed(true)
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [language, preloaded])

    const videos = gallery?.videos || []

    const renderVideo = (video) => (
        <PhotoCollage
            key={video.id}
            type={'slider'}
            title={video.title}
            photos={
                [
                    {
                        src: video.path,
                        alt: video.title,
                        isVideo: true,
                        thumbnailAt: video.thumbnailAt,
                        durationSeconds: video.durationSeconds,
                        root: PUBLIC_GALLERY_MEDIA_ROOT,
                    }
                ]
            }
        />
    )

    const groups = []

    videos.forEach((video) => {
        const isNarrow = video.layout === 'narrow'
        const lastGroup = groups[groups.length - 1]

        if (isNarrow && lastGroup && lastGroup.isNarrow) {
            lastGroup.videos.push(video)
            return
        }

        groups.push({isNarrow, videos: [video]})
    })

    return (
        <>

            {hasFailed && <p>{t('gallery-pages.unavailable')}</p>}

            {groups.map((group, index) => (
                group.isNarrow ? (
                    <div key={`narrow-${index}`} className={'narrow-sliders-grid'}>
                        {group.videos.map(renderVideo)}
                    </div>
                ) : group.videos.map(renderVideo)
            ))}
        </>
    )
}


export default GalleryVideoCards
