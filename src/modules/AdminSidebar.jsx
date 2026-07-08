import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/AdminSidebar.css';
import {isDevelopment, logoutCurrentAdmin} from "../services/General/GeneralUtils.jsx";
import { Capacitor } from '@capacitor/core';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import InfoIcon from '@mui/icons-material/Info';
import PublicIcon from '@mui/icons-material/Public';
import CelebrationIcon from '@mui/icons-material/Celebration';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import PropTypes from "prop-types";
import {LinkOutlined} from "@mui/icons-material";

function AdminSidebar({ adminLinks, loggedInUsername, isPinned, onTogglePin}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const {  i18n } = useTranslation();

    const getIconForLink = (linkPath) => {
        switch(linkPath) {
            case '/job-applications': return <WorkIcon />;
            case '/graduation-booking-management': return <EventIcon />;
            case '/open-day-signups-management': return <CelebrationIcon />;
            case '/borrowing-system-management': return <LibraryBooksIcon />;
            case '/info-system-management': return <InfoIcon />;
            case '/alumni-students-management' : return <SchoolIcon />;
            case '/admin-users-management' : return <ManageAccountsIcon />;
            case  '/view-job-application-file' : return <WorkIcon />;
            default: return <DashboardIcon />;
        }
    };


    const showText = isExpanded || isPinned || isMobileOpen;

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

    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileOpen]);

    useEffect(() => {
        if (isMobileOpen) {
            setIsMobileOpen(false);
        }
    }, [location.pathname]);

    return (
        <>
            <button className="floating-mobile-menu" onClick={() => setIsMobileOpen(true)}>
                <MenuIcon />
            </button>


            {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>}

            <aside
                className={`admin-sidebar ${isExpanded || isPinned ? 'expanded' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className={`sidebar-header`} onClick={() => {
                    if (isMobileOpen) {
                        setIsMobileOpen(false);
                    } else {
                        onTogglePin()
                    }
                }}>
                    <div className="menu-toggle desktop-only" >
                        <ViewSidebarIcon />
                    </div>
                    <div className="menu-toggle mobile-only" >
                        <MenuIcon />
                    </div>
                    {showText && (
                        <span className="logo-text">
                            {loggedInUsername}
                        </span>
                    )}

                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-links">
                        <li className={location.pathname === '/admin-dashboard' ? 'active' : ''}>
                            <Link to="/admin-dashboard" title={!isExpanded ? 'Dashboard' : ''} onClick={() => setIsMobileOpen(false)}>
                                <span className="icon"><DashboardIcon /></span>
                                {showText && <span className="label">Dashboard</span>}
                            </Link>
                        </li>

                        {adminLinks.map((link) => {
                            const viewJobApplicationFile = location.pathname === '/view-job-application-file' && link.link === '/job-applications';
                            const isActive = location.pathname === link.link || viewJobApplicationFile;
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
                        <li>
                            <Link
                                to={ `${ Capacitor.isNativePlatform() ? '/home' : isDevelopment() ? `http://localhost:5173` : `https://harvestschools.com` }` }
                                title={!isExpanded ? 'Return to Main Site' : ''}
                            >
                                <span className="icon"><PublicIcon /></span>
                                {showText && <span className="label">Main Site</span>}
                            </Link>
                        </li>
                        <li>
                            <Link
                                to={ "https://schooleverywhere-harvest.com/schooleverywhere/" }
                                title={!isExpanded ? 'SchoolEverywhere' : ''}
                            >
                                <span className="icon"><LinkOutlined /></span>
                                {showText && <span className="label">SchoolEverywhere</span>}
                            </Link>
                        </li>
                        <li className="logout-btn" onClick={() => {logoutCurrentAdmin(navigate)}}>
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
    loggedInUsername: PropTypes.string.isRequired,
    isPinned: PropTypes.bool.isRequired,
    onTogglePin: PropTypes.func.isRequired
}

export default AdminSidebar;