import '../../styles/AdminLogin.css'
import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Form from '../../modules/Form.jsx'
import {headToAdminDashboardOnValidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx"
import {
    validateAdminLogin,
    validateAdminLoginWithCredentials,
    isMobileApp,
    requestEmailCode,
    completeMfa,
    performPasskeyMfa
} from "../../services/Admin/Session/MainAdminServices.jsx";
import {useTranslation} from "react-i18next";
import {
    isBiometricAvailable,
    hasSavedBiometricCredentials,
    getBiometricCredentials,
    deleteBiometricCredentials,
    clearMobileSession,
    verifyBiometricIdentity,
} from "../../services/General/CapacitorSecureAuthUtils.jsx";
import {passkeySupported} from "../../services/General/PasskeyUtils.jsx";
import {mfaResendCooldownSeconds} from "../../services/General/GeneralUtils.jsx";

function AdminLogin() {
    const navigate = useNavigate();
    const isMountedRef = useRef(true);
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const [mfaState, setMfaState] = useState(null);
    const [mfaMethod, setMfaMethod] = useState(null);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaError, setMfaError] = useState(null);
    const [mfaStatus, setMfaStatus] = useState(null);
    const [showAltMethods, setShowAltMethods] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [emailCodeSent, setEmailCodeSent] = useState(false);
    const [loginNotice, setLoginNotice] = useState(null);
    const [loginMode, setLoginMode] = useState('checking');
    const [prefillUsername, setPrefillUsername] = useState('');
    const usernameFieldId = 1
    const passwordFieldId = 2
    const { t } = useTranslation(['admin'], {lng:'en'});
    const mobile = isMobileApp();

    const ADMIN_SESSION_NAMESPACE = 'harvest_schools_admin';

    const METHOD_LABELS = {
        passkey: 'Passkey',
        totp: 'Authenticator app',
        email: 'Email code',
    };

    const METHOD_PICKER_LABELS = {
        passkey: 'Use a passkey',
        totp: 'Use my authenticator app',
        email: 'Email me a code',
    };

    const resetMfaState = () => {
        setMfaState(null);
        setMfaMethod(null);
        setMfaCode('');
        setMfaError(null);
        setMfaStatus(null);
        setShowAltMethods(false);
        setResendIn(0);
        setEmailCodeSent(false);
    };

    const exitMfaToFullForm = (notice) => {
        resetMfaState();
        setLoginNotice(notice || null);
        setLoginMode('full');
    };

    const isExpiredMfaResult = (result) =>
        result && result.code === 401 && /expired/i.test(result.message || '');


    useEffect(() => {
        if (resendIn <= 0) { return undefined; }

        const timer = setInterval(() => {
            setResendIn((seconds) => (seconds <= 1 ? 0 : seconds - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [resendIn]);

    const sendEmailCode = useCallback(async (token, {silent = false} = {}) => {
        if (!token) { return; }

        const result = await requestEmailCode(token);

        if (!isMountedRef.current) { return; }

        if (typeof result?.retryAfter === 'number') {
            setResendIn(result.retryAfter);
        } else if (result?.success) {
            setResendIn(mfaResendCooldownSeconds);
        }

        if (result?.success) {
            setEmailCodeSent(true);
            setMfaError(null);
            if (!silent) {
                setMfaStatus(result.maskedEmail
                    ? `A new code is on its way to ${result.maskedEmail}.`
                    : 'A new code is on its way.');
            }
        } else if (result?.code === 429) {
            setMfaStatus(null);
            setMfaError(result.message || 'Please wait before requesting another code.');
        } else if (!silent) {
            setMfaStatus(null);
            setMfaError(result?.message || 'Could not send the code. Try another method.');
        }
    }, []);

    const enterMfa = useCallback((result, usableMethods) => {
        const startingMethod = usableMethods.includes(result.preferred)
            ? result.preferred
            : usableMethods[0];

        setMfaState({ ...result, methods: usableMethods });
        setMfaMethod(startingMethod);
        setMfaCode('');
        setMfaError(null);
        setMfaStatus(null);
        setShowAltMethods(false);
        setResendIn(0);
        setEmailCodeSent(false);
        setLoginMode('mfa');

        if (startingMethod === 'email') {
            sendEmailCode(result.mfaToken, { silent: true });
        }
    }, [sendEmailCode]);

    const handleAdminLogin = async (formData) => {
        if (submittingLocal) {return;}

        setSubmittingLocal(true);
        setLoginNotice(null);

        try {
            const result = await validateAdminLogin(formData, usernameFieldId, passwordFieldId, navigate);

            if (result && result.mfaRequired) {
                const usableMethods = (result.methods || []).filter(
                    (m) => !(m === 'passkey' && (mobile || !passkeySupported()))
                );

                if (usableMethods.length === 0) {
                    throw new Error('No verification method is available on this device. Please log in from another device or contact an administrator.');
                }

                enterMfa(result, usableMethods);

                return true;
            }

            if (result && !result.success) {
                throw new Error(result.message);
            }

            return true;

        } catch (error) {
            throw new Error(error.message);
        } finally {
            setSubmittingLocal(false);
        }
    };

    const handleCodeMfa = async () => {
        setSubmittingLocal(true);
        setMfaError(null);
        setMfaStatus(null);

        try {
            const result = await completeMfa(mfaState.mfaToken, mfaMethod, mfaCode, navigate);

            if (result && !result.success) {
                if (isExpiredMfaResult(result) || result.code === 429) {
                    exitMfaToFullForm(result.code === 429
                        ? 'Too many incorrect attempts. Please log in again.'
                        : 'Your verification session expired. Please log in again.');
                } else {
                    const suffix = typeof result.attemptsLeft === 'number' && result.attemptsLeft > 0
                        ? ` ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.`
                        : '';
                    setMfaError((result.message || 'Verification failed') + suffix);
                    setMfaCode('');
                }
            }
        } finally {
            setSubmittingLocal(false);
        }
    };

    const handlePasskeyMfa = async () => {
        setSubmittingLocal(true);
        setMfaError(null);
        setMfaStatus(null);

        try {
            const result = await performPasskeyMfa(mfaState.mfaToken, navigate);

            if (result && !result.success && !result.cancelled) {
                if (isExpiredMfaResult(result) || result.code === 429) {
                    exitMfaToFullForm(result.code === 429
                        ? 'Too many incorrect attempts. Please log in again.'
                        : 'Your verification session expired. Please log in again.');
                } else {
                    setMfaError(result.message || 'Passkey verification failed');
                }
            }
        } finally {
            setSubmittingLocal(false);
        }
    };

    const switchMfaMethod = (method) => {
        if (!mfaState || !mfaState.methods.includes(method)) { return; }

        setShowAltMethods(false);

        if (method === mfaMethod) { return; }

        setMfaMethod(method);
        setMfaCode('');
        setMfaError(null);
        setMfaStatus(null);

        if (method === 'email' && !emailCodeSent) {
            sendEmailCode(mfaState.mfaToken, { silent: true });
        }
    };

    const resetToFirstTimeMobileExperience = async () => {
        await deleteBiometricCredentials(ADMIN_SESSION_NAMESPACE);
        await clearMobileSession(ADMIN_SESSION_NAMESPACE);

        if (isMountedRef.current) {
            setPrefillUsername('');
            setLoginMode('full');
        }
    };

    const attemptBiometricLogin = async () => {
        setSubmittingLocal(true);
        try {
            const verified = await verifyBiometricIdentity({
                reason: 'Log in to the admin dashboard',
                title: 'Admin Login',
                subtitle: 'Use your biometrics to sign in',
                description: 'Confirm your identity to continue',
                fallbackTitle: 'Log in to the admin dashboard',
            });
            if (!verified) {
                return;
            }

            const credentials = await getBiometricCredentials(ADMIN_SESSION_NAMESPACE);
            if (!credentials || !credentials.username || !credentials.password) {
                return;
            }

            const result = await validateAdminLoginWithCredentials(
                credentials.username,
                credentials.password,
                navigate
            );

            if (result && result.mfaRequired) {
                const usableMethods = (result.methods || []).filter((m) => m !== 'passkey');

                if (usableMethods.length === 0) {
                    if (isMountedRef.current) {
                        setLoginNotice('No verification method is available on this device. Please log in from another device or contact an administrator.');
                        setLoginMode('full');
                    }
                    return;
                }

                if (isMountedRef.current) {
                    enterMfa(result, usableMethods);
                }

                return;
            }

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
                }
            }
        } finally {
            if (isMountedRef.current) {
                setSubmittingLocal(false);
            }
        }
    };

    useEffect(() => {
        isMountedRef.current = true;

        const autoSessionCheck = async () => {
            setSubmittingLocal(true);

            try {
                await headToAdminDashboardOnValidSession(navigate, setSubmittingLocal);

                if (!isMountedRef.current) {return;}

                if (!mobile) {
                    setLoginMode('full');
                    return;
                }

                const biometricHardwareAvailable = await isBiometricAvailable();
                if (!isMountedRef.current) {return;}

                if (!biometricHardwareAvailable) {
                    setLoginMode('full');
                    return;
                }

                const credentialsSaved = await hasSavedBiometricCredentials(ADMIN_SESSION_NAMESPACE);
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

    const renderMfaMethodPicker = () => {
        if (!mfaState || mfaState.methods.length <= 1) { return null; }

        return (
            <div className={'admin-login-mfa-switcher'}>
                <button
                    type={'button'}
                    className={'admin-login-mfa-secondary-button'}
                    disabled={submittingLocal}
                    aria-expanded={showAltMethods}
                    onClick={() => setShowAltMethods(v => !v)}
                >
                    Authenticate another way
                </button>

                {showAltMethods && (
                    <div className={'admin-login-mfa-alt-methods'} role={'group'} aria-label={'Verification methods'}>
                        {mfaState.methods.map((m) => (
                            <button
                                key={m}
                                type={'button'}
                                className={`admin-login-mfa-alt-method-button${m === mfaMethod ? ' current' : ''}`}
                                disabled={submittingLocal}
                                aria-pressed={m === mfaMethod}
                                onClick={() => switchMfaMethod(m)}
                            >
                                <span className={'admin-login-mfa-alt-method-radio'} aria-hidden={'true'}/>
                                <span className={'admin-login-mfa-alt-method-label'}>
                                    {METHOD_PICKER_LABELS[m]}
                                </span>
                                {m === mfaMethod && (
                                    <span className={'admin-login-mfa-alt-method-current'}>Current</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderMfaScreen = () => (
        <div className={'admin-login-mfa'}>
            <p className={'admin-login-mfa-title'}>
                Verify it&apos;s you
            </p>

            <p className={'admin-login-mfa-method-chip'}>
                {METHOD_LABELS[mfaMethod] || 'Verification'}
            </p>

            {mfaMethod === 'passkey' ? (
                <div className={'admin-login-mfa-panel'}>
                    <p className={'admin-login-mfa-instructions'}>
                        Confirm with your fingerprint, face, or device PIN.
                    </p>
                    <button
                        type={'button'}
                        className={'admin-login-mfa-primary-button'}
                        disabled={submittingLocal}
                        onClick={handlePasskeyMfa}
                    >
                        Use your passkey
                    </button>
                </div>
            ) : (
                <div className={'admin-login-mfa-panel'}>
                    <p className={'admin-login-mfa-instructions'}>
                        {mfaMethod === 'email'
                            ? `Enter the 6-digit code sent to ${mfaState.maskedEmail}`
                            : 'Open your authenticator app and enter the 6-digit code it is showing'}
                    </p>

                    <input
                        className={'admin-login-mfa-code-input'}
                        type={'text'}
                        inputMode={'numeric'}
                        autoComplete={'one-time-code'}
                        maxLength={6}
                        placeholder={'000000'}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                    />

                    <button
                        type={'button'}
                        className={'admin-login-mfa-primary-button'}
                        disabled={submittingLocal || mfaCode.length !== 6}
                        onClick={handleCodeMfa}
                    >
                        Verify
                    </button>

                    {mfaMethod === 'email' && (
                        <>
                            <button
                                type={'button'}
                                className={'admin-login-mfa-secondary-button'}
                                disabled={submittingLocal || resendIn > 0}
                                onClick={() => sendEmailCode(mfaState.mfaToken)}
                            >
                                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                            </button>
                            <p className={'admin-login-mfa-fineprint'}>
                                Codes we sent you earlier still work. Resending does not cancel them.
                            </p>
                        </>
                    )}
                </div>
            )}

            {mfaStatus && <p className={'admin-login-mfa-status'} role={'status'}>{mfaStatus}</p>}
            {mfaError && <p className={'admin-login-mfa-error'} role={'alert'}>{mfaError}</p>}

            {renderMfaMethodPicker()}

            <button
                type={'button'}
                className={'admin-login-recovery-cancel'}
                disabled={submittingLocal}
                onClick={() => exitMfaToFullForm(null)}
            >
                Back to login
            </button>
        </div>
    );

    const renderBiometricScreen = () => (
        <div className={'admin-login-biometric-only'}>
            <button
                type={'button'}
                className={'admin-login-biometric-button'}
                onClick={attemptBiometricLogin}
                disabled={submittingLocal}
            >
                Login with Biometrics
            </button>
            <button
                type={'button'}
                className={'admin-login-recovery-cancel'}
                onClick={() => {
                    setLoginMode('full')
                }}
                disabled={submittingLocal}
            >
                Try a different login
            </button>
        </div>
    );

    const renderForm = () => (
        <div className={'admin-login-recovery-only-prompt-wrapper'}>
            {loginMode === 'recovery' && (
                <button
                    type={'button'}
                    className={'admin-login-recovery-cancel'}
                    onClick={resetToFirstTimeMobileExperience}
                >
                    Try a different login
                </button>
            )}
            <Form key={loginMode === 'recovery' ? 'recovery-form' : 'normal-form'}
                  mailTo={''}
                  sendPdf={false}
                  formTitle={t("admin.login-page.title")}
                  lang={'en'}
                  captchaLength={1}
                  noInputFieldsCache={true}
                  noCaptcha={loginMode === 'recovery'}
                  hasDifferentOnSubmitBehaviour={true}
                  differentOnSubmitBehaviour={handleAdminLogin}
                  hasDifferentSubmitButtonText={true}
                  differentSubmitButtonText={[t("admin.login-page.login-btn"), t("admin.login-page.logging-in-btn")]}
                  noClearOption={true}
                  centerSubmitButton={true}
                  easySimpleCaptcha={true}
                  fullMarginField={true}
                  hasSetSubmittingLocal={true}
                  setSubmittingLocal={setSubmittingLocal}
                  forceEnglishForm={true}
                  fields={
                      [
                          {
                              id: usernameFieldId,
                              type: 'text',
                              name: 'username',
                              label: 'Username',
                              displayLabel: t("admin.login-page.username-field"),
                              required: true,
                              placeholder: t("admin.login-page.username-field"),
                              errorMsg: 'Please enter username',
                              value: prefillUsername,
                              setValue: null,
                              widthOfField: 1,
                              httpName: 'username',
                          },
                          {
                              id: passwordFieldId,
                              type: 'password',
                              name: 'password',
                              label: 'Password',
                              displayLabel: t("admin.login-page.password-field"),
                              required: true,
                              placeholder: t("admin.login-page.password-field"),
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
    );

    return (
        <>
            {submittingLocal && <Spinner/>}
            <div className={'admin-login-page'}>
                <div className={'admin-login-page-form-controller'}>
                    <div className={'admin-login-form-wrapper'}>
                        {loginMode !== 'checking' && (
                            <h2>
                                {t("admin.login-page.title")}
                            </h2>
                        )}
                        {loginNotice && (loginMode === 'full' || loginMode === 'recovery') && (
                            <p className={'admin-login-notice'}>{loginNotice}</p>
                        )}
                        {loginMode === 'biometric' && renderBiometricScreen()}
                        {loginMode === 'mfa' && mfaState && renderMfaScreen()}
                        {(loginMode === 'recovery' || loginMode === 'full') && renderForm()}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminLogin;
