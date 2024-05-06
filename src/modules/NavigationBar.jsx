// NavigationBar.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/NavigationBar.css';
import ArrowDropDownCircleOutlinedIcon from '@mui/icons-material/ArrowDropDownCircleOutlined';
import { useSpring, animated } from 'react-spring';
import {useNavigate} from "react-router-dom";


const NavigationBar = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isOpen, setIsOpen] = useState(isMobile);
    const navigate = useNavigate();
    const toggleMenu = () => setIsOpen(!isOpen);



    useEffect(() => {
        const checkWindowSize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
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
        <nav className={`navbar`}>
            <div className="logo-container">
                <Link to="/" onClick={() => { (isMobile ? setIsOpen(false) : null); navigate('/home'); } }>
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

                {isMobile && (
                    <button className={"menu-icon-container"}
                            onClick={toggleMenu}>

                        <div className={isOpen ? "menu-icon open" : "menu-icon"}>
                            {isOpen ? '+' : '☰'}
                        </div>
                    </button>
                )}

            </div>
            <animated.ul style={{
                transform: menuAnimation.transform,
                opacity: menuAnimation.opacity
            }} className={(isMobile) ? "nav-links-mobile" : "nav-links"}>
                <li><Link to="/" onClick={() => {
                    (isMobile ? setIsOpen(false) : null);
                    navigate('/');
                }}>Home</Link></li>
                <li className="dropdown">
                    <Link to="/academics" onClick={() => isMobile ? null : navigate('/academics')}>
                        <div className={"dropdown-icon-container"}>Academics {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li><Link to="/academics/national" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/national');
                        }}>National</Link></li>
                        <li><Link to="/academics/british" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/british');
                        }}>British</Link></li>
                        <li><Link to="/academics/american" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/american');
                        }}>American</Link></li>
                        <li><Link to="/academics/partners" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/partners');
                        }}>Partners</Link></li>
                        <li><Link to="/academics/staff" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/staff');
                        }}>Staff</Link></li>
                        <li><a href="https://mail.harvestschools.com:2096/" target="_blank" rel="noreferrer"
                               style={{width: '100%', height: '100%'}}>Web Mail</a></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <Link to="/admission" onClick={() => isMobile ? null : navigate('/admission')}>
                        <div className={"dropdown-icon-container"}>Admission {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li><Link to="/admission/admission-process" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/admission/admission-process');
                        }}>Admission Process</Link></li>
                        <li><Link to="/admission/admission-requirements" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/admission/admission-requirements');
                        }}>Admission Requirements</Link></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <Link to="/students-life" onClick={() => isMobile ? null : navigate('/students-life')}>
                        <div className={"dropdown-icon-container"}>Student Life {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li><Link to="/students-life/students-union" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/students-life/students-union');
                        }}>Students Union</Link></li>
                        <li><Link to="/students-life/activities" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/students-life/activities');
                        }}>Activities</Link></li>
                        <li><Link to="/students-life/library" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/students-life/library');
                        }}>Library</Link></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <Link to="/events" onClick={() => isMobile ? null : navigate('/events')}>
                        <div className={"dropdown-icon-container"}>Events {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li><Link to="/events/national-calendar" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/events/national-calendar');
                        }}>National Calendar</Link></li>
                        <li><Link to="/events/british-calendar" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/events/british-calendar');
                        }}>British Calendar</Link></li>
                        <li><Link to="/events/american-calendar" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/events/american-calendar');
                        }}>American Calendar</Link></li>
                        <li><Link to="/events/kg-calendar" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/events/kg-calendar');
                        }}>KG Calendar</Link></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <Link to="/gallery" onClick={() => isMobile ? null : navigate('/gallery')}>
                        <div className={"dropdown-icon-container"}>Gallery {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li><Link to="/gallery/photos" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/gallery/photos');
                        }}>Photos</Link></li>
                        <li><Link to="/gallery/videos" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/gallery/videos');
                        }}>Videos</Link></li>
                        <li><Link to="/gallery/360-tour" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/gallery/360-tour');
                        }}>360 Tour</Link></li>
                    </ul>
                </li>


                <li className="dropdown">
                    <Link to="/more-info" onClick={() => isMobile ? null : navigate('/more-info')}>
                        <div className={"dropdown-icon-container"}>FAQs {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}
                        </div>
                    </Link>

                    <ul className="dropdown-content">
                        <li><Link to="/faqs" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/faqs');
                        }}>Frequently Asked Questions</Link></li>

                        <li>
                            <Link to='/minimum-stage-age' onClick={() => {
                                (isMobile ? setIsOpen(false) : null);
                                navigate('/minimum-stage-age');
                            }}>Minimum Registration Age for Each Stage</Link>
                        </li>

                        <li><Link to="/covid-19" onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('covid-19');
                        }}>Covid-19 Policy</Link></li>
                    </ul>
                </li>

                <li><Link to="/vacancies" onClick={() => {
                    (isMobile ? setIsOpen(false) : null);
                    navigate('/vacancies');
                }}>Vacancies</Link></li>

            </animated.ul>
        </nav>
    );
};

export default NavigationBar;
