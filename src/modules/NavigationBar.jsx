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

    // const handleContainerClick = (e) => {
    //     if (!e.target.closest('a') && !e.target.closest('li') ) {
    //         setIsOpen(false);
    //     }
    // };

    const handleContainerClick = (e) => {
        const dropdownItem = e.target.closest('.dropdown');
        const mainLink = dropdownItem.querySelector('a');

        if (!dropdownItem && !e.target.closest('a') && !e.target.closest('li') ) {
            setIsOpen(false);
        } else if (dropdownItem && e.target.closest('.dropdown-icon-container')) {
            if (mainLink) {
                setIsOpen(false);
                navigate(mainLink.getAttribute('href'));
            }
        }
    };



    useEffect(() => {
        // if (isMobile && isOpen) {
        //     document.body.style.overflow = 'hidden';
        // } else {
        //     document.body.style.overflow = 'auto';
        // }
        //
        // return () => {
        //     document.body.style.overflow = 'auto';
        // };
    }, [isMobile, isOpen]);



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
        <nav className={`navbar`} >
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
                    <button className={"menu-icon-container"} onClick={toggleMenu}>

                        <div className={isOpen ? "menu-icon open" : "menu-icon"}>
                            {isOpen ? '+' : '☰'}
                        </div>
                    </button>
                )}

            </div>
            <animated.ul style={{
                transform: menuAnimation.transform,
                opacity: menuAnimation.opacity
            }} className={(isMobile) ? "nav-links-mobile" : "nav-links"} onClick={isMobile ? handleContainerClick : undefined} >
                <li onClick={() => { (isMobile ? setIsOpen(false) : null); navigate('/home'); } }><Link to="/" onClick={() => {
                    (isMobile ? setIsOpen(false) : null);
                    navigate('/');
                }}>Home</Link></li>
                <li className="dropdown">
                    <Link to="/academics" onClick={() => isMobile ? null : navigate('/academics')}>
                        <div className={"dropdown-icon-container"}>Academics {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/national');
                        }}><Link to="/academics/national" >National</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/british');
                        }}><Link to="/academics/british" >British</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/american');
                        }}><Link to="/academics/american" >American</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/partners');
                        }}><Link to="/academics/partners" >Partners</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/academics/staff');
                        }}><Link to="/academics/staff" >Staff</Link></li>
                        <li onClick={() => { window.open('https://mail.harvestschools.com:2096/', '_blank'); }}>
                            <a href="https://mail.harvestschools.com:2096/" target="_blank" rel="noreferrer"
                               style={{width: '100%', height: '100%'}}>Web Mail</a>
                        </li>
                    </ul>
                </li>
                <li className="dropdown">
                    <Link to="/admission" onClick={() => isMobile ? null : navigate('/admission')}>
                        <div className={"dropdown-icon-container"}>Admission {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/admission/admission-process');
                        }}><Link to="/admission/admission-process" >Admission Process</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/admission/admission-requirements');
                        }}><Link to="/admission/admission-requirements" >Admission Requirements</Link></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <Link to="/students-life" onClick={() => isMobile ? null : navigate('/students-life')}>
                        <div className={"dropdown-icon-container"}>Students Life {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/students-life/students-union');
                        }}><Link to="/students-life/students-union" >Students Union</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/students-life/activities');
                        }}><Link to="/students-life/activities" >Activities</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/students-life/library');
                        }}><Link to="/students-life/library" >Library</Link></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <Link to="/events" onClick={() => isMobile ? null : navigate('/events')}>
                        <div className={"dropdown-icon-container"}>Events {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/events/national-calendar');
                        }}><Link to="/events/national-calendar" >National Calendar</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/events/british-calendar');
                        }}><Link to="/events/british-calendar" >British Calendar</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/events/american-calendar');
                        }}><Link to="/events/american-calendar" >American Calendar</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/events/kg-calendar');
                        }}><Link to="/events/kg-calendar" >KG Calendar</Link></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <Link to="/gallery" onClick={() => isMobile ? null : navigate('/gallery')}>
                        <div className={"dropdown-icon-container"}>Gallery {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}</div>
                    </Link>
                    <ul className="dropdown-content">
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/gallery/photos');
                        }}><Link to="/gallery/photos" >Photos</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/gallery/videos');
                        }}><Link to="/gallery/videos" >Videos</Link></li>
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/gallery/360-tour');
                        }}><Link to="/gallery/360-tour" >360 Tour</Link></li>
                    </ul>
                </li>


                <li className="dropdown">
                    <Link to="/more-info" onClick={() => isMobile ? null : navigate('/more-info')}>
                        <div className={"dropdown-icon-container"}>FAQs {isMobile ?
                            <ArrowDropDownCircleOutlinedIcon/> : ''}
                        </div>
                    </Link>

                    <ul className="dropdown-content">
                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/faqs');
                        }}><Link to="/faqs" >Frequently Asked Questions</Link></li>

                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('/minimum-stage-age');
                        }}>
                            <Link to='/minimum-stage-age' >Minimum Registration Age for Each Stage</Link>
                        </li>

                        <li onClick={() => {
                            (isMobile ? setIsOpen(false) : null);
                            navigate('covid-19');
                        }}><Link to="/covid-19" >Covid-19 Policy</Link></li>
                    </ul>
                </li>

                <li onClick={() => {
                    (isMobile ? setIsOpen(false) : null);
                    navigate('/vacancies');
                }}><Link to="/vacancies" >Vacancies</Link></li>

            </animated.ul>
        </nav>
    );
};

export default NavigationBar;
