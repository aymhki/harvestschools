import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/AdminSidebar.css';
import {headToAdminLoginOnInvalidSessionFromAdminDashboard} from "../services/AdminNavigationServices.jsx";

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

function AdminSidebar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [adminLinks, setAdminLinks] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const {  i18n } = useTranslation(['nav']);

    useEffect(() => {
        headToAdminLoginOnInvalidSessionFromAdminDashboard(navigate, setAdminLinks, setIsLoading)
    }, []);

    const getIconForLink = (linkPath) => {
        switch(linkPath) {
            case '/admin/job-applications': return <WorkIcon />;
            case '/admin/graduation-booking-management': return <SchoolIcon />;
            case '/admin/open-day-signups-management': return <EventIcon />;
            case '/admin/borrowing-system-management': return <LibraryBooksIcon />;
            case '/admin/info-system-management': return <InfoIcon />;
            default: return <DashboardIcon />;
        }
    };

    const handleLogout = () => {
        document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/admin/login');
    };

    const toggleLanguage = () => {
        const lng = i18n.language === 'en' ? 'ar' : 'en';
        i18n.changeLanguage(lng);

        const searchParams = new URLSearchParams(location.search);
        searchParams.set('lang', lng);

        navigate({
            pathname: location.pathname,
            search: searchParams.toString()
        }, { replace: true });

        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
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
                        <CloseIcon />
                    </div>
                    {showText && <span className="logo-text">Admin</span>}
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-links">
                        <li className={location.pathname === '/admin/dashboard' ? 'active' : ''}>
                            <Link to="/admin/dashboard" title={!isExpanded ? 'Dashboard' : ''} onClick={() => setIsMobileOpen(false)}>
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
                        <li onClick={toggleLanguage}>
                            <div className="nav-item-content" title={!isExpanded ? 'Change Language' : ''}>
                                <span className="icon"><LanguageIcon /></span>
                                {showText && <span className={`label admin-sidebar-language-switcher ${i18n.language === 'en' ? 'ar' : 'en'}`}>{i18n.language === 'en' ? 'العربية' : 'English'}</span>}
                            </div>
                        </li>
                        <li>
                            <Link to="/" title={!isExpanded ? 'Return to Main Site' : ''}>
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
                    </ul>
                </div>
            </aside>
        </>
    );
}

export default AdminSidebar;