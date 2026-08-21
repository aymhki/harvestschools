import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import '../styles/AdminSidebar.css';
import {isDevelopment, logoutCurrentAdmin, jackOfAllTradesPermissionLevel} from "../services/General/GeneralUtils.jsx";
import { Capacitor } from '@capacitor/core';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import PublicIcon from '@mui/icons-material/Public';
import CelebrationIcon from '@mui/icons-material/Celebration';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CollectionsIcon from '@mui/icons-material/Collections';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import PropTypes from "prop-types";
import {LinkOutlined} from "@mui/icons-material";
import AdminSettingsModal from './AdminSettingsModal.jsx';
import {openSchoolEverywhereTarget} from "../services/General/ExternalSiteService.jsx";

function AdminSidebar({ adminLinks, adminPermissions, loggedInUsername, isPinned, onTogglePin, setRefreshCurrentUserData}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsNotice, setSettingsNotice] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const navRef = useRef(null);

    const getIconForLink = (linkPath) => {
        switch(linkPath) {
            case '/job-applications': return <WorkIcon />;
            case '/event-booking-management': return <EventIcon />;
            case '/open-day-signups-management': return <CelebrationIcon />;
            case '/borrowing-system-management': return <CreditScoreIcon />;
            case '/info-system-management': return <InfoIcon />;
            case '/alumni-students-management' : return <SchoolIcon />;
            case '/staff-directory-management' : return <BadgeIcon />;
            case '/academic-calendars-management' : return <CalendarMonthIcon />;
            case '/library-management' : return <MenuBookIcon />;
            case '/gallery-management' : return <CollectionsIcon />;
            case '/admin-users-management' : return <ManageAccountsIcon />;
            case '/page-gates-management' : return <VisibilityIcon />;
            case  '/view-job-application-file' : return <WorkIcon />;
            default: return <DashboardIcon />;
        }
    };


    const showText = isExpanded || isPinned || isMobileOpen;
    const dashboardIsActive = location.pathname === '/admin-dashboard';

    const scrollActiveItemIntoView = () => {
        const nav = navRef.current;
        const active = nav && nav.querySelector('li.active');

        if (!nav || !active) {
            return;
        }

        const stuckPosition = active.style.position;
        active.style.position = 'static';
        const naturalTop = active.offsetTop;
        active.style.position = stuckPosition;

        const centred = naturalTop - (nav.clientHeight - active.offsetHeight) / 2;

        nav.scrollTo({ top: Math.max(0, centred), behavior: 'smooth' });
    };

    const onNavLinkClick = (isActive) => {
        setIsMobileOpen(false);

        if (isActive) {
            scrollActiveItemIntoView();
        }
    };

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


    useEffect(() => {
        const promptPasskey = sessionStorage.getItem('hs_prompt_passkey') === '1';
        const needsMfaSetup = sessionStorage.getItem('hs_needs_mfa_setup') === '1';

        if (promptPasskey || needsMfaSetup) {
            sessionStorage.removeItem('hs_prompt_passkey');
            sessionStorage.removeItem('hs_needs_mfa_setup');
            setSettingsNotice(promptPasskey ? 'passkey_prompt' : 'mfa_setup');
            setShowSettingsModal(true);
        }
    }, []);

    const openSchoolEverywhere = () => {
        setIsMobileOpen(false);
        openSchoolEverywhereTarget({
            target: 'portal',
            isMobileApp: Capacitor.isNativePlatform(),
            navigate,
        });
    };

    const openSettings = () => {
        setSettingsNotice(null);
        setShowSettingsModal(true);
        setIsMobileOpen(false);
    };

    const closeSettings = () => {
        setShowSettingsModal(false);
        setSettingsNotice(null);
    };

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

                <nav className="sidebar-nav" ref={navRef}>
                    <ul className="sidebar-links">
                        <li className={dashboardIsActive ? 'active' : ''}>
                            <Link to="/admin-dashboard" title={!isExpanded ? 'Dashboard' : ''}
                                  onClick={() => onNavLinkClick(dashboardIsActive)}>
                                <span className="icon"><DashboardIcon /></span>
                                {showText && <span className="label">Dashboard</span>}
                            </Link>
                        </li>

                        {adminLinks.map((link) => {
                            const viewJobApplicationFile = location.pathname === '/view-job-application-file' && link.link === '/job-applications';
                            const isActive = location.pathname === link.link || viewJobApplicationFile;
                            return (
                                <li key={link.link} className={isActive ? 'active' : ''}>
                                    <Link to={link.link} title={!isExpanded ? link.title : ''}
                                          onClick={() => onNavLinkClick(isActive)}>
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
                                to={ `${ Capacitor.isNativePlatform() ? '/app-home' : isDevelopment() ? `http://localhost:5173` : `https://harvestschools.com` }` }
                                title={!isExpanded ? 'Return to Main Site' : ''}
                            >
                                <span className="icon"><PublicIcon /></span>
                                {showText && <span className="label">Main Site</span>}
                            </Link>
                        </li>
                        <li onClick={openSchoolEverywhere}>
                            <div className="nav-item-content" title={!isExpanded ? 'SchoolEverywhere' : ''}>
                                <span className="icon"><LinkOutlined /></span>
                                {showText && <span className="label">SchoolEverywhere</span>}
                            </div>
                        </li>

                        {(adminPermissions.includes(jackOfAllTradesPermissionLevel)) && (<li>
                                <Link
                                    to={ "https://alfajralbasem.com/" }
                                    title={!isExpanded ? 'Corporate' : ''}
                                >
                                    <span className="icon"><LinkOutlined /></span>
                                    {showText && <span className="label">Corporate</span>}
                                </Link>
                            </li>
                        )}

                        <li className="settings-btn" onClick={openSettings}>
                            <div className="nav-item-content" title={!isExpanded ? 'Settings' : ''}>
                                <span className="icon"><SettingsIcon /></span>
                                {showText && <span className="label">Settings</span>}
                            </div>
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

            <AdminSettingsModal
                show={showSettingsModal}
                notice={settingsNotice}
                onClose={closeSettings}
                setRefreshCurrentUserData={setRefreshCurrentUserData}
            />
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
    adminPermissions: PropTypes.arrayOf(PropTypes.string).isRequired,
    loggedInUsername: PropTypes.string.isRequired,
    isPinned: PropTypes.bool.isRequired,
    onTogglePin: PropTypes.func.isRequired,
    setRefreshCurrentUserData: PropTypes.func.isRequired,
}

export default AdminSidebar;
