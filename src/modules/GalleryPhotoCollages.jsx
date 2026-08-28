import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import PhotoCollage from './PhotoCollage.jsx'
import {PUBLIC_GALLERY_MEDIA_ROOT, fetchGallerySection} from '../services/Public/Gallery/PublicGalleryServices.jsx'
import {usePreloadedData} from '../services/General/PrerenderDataContext.jsx'
import { useLoading } from '../services/General/GlobalLoadingService.jsx'

function GalleryPhotoCollages() {
    const {t, i18n} = useTranslation(['gallery-pages'])

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const preloaded = usePreloadedData(`gallery:photos:${language}`)

    const [gallery, setGallery] = useState(preloaded)
    const [, setIsLoading] = useLoading(!preloaded)
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

    const groups = []

    collages.forEach((collage) => {
        const isNarrow = collage.layout === 'narrow'
        const lastGroup = groups[groups.length - 1]

        if (isNarrow && lastGroup && lastGroup.isNarrow) {
            lastGroup.collages.push(collage)
            return
        }

        groups.push({isNarrow, collages: [collage]})
    })

    return (
        <>

            {hasFailed && <p>{t('gallery-pages.unavailable')}</p>}

            {groups.map((group, index) => (
                group.isNarrow ? (
                    <div key={`narrow-${index}`} className={'narrow-sliders-grid'}>
                        {group.collages.map(renderCollage)}
                    </div>
                ) : group.collages.map(renderCollage)
            ))}
        </>
    )
}


export default GalleryPhotoCollages
