import '../styles/AdminDashboard.css';
import '../styles/AdminSettings.css';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
} from '../services/Admin/Session/AdminSettingsServices.jsx';
import {passkeySupported} from '../services/General/PasskeyUtils.jsx';
import {isMobileApp} from '../services/Admin/Session/MainAdminServices.jsx';
import {adminLoginPageUrl, msgTimeout} from '../services/General/GeneralUtils.jsx';



function AdminSettingsModal({show, notice, onClose}) {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(PROFILE_TAB);
    const [account, setAccount] = useState(null);
    const [isBusy, setIsBusy] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [emailEditing, setEmailEditing] = useState(false);
    const [emailDraft, setEmailDraft] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [resendIn, setResendIn] = useState(0);
    const [totpSetup, setTotpSetup] = useState(null);
    const [totpCode, setTotpCode] = useState('');
    const [totpPassword, setTotpPassword] = useState('');
    const [totpPasswordNeeded, setTotpPasswordNeeded] = useState(false);
    const [totpRemoving, setTotpRemoving] = useState(false);
    const [newPasskeyLabel, setNewPasskeyLabel] = useState('');
    const [resetAccountForm, setResetAccountForm] = useState(false);
    const [footerReady, setFooterReady] = useState(false);
    const accountFormFooterButtonsRef = useRef(null);
    const statusTimerRef = useRef(null);
    const isMountedRef = useRef(true);

    const canUsePasskeys = passkeySupported() && !isMobileApp();

    const currentPasswordFieldId = 1;
    const nameFieldId = 2;
    const usernameFieldId = 3;
    const newPasswordFieldId = 5;
    const confirmNewPasswordFieldId = 6;

    const PROFILE_TAB = 'profile';
    const SECURITY_TAB = 'security';

    const METHOD_LABELS = {
        passkey: 'Passkey',
        totp: 'Authenticator app',
        email: 'Email code',
    };

    const METHOD_BLURBS = {
        passkey: 'Fingerprint, face or device PIN. Phishing-resistant.',
        totp: 'A rotating 6-digit code from Google Authenticator, Authy, and so on.',
        email: 'A 6-digit code sent to your verified work address.',
    };

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
        if (show && accountFormFooterButtonsRef.current && !footerReady) {
            setFooterReady(true);
        }
    }, [show, footerReady]);

    const flashStatus = useCallback((msg) => {
        setStatusMsg(msg);
        setErrorMsg(null);
        if (statusTimerRef.current) { clearTimeout(statusTimerRef.current); }
        statusTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) { setStatusMsg(null); }
        }, msgTimeout);
    }, []);

    const flashError = useCallback((msg) => {
        setErrorMsg(msg);
        setStatusMsg(null);
        if (statusTimerRef.current) { clearTimeout(statusTimerRef.current); }
        statusTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) { setErrorMsg(null); }
        }, msgTimeout);
    }, []);

    const handleSessionExpired = (result) => {
        if (result && result.code === 401 && /session/i.test(result.message || '')) {
            navigate(adminLoginPageUrl, { replace: true });
            return true;
        }
        return false;
    };

    const loadAccount = useCallback(async () => {
        const result = await fetchMyAccount();

        if (!isMountedRef.current) { return; }

        if (result && result.success && result.account) {
            setAccount(result.account);

            if (result.account.pendingEmail) {
                setResendIn(result.account.verifySendState?.retryAfter ?? 0);
            }
        } else if (!handleSessionExpired(result)) {
            flashError((result && result.message) || 'Could not load account details');
        }
    }, [flashError]);

    useEffect(() => {
        if (!show) { return; }

        setAccount(null);
        setActiveTab(notice === 'mfa_setup' || notice === 'passkey_prompt' ? SECURITY_TAB : PROFILE_TAB);
        setTotpSetup(null);
        setTotpCode('');
        setTotpPassword('');
        setTotpPasswordNeeded(false);
        setTotpRemoving(false);
        setNewPasskeyLabel('');
        setEmailEditing(false);
        setEmailDraft('');
        setEmailPassword('');
        setVerifyCode('');
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

    const accountFormFields = useMemo(() => {
        if (!account) { return null; }

        return [
            {
                id: currentPasswordFieldId,
                type: 'password',
                name: 'current-password',
                label: 'Current Password',
                required: true,
                placeholder: 'Current Password',
                errorMsg: 'Please enter your current password to confirm changes',
                value: '',
                setValue: null,
                widthOfField: 1,
                httpName: 'current-password',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                displayLabel: 'Current Password (required to save any change)',
            },
            {
                id: nameFieldId,
                type: 'text',
                name: 'name',
                label: 'Name',
                required: true,
                placeholder: 'Name',
                errorMsg: 'Please enter name',
                value: account.name || '',
                setValue: null,
                widthOfField: 2,
                httpName: 'name',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                displayLabel: 'Name',
            },
            {
                id: usernameFieldId,
                type: 'text',
                name: 'username',
                label: 'Username',
                required: true,
                placeholder: 'Username',
                errorMsg: 'Please enter username',
                value: account.username || '',
                setValue: null,
                widthOfField: 2,
                httpName: 'username',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                displayLabel: 'Username',
            },
            {
                id: newPasswordFieldId,
                type: 'password',
                name: 'new-password',
                label: 'New Password',
                required: false,
                placeholder: 'New Password',
                errorMsg: 'Please enter new password',
                value: '',
                setValue: null,
                widthOfField: 2,
                httpName: 'new-password',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                displayLabel: "New Password (leave blank to keep your current one)",
            },
            {
                id: confirmNewPasswordFieldId,
                type: 'password',
                name: 'confirm-new-password',
                label: 'Confirm New Password',
                required: false,
                placeholder: 'Confirm New Password',
                errorMsg: 'Please confirm new password',
                value: '',
                setValue: null,
                widthOfField: 2,
                httpName: 'confirm-new-password',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                displayLabel: "Confirm New Password (leave blank to keep your current one)",
                mustMatchFieldWithId: newPasswordFieldId,
            },
        ];
    }, [account]);

    const handleAccountSubmit = async (formData) => {
        const formDataJson = Object.fromEntries(formData.entries());
        const newPassword = formDataJson[`field_${newPasswordFieldId}`] || '';
        const confirmNewPassword = formDataJson[`field_${confirmNewPasswordFieldId}`] || '';

        if (newPassword !== confirmNewPassword) {
            throw new Error('New passwords do not match');
        }

        const result = await updateMyAccount({
            current_password: formDataJson[`field_${currentPasswordFieldId}`],
            name: formDataJson[`field_${nameFieldId}`],
            username: formDataJson[`field_${usernameFieldId}`],
            new_password: newPassword,
        });

        if (result && result.success) {
            flashStatus(result.message || 'Account updated.');
            setResetAccountForm(true);
            await loadAccount();
            return true;
        }

        if (handleSessionExpired(result)) { return true; }

        throw new Error((result && result.message) || 'Could not update account');
    };

    const handleStartEmailEdit = () => {
        setEmailEditing(true);
        setEmailDraft(account?.email || '');
        setEmailPassword('');
    };

    const handleSubmitEmail = async () => {
        const trimmed = emailDraft.trim();

        if (!trimmed) {
            flashError('Enter an email address');
            return;
        }

        if (!emailPassword) {
            flashError('Enter your current password to change your email');
            return;
        }

        setIsBusy(true);

        try {
            const result = await updateMyAccount({
                current_password: emailPassword,
                email: trimmed,
            });

            if (result && result.success) {
                setEmailEditing(false);
                setEmailPassword('');
                setVerifyCode('');
                setResendIn(result.retryAfter || 0);
                flashStatus(result.verificationMessage || result.message || 'Saved.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Could not update your email');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleRemoveEmail = async () => {
        const password = window.prompt('Enter your current password to remove your email address:');
        if (!password) { return; }

        setIsBusy(true);

        try {
            const result = await updateMyAccount({ current_password: password, email: '' });

            if (result && result.success) {
                flashStatus(result.message || 'Email removed.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Could not remove your email');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleVerifyEmail = async () => {
        setIsBusy(true);

        try {
            const result = await confirmEmailChange(verifyCode);

            if (result && result.success) {
                setVerifyCode('');
                flashStatus(result.message || 'Email verified.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'That code did not work');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleResendVerification = async () => {
        if (resendIn > 0) { return; }

        setIsBusy(true);

        try {
            const result = await resendEmailVerification();

            if (typeof result?.retryAfter === 'number') {
                setResendIn(result.retryAfter);
            }

            if (result && result.success) {
                flashStatus(result.message || 'Code sent.');
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Could not send the code');
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
                setVerifyCode('');
                setResendIn(0);
                flashStatus('Email change cancelled.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Could not cancel');
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
                flashStatus(result.message || 'Preference saved.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Could not save your preference');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleAddPasskey = async () => {
        setIsBusy(true);

        try {
            const result = await registerPasskey(newPasskeyLabel.trim());

            if (result && result.success) {
                setNewPasskeyLabel('');
                flashStatus('Passkey added. You can now use it to verify your logins.');
                await loadAccount();
            } else if (result && !result.cancelled && !handleSessionExpired(result)) {
                flashError(result.message || 'Could not add passkey');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleRemovePasskey = async (passkeyId, label) => {
        const confirmed = window.confirm(
            `Remove "${label || 'this passkey'}"? You will no longer be able to use it to sign in.`
        );
        if (!confirmed) { return; }

        setIsBusy(true);

        try {
            const result = await removePasskey(passkeyId);

            if (result && result.success) {
                flashStatus('Passkey removed.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Could not remove passkey');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleStartTotpSetup = async (password = '') => {
        setIsBusy(true);

        try {
            const result = await startTotpSetup(password);

            if (result && result.success && result.otpauthUri) {
                const qrDataUrl = await QRCode.toDataURL(result.otpauthUri, { width: 220, margin: 1 });
                setTotpSetup({ secret: result.secret, qrDataUrl, isReplacement: !!result.isReplacement });
                setTotpCode('');
                setTotpPassword('');
                setTotpPasswordNeeded(false);
            } else if (result && result.requiresPassword) {
                setTotpPasswordNeeded(true);
                if (password) { flashError(result.message || 'Current password is incorrect'); }
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Could not start authenticator setup');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleConfirmTotpSetup = async () => {
        setIsBusy(true);

        try {
            const result = await confirmTotpSetup(totpCode);

            if (result && result.success) {
                setTotpSetup(null);
                setTotpCode('');
                flashStatus('Authenticator app enabled.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Incorrect code');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleCancelTotpSetup = async () => {
        setIsBusy(true);

        try {
            await cancelTotpSetup();
            setTotpSetup(null);
            setTotpCode('');
            await loadAccount();
        } finally {
            setIsBusy(false);
        }
    };

    const handleRemoveTotp = async () => {
        if (!totpPassword) {
            flashError('Enter your current password to remove the authenticator app');
            return;
        }

        setIsBusy(true);

        try {
            const result = await removeTotp(totpPassword);

            if (result && result.success) {
                setTotpPassword('');
                setTotpRemoving(false);
                flashStatus('Authenticator app removed.');
                await loadAccount();
            } else if (!handleSessionExpired(result)) {
                flashError((result && result.message) || 'Could not remove the authenticator app');
            }
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

    const availableMethods = account?.availableMethods || [];
    const pendingEmail = account?.pendingEmail;

    const renderMethodPicker = () => (
        <div className={'admin-settings-card'}>
            <div className={'admin-settings-card-head'}>
                <h5>Preferred method</h5>
                <p className={'admin-settings-hint'}>
                    Offered first when you log in. You can always pick another method on the login screen.
                </p>
            </div>

            {availableMethods.length === 0 ? (
                <p className={'admin-settings-hint'}>
                    Nothing set up yet. Verify an email, add a passkey, or set up an authenticator app below.
                </p>
            ) : (
                <div className={'admin-settings-method-list'}>
                    {['passkey', 'totp', 'email'].map((method) => {
                        const available = availableMethods.includes(method);
                        const selected = account?.preferredMfa === method;

                        return (
                            <button
                                key={method}
                                type={'button'}
                                className={`admin-settings-method-option${selected ? ' selected' : ''}`}
                                disabled={isBusy || !available}
                                aria-pressed={selected}
                                onClick={() => handleSetPreferred(method)}
                            >
                                <span className={'admin-settings-method-radio'} aria-hidden={'true'}/>
                                <span className={'admin-settings-method-text'}>
                                    <span className={'admin-settings-method-name'}>{METHOD_LABELS[method]}</span>
                                    <span className={'admin-settings-method-blurb'}>
                                        {available ? METHOD_BLURBS[method] : 'Not set up yet'}
                                    </span>
                                </span>
                            </button>
                        );
                    })}

                    <button
                        type={'button'}
                        className={`admin-settings-method-option${!account?.preferredMfa ? ' selected' : ''}`}
                        disabled={isBusy}
                        aria-pressed={!account?.preferredMfa}
                        onClick={() => handleSetPreferred('auto')}
                    >
                        <span className={'admin-settings-method-radio'} aria-hidden={'true'}/>
                        <span className={'admin-settings-method-text'}>
                            <span className={'admin-settings-method-name'}>Automatic</span>
                            <span className={'admin-settings-method-blurb'}>
                                Use the strongest method I have set up.
                            </span>
                        </span>
                    </button>
                </div>
            )}
        </div>
    );

    const renderEmailCard = () => (
        <div className={'admin-settings-card'}>
            <div className={'admin-settings-card-head'}>
                <h5>Email</h5>
                <p className={'admin-settings-hint'}>
                    Must be an @harvestschools.com or @alfajralbasem.com address. Login codes are only ever
                    sent to an address you have confirmed.
                </p>
            </div>

            {account?.email ? (
                <div className={'admin-settings-value-row'}>
                    <span className={'admin-settings-value'}>{account.email}</span>
                    <span className={`admin-settings-badge${account.emailVerified ? ' verified' : ' unverified'}`}>
                        {account.emailVerified ? 'Verified' : 'Not verified'}
                    </span>
                </div>
            ) : (
                <p className={'admin-settings-hint'}>No email address on this account yet.</p>
            )}

            {pendingEmail && (
                <div className={'admin-settings-inline-panel'}>
                    <p className={'admin-settings-inline-title'}>
                        Confirm <strong>{pendingEmail}</strong>
                    </p>
                    <p className={'admin-settings-hint'}>
                        We sent a 6-digit code there. It stays valid for 10 minutes, and any code we have sent
                        you recently will still work &mdash; resending does not cancel the earlier ones.
                    </p>

                    <div className={'admin-settings-code-row'}>
                        <input
                            className={'admin-settings-code-input'}
                            type={'text'}
                            inputMode={'numeric'}
                            autoComplete={'one-time-code'}
                            maxLength={6}
                            placeholder={'000000'}
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                            disabled={isBusy}
                        />
                        <button
                            type={'button'}
                            className={'admin-settings-button primary'}
                            onClick={handleVerifyEmail}
                            disabled={isBusy || verifyCode.length !== 6}
                        >
                            Verify
                        </button>
                        <button
                            type={'button'}
                            className={'admin-settings-button ghost'}
                            onClick={handleResendVerification}
                            disabled={isBusy || resendIn > 0}
                        >
                            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                        </button>
                        <button
                            type={'button'}
                            className={'admin-settings-button ghost'}
                            onClick={handleCancelEmailChange}
                            disabled={isBusy}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {emailEditing ? (
                <div className={'admin-settings-inline-panel'}>
                    <label className={'admin-settings-label'} htmlFor={'admin-settings-email-draft'}>
                        New email address
                    </label>
                    <input
                        id={'admin-settings-email-draft'}
                        className={'admin-settings-text-input'}
                        type={'email'}
                        autoComplete={'off'}
                        placeholder={'name@harvestschools.com'}
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                        disabled={isBusy}
                    />

                    <label className={'admin-settings-label'} htmlFor={'admin-settings-email-password'}>
                        Current password
                    </label>
                    <input
                        id={'admin-settings-email-password'}
                        className={'admin-settings-text-input'}
                        type={'password'}
                        autoComplete={'current-password'}
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        disabled={isBusy}
                    />

                    <div className={'admin-settings-button-row'}>
                        <button
                            type={'button'}
                            className={'admin-settings-button primary'}
                            onClick={handleSubmitEmail}
                            disabled={isBusy}
                        >
                            Send verification code
                        </button>
                        <button
                            type={'button'}
                            className={'admin-settings-button ghost'}
                            onClick={() => { setEmailEditing(false); setEmailPassword(''); }}
                            disabled={isBusy}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                !pendingEmail && (
                    <div className={'admin-settings-button-row'}>
                        <button
                            type={'button'}
                            className={'admin-settings-button primary'}
                            onClick={handleStartEmailEdit}
                            disabled={isBusy}
                        >
                            {account?.email ? 'Change email' : 'Add email'}
                        </button>
                        {account?.email && (
                            <button
                                type={'button'}
                                className={'admin-settings-button danger-ghost'}
                                onClick={handleRemoveEmail}
                                disabled={isBusy}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                )
            )}
        </div>
    );

    const renderTotpCard = () => (
        <div className={'admin-settings-card'}>
            <div className={'admin-settings-card-head'}>
                <h5>Authenticator app</h5>
                <p className={'admin-settings-hint'}>
                    Works offline and does not depend on email delivery.
                </p>
            </div>

            {account?.hasTotp && !totpSetup ? (
                <>
                    <div className={'admin-settings-value-row'}>
                        <span className={'admin-settings-value'}>Authenticator app</span>
                        <span className={'admin-settings-badge verified'}>Enabled</span>
                    </div>

                    {totpRemoving ? (
                        <div className={'admin-settings-inline-panel'}>
                            <label className={'admin-settings-label'} htmlFor={'admin-settings-totp-remove-password'}>
                                Current password
                            </label>
                            <input
                                id={'admin-settings-totp-remove-password'}
                                className={'admin-settings-text-input'}
                                type={'password'}
                                autoComplete={'current-password'}
                                value={totpPassword}
                                onChange={(e) => setTotpPassword(e.target.value)}
                                disabled={isBusy}
                            />
                            <div className={'admin-settings-button-row'}>
                                <button
                                    type={'button'}
                                    className={'admin-settings-button danger'}
                                    onClick={handleRemoveTotp}
                                    disabled={isBusy}
                                >
                                    Remove authenticator
                                </button>
                                <button
                                    type={'button'}
                                    className={'admin-settings-button ghost'}
                                    onClick={() => { setTotpRemoving(false); setTotpPassword(''); }}
                                    disabled={isBusy}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={'admin-settings-button-row'}>
                            <button
                                type={'button'}
                                className={'admin-settings-button'}
                                onClick={() => handleStartTotpSetup(totpPassword)}
                                disabled={isBusy}
                            >
                                Replace
                            </button>
                            <button
                                type={'button'}
                                className={'admin-settings-button danger-ghost'}
                                onClick={() => setTotpRemoving(true)}
                                disabled={isBusy}
                            >
                                Remove
                            </button>
                        </div>
                    )}

                    {totpPasswordNeeded && (
                        <div className={'admin-settings-inline-panel'}>
                            <label className={'admin-settings-label'} htmlFor={'admin-settings-totp-password'}>
                                Current password (needed to replace your authenticator)
                            </label>
                            <input
                                id={'admin-settings-totp-password'}
                                className={'admin-settings-text-input'}
                                type={'password'}
                                autoComplete={'current-password'}
                                value={totpPassword}
                                onChange={(e) => setTotpPassword(e.target.value)}
                                disabled={isBusy}
                            />
                            <div className={'admin-settings-button-row'}>
                                <button
                                    type={'button'}
                                    className={'admin-settings-button primary'}
                                    onClick={() => handleStartTotpSetup(totpPassword)}
                                    disabled={isBusy || !totpPassword}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : totpSetup ? (
                <div className={'admin-settings-totp-setup'}>
                    <p className={'admin-settings-hint'}>
                        Scan this with Google Authenticator, Microsoft Authenticator, Authy or 1Password, then
                        enter the 6-digit code it shows.
                        {totpSetup.isReplacement && ' Your old authenticator stops working once this is confirmed.'}
                    </p>

                    <img
                        className={'admin-settings-totp-qr'}
                        src={totpSetup.qrDataUrl}
                        alt={'Authenticator app setup QR code'}
                    />

                    <p className={'admin-settings-totp-secret'}>
                        Can&apos;t scan? Enter this key manually: <code>{totpSetup.secret}</code>
                    </p>

                    <div className={'admin-settings-code-row'}>
                        <input
                            className={'admin-settings-code-input'}
                            type={'text'}
                            inputMode={'numeric'}
                            autoComplete={'one-time-code'}
                            maxLength={6}
                            placeholder={'000000'}
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                            disabled={isBusy}
                        />
                        <button
                            type={'button'}
                            className={'admin-settings-button primary'}
                            onClick={handleConfirmTotpSetup}
                            disabled={isBusy || totpCode.length !== 6}
                        >
                            Confirm
                        </button>
                        <button
                            type={'button'}
                            className={'admin-settings-button ghost'}
                            onClick={handleCancelTotpSetup}
                            disabled={isBusy}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className={'admin-settings-button-row'}>
                    <button
                        type={'button'}
                        className={'admin-settings-button primary'}
                        onClick={() => handleStartTotpSetup()}
                        disabled={isBusy}
                    >
                        Set up authenticator app
                    </button>
                </div>
            )}
        </div>
    );

    const renderPasskeyCard = () => (
        <div className={'admin-settings-card'}>
            <div className={'admin-settings-card-head'}>
                <h5>Passkeys</h5>
                <p className={'admin-settings-hint'}>
                    The strongest option. Nothing to type and nothing that can be phished.
                </p>
            </div>

            {account?.passkeys && account.passkeys.length > 0 ? (
                <ul className={'admin-settings-passkey-list'}>
                    {account.passkeys.map((passkey) => (
                        <li key={passkey.id} className={'admin-settings-passkey-row'}>
                            <div className={'admin-settings-passkey-info'}>
                                <span className={'admin-settings-passkey-label'}>
                                    {passkey.label || 'Passkey'}
                                </span>
                                <span className={'admin-settings-passkey-meta'}>
                                    Added {passkey.createdAt}
                                    {passkey.lastUsed ? `, last used ${passkey.lastUsed}` : ', never used'}
                                </span>
                            </div>
                            <button
                                type={'button'}
                                className={'admin-settings-button danger-ghost small'}
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

            {canUsePasskeys ? (
                <div className={'admin-settings-add-passkey'}>
                    <input
                        className={'admin-settings-text-input'}
                        type={'text'}
                        maxLength={100}
                        placeholder={'Device name (optional, e.g. Work Laptop)'}
                        value={newPasskeyLabel}
                        onChange={(e) => setNewPasskeyLabel(e.target.value)}
                        disabled={isBusy}
                    />
                    <button
                        type={'button'}
                        className={'admin-settings-button primary'}
                        onClick={handleAddPasskey}
                        disabled={isBusy}
                    >
                        Add a passkey
                    </button>
                </div>
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
                            className={`admin-settings-tab${activeTab === PROFILE_TAB ? ' active' : ''}`}
                            onClick={() => setActiveTab(PROFILE_TAB)}
                        >
                            Profile
                        </button>
                        <button
                            type={'button'}
                            role={'tab'}
                            aria-selected={activeTab === SECURITY_TAB}
                            className={`admin-settings-tab${activeTab === SECURITY_TAB ? ' active' : ''}`}
                            onClick={() => setActiveTab(SECURITY_TAB)}
                        >
                            Login &amp; Security
                            {availableMethods.length === 0 && account && (
                                <span className={'admin-settings-tab-dot'} aria-label={'Action needed'}/>
                            )}
                        </button>
                    </div>
                </div>

                <div className={'general-large-admin-action-modal-content admin-settings-modal-content'}>
                    {show && (
                        <>
                            {(isBusy || !account) && <Spinner/>}

                            {notice === 'passkey_prompt' && (
                                <div className={'admin-settings-notice'}>
                                    <p>
                                        Want faster, phishing-resistant sign-ins? Add a passkey and you can verify
                                        future logins with your fingerprint, face, or device PIN.
                                    </p>
                                    <button
                                        type={'button'}
                                        className={'admin-settings-button ghost'}
                                        onClick={handleDismissPasskeyPrompt}
                                        disabled={isBusy}
                                    >
                                        Don&apos;t ask again
                                    </button>
                                </div>
                            )}

                            {notice === 'mfa_setup' && (
                                <div className={'admin-settings-notice warning'}>
                                    <p>
                                        This account has no login verification method yet. Verify an email address,
                                        add a passkey, or set up an authenticator app below.
                                    </p>
                                </div>
                            )}

                            {statusMsg && <p className={'admin-settings-status'} role={'status'}>{statusMsg}</p>}
                            {errorMsg && <p className={'admin-settings-error'} role={'alert'}>{errorMsg}</p>}

                            {account && activeTab === PROFILE_TAB && (
                                <div className={'admin-settings-section'}>
                                    {accountFormFields && (
                                        <Form fields={accountFormFields}
                                              mailTo={''}
                                              sendPdf={false}
                                              formTitle={'Admin Account Settings Form'}
                                              lang={'en'}
                                              captchaLength={1}
                                              noInputFieldsCache={true}
                                              noCaptcha={true}
                                              resetFormFromParent={resetAccountForm}
                                              setResetForFromParent={setResetAccountForm}
                                              hasDifferentOnSubmitBehaviour={true}
                                              differentOnSubmitBehaviour={handleAccountSubmit}
                                              formInModalPopup={true}
                                              setShowFormModalPopup={() => {}}
                                              formHasPasswordField={true}
                                              forceEnglishForm={true}
                                              noClearOption={true}
                                              hasDifferentSubmitButtonText={true}
                                              differentSubmitButtonText={['Save Changes', 'Saving...']}
                                              formFooterButtonsAreOutside={true}
                                              footerButtonsPortalTarget={accountFormFooterButtonsRef}
                                        />
                                    )}
                                </div>
                            )}

                            {account && activeTab === SECURITY_TAB && (
                                <div className={'admin-settings-section'}>
                                    {renderMethodPicker()}
                                    {renderEmailCard()}
                                    {renderTotpCard()}
                                    {renderPasskeyCard()}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={'general-large-admin-action-modal-footer admin-settings-modal-footer'}>
                    <button
                        type={'button'}
                        className={'admin-settings-button ghost admin-settings-modal-close-button'}
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <div ref={accountFormFooterButtonsRef} className={'modal-footer-buttons-portal-target'}/>
                </div>
            </div>
        </animated.div>
    );
}

AdminSettingsModal.propTypes = {
    show: PropTypes.bool.isRequired,
    notice: PropTypes.string,
    onClose: PropTypes.func.isRequired,
};

export default AdminSettingsModal;
