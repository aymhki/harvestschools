import {Helmet} from "react-helmet";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";
import {v4 as uuidv4} from "uuid";
import Spinner from "../../../modules/Spinner.jsx";
import Form from "../../../modules/Form.jsx";
import '../../../styles/Events.css'
import {sessionDuration, sessionDurationInHours, getCookies} from "../../../services/Utils.jsx";

function BookingLogin() {
    const navigate = useNavigate();
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const usernameFieldId = 1
    const passwordFieldId = 2

    const handleBookingLogin = async (formData) => {

        if (submittingLocal) {
            return;
        }

        const formDataEntries = Array.from(formData.entries());
        const username = formDataEntries.find(entry => entry[0] ===  ('field_' + usernameFieldId) )[1];
        const password = formDataEntries.find(entry => entry[0] ===  ('field_' + passwordFieldId) )[1];

        try {
            const response = await axios.post('/scripts/validateBookingLogin.php', {
                username,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const sessionId = uuidv4();
                const sessionExpiry = new Date();
                sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
                document.cookie = `harvest_schools_booking_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
                document.cookie = `harvest_schools_booking_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;

                const sessionResponse = await axios.post('/scripts/createBookingSession.php', {
                    username: username,
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (sessionResponse.data.success) {
                    navigate('/events/booking/dashboard');
                } else {
                    throw new Error('Session creation failed. Please try again');
                }
            } else {
                throw new Error('Login failed. Wrong Username or Password. Please try again');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            } else {
                throw new Error(error.message);
            }
        }
    }

    useEffect(() => {
        const checkBookingSession = async () => {
            const cookies = getCookies();
            const sessionId = cookies.harvest_schools_booking_session_id;
            const sessionTime = parseInt(cookies.harvest_schools_booking_session_time, 10);

            if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
                document.cookie = 'harvest_schools_booking_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'harvest_schools_booking_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                return;
            }

            try {
                const response = await axios.post('/scripts/checkBookingSession.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    navigate('/events/booking/dashboard');
                }
            } catch (error) {
                console.log(error.message);
            }
        }

        checkBookingSession().then(() => {
            console.log('Session checked')
        })
    }, [])

    return (
        <>
            {submittingLocal && <Spinner/>}

            <Helmet>
                <title>Harvest International School | Events | Booking</title>
                <meta name="description"
                      content="Access booking info, extras, and media."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, Booking,  سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className={'booking-login-page'}>
                <div className={'booking-login-page-form-controller'}>
                    <div className={'booking-login-form-wrapper'}>
                        <h2>Booking Login</h2>

                        <Form mailTo={''}
                              sendPdf={false}
                              formTitle={'Booking Login'}
                              lang={'en'}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              hasDifferentOnSubmitBehaviour={true}
                              differentOnSubmitBehaviour={handleBookingLogin}
                              hasDifferentSubmitButtonText={true}
                              differentSubmitButtonText={['Login', 'Logging in...', 'تسجيل دخول', 'جاري تسجيل الدخول...']}
                              noClearOption={true}
                              centerSubmitButton={true}
                              easySimpleCaptcha={true}
                              fullMarginField={true}
                              hasSetSubmittingLocal={true}
                              setSubmittingLocal={setSubmittingLocal}
                              fields={
                                  [
                                      {
                                          id: usernameFieldId,
                                          type: 'text',
                                          name: 'username',
                                          label: 'Username',
                                          required: true,
                                          placeholder: 'Username',
                                          errorMsg: 'Please enter username',
                                          value: '',
                                          setValue: null,
                                          widthOfField: 1,
                                          httpName: 'username',


                                      },
                                      {
                                          id: passwordFieldId,
                                          type: 'password',
                                          name: 'password',
                                          label: 'Password',
                                          required: true,
                                          placeholder: 'Password',
                                          errorMsg: 'Please enter password',
                                          widthOfField: 1,
                                          value: '',
                                          setValue: null,
                                          httpName: 'password',
                                      },
                                  ]
                              }
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default BookingLogin;