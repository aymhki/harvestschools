import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/AdminSidebar.css';
import {isDevelopment} from "../services/General/GeneralUtils.jsx";

import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import InfoIcon from '@mui/icons-material/Info';
import PublicIcon from '@mui/icons-material/Public';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import LanguageIcon from '@mui/icons-material/Language';
import CloseIcon from '@mui/icons-material/Close';
import {useToggleLanguage} from "../services/General/GeneralUtils.jsx";
import PropTypes from "prop-types";

function AdminSidebar({ adminLinks}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const toggleLanguage = useToggleLanguage();
    const {  i18n } = useTranslation();

    const getIconForLink = (linkPath) => {
        switch(linkPath) {
            case '/job-applications': return <WorkIcon />;
            case '/graduation-booking-management': return <SchoolIcon />;
            case '/open-day-signups-management': return <EventIcon />;
            case '/borrowing-system-management': return <LibraryBooksIcon />;
            case '/info-system-management': return <InfoIcon />;
            default: return <DashboardIcon />;
        }
    };

    const handleLogout = () => {
        document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/login');
    };

    const showText = isExpanded || isMobileOpen;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileOpen(false);
            } else {
                setIsExpanded(false);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <button className="floating-mobile-menu" onClick={() => setIsMobileOpen(true)}>
                <MenuIcon />
            </button>


            {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>}

            <aside
                className={`admin-sidebar ${isExpanded ? 'expanded' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className="sidebar-header">
                    <div className="menu-toggle desktop-only">
                        <MenuIcon />
                    </div>
                    <div className="menu-toggle mobile-only" onClick={() => setIsMobileOpen(false)}>
                        <MenuIcon />
                    </div>
                    {showText && <span className="logo-text">Admin</span>}
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-links">
                        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
                            <Link to="/dashboard" title={!isExpanded ? 'Dashboard' : ''} onClick={() => setIsMobileOpen(false)}>
                                <span className="icon"><DashboardIcon /></span>
                                {showText && <span className="label">Dashboard</span>}
                            </Link>
                        </li>

                        {adminLinks.map((link) => {
                            const isActive = location.pathname === link.link;
                            return (
                                <li key={link.link} className={isActive ? 'active' : ''}>
                                    <Link to={link.link} title={!isExpanded ? link.title : ''} onClick={() => setIsMobileOpen(false)}>
                                        <span className="icon">{getIconForLink(link.link)}</span>
                                        {showText && <span className="label">{link.title}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <ul className="sidebar-links">
                        <li onClick={() => toggleLanguage()}>
                            <div className="nav-item-content" title={!isExpanded ? 'Change Language' : ''}>
                                <span className="icon"><LanguageIcon /></span>
                                {showText && <span className={`label admin-sidebar-language-switcher ${i18n.language === 'en' ? 'ar' : 'en'}`}>{i18n.language === 'en' ? 'العربية' : 'English'}</span>}
                            </div>
                        </li>
                        <li>
                            <Link
                                to={ "https://schooleverywhere-harvest.com/schooleverywhere/" }
                                title={!isExpanded ? 'SchoolEverywhere' : ''}
                            >
                                <span className="icon"><PublicIcon /></span>
                                {showText && <span className="label">SchoolEverywhere</span>}
                            </Link>
                        </li>
                        <li>
                            <Link
                                to={ `${ isDevelopment() ? `http://localhost:5173?lang=${i18n.language}` : `https://harvestschools.com?lang=${i18n.language}` }` }
                                title={!isExpanded ? 'Return to Main Site' : ''}
                            >
                                <span className="icon"><PublicIcon /></span>
                                {showText && <span className="label">Main Site</span>}
                            </Link>
                        </li>
                        <li className="logout-btn" onClick={handleLogout}>
                            <div className="nav-item-content" title={!isExpanded ? 'Logout' : ''}>
                                <span className="icon"><LogoutIcon /></span>
                                {showText && <span className="label">Logout</span>}
                            </div>
                        </li>
                        {isMobileOpen && (
                            <li className="close-admin-sidebar-mobile" onClick={() => setIsMobileOpen(false)}>
                                <div className={"nav-item-content"} title={!isExpanded ? 'Close Sidebar' : ''}>
                                    <span className="icon"><CloseIcon /></span>
                                    {showText && <span className="label">Close Sidebar</span>}
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </aside>
        </>
    );
}

AdminSidebar.propTypes = {
    adminLinks: PropTypes.arrayOf(
        PropTypes.shape({
            link: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
        })
    ).isRequired,
}

export default AdminSidebar;