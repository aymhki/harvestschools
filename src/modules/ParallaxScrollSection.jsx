import '../styles/ParallaxScrollSection.css';
import {useNavigate} from "react-router-dom";
import PropTypes from 'prop-types';
import {Fragment} from "react";
import {useEffect, useState} from "react";

const generateSrcSet = (url) => {
    if (!url) return '';
    const lastDotIndex = url.lastIndexOf('.');
    if (lastDotIndex === -1) return url;

    const basePath = url.substring(0, lastDotIndex);
    const ext = url.substring(lastDotIndex);

    return `${basePath}-560${ext} 560w, ${basePath}-1000${ext} 1000w, ${url} 2000w`;
};

// Helper for CSS background images using image-set
const generateImageSet = (url) => {
    if (!url) return 'none';
    const lastDotIndex = url.lastIndexOf('.');
    if (lastDotIndex === -1) return `url(${url})`;

    const basePath = url.substring(0, lastDotIndex);
    const ext = url.substring(lastDotIndex);

    // Uses the 560px version for 1x (standard mobile screens) and original for 2x (retina/desktop)
    return `image-set(url("${basePath}-560${ext}") 1x, url("${url}") 2x)`;
};

function ParallaxScrollSection({ title, text, backgroundImage, darken, buttonText, buttonLink, image, imageAlt, divElements, noParallax }) {
    const navigate = useNavigate();
    const [isSafari, setIsSafari] = useState(false);



    const style = {
        backgroundImage: generateImageSet(backgroundImage)
    };

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        setIsSafari(userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1);
    }, []);

    return (
        <div className={`parallax-section + ${(noParallax || isSafari) ? 'no-parallax' : ''}`}
             style={style}>
            {darken && <div className="darken"></div>}
            <div className="content">
                {image && imageAlt && (
                    <img
                        srcSet={generateSrcSet(image)}
                        sizes="(max-width: 600px) 560px, (max-width: 1200px) 1000px, 100vw"
                        src={image}
                        alt={imageAlt}
                        className="parallax-section-image"
                    />
                )}
                {title && <h1>{title}</h1>}

                {
                    divElements && divElements.map((element, index) => (
                        <Fragment key={index}>
                            {element}
                        </Fragment>
                    ))
                }

                {text && <p>{text}</p>}
                {buttonText && buttonLink && (
                    <button className="parallax-button" onClick={() => navigate(buttonLink)}>
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
}

ParallaxScrollSection.propTypes = {
    title: PropTypes.string,
    text: PropTypes.string,
    backgroundImage: PropTypes.string.isRequired,
    darken: PropTypes.bool,
    buttonText: PropTypes.string,
    buttonLink: PropTypes.string,
    image: PropTypes.string,
    imageAlt: PropTypes.string,
    divElements: PropTypes.array,
    noParallax: PropTypes.bool
};


export default ParallaxScrollSection;
