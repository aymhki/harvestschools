import {
    generateSecureSessionId,
    isBiometricAvailable,
    hasSavedBiometricCredentials,
    saveBiometricCredentials,
    getBiometricCredentials,
    deleteBiometricCredentials,
    credentialBiometricNamespace,
    listSecureCredentials,
    saveSecureCredentialRecord,
    removeSecureCredentialRecord,
    getLastUsedCredentialId,
    setLastUsedCredentialId,
} from './CapacitorSecureAuthUtils.jsx'
import {
    SCHOOL_EVERYWHERE_ORIGIN,
    getSchoolEverywhereUrl,
    attachExternalSiteListeners,
    openHiddenExternalSite,
    revealExternalSite,
    runScriptInExternalSite,
    closeExternalSite,
    clearExternalSiteCookies,
    markExternalSiteClosed,
} from './ExternalSiteService.jsx'


const SCHOOL_EVERYWHERE_NAMESPACE = 'schooleverywhere'

const PORTAL_LOGIN_URL = getSchoolEverywhereUrl('portal')

const LOGIN_PATHS = ['/schooleverywhere/', '/schooleverywhere/index.php']

const EXPECTED_FIELD_NAMES = ['iden', 'password', 'typeofuser', 'username']

const MESSAGE_CHANNEL = 'harvest-schooleverywhere'

const LOGIN_OUTCOME = {
    LANDED: 'landed',
    REJECTED: 'rejected',
    FORM_CHANGED: 'form-changed',
    TIMED_OUT: 'timed-out',
    DISMISSED: 'dismissed',
}

const LOGIN_TIMEOUT_MS = 45000

const SUBMIT_SETTLE_MS = 8000

const PROBE_ATTEMPTS = 40

const PROBE_INTERVAL_MS = 750

const USER_TYPES = [
    { value: 'management', slug: 'management' },
    { value: 'student', slug: 'student' },
    { value: 'staff', slug: 'staff' },
    { value: 'parent', slug: 'parent' },
    { value: 'library', slug: 'library' },
    { value: 'canteen', slug: 'canteen' },
    { value: 'Bus Attendance', slug: 'bus-attendance' },
]


const getUserTypeSlug = (typeValue) => {
    const match = USER_TYPES.find((candidate) => candidate.value === typeValue)

    return match ? match.slug : null
}


const describeUserType = (typeValue, translate) => {
    const slug = getUserTypeSlug(typeValue)

    return slug ? translate(`schooleverywhere.user-types.${slug}`) : typeValue
}


const userTypeFromLabel = (label, translate) => {
    const match = USER_TYPES.find((candidate) => translate(`schooleverywhere.user-types.${candidate.slug}`) === label)

    return match ? match.value : null
}


const describeCredential = (credential, translate) => {
    const typeLabel = describeUserType(credential.typeofuser, translate)

    return credential.username ? `${typeLabel} — ${credential.username}` : typeLabel
}


const isLoginUrl = (url) => {
    let isLogin = false

    try {
        const parsed = new URL(url)

        isLogin = parsed.origin === SCHOOL_EVERYWHERE_ORIGIN && LOGIN_PATHS.includes(parsed.pathname)
    } catch (parseError) {
        isLogin = false
    }

    return isLogin
}


const isPortalUrl = (url) => {
    let isPortal = false

    try {
        isPortal = new URL(url).origin === SCHOOL_EVERYWHERE_ORIGIN
    } catch (parseError) {
        isPortal = false
    }

    return isPortal
}


const buildLoginInjectionScript = (credential, password) => {
    const payload = JSON.stringify({
        username: credential.username,
        password,
        typeofuser: credential.typeofuser,
        iden: credential.iden,
        channel: MESSAGE_CHANNEL,
        expected: EXPECTED_FIELD_NAMES,
    })

    return `(async () => {
    const input = ${payload};
    const send = (status, detail) => {
        try { window.mobileApp.postMessage({ channel: input.channel, status: status, detail: detail || '' }); } catch (ignored) {}
    };
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
        const form = document.forms['login-form'];

        if (!form) { send('form-changed', 'no-form'); return; }

        const usernameField = form.querySelector('#username');
        const passwordField = form.querySelector('#password');
        const typeField = form.querySelector('#typeofuser');
        const submitButton = form.querySelector('input[type=submit][name=submit]');

        if (!usernameField || !passwordField || !typeField || !submitButton) { send('form-changed', 'missing-core-field'); return; }

        const hasType = Array.prototype.some.call(typeField.options, (option) => option.value === input.typeofuser);

        if (!hasType) { send('form-changed', 'unknown-user-type'); return; }

        typeField.value = input.typeofuser;
        typeField.dispatchEvent(new Event('change', { bubbles: true }));

        let identifierField = null;

        for (let attempt = 0; attempt < 60 && !identifierField; attempt++) {
            await wait(100);
            identifierField = form.querySelector('#iden');
        }

        if (!identifierField) { send('form-changed', 'no-identifier-field'); return; }

        const presentNames = Array.prototype.filter.call(form.elements, (element) => element.name && element.type !== 'submit')
            .map((element) => element.name)
            .sort();

        if (presentNames.join(',') !== input.expected.join(',')) { send('form-changed', presentNames.join(',')); return; }

        usernameField.value = input.username;
        passwordField.value = input.password;
        identifierField.value = input.iden;

        [usernameField, passwordField, identifierField].forEach((field) => {
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        });

        send('submitting');

        submitButton.click();
    } catch (injectionError) {
        send('form-changed', String(injectionError && injectionError.message));
    }
})();`
}



const CLEAR_PORTAL_SESSION_ON_CLOSE = false


const endPortalSession = async () => {
    if (!CLEAR_PORTAL_SESSION_ON_CLOSE) { return }

    await clearExternalSiteCookies(PORTAL_LOGIN_URL)
}


const buildLocationProbeScript = () => `(() => {
    try { window.mobileApp.postMessage({ channel: '${MESSAGE_CHANNEL}', status: 'location', detail: location.href }); } catch (ignored) {}
})();`


const signInToPortal = async ({ credential, password, onStage }) => {
    const startUrl = credential.landingUrl || PORTAL_LOGIN_URL

    let detachListeners = () => {}
    let timeoutId = null
    let isSettled = false
    let resolveOutcome = null
    let hasInjected = false
    let submittedAt = 0
    let hasReloadedSinceSubmit = false

    const outcomePromise = new Promise((resolve) => {
        resolveOutcome = resolve
    })

    const settle = (outcome, landingUrl) => {
        if (isSettled) { return }

        isSettled = true

        if (timeoutId) { clearTimeout(timeoutId) }

        detachListeners()

        resolveOutcome({ outcome, landingUrl: landingUrl || null })
    }

    const considerUrl = (url) => {
        if (!url || !isPortalUrl(url) || isSettled) { return }

        if (!isLoginUrl(url)) {
            settle(LOGIN_OUTCOME.LANDED, url)

            return
        }

        if (!hasInjected) {
            hasInjected = true

            if (onStage) { onStage('signing-in') }

            runScriptInExternalSite(buildLoginInjectionScript(credential, password))

            return
        }

        if (submittedAt === 0) { return }

        const submitHasHadLongEnough = Date.now() - submittedAt > SUBMIT_SETTLE_MS

        if (hasReloadedSinceSubmit || submitHasHadLongEnough) {
            settle(LOGIN_OUTCOME.REJECTED)
        }
    }

    detachListeners = attachExternalSiteListeners({
        onClose: () => {
            markExternalSiteClosed()

            settle(LOGIN_OUTCOME.DISMISSED)
        },
        onPageLoaded: () => {
            if (submittedAt !== 0) { hasReloadedSinceSubmit = true }

            runScriptInExternalSite(buildLocationProbeScript())
        },
        onUrlChange: (url) => considerUrl(url),
        onMessage: (detail) => {
            if (!detail || detail.channel !== MESSAGE_CHANNEL) { return }

            if (detail.status === 'location') {
                considerUrl(detail.detail)
            } else if (detail.status === 'form-changed') {
                settle(LOGIN_OUTCOME.FORM_CHANGED)
            } else if (detail.status === 'submitting') {
                submittedAt = Date.now()

                if (onStage) { onStage('submitting') }
            }
        },
    })

    timeoutId = setTimeout(() => settle(LOGIN_OUTCOME.TIMED_OUT), LOGIN_TIMEOUT_MS)

    try {
        await openHiddenExternalSite({ url: startUrl, title: 'SchoolEverywhere' })

        for (let attempt = 0; attempt < PROBE_ATTEMPTS && !isSettled; attempt++) {
            await runScriptInExternalSite(buildLocationProbeScript())

            if (isSettled) { break }

            await new Promise((resolve) => setTimeout(resolve, PROBE_INTERVAL_MS))
        }
    } catch (openError) {
        console.warn('[schooleverywhere] Could not start the sign in', openError)

        settle(LOGIN_OUTCOME.TIMED_OUT)
    }

    const result = await outcomePromise

    if (result.outcome === LOGIN_OUTCOME.LANDED) {
        await rememberLandingUrl(credential.id, result.landingUrl)

        await revealExternalSite()
    } else if (result.outcome !== LOGIN_OUTCOME.DISMISSED) {
        if (credential.id && credential.landingUrl && result.outcome === LOGIN_OUTCOME.REJECTED) {
            await forgetLandingUrl(credential.id)
        }

        markExternalSiteClosed()

        await closeExternalSite()
    }

    return result
}


const listPortalCredentials = () => listSecureCredentials(SCHOOL_EVERYWHERE_NAMESPACE)


const getPreferredCredentialId = async (credentials) => {
    const lastUsedId = await getLastUsedCredentialId(SCHOOL_EVERYWHERE_NAMESPACE)

    const stillExists = credentials.some((candidate) => candidate.id === lastUsedId)

    return stillExists ? lastUsedId : (credentials[0] ? credentials[0].id : null)
}


const savePortalCredential = async ({ id, username, password, typeofuser, iden, landingUrl, rememberWithBiometrics }) => {
    const credentialId = id || generateSecureSessionId()

    const record = await saveSecureCredentialRecord(SCHOOL_EVERYWHERE_NAMESPACE, {
        id: credentialId,
        username,
        typeofuser,
        iden,
        ...(landingUrl ? { landingUrl } : {}),
        lastUsedAt: Date.now(),
    })

    if (rememberWithBiometrics && password) {
        const hardwareAvailable = await isBiometricAvailable()

        if (hardwareAvailable) {
            await saveBiometricCredentials(
                credentialBiometricNamespace(SCHOOL_EVERYWHERE_NAMESPACE, credentialId),
                username,
                password
            )
        }
    }

    await setLastUsedCredentialId(SCHOOL_EVERYWHERE_NAMESPACE, credentialId)

    return record
}

const rememberLandingUrl = async (credentialId, landingUrl) => {
    if (!credentialId || !landingUrl) { return }

    await saveSecureCredentialRecord(SCHOOL_EVERYWHERE_NAMESPACE, {
        id: credentialId,
        landingUrl,
        lastUsedAt: Date.now(),
    })
}


const forgetLandingUrl = (credentialId) => rememberLandingUrl(credentialId, PORTAL_LOGIN_URL)


const removePortalCredential = (credentialId) => removeSecureCredentialRecord(SCHOOL_EVERYWHERE_NAMESPACE, credentialId)


const hasBiometricsForCredential = async (credentialId) => {
    const hardwareAvailable = await isBiometricAvailable()

    if (!hardwareAvailable) { return false }

    return hasSavedBiometricCredentials(credentialBiometricNamespace(SCHOOL_EVERYWHERE_NAMESPACE, credentialId))
}


const readBiometricPassword = async (credentialId) => {
    const stored = await getBiometricCredentials(credentialBiometricNamespace(SCHOOL_EVERYWHERE_NAMESPACE, credentialId))

    return stored && stored.password ? stored.password : null
}


const clearBiometricsForCredential = (credentialId) => deleteBiometricCredentials(
    credentialBiometricNamespace(SCHOOL_EVERYWHERE_NAMESPACE, credentialId)
)


export {
    SCHOOL_EVERYWHERE_NAMESPACE,
    PORTAL_LOGIN_URL,
    MESSAGE_CHANNEL,
    LOGIN_OUTCOME,
    LOGIN_TIMEOUT_MS,
    USER_TYPES,
    getUserTypeSlug,
    describeUserType,
    userTypeFromLabel,
    describeCredential,
    isLoginUrl,
    isPortalUrl,
    buildLoginInjectionScript,
    signInToPortal,
    endPortalSession,
    listPortalCredentials,
    getPreferredCredentialId,
    savePortalCredential,
    rememberLandingUrl,
    forgetLandingUrl,
    removePortalCredential,
    hasBiometricsForCredential,
    readBiometricPassword,
    clearBiometricsForCredential,
}
