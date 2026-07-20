import {Helmet} from "react-helmet-async";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";

import Spinner from "../../../modules/Spinner.jsx";
import Form from "../../../modules/Form.jsx";

import '../../../styles/AlumniStudents.css';

import {headToAlumniProfileOnValidSession} from "../../../services/Alumni/AlumniNavigationServices.jsx";
import {
    ALUMNI_SESSION_NAME,
    validateAlumniLogin,
    validateAlumniLoginWithCredentials,
    performAlumniPasskeyLogin,
    submitAlumniSignup
} from "../../../services/Alumni/MainAlumniServices.jsx";
import {msgTimeout, isMobileApp} from "../../../services/General/GeneralUtils.jsx";
import {passkeySupported} from "../../../services/General/PasskeyUtils.jsx";
import {
    isBiometricAvailable,
    hasSavedBiometricCredentials,
    getBiometricCredentials,
    deleteBiometricCredentials,
    verifyBiometricIdentity,
} from "../../../services/General/CapacitorSecureAuthUtils.jsx";


function AlumniLogin() {
    const navigate = useNavigate();
    const {t} = useTranslation(['students-life-pages']);
    const isMountedRef = useRef(true);

    const [submittingLocal, setSubmittingLocal] = useState(false);
    const [mode, setMode] = useState('sign-in');
    const [loginMode, setLoginMode] = useState('checking');
    const [prefillUsername, setPrefillUsername] = useState('');
    const [loginNotice, setLoginNotice] = useState(null);

    const [signInMethod, setSignInMethod] = useState(passkeySupported() ? 'passkey' : 'password');
    const [passkeyError, setPasskeyError] = useState('');


    const [signupSuccess, setSignupSuccess] = useState(false);
    const [signupSuccessMessage, setSignupSuccessMessage] = useState('');

    const signInAlumniStudentButtonsRef = useRef(null);

    const signInUsernameFieldId = 1;
    const signInPasswordFieldId = 2;

    const signUpUsernameFieldId = 11;
    const signUpNameFieldId = 12;
    const signUpEmailFieldId = 13;
    const signUpPositionFieldId = 14;
    const signUpGraduationDateFieldId = 15;
    const signUpBioFieldId = 16;
    const signUpPasswordFieldId = 17;
    const signUpConfirmPasswordFieldId = 18;
    const signUpProfilePictureFieldId = 19;
    const signUpProfilePictureFieldLabel = 'Profile Picture';

    useEffect(() => {
        isMountedRef.current = true;

        const autoSessionCheck = async () => {
            setSubmittingLocal(true);

            try {
                await headToAlumniProfileOnValidSession(navigate, setSubmittingLocal);

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

                const credentialsSaved = await hasSavedBiometricCredentials(ALUMNI_SESSION_NAME);
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
    }, []);

    const resetToFirstTimeMobileExperience = async () => {
        await deleteBiometricCredentials(ALUMNI_SESSION_NAME);

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
                reason: 'Log in to your alumni profile',
                title: 'Alumni Sign In',
                subtitle: 'Use your biometrics to sign in',
                description: 'Confirm your identity to continue',
                fallbackTitle: 'Log in to your alumni profile',
            });

            if (!verified) {
                return;
            }

            const credentials = await getBiometricCredentials(ALUMNI_SESSION_NAME);
            if (!credentials || !credentials.username || !credentials.password) {
                return;
            }

            const result = await validateAlumniLoginWithCredentials(
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
                            setSignInMethod('password');
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

    const handleAlumniLogin = async (formData) => {
        if (submittingLocal) {
            return;
        }

        setSubmittingLocal(true);

        try {
            const result = await validateAlumniLogin(formData, signInUsernameFieldId, signInPasswordFieldId, navigate);

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

    const handlePasskeyLogin = async (formData) => {
        if (submittingLocal) {
            return;
        }

        const username = formData?.get(`field_${signInUsernameFieldId}`)?.toString().trim();

        if (!username) {
            setPasskeyError(t("students-life-pages.alumni-login-page.passkey-missing-username"));
            setTimeout(() => setPasskeyError(''), msgTimeout);
            return;
        }

        setSubmittingLocal(true);

        try {
            const result = await performAlumniPasskeyLogin(username, navigate);

            if (result && !result.success && !result.cancelled) {
                setPasskeyError(result.message || t("students-life-pages.alumni-login-page.passkey-failed"));
                setTimeout(() => setPasskeyError(''), msgTimeout);
            } else {
                return true;
            }
        } catch (error) {
            setPasskeyError(error.message);
            setTimeout(() => setPasskeyError(''), msgTimeout);
        } finally {
            setSubmittingLocal(false);
        }
    }

    const handleAlumniSignup = async (formData) => {
        if (submittingLocal) {
            return;
        }

        setSubmittingLocal(true);

        try {
            const formDataJson = Object.fromEntries(formData.entries());
            const signupFormData = new FormData();

            signupFormData.append('username', formDataJson[`field_${signUpUsernameFieldId}`] || '');
            signupFormData.append('name', formDataJson[`field_${signUpNameFieldId}`] || '');
            signupFormData.append('email', formDataJson[`field_${signUpEmailFieldId}`] || '');
            signupFormData.append('position', formDataJson[`field_${signUpPositionFieldId}`] || '');
            signupFormData.append('graduation_date', formDataJson[`field_${signUpGraduationDateFieldId}`] || '');
            signupFormData.append('bio', formDataJson[`field_${signUpBioFieldId}`] || '');
            signupFormData.append('password', formDataJson[`field_${signUpPasswordFieldId}`] || '');
            signupFormData.append('confirm_password', formDataJson[`field_${signUpConfirmPasswordFieldId}`] || '');

            const profilePicture = formData.get(signUpProfilePictureFieldLabel);

            if (profilePicture instanceof File && profilePicture.size > 0) {
                signupFormData.append('profile_picture', profilePicture, profilePicture.name);
            }

            const turnstileToken = formData.get('cf-turnstile-response');

            if (turnstileToken) {
                signupFormData.append('cf-turnstile-response', turnstileToken);
            }

            const result = await submitAlumniSignup(signupFormData);

            if (result && result.success) {
                const message = result.message || t("students-life-pages.alumni-login-page.sign-up-success");

                setSignupSuccessMessage(message);
                setSignupSuccess(true);

                return message;
            } else {
                throw new Error((result && result.message) || 'An error occurred while signing up.');
            }
        } catch (error) {
            throw new Error(error.message);
        } finally {
            setSubmittingLocal(false);
        }
    }

    const signInUsernameField = {
        id: signInUsernameFieldId,
        type: 'text',
        name: 'username',
        label: 'Username',
        required: true,
        displayLabel: t("students-life-pages.alumni-login-page.username-field"),
        placeholder: t("students-life-pages.alumni-login-page.username-field"),
        errorMsg: 'Please enter your username',
        value: '',
        defaultValue: prefillUsername,
        setValue: null,
        widthOfField: 1,
        httpName: 'username',
    };

    const signInPasswordField = {
        id: signInPasswordFieldId,
        type: 'password',
        name: 'password',
        label: 'Password',
        required: true,
        displayLabel: t("students-life-pages.alumni-login-page.password-field"),
        placeholder: t("students-life-pages.alumni-login-page.password-field"),
        errorMsg: 'Please enter your password',
        value: '',
        setValue: null,
        widthOfField: 1,
        httpName: 'password',
    };

    const isPasskeyMode = signInMethod === 'passkey' && passkeySupported() && !isMobileApp();

    const renderBiometricScreen = () => (
        <div className={"alumni-login-biometric-only"}>
            <button
                type={'button'}
                onClick={attemptBiometricLogin}
                disabled={submittingLocal}
            >
                {t("students-life-pages.alumni-login-page.biometric-button")}
            </button>
            <button
                type={'button'}
                onClick={() => {
                    setLoginNotice(null);
                    setLoginMode('full');
                }}
                disabled={submittingLocal}
            >
                {t("students-life-pages.alumni-login-page.biometric-different-login")}
            </button>
        </div>
    );

    return (
        <>
            {submittingLocal && <Spinner/>}

            <Helmet>
                <title>Harvest International School | Students Life | Alumni Sign In</title>
                <meta name="description" content="Sign in or sign up to the Harvest International School alumni students platform to share your stories, updates, and achievements with the Harvest community."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Alumni, Alumni Sign In, Alumni Sign Up, خريجين, تسجيل دخول الخريجين"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className={'alumni-login-page'}>
                <div className={'alumni-login-page-form-controller'}>
                    <div className={`alumni-login-form-wrapper ${mode === 'sign-up' ? 'sign-up-wrapper-variant' : ''}`}>

                        <h2>
                            {mode === 'sign-in'
                                ? t("students-life-pages.alumni-login-page.sign-in-title")
                                : t("students-life-pages.alumni-login-page.sign-up-title")}
                        </h2>


                        {(!signupSuccess) && !(mode === 'sign-in' && loginMode === 'biometric') && (
                            <p>
                            {mode === 'sign-in'
                                ? t("students-life-pages.alumni-login-page.sign-in-description")
                                : t("students-life-pages.alumni-login-page.sign-up-description")}
                            </p>
                        )}

                        {mode === 'sign-in' && loginNotice && loginMode !== 'biometric' && (
                            <p className={"alumni-inline-error-message"}>{loginNotice}</p>
                        )}

                        {mode === 'sign-in' ? (
                            loginMode === 'biometric' ? (
                                renderBiometricScreen()
                            ) : loginMode === 'checking' ? null : (
                            <div className={"alumni-login-tab-content"}>

                                {loginMode === 'recovery' && (
                                    <div className={"alumni-login-method-switch"}>
                                        <button type={'button'} onClick={resetToFirstTimeMobileExperience}>
                                            {t("students-life-pages.alumni-login-page.biometric-different-login")}
                                        </button>
                                    </div>
                                )}

                                {isPasskeyMode ? (
                                    <Form key={"alumni-sign-in-passkey-form"}
                                          mailTo={''}
                                          sendPdf={false}
                                          formTitle={"Alumni Sign In Form"}
                                          lang={'en'}
                                          captchaLength={1}
                                          noInputFieldsCache={true}
                                          noCaptcha={false}
                                          hasDifferentOnSubmitBehaviour={true}
                                          differentOnSubmitBehaviour={handlePasskeyLogin}
                                          hasDifferentSubmitButtonText={true}
                                          differentSubmitButtonText={[t("students-life-pages.alumni-login-page.passkey-button"), t("students-life-pages.alumni-login-page.signing-in-button")]}
                                          noClearOption={true}
                                          centerSubmitButton={true}
                                          fullMarginField={true}
                                          hasSetSubmittingLocal={true}
                                          setSubmittingLocal={setSubmittingLocal}
                                          fields={[signInUsernameField]}
                                          formFooterButtonsAreOutside={true}
                                          footerButtonsPortalTarget={signInAlumniStudentButtonsRef}
                                    />
                                ) : (
                                    <Form key={"alumni-sign-in-password-form"}
                                          mailTo={''}
                                          sendPdf={false}
                                          formTitle={"Alumni Sign In Form"}
                                          lang={'en'}
                                          captchaLength={1}
                                          noInputFieldsCache={true}
                                          noCaptcha={false}
                                          hasDifferentOnSubmitBehaviour={true}
                                          differentOnSubmitBehaviour={handleAlumniLogin}
                                          hasDifferentSubmitButtonText={true}
                                          differentSubmitButtonText={[t("students-life-pages.alumni-login-page.sign-in-button"), t("students-life-pages.alumni-login-page.signing-in-button")]}
                                          noClearOption={true}
                                          centerSubmitButton={true}
                                          fullMarginField={true}
                                          hasSetSubmittingLocal={true}
                                          setSubmittingLocal={setSubmittingLocal}
                                          formHasPasswordField={true}
                                          fields={[signInUsernameField, signInPasswordField]}
                                          formFooterButtonsAreOutside={true}
                                          footerButtonsPortalTarget={signInAlumniStudentButtonsRef}
                                    />
                                )}

                                {passkeyError && (
                                    <p className={"alumni-inline-error-message"}>{passkeyError}</p>
                                )}

                                <div className={'alumni-login-buttons-wrapper'}>

                                </div>


                                <div className={"alumni-login-method-switch"}>
                                    <div ref={signInAlumniStudentButtonsRef} className="modal-footer-buttons-portal-target"/>

                                    {isPasskeyMode ? (
                                        <button onClick={() => setSignInMethod('password')}>
                                            {t("students-life-pages.alumni-login-page.sign-in-with-password-instead")}
                                        </button>
                                    ) : (passkeySupported() && !isMobileApp()) && (
                                        <button onClick={() => setSignInMethod('passkey')}>
                                            {t("students-life-pages.alumni-login-page.sign-in-with-passkey-instead")}
                                        </button>
                                    )}
                                </div>

                                <p className={"alumni-login-switch-mode"} onClick={() => setMode('sign-up')}>
                                    {t("students-life-pages.alumni-login-page.switch-to-sign-up")}
                                </p>

                            </div>
                            )
                        ) : (
                            <div className={"alumni-login-tab-content"}>

                                {signupSuccess ? (
                                    <div className={"alumni-signup-success-message"}>
                                        <p>{signupSuccessMessage}</p>
                                    </div>
                                ) : (
                                    <Form key={"alumni-sign-up-form"}
                                          mailTo={''}
                                          sendPdf={false}
                                          formTitle={"Alumni Sign Up Form"}
                                          lang={'en'}
                                          captchaLength={1}
                                          noInputFieldsCache={true}
                                          hasDifferentOnSubmitBehaviour={true}
                                          differentOnSubmitBehaviour={handleAlumniSignup}
                                          hasDifferentSubmitButtonText={true}
                                          differentSubmitButtonText={[t("students-life-pages.alumni-login-page.sign-up-button"), t("students-life-pages.alumni-login-page.signing-up-button")]}
                                          noClearOption={true}
                                          centerSubmitButton={true}
                                          fullMarginField={true}
                                          hasSetSubmittingLocal={true}
                                          setSubmittingLocal={setSubmittingLocal}
                                          formHasPasswordField={true}
                                          fields={[
                                              {
                                                  id: signUpUsernameFieldId,
                                                  type: 'text',
                                                  name: 'username',
                                                  label: 'Username',
                                                  required: true,
                                                  displayLabel: t("students-life-pages.alumni-login-page.username-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.username-field"),
                                                  errorMsg: 'Username must be 3-30 characters of letters, numbers, and underscores',
                                                  regex: '^[a-zA-Z0-9_]{3,30}$',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 3,
                                                  httpName: 'username',
                                              },
                                              {
                                                  id: signUpNameFieldId,
                                                  type: 'text',
                                                  name: 'name',
                                                  label: 'Full Name',
                                                  required: true,
                                                  displayLabel: t("students-life-pages.alumni-login-page.name-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.name-field"),
                                                  errorMsg: 'Please enter your full name',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 3,
                                                  httpName: 'name',
                                              },
                                              {
                                                  id: signUpEmailFieldId,
                                                  type: 'email',
                                                  name: 'email',
                                                  label: 'Email',
                                                  required: true,
                                                  displayLabel: t("students-life-pages.alumni-login-page.email-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.email-field"),
                                                  errorMsg: 'Please enter a valid email address',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 3,
                                                  httpName: 'email',
                                              },
                                              {
                                                  id: signUpPositionFieldId,
                                                  type: 'text',
                                                  name: 'position',
                                                  label: 'Current Position',
                                                  required: false,
                                                  displayLabel: t("students-life-pages.alumni-login-page.position-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.position-field-placeholder"),
                                                  errorMsg: 'Please enter your current position',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 2,
                                                  httpName: 'position',
                                              },
                                              {
                                                  id: signUpGraduationDateFieldId,
                                                  type: 'date',
                                                  name: 'graduation-date',
                                                  label: 'Graduation Date',
                                                  required: true,
                                                  displayLabel: t("students-life-pages.alumni-login-page.graduation-date-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.graduation-date-field"),
                                                  errorMsg: 'Please enter your graduation date',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 2,
                                                  httpName: 'graduation-date',
                                              },
                                              {
                                                  id: signUpBioFieldId,
                                                  type: 'textarea',
                                                  name: 'bio',
                                                  label: 'About You',
                                                  required: false,
                                                  displayLabel: t("students-life-pages.alumni-login-page.bio-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.bio-field-placeholder"),
                                                  errorMsg: 'Please tell us about yourself',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 2,
                                                  httpName: 'bio',
                                              },
                                              {
                                                  id: signUpProfilePictureFieldId,
                                                  type: 'file',
                                                  name: 'profile-picture',
                                                  label: signUpProfilePictureFieldLabel,
                                                  required: false,
                                                  displayLabel: t("students-life-pages.alumni-login-page.profile-picture-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.profile-picture-field"),
                                                  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff', 'image/svg+xml', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
                                                  errorMsg: 'Please upload your profile picture in a valid image format',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 2,
                                                  httpName: 'profile-picture',
                                              },
                                              {
                                                  id: signUpPasswordFieldId,
                                                  type: 'password',
                                                  name: 'password',
                                                  label: 'Password',
                                                  required: true,
                                                  displayLabel: t("students-life-pages.alumni-login-page.password-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.password-field"),
                                                  errorMsg: 'Password must be at least 8 characters with an uppercase letter, a lowercase letter, a number, and a special character',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 2,
                                                  httpName: 'password',
                                              },
                                              {
                                                  id: signUpConfirmPasswordFieldId,
                                                  type: 'password',
                                                  name: 'confirm-password',
                                                  label: 'Confirm Password',
                                                  required: true,
                                                  displayLabel: t("students-life-pages.alumni-login-page.confirm-password-field"),
                                                  placeholder: t("students-life-pages.alumni-login-page.confirm-password-field"),
                                                  errorMsg: 'Please confirm your password',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 2,
                                                  httpName: 'confirm-password',
                                                  mustMatchFieldWithId: signUpPasswordFieldId,
                                              },
                                          ]}
                                    />
                                )}

                                {!signupSuccess && (
                                    <p className={"alumni-login-switch-mode"} onClick={() => setMode('sign-in')}>
                                        {t("students-life-pages.alumni-login-page.switch-to-sign-in")}
                                    </p>
                                )}

                            </div>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}

export default AlumniLogin;