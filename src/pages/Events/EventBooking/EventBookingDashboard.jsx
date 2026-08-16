import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/Events.css'
import {useEffect} from "react";
import {useNavigate} from "react-router";
import {useTranslation} from "react-i18next";
import {headToEventBookingLoginOnInvalidSessionFromEventBookingDashboard} from "../../../services/Parents/EventBookings/EventBookingNavigationServices.jsx";
import {logoutEventBooking} from "../../../services/Parents/EventBookings/MainParentsEventBookingServices.jsx";
import { useLoading } from '../../../services/General/GlobalLoadingService.jsx'

function EventBookingDashboard() {
    const {t} = useTranslation(['events-pages'])
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useLoading(false);

    useEffect(() => {
        headToEventBookingLoginOnInvalidSessionFromEventBookingDashboard(navigate, setIsLoading)
    }, [])



    return (
        <div className={"booking-dashboard-page"}>
            {isLoading ? (
                null
            ) : (
                <>
                    <OptionsGrid
                        options={[
                            {
                                title: t("events-pages.event-booking-pages.dashboard-page.extras-option"),
                                image: "/images/EventsPages/BookingExtras1.png",
                                description: t("events-pages.event-booking-pages.dashboard-page.extras-option-description"),
                                link: "/events/event-booking/extras",
                                buttonText: t("common.access", {ns: 'common'}),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                            {
                                title: t("events-pages.event-booking-pages.dashboard-page.booking-info-option"),
                                image: "/images/EventsPages/BookingInfo1.png",
                                description: t("events-pages.event-booking-pages.dashboard-page.booking-info-option-description"),
                                link: "/events/event-booking/info",
                                buttonText: t("common.access", {ns: 'common'}),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                            {
                                title: t("events-pages.event-booking-pages.dashboard-page.media-option"),
                                image: "/images/EventsPages/BookingMedia1.png",
                                description: t("events-pages.event-booking-pages.dashboard-page.media-option-description"),
                                link: "/events/event-booking/media",
                                buttonText: t("common.access", {ns: 'common'}),
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                        ]}
                        title={t("events-pages.event-booking-pages.dashboard-page.title")}
                        divElements={[(
                            <div className={"booking-dashboard-page-footer"} key={1}>
                                <button onClick={async () => {
                                    await logoutEventBooking(navigate);
                                }}>
                                    {t("events-pages.event-booking-pages.dashboard-page.logout-btn")}
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

export default EventBookingDashboard;


