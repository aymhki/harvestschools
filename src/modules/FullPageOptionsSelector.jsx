import {useNavigate} from "react-router-dom";
import "../styles/FullPageOptionsSelector.css";
import PropTypes from "prop-types";

function FullPageOptionsSelector({left, right}) {
    const navigate = useNavigate();

    return (
        <div className="full-page-selector">

            <div className="left-option-in-full-page-selector" onClick={() => navigate(left.link)}>
                <h1 lang={left.inArabic ? "ar" : "en"}>{left.text}</h1>
            </div>

            <div className="right-option-in-full-page-selector" onClick={() => navigate(right.link)}>
                <h1 lang={right.inArabic ? "ar" : "en"}>{right.text}</h1>
            </div>

        </div>
    );
}

FullPageOptionsSelector.propTypes = {
    left: PropTypes.object.isRequired,
    right: PropTypes.object.isRequired
}


export default FullPageOptionsSelector;