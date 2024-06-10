import '../styles/ParallaxScrollSection.css';
import {useNavigate} from "react-router-dom";
import PropTypes from 'prop-types';
import {Fragment} from "react";
import {useEffect, useState} from "react";

function ParallaxScrollSection({ title, text, backgroundImage, darken, buttonText, buttonLink, image, imageAlt, divElements, noParallax }) {
    const navigate = useNavigate();
    const [isSafari, setIsSafari] = useState(false);



    const style = {
        backgroundImage: `url(${backgroundImage})`
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
                {image && imageAlt && (<img src={image} alt={imageAlt} className="parallax-section-image"/>)}
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
