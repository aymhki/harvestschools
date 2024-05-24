import {useNavigate} from "react-router-dom";
import "../styles/FullPageOptionsSelector.css";
import PropTypes from "prop-types";

function FullPageOptionsSelector({options}) {
    const navigate = useNavigate();
    const doubleLeftRightOptions = ["double-in-full-page-selector-left-option-in-full-page-selector", "double-in-full-page-selector-right-option-in-full-page-selector"];
    const quadrupleLeftRightOptions = ["quadruple-full-page-selector-left-option-in-full-page-selector", "quadruple-full-page-selector-right-option-in-full-page-selector"];
    return (
        <div className={options.length === 2 ? "double-in-full-page-selector" : "quadruple-full-page-selector"}>

            {options.map((option, index) => (

                <div key={index} className={
                    options.length === 2 ? doubleLeftRightOptions[index % doubleLeftRightOptions.length] : quadrupleLeftRightOptions[index % quadrupleLeftRightOptions.length]
                }
                     onClick={() => option.isAssetLink ? window.open(option.link, "_blank") : navigate(option.link)}>
                    {option.inArabic ? (<h1 lang="ar">{option.text}</h1>) : (<h1>{option.text}</h1>)}
                </div>

            ))}

        </div>
    );
}

FullPageOptionsSelector.propTypes = {
    options: PropTypes.array.isRequired
}


export default FullPageOptionsSelector;