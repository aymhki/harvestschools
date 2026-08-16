import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import '../styles/NavigationBar.css';
import { useSpring, animated } from 'react-spring';
import {useNavigate} from "react-router";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ArrowDropDownCircleOutlinedIcon from '@mui/icons-material/ArrowDropDownCircleOutlined';
import PropTypes from "prop-types";
import TranslateIcon from '@mui/icons-material/Translate';
import {useToggleLanguage} from "../services/General/GeneralUtils.jsx";
import {servePublicAsset} from "../services/General/GeneralServices.jsx";
import CachedImage from "./CachedImage.jsx";
import {isDevelopment} from "../services/General/GeneralUtils.jsx"
import { openSchoolEverywhereTarget as openSchoolEverywhereTargetInApp } from "../services/General/ExternalSiteService.jsx";

function NavigationBar({compactOrAdmin, isMobileApp}){
    const [isMobile, setIsMobile] = useState(true);
    const [isOpen, setIsOpen] = useState(!isMobile);
    const navigate = useNavigate();
    const [academicsOpen, setAcademicsOpen] = useState(false);
    const [admissionOpen, setAdmissionOpen] = useState(false);
    const [studentsLifeOpen, setStudentsLifeOpen] = useState(false);
    const [eventsOpen, setEventsOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [moreInfoOpen, setMoreInfoOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const { t, i18n } = useTranslation(['nav']);
    const toggleLanguage = useToggleLanguage({ignoreDocUpdate: compactOrAdmin});

    useEffect(() => {
        setIsClient(true);
    }, []);

    const toggleMenu = () => {
        setIsOpen(!isOpen);

        if (isOpen) {
            setAcademicsOpen(false);
            setAdmissionOpen(false);
            setStudentsLifeOpen(false);
            setEventsOpen(false);
            setGalleryOpen(false);
            setMoreInfoOpen(false);
        }
    }

    const closeMenu = () => {
        setIsOpen(false);
        setAcademicsOpen(false);
        setAdmissionOpen(false);
        setStudentsLifeOpen(false);
        setEventsOpen(false);
        setGalleryOpen(false);
        setMoreInfoOpen(false);
    }

    const openSchoolEverywhereTarget = (target) => {
        if (isMobile) {
            closeMenu();
        }

        openSchoolEverywhereTargetInApp({ target, isMobileApp, navigate });
    }

    const closeMobileMenu = () => {
        if (isMobile) {
            closeMenu();
        }
    };

    const handleDropdownLinkClick = (e, isDropdownOpen, setDropdownOpen) => {
        if (isMobile) {
            e.preventDefault();
            setDropdownOpen(!isDropdownOpen);
        }
    };

    useEffect(() => {
        let lastWidth = window.innerWidth;

        const checkWindowSize = () => {
            const currentWidth = window.innerWidth;
            if (currentWidth !== lastWidth) {
                lastWidth = currentWidth;
                toggleNavMenuMobile(currentWidth);
            }
        };

        checkWindowSize();

        window.addEventListener("resize", checkWindowSize);

        return () => window.removeEventListener("resize", checkWindowSize);
    }, []);

    const toggleNavMenuMobile = (currentWidth) => {
        setIsMobile(currentWidth < 768);
        if (currentWidth >= 768) {
            setIsOpen(true);
            setAcademicsOpen(false);
            setAdmissionOpen(false);
            setStudentsLifeOpen(false);
            setEventsOpen(false);
            setGalleryOpen(false);
            setMoreInfoOpen(false);
        } else {
            setIsOpen(false);
            setAcademicsOpen(false);
            setAdmissionOpen(false);
            setStudentsLifeOpen(false);
            setEventsOpen(false);
            setGalleryOpen(false);
            setMoreInfoOpen(false);
        }
    }

    useEffect(() => {
        toggleNavMenuMobile(window.innerWidth);
    }, []);

    const menuAnimation = useSpring({
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateX(0%)' : i18n.language === 'ar' ? 'translateX(-100%)' : 'translateX(100%)',
        config: { tension: 170, friction: 26 }
    });

    return (
        <nav className={`navbar ${compactOrAdmin ? 'compact-navbar' : ''}`} >
            <div className={`logo-container ${compactOrAdmin ? 'compact-logo-container' : ''}`}>
                <Link to={isMobileApp ? '/app-home' : '/home'} onClick={closeMobileMenu}>
                    <CachedImage src={servePublicAsset("/images/HarvestLogos/HarvestLogoCropped.avif")} alt="Harvest Logo" className={`logo ${compactOrAdmin ? 'compact-logo' : ''}`} fallbackClassName={`logo ${compactOrAdmin ? 'compact-logo' : ''}`}/>
                </Link>

                {!compactOrAdmin && (
                <div className="navbar-quick-action-buttons-container">
                    <button className="navbar-quick-action-button" onClick={() => openSchoolEverywhereTarget('apply')} >
                        {t("nav.apply-now")}
                    </button>

                    <button className="navbar-quick-action-button" onClick={() => openSchoolEverywhereTarget('status')} >
                        {t("nav.check-status")}
                    </button>

                    <button className={"navbar-quick-action-button always-english-btn"} onClick={() => openSchoolEverywhereTarget('portal')} >
                        {t("nav.schooleverywhere")}
                    </button>
                </div>
                )}

                {!isMobile  && (
                    <div className={`language-switcher-desktop-container ${compactOrAdmin ? 'compact-language-switcher-desktop-container' : ''}`}>
                        <LanguageSwitcher ignoreDocUpdate={compactOrAdmin} />
                    </div>
                )
                }

                {(isMobile && !compactOrAdmin) && (
                    <button className={"menu-icon-container"} onClick={toggleMenu}>
                        <div className={isOpen ? "menu-icon open" : "menu-icon"}>
                            {isOpen ? '+' : '☰'}
                        </div>
                    </button>
                )}

                {(isMobile && compactOrAdmin) && (
                    <button className={"translate-menu-icon-container"} onClick={() => {
                       toggleLanguage({lng: undefined});
                    }}>
                        <TranslateIcon />
                    </button>
                )}
            </div>

            {!compactOrAdmin && (
            <animated.ul style={{
                transform: menuAnimation.transform,
                opacity: menuAnimation.opacity,
                position: (isMobile) ? (isOpen ? 'absolute' : 'fixed') : 'absolute',
            }} className={(isMobile) ? "nav-links-mobile" : "nav-links"}>
                <li><Link to={isMobileApp ? '/app-home' : '/home'} onClick={closeMobileMenu}>
                    {t("nav.home")}
                </Link></li>

                <li className={`dropdown ${academicsOpen ? 'is-open' : ''}`}
                    onMouseEnter={() => isMobile ? undefined : setAcademicsOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setAcademicsOpen(false)}>

                    <Link to="/academics" onClick={(e) => handleDropdownLinkClick(e, academicsOpen, setAcademicsOpen)}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.academics")}
                            {isMobile && isClient && <ArrowDropDownCircleOutlinedIcon />}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: academicsOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li><Link to="/academics/kindergarten" onClick={closeMobileMenu}>
                            {t("nav.kindergarten")}
                        </Link></li>

                        <li><Link to="/academics/national" onClick={closeMobileMenu}>
                            {t("nav.national")}
                        </Link></li>

                        <li><Link to="/academics/british" onClick={closeMobileMenu}>
                            {t("nav.british")}
                        </Link></li>

                        <li><Link to="/academics/american" onClick={closeMobileMenu}>
                            {t("nav.american")}
                        </Link></li>

                        <li><Link to="/academics/partners" onClick={closeMobileMenu}>
                            {t("nav.partners")}
                        </Link></li>

                        <li><Link to="/academics/staff" onClick={closeMobileMenu}>
                            {t("nav.staff")}
                        </Link></li>

                        <li><Link to="/academics/facilities" onClick={closeMobileMenu}>
                            {t("nav.facilities")}
                        </Link></li>

                        <li>
                            <a href="https://mail.harvestschools.com:2096/" target="_blank" rel="noreferrer"
                               onClick={closeMobileMenu}>
                                {t("nav.web-mail")}
                            </a>
                        </li>

                        <li>
                            {isMobileApp ? (
                                <Link to="/admin-login" onClick={closeMobileMenu}>
                                    {t("nav.admin-login")}
                                </Link>
                            ) : (
                                <a href={isDevelopment() ? `http://localhost:5174` : `https://admin.harvestschools.com`}
                                   onClick={closeMobileMenu}>
                                    {t("nav.admin-login")}
                                </a>
                            )}
                        </li>
                    </ul>
                </li>

                <li className={`dropdown ${admissionOpen ? 'is-open' : ''}`}
                    onMouseEnter={() => isMobile ? undefined : setAdmissionOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setAdmissionOpen(false)}>

                    <Link to="/admission" onClick={(e) => handleDropdownLinkClick(e, admissionOpen, setAdmissionOpen)}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.admission")}
                            {isMobile && isClient && <ArrowDropDownCircleOutlinedIcon />}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: admissionOpen ? 'block' : 'none'}}>
                        <li><Link to="/admission/admission-process" onClick={closeMobileMenu}>
                            {t("nav.admission-process")}
                        </Link></li>

                        <li><Link to="/admission/admission-requirements" onClick={closeMobileMenu}>
                            {t("nav.admission-requirements")}
                        </Link></li>

                        <li><Link to="/admission/admission-fees" onClick={closeMobileMenu}>
                            {t("nav.admission-fees")}
                        </Link></li>
                    </ul>
                </li>

                <li className={`dropdown ${studentsLifeOpen ? 'is-open' : ''}`}
                    onMouseEnter={() => isMobile ? undefined : setStudentsLifeOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setStudentsLifeOpen(false)}>

                    <Link to="/students-life" onClick={(e) => handleDropdownLinkClick(e, studentsLifeOpen, setStudentsLifeOpen)}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.students-life")}
                            {isMobile && isClient && <ArrowDropDownCircleOutlinedIcon />}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: studentsLifeOpen ? 'block' : 'none'}}>
                        <li><Link to="/students-life/students-union" onClick={closeMobileMenu}>
                            {t("nav.students-union")}
                        </Link></li>

                        <li><Link to="/students-life/activities" onClick={closeMobileMenu}>
                            {t("nav.activities")}
                        </Link></li>

                        <li><Link to="/students-life/library" onClick={closeMobileMenu}>
                            {t("nav.library")}
                        </Link></li>

                        <li><Link to="/students-life/alumni-students" onClick={closeMobileMenu}>
                            {t("nav.alumni-students")}
                        </Link></li>
                    </ul>
                </li>

                <li className={`dropdown ${eventsOpen ? 'is-open' : ''}`}
                    onMouseEnter={() => isMobile ? undefined : setEventsOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setEventsOpen(false)}>

                    <Link to="/events" onClick={(e) => handleDropdownLinkClick(e, eventsOpen, setEventsOpen)}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.events")}
                            {isMobile && isClient && <ArrowDropDownCircleOutlinedIcon />}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: eventsOpen ? 'block' : 'none'}}>
                        <li><Link to="/events/national-calendar" onClick={closeMobileMenu}>
                            {t("nav.national-calendar")}
                        </Link></li>

                        <li><Link to="/events/british-calendar" onClick={closeMobileMenu}>
                            {t("nav.british-calendar")}
                        </Link></li>

                        <li><Link to="/events/american-calendar" onClick={closeMobileMenu}>
                            {t("nav.american-calendar")}
                        </Link></li>

                        <li><Link to="/events/kg-calendars" onClick={closeMobileMenu}>
                            {t("nav.kg-calendars")}
                        </Link></li>

                        <li><Link to="/events/event-booking" onClick={closeMobileMenu}>
                            {t("nav.booking")}
                        </Link></li>
                    </ul>
                </li>

                <li className={`dropdown ${galleryOpen ? 'is-open' : ''}`}
                    onMouseEnter={() => isMobile ? undefined : setGalleryOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setGalleryOpen(false)}>

                    <Link to="/gallery" onClick={(e) => handleDropdownLinkClick(e, galleryOpen, setGalleryOpen)}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.gallery")}
                            {isMobile && isClient && <ArrowDropDownCircleOutlinedIcon />}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: galleryOpen ? 'block' : 'none'}}>
                        <li><Link to="/gallery/photos" onClick={closeMobileMenu}>
                            {t("nav.photos")}
                        </Link></li>

                        <li><Link to="/gallery/videos" onClick={closeMobileMenu}>
                            {t("nav.videos")}
                        </Link></li>

                        <li><Link to="/gallery/360-tour" onClick={closeMobileMenu}>
                            {t("nav.360-tour")}
                        </Link></li>
                    </ul>
                </li>

                <li className={`dropdown ${moreInfoOpen ? 'is-open' : ''}`}
                    onMouseEnter={() => isMobile ? undefined : setMoreInfoOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setMoreInfoOpen(false)}>
                    <Link to="/more-info" onClick={(e) => handleDropdownLinkClick(e, moreInfoOpen, setMoreInfoOpen)}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.faqs")}
                            {isMobile && isClient && <ArrowDropDownCircleOutlinedIcon />}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: moreInfoOpen ? 'block' : 'none'}}>
                        <li><Link to="/faqs" onClick={closeMobileMenu}>
                            {t("nav.frequently-asked-questions")}
                        </Link></li>

                        <li><Link to="/minimum-stage-age" onClick={closeMobileMenu}>
                            {t("nav.minimum-registration-age")}
                        </Link></li>

                        <li><Link to="/covid-19" onClick={closeMobileMenu}>
                            {t("nav.covid-19-policy")}
                        </Link></li>
                    </ul>
                </li>

                <li><Link to="/careers" onClick={closeMobileMenu}>
                    {t("nav.vacancies")}
                </Link></li>

                {isMobile && (
                    <div className={"language-switcher-mobile-container"}>
                        <LanguageSwitcher ignoreDocUpdate={compactOrAdmin}/>
                    </div>
                )}
            </animated.ul>
                )}
        </nav>
    );
}

NavigationBar.propTypes = {
    compactOrAdmin: PropTypes.bool.isRequired,
    isMobileApp: PropTypes.bool.isRequired,
}

export default NavigationBar;