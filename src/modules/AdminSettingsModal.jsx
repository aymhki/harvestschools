import '../styles/AdminDashboard.css';
import '../styles/AdminSettings.css';
import {useEffect, useMemo, useRef, useState} from 'react';
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
    startTotpSetup,
    confirmTotpSetup,
    registerPasskey,
    removePasskey,
} from '../services/Admin/Session/AdminSettingsServices.jsx';
import {passkeySupported} from '../services/General/PasskeyUtils.jsx';
import {isMobileApp} from '../services/Admin/Session/MainAdminServices.jsx';
import {adminLoginPageUrl, msgTimeout} from '../services/General/GeneralUtils.jsx';

const currentPasswordFieldId = 1;
const nameFieldId = 2;
const usernameFieldId = 3;
const emailFieldId = 4;
const newPasswordFieldId = 5;
const confirmNewPasswordFieldId = 6;

function AdminSettingsModal({show, notice, onClose}) {
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [isBusy, setIsBusy] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [totpSetup, setTotpSetup] = useState(null);
    const [totpCode, setTotpCode] = useState('');
    const [newPasskeyLabel, setNewPasskeyLabel] = useState('');
    const [resetAccountForm, setResetAccountForm] = useState(false);
    const accountFormFooterButtonsRef = useRef(null);

    // WebAuthn is unavailable inside the Capacitor webview; the native app
    // already has its own biometric login via secure storage.
    const canUsePasskeys = passkeySupported() && !isMobileApp();

    const animateSettingsModal = useSpring({
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(-100%)'
    });

    const flashStatus = (msg) => {
        setStatusMsg(msg);
        setErrorMsg(null);
        setTimeout(() => { setStatusMsg(null); }, msgTimeout);
    };

    const flashError = (msg) => {
        setErrorMsg(msg);
        setStatusMsg(null);
        setTimeout(() => { setErrorMsg(null); }, msgTimeout);
    };

    const handleSessionExpired = (result) => {
        if (result && result.code === 401) {
            navigate(adminLoginPageUrl, { replace: true });
            return true;
        }
        return false;
    };

    const loadAccount = async () => {
        const result = await fetchMyAccount();

        if (result && result.success && result.account) {
            setAccount(result.account);
        } else if (!handleSessionExpired(result)) {
            flashError((result && result.message) || 'Could not load account details');
        }
    };

    useEffect(() => {
        if (show) {
            setAccount(null);
            setTotpSetup(null);
            setTotpCode('');
            setNewPasskeyLabel('');
            setStatusMsg(null);
            setErrorMsg(null);
            loadAccount();
        }
    }, [show]);

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
                id: emailFieldId,
                type: 'email',
                name: 'email',
                label: 'Email',
                required: false,
                placeholder: 'name@harvestschools.com',
                errorMsg: 'Please enter a valid email',
                value: account.email || '',
                setValue: null,
                widthOfField: 1,
                httpName: 'email',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                displayLabel: 'Email (@harvestschools.com or @alfajralbasem.com, used for login verification codes)',
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
                displayLabel: "New Password (Leave blank if you don't want to change it)",
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
                displayLabel: "Confirm New Password (Leave blank if you don't want to change it)",
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
            email: formDataJson[`field_${emailFieldId}`] || '',
            new_password: newPassword,
        });

        if (result && result.success) {
            flashStatus(newPassword
                ? 'Account updated. Other devices have been signed out.'
                : 'Account updated.');
            setResetAccountForm(true);
            await loadAccount();
            return true;
        }

        if (handleSessionExpired(result)) { return true; }

        throw new Error((result && result.message) || 'Could not update account');
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

    const handleStartTotpSetup = async () => {
        setIsBusy(true);
        try {
            const result = await startTotpSetup();

            if (result && result.success && result.otpauthUri) {
                const qrDataUrl = await QRCode.toDataURL(result.otpauthUri, { width: 220, margin: 1 });
                setTotpSetup({ secret: result.secret, qrDataUrl });
                setTotpCode('');
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

    const handleDismissPasskeyPrompt = async () => {
        setIsBusy(true);
        try {
            await dismissPasskeyPrompt();
        } finally {
            setIsBusy(false);
            onClose();
        }
    };

    const preferredMfaText = (preferredMfa) => {
        switch (preferredMfa) {
            case 'passkey': return 'Passkey';
            case 'totp': return 'Authenticator app';
            case 'email': return 'Email code';
            default: return 'Not set yet';
        }
    };

    return (
        <animated.div style={animateSettingsModal} className={"general-large-admin-action-modal"}>
            <div className={"general-large-admin-action-modal-overlay"} onClick={onClose}/>
            <div className={"general-large-admin-action-modal-container admin-settings-modal-container"}>
                <div className={"general-large-admin-action-modal-header"}>
                    <h3>
                        Settings
                    </h3>
                </div>
                <div className={"general-large-admin-action-modal-content admin-settings-modal-content"}>
                    {show && (
                        <>
                            {(isBusy || !account) && <Spinner/>}

                            {notice === 'passkey_prompt' && (
                                <div className={"admin-settings-notice"}>
                                    <p>
                                        Want faster, phishing-resistant sign-ins? Add a passkey below and you can verify future logins with your fingerprint, face, or device PIN.
                                    </p>
                                    <button type={'button'} onClick={handleDismissPasskeyPrompt} disabled={isBusy}>
                                        Don&apos;t ask again
                                    </button>
                                </div>
                            )}

                            {notice === 'mfa_setup' && (
                                <div className={"admin-settings-notice"}>
                                    <p>
                                        Your account has no login verification method yet. Add your work email in the Account section, or set up an authenticator app below, to protect your account.
                                    </p>
                                </div>
                            )}

                            {statusMsg && <p className={"admin-settings-status"}>{statusMsg}</p>}
                            {errorMsg && <p className={"admin-settings-error"}>{errorMsg}</p>}

                            {account && (
                                <>
                                    <div className={"admin-settings-section"}>
                                        <h4>Account</h4>
                                        {accountFormFields && (
                                            <Form fields={accountFormFields}
                                                  mailTo={''}
                                                  sendPdf={false}
                                                  formTitle={"Admin Account Settings Form"}
                                                  lang={"en"}
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

                                    <div className={"admin-settings-section"}>
                                        <h4>Login Verification</h4>
                                        <p className={"admin-settings-hint"}>
                                            Preferred method: {preferredMfaText(account.preferredMfa)}
                                        </p>

                                        <div className={"admin-settings-subsection"}>
                                            <h5>Passkeys</h5>
                                            {account.passkeys && account.passkeys.length > 0 ? (
                                                <ul className={"admin-settings-passkey-list"}>
                                                    {account.passkeys.map((passkey) => (
                                                        <li key={passkey.id} className={"admin-settings-passkey-row"}>
                                                            <div className={"admin-settings-passkey-info"}>
                                                                <span className={"admin-settings-passkey-label"}>
                                                                    {passkey.label || 'Passkey'}
                                                                </span>
                                                                <span className={"admin-settings-passkey-meta"}>
                                                                    Added {passkey.createdAt}{passkey.lastUsed ? `, last used ${passkey.lastUsed}` : ''}
                                                                </span>
                                                            </div>
                                                            <button
                                                                type={'button'}
                                                                className={"admin-settings-passkey-remove"}
                                                                disabled={isBusy}
                                                                onClick={() => handleRemovePasskey(passkey.id, passkey.label)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className={"admin-settings-hint"}>
                                                    No passkeys yet.
                                                </p>
                                            )}

                                            {canUsePasskeys ? (
                                                <div className={"admin-settings-add-passkey"}>
                                                    <input
                                                        type={'text'}
                                                        maxLength={100}
                                                        placeholder={'Device name (optional, e.g. Work Laptop)'}
                                                        value={newPasskeyLabel}
                                                        onChange={(e) => setNewPasskeyLabel(e.target.value)}
                                                        disabled={isBusy}
                                                    />
                                                    <button type={'button'} onClick={handleAddPasskey} disabled={isBusy}>
                                                        Add a Passkey
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className={"admin-settings-hint"}>
                                                    {isMobileApp()
                                                        ? 'Passkeys are managed from a web browser. This app already supports biometric sign-in on this device.'
                                                        : 'This browser does not support passkeys.'}
                                                </p>
                                            )}
                                        </div>

                                        <div className={"admin-settings-subsection"}>
                                            <h5>Authenticator App</h5>
                                            {account.hasTotp ? (
                                                <p className={"admin-settings-hint"}>
                                                    Enabled. Codes from your authenticator app can be used to verify logins.
                                                </p>
                                            ) : totpSetup ? (
                                                <div className={"admin-settings-totp-setup"}>
                                                    <p className={"admin-settings-hint"}>
                                                        Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.), then enter the 6-digit code it shows to finish.
                                                    </p>
                                                    <img
                                                        className={"admin-settings-totp-qr"}
                                                        src={totpSetup.qrDataUrl}
                                                        alt={'Authenticator app setup QR code'}
                                                    />
                                                    <p className={"admin-settings-totp-secret"}>
                                                        Can&apos;t scan? Enter this key manually: <code>{totpSetup.secret}</code>
                                                    </p>
                                                    <div className={"admin-settings-totp-confirm"}>
                                                        <input
                                                            type={'text'}
                                                            inputMode={'numeric'}
                                                            maxLength={6}
                                                            placeholder={'6-digit code'}
                                                            value={totpCode}
                                                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                                            disabled={isBusy}
                                                        />
                                                        <button
                                                            type={'button'}
                                                            onClick={handleConfirmTotpSetup}
                                                            disabled={isBusy || totpCode.length !== 6}
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            type={'button'}
                                                            onClick={() => { setTotpSetup(null); setTotpCode(''); }}
                                                            disabled={isBusy}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button type={'button'} onClick={handleStartTotpSetup} disabled={isBusy}>
                                                    Set Up Authenticator App
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
                <div className={"general-large-admin-action-modal-footer"}>
                    <button className={"admin-settings-modal-close-button"} onClick={onClose}>
                        Close
                    </button>
                    <div ref={accountFormFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
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
