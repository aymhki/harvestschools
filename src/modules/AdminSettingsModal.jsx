import '../styles/AdminDashboard.css';
import '../styles/AdminSettings.css';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useSpring, animated} from 'react-spring';
import QRCode from 'qrcode';
import PropTypes from 'prop-types';
import Form from './Form.jsx';
import Spinner from './Spinner.jsx';
import {
    fetchMyAccount,
    dismissPasskeyPrompt,
    requestEmailChange,
    resendEmailVerification,
    confirmEmailChange,
    cancelEmailChange,
    setPreferredMfa,
    startTotpSetup,
    confirmTotpSetup,
    cancelTotpSetup,
    requestStepUp,
    resendStepUpEmailCode,
    verifyStepUpCode,
    verifyStepUpPasskey,
    registerPasskey,
    removePasskey,
    listSessions,
    revokeSession,
    revokeAllOtherSessions,
} from '../services/Admin/Session/AdminSettingsServices.jsx';
import {passkeySupported} from '../services/General/PasskeyUtils.jsx';
import {isMobileApp} from '../services/Admin/Session/MainAdminServices.jsx';
import {adminLoginPageUrl, msgTimeout} from '../services/General/GeneralUtils.jsx';

const METHOD_LABELS = {
    passkey: 'Passkey',
    totp: 'Authenticator app',
    email: 'Email code',
};

const METHOD_BLURBS = {
    passkey: 'Fingerprint, face or device PIN.',
    totp: 'A rotating code from an authenticator app.',
    email: 'A code sent to your verified address.',
};

const STEP_UP_ACTION_LABELS = {
    update_profile: 'update your name, username or password',
    change_email: 'change the email address on your account',
    remove_email: 'remove the email address from your account',
    setup_totp: 'replace your authenticator app',
    remove_totp: 'remove your authenticator app',
    remove_passkey: 'remove this passkey',
};

const bootstrapPasswordField = (id) => ({
    id,
    type: 'password',
    name: 'current-password',
    label: 'Current Password',
    displayLabel: 'Current Password',
    httpName: 'current-password',
    required: true,
    placeholder: 'Current Password',
    errorMsg: 'Please enter your current password',
    value: '',
    setValue: null,
    widthOfField: 1,
    labelOutside: true,
    labelOnTop: true,
    dontLetTheBrowserSaveField: true,
});

const codeField = (id, displayLabel) => ({
    id,
    type: 'text',
    name: 'code',
    label: 'Verification Code',
    displayLabel,
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
});

function AdminSettingsModal({show, notice, onClose, setRefreshCurrentUserData}) {
    const navigate = useNavigate();

    const PROFILE_TAB = 'profile';
    const SECURITY_TAB = 'security';

    const [activeTab, setActiveTab] = useState(PROFILE_TAB);
    const [account, setAccount] = useState(null);
    const [isBusy, setIsBusy] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const [emailPanel, setEmailPanel] = useState(null);
    const [resendIn, setResendIn] = useState(0);

    const [totpSetup, setTotpSetup] = useState(null);
    const [sessions, setSessions] = useState(null);

    const [stepUp, setStepUp] = useState(null);
    const [stepUpMethod, setStepUpMethod] = useState(null);
    const [stepUpResendIn, setStepUpResendIn] = useState(0);

    const profileFooterRef = useRef(null);
    const [, forceFooterRender] = useState(0);
    const statusTimerRef = useRef(null);
    const isMountedRef = useRef(true);

    const canUsePasskeys = passkeySupported() && !isMobileApp();

    const animateSettingsModal = useSpring({
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(-100%)',
    });

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (statusTimerRef.current) { clearTimeout(statusTimerRef.current); }
        };
    }, []);

    useEffect(() => {
        if (show && account && activeTab === PROFILE_TAB) {
            forceFooterRender((n) => n + 1);
        }
    }, [show, account, activeTab]);

    const contentRef = useRef(null);

    const flash = useCallback((msg, isError) => {
        setStatusMsg(isError ? null : msg);
        setErrorMsg(isError ? msg : null);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        if (statusTimerRef.current) { clearTimeout(statusTimerRef.current); }
        statusTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) { setStatusMsg(null); setErrorMsg(null); }
        }, msgTimeout);
    }, []);

    const handleSessionExpired = (result) => {
        if (result && result.code === 401 && /session/i.test(result.message || '')) {
            navigate(adminLoginPageUrl, { replace: true });
            return true;
        }
        return false;
    };

    const loadSessions = useCallback(async () => {
        const result = await listSessions();
        if (!isMountedRef.current) { return; }
        if (result && result.success) { setSessions(result.sessions || []); }
    }, []);

    const loadAccount = useCallback(async () => {
        const result = await fetchMyAccount();

        if (!isMountedRef.current) { return; }

        if (result && result.success && result.account) {
            setAccount(result.account);

            if (result.account.pendingEmail) {
                setResendIn(result.account.verifySendState?.retryAfter ?? 0);
            }

            if (!result.account.gateClosed) { await loadSessions(); }
        } else if (!handleSessionExpired(result)) {
            flash((result && result.message) || 'Could not load account details', true);
        }
    }, [flash, loadSessions]);

    useEffect(() => {
        if (!show) { return; }

        setAccount(null);
        setTotpSetup(null);
        setEmailPanel(null);
        setSessions(null);
        setStepUp(null);
        setStepUpMethod(null);
        setStatusMsg(null);
        setErrorMsg(null);
        setActiveTab(notice === 'mfa_setup' || notice === 'passkey_prompt' ? SECURITY_TAB : PROFILE_TAB);
        loadAccount();
    }, [show, notice, loadAccount]);


    useEffect(() => {
        if (account?.gateClosed) { setActiveTab(SECURITY_TAB); }
    }, [account?.gateClosed]);

    useEffect(() => {
        if (resendIn <= 0) { return undefined; }
        const timer = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
        return () => clearInterval(timer);
    }, [resendIn]);

    const stepUpEmailSentRef = useRef(false);

    useEffect(() => {
        if (!stepUp) { stepUpEmailSentRef.current = false; return; }
        if (stepUpMethod !== 'email' || stepUpEmailSentRef.current) { return; }

        stepUpEmailSentRef.current = true;

        (async () => {
            const result = await resendStepUpEmailCode(stepUp.token);
            if (!isMountedRef.current) { return; }
            if (typeof result?.retryAfter === 'number') { setStepUpResendIn(result.retryAfter); }
            if (result && !result.success && result.code !== 429) {
                flash(result.message || 'Could not send the code', true);
            }
        })();
    }, [stepUp, stepUpMethod, flash]);

    useEffect(() => {
        if (stepUpResendIn <= 0) { return undefined; }
        const timer = setInterval(() => setStepUpResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
        return () => clearInterval(timer);
    }, [stepUpResendIn]);

    const availableMethods = account?.availableMethods || [];
    const hasAnyMethod = availableMethods.length > 0;
    const pendingEmail = account?.pendingEmail;
    const gateClosed = !!account?.gateClosed;

    const refreshAll = async () => {
        await loadAccount();
        if (setRefreshCurrentUserData) { setRefreshCurrentUserData(true); }
    };

    const beginStepUp = async (action, payload = {}) => {
        const result = await requestStepUp(action, payload);

        if (result && result.success) {

            setStepUp({
                token: result.stepUpToken,
                action: result.action,
                methods: result.methods || [],
                maskedEmail: result.maskedEmail,
            });

            setStepUpMethod(result.preferred);
            setStepUpResendIn(result.retryAfter || 0);
            stepUpEmailSentRef.current = !!result.emailSent;
            return true;
        }

        if (handleSessionExpired(result)) {
            return true;
        }

        throw new Error((result && result.message) || 'Could not start verification');
    };

    const applyStepUpResult = async (result) => {
        if (result.action === 'setup_totp' && result.otpauthUri) {
            const qrDataUrl = await QRCode.toDataURL(result.otpauthUri, { width: 220, margin: 1 });
            setTotpSetup({ secret: result.secret, qrDataUrl, isReplacement: !!result.isReplacement });
        }

        setStepUp(null);
        setStepUpMethod(null);
        setEmailPanel(null);
        flash(result.message || 'Done.');
        await refreshAll();
    };

    const handleStepUpSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const result = await verifyStepUpCode(stepUp.token, stepUpMethod, values[`field_${stepUpCodeFieldId}`]);

        if (result && result.success) {
            await applyStepUpResult(result);
            return true;
        }

        if (handleSessionExpired(result)) { return true; }

        if (result && (result.code === 429 || result.code === 401) && /expired|Start again/i.test(result.message || '')) {
            setStepUp(null);
            setStepUpMethod(null);
            throw new Error(result.message);
        }

        const left = typeof result?.attemptsLeft === 'number' && result.attemptsLeft > 0
            ? ` ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.`
            : '';

        throw new Error(((result && result.message) || 'Verification failed') + left);
    };

    const handleStepUpPasskey = async () => {
        setIsBusy(true);

        try {
            const result = await verifyStepUpPasskey(stepUp.token);

            if (result && result.success) {
                await applyStepUpResult(result);
            } else if (result && !result.cancelled && !handleSessionExpired(result)) {
                flash(result.message || 'Passkey verification failed', true);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleStepUpResend = async () => {
        if (stepUpResendIn > 0) { return; }

        setIsBusy(true);

        try {
            const result = await resendStepUpEmailCode(stepUp.token);
            if (typeof result?.retryAfter === 'number') { setStepUpResendIn(result.retryAfter); }

            if (result && result.success) {
                flash('Code sent.');
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not send the code', true);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const cancelStepUp = () => {
        setStepUp(null);
        setStepUpMethod(null);
        setStepUpResendIn(0);
    };

    const nameFieldId = 1;
    const usernameFieldId = 2;
    const newPasswordFieldId = 3;
    const confirmNewPasswordFieldId = 4;
    const emailFieldId = 10;
    const emailBootstrapPasswordFieldId = 11;
    const emailCodeFieldId = 13;
    const passkeyLabelFieldId = 20;
    const totpCodeFieldId = 30;
    const stepUpCodeFieldId = 40;


    const handleProfileSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const newPassword = values[`field_${newPasswordFieldId}`] || '';

        if (newPassword !== (values[`field_${confirmNewPasswordFieldId}`] || '')) {
            throw new Error('New passwords do not match');
        }

        return beginStepUp('update_profile', {
            name: values[`field_${nameFieldId}`],
            username: values[`field_${usernameFieldId}`],
            new_password: newPassword,
        });
    };


    const handleEmailSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const email = (values[`field_${emailFieldId}`] || '').trim();

        if (hasAnyMethod) { return beginStepUp('change_email', { email }); }

        const result = await requestEmailChange(email, values[`field_${emailBootstrapPasswordFieldId}`]);

        if (result && result.success) {
            setEmailPanel(null);
            setResendIn(result.retryAfter || 0);
            flash(result.message || 'Check your inbox for the code.');
            await refreshAll();
            return true;
        }

        if (handleSessionExpired(result)) { return true; }

        throw new Error((result && result.message) || 'Could not update your email');
    };

    const handleVerifyEmailSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const result = await confirmEmailChange(values[`field_${emailCodeFieldId}`]);

        if (result && result.success) {
            flash(result.message || 'Email verified.');
            await refreshAll();
            return true;
        }

        if (handleSessionExpired(result)) { return true; }

        throw new Error((result && result.message) || 'That code did not work');
    };

    const handleResendVerification = async () => {
        if (resendIn > 0) { return; }

        setIsBusy(true);

        try {
            const result = await resendEmailVerification();
            if (typeof result?.retryAfter === 'number') { setResendIn(result.retryAfter); }

            if (result && result.success) {
                flash(result.message || 'Code sent.');
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not send the code', true);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleCancelEmailChange = async () => {
        setIsBusy(true);

        try {
            const result = await cancelEmailChange();

            if (result && result.success) {
                setResendIn(0);
                flash('Email change cancelled.');
                await refreshAll();
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not cancel', true);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleRemoveEmail = async () => {
        if (!window.confirm('Remove your email address?')) { return; }

        setIsBusy(true);

        try {
            await beginStepUp('remove_email');
        } catch (error) {
            flash(error.message, true);
        } finally {
            setIsBusy(false);
        }
    };

    const handleSetPreferred = async (method) => {
        if (account?.preferredMfa === method) { return; }

        setIsBusy(true);

        try {
            const result = await setPreferredMfa(method);

            if (result && result.success) {
                flash(result.message || 'Preference saved.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not save your preference', true);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleAddPasskeySubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const result = await registerPasskey((values[`field_${passkeyLabelFieldId}`] || '').trim());

        if (result && result.cancelled) { return false; }

        if (result && result.success) {
            flash('Passkey added.');
            await refreshAll();
            return true;
        }

        if (handleSessionExpired(result)) { return true; }

        throw new Error((result && result.message) || 'Could not add passkey');
    };

    const handleRemovePasskey = async (passkeyId, label) => {
        if (!window.confirm(`Remove "${label || 'this passkey'}"?`)) { return; }

        setIsBusy(true);

        try {
            await beginStepUp('remove_passkey', { passkey_id: passkeyId });
        } catch (error) {
            flash(error.message, true);
        } finally {
            setIsBusy(false);
        }
    };

    const handleStartTotp = async () => {
        setIsBusy(true);

        try {
            if (hasAnyMethod) {
                await beginStepUp('setup_totp');
                return;
            }

            const result = await startTotpSetup();

            if (result && result.success && result.otpauthUri) {
                const qrDataUrl = await QRCode.toDataURL(result.otpauthUri, { width: 220, margin: 1 });
                setTotpSetup({ secret: result.secret, qrDataUrl, isReplacement: !!result.isReplacement });
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not start authenticator setup', true);
            }
        } catch (error) {
            flash(error.message, true);
        } finally {
            setIsBusy(false);
        }
    };

    const handleConfirmTotpSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const result = await confirmTotpSetup(values[`field_${totpCodeFieldId}`]);

        if (result && result.success) {
            setTotpSetup(null);
            flash('Authenticator app enabled.');
            await refreshAll();
            return true;
        }

        if (handleSessionExpired(result)) { return true; }

        throw new Error((result && result.message) || 'Incorrect code');
    };

    const handleCancelTotpSetup = async () => {
        setIsBusy(true);

        try {
            await cancelTotpSetup();
            setTotpSetup(null);
            await loadAccount();
        } finally {
            setIsBusy(false);
        }
    };

    const handleRemoveTotp = async () => {
        if (!window.confirm('Remove your authenticator app?')) { return; }

        setIsBusy(true);

        try {
            await beginStepUp('remove_totp');
        } catch (error) {
            flash(error.message, true);
        } finally {
            setIsBusy(false);
        }
    };

    const handleDismissPasskeyPrompt = async () => {
        setIsBusy(true);

        try {
            await dismissPasskeyPrompt();
        } finally {
            setIsBusy(false);
            onClose();
        }
    };

    const handleRevokeSession = async (publicId, device, isCurrent) => {
        if (!window.confirm(isCurrent ? 'Sign out of this device?' : `Sign out of ${device}?`)) { return; }

        setIsBusy(true);

        try {
            const result = await revokeSession(publicId);

            if (result && result.success) {
                if (result.revokedCurrent) {
                    navigate(adminLoginPageUrl, { replace: true });
                    return;
                }
                flash(result.message || 'Signed out.');
                await loadSessions();
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not sign out that session', true);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleRevokeAllOthers = async () => {
        if (!window.confirm('Sign out of every other device?')) { return; }

        setIsBusy(true);

        try {
            const result = await revokeAllOtherSessions();

            if (result && result.success) {
                flash(result.message || 'Other sessions signed out.');
                await loadSessions();
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not sign out other sessions', true);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const formatRemaining = (seconds) => {
        if (seconds <= 0) { return 'expiring now'; }
        const days = Math.floor(seconds / 86400);
        if (days >= 1) { return `expires in ${days} day${days === 1 ? '' : 's'}`; }
        const hours = Math.max(1, Math.round(seconds / 3600));
        return `expires in ${hours} hour${hours === 1 ? '' : 's'}`;
    };

    const miniForm = (key, fields, onSubmit, submitText) => (
        <Form key={key}
              fields={fields}
              mailTo={''}
              formTitle={`Admin Settings ${key}`}
              captchaLength={1}
              noInputFieldsCache={true}
              noCaptcha={true}
              noClearOption={true}
              centerSubmitButton={true}
              fullMarginField={true}
              forceEnglishForm={true}
              noSuccessMessage={true}
              hasSetSubmittingLocal={true}
              setSubmittingLocal={setIsBusy}
              hasDifferentOnSubmitBehaviour={true}
              differentOnSubmitBehaviour={onSubmit}
              hasDifferentSubmitButtonText={true}
              differentSubmitButtonText={submitText}
        />
    );

    const renderStepUpCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Verify it&apos;s you</h4>
            <p>
                To {STEP_UP_ACTION_LABELS[stepUp.action] || 'make this change'}, confirm your identity first.
            </p>

            {stepUp.methods.length > 1 && (
                <div className={'admin-settings-method-grid'}>
                    {stepUp.methods.map((m) => (
                        <button
                            key={m}
                            type={'button'}
                            className={m === stepUpMethod ? 'selected' : ''}
                            disabled={isBusy}
                            aria-pressed={m === stepUpMethod}
                            onClick={() => setStepUpMethod(m)}
                        >
                            <span className={'admin-settings-method-radio'} aria-hidden={'true'}/>
                            <span className={'admin-settings-method-text'}>
                                <span>{METHOD_LABELS[m]}</span>
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {stepUpMethod === 'passkey' ? (
                <div className={'admin-settings-buttons-row'}>
                    <button type={'button'} disabled={isBusy} onClick={handleStepUpPasskey}>
                        Verify with your passkey
                    </button>
                    <button type={'button'} disabled={isBusy} onClick={cancelStepUp}>Cancel</button>
                </div>
            ) : (
                <>
                    <p className={'admin-settings-hint'}>
                        {stepUpMethod === 'email'
                            ? `Enter the code sent to ${stepUp.maskedEmail}`
                            : 'Enter the 6-digit code from your authenticator app'}
                    </p>
                    {miniForm(
                        `step-up-${stepUpMethod}`,
                        [codeField(stepUpCodeFieldId, 'Verification Code')],
                        handleStepUpSubmit,
                        ['Verify', 'Verifying...']
                    )}
                    <div className={'admin-settings-buttons-row'}>
                        {stepUpMethod === 'email' && (
                            <button type={'button'} disabled={isBusy || stepUpResendIn > 0} onClick={handleStepUpResend}>
                                {stepUpResendIn > 0 ? `Resend in ${stepUpResendIn}s` : 'Resend code'}
                            </button>
                        )}
                        <button type={'button'} disabled={isBusy} onClick={cancelStepUp}>Cancel</button>
                    </div>
                </>
            )}

        </div>
    );

    const renderMethodCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Preferred method</h4>
            <p className={'admin-settings-hint'}>
                Offered first when you log in, and used to confirm account changes.
            </p>

            {!hasAnyMethod ? (
                <p className={'admin-settings-hint'}>
                    Nothing set up yet. Verify an email, add a passkey, or set up an authenticator app below.
                </p>
            ) : (
                <div className={'admin-settings-method-grid'}>
                    {['passkey', 'totp', 'email', 'auto'].map((method) => {
                        const isAuto = method === 'auto';
                        const available = isAuto || availableMethods.includes(method);
                        const selected = isAuto ? !account?.preferredMfa : account?.preferredMfa === method;

                        return (
                            <button
                                key={method}
                                type={'button'}
                                className={selected ? 'selected' : ''}
                                disabled={isBusy || !available}
                                aria-pressed={selected}
                                onClick={() => handleSetPreferred(method)}
                            >
                                <span className={'admin-settings-method-radio'} aria-hidden={'true'}/>
                                <span className={'admin-settings-method-text'}>
                                    <span>{isAuto ? 'Automatic' : METHOD_LABELS[method]}</span>
                                    <span className={'admin-settings-method-blurb'}>
                                        {isAuto
                                            ? 'Use the strongest method I have set up.'
                                            : available ? METHOD_BLURBS[method] : 'Not set up yet'}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderEmailCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Email</h4>
            <p className={'admin-settings-hint'}>
                Must be an @harvestschools.com or @alfajralbasem.com address. Codes are only sent to an
                address you have confirmed.
            </p>

            {account?.email ? (
                <div className={'admin-settings-value-row'}>
                    <span className={'admin-settings-value'}>{account.email}</span>
                    <span className={`admin-settings-badge${account.emailVerified ? '' : ' unverified'}`}>
                        {account.emailVerified ? 'Verified' : 'Not verified'}
                    </span>
                </div>
            ) : (
                <p className={'admin-settings-hint'}>No email address on this account yet.</p>
            )}

            {pendingEmail && (
                <>
                    <p>Confirm <strong>{pendingEmail}</strong></p>
                    <p className={'admin-settings-hint'}>
                        Any code sent recently still works. Resending does not cancel the earlier ones.
                    </p>
                    {miniForm('verify-email', [codeField(emailCodeFieldId, 'Verification Code')], handleVerifyEmailSubmit, ['Verify', 'Verifying...'])}
                    <div className={'admin-settings-buttons-row'}>
                        <button type={'button'} disabled={isBusy || resendIn > 0} onClick={handleResendVerification}>
                            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                        </button>
                        <button type={'button'} disabled={isBusy} onClick={handleCancelEmailChange}>Cancel change</button>
                    </div>
                </>
            )}

            {!pendingEmail && emailPanel === 'edit' && miniForm(
                'edit-email',
                hasAnyMethod
                    ? [{
                        id: emailFieldId, type: 'email', name: 'email', label: 'Email',
                        displayLabel: 'New Email Address', httpName: 'email', required: true,
                        placeholder: 'name@harvestschools.com', errorMsg: 'Please enter a valid email address',
                        defaultValue: account?.email || '', value: '', setValue: null, widthOfField: 1,
                        labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
                    }]
                    : [{
                        id: emailFieldId, type: 'email', name: 'email', label: 'Email',
                        displayLabel: 'New Email Address', httpName: 'email', required: true,
                        placeholder: 'name@harvestschools.com', errorMsg: 'Please enter a valid email address',
                        defaultValue: account?.email || '', value: '', setValue: null, widthOfField: 1,
                        labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
                    }, bootstrapPasswordField(emailBootstrapPasswordFieldId)],
                handleEmailSubmit,
                [hasAnyMethod ? 'Continue' : 'Send verification code', 'Sending...']
            )}

            {!pendingEmail && (
                <div className={'admin-settings-buttons-row'}>
                    <button
                        type={'button'}
                        disabled={isBusy}
                        onClick={() => setEmailPanel(emailPanel === 'edit' ? null : 'edit')}
                    >
                        {emailPanel === 'edit' ? 'Cancel' : account?.email ? 'Change email' : 'Add email'}
                    </button>
                    {account?.email && (
                        <button type={'button'} className={'danger'} disabled={isBusy} onClick={handleRemoveEmail}>
                            Remove email
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const renderTotpCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Authenticator app</h4>
            <p className={'admin-settings-hint'}>Works offline and does not depend on email delivery.</p>

            {totpSetup ? (
                <>
                    <p className={'admin-settings-hint'}>
                        Scan this with your authenticator app, then enter the 6-digit code it shows.
                        {totpSetup.isReplacement && ' Your old authenticator stops working once this is confirmed.'}
                    </p>
                    <img className={'admin-settings-totp-qr'} src={totpSetup.qrDataUrl} alt={'Authenticator app setup QR code'}/>
                    <p className={'admin-settings-hint admin-settings-totp-secret'}>
                        Can&apos;t scan? Enter this key manually: <code>{totpSetup.secret}</code>
                    </p>
                    {miniForm('confirm-totp', [codeField(totpCodeFieldId, 'Code From Your App')], handleConfirmTotpSubmit, ['Confirm', 'Confirming...'])}
                    <div className={'admin-settings-buttons-row'}>
                        <button type={'button'} disabled={isBusy} onClick={handleCancelTotpSetup}>Cancel setup</button>
                    </div>
                </>
            ) : account?.hasTotp ? (
                <>
                    <div className={'admin-settings-value-row'}>
                        <span className={'admin-settings-value'}>Authenticator app</span>
                        <span className={'admin-settings-badge'}>Enabled</span>
                    </div>
                    <div className={'admin-settings-buttons-row'}>
                        <button type={'button'} disabled={isBusy} onClick={handleStartTotp}>Replace</button>
                        <button type={'button'} className={'danger'} disabled={isBusy} onClick={handleRemoveTotp}>Remove</button>
                    </div>
                </>
            ) : (
                <div className={'admin-settings-buttons-row'}>
                    <button type={'button'} disabled={isBusy} onClick={handleStartTotp}>Set up authenticator app</button>
                </div>
            )}
        </div>
    );

    const renderPasskeyCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Passkeys</h4>
            <p className={'admin-settings-hint'}>The strongest option. Nothing to type and nothing that can be phished.</p>

            {account?.passkeys && account.passkeys.length > 0 ? (
                <ul className={'admin-settings-list'}>
                    {account.passkeys.map((passkey) => (
                        <li key={passkey.id} className={'admin-settings-list-row'}>
                            <div className={'admin-settings-value'}>
                                <div>{passkey.label || 'Passkey'}</div>
                                <div className={'admin-settings-list-meta'}>
                                    Added {passkey.createdAt}
                                    {passkey.lastUsed ? `, last used ${passkey.lastUsed}` : ', never used'}
                                </div>
                            </div>
                            <button
                                type={'button'}
                                className={'danger'}
                                disabled={isBusy}
                                onClick={() => handleRemovePasskey(passkey.id, passkey.label)}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={'admin-settings-hint'}>No passkeys yet.</p>
            )}

            {canUsePasskeys ? miniForm(
                'add-passkey',
                [{
                    id: passkeyLabelFieldId, type: 'text', name: 'passkey-label', label: 'Passkey Label',
                    displayLabel: 'Device Name (optional)', httpName: 'passkey-label', required: false,
                    placeholder: 'e.g. Work Laptop', errorMsg: 'Please enter a device name',
                    value: '', setValue: null, widthOfField: 1,
                    labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
                }],
                handleAddPasskeySubmit,
                ['Add a passkey', 'Waiting for your device...']
            ) : (
                <p className={'admin-settings-hint'}>
                    {isMobileApp()
                        ? 'Passkeys are managed from a web browser. This app already supports biometric sign-in on this device.'
                        : 'This browser does not support passkeys.'}
                </p>
            )}
        </div>
    );

    const renderSessionsCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Active sessions</h4>
            <p className={'admin-settings-hint'}>
                Every device signed in to your account. If you do not recognise one, sign it out and change
                your password.
            </p>

            {sessions === null ? (
                <p className={'admin-settings-hint'}>Loading&hellip;</p>
            ) : sessions.length === 0 ? (
                <p className={'admin-settings-hint'}>No other sessions.</p>
            ) : (
                <ul className={'admin-settings-list'}>
                    {sessions.map((session) => (
                        <li key={session.publicId} className={'admin-settings-list-row'}>
                            <div className={'admin-settings-value'}>
                                <div>{session.device}{session.isCurrent && ' \u2014 this device'}</div>
                                <div className={'admin-settings-list-meta'}>
                                    Signed in {session.createdAt}, last active {session.lastSeen}
                                    {`, ${formatRemaining(session.expiresInSeconds)}`}
                                    {!session.bound && ' \u2014 not device-bound'}
                                </div>
                            </div>
                            <button
                                type={'button'}
                                className={'danger'}
                                disabled={isBusy}
                                onClick={() => handleRevokeSession(session.publicId, session.device, session.isCurrent)}
                            >
                                {session.isCurrent ? 'Sign out' : 'Revoke'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {sessions && sessions.length > 1 && (
                <div className={'admin-settings-buttons-row'}>
                    <button type={'button'} disabled={isBusy} onClick={handleRevokeAllOthers}>
                        Sign out of all other devices
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <animated.div style={animateSettingsModal} className={'general-large-admin-action-modal'}>
            <div className={'general-large-admin-action-modal-overlay'} onClick={onClose}/>

            <div className={'general-large-admin-action-modal-container admin-settings-modal-container'}>
                <div className={'general-large-admin-action-modal-header admin-settings-modal-header'}>
                    <h3>Settings</h3>

                    <div className={'admin-settings-tabs'} role={'tablist'}>
                        <button
                            type={'button'}
                            role={'tab'}
                            aria-selected={activeTab === PROFILE_TAB}
                            className={activeTab === PROFILE_TAB ? 'active' : ''}
                            disabled={gateClosed}
                            onClick={() => setActiveTab(PROFILE_TAB)}
                        >
                            Profile
                        </button>
                        <button
                            type={'button'}
                            role={'tab'}
                            aria-selected={activeTab === SECURITY_TAB}
                            className={activeTab === SECURITY_TAB ? 'active' : ''}
                            onClick={() => setActiveTab(SECURITY_TAB)}
                        >
                            Login &amp; Security
                        </button>
                    </div>
                </div>

                <div className={'general-large-admin-action-modal-content admin-settings-modal-content'} ref={contentRef}>
                    {show && (
                        <>
                            {(isBusy || !account) && <Spinner/>}

                            {gateClosed && (
                                <div className={'admin-settings-card'}>
                                    <p className={'admin-settings-error'}>
                                        Your account is locked until you set up a login verification method. Add a
                                        verified email, an authenticator app, or a passkey below.
                                    </p>
                                </div>
                            )}

                            {!gateClosed && !hasAnyMethod && account && (
                                <div className={'admin-settings-card'}>
                                    <p className={'admin-settings-hint'}>
                                        {`You have ${Math.max(0, (account.graceAllowed || 0) - (account.graceUsed || 0))} login(s) left before your account is locked until a verification method is set up.`}
                                    </p>
                                </div>
                            )}

                            {notice === 'passkey_prompt' && !gateClosed && (
                                <div className={'admin-settings-card'}>
                                    <p>
                                        Want faster, phishing-resistant sign-ins? Add a passkey and verify future
                                        logins with your fingerprint, face, or device PIN.
                                    </p>
                                    <div className={'admin-settings-buttons-row'}>
                                        <button type={'button'} disabled={isBusy} onClick={handleDismissPasskeyPrompt}>
                                            Don&apos;t ask again
                                        </button>
                                    </div>
                                </div>
                            )}

                            {statusMsg && <p className={'admin-settings-status'} role={'status'}>{statusMsg}</p>}
                            {errorMsg && <p className={'admin-settings-error'} role={'alert'}>{errorMsg}</p>}

                            {account && stepUp && (
                                <div className={'admin-settings-section'}>{renderStepUpCard()}</div>
                            )}

                            {account && !stepUp && activeTab === PROFILE_TAB && !gateClosed && (
                                <div className={'admin-settings-section'}>
                                    {!hasAnyMethod && (
                                        <div className={'admin-settings-card'}>
                                            <p className={'admin-settings-hint'}>
                                                Set up a verification method before changing your name, username or
                                                password. Changes are confirmed with that method, not your password.
                                            </p>
                                        </div>
                                    )}
                                    <Form fields={[
                                        {
                                            id: nameFieldId, type: 'text', name: 'name', label: 'Name',
                                            displayLabel: 'Name', httpName: 'name', required: true,
                                            placeholder: 'Name', errorMsg: 'Please enter name',
                                            defaultValue: account.name || '', value: '', setValue: null, widthOfField: 2,
                                            labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
                                        },
                                        {
                                            id: usernameFieldId, type: 'text', name: 'username', label: 'Username',
                                            displayLabel: 'Username', httpName: 'username', required: true,
                                            placeholder: 'Username', errorMsg: 'Please enter username',
                                            defaultValue: account.username || '', value: '', setValue: null, widthOfField: 2,
                                            labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
                                        },
                                        {
                                            id: newPasswordFieldId, type: 'password', name: 'new-password',
                                            label: 'New Password',
                                            displayLabel: 'New Password (leave blank to keep your current one)',
                                            httpName: 'new-password', required: false,
                                            placeholder: 'New Password', errorMsg: 'Please enter new password',
                                            value: '', setValue: null, widthOfField: 2,
                                            labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
                                        },
                                        {
                                            id: confirmNewPasswordFieldId, type: 'password',
                                            name: 'confirm-new-password', label: 'Confirm New Password',
                                            displayLabel: 'Confirm New Password', httpName: 'confirm-new-password',
                                            required: false, placeholder: 'Confirm New Password',
                                            errorMsg: 'Please confirm new password',
                                            value: '', setValue: null, widthOfField: 2,
                                            labelOutside: true, labelOnTop: true, dontLetTheBrowserSaveField: true,
                                            mustMatchFieldWithId: newPasswordFieldId,
                                        },
                                    ]}
                                          mailTo={''}
                                          formTitle={'Admin Account Settings Form'}
                                          captchaLength={1}
                                          noInputFieldsCache={true}
                                          noCaptcha={true}
                                          noClearOption={true}
                                          forceEnglishForm={true}
                                          noSuccessMessage={true}
                                          hasDifferentOnSubmitBehaviour={true}
                                          differentOnSubmitBehaviour={handleProfileSubmit}
                                          formInModalPopup={true}
                                          setShowFormModalPopup={() => {}}
                                          hasSetSubmittingLocal={true}
                                          setSubmittingLocal={setIsBusy}
                                          hasDifferentSubmitButtonText={true}
                                          differentSubmitButtonText={['Save Changes', 'Saving...']}
                                          formFooterButtonsAreOutside={true}
                                          footerButtonsPortalTarget={profileFooterRef}
                                    />
                                </div>
                            )}

                            {account && !stepUp && activeTab === SECURITY_TAB && (
                                <div className={'admin-settings-section'}>
                                    {renderMethodCard()}
                                    {renderEmailCard()}
                                    {renderTotpCard()}
                                    {renderPasskeyCard()}
                                    {!gateClosed && renderSessionsCard()}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={'general-large-admin-action-modal-footer admin-settings-modal-footer'}>
                    <button type={'button'} onClick={onClose}>Close</button>
                    <div ref={profileFooterRef}/>
                </div>
            </div>
        </animated.div>
    );
}

AdminSettingsModal.propTypes = {
    show: PropTypes.bool.isRequired,
    notice: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    setRefreshCurrentUserData: PropTypes.func.isRequired,
};

export default AdminSettingsModal;