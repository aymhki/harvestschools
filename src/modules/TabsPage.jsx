import PropTypes from "prop-types";
import {Fragment, useEffect, useRef, useState} from "react";
import '../styles/TabsPage.css';

function TabsPage({ tabData, initialTab, barOnTopInMobile = true, stickyOnDesktop = false, pinnedInMobile = true, stickUnderParentBarInMobile = false, stickUnderParentBarOnDesktop = false, elementsAcrossTabsAtTheTop, title, controlledTab, onTabChange }) {
    const storageKey = title ? `activeTab_${title}` : null;


    const isControlled = controlledTab !== undefined && controlledTab !== null;

    const [internalTab, setInternalTab] = useState(() => {
        if (storageKey) {
            const stored = localStorage.getItem(storageKey);

            if (stored !== null) {
                const saved = Number(stored);
                if (Number.isInteger(saved) && tabData.some((t) => t.id === saved)) return saved;
            }
        }

        return initialTab || tabData[0].id;
    });

    const activeTab = isControlled ? controlledTab : internalTab;

    const setActiveTab = (nextTab) => {
        if (!isControlled) {
            setInternalTab(nextTab);
        }

        if (onTabChange) {
            onTabChange(nextTab);
        }
    };

    const currentIndex = tabData.findIndex((tab) => tab.id === activeTab);

    const handlePrevTab = () => {
        const prevIndex = currentIndex === 0 ? tabData.length - 1 : currentIndex - 1;
        setActiveTab(tabData[prevIndex].id);
    };

    const handleNextTab = () => {
        const nextIndex = currentIndex === tabData.length - 1 ? 0 : currentIndex + 1;
        setActiveTab(tabData[nextIndex].id);
    };

    useEffect(() => {
        if (storageKey && !isControlled) {
            localStorage.setItem(storageKey, activeTab);
        }
    }, [activeTab, storageKey, isControlled]);


    const mobilePosition = pinnedInMobile ? (barOnTopInMobile ? 'bar-position-top' : 'bar-position-bottom') : 'bar-position-inline';
    const nestedStickyInMobile = (stickUnderParentBarInMobile && !pinnedInMobile) ? 'stick-under-parent-mobile' : '';
    const nestedStickyOnDesktop = stickUnderParentBarOnDesktop ? 'stick-under-parent-desktop' : '';

    const containerRef = useRef(null);
    const tabBarRef = useRef(null);
    const tabsBarRef = useRef(null);
    const [overflow, setOverflow] = useState({ left: false, right: false });

    useEffect(() => {
        const bar = tabsBarRef.current;

        if (!bar) {
            return;
        }

        const measure = () => {
            const travel = bar.scrollWidth - bar.clientWidth;

            if (travel <= 1) {
                setOverflow({ left: false, right: false });

                return;
            }

            const isRightToLeft = window.getComputedStyle(bar).direction === 'rtl';
            const lowest = isRightToLeft ? -travel : 0;
            const highest = isRightToLeft ? 0 : travel;

            setOverflow({
                left: bar.scrollLeft > lowest + 1,
                right: bar.scrollLeft < highest - 1,
            });
        };

        measure();

        bar.addEventListener('scroll', measure, { passive: true });

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', measure);

            return () => {
                bar.removeEventListener('scroll', measure);
                window.removeEventListener('resize', measure);
            };
        }

        const observer = new ResizeObserver(measure);
        observer.observe(bar);

        return () => {
            bar.removeEventListener('scroll', measure);
            observer.disconnect();
        };
    }, [tabData]);

    const scrollTabsBy = (towards) => {
        const bar = tabsBarRef.current;

        if (bar) {
            bar.scrollBy({ left: towards * bar.clientWidth, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (!tabBarRef.current || !containerRef.current) {
            return;
        }

        const bar = tabBarRef.current;
        const container = containerRef.current;

        const publishHeight = () => {
            const height = `${bar.getBoundingClientRect().height}px`;

            container.style.setProperty('--tabs-own-bar-height', height);

            if (pinnedInMobile) {
                container.style.setProperty('--tabs-parent-bar-height', height);
            }
        };

        publishHeight();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', publishHeight);

            return () => window.removeEventListener('resize', publishHeight);
        }

        const observer = new ResizeObserver(publishHeight);
        observer.observe(bar);

        return () => observer.disconnect();
    }, [pinnedInMobile]);

    const tabBar = (
        <div ref={tabBarRef}
             className={`tabs-bar-wrapper ${mobilePosition} ${nestedStickyInMobile} ${nestedStickyOnDesktop} ${stickyOnDesktop ? 'sticky-desktop' : ''}`}>
            <button
                className="mobile-nav-tabs-bar-arrow left-arrow"
                onClick={handlePrevTab}
                aria-label="Previous tab"
            >
                &#10094;
            </button>
            {overflow.left && (
                <button
                    className="tabs-bar-scroll-arrow scroll-left"
                    onClick={() => scrollTabsBy(-1)}
                    aria-label="Scroll tabs left"
                    type="button"
                >
                    &#10094;
                </button>
            )}
            <div className="tabs-bar" role="tablist" ref={tabsBarRef}>
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
            {overflow.right && (
                <button
                    className="tabs-bar-scroll-arrow scroll-right"
                    onClick={() => scrollTabsBy(1)}
                    aria-label="Scroll tabs right"
                    type="button"
                >
                    &#10095;
                </button>
            )}
            <button
                className="mobile-nav-tabs-bar-arrow right-arrow"
                onClick={handleNextTab}
                aria-label="Next tab"
            >
                &#10095;
            </button>
        </div>
    );

    const tabPanel = (
        <div className={`tab-panel ${pinnedInMobile ? (barOnTopInMobile ? 'tab-panel-top-bar' : 'tab-panel-bottom-bar') : 'tab-panel-inline-bar'} ${nestedStickyInMobile ? 'tab-panel-stick-under-parent-mobile' : ''} ${stickyOnDesktop ? 'tab-panel-sticky-desktop' : ''}`} role="tabpanel">
            {tabData.map((tab) => (
                <div
                    key={tab.id}
                    className={`tab-content ${activeTab === tab.id ? 'active' : ''}`}
                >
                    {elementsAcrossTabsAtTheTop && elementsAcrossTabsAtTheTop.map((element, index) => (
                        <Fragment key={index}>
                            {element}
                        </Fragment>
                    ))}

                    {tab.element !== undefined ? tab.element : (typeof tab.component === 'function' ? tab.component() : null)}
                </div>
            ))}
        </div>
    );

    return (
        <div className="tabs-container" ref={containerRef}>
            {tabBar}
            {tabPanel}
        </div>
    );
}

TabsPage.propTypes = {
    tabData: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            label: PropTypes.string.isRequired,
            component: PropTypes.func,
            element: PropTypes.node,
        })
    ).isRequired,
    initialTab: PropTypes.number,
    controlledTab: PropTypes.number,
    onTabChange: PropTypes.func,
    barOnTopInMobile: PropTypes.bool,
    stickyOnDesktop: PropTypes.bool,
    pinnedInMobile: PropTypes.bool,
    stickUnderParentBarInMobile: PropTypes.bool,
    stickUnderParentBarOnDesktop: PropTypes.bool,
    elementsAcrossTabsAtTheTop: PropTypes.array,
    title: PropTypes.string,
}

export default TabsPage;