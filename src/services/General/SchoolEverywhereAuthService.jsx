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
    getExternalSiteCookies,
    navigateExternalSite,
    markExternalSiteClosed,
} from './ExternalSiteService.jsx'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'


const SCHOOL_EVERYWHERE_NAMESPACE = 'schooleverywhere'

const PORTAL_LOGIN_URL = getSchoolEverywhereUrl('portal')

const LOGIN_PATHS = ['/schooleverywhere/', '/schooleverywhere/index.php']

const MESSAGE_CHANNEL = 'harvest-schooleverywhere'

const LOGIN_OUTCOME = {
    LANDED: 'landed',
    REJECTED: 'rejected',
    FORM_CHANGED: 'form-changed',
    TIMED_OUT: 'timed-out',
    DISMISSED: 'dismissed',
}


const LOGIN_TIMEOUT_MS = 90000

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
        uname: credential.username,
        password,
        typeofuser: credential.typeofuser,
        iden: credential.iden,
        channel: MESSAGE_CHANNEL,
    })

    return `(async () => {
    const input = ${payload};
    const send = (payload) => {
        try { window.mobileApp.postMessage({ detail: Object.assign({ channel: input.channel }, payload) }); } catch (ignored) {}
    };

    try {
        const inline = Array.prototype.map.call(document.scripts, (node) => node.src ? '' : node.textContent).join('\\n');
        const dataLine = (inline.match(/var\\s+dataString\\s*=\\s*[^;]+;/) || [])[0] || '';
        const endpoint = (inline.match(/["']([\\w./-]*processed\\.php)["']/) || [])[1];
        const mydb = (dataLine.match(/mydb=([^&"'+]*)/) || [])[1];
        const mip = (dataLine.match(/mip=([^&"'+]*)/) || [])[1];

        if (!endpoint || mydb === undefined || mip === undefined) {
            send({ verdict: 'form-changed', message: 'sign-in endpoint not found' });

            return;
        }

        const body = new URLSearchParams({
            uname: input.uname,
            password: input.password,
            typeofuser: input.typeofuser,
            iden: input.iden,
            remember: '',
            mydb: mydb,
            mip: mip,
        });

        send({ verdict: 'submitting' });

        const response = await fetch(new URL(endpoint, location.href).href, {
            method: 'POST',
            body: body,
            credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const answer = (await response.text()).trim();

        if (!response.ok) {
            send({ verdict: 'unreadable', message: 'HTTP ' + response.status });

            return;
        }

        if (/^correct/i.test(answer)) {
            send({ verdict: 'authenticated', token: answer });

            return;
        }

        send({ verdict: 'rejected', message: answer.replace(/<[^>]*>/g, ' ').trim() });
    } catch (injectionError) {
        send({ verdict: 'unreadable', message: String(injectionError && injectionError.message) });
    }
})();`
}


const portalCookieKey = (credentialId) => `${SCHOOL_EVERYWHERE_NAMESPACE}_cookies_${credentialId}`


const savePortalCookies = async (credentialId) => {
    if (!credentialId) { return }

    try {
        const jar = await getExternalSiteCookies(PORTAL_LOGIN_URL)

        if (jar && Object.keys(jar).length > 0) {
            await SecureStoragePlugin.set({ key: portalCookieKey(credentialId), value: JSON.stringify(jar) })
        }
    } catch (saveError) {
        console.warn('[schooleverywhere] Could not store the session', saveError)
    }
}


const readPortalCookieHeader = async (credentialId) => {
    if (!credentialId) { return null }

    try {
        const stored = await SecureStoragePlugin.get({ key: portalCookieKey(credentialId) })
        const jar = stored && stored.value ? JSON.parse(stored.value) : null

        if (!jar) { return null }

        const pairs = Object.keys(jar).map((name) => `${name}=${jar[name]}`)

        return pairs.length > 0 ? pairs.join('; ') : null
    } catch (readError) {
        return null
    }
}


const forgetPortalCookies = async (credentialId) => {
    if (!credentialId) { return }

    try {
        await SecureStoragePlugin.remove({ key: portalCookieKey(credentialId) })
    } catch (removeError) {
        console.log(removeError)
    }
}


const endPortalSession = async (credentialId) => {
    await forgetPortalCookies(credentialId)

    await clearExternalSiteCookies(PORTAL_LOGIN_URL)
}


const buildVerdictScript = () => `(() => {
    const send = (payload) => {
        try { window.mobileApp.postMessage({ detail: Object.assign({ channel: '${MESSAGE_CHANNEL}' }, payload) }); } catch (ignored) {}
    };

    try {
        if (document.forms['login-form']) {
            send({ verdict: 'login-page', url: location.href });

            return;
        }

        if (document.querySelector('meta[http-equiv="refresh" i]')) {
            send({ verdict: 'redirecting', url: location.href });

            return;
        }

        send({ verdict: 'landed', url: location.href });
    } catch (verdictError) {
        send({ verdict: 'unreadable', message: String(verdictError && verdictError.message) });
    }
})();`


const signInToPortal = async ({ credential, password, onStage }) => {
    const storedCookieHeader = await readPortalCookieHeader(credential.id)
    const startUrl = storedCookieHeader && credential.landingUrl ? credential.landingUrl : PORTAL_LOGIN_URL

    let detachListeners = () => {}
    let timeoutId = null
    let isSettled = false
    let resolveOutcome = null
    let hasInjected = false
    let isAuthenticated = false

    const outcomePromise = new Promise((resolve) => {
        resolveOutcome = resolve
    })

    const settle = (outcome, extra) => {
        if (isSettled) { return }

        isSettled = true

        if (timeoutId) { clearTimeout(timeoutId) }

        detachListeners()

        resolveOutcome({ outcome, landingUrl: null, message: '', ...(extra || {}) })
    }

    const readPage = () => {
        if (!isSettled) { runScriptInExternalSite(buildVerdictScript()) }
    }

    const handleVerdict = (report) => {
        if (isSettled) { return }

        if (report.verdict === 'submitting') {
            if (onStage) { onStage('submitting') }
        } else if (report.verdict === 'authenticated') {
            isAuthenticated = true

            if (credential.landingUrl) {
                navigateExternalSite(credential.landingUrl)
            } else {
                runScriptInExternalSite(buildFollowThroughScript())
            }
        } else if (report.verdict === 'rejected') {
            settle(LOGIN_OUTCOME.REJECTED, { message: report.message })
        } else if (report.verdict === 'form-changed') {
            settle(LOGIN_OUTCOME.FORM_CHANGED, { message: report.message })
        } else if (report.verdict === 'landed') {
            settle(LOGIN_OUTCOME.LANDED, { landingUrl: report.url })
        } else if (report.verdict === 'login-page') {
            if (isAuthenticated) { return }

            if (hasInjected) {
                settle(LOGIN_OUTCOME.REJECTED)

                return
            }

            hasInjected = true

            if (onStage) { onStage('signing-in') }

            runScriptInExternalSite(buildLoginInjectionScript(credential, password))
        }
    }

    detachListeners = attachExternalSiteListeners({
        onClose: () => {
            markExternalSiteClosed()

            settle(LOGIN_OUTCOME.DISMISSED)
        },
        onPageLoaded: () => readPage(),
        onUrlChange: () => readPage(),
        onMessage: (detail) => {
            if (detail && detail.channel === MESSAGE_CHANNEL) { handleVerdict(detail) }
        },
    })

    timeoutId = setTimeout(() => settle(LOGIN_OUTCOME.TIMED_OUT), LOGIN_TIMEOUT_MS)

    try {
        await openHiddenExternalSite({
            url: startUrl,
            title: 'SchoolEverywhere',
            headers: storedCookieHeader ? { Cookie: storedCookieHeader } : undefined,
        })

        readPage()
    } catch (openError) {
        console.warn('[schooleverywhere] Could not start the sign in', openError)

        settle(LOGIN_OUTCOME.TIMED_OUT)
    }

    const result = await outcomePromise

    if (result.outcome === LOGIN_OUTCOME.LANDED) {
        await rememberLandingUrl(credential.id, result.landingUrl)

        await savePortalCookies(credential.id)

        await revealExternalSite()
    } else if (result.outcome !== LOGIN_OUTCOME.DISMISSED) {
        if (credential.id && credential.landingUrl && result.outcome === LOGIN_OUTCOME.REJECTED) {
            await forgetLandingUrl(credential.id)

            await forgetPortalCookies(credential.id)
        }

        markExternalSiteClosed()

        await closeExternalSite()
    }

    return result
}


const buildFollowThroughScript = () => `(() => {
    try {
        const button = document.querySelector('input[type=submit][name=submit]');

        if (button) { button.click(); }
    } catch (ignored) {}
})();`


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
