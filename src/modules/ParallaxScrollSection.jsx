import '../styles/ParallaxScrollSection.css';
import {useNavigate} from "react-router-dom";
import PropTypes from 'prop-types';

function ParallaxScrollSection({ title, text, image, darken, buttonText, buttonLink }) {
    const navigate = useNavigate();


    const style = {
        backgroundImage: `url(${image})`
    };

    return (
        <div className="parallax-section" style={style}>
            {darken && <div className="darken"></div>}
            <div className="content">
                {title && <h1>{title}</h1>}
                {text && <p>{text}</p> }
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
    image: PropTypes.string.isRequired,
    darken: PropTypes.bool,
    buttonText: PropTypes.string,
    buttonLink: PropTypes.string
};


export default ParallaxScrollSection;
