import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import PhotoCollage from './PhotoCollage.jsx'
import Spinner from './Spinner.jsx'
import {PUBLIC_GALLERY_MEDIA_ROOT, fetchGallerySection} from '../services/Public/Gallery/PublicGalleryServices.jsx'
import {usePreloadedData} from '../services/General/PrerenderDataContext.jsx'

function GalleryPhotoCollages() {
    const {t, i18n} = useTranslation(['gallery-pages'])

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const preloaded = usePreloadedData(`gallery:photos:${language}`)

    const [gallery, setGallery] = useState(preloaded)
    const [isLoading, setIsLoading] = useState(!preloaded)
    const [hasFailed, setHasFailed] = useState(false)

    useEffect(() => {
        let isActive = true

        if (!preloaded) {
            setIsLoading(true)
            setHasFailed(false)
        }

        fetchGallerySection('photos', language)
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

    const collages = gallery?.collages || []

    const renderCollage = (collage) => (
        <PhotoCollage
            key={collage.id}
            type={'slider'}
            title={collage.title}
            photos={collage.photos.map((photo) => ({
                src: photo.path,
                alt: photo.alt,
                root: PUBLIC_GALLERY_MEDIA_ROOT,
            }))}
        />
    )

    const wideCollages = collages.filter((collage) => collage.layout !== 'narrow')
    const narrowCollages = collages.filter((collage) => collage.layout === 'narrow')

    return (
        <>
            {isLoading && <Spinner/>}

            {hasFailed && <p>{t('gallery-pages.unavailable')}</p>}

            {wideCollages.map(renderCollage)}

            {narrowCollages.length > 0 && (
                <div className={'narrow-sliders-grid'}>
                    {narrowCollages.map(renderCollage)}
                </div>
            )}
        </>
    )
}


export default GalleryPhotoCollages
