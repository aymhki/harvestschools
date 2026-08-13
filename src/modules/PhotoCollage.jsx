import { useEffect, useRef, useState } from 'react';
import '../styles/PhotoCollage.css';
import PropTypes from "prop-types";
import { useSpring, animated } from 'react-spring';
import {servePublicAsset} from "../services/General/GeneralServices.jsx";

const DEFAULT_THUMBNAIL_SECONDS = 0.1;

const PhotoCollage = ({ type, photos, title, collagePreview }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [failedThumbnails, setFailedThumbnails] = useState({});
    const lightboxVideoRef = useRef(null);

    const openLightBox = (index) => {
        setCurrentIndex(index);
        setIsOpen(true);
    };

    const closeLightBox = () => {

        if (lightboxVideoRef.current) {
            lightboxVideoRef.current.pause();
        }

        setIsOpen(false);
    };

    const changePhoto = (newIndex) => {
        setIsTransitioning(true);
        setCurrentIndex(newIndex);
    };

    const nextPhoto = () => {
        changePhoto((currentIndex + 1) % photos.length);
    };

    const prevPhoto = () => {
        changePhoto((currentIndex - 1 + photos.length) % photos.length);
    };

    const handleImageLoad = () => {
        setIsTransitioning(false);
    }

    const thumbnailSeconds = (item) => (
        Number.isFinite(item.thumbnailAt) ? item.thumbnailAt : DEFAULT_THUMBNAIL_SECONDS
    );

    const mediaSource = (item, options = {}) => servePublicAsset(item.src, { ...options, root: item.root });
    const thumbnailSource = (item) => mediaSource(item, { thumbnailAt: thumbnailSeconds(item) });

    const markThumbnailFailed = (source) => {
        setFailedThumbnails((current) => (current[source] ? current : { ...current, [source]: true }));
    };

    const renderVideoPreview = (item, index, mediaClassName, wrapperClassName) => (
        <div
            className={`video-preview ${wrapperClassName}`}
            role="button"
            tabIndex={0}
            aria-label={item.alt}
            onClick={() => openLightBox(index)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightBox(index);
                }
            }}
        >
            {failedThumbnails[item.src] ? (
                <video
                    src={`${mediaSource(item)}#t=${thumbnailSeconds(item)}`}
                    className={`${mediaClassName} video-preview-media`}
                    preload="metadata"
                    muted
                    playsInline
                />
            ) : (
                <img
                    src={thumbnailSource(item)}
                    alt={item.alt}
                    className={`${mediaClassName} video-preview-media`}
                    loading="lazy"
                    decoding="async"
                    onError={() => markThumbnailFailed(item.src)}
                />
            )}

            <span className="video-preview-play" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M9.5 6.2v11.6L19 12z" />
                </svg>
            </span>
        </div>
    );

    const renderSlider = () => {
        let maxIndex = 0;

        return (
            <div className="photo-slider">
                {photos && (
                    (photos[maxIndex].isVideo) ? (
                        renderVideoPreview(photos[maxIndex], maxIndex, 'photo-slider-main-photo', 'video-preview-slider')
                    ) : (
                        <img src={mediaSource(photos[maxIndex])} alt={photos[maxIndex].alt} className="photo-slider-main-photo" onClick={() => openLightBox(maxIndex)} />
                    )
                )}
                {title && <h2>{title}</h2>}
            </div>
        );
    };

    const renderCollage = () => (
        <div className="photo-collage">
            {collagePreview && (
                (collagePreview.isVideo) ? (
                    renderVideoPreview(collagePreview, 0, 'collage-preview-photo', 'video-preview-collage')
                    ) : (
                    <img src={mediaSource(collagePreview)} alt={collagePreview.alt} className="collage-preview-photo" onClick={() => openLightBox(0)} />
                )
            )}
        </div>
    );

    const handLightBoxClick = (e) => {
        if (e.target.classList.contains('lightbox')) {
            closeLightBox();
        }
    }

    useEffect(() => {
        if (!isOpen || !lightboxVideoRef.current) {
            return;
        }

        const playback = lightboxVideoRef.current.play();

        if (playback && typeof playback.catch === 'function') {
            playback.catch(() => null);
        }
    }, [isOpen, currentIndex]);


    return (
        <div className="photos-preview">
            {type === 'slider' ? renderSlider() : renderCollage()}

                <animated.div className="lightbox" onClick={handLightBoxClick}
                style={
                    useSpring({
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? 'translateY(0%)' : 'translateY(-100%)'
                    })
                }>

                    {photos.length > 0 && (photos[currentIndex].isVideo ? (
                        <video
                            key={photos[currentIndex].src}
                            ref={lightboxVideoRef}
                            src={mediaSource(photos[currentIndex])}
                            poster={failedThumbnails[photos[currentIndex].src] ? undefined : thumbnailSource(photos[currentIndex])}
                            className={`lightbox-photo ${isTransitioning ? 'hidden' : ''}`}
                            preload="none"
                            playsInline
                            controls
                            />
                        ) : (

                        <img
                            src={mediaSource(photos[currentIndex])}
                            alt={photos[currentIndex].alt}
                            className={`lightbox-photo ${isTransitioning ? 'hidden' : ''}`}
                            onLoad={handleImageLoad}
                        />

                    ))}


                    <div onClick={closeLightBox} className="close-lightbox" role="button" aria-label="Close">
                        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                            <path d="M6 6 L18 18 M18 6 L6 18" />
                        </svg>
                    </div>

                    { photos.length > 1 && (
                        <>
                            <div onClick={prevPhoto} className="prev-photo">&#10094;</div>
                            <div onClick={nextPhoto} className="next-photo">&#10095;</div>
                        </>
                    )}




                    {photos.length > 1 && (
                        <div className="photo-index"><p>{currentIndex + 1} / {photos.length}</p></div>
                    )}
                </animated.div>

        </div>
    );
};

const mediaShape = PropTypes.shape({
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    isVideo: PropTypes.bool,
    thumbnailAt: PropTypes.number,
    root: PropTypes.string
});

PhotoCollage.propTypes = {
    type: PropTypes.oneOf(['slider', 'collage']).isRequired,
    photos: PropTypes.arrayOf(mediaShape).isRequired,
    title: PropTypes.string,
    collagePreview: mediaShape
};

export default PhotoCollage;
