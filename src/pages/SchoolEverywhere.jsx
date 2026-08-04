import { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Form from '../modules/Form.jsx'
import Spinner from '../modules/Spinner.jsx'
import { useOffline } from '../services/General/OfflineContext.jsx'
import {
    isBiometricAvailable,
    verifyBiometricIdentity,
} from '../services/General/CapacitorSecureAuthUtils.jsx'
import {
    LOGIN_OUTCOME,
    PORTAL_LOGIN_URL,
    USER_TYPES,
    clearBiometricsForCredential,
    describeCredential,
    describeUserType,
    getPreferredCredentialId,
    hasBiometricsForCredential,
    listPortalCredentials,
    newCredentialId,
    readBiometricPassword,
    removePortalCredential,
    savePortalCredential,
    resumePortalSession,
    endPortalSession,
    signInToPortal,
    userTypeFromLabel,
} from '../services/General/SchoolEverywhereAuthService.jsx'
import {
    attachExternalSiteListeners,
    closeExternalSite,
    getSchoolEverywhereUrl,
    markExternalSiteClosed,
    openExternalSite,
    readTarget,
} from '../services/General/ExternalSiteService.jsx'
import '../styles/SchoolEverywhere.css'


const HOME_PATH = '/app-home'

const CREDENTIAL_FIELD_ID = 1
const USERNAME_FIELD_ID = 2
const PASSWORD_FIELD_ID = 3
const USER_TYPE_FIELD_ID = 4
const IDENTIFIER_FIELD_ID = 5

const MODE = {
    CHECKING: 'checking',
    BIOMETRIC: 'biometric',
    MANUAL: 'manual',
}



function SchoolEverywhere() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { t, i18n } = useTranslation(['schooleverywhere'])
    const { isOffline } = useOffline()

    const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr'
    const target = readTarget(searchParams.get('target'))

    const [mode, setMode] = useState(MODE.CHECKING)
    const [credentials, setCredentials] = useState([])
    const [selectedCredentialId, setSelectedCredentialId] = useState(null)
    const [editingCredential, setEditingCredential] = useState(null)
    const [notice, setNotice] = useState(null)
    const [stageLabel, setStageLabel] = useState('')
    const [submittingLocal, setSubmittingLocal] = useState(false)

    const isMountedRef = useRef(true)
    const hasHandledDirectTargetRef = useRef(false)
    const revealedRef = useRef(false)
    const hasAttemptedResumeRef = useRef(false)
    const watchForCloseRef = useRef(null)

    const selectedCredential = credentials.find((candidate) => candidate.id === selectedCredentialId) || null

    useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
        }
    }, [])

    const goHome = useCallback(() => navigate(HOME_PATH, { replace: true }), [navigate])

    const holdRevealedWebView = useCallback((credential, shouldEndSession = true) => {
        revealedRef.current = true

        watchForCloseRef.current = attachExternalSiteListeners({
            onClose: async () => {
                if (watchForCloseRef.current) {
                    watchForCloseRef.current()
                    watchForCloseRef.current = null
                }

                revealedRef.current = false

                markExternalSiteClosed()

                if (shouldEndSession) { await endPortalSession(credential && credential.id) }
            },
        })
    }, [])

    useEffect(() => {
        if (target === 'portal' || hasHandledDirectTargetRef.current || isOffline) {
            return
        }

        hasHandledDirectTargetRef.current = true

        openExternalSite({ url: getSchoolEverywhereUrl(target), title: t('schooleverywhere.title') })
            .then(() => holdRevealedWebView(null, false))
            .catch(() => goHome())
    }, [goHome, holdRevealedWebView, isOffline, t, target])

    const refreshCredentials = useCallback(async () => {
        const saved = await listPortalCredentials()

        if (!isMountedRef.current) { return [] }

        setCredentials(saved)

        if (saved.length === 0) {
            setSelectedCredentialId(null)
            setMode(MODE.MANUAL)

            return saved
        }

        const preferredId = await getPreferredCredentialId(saved)

        if (!isMountedRef.current) { return saved }

        setSelectedCredentialId(preferredId)
        setMode(MODE.BIOMETRIC)

        return saved
    }, [])

    useEffect(() => {
        if (target !== 'portal' || isOffline || hasAttemptedResumeRef.current) { return }

        hasAttemptedResumeRef.current = true

        const openSavedSessionOrAsk = async () => {
            let hasStartedResume = false

            try {
                const saved = await refreshCredentials()

                if (!isMountedRef.current || saved.length === 0) { return }

                const preferredId = await getPreferredCredentialId(saved)
                const preferred = saved.find((candidate) => candidate.id === preferredId)

                if (!isMountedRef.current || !preferred) { return }

                hasStartedResume = true

                setStageLabel(t('schooleverywhere.opening'))
                setSubmittingLocal(true)

                const resumed = await resumePortalSession({ credential: preferred })

                if (isMountedRef.current && resumed) { holdRevealedWebView(preferred) }
            } catch (resumeError) {
                console.warn('[schooleverywhere] Could not resume the saved session', resumeError)
            } finally {

                if (hasStartedResume && isMountedRef.current) {
                    setStageLabel('')
                    setSubmittingLocal(false)
                }
            }
        }

        openSavedSessionOrAsk()
    }, [holdRevealedWebView, isOffline, refreshCredentials, t, target])

    const applyOutcome = useCallback(async (result, credential) => {
        if (!isMountedRef.current) { return }

        if (result.outcome === LOGIN_OUTCOME.LANDED) {
            holdRevealedWebView(credential)

            return
        }

        if (result.outcome === LOGIN_OUTCOME.FORM_CHANGED) {
            setNotice(t('schooleverywhere.form-changed'))

            await openExternalSite({ url: PORTAL_LOGIN_URL, title: t('schooleverywhere.title') }).catch(() => null)

            return
        }

        if (result.outcome === LOGIN_OUTCOME.REJECTED) {
            setNotice(result.message ? `${result.message} — ${t('schooleverywhere.rejected')}` : t('schooleverywhere.rejected'))
            setEditingCredential(credential)
            setMode(MODE.MANUAL)

            return
        }

        if (result.outcome === LOGIN_OUTCOME.TIMED_OUT) {
            setNotice(t('schooleverywhere.timed-out'))
        }
    }, [holdRevealedWebView, t])

    const runSignIn = useCallback(async (credential, password) => {
        setStageLabel(t('schooleverywhere.opening'))

        const result = await signInToPortal({
            credential,
            password,
            onStage: (stage) => {
                if (isMountedRef.current) {
                    setStageLabel(stage === 'checking' ? t('schooleverywhere.signing-in') : t('schooleverywhere.opening'))
                }
            },
        })

        if (isMountedRef.current) {
            setStageLabel('')
        }

        return result
    }, [t])

    const handleBiometricSubmit = useCallback(async (formData) => {
        if (submittingLocal) { return false }

        const chosenLabel = String(formData.get(`field_${CREDENTIAL_FIELD_ID}`) || '')
        const chosen = credentials.find((candidate) => describeCredential(candidate, t) === chosenLabel)
            || selectedCredential

        if (!chosen) { return false }

        setSubmittingLocal(true)
        setNotice(null)

        try {
            const hasBiometrics = await hasBiometricsForCredential(chosen.id)

            if (!hasBiometrics) {
                setEditingCredential(chosen)
                setMode(MODE.MANUAL)
                setNotice(t('schooleverywhere.no-saved-password'))

                return false
            }

            const verified = await verifyBiometricIdentity({
                reason: 'Sign in to SchoolEverywhere',
                title: 'SchoolEverywhere',
                subtitle: describeCredential(chosen, t),
                description: 'Confirm your identity to continue',
                fallbackTitle: 'Sign in to SchoolEverywhere',
            })

            if (!verified) {
                setNotice(t('schooleverywhere.biometric-failed'))

                return false
            }

            const password = await readBiometricPassword(chosen.id)

            if (!password) {
                setEditingCredential(chosen)
                setMode(MODE.MANUAL)
                setNotice(t('schooleverywhere.no-saved-password'))

                return false
            }

            const result = await runSignIn(chosen, password)

            await applyOutcome(result, chosen)
        } catch (signInError) {
            if (isMountedRef.current) {
                setNotice(signInError.message || t('schooleverywhere.timed-out'))
            }
        } finally {
            if (isMountedRef.current) {
                setSubmittingLocal(false)
            }
        }

        return false
    }, [applyOutcome, credentials, runSignIn, selectedCredential, submittingLocal, t])

    const handleManualSubmit = useCallback(async (formData) => {
        if (submittingLocal) { return false }

        const username = String(formData.get(`field_${USERNAME_FIELD_ID}`) || '').trim()
        const password = String(formData.get(`field_${PASSWORD_FIELD_ID}`) || '')
        const typeLabel = String(formData.get(`field_${USER_TYPE_FIELD_ID}`) || '')
        const iden = String(formData.get(`field_${IDENTIFIER_FIELD_ID}`) || '').trim()
        const typeofuser = userTypeFromLabel(typeLabel, t)

        if (!typeofuser) { return false }

        setSubmittingLocal(true)
        setNotice(null)

        try {
            const candidate = {
                id: editingCredential ? editingCredential.id : newCredentialId(),
                username,
                typeofuser,
                iden,
                landingUrl: null,
            }

            const result = await runSignIn(candidate, password)

            if (result.outcome === LOGIN_OUTCOME.LANDED) {
                const biometricsAvailable = await isBiometricAvailable()

                await savePortalCredential({
                    id: candidate.id,
                    username,
                    password,
                    typeofuser,
                    iden,
                    landingUrl: result.landingUrl,
                    rememberWithBiometrics: biometricsAvailable,
                })

                await refreshCredentials()

                await applyOutcome(result, candidate)

                return false
            }

            await applyOutcome(result, { ...candidate, id: candidate.id })
        } catch (signInError) {
            if (isMountedRef.current) {
                setNotice(signInError.message || t('schooleverywhere.timed-out'))
            }
        } finally {
            if (isMountedRef.current) {
                setSubmittingLocal(false)
            }
        }

        return false
    }, [applyOutcome, editingCredential, refreshCredentials, runSignIn, submittingLocal, t])

    const handleRemoveCredential = useCallback(async () => {
        if (!selectedCredential || !window.confirm(t('schooleverywhere.remove-confirm'))) { return }

        setSubmittingLocal(true)

        await clearBiometricsForCredential(selectedCredential.id)
        await removePortalCredential(selectedCredential.id)
        await refreshCredentials()

        if (isMountedRef.current) {
            setNotice(null)
            setSubmittingLocal(false)
        }
    }, [t, refreshCredentials, selectedCredential])

    useEffect(() => {
        return () => {
            if (watchForCloseRef.current) {
                watchForCloseRef.current()
                watchForCloseRef.current = null
            }

            if (!revealedRef.current) {
                markExternalSiteClosed()

                closeExternalSite()
            }
        }
    }, [])

    if (target !== 'portal') {
        return (
            <div className="school-everywhere" dir={pageDirection}>
                <div className="school-everywhere-state">
                    <Spinner />

                    <p className="school-everywhere-message">{t('schooleverywhere.opening')}</p>
                </div>
            </div>
        )
    }

    const credentialChoices = credentials.map((candidate) => describeCredential(candidate, t))
    const userTypeChoices = USER_TYPES.map((type) => t(`schooleverywhere.user-types.${type.slug}`))

    return (
        <>
            {submittingLocal && <Spinner />}

            <Helmet>
                <title>SchoolEverywhere · Harvest International School</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="school-everywhere-login-page" dir={pageDirection}>
                <div className="school-everywhere-login-page-form-controller">
                    <div className="school-everywhere-login-form-wrapper">
                        <h2 className="always-english-title-font">{t('schooleverywhere.title')}</h2>

                        {stageLabel && <p className="school-everywhere-stage">{stageLabel}</p>}

                        {notice && <p className="school-everywhere-login-notice">{notice}</p>}

                        {isOffline && (
                            <>
                                <p className="school-everywhere-login-notice">{t('schooleverywhere.offline-title')}</p>

                                <p className="school-everywhere-message">{t('schooleverywhere.offline-body')}</p>
                            </>
                        )}

                        {!isOffline && mode === MODE.CHECKING && (
                            <p className="school-everywhere-message">{t('schooleverywhere.checking')}</p>
                        )}

                        {!isOffline && mode === MODE.BIOMETRIC && (
                            <>
                                <Form
                                    key={`school-everywhere-saved-${credentials.length}-${selectedCredentialId || 'none'}`}
                                    mailTo={''}
                                    sendPdf={false}
                                    formTitle={t('schooleverywhere.title')}
                                    lang={'en'}
                                    captchaLength={1}
                                    noInputFieldsCache={true}
                                    noCaptcha={true}
                                    noSuccessMessage={true}
                                    noClearOption={true}
                                    centerSubmitButton={true}
                                    fullMarginField={true}
                                    easySimpleCaptcha={true}
                                    hasSetSubmittingLocal={true}
                                    setSubmittingLocal={setSubmittingLocal}
                                    hasDifferentOnSubmitBehaviour={true}
                                    differentOnSubmitBehaviour={handleBiometricSubmit}
                                    hasDifferentSubmitButtonText={true}
                                    differentSubmitButtonText={[t('schooleverywhere.sign-in-biometrics-button'), t('schooleverywhere.signing-in-button')]}
                                    fields={[
                                        {
                                            id: CREDENTIAL_FIELD_ID,
                                            type: 'select',
                                            name: 'credential',
                                            httpName: 'credential',
                                            required: true,
                                            label: 'Account',
                                            displayLabel: t('schooleverywhere.account-label'),
                                            placeholder: t('schooleverywhere.account-label'),
                                            errorMsg: t('schooleverywhere.account-label'),
                                            choices: credentialChoices,
                                            defaultValue: selectedCredential
                                                ? describeCredential(selectedCredential, t)
                                                : '',
                                            value: '',
                                            setValue: null,
                                            widthOfField: 1,
                                            labelOutside: true,
                                            labelOnTop: true,
                                        },
                                    ]}
                                />

                                <div className="school-everywhere-login-links">
                                    <button
                                        type="button"
                                        className="school-everywhere-link-btn"
                                        disabled={submittingLocal}
                                        onClick={() => {
                                            setNotice(null)
                                            setEditingCredential(selectedCredential)
                                            setMode(MODE.MANUAL)
                                        }}
                                    >
                                        {t('schooleverywhere.edit-saved')}
                                    </button>

                                    <button
                                        type="button"
                                        className="school-everywhere-link-btn"
                                        disabled={submittingLocal}
                                        onClick={() => {
                                            setNotice(null)
                                            setEditingCredential(null)
                                            setMode(MODE.MANUAL)
                                        }}
                                    >
                                        {t('schooleverywhere.add-another')}
                                    </button>

                                    <button
                                        type="button"
                                        className="school-everywhere-link-btn"
                                        disabled={submittingLocal || !selectedCredential}
                                        onClick={handleRemoveCredential}
                                    >
                                        {t('schooleverywhere.remove-saved')}
                                    </button>

                                    <button
                                        type="button"
                                        className="school-everywhere-link-btn"
                                        disabled={submittingLocal}
                                        onClick={goHome}
                                    >
                                        {t('schooleverywhere.home')}
                                    </button>
                                </div>
                            </>
                        )}

                        {!isOffline && mode === MODE.MANUAL && (
                            <>
                                <Form
                                    key={`school-everywhere-manual-${editingCredential ? editingCredential.id : 'new'}`}
                                    mailTo={''}
                                    sendPdf={false}
                                    formTitle={t('schooleverywhere.title')}
                                    lang={'en'}
                                    captchaLength={1}
                                    noInputFieldsCache={true}
                                    noCaptcha={true}
                                    noSuccessMessage={true}
                                    noClearOption={true}
                                    centerSubmitButton={true}
                                    fullMarginField={true}
                                    easySimpleCaptcha={true}
                                    hasSetSubmittingLocal={true}
                                    setSubmittingLocal={setSubmittingLocal}
                                    hasDifferentOnSubmitBehaviour={true}
                                    differentOnSubmitBehaviour={handleManualSubmit}
                                    hasDifferentSubmitButtonText={true}
                                    differentSubmitButtonText={[t('schooleverywhere.sign-in-button'), t('schooleverywhere.signing-in-button')]}
                                    fields={[
                                        {
                                            id: USERNAME_FIELD_ID,
                                            type: 'text',
                                            name: 'username',
                                            httpName: 'username',
                                            required: true,
                                            label: 'Username',
                                            displayLabel: t('schooleverywhere.username-label'),
                                            placeholder: t('schooleverywhere.username-label'),
                                            errorMsg: t('schooleverywhere.username-label'),
                                            defaultValue: editingCredential ? editingCredential.username : '',
                                            value: '',
                                            setValue: null,
                                            widthOfField: 1,
                                            labelOutside: true,
                                            labelOnTop: true,
                                            alwaysEnglish: true,
                                        },
                                        {
                                            id: PASSWORD_FIELD_ID,
                                            type: 'password',
                                            name: 'password',
                                            httpName: 'password',
                                            required: true,
                                            label: 'Password',
                                            displayLabel: t('schooleverywhere.password-label'),
                                            placeholder: t('schooleverywhere.password-label'),
                                            errorMsg: t('schooleverywhere.password-label'),
                                            value: '',
                                            setValue: null,
                                            widthOfField: 1,
                                            labelOutside: true,
                                            labelOnTop: true,
                                            alwaysEnglish: true,
                                        },
                                        {
                                            id: USER_TYPE_FIELD_ID,
                                            type: 'select',
                                            name: 'typeofuser',
                                            httpName: 'typeofuser',
                                            required: true,
                                            label: 'User type',
                                            displayLabel: t('schooleverywhere.user-type-label'),
                                            placeholder: t('schooleverywhere.user-type-label'),
                                            errorMsg: t('schooleverywhere.user-type-label'),
                                            choices: userTypeChoices,
                                            defaultValue: editingCredential
                                                ? describeUserType(editingCredential.typeofuser, t)
                                                : '',
                                            value: '',
                                            setValue: null,
                                            widthOfField: 1,
                                            labelOutside: true,
                                            labelOnTop: true,
                                        },
                                        {
                                            id: IDENTIFIER_FIELD_ID,
                                            type: 'text',
                                            name: 'iden',
                                            httpName: 'iden',
                                            required: true,
                                            label: 'Identifier',
                                            displayLabel: t('schooleverywhere.identifier-label'),
                                            placeholder: t('schooleverywhere.identifier-hint'),
                                            errorMsg: t('schooleverywhere.identifier-label'),
                                            defaultValue: editingCredential ? editingCredential.iden : '',
                                            value: '',
                                            setValue: null,
                                            widthOfField: 1,
                                            labelOutside: true,
                                            labelOnTop: true,
                                            alwaysEnglish: true,
                                        },
                                    ]}
                                />

                                <div className="school-everywhere-login-links">
                                    {credentials.length > 0 && (
                                        <button
                                            type="button"
                                            className="school-everywhere-link-btn"
                                            disabled={submittingLocal}
                                            onClick={() => {
                                                setNotice(null)
                                                setEditingCredential(null)
                                                setMode(MODE.BIOMETRIC)
                                            }}
                                        >
                                            {t('schooleverywhere.back-to-saved')}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="school-everywhere-link-btn"
                                        disabled={submittingLocal}
                                        onClick={goHome}
                                    >
                                        {t('schooleverywhere.home')}
                                    </button>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </>
    )
}


export default SchoolEverywhere
