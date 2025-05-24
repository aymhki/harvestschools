import { useState } from 'react';
import '../styles/PhotoCollage.css';
import PropTypes from "prop-types";
import { useSpring, animated } from 'react-spring';

const PhotoCollage = ({ type, photos, title, collagePreview }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const openLightBox = (index) => {
        setCurrentIndex(index);
        setIsOpen(true);
        document.body.classList.toggle('lock-scroll', true);
    };

    const closeLightBox = () => {
        
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
        });
        
        setIsOpen(false);
        document.body.classList.toggle('lock-scroll', false);
    };

    const changePhoto = (newIndex) => {
        setIsTransitioning(true);
        setCurrentIndex(newIndex);
        // setTimeout(() => {
        //
        //     setIsTransitioning(false);
        // }, 500); // Match this duration with the CSS transition duration
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


    const renderSlider = () => {
        // let photosWidth = photos.map(photo => {
        //     let img = new Image();
        //     img.src = photo.src;
        //     return img.width;
        // });

        let maxIndex = 0; //photosWidth.indexOf(Math.max(...photosWidth));

        return (
            <div className="photo-slider">
                {photos && (
                    (photos[maxIndex].isVideo) ? (
                        <video src={photos[maxIndex].src} alt={photos[maxIndex].alt}  onClick={() => openLightBox(maxIndex)}
                        className={'video-slider-preview'}
                        />
                    ) : (
                        <img src={photos[maxIndex].src} alt={photos[maxIndex].alt} className="photo-slider-main-photo" onClick={() => openLightBox(maxIndex)} />
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
                    <video src={collagePreview.src} alt={collagePreview.alt} className="collage-preview-photo" onClick={() => openLightBox(0)} controls />
                    ) : (
                    <img src={collagePreview.src} alt={collagePreview.alt} className="collage-preview-photo" onClick={() => openLightBox(0)} />
                )
            )}
        </div>
    );

    const handLightBoxClick = (e) => {
        if (e.target.classList.contains('lightbox')) {
            closeLightBox();
        }
    }



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
                    
                    {photos[currentIndex].isVideo ? (
                        <video
                            src={photos[currentIndex].src}
                            alt={photos[currentIndex].alt}
                            className={`lightbox-photo ${isTransitioning ? 'hidden' : ''}`}
                            controls
                            autoPlay
                            
                            />
                        ) : (
                    
                        <img
                            src={photos[currentIndex].src}
                            alt={photos[currentIndex].alt}
                            className={`lightbox-photo ${isTransitioning ? 'hidden' : ''}`}
                            onLoad={handleImageLoad}
                        />
                        
                    )}
                    
                    
                    <div onClick={closeLightBox} className="close-lightbox">&#10007;</div>
                    
                    { photos.length > 1 && (
                        <>
                            <div onClick={prevPhoto} className="prev-photo">&#10094;</div>
                            <div onClick={nextPhoto} className="next-photo">&#10095;</div>
                        </>
                    )}
                    

                    
                    
                    <div className="photo-index"><p>{currentIndex + 1} / {photos.length}</p></div>
                </animated.div>

        </div>
    );
};

PhotoCollage.propTypes = {
    type: PropTypes.oneOf(['slider', 'collage']).isRequired,
    photos: PropTypes.arrayOf(PropTypes.shape({
        src: PropTypes.string.isRequired,
        alt: PropTypes.string.isRequired,
        isVideo: PropTypes.bool
    })).isRequired,
    title: PropTypes.string,
    collagePreview: PropTypes.shape({
        src: PropTypes.string.isRequired,
        alt: PropTypes.string.isRequired,
        isVideo: PropTypes.bool
    })
};

export default PhotoCollage;
