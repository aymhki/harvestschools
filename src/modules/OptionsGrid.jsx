import '../styles/OptionsGrid.css';
import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";
import {Fragment} from "react";
import {servePublicAsset} from "../services/General/GeneralServices.jsx";


function OptionsGrid({title, options, divElements, thisOptionsGridIsNotAloneInThePage, compact})
{
    const navigate = useNavigate();

    if (compact) {
        return (
            <div className="options-grid-container-compact">
                <h2>{title}</h2>

                {options.length > 0 ? (
                    <div className={"options-grid-quadruple"}>
                        {options.map((option, index) => (
                            <div key={index} className="options-grid-compact-items-container" onClick={() => {
                                if (option.externalLink) {
                                    window.open(option.link, '_blank')
                                } else {
                                    navigate(option.link)
                                }
                            }}>
                                <p> {option.title} </p>

                                <img src={servePublicAsset(option.image)} alt={option.title}/>
                            </div>
                        ))}
                    </div>
                    ) : (
                        <p>
                            No Options available.
                        </p>
                    )}

                {divElements && divElements.map((element, index) => (
                    <Fragment key={index}>
                        {element}
                    </Fragment>
                ))}

            </div>
        )
    } else {
        return (
            <div
                className={thisOptionsGridIsNotAloneInThePage ? "options-grid-container-dynamic" : "options-grid-container"}>
                <h1>{title}</h1>

                {options.length > 0 ? (
                    <div
                        className={options.length === 1 ? "options-grid-single" : options.length === 2 ? "options-grid-double" : options.length === 3 ? "options-grid-triple" : options.length === 4 ? "options-grid-quadruple" : "options-grid-double"}>
                        {options.map((option, index) => (
                            <div key={index} className="options-grid-items-container" onClick={() => {
                                if (option.externalLink) {
                                    window.open(option.link, '_blank')
                                } else {
                                    navigate(option.link)
                                }

                            }}>

                                {<h3>{option.title}</h3>}
                                <img src={servePublicAsset(option.image)} alt={option.title}/>
                                {<p>{option.description}</p>}

                                <button
                                    onClick={() => {
                                        if (option.externalLink) {
                                            window.open(option.link, '_blank')
                                        } else {
                                            navigate(option.link)
                                        }
                                    }}
                                >
                                    {option.buttonText}
                                </button>

                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        No Options available.
                    </p>
                )
                }

                {divElements && divElements.map((element, index) => (
                    <Fragment key={index}>
                        {element}
                    </Fragment>
                ))}
            </div>
        );
    }
}

OptionsGrid.propTypes = {
    title: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            image: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
            buttonText: PropTypes.string.isRequired,
            externalLink: PropTypes.bool
        })
    ).isRequired,
    divElements: PropTypes.array,
    thisOptionsGridIsNotAloneInThePage: PropTypes.bool,
    compact: PropTypes.bool
};

export default OptionsGrid;