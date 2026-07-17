import {endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";
import {validateAdminSessionLocally} from "./MainAdminServices.jsx";
import {decodeCreateArgs, decodeGetArgs, bufToB64} from "../../General/PasskeyUtils.jsx";

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

const dismissPasskeyPrompt = async () => {
    return authedPost(endpoints.dismissPasskeyPrompt);
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

const startTotpSetup = async () => {
    return authedPost(endpoints.setupTotp);
};

const confirmTotpSetup = async (code) => {
    return authedPost(endpoints.confirmTotp, { code });
};

const cancelTotpSetup = async () => {
    return authedPost(endpoints.confirmTotp, { action: 'cancel' });
};

const requestStepUp = async (action, payload = {}) => {
    return authedPost(endpoints.requestStepUp, { action, payload });
};

const resendStepUpEmailCode = async (stepUpToken) => {
    return authedPost(endpoints.requestStepUpEmailCode, { step_up_token: stepUpToken });
};

const verifyStepUpCode = async (stepUpToken, method, code) => {
    return authedPost(endpoints.verifyStepUp, { step_up_token: stepUpToken, method, code });
};

const verifyStepUpPasskey = async (stepUpToken) => {
    try {
        const optionsResult = await authedPost(endpoints.stepUpPasskeyOptions, { step_up_token: stepUpToken });

        if (!optionsResult || !optionsResult.success || !optionsResult.options) {
            return optionsResult || { success: false, message: 'Could not start passkey verification' };
        }

        const assertion = await navigator.credentials.get(decodeGetArgs(optionsResult.options));

        if (!assertion) {
            return { success: false, message: 'Passkey prompt was cancelled', cancelled: true };
        }

        return await authedPost(endpoints.verifyStepUp, {
            step_up_token: stepUpToken,
            method: 'passkey',
            id: bufToB64(assertion.rawId),
            clientDataJSON: bufToB64(assertion.response.clientDataJSON),
            authenticatorData: bufToB64(assertion.response.authenticatorData),
            signature: bufToB64(assertion.response.signature),
        });
    } catch (error) {
        if (error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
            return { success: false, message: 'Passkey prompt was cancelled', cancelled: true };
        }

        return { success: false, message: error.message };
    }
};

const removePasskey = async (passkeyId) => {
    return requestStepUp('remove_passkey', { passkey_id: passkeyId });
};


const requestEmailChange = async (email, currentPassword = '') => {
    return authedPost(endpoints.requestEmailChange, { email, current_password: currentPassword });
};

const listSessions = async () => {
    return authedPost(endpoints.listAdminSessions);
};

const revokeSession = async (publicId) => {
    return authedPost(endpoints.revokeAdminSession, { public_id: publicId });
};

const revokeAllOtherSessions = async () => {
    return authedPost(endpoints.revokeAdminSession, { action: 'all_others' });
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
    revokeAllOtherSessions
}