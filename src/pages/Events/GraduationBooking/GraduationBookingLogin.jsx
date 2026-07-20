import {Helmet} from "react-helmet-async";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import Spinner from "../../../modules/Spinner.jsx";
import Form from "../../../modules/Form.jsx";
import '../../../styles/Events.css'
import {
    GRADUATION_BOOKING_SESSION_NAME,
    validateGraduationBookingLogin,
    validateGraduationBookingLoginWithCredentials
} from "../../../services/Parents/GraduationBookings/MainParentsGraduationBookingServices.jsx";
import {useTranslation} from "react-i18next";
import {headToGraduationBookingDashboardOnValidSession} from "../../../services/Parents/GraduationBookings/GraduationBookingNavigationServices.jsx";
import {isMobileApp} from "../../../services/General/GeneralUtils.jsx";
import {
    isBiometricAvailable,
    hasSavedBiometricCredentials,
    getBiometricCredentials,
    deleteBiometricCredentials,
    verifyBiometricIdentity,
} from "../../../services/General/CapacitorSecureAuthUtils.jsx";

function GraduationBookingLogin() {
    const navigate = useNavigate();
    const {t} = useTranslation(['events-pages']);
    const isMountedRef = useRef(true);
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const [loginMode, setLoginMode] = useState('checking');
    const [prefillUsername, setPrefillUsername] = useState('');
    const [loginNotice, setLoginNotice] = useState(null);
    const usernameFieldId = 1
    const passwordFieldId = 2

    const handleBookingLogin = async (formData) => {
        if (submittingLocal) {return;}
        setSubmittingLocal(true);

        try {
            const result = await validateGraduationBookingLogin(formData, usernameFieldId, passwordFieldId, navigate);

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

    const resetToFirstTimeMobileExperience = async () => {
        await deleteBiometricCredentials(GRADUATION_BOOKING_SESSION_NAME);

        if (isMountedRef.current) {
            setPrefillUsername('');
            setLoginNotice(null);
            setLoginMode('full');
        }
    };

    const attemptBiometricLogin = async () => {
        setSubmittingLocal(true);
        try {
            const verified = await verifyBiometricIdentity({
                reason: 'Log in to your graduation booking',
                title: 'Booking Sign In',
                subtitle: 'Use your biometrics to sign in',
                description: 'Confirm your identity to continue',
                fallbackTitle: 'Log in to your graduation booking',
            });

            if (!verified) {
                return;
            }

            const credentials = await getBiometricCredentials(GRADUATION_BOOKING_SESSION_NAME);
            if (!credentials || !credentials.username || !credentials.password) {
                return;
            }

            const result = await validateGraduationBookingLoginWithCredentials(
                credentials.username,
                credentials.password,
                navigate
            );

            if (result && !result.success) {
                const credentialsLikelyChanged = result.code === 401 || result.code === 404;
                if (credentialsLikelyChanged) {
                    const wantsToUpdateCredentials = window.confirm(
                        "Did you change your username or password? Tap OK to enter your new username and password. Tap Cancel to remove biometric sign-in on this device."
                    );
                    if (wantsToUpdateCredentials) {
                        if (isMountedRef.current) {
                            setPrefillUsername(credentials.username);
                            setLoginMode('recovery');
                        }
                    } else {
                        await resetToFirstTimeMobileExperience();
                    }
                } else if (isMountedRef.current) {
                    setLoginNotice(result.message || 'Could not sign in with biometrics. Please try again.');
                }
            }
        } finally {
            if (isMountedRef.current) {
                setSubmittingLocal(false);
            }
        }
    };

    useEffect (() => {
        isMountedRef.current = true;

        const autoSessionCheck = async () => {
            setSubmittingLocal(true);

            try {
                await headToGraduationBookingDashboardOnValidSession(navigate, setSubmittingLocal);

                if (!isMountedRef.current) {return;}

                if (!isMobileApp()) {
                    setLoginMode('full');
                    return;
                }

                const biometricHardwareAvailable = await isBiometricAvailable();
                if (!isMountedRef.current) {return;}

                if (!biometricHardwareAvailable) {
                    setLoginMode('full');
                    return;
                }

                const credentialsSaved = await hasSavedBiometricCredentials(GRADUATION_BOOKING_SESSION_NAME);
                if (!isMountedRef.current) {return;}

                if (credentialsSaved) {
                    setLoginMode('biometric');
                } else {
                    setLoginMode('full');
                }
            } finally {
                if (isMountedRef.current) {
                    setSubmittingLocal(false);
                }
            }
        };

        autoSessionCheck();

        return () => {
            isMountedRef.current = false;
        };
    }, [])

    const renderBiometricScreen = () => (
        <div className={'booking-login-biometric-only'}>
            <button
                type={'button'}
                onClick={attemptBiometricLogin}
                disabled={submittingLocal}
            >
                {t("events-pages.graduation-booking-pages.login-page.biometric-button")}
            </button>
            <button
                type={'button'}
                onClick={() => {
                    setLoginNotice(null);
                    setLoginMode('full');
                }}
                disabled={submittingLocal}
            >
                {t("events-pages.graduation-booking-pages.login-page.biometric-different-login")}
            </button>
        </div>
    );

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
                        {loginMode !== 'checking' && (
                            <h2>
                                {t("events-pages.graduation-booking-pages.login-page.title")}
                            </h2>
                        )}

                        {loginNotice && loginMode !== 'biometric' && (
                            <p className={'booking-login-notice'}>{loginNotice}</p>
                        )}

                        {loginMode === 'biometric' && renderBiometricScreen()}

                        {(loginMode === 'full' || loginMode === 'recovery') && (
                        <>
                        {loginMode === 'recovery' && (
                            <button type={'button'} className={'booking-login-different-login-btn'} onClick={resetToFirstTimeMobileExperience}>
                                {t("events-pages.graduation-booking-pages.login-page.biometric-different-login")}
                            </button>
                        )}
                        <Form key={loginMode === 'recovery' ? 'booking-recovery-form' : 'booking-normal-form'}
                              mailTo={''}
                              sendPdf={false}
                              formTitle={t("events-pages.graduation-booking-pages.login-page.title")}
                              lang={'en'}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              hasDifferentOnSubmitBehaviour={true}
                              differentOnSubmitBehaviour={handleBookingLogin}
                              hasDifferentSubmitButtonText={true}
                              differentSubmitButtonText={[t("events-pages.graduation-booking-pages.login-page.login-btn"), t("events-pages.graduation-booking-pages.login-page.logging-in-btn")]}
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
                                          displayLabel: t("events-pages.graduation-booking-pages.login-page.username-field"),
                                          placeholder: t("events-pages.graduation-booking-pages.login-page.username-field"),
                                          errorMsg: 'Please enter username',
                                          value: '',
                                          defaultValue: prefillUsername,
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
                                          displayLabel: t("events-pages.graduation-booking-pages.login-page.password-field"),
                                          placeholder: t("events-pages.graduation-booking-pages.login-page.password-field"),
                                          errorMsg: 'Please enter password',
                                          widthOfField: 1,
                                          value: '',
                                          setValue: null,
                                          httpName: 'password',
                                      },
                                  ]
                              }
                        />
                        </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default GraduationBookingLogin;


