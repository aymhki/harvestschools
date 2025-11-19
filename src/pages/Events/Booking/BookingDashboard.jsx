import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/Events.css'
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../../modules/Spinner.jsx";
import {headToBookingLoginOnInvalidSessionFromBookingDashboard, resetSession, bookingLoginPageUrl} from "../../../services/Utils.jsx";
import {useTranslation} from "react-i18next";

function BookingDashboard() {
    const {t} = useTranslation()
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        headToBookingLoginOnInvalidSessionFromBookingDashboard(navigate, setIsLoading)
    }, [])



    return (
        <div className={"booking-dashboard-page"}>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <OptionsGrid
                        options={[
                            {
                                title: t("events-pages.booking-pages.dashboard-page.extras-option"),
                                image: "/assets/images/EventsPages/BookingExtras1.png",
                                description: t("events-pages.booking-pages.dashboard-page.extras-option-description"),
                                link: "/events/booking/extras",
                                buttonText: t("common.access"),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                            {
                                title: t("events-pages.booking-pages.dashboard-page.booking-info-option"),
                                image: "/assets/images/EventsPages/BookingInfo1.png",
                                description: t("events-pages.booking-pages.dashboard-page.booking-info-option-description"),
                                link: "/events/booking/info",
                                buttonText: t("common.access"),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                            {
                                title: t("events-pages.booking-pages.dashboard-page.media-option"),
                                image: "/assets/images/EventsPages/BookingMedia1.png",
                                description: t("events-pages.booking-pages.dashboard-page.media-option-description"),
                                link: "/events/booking/media",
                                buttonText: t("common.access"),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                        ]}
                        title={t("events-pages.booking-pages.dashboard-page.title")}
                        divElements={[(
                            <div className={"booking-dashboard-page-footer"} key={1}>
                                <button onClick={() => {
                                    resetSession('harvest_schools_booking');
                                    navigate(bookingLoginPageUrl);
                                }}>
                                    {t("events-pages.booking-pages.dashboard-page.logout-btn")}
                                </button>
                            </div>
                        )]}
                        titleInArabic={false}
                    />
                </>
            )}
        </div>
    );
}

export default BookingDashboard;


