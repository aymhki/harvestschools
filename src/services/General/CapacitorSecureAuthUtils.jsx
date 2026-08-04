import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

const DEFAULT_MOBILE_SESSION_DURATION = 24 * 60 * 60 * 1000;

const secureSessionIdKey = (namespace) => `${namespace}_secure_session_id`;
const secureSessionTimeKey = (namespace) => `${namespace}_secure_session_time`;
const biometricServerKey = (namespace) => `${namespace}_biometric_login`;

const generateSecureSessionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
        const randomValue = (Math.random() * 16) | 0;
        const value = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
        return value.toString(16);
    });
};

const deviceBindingKey = (namespace) => `${namespace}_device_binding_secret`;


const setDeviceBindingSecret = async (namespace, secret) => {
    if (!secret) { return; }

    try {
        await SecureStoragePlugin.set({ key: deviceBindingKey(namespace), value: secret });
    } catch (error) {
        console.log(error);
    }
};

const getDeviceBindingSecret = async (namespace) => {
    try {
        const result = await SecureStoragePlugin.get({ key: deviceBindingKey(namespace) });
        return (result && result.value) || null;
    } catch (error) {
        return null;
    }
};

const clearDeviceBindingSecret = async (namespace) => {
    try {
        await SecureStoragePlugin.remove({ key: deviceBindingKey(namespace) });
    } catch (error) {
        console.log(error);
    }
};

const clearMobileSession = async (namespace) => {
    await clearDeviceBindingSecret(namespace);

    try {
        await SecureStoragePlugin.remove({ key: secureSessionIdKey(namespace) });
    } catch (error) {
        console.log(error);
    }

    try {
        await SecureStoragePlugin.remove({ key: secureSessionTimeKey(namespace) });
    } catch (error) {
        console.log(error);
    }
};

const getMobileSession = async (namespace, sessionDurationMs = DEFAULT_MOBILE_SESSION_DURATION) => {
    try {
        const idResult = await SecureStoragePlugin.get({ key: secureSessionIdKey(namespace) });
        const timeResult = await SecureStoragePlugin.get({ key: secureSessionTimeKey(namespace) });
        const sessionId = idResult && idResult.value;
        const sessionTime = timeResult && parseInt(timeResult.value, 10);

        if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDurationMs) {
            await clearMobileSession(namespace);
            return null;
        }

        return sessionId;
    } catch (error) {
        return null;
    }
};

const setMobileSession = async (namespace, sessionId) => {
    try {
        await SecureStoragePlugin.set({ key: secureSessionIdKey(namespace), value: sessionId });
        await SecureStoragePlugin.set({ key: secureSessionTimeKey(namespace), value: String(Date.now()) });

        return true;
    } catch (error) {
        return false;
    }
};

const extendMobileSession = async (namespace, sessionId) => {
    return setMobileSession(namespace, sessionId);
};

const isBiometricAvailable = async () => {
    try {
        const result = await NativeBiometric.isAvailable();
        return !!(result && result.isAvailable);
    } catch (error) {
        return false;
    }
};

const hasSavedBiometricCredentials = async (namespace) => {
    try {
        const result = await NativeBiometric.isCredentialsSaved({ server: biometricServerKey(namespace) });
        return !!(result && result.isSaved);
    } catch (error) {
        return false;
    }
};

const saveBiometricCredentials = async (namespace, username, password) => {
    try {
        const serverKey = biometricServerKey(namespace);

        try {
            await NativeBiometric.deleteCredentials({
                server: serverKey
            });
        } catch (deleteError) {
            console.log(deleteError.message);
        }

        await NativeBiometric.setCredentials({
            username,
            password,
            server: serverKey,
        });

        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
};

const getBiometricCredentials = async (namespace) => {
    try {
        const credentials = await NativeBiometric.getCredentials({ server: biometricServerKey(namespace) });
        return credentials || null;
    } catch (error) {
        return null;
    }
};

const deleteBiometricCredentials = async (namespace) => {
    try {
        await NativeBiometric.deleteCredentials({ server: biometricServerKey(namespace) });
    } catch (error) {
        console.log(error.message);
    }
};

const credentialListKey = (namespace) => `${namespace}_credential_list`;

const lastUsedCredentialKey = (namespace) => `${namespace}_last_used_credential`;

const credentialBiometricNamespace = (namespace, credentialId) => `${namespace}_cred_${credentialId}`;


const listSecureCredentials = async (namespace) => {
    try {
        const result = await SecureStoragePlugin.get({ key: credentialListKey(namespace) });
        const parsed = result && result.value ? JSON.parse(result.value) : null;

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const writeSecureCredentialList = async (namespace, records) => {
    try {
        await SecureStoragePlugin.set({ key: credentialListKey(namespace), value: JSON.stringify(records) });

        return true;
    } catch (error) {
        console.log(error);

        return false;
    }
};

const saveSecureCredentialRecord = async (namespace, record) => {
    if (!record || !record.id) { return null; }

    const records = await listSecureCredentials(namespace);
    const existingIndex = records.findIndex((candidate) => candidate.id === record.id);
    const merged = existingIndex === -1 ? record : { ...records[existingIndex], ...record };

    if (existingIndex === -1) {
        records.push(merged);
    } else {
        records[existingIndex] = merged;
    }

    await writeSecureCredentialList(namespace, records);

    return merged;
};

const removeSecureCredentialRecord = async (namespace, credentialId) => {
    const records = await listSecureCredentials(namespace);

    await writeSecureCredentialList(namespace, records.filter((candidate) => candidate.id !== credentialId));

    await deleteBiometricCredentials(credentialBiometricNamespace(namespace, credentialId));

    const lastUsed = await getLastUsedCredentialId(namespace);

    if (lastUsed === credentialId) {
        try {
            await SecureStoragePlugin.remove({ key: lastUsedCredentialKey(namespace) });
        } catch (error) {
            console.log(error);
        }
    }
};

const getLastUsedCredentialId = async (namespace) => {
    try {
        const result = await SecureStoragePlugin.get({ key: lastUsedCredentialKey(namespace) });

        return (result && result.value) || null;
    } catch (error) {
        return null;
    }
};

const setLastUsedCredentialId = async (namespace, credentialId) => {
    try {
        await SecureStoragePlugin.set({ key: lastUsedCredentialKey(namespace), value: String(credentialId) });
    } catch (error) {
        console.log(error);
    }
};

const verifyBiometricIdentity = async (options) => {
    try {
        await NativeBiometric.verifyIdentity({
            ...options,
            useFallback: true,
        });
        return true;
    } catch (error) {
        return false;
    }
};


export {
    DEFAULT_MOBILE_SESSION_DURATION,
    generateSecureSessionId,
    setDeviceBindingSecret,
    getDeviceBindingSecret,
    clearDeviceBindingSecret,
    getMobileSession,
    setMobileSession,
    extendMobileSession,
    clearMobileSession,
    isBiometricAvailable,
    hasSavedBiometricCredentials,
    saveBiometricCredentials,
    getBiometricCredentials,
    deleteBiometricCredentials,
    verifyBiometricIdentity,
    credentialBiometricNamespace,
    listSecureCredentials,
    saveSecureCredentialRecord,
    removeSecureCredentialRecord,
    getLastUsedCredentialId,
    setLastUsedCredentialId,
};

