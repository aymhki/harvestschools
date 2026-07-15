import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/CorporateNavigationBar.css';
import { useSpring, animated } from 'react-spring';
import {useNavigate} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import {servePublicAsset} from "../services/General/GeneralServices.jsx";

function CorporateNavigationBar(){
    const [isMobile, setIsMobile] = useState(true);
    const [isOpen, setIsOpen] = useState(!isMobile);
    const navigate = useNavigate();
    const [isClient, setIsClient] = useState(false);
    const { t, i18n } = useTranslation(['corporate-nav']);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const toggleMenu = () => {
        setIsOpen(!isOpen);

    }

    const closeMenu = () => {
        setIsOpen(false);
    }

    useEffect(() => {
        let lastWidth = window.innerWidth;
        let lastIsMobile = window.innerWidth < 768;

        const checkWindowSize = () => {
            const currentWidth = window.innerWidth;
            const currentIsMobile = currentWidth < 768;

            if (currentIsMobile !== lastIsMobile) {
                lastIsMobile = currentIsMobile;
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
        } else {
            setIsOpen(false);
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
        <nav className={`navbar`} >
            <div className={`logo-container`}>
                <Link to="/" onClick={() => { (isMobile ? closeMenu() : null); navigate('/home'); } }>
                    <img src={servePublicAsset("/images/CorporateLogo/Al-FajrAl-BasemLogo.png")} alt="Harvest Logo" className={`logo`}/>
                </Link>


                {!isMobile && (
                    <animated.ul style={{
                        transform: menuAnimation.transform,
                        opacity: menuAnimation.opacity,
                        position: 'relative',
                        }} className={ "nav-links"}>

                        {/*<li onClick={() => {navigate('/home');}}>*/}
                        {/*    <Link to="/" onClick={() => {navigate('/');}}>*/}
                        {/*        {t("corporate-nav.home")}*/}
                        {/*    </Link>*/}
                        {/*</li>*/}

                    </animated.ul>
                )}

                {!isMobile  && (
                        <div className={`language-switcher-desktop-container`}>
                            <LanguageSwitcher ignoreDocUpdate={false} />
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

            {isMobile && (
                <animated.ul style={{
                    transform: menuAnimation.transform,
                    opacity: menuAnimation.opacity,
                    position: isOpen ? 'absolute' : 'fixed'
                }} className={"nav-links-mobile"}>

                    {/*<li onClick={() => {*/}
                    {/*    toggleMenu()*/}
                    {/*    navigate('/home');*/}
                    {/*}}>*/}
                    {/*    <Link to="/" onClick={() => {*/}
                    {/*        toggleMenu()*/}
                    {/*        navigate('/');*/}
                    {/*    }}>*/}
                    {/*        {t("corporate-nav.home")}*/}
                    {/*    </Link>*/}
                    {/*</li>*/}


                    <div className={"language-switcher-mobile-container"}>
                        <LanguageSwitcher ignoreDocUpdate={false}/>
                    </div>

                </animated.ul>
            )}

        </nav>
    );
}

export default CorporateNavigationBar;