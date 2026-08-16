import {useNavigate} from "react-router";
import {useEffect} from "react";
import PhotoCollage from "../../../modules/PhotoCollage.jsx";
import '../../../styles/Events.css'
import {useTranslation} from "react-i18next";
import {headToEventBookingLoginOnInvalidSession} from "../../../services/Parents/EventBookings/EventBookingNavigationServices.jsx";
import { useLoading } from '../../../services/General/GlobalLoadingService.jsx'

function EventBookingMedia() {
    const {t} = useTranslation(['events-pages'])
    const navigate = useNavigate();
    const [, setIsLoading] = useLoading(false);

    useEffect(() => {
        headToEventBookingLoginOnInvalidSession(navigate, setIsLoading);
    }, []);

    return (
        <>

            <div className={'booking-media-page'}>
                <div className={'extreme-padding-container make-this-container-have-gaps'}>
                    
                    <h1>
                        {t("events-pages.event-booking-pages.booking-media-page.title")}
                    </h1>
                    
                    <PhotoCollage type={'slider'} photos={
                        [
                            {
                                src: '/videos/EventsPages/BookingMedia1.v2.mp4',
                                alt: 'Booking Media 1',
                                isVideo: true,
                            }
                        ]
                    } collagePreview={
                        {
                            src: '/videos/EventsPages/BookingMedia1.v2.mp4',
                            alt: 'Booking Media 1',
                            isVideo: true,
                        }
                    }
                    title={t("events-pages.event-booking-pages.booking-media-page.rehearsals")}
                    
                    />
                    
                    <p>
                        {t("events-pages.event-booking-pages.booking-media-page.stay-tuned-for-more")}
                    </p>
                </div>
            </div>
        </>
    );
}

export default EventBookingMedia;

