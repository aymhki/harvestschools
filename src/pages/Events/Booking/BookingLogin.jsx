import {Helmet} from "react-helmet-async";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Spinner from "../../../modules/Spinner.jsx";
import Form from "../../../modules/Form.jsx";
import '../../../styles/Events.css'
import {validateBookingLogin} from "../../../services/MainParentsBookingServices.jsx";
import {useTranslation} from "react-i18next";
import {headToBookingDashboardOnValidSession} from "../../../services/BookingNavigationServices.jsx";

function BookingLogin() {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const usernameFieldId = 1
    const passwordFieldId = 2

    const handleBookingLogin = async (formData) => {
        if (submittingLocal) {return;}
        setSubmittingLocal(true);

        try {
            const result = await validateBookingLogin(formData, usernameFieldId, passwordFieldId, navigate);

            if (result && !result.success) {
                throw new Error(result.message || result);
            } else {
                return true;
            }
        } catch (error) {
            throw new Error(error.message);
        } finally {
            setSubmittingLocal(false);
        }
    }

    useEffect (() => {
        headToBookingDashboardOnValidSession(navigate, setSubmittingLocal)
    }, [])

    return (
        <>
            {submittingLocal && <Spinner/>}

            <Helmet>
                <title>Harvest International School | Events | Booking</title>
                <meta name="description" content="Access booking info, extras, and media."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, Booking,  سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className={'booking-login-page'}>
                <div className={'booking-login-page-form-controller'}>
                    <div className={'booking-login-form-wrapper'}>
                        <h2>
                            {t("events-pages.booking-pages.login-page.title")}
                        </h2>

                        <Form mailTo={''}
                              sendPdf={false}
                              formTitle={t("events-pages.booking-pages.login-page.title")}
                              lang={'en'}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              hasDifferentOnSubmitBehaviour={true}
                              differentOnSubmitBehaviour={handleBookingLogin}
                              hasDifferentSubmitButtonText={true}
                              differentSubmitButtonText={[t("events-pages.booking-pages.login-page.login-btn"), t("events-pages.booking-pages.login-page.logging-in-btn")]}
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
                                          displayLabel: t("events-pages.booking-pages.login-page.username-field"),
                                          placeholder: t("events-pages.booking-pages.login-page.username-field"),
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
                                          displayLabel: t("events-pages.booking-pages.login-page.password-field"),
                                          placeholder: t("events-pages.booking-pages.login-page.password-field"),
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


