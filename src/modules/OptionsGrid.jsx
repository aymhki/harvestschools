import '../styles/OptionsGrid.css';
import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";


function OptionsGrid({title, options})
{
    const navigate = useNavigate();

    return (
        <div className="options-grid-container">
            <h1>{title}</h1>

            <div className={  options.length === 1 ? "options-grid-single" : options.length % 2 === 0 ? "options-grid-double" : "options-grid-triple" }>
                {options.map((option, index) => (
                    <div key={index} className="options-grid-items-container">
                            <h2>{option.title}</h2>
                            <img src={option.image} alt={option.title}/>
                            <p>{option.description}</p>
                            <button onClick={() => navigate(option.link)}>{option.buttonText}</button>
                    </div>
                ))}

            </div>

        </div>
    );
}

OptionsGrid.propTypes = {
    title: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            image: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
            buttonText: PropTypes.string.isRequired
        })
    ).isRequired
};

export default OptionsGrid;