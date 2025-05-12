import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {checkBookingSession} from "../../../services/Utils.jsx";
import Spinner from "../../../modules/Spinner.jsx";

function BookingMedia() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkBookingSession(navigate, setIsLoading);
    }, []);



    return (
        <>
            {isLoading && (<Spinner/>)}

            <div className={'booking-media-page'}>
                <h1>
                    Booking Media
                </h1>
                <p>
                    This page is under construction.
                </p>
            </div>
        </>
    );
}

export default BookingMedia;