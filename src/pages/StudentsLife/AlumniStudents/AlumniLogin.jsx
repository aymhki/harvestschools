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
    performAlumniDiscoverablePasskeyLogin,
    requestAlumniPasswordReset,
    requestAlumniResetEmailCode,
    completeAlumniPasswordResetWithCode,
    completeAlumniPasswordResetWithPasskey,
    updateAlumniBiometricCredentials,
    submitAlumniSignup
} from "../../../services/Alumni/MainAlumniServices.jsx";
import {msgTimeout, isMobileApp, mfaResendCooldownSeconds} from "../../../services/General/GeneralUtils.jsx";
import {passkeySupported} from "../../../services/General/PasskeyUtils.jsx";
import {
    isBiometricAvailable,
    hasSavedBiometricCredentials,
    getBiometricCredentials,
    deleteBiometricCredentials,
    verifyBiometricIdentity,
    clearMobileSession,
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

    const [authView, setAuthView] = useState('signin');
    const [resetState, setResetState] = useState(null);
    const [resetUsername, setResetUsername] = useState('');
    const [resetMethod, setResetMethod] = useState(null);
    const [resetStatus, setResetStatus] = useState(null);
    const [resetError, setResetError] = useState(null);
    const [resendIn, setResendIn] = useState(0);
    const [emailCodeSent, setEmailCodeSent] = useState(false);

    const forgotUsernameFieldId = 41;
    const resetCodeFieldId = 42;
    const newPasswordFieldId = 43;
    const confirmPasswordFieldId = 44;
    const passwordPolicyRegex = '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$';

    const passkeyUsable = passkeySupported() && !isMobileApp();

    useEffect(() => {
        if (resendIn <= 0) { return undefined; }
        const timer = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
        return () => clearInterval(timer);
    }, [resendIn]);

    const resetRecoveryState = () => {
        setResetState(null);
        setResetUsername('');
        setResetMethod(null);
        setResetStatus(null);
        setResetError(null);
        setResendIn(0);
        setEmailCodeSent(false);
    };

    const backToSignIn = (notice) => {
        resetRecoveryState();
        setAuthView('signin');
        setLoginNotice(notice || null);
    };

    const sendAlumniResetEmailCode = async (resetToken, {silent = false} = {}) => {
        if (!resetToken) { return; }
        const result = await requestAlumniResetEmailCode(resetToken);
        if (!isMountedRef.current) { return; }

        if (typeof result?.retryAfter === 'number') {
            setResendIn(result.retryAfter);
        } else if (result?.success) {
            setResendIn(mfaResendCooldownSeconds);
        }

        if (result?.success) {
            setEmailCodeSent(true);
            setResetError(null);
            if (!silent) { setResetStatus('A new code is on its way.'); }
        } else if (!silent || result?.code === 429) {
            setResetStatus(null);
            setResetError(result?.message || 'Could not send the code. Try another method.');
        }
    };

    const handleAlumniForgot = async (formData) => {
        const username = (Object.fromEntries(formData.entries())[`field_${forgotUsernameFieldId}`] || '').trim();
        const result = await requestAlumniPasswordReset(username);

        if (result && result.resetRequired) {
            const usableMethods = (result.methods || []).filter((m) => !(m === 'passkey' && !passkeyUsable));
            if (usableMethods.length === 0) {
                throw new Error('No verification method is available on this device. Please try another device or contact the school.');
            }
            const startingMethod = usableMethods.includes('email') ? 'email' : usableMethods[0];
            setResetState({...result, methods: usableMethods});
            setResetUsername(username);
            setResetMethod(startingMethod);
            resetRecoveryFlags();
            setAuthView('reset');
            if (startingMethod === 'email') { sendAlumniResetEmailCode(result.resetToken, {silent: true}); }
            return true;
        }

        if (result && result.success && result.adminNotified) {
            backToSignIn(result.message || 'A site administrator has been notified and will reach out to help you.');
            return true;
        }

        if (result && !result.success) { throw new Error(result.message || 'Could not start the password reset'); }
        return true;
    };

    const resetRecoveryFlags = () => {
        setResetStatus(null);
        setResetError(null);
        setResendIn(0);
        setEmailCodeSent(false);
    };

    const extractNewAlumniPassword = (formData) => {
        const entries = Object.fromEntries(formData.entries());
        const newPassword = entries[`field_${newPasswordFieldId}`] || '';
        const confirmPassword = entries[`field_${confirmPasswordFieldId}`] || '';
        if (newPassword !== confirmPassword) { throw new Error('Passwords do not match'); }
        return newPassword;
    };

    const finishAlumniReset = async (result, newPassword) => {
        if (result && result.success) {
            backToSignIn(result.message || 'Your password has been updated. You can now sign in with your new password.');
            await updateAlumniBiometricCredentials(resetUsername, newPassword);
            return true;
        }
        if (result && (result.code === 429 || /expired/i.test(result.message || ''))) {
            backToSignIn(result.code === 429 ? 'Too many attempts. Please start again.' : 'Your reset session expired. Please start again.');
            return true;
        }
        const suffix = typeof result?.attemptsLeft === 'number' && result.attemptsLeft > 0
            ? ` ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.` : '';
        throw new Error((result?.message || 'Verification failed') + suffix);
    };

    const handleAlumniResetCode = async (formData) => {
        setResetStatus(null);
        setResetError(null);
        const newPassword = extractNewAlumniPassword(formData);
        const code = Object.fromEntries(formData.entries())[`field_${resetCodeFieldId}`] || '';
        const result = await completeAlumniPasswordResetWithCode(resetState.resetToken, code, newPassword);
        return await finishAlumniReset(result, newPassword);
    };

    const handleAlumniResetPasskey = async (formData) => {
        setResetStatus(null);
        setResetError(null);
        const newPassword = extractNewAlumniPassword(formData);
        const result = await completeAlumniPasswordResetWithPasskey(resetState.resetToken, newPassword);
        if (result && result.cancelled) { return true; }
        return await finishAlumniReset(result, newPassword);
    };

    const switchResetMethod = (method) => {
        if (!resetState || !resetState.methods.includes(method) || method === resetMethod) { return; }
        setResetMethod(method);
        setResetStatus(null);
        setResetError(null);
        if (method === 'email' && !emailCodeSent) { sendAlumniResetEmailCode(resetState.resetToken, {silent: true}); }
    };

    const handleDiscoverablePasskeyLogin = async () => {
        if (submittingLocal) { return; }
        setSubmittingLocal(true);
        try {
            const result = await performAlumniDiscoverablePasskeyLogin(navigate);
            if (result && !result.success && !result.cancelled) {
                setPasskeyError(result.message || t("students-life-pages.alumni-login-page.passkey-failed"));
                setTimeout(() => setPasskeyError(''), msgTimeout);
            }
        } finally {
            setSubmittingLocal(false);
        }
    };

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
        await clearMobileSession(ALUMNI_SESSION_NAME);

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

    const buildNewPasswordFields = () => ([
        {
            id: newPasswordFieldId, type: 'password', name: 'new-password',
            label: 'New Password', displayLabel: t("students-life-pages.alumni-login-page.new-password-field"),
            httpName: 'new-password', required: true,
            placeholder: t("students-life-pages.alumni-login-page.new-password-field"),
            errorMsg: t("students-life-pages.alumni-login-page.password-policy-error"),
            regex: passwordPolicyRegex, value: '', setValue: null, widthOfField: 1,
            labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
        },
        {
            id: confirmPasswordFieldId, type: 'password', name: 'confirm-password',
            label: 'Confirm New Password', displayLabel: t("students-life-pages.alumni-login-page.confirm-new-password-field"),
            httpName: 'new-password', required: true,
            placeholder: t("students-life-pages.alumni-login-page.confirm-new-password-field"),
            errorMsg: t("students-life-pages.alumni-login-page.confirm-password-error"),
            value: '', setValue: null, widthOfField: 1, mustMatchFieldWithId: newPasswordFieldId,
            labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
        },
    ]);

    const renderResetMethodPicker = () => {
        if (!resetState || resetState.methods.length <= 1) { return null; }
        const labels = {
            email: t("students-life-pages.alumni-login-page.reset-method-email"),
            passkey: t("students-life-pages.alumni-login-page.reset-method-passkey"),
        };
        return (
            <div className={'alumni-login-method-picker'}>
                <p className={'alumni-login-method-picker-label'}>
                    {t("students-life-pages.alumni-login-page.verify-with")}
                </p>
                {resetState.methods.map((m) => (
                    <button key={m} type={'button'} disabled={submittingLocal}
                            className={m === resetMethod ? 'current' : ''}
                            aria-pressed={m === resetMethod}
                            onClick={() => switchResetMethod(m)}>
                        <span className={'alumni-login-method-radio'} aria-hidden={'true'}/>
                        {labels[m]}
                    </button>
                ))}
            </div>
        );
    };

    const renderAlumniForgotScreen = () => (
        <div className={"alumni-login-tab-content"}>
            <h2 className={"alumni-login-recovery-title"}>{t("students-life-pages.alumni-login-page.forgot-title")}</h2>
            <p>{t("students-life-pages.alumni-login-page.forgot-instructions")}</p>
            <Form key={'alumni-forgot-form'}
                  mailTo={''} sendPdf={false} formTitle={'Alumni Forgot Password Form'} noSuccessMessage={true}
                  lang={'en'} captchaLength={1} noInputFieldsCache={true} noCaptcha={false}
                  noClearOption={true} centerSubmitButton={true} fullMarginField={true}
                  hasSetSubmittingLocal={true} setSubmittingLocal={setSubmittingLocal}
                  hasDifferentOnSubmitBehaviour={true} differentOnSubmitBehaviour={handleAlumniForgot}
                  hasDifferentSubmitButtonText={true}
                  differentSubmitButtonText={[t("students-life-pages.alumni-login-page.forgot-continue"), t("students-life-pages.alumni-login-page.checking")]}
                  fields={[{
                      id: forgotUsernameFieldId, type: 'text', name: 'username',
                      label: 'Username', displayLabel: t("students-life-pages.alumni-login-page.username-field"),
                      httpName: 'username', required: true,
                      placeholder: t("students-life-pages.alumni-login-page.username-field"),
                      errorMsg: t("students-life-pages.alumni-login-page.username-required"),
                      value: '', setValue: null, widthOfField: 1, labelOutside: true, labelOnTop: true,
                  }]}
            />
            <p className={"alumni-login-switch-mode"} onClick={() => backToSignIn(null)}>
                {t("students-life-pages.alumni-login-page.back-to-sign-in")}
            </p>
        </div>
    );

    const renderAlumniResetScreen = () => (
        <div className={"alumni-login-tab-content"}>
            <h2 className={"alumni-login-recovery-title"}>{t("students-life-pages.alumni-login-page.reset-title")}</h2>
            <p>
                {resetMethod === 'passkey'
                    ? t("students-life-pages.alumni-login-page.reset-instructions-passkey")
                    : t("students-life-pages.alumni-login-page.reset-instructions-email", {email: resetState?.maskedEmail || ''})}
            </p>
            <Form key={`alumni-reset-${resetMethod}`}
                  mailTo={''} sendPdf={false} formTitle={`Alumni Password Reset ${resetMethod} Form`} noSuccessMessage={true}
                  lang={'en'} captchaLength={1} noInputFieldsCache={true} noCaptcha={false}
                  noClearOption={true} centerSubmitButton={true} fullMarginField={true}
                  formHasPasswordField={true}
                  hasSetSubmittingLocal={true} setSubmittingLocal={setSubmittingLocal}
                  hasDifferentOnSubmitBehaviour={true}
                  differentOnSubmitBehaviour={resetMethod === 'passkey' ? handleAlumniResetPasskey : handleAlumniResetCode}
                  hasDifferentSubmitButtonText={true}
                  differentSubmitButtonText={resetMethod === 'passkey'
                      ? [t("students-life-pages.alumni-login-page.reset-with-passkey"), t("students-life-pages.alumni-login-page.verifying")]
                      : [t("students-life-pages.alumni-login-page.reset-submit"), t("students-life-pages.alumni-login-page.resetting")]}
                  fields={resetMethod === 'passkey' ? buildNewPasswordFields() : [
                      ...buildNewPasswordFields(),
                      {
                          id: resetCodeFieldId, type: 'text', name: 'reset-code',
                          label: 'Verification Code', displayLabel: t("students-life-pages.alumni-login-page.verification-code-field"),
                          httpName: 'one-time-code', required: true, placeholder: '000000',
                          errorMsg: t("students-life-pages.alumni-login-page.verification-code-error"),
                          regex: '^[0-9]{6}$', value: '', setValue: null, widthOfField: 1,
                          labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
                      },
                  ]}
            />

            {resetStatus && <p className={"alumni-inline-status-message"} role={'status'}>{resetStatus}</p>}
            {resetError && <p className={"alumni-inline-error-message"} role={'alert'}>{resetError}</p>}

            {renderResetMethodPicker()}

            <div className={"alumni-login-method-switch"}>
                {resetMethod === 'email' && (
                    <button type={'button'} disabled={submittingLocal || resendIn > 0}
                            onClick={() => sendAlumniResetEmailCode(resetState.resetToken)}>
                        {resendIn > 0
                            ? t("students-life-pages.alumni-login-page.resend-in", {seconds: resendIn})
                            : t("students-life-pages.alumni-login-page.resend-code")}
                    </button>
                )}
                <button type={'button'} disabled={submittingLocal} onClick={() => backToSignIn(null)}>
                    {t("students-life-pages.alumni-login-page.back-to-sign-in")}
                </button>
            </div>
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
                            authView === 'forgot' ? renderAlumniForgotScreen()
                            : authView === 'reset' ? renderAlumniResetScreen()
                            : (
                            <div className={"alumni-login-tab-content"}>

                                {loginMode === 'recovery' && (
                                    <div className={"alumni-login-method-switch"}>
                                        <button type={'button'} onClick={resetToFirstTimeMobileExperience}>
                                            {t("students-life-pages.alumni-login-page.biometric-different-login")}
                                        </button>
                                    </div>
                                )}

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

                                {passkeyError && (
                                    <p className={"alumni-inline-error-message"}>{passkeyError}</p>
                                )}

                                <div className={"alumni-login-method-switch"}>
                                    <div ref={signInAlumniStudentButtonsRef} className="modal-footer-buttons-portal-target"/>

                                    {passkeyUsable && (
                                        <button type={'button'} className={'alumni-login-passkey-btn'} disabled={submittingLocal}
                                                onClick={handleDiscoverablePasskeyLogin}>
                                            {t("students-life-pages.alumni-login-page.use-a-passkey")}
                                        </button>
                                    )}
                                </div>

                                <div className={"alumni-login-secondary-links"}>
                                    <span className={"alumni-login-switch-mode"} onClick={() => setMode('sign-up')}>
                                        {t("students-life-pages.alumni-login-page.switch-to-sign-up")}
                                    </span>
                                    <span className={'alumni-login-switch-mode'}
                                            onClick={() => { resetRecoveryState(); setLoginNotice(null); setAuthView('forgot'); }}>
                                        {t("students-life-pages.alumni-login-page.forgot-password")}
                                    </span>
                                </div>

                            </div>
                            )
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