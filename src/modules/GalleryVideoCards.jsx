import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import PhotoCollage from './PhotoCollage.jsx'
import Spinner from './Spinner.jsx'
import {PUBLIC_GALLERY_MEDIA_ROOT, fetchGallerySection} from '../services/Public/Gallery/PublicGalleryServices.jsx'

function GalleryVideoCards() {
    const {t, i18n} = useTranslation(['gallery-pages'])
    const [gallery, setGallery] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasFailed, setHasFailed] = useState(false)

    const language = i18n.language === 'ar' ? 'ar' : 'en'

    useEffect(() => {
        let isActive = true

        setIsLoading(true)
        setHasFailed(false)

        fetchGallerySection('videos', language)
            .then((data) => {
                if (!isActive) {
                    return
                }

                setGallery(data)
                setHasFailed(data === null)
            })
            .catch(() => {
                if (isActive) {
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
    }, [language])

    return (
        <>
            {isLoading && <Spinner/>}

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
