import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/NavigationBar.css';
import ArrowDropDownCircleOutlinedIcon from '@mui/icons-material/ArrowDropDownCircleOutlined';
import { useSpring, animated } from 'react-spring';
import {useNavigate} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';


const NavigationBar = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isOpen, setIsOpen] = useState(!isMobile);
    const navigate = useNavigate();
    const [academicsOpen, setAcademicsOpen] = useState(false);
    const [admissionOpen, setAdmissionOpen] = useState(false);
    const [studentsLifeOpen, setStudentsLifeOpen] = useState(false);
    const [eventsOpen, setEventsOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [moreInfoOpen, setMoreInfoOpen] = useState(false);
    const { t } = useTranslation();



    const toggleMenu = () => {
        setIsOpen(!isOpen);
        // document.body.classList.toggle('lock-scroll', !isOpen);

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
        // document.body.classList.toggle('lock-scroll', false);
        setAcademicsOpen(false);
        setAdmissionOpen(false);
        setStudentsLifeOpen(false);
        setEventsOpen(false);
        setGalleryOpen(false);
        setMoreInfoOpen(false);
    }



    const toggleDropdown = (dropdown, setDropdown) => {
        setDropdown(!dropdown);
    }


    const handleDropdownClick = (e, mainLink) => {
        if (!e.target.closest('.dropdown-content')) {
            navigate(mainLink);

            if (isMobile){
                setIsOpen(true);

            }
        }
    };





    useEffect(() => {
        let lastWidth = window.innerWidth;

        const checkWindowSize = () => {
            const currentWidth = window.innerWidth;
            if (currentWidth !== lastWidth) {
                lastWidth = currentWidth;
                setIsMobile(currentWidth < 768);
                if (currentWidth >= 768) {
                    setIsOpen(true);
                    // Close all dropdowns
                    setAcademicsOpen(false);
                    setAdmissionOpen(false);
                    setStudentsLifeOpen(false);
                    setEventsOpen(false);
                    setGalleryOpen(false);
                    setMoreInfoOpen(false);
                } else {
                    setIsOpen(false);
                    // Close all dropdowns
                    setAcademicsOpen(false);
                    setAdmissionOpen(false);
                    setStudentsLifeOpen(false);
                    setEventsOpen(false);
                    setGalleryOpen(false);
                    setMoreInfoOpen(false);
                }
            }
        };

        checkWindowSize();

        window.addEventListener("resize", checkWindowSize);

        return () => window.removeEventListener("resize", checkWindowSize);
    }, []);

    const menuAnimation = useSpring({
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateX(0%)' : 'translateX(100%)',
        config: { tension: 170, friction: 26 }
    });

    return (
        <nav className={`navbar`} >
            <div className="logo-container">
                <Link to="/" onClick={() => { (isMobile ? closeMenu() : null); navigate('/home'); } }>
                    <img src="/assets/images/HarvestLogos/HarvestLogoCropped.png" alt="Harvest Logo" className="logo" />
                </Link>

                <div className="navbar-quick-action-buttons-container">
                    <button className="navbar-quick-action-button" onClick={() => window.open('https://schooleverywhere-harvest.com/schooleverywhere/management/onlineadmission/applyonline/onlineadmission.php', '_blank')} >
                        {t("nav.apply-now")}
                    </button>

                    <button className="navbar-quick-action-button" onClick={() => window.open('https://schooleverywhere-harvest.com/schooleverywhere/management/onlineadmission/applyonline/onlineadmissionlogin.php', '_blank')} >
                        {t("nav.check-status")}
                    </button>

                    <button className="navbar-quick-action-button" onClick={() => window.open('https://schooleverywhere-harvest.com/schooleverywhere/') } >
                        {t("nav.schooleverywhere")}
                    </button>
                </div>

                {!isMobile && (
                        <div className={"language-switcher-desktop-container"}>
                            <LanguageSwitcher />
                        </div>
                    )
                }


                {isMobile && (
                    <button className={"menu-icon-container"} onClick={toggleMenu}>

                        <div className={isOpen ? "menu-icon open" : "menu-icon"}>
                            {isOpen ? '+' : '☰'}
                        </div>
                    </button>
                )}

            </div>
            <animated.ul style={{
                transform: menuAnimation.transform,
                opacity: menuAnimation.opacity,
                position: (isMobile) ? (isOpen ? 'absolute' : 'fixed') : 'absolute',

            }} className={(isMobile) ? "nav-links-mobile" : "nav-links"}>
                <li onClick={() => {
                    (isMobile ? toggleMenu() : null);
                    navigate('/home');
                }}><Link to="/" onClick={() => {
                    (isMobile ? toggleMenu() : null);
                    navigate('/');
                }}>
                    {t("nav.home")}
                </Link></li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(academicsOpen, setAcademicsOpen)) : handleDropdownClick(e, '/academics'))}
                    onMouseEnter={() => isMobile ? undefined : setAcademicsOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setAcademicsOpen(false)}>

                    <Link to="/academics" onClick={() => isMobile ? null : navigate('/academics')}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.academics")}
                            {isMobile ? <ArrowDropDownCircleOutlinedIcon/> : ''}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: academicsOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/national');
                        }}><Link to="/academics/national">
                            {t("nav.national")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/british');
                        }}><Link to="/academics/british">
                            {t("nav.british")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/american');
                        }}><Link to="/academics/american">
                            {t("nav.american")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/partners');
                        }}><Link to="/academics/partners">
                            {t("nav.partners")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/staff');
                        }}><Link to="/academics/staff">
                            {t("nav.staff")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/facilities');
                        }}><Link to="/academics/facilities">
                            {t("nav.facilities")}
                        </Link></li>

                        <li onClick={() => {
                            window.open('https://mail.harvestschools.com:2096/', '_blank');
                        }}>
                            <a href="https://mail.harvestschools.com:2096/" target="_blank" rel="noreferrer"
                               style={{width: '100%', height: '100%'}}>
                                {t("nav.web-mail")}
                            </a>
                        </li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/admin/login');
                        }}>
                            <Link to={'/admin/login'}>
                                {t("nav.admin-login")}
                            </Link>
                        </li>
                    </ul>
                </li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(admissionOpen, setAdmissionOpen)) : handleDropdownClick(e, '/admission'))}
                    onMouseEnter={() => isMobile ? undefined : setAdmissionOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setAdmissionOpen(false)}>

                    <Link to="/admission" onClick={() => isMobile ? null : navigate('/admission')}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.admission")}
                            {isMobile ? <ArrowDropDownCircleOutlinedIcon/> : ''}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: admissionOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/admission/admission-process');
                        }}><Link to="/admission/admission-process">
                            {t("nav.admission-process")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/admission/admission-requirements');
                        }}><Link to="/admission/admission-requirements">
                            {t("nav.admission-requirements")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/admission/admission-fees');
                        }}><Link to="/admission/admission-fees">
                            {t("nav.admission-fees")}
                        </Link></li>

                    </ul>
                </li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(studentsLifeOpen, setStudentsLifeOpen)) : handleDropdownClick(e, '/students-life'))}
                    onMouseEnter={() => isMobile ? undefined : setStudentsLifeOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setStudentsLifeOpen(false)}>

                    <Link to="/students-life" onClick={() => isMobile ? null : navigate('/students-life')}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.students-life")}
                            {isMobile ? <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>

                    <ul className="dropdown-content" style={{display: studentsLifeOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/students-life/students-union');
                        }}><Link to="/students-life/students-union">
                            {t("nav.students-union")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/students-life/activities');
                        }}><Link to="/students-life/activities">
                            {t("nav.activities")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/students-life/library');
                        }}><Link to="/students-life/library">
                            {t("nav.library")}
                        </Link></li>

                    </ul>
                </li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(eventsOpen, setEventsOpen)) : handleDropdownClick(e, '/events'))}
                    onMouseEnter={() => isMobile ? undefined : setEventsOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setEventsOpen(false)}>

                    <Link to="/events" onClick={() => isMobile ? null : navigate('/events')}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.events")}
                            {isMobile ? <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>

                    <ul className="dropdown-content" style={{display: eventsOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/national-calendar');
                        }}><Link to="/events/national-calendar">
                            {t("nav.national-calendar")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/british-calendar');
                        }}><Link to="/events/british-calendar">
                            {t("nav.british-calendar")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/american-calendar');
                        }}><Link to="/events/american-calendar">
                            {t("nav.american-calendar")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/kg-calendar');
                        }}><Link to="/events/kg-calendar">
                            {t("nav.kg-calendar")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/booking');
                        }}><Link to="/events/booking">
                            {t("nav.booking")}
                        </Link></li>

                    </ul>
                </li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(galleryOpen, setGalleryOpen)) : handleDropdownClick(e, '/gallery'))}
                    onMouseEnter={() => isMobile ? undefined : setGalleryOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setGalleryOpen(false)}>

                    <Link to="/gallery" onClick={() => isMobile ? null : navigate('/gallery')}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.gallery")}
                            {isMobile ? <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>

                    <ul className="dropdown-content" style={{display: galleryOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/gallery/photos');
                        }}><Link to="/gallery/photos">
                            {t("nav.photos")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/gallery/videos');
                        }}><Link to="/gallery/videos">
                            {t("nav.videos")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/gallery/360-tour');
                        }}><Link to="/gallery/360-tour">
                            {t("nav.360-tour")}
                        </Link></li>

                    </ul>
                </li>


                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(moreInfoOpen, setMoreInfoOpen)) : handleDropdownClick(e, '/more-info'))}
                    onMouseEnter={() => isMobile ? undefined : setMoreInfoOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setMoreInfoOpen(false)}>
                    <Link to="/more-info" onClick={() => isMobile ? null : navigate('/more-info')}>
                        <div className={"dropdown-icon-container"}>
                            {t("nav.faqs")}
                            {isMobile ? <ArrowDropDownCircleOutlinedIcon/> : ''}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: moreInfoOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/faqs');
                        }}><Link to="/faqs">
                            {t("nav.frequently-asked-questions")}
                        </Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/minimum-stage-age');
                        }}>
                            <Link to='/minimum-stage-age'>
                                {t("nav.minimum-registration-age")}
                            </Link>
                        </li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('covid-19');
                        }}><Link to="/covid-19">
                            {t("nav.covid-19-policy")}
                        </Link></li>

                    </ul>
                </li>

                <li onClick={() => {
                    (isMobile ? toggleMenu() : null);
                    navigate('/vacancies');
                }}><Link to="/vacancies">
                    {t("nav.vacancies")}
                </Link></li>


                {isMobile && (
                    <div className={"language-switcher-mobile-container"}>
                        <LanguageSwitcher />
                    </div>
                )}

            </animated.ul>
        </nav>
    );
};

export default NavigationBar;
