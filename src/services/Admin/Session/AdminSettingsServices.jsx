import {endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";
import {validateAdminSessionLocally} from "./MainAdminServices.jsx";
import {decodeCreateArgs, bufToB64} from "../../General/PasskeyUtils.jsx";

const authedPost = async (endpoint, body = null) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        return { success: false, code: 401, message: 'Session expired' };
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                ...(await buildAuthHeaders(sessionId)),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body ?? {}),
        });

        return await response.json();
    } catch (error) {
        return { success: false, code: 0, message: error.message };
    }
};

const fetchMyAccount = async () => {
    return authedPost(endpoints.getMyAccount);
};


const updateMyAccount = async (payload) => {
    return authedPost(endpoints.updateMyAccount, payload);
};

const dismissPasskeyPrompt = async () => {
    return authedPost(endpoints.updateMyAccount, { action: 'dismiss_passkey_prompt' });
};

const resendEmailVerification = async () => {
    return authedPost(endpoints.requestEmailVerification);
};

const confirmEmailChange = async (code) => {
    return authedPost(endpoints.confirmEmailVerification, { code });
};

const cancelEmailChange = async () => {
    return authedPost(endpoints.confirmEmailVerification, { action: 'cancel' });
};

const setPreferredMfa = async (method) => {
    return authedPost(endpoints.setPreferredMfa, { method });
};

const startTotpSetup = async (currentPassword = '') => {
    return authedPost(endpoints.setupTotp, { current_password: currentPassword });
};

const confirmTotpSetup = async (code) => {
    return authedPost(endpoints.confirmTotp, { code });
};

const cancelTotpSetup = async () => {
    return authedPost(endpoints.confirmTotp, { action: 'cancel' });
};

const removeTotp = async (currentPassword) => {
    return authedPost(endpoints.deleteTotp, { current_password: currentPassword });
};

const removePasskey = async (passkeyId) => {
    return authedPost(endpoints.deletePasskey, { passkey_id: passkeyId });
};

const registerPasskey = async (label) => {
    try {
        const optionsResult = await authedPost(endpoints.passkeyRegisterOptions);

        if (!optionsResult || !optionsResult.success || !optionsResult.options) {
            return optionsResult || { success: false, message: 'Could not start passkey registration' };
        }

        const credential = await navigator.credentials.create(decodeCreateArgs(optionsResult.options));

        if (!credential) {
            return { success: false, message: 'Passkey creation was cancelled', cancelled: true };
        }

        return await authedPost(endpoints.passkeyRegisterVerify, {
            id: bufToB64(credential.rawId),
            clientDataJSON: bufToB64(credential.response.clientDataJSON),
            attestationObject: bufToB64(credential.response.attestationObject),
            label: label || '',
        });
    } catch (error) {
        if (error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
            return { success: false, message: 'Passkey prompt was cancelled', cancelled: true };
        }

        if (error && error.name === 'InvalidStateError') {
            return { success: false, message: 'A passkey for this account already exists on this device' };
        }

        return { success: false, message: error.message };
    }
};

export {
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
    removePasskey
}
