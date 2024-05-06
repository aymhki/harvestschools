import {useEffect, useState} from "react";
import '../styles/Footer.css';

function Footer() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const checkWindowSize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkWindowSize();

        window.addEventListener("resize", checkWindowSize);

        return () => window.removeEventListener("resize", checkWindowSize);
    }, []);



    return (
        <div className={isMobile ? "footer-mobile" : "footer"}>

            {(isMobile) ? (
                <>
                    <div className="mobile-footer-action-container" onClick={() => window.open('https://www.facebook.com/HarvestInternationalSchools/', '_blank')} >
                        <div className="mobile-footer-action-icon-facebook">
                            <img src="/assets/images/FooterLogos/Facebook_f_logo_(2019).svg" alt="Facebook icon"  className="mobile-footer-action-icon"/>
                        </div>
                        <div className="mobile-footer-action-text">
                            Facebook
                        </div>
                    </div>

                    <div className="mobile-footer-action-container" onClick={() => window.open('https://maps.app.goo.gl/8nqczZg9sFAdCesw7', '_blank')} >
                        <div className="mobile-footer-action-icon-google-maps">
                            <img src="/assets/images/FooterLogos/google_maps_icon.png" alt="Google maps Directions icon"  className="mobile-footer-action-icon"/>
                        </div>
                        <div className="mobile-footer-action-text">
                            Directions
                        </div>
                    </div>


                    <div className="mobile-footer-action-container" onClick={() => window.open('https://m.me/HarvestInternationalSchools', '_blank')} >
                        <div className="mobile-footer-chat-icon">
                            <img src="/assets/images/FooterLogos/chat_icon.png" alt="Chat icon"  className="mobile-footer-action-icon"/>
                        </div>
                        <div className="mobile-footer-action-text">
                            Chat
                        </div>
                    </div>

                    <div className="mobile-footer-action-container" onClick={() => window.open('tel:+201028329668', '_blank')} >
                        <div className="mobile-footer-call-icon">
                            <img src="/assets/images/FooterLogos/mobile_ringing_icon.png" alt="Call icon"  className="mobile-footer-action-icon"/>
                        </div>
                        <div className="mobile-footer-action-text">
                            Call
                        </div>
                    </div>

                </>
            ) : (
                <>
                    <div className="footer-social-media-logo"
                         onClick={() => window.open('https://www.facebook.com/HarvestInternationalSchools/', '_blank')}>
                        <img src='/assets/images/FooterLogos/Facebook_f_logo_(2019).svg'
                             alt='Footer social media logo' className="footer-social-media-logo"/>
                    </div>

                    <div className="copy-right-text">© {new Date().getFullYear()} Harvest International Schools. All rights reserved.</div>

                </>

            )}

        </div>
    )
}

export default Footer;