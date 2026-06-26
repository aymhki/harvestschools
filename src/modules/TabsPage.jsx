import PropTypes from "prop-types";
import {useState} from "react";
import '../styles/TabsPage.css';

function TabsPage({tabData, initialTab }) {
    const [activeTab, setActiveTab] = useState(initialTab || tabData[0].id);
    const currentIndex = tabData.findIndex((tab) => tab.id === activeTab);

    const handlePrevTab = () => {
        const prevIndex = currentIndex === 0 ? tabData.length - 1 : currentIndex - 1;
        setActiveTab(tabData[prevIndex].id);
    };

    const handleNextTab = () => {
        const nextIndex = currentIndex === tabData.length - 1 ? 0 : currentIndex + 1;
        setActiveTab(tabData[nextIndex].id);
    };

    return (
        <div className="tabs-container">
            <div className="tabs-bar-wrapper">
                <button
                    className="mobile-nav-arrow left-arrow"
                    onClick={handlePrevTab}
                    aria-label="Previous tab"
                >
                    &#10094;
                </button>

                <div className="tabs-bar" role="tablist">
                    {tabData.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    className="mobile-nav-arrow right-arrow"
                    onClick={handleNextTab}
                    aria-label="Next tab"
                >
                    &#10095;
                </button>
            </div>

            <div className="tab-panel" role="tabpanel">
                {tabData.map((tab) => {
                    const ActiveTabComponent = tab.component;
                    return (
                        <div
                            key={tab.id}
                            className={`tab-content ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {ActiveTabComponent && <ActiveTabComponent />}
                        </div>
                    );
                })
                }
            </div>
        </div>
    );
}

TabsPage.propTypes = {
    tabData: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            label: PropTypes.string.isRequired,
            component: PropTypes.elementType.isRequired,
        })
    ).isRequired,
    initialTab: PropTypes.number.isRequired,
}

export default TabsPage;