import Spinner from "../../../modules/Spinner.jsx";
import {useEffect, useState} from "react";
import {checkBookingSession} from "../../../services/Utils.jsx";
import {useNavigate} from "react-router-dom";

function BookingExtras() {
    const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
       checkBookingSession(navigate, setIsLoading);
   }, [])

    return (
        <>
            {isLoading && (<Spinner/>)}

            <div className={'booking-extras-page'}>
                <h1>
                    Booking Extras
                </h1>
                <p>
                    This page is under construction.
                </p>
            </div>
        </>
    );
}

export default BookingExtras;