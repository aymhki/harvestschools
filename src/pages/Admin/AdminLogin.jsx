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
    performPasskeyMfa,
    requestPasswordReset,
    requestResetEmailCode,
    completePasswordReset,
    performPasskeyReset
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
    const [mfaStatus, setMfaStatus] = useState(null);
    const [mfaError, setMfaError] = useState(null);
    const [resendIn, setResendIn] = useState(0);
    const [emailCodeSent, setEmailCodeSent] = useState(false);
    const [loginNotice, setLoginNotice] = useState(null);
    const [loginMode, setLoginMode] = useState('checking');
    const [prefillUsername, setPrefillUsername] = useState('');
    const [resetState, setResetState] = useState(null);
    const usernameFieldId = 1
    const passwordFieldId = 2
    const mfaCodeFieldId = 3
    const forgotUsernameFieldId = 4
    const newPasswordFieldId = 5
    const confirmPasswordFieldId = 6
    const passwordPolicyRegex = '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$'
    const { t } = useTranslation(['admin'], {lng:'en'});
    const mobile = isMobileApp();

    const ADMIN_SESSION_NAMESPACE = 'harvest_schools_admin';

    const METHOD_SWITCH_LABELS = {
        passkey: 'Use a passkey',
        totp: 'Use authenticator app',
        email: 'Email me a code',
    };


    const resetMfaState = () => {
        setMfaState(null);
        setResetState(null);
        setMfaMethod(null);
        setMfaStatus(null);
        setMfaError(null);
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
            if (!silent) { setMfaStatus('A new code is on its way.'); }
        } else if (!silent || result?.code === 429) {
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
        setMfaStatus(null);
        setMfaError(null);
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

    const handleCodeMfa = async (formData) => {
        setMfaStatus(null);
        setMfaError(null);

        const code = Object.fromEntries(formData.entries())[`field_${mfaCodeFieldId}`] || '';
        const result = await completeMfa(mfaState.mfaToken, mfaMethod, code, navigate);

        if (result && !result.success) {
            if (isExpiredMfaResult(result) || result.code === 429) {
                exitMfaToFullForm(result.code === 429
                    ? 'Too many incorrect attempts. Please log in again.'
                    : 'Your verification session expired. Please log in again.');
                return true;
            }

            const suffix = typeof result.attemptsLeft === 'number' && result.attemptsLeft > 0
                ? ` ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.`
                : '';

            throw new Error((result.message || 'Verification failed') + suffix);
        }

        return true;
    };

    const handlePasskeyMfa = async () => {
        setSubmittingLocal(true);
        setMfaStatus(null);
        setMfaError(null);

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
        if (!mfaState || !mfaState.methods.includes(method) || method === mfaMethod) { return; }

        setMfaMethod(method);
        setMfaStatus(null);
        setMfaError(null);

        if (method === 'email' && !emailCodeSent) {
            sendEmailCode(mfaState.mfaToken, { silent: true });
        }
    };

    const sendResetEmailCode = useCallback(async (token, {silent = false} = {}) => {
        if (!token) { return; }

        const result = await requestResetEmailCode(token);

        if (!isMountedRef.current) { return; }

        if (typeof result?.retryAfter === 'number') {
            setResendIn(result.retryAfter);
        } else if (result?.success) {
            setResendIn(mfaResendCooldownSeconds);
        }

        if (result?.success) {
            setEmailCodeSent(true);
            setMfaError(null);
            if (!silent) { setMfaStatus('A new code is on its way.'); }
        } else if (!silent || result?.code === 429) {
            setMfaStatus(null);
            setMfaError(result?.message || 'Could not send the code. Try another method.');
        }
    }, []);

    const handleForgotPassword = async (formData) => {
        const username = Object.fromEntries(formData.entries())[`field_${forgotUsernameFieldId}`] || '';
        const result = await requestPasswordReset(username.trim());

        if (result && result.mfaRequired) {
            const usableMethods = (result.methods || []).filter(
                (m) => !(m === 'passkey' && (mobile || !passkeySupported()))
            );

            if (usableMethods.length === 0) {
                throw new Error('No verification method is available on this device. Please try from another device or contact an administrator.');
            }

            const startingMethod = usableMethods.includes(result.preferred)
                ? result.preferred
                : usableMethods[0];

            setResetState({ ...result, methods: usableMethods });
            setMfaMethod(startingMethod);
            setMfaStatus(null);
            setMfaError(null);
            setResendIn(0);
            setEmailCodeSent(false);
            setLoginMode('resetVerify');

            if (startingMethod === 'email') {
                sendResetEmailCode(result.resetToken, { silent: true });
            }

            return true;
        }

        if (result && result.success && result.adminNotified) {
            exitMfaToFullForm(result.message || 'An email has been sent to a site administrator who will reach out to help you.');
            return true;
        }

        if (result && !result.success) {
            throw new Error(result.message || 'Could not start the password reset');
        }

        return true;
    };

    const extractNewPassword = (formData) => {
        const entries = Object.fromEntries(formData.entries());
        const newPassword = entries[`field_${newPasswordFieldId}`] || '';
        const confirmPassword = entries[`field_${confirmPasswordFieldId}`] || '';

        if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        return newPassword;
    };

    const finishReset = (result) => {
        if (result && result.success) {
            exitMfaToFullForm(result.message || 'Your password has been updated. You can now log in with your new password.');
            return true;
        }

        if (result && (isExpiredMfaResult(result) || result.code === 429)) {
            exitMfaToFullForm(result.code === 429
                ? 'Too many incorrect attempts. Please start the reset again.'
                : 'Your reset session expired. Please start again.');
            return true;
        }

        const suffix = typeof result?.attemptsLeft === 'number' && result.attemptsLeft > 0
            ? ` ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.`
            : '';

        throw new Error((result?.message || 'Verification failed') + suffix);
    };

    const handleResetCodeSubmit = async (formData) => {
        setMfaStatus(null);
        setMfaError(null);

        const newPassword = extractNewPassword(formData);
        const code = Object.fromEntries(formData.entries())[`field_${mfaCodeFieldId}`] || '';
        const result = await completePasswordReset(resetState.resetToken, mfaMethod, code, newPassword);

        return finishReset(result);
    };

    const handleResetPasskeySubmit = async (formData) => {
        setMfaStatus(null);
        setMfaError(null);

        const newPassword = extractNewPassword(formData);
        const result = await performPasskeyReset(resetState.resetToken, newPassword);

        if (result && result.cancelled) {
            return true;
        }

        return finishReset(result);
    };

    const switchResetMethod = (method) => {
        if (!resetState || !resetState.methods.includes(method) || method === mfaMethod) { return; }

        setMfaMethod(method);
        setMfaStatus(null);
        setMfaError(null);

        if (method === 'email' && !emailCodeSent) {
            sendResetEmailCode(resetState.resetToken, { silent: true });
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

    const renderMfaPicker = () => {
        if (!mfaState || mfaState.methods.length <= 1) { return null; }

        return (
            <div className={'admin-login-mfa-picker'}>
                <p className={'admin-login-mfa-picker-label'}>Verify with</p>
                {mfaState.methods.map((m) => (
                    <button
                        key={m}
                        type={'button'}
                        className={m === mfaMethod ? 'current' : ''}
                        disabled={submittingLocal}
                        aria-pressed={m === mfaMethod}
                        onClick={() => switchMfaMethod(m)}
                    >
                        <span className={'admin-login-mfa-picker-radio'} aria-hidden={'true'}/>
                        {METHOD_SWITCH_LABELS[m]}
                    </button>
                ))}
            </div>
        );
    };

    const renderMfaActions = () => (
        <div className={'admin-login-mfa-actions'}>
            {mfaMethod === 'email' && (
                <button
                    type={'button'}
                    disabled={submittingLocal || resendIn > 0}
                    onClick={() => sendEmailCode(mfaState.mfaToken)}
                >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
            )}
            <button type={'button'} disabled={submittingLocal} onClick={() => exitMfaToFullForm(null)}>
                Back to login
            </button>
        </div>
    );

    const renderMfaScreen = () => (
        <div className={'admin-login-mfa'}>
            <p className={'admin-login-mfa-title'}>Verify it&apos;s you</p>

            {mfaMethod === 'passkey' ? (
                <>
                    <p className={'admin-login-mfa-instructions'}>
                        Confirm with your fingerprint, face, or device PIN.
                    </p>
                    <button type={'button'} disabled={submittingLocal} onClick={handlePasskeyMfa}>
                        Use your passkey
                    </button>
                </>
            ) : (
                <>
                    <p className={'admin-login-mfa-instructions'}>
                        {mfaMethod === 'email'
                            ? `Enter the 6-digit code sent to ${mfaState.maskedEmail}`
                            : 'Enter the 6-digit code from your authenticator app'}
                    </p>

                    <div className={'admin-login-mfa-form-wrapper'}>
                        <Form key={`mfa-${mfaMethod}`}
                              fields={[
                                  {
                                      id: mfaCodeFieldId,
                                      type: 'text',
                                      name: 'mfa-code',
                                      label: 'Verification Code',
                                      displayLabel: 'Verification Code',
                                      httpName: 'one-time-code',
                                      required: true,
                                      placeholder: '000000',
                                      errorMsg: 'Enter the 6-digit code',
                                      regex: '^[0-9]{6}$',
                                      value: '',
                                      setValue: null,
                                      widthOfField: 1,
                                      labelOutside: true,
                                      labelOnTop: true,
                                      dontLetTheBrowserSaveField: true,
                                  },
                              ]}
                              mailTo={''}
                              formTitle={`Admin MFA ${mfaMethod} Form`}
                              lang={'en'}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={false}
                              noClearOption={true}
                              centerSubmitButton={true}
                              fullMarginField={true}
                              forceEnglishForm={true}
                              hasSetSubmittingLocal={true}
                              setSubmittingLocal={setSubmittingLocal}
                              hasDifferentOnSubmitBehaviour={true}
                              differentOnSubmitBehaviour={handleCodeMfa}
                              hasDifferentSubmitButtonText={true}
                              differentSubmitButtonText={['Verify', 'Verifying...']}
                        />
                    </div>
                </>
            )}

            {mfaStatus && <p className={'admin-login-mfa-status'} role={'status'}>{mfaStatus}</p>}
            {mfaError && <p className={'admin-login-mfa-error'} role={'alert'}>{mfaError}</p>}

            {renderMfaPicker()}
            {renderMfaActions()}
        </div>
    );

    const renderResetMethodPicker = () => {
        if (!resetState || resetState.methods.length <= 1) { return null; }

        return (
            <div className={'admin-login-mfa-picker'}>
                <p className={'admin-login-mfa-picker-label'}>Verify with</p>
                {resetState.methods.map((m) => (
                    <button
                        key={m}
                        type={'button'}
                        className={m === mfaMethod ? 'current' : ''}
                        disabled={submittingLocal}
                        aria-pressed={m === mfaMethod}
                        onClick={() => switchResetMethod(m)}
                    >
                        <span className={'admin-login-mfa-picker-radio'} aria-hidden={'true'}/>
                        {METHOD_SWITCH_LABELS[m]}
                    </button>
                ))}
            </div>
        );
    };

    const buildNewPasswordFields = () => ([
        {
            id: newPasswordFieldId,
            type: 'password',
            name: 'new-password',
            label: 'New Password',
            displayLabel: 'New Password',
            httpName: 'new-password',
            required: true,
            placeholder: 'New Password',
            errorMsg: 'At least 8 characters with uppercase, lowercase, number, and special character',
            regex: passwordPolicyRegex,
            value: '',
            setValue: null,
            widthOfField: 1,
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
        },
        {
            id: confirmPasswordFieldId,
            type: 'password',
            name: 'confirm-password',
            label: 'Confirm New Password',
            displayLabel: 'Confirm New Password',
            httpName: 'new-password',
            required: true,
            placeholder: 'Confirm New Password',
            errorMsg: 'Please confirm your new password',
            value: '',
            setValue: null,
            widthOfField: 1,
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
        },
    ]);

    const renderForgotScreen = () => (
        <div className={'admin-login-mfa'}>
            <p className={'admin-login-mfa-title'}>Reset your password</p>
            <p className={'admin-login-mfa-instructions'}>
                Enter your username. If you have a verification method set up, you can reset your password with it.
            </p>

            <div className={'admin-login-mfa-form-wrapper'}>
                <Form key={'forgot-password-form'}
                      fields={[
                          {
                              id: forgotUsernameFieldId,
                              type: 'text',
                              name: 'username',
                              label: 'Username',
                              displayLabel: 'Username',
                              httpName: 'username',
                              required: true,
                              placeholder: 'Username',
                              errorMsg: 'Please enter your username',
                              value: '',
                              setValue: null,
                              widthOfField: 1,
                              labelOutside: true,
                              labelOnTop: true,
                          },
                      ]}
                      mailTo={''}
                      formTitle={'Admin Forgot Password Form'}
                      lang={'en'}
                      captchaLength={1}
                      noInputFieldsCache={true}
                      noCaptcha={false}
                      noClearOption={true}
                      centerSubmitButton={true}
                      fullMarginField={true}
                      forceEnglishForm={true}
                      hasSetSubmittingLocal={true}
                      setSubmittingLocal={setSubmittingLocal}
                      hasDifferentOnSubmitBehaviour={true}
                      differentOnSubmitBehaviour={handleForgotPassword}
                      hasDifferentSubmitButtonText={true}
                      differentSubmitButtonText={['Continue', 'Checking...']}
                />
            </div>

            <div className={'admin-login-mfa-actions'}>
                <button type={'button'} disabled={submittingLocal} onClick={() => exitMfaToFullForm(null)}>
                    Back to login
                </button>
            </div>
        </div>
    );

    const renderResetScreen = () => (
        <div className={'admin-login-mfa'}>
            <p className={'admin-login-mfa-title'}>Set a new password</p>

            <p className={'admin-login-mfa-instructions'}>
                {mfaMethod === 'passkey'
                    ? 'Choose a new password, then confirm with your fingerprint, face, or device PIN.'
                    : mfaMethod === 'email'
                        ? `Choose a new password and enter the 6-digit code sent to ${resetState.maskedEmail}`
                        : 'Choose a new password and enter the 6-digit code from your authenticator app'}
            </p>

            <div className={'admin-login-mfa-form-wrapper'}>
                <Form key={`reset-${mfaMethod}`}
                      fields={
                          mfaMethod === 'passkey'
                              ? buildNewPasswordFields()
                              : [
                                  ...buildNewPasswordFields(),
                                  {
                                      id: mfaCodeFieldId,
                                      type: 'text',
                                      name: 'mfa-code',
                                      label: 'Verification Code',
                                      displayLabel: 'Verification Code',
                                      httpName: 'one-time-code',
                                      required: true,
                                      placeholder: '000000',
                                      errorMsg: 'Enter the 6-digit code',
                                      regex: '^[0-9]{6}$',
                                      value: '',
                                      setValue: null,
                                      widthOfField: 1,
                                      labelOutside: true,
                                      labelOnTop: true,
                                      dontLetTheBrowserSaveField: true,
                                  },
                              ]
                      }
                      mailTo={''}
                      formTitle={`Admin Password Reset ${mfaMethod} Form`}
                      lang={'en'}
                      captchaLength={1}
                      noInputFieldsCache={true}
                      noCaptcha={false}
                      noClearOption={true}
                      centerSubmitButton={true}
                      fullMarginField={true}
                      forceEnglishForm={true}
                      hasSetSubmittingLocal={true}
                      setSubmittingLocal={setSubmittingLocal}
                      hasDifferentOnSubmitBehaviour={true}
                      differentOnSubmitBehaviour={mfaMethod === 'passkey' ? handleResetPasskeySubmit : handleResetCodeSubmit}
                      hasDifferentSubmitButtonText={true}
                      differentSubmitButtonText={
                          mfaMethod === 'passkey'
                              ? ['Verify with passkey', 'Verifying...']
                              : ['Reset Password', 'Resetting...']
                      }
                />
            </div>

            {mfaStatus && <p className={'admin-login-mfa-status'} role={'status'}>{mfaStatus}</p>}
            {mfaError && <p className={'admin-login-mfa-error'} role={'alert'}>{mfaError}</p>}

            {renderResetMethodPicker()}

            <div className={'admin-login-mfa-actions'}>
                {mfaMethod === 'email' && (
                    <button
                        type={'button'}
                        disabled={submittingLocal || resendIn > 0}
                        onClick={() => sendResetEmailCode(resetState.resetToken)}
                    >
                        {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                    </button>
                )}
                <button type={'button'} disabled={submittingLocal} onClick={() => exitMfaToFullForm(null)}>
                    Back to login
                </button>
            </div>
        </div>
    );

    const renderBiometricScreen = () => (
        <div className={'admin-login-biometric-only'}>
            <button
                type={'button'}
                onClick={attemptBiometricLogin}
                disabled={submittingLocal}
            >
                Login with Biometrics
            </button>
            <button
                type={'button'}
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
                <button type={'button'} onClick={resetToFirstTimeMobileExperience}>
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
                  noCaptcha={false}
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
            {loginMode === 'full' && (
                <button
                    type={'button'}
                    className={'admin-login-forgot-password-btn'}
                    disabled={submittingLocal}
                    onClick={() => {
                        resetMfaState();
                        setLoginNotice(null);
                        setLoginMode('forgot');
                    }}
                >
                    Forgot password?
                </button>
            )}
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
                        {loginMode === 'forgot' && renderForgotScreen()}
                        {loginMode === 'resetVerify' && resetState && renderResetScreen()}
                        {(loginMode === 'recovery' || loginMode === 'full') && renderForm()}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminLogin;