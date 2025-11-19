import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {headToBookingLoginOnInvalidSession} from "../../../services/Utils.jsx";
import Spinner from "../../../modules/Spinner.jsx";
import PhotoCollage from "../../../modules/PhotoCollage.jsx";
import '../../../styles/Events.css'
import {useTranslation} from "react-i18next";

function BookingMedia() {
    const {t} = useTranslation()
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        headToBookingLoginOnInvalidSession(navigate, setIsLoading);
    }, []);

    return (
        <>
            {isLoading && (<Spinner/>)}

            <div className={'booking-media-page'}>
                <div className={'extreme-padding-container make-this-container-have-gaps'}>
                    
                    <h1>
                        {t("events-pages.booking-pages.booking-media-page.title")}
                    </h1>
                    
                    <PhotoCollage type={'slider'} photos={
                        [
                            {
                                src: '/assets/videos/EventsPages/BookingMedia1.mp4',
                                alt: 'Booking Media 1',
                                isVideo: true,
                            }
                        ]
                    } collagePreview={
                        {
                            src: '/assets/videos/EventsPages/BookingMedia1.mp4',
                            alt: 'Booking Media 1',
                            isVideo: true,
                        }
                    }
                    title={t("events-pages.booking-pages.booking-media-page.rehearsals")}
                    
                    />
                    
                    <p>
                        {t("events-pages.booking-pages.booking-media-page.stay-tuned-for-more")}
                    </p>
                </div>
            </div>
        </>
    );
}

export default BookingMedia;

