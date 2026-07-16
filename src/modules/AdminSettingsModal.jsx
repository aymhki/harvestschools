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
    updateMyAccount,
    dismissPasskeyPrompt,
    resendEmailVerification,
    confirmEmailChange,
    cancelEmailChange,
    setPreferredMfa,
    startTotpSetup,
    confirmTotpSetup,
    cancelTotpSetup,
    removeTotp,
    registerPasskey,
    removePasskey,
    listSessions,
    revokeSession,
    revokeAllOtherSessions,
} from '../services/Admin/Session/AdminSettingsServices.jsx';
import {passkeySupported} from '../services/General/PasskeyUtils.jsx';
import {isMobileApp} from '../services/Admin/Session/MainAdminServices.jsx';
import {adminLoginPageUrl, msgTimeout} from '../services/General/GeneralUtils.jsx';


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
    const [totpPanel, setTotpPanel] = useState(null);

    const [sessions, setSessions] = useState(null);

    const [resetProfileForm, setResetProfileForm] = useState(false);
    const profileFooterRef = useRef(null);
    const [, forceFooterRender] = useState(0);
    const statusTimerRef = useRef(null);
    const isMountedRef = useRef(true);

    const canUsePasskeys = passkeySupported() && !isMobileApp();

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

    const passwordField = (id, displayLabel = 'Current Password') => ({
        id,
        type: 'password',
        name: 'current-password',
        label: 'Current Password',
        displayLabel,
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

    const flash = useCallback((msg, isError) => {
        setStatusMsg(isError ? null : msg);
        setErrorMsg(isError ? msg : null);
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

        if (result && result.success) {
            setSessions(result.sessions || []);
        }
    }, []);

    const loadAccount = useCallback(async () => {
        const result = await fetchMyAccount();

        if (!isMountedRef.current) { return; }

        if (result && result.success && result.account) {
            setAccount(result.account);
            if (result.account.pendingEmail) {
                setResendIn(result.account.verifySendState?.retryAfter ?? 0);
            }
            await loadSessions();
        } else if (!handleSessionExpired(result)) {
            flash((result && result.message) || 'Could not load account details', true);
        }
    }, [flash, loadSessions]);

    useEffect(() => {
        if (!show) { return; }

        setAccount(null);
        setActiveTab(notice === 'mfa_setup' || notice === 'passkey_prompt' ? SECURITY_TAB : PROFILE_TAB);
        setTotpSetup(null);
        setTotpPanel(null);
        setEmailPanel(null);
        setSessions(null);
        setStatusMsg(null);
        setErrorMsg(null);
        loadAccount();
    }, [show, notice, loadAccount]);

    useEffect(() => {
        if (resendIn <= 0) { return undefined; }

        const timer = setInterval(() => {
            setResendIn((seconds) => (seconds <= 1 ? 0 : seconds - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [resendIn]);

    const runOrThrow = async (result, fallback) => {
        if (result && result.success) { return result; }
        if (handleSessionExpired(result)) { return null; }
        throw new Error((result && result.message) || fallback);
    };


    const currentPasswordFieldId = 1;
    const nameFieldId = 2;
    const usernameFieldId = 3;
    const newPasswordFieldId = 5;
    const confirmNewPasswordFieldId = 6;

    const handleProfileSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const newPassword = values[`field_${newPasswordFieldId}`] || '';

        if (newPassword !== (values[`field_${confirmNewPasswordFieldId}`] || '')) {
            throw new Error('New passwords do not match');
        }

        const result = await updateMyAccount({
            current_password: values[`field_${currentPasswordFieldId}`],
            name: values[`field_${nameFieldId}`],
            username: values[`field_${usernameFieldId}`],
            new_password: newPassword,
        });

        const ok = await runOrThrow(result, 'Could not update account');

        if (!ok) {
            return true;
        }

        flash(ok.message || 'Account updated.');
        setRefreshCurrentUserData(true);
        setResetProfileForm(true);
        await loadAccount();
        return true;
    };

    const emailFieldId = 10;
    const emailPasswordFieldId = 11;
    const emailRemovePasswordFieldId = 12;
    const emailCodeFieldId = 13;

    const handleEmailSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());

        const result = await updateMyAccount({
            current_password: values[`field_${emailPasswordFieldId}`],
            email: (values[`field_${emailFieldId}`] || '').trim(),
        });

        const ok = await runOrThrow(result, 'Could not update your email');
        if (!ok) { return true; }

        setEmailPanel(null);
        setResendIn(ok.retryAfter || 0);
        flash(ok.verificationMessage || ok.message || 'Saved.');
        await loadAccount();
        return true;
    };

    const handleEmailRemoveSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());

        const result = await updateMyAccount({
            current_password: values[`field_${emailRemovePasswordFieldId}`],
            email: '',
        });

        const ok = await runOrThrow(result, 'Could not remove your email');
        if (!ok) { return true; }

        setEmailPanel(null);
        flash(ok.message || 'Email removed.');
        await loadAccount();
        return true;
    };

    const handleVerifyEmailSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const result = await confirmEmailChange(values[`field_${emailCodeFieldId}`]);

        const ok = await runOrThrow(result, 'That code did not work');
        if (!ok) { return true; }

        flash(ok.message || 'Email verified.');
        await loadAccount();
        return true;
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
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not cancel', true);
            }
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

    const passkeyLabelFieldId = 20;

    const handleAddPasskeySubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const result = await registerPasskey((values[`field_${passkeyLabelFieldId}`] || '').trim());

        if (result && result.cancelled) { return true; }

        const ok = await runOrThrow(result, 'Could not add passkey');
        if (!ok) { return true; }

        flash('Passkey added.');
        await loadAccount();
        return true;
    };

    const handleRemovePasskey = async (passkeyId, label) => {
        if (!window.confirm(`Remove "${label || 'this passkey'}"?`)) { return; }

        setIsBusy(true);

        try {
            const result = await removePasskey(passkeyId);

            if (result && result.success) {
                flash('Passkey removed.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flash((result && result.message) || 'Could not remove passkey', true);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const totpCodeFieldId = 30;
    const totpReplacePasswordFieldId = 31;
    const totpRemovePasswordFieldId = 32;

    const beginTotpSetup = async (password = '') => {
        setIsBusy(true);

        try {
            const result = await startTotpSetup(password);

            if (result && result.success && result.otpauthUri) {
                const qrDataUrl = await QRCode.toDataURL(result.otpauthUri, { width: 220, margin: 1 });
                setTotpSetup({ secret: result.secret, qrDataUrl, isReplacement: !!result.isReplacement });
                setTotpPanel(null);
                return true;
            }

            if (result && result.requiresPassword) {
                setTotpPanel('replace');
                if (password) { throw new Error(result.message || 'Current password is incorrect'); }
                return true;
            }

            if (handleSessionExpired(result)) { return true; }

            throw new Error((result && result.message) || 'Could not start authenticator setup');
        } finally {
            setIsBusy(false);
        }
    };

    const handleTotpReplaceSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        return beginTotpSetup(values[`field_${totpReplacePasswordFieldId}`]);
    };

    const handleConfirmTotpSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const result = await confirmTotpSetup(values[`field_${totpCodeFieldId}`]);

        const ok = await runOrThrow(result, 'Incorrect code');
        if (!ok) { return true; }

        setTotpSetup(null);
        flash('Authenticator app enabled.');
        await loadAccount();
        return true;
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

    const handleRemoveTotpSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const result = await removeTotp(values[`field_${totpRemovePasswordFieldId}`]);

        const ok = await runOrThrow(result, 'Could not remove the authenticator app');
        if (!ok) { return true; }

        setTotpPanel(null);
        flash('Authenticator app removed.');
        await loadAccount();
        return true;
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

    const availableMethods = account?.availableMethods || [];
    const pendingEmail = account?.pendingEmail;

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
              hasSetSubmittingLocal={true}
              setSubmittingLocal={setIsBusy}
              hasDifferentOnSubmitBehaviour={true}
              differentOnSubmitBehaviour={onSubmit}
              hasDifferentSubmitButtonText={true}
              differentSubmitButtonText={submitText}
        />
    );

    const renderMethodCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Preferred method</h4>
            <p className={'admin-settings-hint'}>
                Offered first when you log in. You can always pick another method on the login screen.
            </p>

            {availableMethods.length === 0 ? (
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
                                <span>{isAuto ? 'Automatic' : METHOD_LABELS[method]}</span>
                                <span className={'admin-settings-method-blurb'}>
                                    {isAuto
                                        ? 'Use the strongest method I have set up.'
                                        : available ? METHOD_BLURBS[method] : 'Not set up yet'}
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
                Must be an @harvestschools.com or @alfajralbasem.com address. Login codes are only ever sent
                to an address you have confirmed.
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
                        Any code we sent you recently still works. Resending does not cancel the earlier ones.
                    </p>
                    {miniForm(
                        'verify-email',
                        [codeField(emailCodeFieldId, 'Verification Code')],
                        handleVerifyEmailSubmit,
                        ['Verify', 'Verifying...']
                    )}
                    <div className={'admin-settings-buttons-row'}>
                        <button type={'button'} disabled={isBusy || resendIn > 0} onClick={handleResendVerification}>
                            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                        </button>
                        <button type={'button'} disabled={isBusy} onClick={handleCancelEmailChange}>
                            Cancel change
                        </button>
                    </div>
                </>
            )}

            {!pendingEmail && emailPanel === 'edit' && miniForm(
                'edit-email',
                [
                    {
                        id: emailFieldId,
                        type: 'email',
                        name: 'email',
                        label: 'Email',
                        displayLabel: 'New Email Address',
                        httpName: 'email',
                        required: true,
                        placeholder: 'name@harvestschools.com',
                        errorMsg: 'Please enter a valid email address',
                        value: account?.email || '',
                        setValue: null,
                        widthOfField: 1,
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                    },
                    passwordField(emailPasswordFieldId),
                ],
                handleEmailSubmit,
                ['Send verification code', 'Sending...']
            )}

            {!pendingEmail && emailPanel === 'remove' && miniForm(
                'remove-email',
                [passwordField(emailRemovePasswordFieldId, 'Current Password (to remove your email)')],
                handleEmailRemoveSubmit,
                ['Remove email', 'Removing...']
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
                        <button
                            type={'button'}
                            disabled={isBusy}
                            onClick={() => setEmailPanel(emailPanel === 'remove' ? null : 'remove')}
                        >
                            {emailPanel === 'remove' ? 'Cancel' : 'Remove email'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const renderTotpCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Authenticator app</h4>
            <p className={'admin-settings-hint'}>
                Works offline and does not depend on email delivery.
            </p>

            {totpSetup ? (
                <>
                    <p className={'admin-settings-hint'}>
                        Scan this with your authenticator app, then enter the 6-digit code it shows.
                        {totpSetup.isReplacement && ' Your old authenticator stops working once this is confirmed.'}
                    </p>
                    <img
                        className={'admin-settings-totp-qr'}
                        src={totpSetup.qrDataUrl}
                        alt={'Authenticator app setup QR code'}
                    />
                    <p className={'admin-settings-hint admin-settings-totp-secret'}>
                        Can&apos;t scan? Enter this key manually: <code>{totpSetup.secret}</code>
                    </p>
                    {miniForm(
                        'confirm-totp',
                        [codeField(totpCodeFieldId, 'Code From Your App')],
                        handleConfirmTotpSubmit,
                        ['Confirm', 'Confirming...']
                    )}
                    <div className={'admin-settings-buttons-row'}>
                        <button type={'button'} disabled={isBusy} onClick={handleCancelTotpSetup}>
                            Cancel setup
                        </button>
                    </div>
                </>
            ) : account?.hasTotp ? (
                <>
                    <div className={'admin-settings-value-row'}>
                        <span className={'admin-settings-value'}>Authenticator app</span>
                        <span className={'admin-settings-badge'}>Enabled</span>
                    </div>

                    {totpPanel === 'replace' && miniForm(
                        'replace-totp',
                        [passwordField(totpReplacePasswordFieldId, 'Current Password (to replace your authenticator)')],
                        handleTotpReplaceSubmit,
                        ['Continue', 'Checking...']
                    )}

                    {totpPanel === 'remove' && miniForm(
                        'remove-totp',
                        [passwordField(totpRemovePasswordFieldId, 'Current Password (to remove your authenticator)')],
                        handleRemoveTotpSubmit,
                        ['Remove authenticator', 'Removing...']
                    )}

                    <div className={'admin-settings-buttons-row'}>
                        <button
                            type={'button'}
                            disabled={isBusy}
                            onClick={() => setTotpPanel(totpPanel === 'replace' ? null : 'replace')}
                        >
                            {totpPanel === 'replace' ? 'Cancel' : 'Replace'}
                        </button>
                        <button
                            type={'button'}
                            disabled={isBusy}
                            onClick={() => setTotpPanel(totpPanel === 'remove' ? null : 'remove')}
                        >
                            {totpPanel === 'remove' ? 'Cancel' : 'Remove'}
                        </button>
                    </div>
                </>
            ) : (
                <div className={'admin-settings-buttons-row'}>
                    <button type={'button'} disabled={isBusy} onClick={() => beginTotpSetup()}>
                        Set up authenticator app
                    </button>
                </div>
            )}
        </div>
    );


    const handleRevokeSession = async (publicId, device, isCurrent) => {
        const prompt = isCurrent
            ? 'Sign out of this device?'
            : `Sign out of ${device}?`;

        if (!window.confirm(prompt)) { return; }

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

    const renderSessionsCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Active sessions</h4>
            <p className={'admin-settings-hint'}>
                Every device currently signed in to your account. If you do not recognise one, sign it out
                and then change your password.
            </p>

            {sessions === null ? (
                <p className={'admin-settings-hint'}>Loading&hellip;</p>
            ) : sessions.length === 0 ? (
                <p className={'admin-settings-hint'}>No other sessions.</p>
            ) : (
                <ul className={'admin-settings-passkey-list'}>
                    {sessions.map((session) => (
                        <li key={session.publicId} className={'admin-settings-passkey-row'}>
                            <div className={'admin-settings-value'}>
                                <div>
                                    {session.device}
                                    {session.isCurrent && ' — this device'}
                                </div>
                                <div className={'admin-settings-passkey-meta'}>
                                    Signed in {session.createdAt}, last active {session.lastSeen}
                                    {`, ${formatRemaining(session.expiresInSeconds)}`}
                                    {!session.bound && ' — not device-bound'}
                                </div>
                            </div>
                            <button
                                type={'button'}
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

    const renderPasskeyCard = () => (
        <div className={'admin-settings-card'}>
            <h4>Passkeys</h4>
            <p className={'admin-settings-hint'}>
                The strongest option. Nothing to type and nothing that can be phished.
            </p>

            {account?.passkeys && account.passkeys.length > 0 ? (
                <ul className={'admin-settings-passkey-list'}>
                    {account.passkeys.map((passkey) => (
                        <li key={passkey.id} className={'admin-settings-passkey-row'}>
                            <div className={'admin-settings-value'}>
                                <div>{passkey.label || 'Passkey'}</div>
                                <div className={'admin-settings-passkey-meta'}>
                                    Added {passkey.createdAt}
                                    {passkey.lastUsed ? `, last used ${passkey.lastUsed}` : ', never used'}
                                </div>
                            </div>
                            <button
                                type={'button'}
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
                    id: passkeyLabelFieldId,
                    type: 'text',
                    name: 'passkey-label',
                    label: 'Passkey Label',
                    displayLabel: 'Device Name (optional)',
                    httpName: 'passkey-label',
                    required: false,
                    placeholder: 'e.g. Work Laptop',
                    errorMsg: 'Please enter a device name',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
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

                <div className={'general-large-admin-action-modal-content admin-settings-modal-content'}>
                    {show && (
                        <>
                            {(isBusy || !account) && <Spinner/>}

                            {notice === 'passkey_prompt' && (
                                <div className={'admin-settings-card'}>
                                    <p>
                                        Want faster, phishing-resistant sign-ins? Add a passkey and you can verify
                                        future logins with your fingerprint, face, or device PIN.
                                    </p>
                                    <div className={'admin-settings-buttons-row'}>
                                        <button type={'button'} disabled={isBusy} onClick={handleDismissPasskeyPrompt}>
                                            Don&apos;t ask again
                                        </button>
                                    </div>
                                </div>
                            )}

                            {notice === 'mfa_setup' && (
                                <div className={'admin-settings-card'}>
                                    <p className={'admin-settings-error'}>
                                        This account has no login verification method yet. Verify an email address,
                                        add a passkey, or set up an authenticator app below.
                                    </p>
                                </div>
                            )}

                            {statusMsg && <p className={'admin-settings-status'} role={'status'}>{statusMsg}</p>}
                            {errorMsg && <p className={'admin-settings-error'} role={'alert'}>{errorMsg}</p>}

                            {account && activeTab === PROFILE_TAB && (
                                <div className={'admin-settings-section'}>
                                    <Form fields={[
                                        passwordField(currentPasswordFieldId, 'Current Password (required to save any change)'),
                                        {
                                            id: nameFieldId,
                                            type: 'text',
                                            name: 'name',
                                            label: 'Name',
                                            displayLabel: 'Name',
                                            httpName: 'name',
                                            required: true,
                                            placeholder: 'Name',
                                            errorMsg: 'Please enter name',
                                            value: account.name || '',
                                            setValue: null,
                                            widthOfField: 2,
                                            labelOutside: true,
                                            labelOnTop: true,
                                            dontLetTheBrowserSaveField: true,
                                        },
                                        {
                                            id: usernameFieldId,
                                            type: 'text',
                                            name: 'username',
                                            label: 'Username',
                                            displayLabel: 'Username',
                                            httpName: 'username',
                                            required: true,
                                            placeholder: 'Username',
                                            errorMsg: 'Please enter username',
                                            value: account.username || '',
                                            setValue: null,
                                            widthOfField: 2,
                                            labelOutside: true,
                                            labelOnTop: true,
                                            dontLetTheBrowserSaveField: true,
                                        },
                                        {
                                            id: newPasswordFieldId,
                                            type: 'password',
                                            name: 'new-password',
                                            label: 'New Password',
                                            displayLabel: 'New Password (leave blank to keep your current one)',
                                            httpName: 'new-password',
                                            required: false,
                                            placeholder: 'New Password',
                                            errorMsg: 'Please enter new password',
                                            value: '',
                                            setValue: null,
                                            widthOfField: 2,
                                            labelOutside: true,
                                            labelOnTop: true,
                                            dontLetTheBrowserSaveField: true,
                                        },
                                        {
                                            id: confirmNewPasswordFieldId,
                                            type: 'password',
                                            name: 'confirm-new-password',
                                            label: 'Confirm New Password',
                                            displayLabel: 'Confirm New Password',
                                            httpName: 'confirm-new-password',
                                            required: false,
                                            placeholder: 'Confirm New Password',
                                            errorMsg: 'Please confirm new password',
                                            value: '',
                                            setValue: null,
                                            widthOfField: 2,
                                            labelOutside: true,
                                            labelOnTop: true,
                                            dontLetTheBrowserSaveField: true,
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
                                          resetFormFromParent={resetProfileForm}
                                          setResetForFromParent={setResetProfileForm}
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

                            {account && activeTab === SECURITY_TAB && (
                                <div className={'admin-settings-section'}>
                                    {renderMethodCard()}
                                    {renderEmailCard()}
                                    {renderTotpCard()}
                                    {renderPasskeyCard()}
                                    {renderSessionsCard()}
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
