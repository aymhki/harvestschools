import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/Events.css'
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../../modules/Spinner.jsx";
import {resetSession, graduationBookingLoginPageUrl } from "../../../services/General/GeneralUtils.jsx"
import {useTranslation} from "react-i18next";
import {headToGraduationBookingLoginOnInvalidSessionFromGraduationBookingDashboard} from "../../../services/Parents/GraduationBookings/GraduationBookingNavigationServices.jsx";

function GraduationBookingDashboard() {
    const {t} = useTranslation(['events-pages'])
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        headToGraduationBookingLoginOnInvalidSessionFromGraduationBookingDashboard(navigate, setIsLoading)
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
                                title: t("events-pages.graduation-booking-pages.dashboard-page.extras-option"),
                                image: "/images/EventsPages/BookingExtras1.png",
                                description: t("events-pages.graduation-booking-pages.dashboard-page.extras-option-description"),
                                link: "/events/graduation-booking/extras",
                                buttonText: t("common.access", {ns: 'common'}),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                            {
                                title: t("events-pages.graduation-booking-pages.dashboard-page.booking-info-option"),
                                image: "/images/EventsPages/BookingInfo1.png",
                                description: t("events-pages.graduation-booking-pages.dashboard-page.booking-info-option-description"),
                                link: "/events/graduation-booking/info",
                                buttonText: t("common.access", {ns: 'common'}),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                            {
                                title: t("events-pages.graduation-booking-pages.dashboard-page.media-option"),
                                image: "/images/EventsPages/BookingMedia1.png",
                                description: t("events-pages.graduation-booking-pages.dashboard-page.media-option-description"),
                                link: "/events/graduation-booking/media",
                                buttonText: t("common.access", {ns: 'common'}),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                        ]}
                        title={t("events-pages.graduation-booking-pages.dashboard-page.title")}
                        divElements={[(
                            <div className={"booking-dashboard-page-footer"} key={1}>
                                <button onClick={() => {
                                    resetSession('harvest_schools_graduation_booking');
                                    navigate(graduationBookingLoginPageUrl, { replace: true });
                                }}>
                                    {t("events-pages.graduation-booking-pages.dashboard-page.logout-btn")}
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

export default GraduationBookingDashboard;


