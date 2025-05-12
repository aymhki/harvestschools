import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {checkBookingSession, getCookies} from "../../../services/Utils.jsx";
import Spinner from "../../../modules/Spinner.jsx";
import axios from "axios";

function BookingStatusInfo() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkBookingSession(navigate, setIsLoading).then(
            () => {
                fetchBookingBySessionId();
            }
        )
    }, [])

    const fetchBookingBySessionId = async () => {
        try {
            setIsLoading(true);
            const cookies = getCookies();
            const sessionId = cookies.harvest_schools_booking_session_id;

            const response = await axios.post('/scripts/getBookingBySession.php', {
                sessionId: sessionId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });



            const result = await response.json();

            if (result.success) {
                console.log(result.bookingId);
                console.log(result.bookingUsername);
                console.log(result.sessionId);
                console.log(result.detailedData);
                console.log(result.tabularData);
                console.log(result.executionTime);

            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }


    }

    return (
        <>
            {isLoading && (<Spinner/>)}

            <div className={'booking-info-page'}>
                <h1>
                    Booking Info
                </h1>
                <p>
                    This page is under construction.
                </p>
            </div>
        </>
    );
}

export default BookingStatusInfo;