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

    return (
        <>

            {hasFailed && <p>{t('gallery-pages.unavailable')}</p>}

            {(gallery?.videos || []).map((video) => (
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
                                root: PUBLIC_GALLERY_MEDIA_ROOT,
                            }
                        ]
                    }
                />
            ))}
        </>
    )
}


export default GalleryVideoCards
