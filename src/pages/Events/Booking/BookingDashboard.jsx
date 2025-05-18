import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/Events.css'
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../../modules/Spinner.jsx";
import {checkBookingSessionFromBookingDashboard, resetSession, bookingLoginPageUrl} from "../../../services/Utils.jsx";

function BookingDashboard() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {

        async function  goToBookingLoginOnInvalidSession() {
            setIsLoading(true);

            try {
                await checkBookingSessionFromBookingDashboard(navigate);
            } catch (error) {
                console.log(error.message);
                navigate(bookingLoginPageUrl);
            } finally {
                setIsLoading(false);
            }
        }

        goToBookingLoginOnInvalidSession()

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
                                title: "Booking Extras",
                                image: "/assets/images/EventsPages/BookingExtras1.png",
                                description: "Sign up for booking extras.",
                                link: "/events/booking/extras",
                                buttonText: "Access",
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                            {
                                title: "Booking Info",
                                image: "/assets/images/EventsPages/BookingInfo1.png",
                                description: "Check your booking status and info.",
                                link: "/events/booking/info",
                                buttonText: "Access",
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                            {
                                title: "Booking Media",
                                image: "/assets/images/EventsPages/BookingMedia1.png",
                                description: "Access booking media.",
                                link: "/events/booking/media",
                                buttonText: "Access",
                                titleInArabic: false,
                                descriptionInArabic: false
                            },
                        ]}
                        title={"Booking Dashboard"}
                        divElements={[(
                            <div className={"booking-dashboard-page-footer"} key={1}>
                                <button onClick={() => {
                                    resetSession('harvest_schools_booking');
                                    navigate(bookingLoginPageUrl);
                                }}>Logout</button>
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