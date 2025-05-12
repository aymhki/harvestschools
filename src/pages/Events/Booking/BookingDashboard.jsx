import OptionsGrid from "../../../modules/OptionsGrid.jsx";
import '../../../styles/Events.css'
import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Spinner from "../../../modules/Spinner.jsx";
import {sessionDuration} from "../../../services/Utils.jsx";

function BookingDashboard() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkBookingSession = async () => {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});

            const sessionId = cookies.harvest_schools_booking_session_id;
            const sessionTime = parseInt(cookies.harvest_schools_booking_session_time, 10);

            if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
                document.cookie = 'harvest_schools_booking_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'harvest_schools_booking_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                navigate('/events/booking/');
                return;
            }

            try {
                const sessionResponse = await axios.post('/scripts/checkBookingSession.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!sessionResponse.data.success) {
                    navigate('/events/booking/');
                }

            } catch (error) {
                console.log(error.message);
                setIsLoading(false);
                navigate('/events/booking/');
            } finally {
                setIsLoading(false);
            }
        }

        checkBookingSession();
    }, []);

    return (
        <div className={"dashboard-page"}>
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
                                    document.cookie = 'harvest_schools_booking_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                                    document.cookie = 'harvest_schools_booking_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                                    navigate('/events/booking');
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