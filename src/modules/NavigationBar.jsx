// NavigationBar.js
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
                        Apply Now
                    </button>

                    <button className="navbar-quick-action-button" onClick={() => window.open('https://schooleverywhere-harvest.com/schooleverywhere/management/onlineadmission/applyonline/onlineadmissionlogin.php', '_blank')} >
                        Check Status
                    </button>

                    <button className="navbar-quick-action-button" onClick={() => window.open('https://schooleverywhere-harvest.com/schooleverywhere/') } >
                        SchoolEverywhere
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
                    Home
                </Link></li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(academicsOpen, setAcademicsOpen)) : handleDropdownClick(e, '/academics'))}
                    onMouseEnter={() => isMobile ? undefined : setAcademicsOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setAcademicsOpen(false)}>

                    <Link to="/academics" onClick={() => isMobile ? null : navigate('/academics')}>
                        <div className={"dropdown-icon-container"}>Academics {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>

                    <ul className="dropdown-content" style={{display: academicsOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/national');
                        }}><Link to="/academics/national">National</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/british');
                        }}><Link to="/academics/british">British</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/american');
                        }}><Link to="/academics/american">American</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/partners');
                        }}><Link to="/academics/partners">Partners</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/staff');
                        }}><Link to="/academics/staff">Staff</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/academics/facilities');
                        }}><Link to="/academics/facilities">Facilities</Link></li>
                        <li onClick={() => {
                            window.open('https://mail.harvestschools.com:2096/', '_blank');
                        }}>
                            <a href="https://mail.harvestschools.com:2096/" target="_blank" rel="noreferrer"
                               style={{width: '100%', height: '100%'}}>Web Mail</a>
                        </li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/admin/login');
                        }}>
                            <Link to={'/admin/login'}>Admin Login</Link>
                        </li>
                    </ul>
                </li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(admissionOpen, setAdmissionOpen)) : handleDropdownClick(e, '/admission'))}
                    onMouseEnter={() => isMobile ? undefined : setAdmissionOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setAdmissionOpen(false)}>

                    <Link to="/admission" onClick={() => isMobile ? null : navigate('/admission')}>
                        <div className={"dropdown-icon-container"}>Admission {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>

                    <ul className="dropdown-content" style={{display: admissionOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/admission/admission-process');
                        }}><Link to="/admission/admission-process">Admission Process</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/admission/admission-requirements');
                        }}><Link to="/admission/admission-requirements">Admission Requirements</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/admission/admission-fees');
                        }}><Link to="/admission/admission-fees">Admission Fees</Link></li>

                    </ul>
                </li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(studentsLifeOpen, setStudentsLifeOpen)) : handleDropdownClick(e, '/students-life'))}
                    onMouseEnter={() => isMobile ? undefined : setStudentsLifeOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setStudentsLifeOpen(false)}>

                    <Link to="/students-life" onClick={() => isMobile ? null : navigate('/students-life')}>
                        <div className={"dropdown-icon-container"}>Students Life {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>

                    <ul className="dropdown-content" style={{display: studentsLifeOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/students-life/students-union');
                        }}><Link to="/students-life/students-union">Students Union</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/students-life/activities');
                        }}><Link to="/students-life/activities">Activities</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/students-life/library');
                        }}><Link to="/students-life/library">Library</Link></li>
                    </ul>
                </li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(eventsOpen, setEventsOpen)) : handleDropdownClick(e, '/events'))}
                    onMouseEnter={() => isMobile ? undefined : setEventsOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setEventsOpen(false)}>

                    <Link to="/events" onClick={() => isMobile ? null : navigate('/events')}>
                        <div className={"dropdown-icon-container"}>Events {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>

                    <ul className="dropdown-content" style={{display: eventsOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/national-calendar');
                        }}><Link to="/events/national-calendar">National Calendar</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/british-calendar');
                        }}><Link to="/events/british-calendar">British Calendar</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/american-calendar');
                        }}><Link to="/events/american-calendar">American Calendar</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/kg-calendar');
                        }}><Link to="/events/kg-calendar">KG Calendar</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/events/booking');
                        }}><Link to="/events/booking">Booking</Link></li>
                    </ul>
                </li>

                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(galleryOpen, setGalleryOpen)) : handleDropdownClick(e, '/gallery'))}
                    onMouseEnter={() => isMobile ? undefined : setGalleryOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setGalleryOpen(false)}>

                    <Link to="/gallery" onClick={() => isMobile ? null : navigate('/gallery')}>
                        <div className={"dropdown-icon-container"}>Gallery {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>

                    <ul className="dropdown-content" style={{display: galleryOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/gallery/photos');
                        }}><Link to="/gallery/photos">Photos</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/gallery/videos');
                        }}><Link to="/gallery/videos">Videos</Link></li>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/gallery/360-tour');
                        }}><Link to="/gallery/360-tour">360 Tour</Link></li>
                    </ul>
                </li>


                <li className="dropdown"
                    onClick={(e) => (isMobile ? (toggleDropdown(moreInfoOpen, setMoreInfoOpen)) : handleDropdownClick(e, '/more-info'))}
                    onMouseEnter={() => isMobile ? undefined : setMoreInfoOpen(true)}
                    onMouseLeave={() => isMobile ? undefined : setMoreInfoOpen(false)}>
                    <Link to="/more-info" onClick={() => isMobile ? null : navigate('/more-info')}>
                        <div className={"dropdown-icon-container"}>FAQs {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}
                        </div>
                    </Link>

                    <ul className="dropdown-content" style={{display: moreInfoOpen ? 'block' : 'none'}} onClick={(e) => e.stopPropagation()}>
                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/faqs');
                        }}><Link to="/faqs">Frequently Asked Questions</Link></li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('/minimum-stage-age');
                        }}>
                            <Link to='/minimum-stage-age'>Minimum Registration Age for Each Stage</Link>
                        </li>

                        <li onClick={() => {
                            (isMobile ? toggleMenu() : null);
                            navigate('covid-19');
                        }}><Link to="/covid-19">Covid-19 Policy</Link></li>
                    </ul>
                </li>

                <li onClick={() => {
                    (isMobile ? toggleMenu() : null);
                    navigate('/vacancies');
                }}><Link to="/vacancies">Vacancies</Link></li>


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
