import '../styles/Loader.css'

function Spinner() {
    return (
        <div className="spinner-container">
            <div className="loader">
                <svg viewBox="0 0 100 100">
                    <circle className="loader-track" cx="50" cy="50" r="42"></circle>
                    <circle className="loader-line" cx="50" cy="50" r="42" pathLength="100"></circle>
                </svg>
            </div>
        </div>
    );
}

export default Spinner;