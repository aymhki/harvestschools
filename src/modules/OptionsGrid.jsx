import '../styles/OptionsGrid.css';
import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";
import {Fragment} from "react";


function OptionsGrid({title, titleInArabic, options, divElements})
{
    const navigate = useNavigate();

    return (
        <div className="options-grid-container">
            {titleInArabic ? (<h1 lang="ar" className={"options-grid-title"}>{title}</h1>) : (<h1>{title}</h1>)}

            {options.length > 0 ? (
                    <div className={  options.length === 1 ? "options-grid-single" : options.length === 2 ? "options-grid-double" : options.length === 3 ? "options-grid-triple" : options.length === 4 ? "options-grid-quadruple" : "options-grid-double" }>
                        {options.map((option, index) => (
                            <div key={index} className="options-grid-items-container" onClick={() => {
                                if (option.externalLink) {
                                    window.open(option.link, '_blank')
                                } else {
                                    navigate(option.link)
                                }

                            }}>

                                {option.titleInArabic ? (<h2 lang="ar">{option.title}</h2>) : (<h2>{option.title}</h2>)}
                                    <img src={option.image} alt={option.title}/>
                                {option.descriptionInArabic ? (<p lang="ar">{option.description}</p>) : (<p>{option.description}</p>)}

                                {(titleInArabic && option.titleInArabic && option.descriptionInArabic) ? (
                                    <button onClick={() => {
                                        if (option.externalLink) {
                                            window.open(option.link, '_blank')
                                        } else {
                                            navigate(option.link)
                                        }

                                    }} lang={"ar"}>{option.buttonText}</button>
                                    ) : (
                                    <button onClick={() => {

                                        if (option.externalLink) {
                                            window.open(option.link, '_blank')
                                        } else {
                                            navigate(option.link)
                                        }

                                    }}>{option.buttonText}</button>
                                )}

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

OptionsGrid.propTypes = {
    title: PropTypes.string.isRequired,
    titleInArabic: PropTypes.bool,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            image: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
            buttonText: PropTypes.string.isRequired,
            titleInArabic: PropTypes.bool,
            descriptionInArabic: PropTypes.bool,
            externalLink: PropTypes.bool
        })
    ).isRequired,
    divElements: PropTypes.array,
};

export default OptionsGrid;