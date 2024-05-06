import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/PhotoSlider.css';

function PhotoSlider({ photos, darken }) {
    const [current, setCurrent] = useState(0);
    const [exiting, setExiting] = useState(null);
    const length = photos.length;

    const nextSlide = () => {
        setExiting(current);
        setCurrent(current === length - 1 ? 0 : current + 1);
    };

    const prevSlide = () => {
        setExiting(current);
        setCurrent(current === 0 ? length - 1 : current - 1);
    };

    useEffect(() => {
        if (exiting !== null) {
            const timer = setTimeout(() => {
                setExiting(null);
            }, 1000); // Match animation duration in css
            return () => clearTimeout(timer);
        }
    }, [exiting]);

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 10000); // Change slide every 30 seconds
        return () => clearInterval(timer);
    }, [current]);

    return (
        <div className="slider">
            <span className="left-arrow" onClick={prevSlide}>&#10094;</span>
            <span className="right-arrow" onClick={nextSlide}>&#10095;</span>
            {photos.map((photo, index) => (
                <div
                    className={`slide ${index === current ? 'active' : index === exiting ? 'exiting' : ''}`}
                    key={photo.id}
                >
                    <img
                        src={photo.url}
                        alt={photo.text}
                        className={darken ? 'slider-photo-dark' : 'slider-photo'}
                    />
                    <div className="photo-text">
                        <h1>{photo.title}</h1>
                        <p className="slider-caption">{photo.text}</p>
                    </div>
                </div>
            ))}
            <div className="dots">
                {photos.map((_, index) => (
                    <span
                        key={index}
                        className={`dot ${index === current ? 'active' : ''}`}
                        onClick={() => setCurrent(index)}
                    />
                ))}
            </div>
        </div>
    );
}

PhotoSlider.propTypes = {
    photos: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            url: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            text: PropTypes.string.isRequired,
        })
    ).isRequired,
    darken: PropTypes.bool.isRequired,
};

export default PhotoSlider;
