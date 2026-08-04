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
    readBiometricPassword,
    removePortalCredential,
    savePortalCredential,
    signInToPortal,
    userTypeFromLabel,
} from '../services/General/SchoolEverywhereAuthService.jsx'
import {
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

const COPY = {
    en: {
        title: 'SchoolEverywhere',
        checking: 'Checking this device…',
        opening: 'Opening the portal…',
        signingIn: 'Signing you in…',
        signInWith: 'Sign in',
        signingInButton: 'Signing in…',
        accountLabel: 'Account',
        usernameLabel: 'Username',
        passwordLabel: 'Password',
        userTypeLabel: 'User type',
        identifierLabel: 'Identifier',
        identifierHint: 'The identifier your school gave you for the portal.',
        addAnother: 'Add another account',
        editSaved: 'Change saved details',
        removeSaved: 'Remove this account',
        backToSaved: 'Use a saved account',
        home: 'Back to home',
        offlineTitle: 'You are offline',
        offlineBody: 'SchoolEverywhere needs a connection. Reconnect and try again.',
        rejected: 'That did not work. Your username, password or identifier may have changed on the portal — check them below.',
        formChanged: 'SchoolEverywhere changed its sign-in page, so we opened it directly for you.',
        timedOut: 'The portal took too long to answer. Please try again.',
        sessionEnded: 'Your portal session ended. Sign in again to carry on.',
        biometricFailed: 'Biometric sign-in was not completed. Please try again or enter your details.',
        noSavedPassword: 'No saved password was found on this device. Please enter your details again.',
        removeConfirm: 'Remove this saved account from this device?',
    },
    ar: {
        title: 'SchoolEverywhere',
        checking: '…جاري التحقق من هذا الجهاز',
        opening: '…جاري فتح البوابة',
        signingIn: '…جاري تسجيل الدخول',
        signInWith: 'تسجيل الدخول',
        signingInButton: '…جاري تسجيل الدخول',
        accountLabel: 'الحساب',
        usernameLabel: 'اسم المستخدم',
        passwordLabel: 'كلمة المرور',
        userTypeLabel: 'نوع المستخدم',
        identifierLabel: 'المعرّف',
        identifierHint: 'المعرّف الذي منحته لك المدرسة للبوابة.',
        addAnother: 'إضافة حساب آخر',
        editSaved: 'تغيير البيانات المحفوظة',
        removeSaved: 'إزالة هذا الحساب',
        backToSaved: 'استخدام حساب محفوظ',
        home: 'العودة للرئيسية',
        offlineTitle: 'أنت غير متصل بالإنترنت',
        offlineBody: 'يحتاج SchoolEverywhere إلى اتصال بالإنترنت. أعد الاتصال وحاول مرة أخرى.',
        rejected: 'لم تنجح المحاولة. ربما تغيّر اسم المستخدم أو كلمة المرور أو المعرّف على البوابة — راجعها بالأسفل.',
        formChanged: 'غيّرت SchoolEverywhere صفحة تسجيل الدخول، لذلك فتحناها لك مباشرة.',
        timedOut: 'استغرقت البوابة وقتًا طويلاً للرد. برجاء المحاولة مرة أخرى.',
        sessionEnded: 'انتهت جلستك على البوابة. سجّل الدخول مرة أخرى للمتابعة.',
        biometricFailed: 'لم يكتمل الدخول بالبصمة. حاول مرة أخرى أو أدخل بياناتك.',
        noSavedPassword: 'لا توجد كلمة مرور محفوظة على هذا الجهاز. برجاء إدخال بياناتك مرة أخرى.',
        removeConfirm: 'إزالة هذا الحساب المحفوظ من هذا الجهاز؟',
    },
}


function SchoolEverywhere() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { i18n } = useTranslation()
    const { isOffline } = useOffline()

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const copy = COPY[language]
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

    const selectedCredential = credentials.find((candidate) => candidate.id === selectedCredentialId) || null

    useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
        }
    }, [])

    const goHome = useCallback(() => navigate(HOME_PATH, { replace: true }), [navigate])

    useEffect(() => {
        if (target === 'portal' || hasHandledDirectTargetRef.current || isOffline) {
            return
        }

        hasHandledDirectTargetRef.current = true

        openExternalSite({ url: getSchoolEverywhereUrl(target), title: COPY[language].title })
            .catch(() => null)
            .finally(() => goHome())
    }, [goHome, isOffline, language, target])

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
        if (target !== 'portal') { return }

        refreshCredentials()
    }, [refreshCredentials, target])

    const applyOutcome = useCallback(async (result, credential) => {
        if (!isMountedRef.current) { return }

        if (result.outcome === LOGIN_OUTCOME.LANDED) {
            goHome()

            return
        }

        if (result.outcome === LOGIN_OUTCOME.FORM_CHANGED) {
            setNotice(copy.formChanged)

            await openExternalSite({ url: PORTAL_LOGIN_URL, title: copy.title }).catch(() => null)

            return
        }

        if (result.outcome === LOGIN_OUTCOME.REJECTED) {
            setNotice(copy.rejected)
            setEditingCredential(credential)
            setMode(MODE.MANUAL)

            return
        }

        if (result.outcome === LOGIN_OUTCOME.TIMED_OUT) {
            setNotice(copy.timedOut)
        }
    }, [copy, goHome])

    const runSignIn = useCallback(async (credential, password) => {
        setStageLabel(copy.opening)

        const result = await signInToPortal({
            credential,
            password,
            onStage: (stage) => {
                if (isMountedRef.current) {
                    setStageLabel(stage === 'signing-in' ? copy.signingIn : copy.opening)
                }
            },
        })

        if (isMountedRef.current) {
            setStageLabel('')
        }

        return result
    }, [copy])

    const handleBiometricSubmit = useCallback(async (formData) => {
        if (submittingLocal) { return false }

        const chosenLabel = String(formData.get(`field_${CREDENTIAL_FIELD_ID}`) || '')
        const chosen = credentials.find((candidate) => describeCredential(candidate, language) === chosenLabel)
            || selectedCredential

        if (!chosen) { return false }

        setSubmittingLocal(true)
        setNotice(null)

        try {
            const hasBiometrics = await hasBiometricsForCredential(chosen.id)

            if (!hasBiometrics) {
                setEditingCredential(chosen)
                setMode(MODE.MANUAL)
                setNotice(copy.noSavedPassword)

                return false
            }

            const verified = await verifyBiometricIdentity({
                reason: 'Sign in to SchoolEverywhere',
                title: 'SchoolEverywhere',
                subtitle: describeCredential(chosen, language),
                description: 'Confirm your identity to continue',
                fallbackTitle: 'Sign in to SchoolEverywhere',
            })

            if (!verified) {
                setNotice(copy.biometricFailed)

                return false
            }

            const password = await readBiometricPassword(chosen.id)

            if (!password) {
                setEditingCredential(chosen)
                setMode(MODE.MANUAL)
                setNotice(copy.noSavedPassword)

                return false
            }

            const result = await runSignIn(chosen, password)

            await applyOutcome(result, chosen)
        } catch (signInError) {
            if (isMountedRef.current) {
                setNotice(signInError.message || copy.timedOut)
            }
        } finally {
            if (isMountedRef.current) {
                setSubmittingLocal(false)
            }
        }

        return false
    }, [applyOutcome, copy, credentials, language, runSignIn, selectedCredential, submittingLocal])

    const handleManualSubmit = useCallback(async (formData) => {
        if (submittingLocal) { return false }

        const username = String(formData.get(`field_${USERNAME_FIELD_ID}`) || '').trim()
        const password = String(formData.get(`field_${PASSWORD_FIELD_ID}`) || '')
        const typeLabel = String(formData.get(`field_${USER_TYPE_FIELD_ID}`) || '')
        const iden = String(formData.get(`field_${IDENTIFIER_FIELD_ID}`) || '').trim()
        const typeofuser = userTypeFromLabel(typeLabel, language)

        if (!typeofuser) { return false }

        setSubmittingLocal(true)
        setNotice(null)

        try {
            const candidate = {
                id: editingCredential ? editingCredential.id : null,
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

                goHome()

                return false
            }

            await applyOutcome(result, { ...candidate, id: candidate.id })
        } catch (signInError) {
            if (isMountedRef.current) {
                setNotice(signInError.message || copy.timedOut)
            }
        } finally {
            if (isMountedRef.current) {
                setSubmittingLocal(false)
            }
        }

        return false
    }, [applyOutcome, copy, editingCredential, goHome, language, runSignIn, submittingLocal])

    const handleRemoveCredential = useCallback(async () => {
        if (!selectedCredential || !window.confirm(copy.removeConfirm)) { return }

        setSubmittingLocal(true)

        await clearBiometricsForCredential(selectedCredential.id)
        await removePortalCredential(selectedCredential.id)
        await refreshCredentials()

        if (isMountedRef.current) {
            setNotice(null)
            setSubmittingLocal(false)
        }
    }, [copy, refreshCredentials, selectedCredential])

    useEffect(() => {
        return () => {
            markExternalSiteClosed()

            closeExternalSite()
        }
    }, [])

    if (target !== 'portal') {
        return (
            <div className="school-everywhere">
                <div className="school-everywhere-state">
                    <Spinner />

                    <p className="school-everywhere-message">{copy.opening}</p>
                </div>
            </div>
        )
    }

    const credentialChoices = credentials.map((candidate) => describeCredential(candidate, language))
    const userTypeChoices = USER_TYPES.map((type) => type[language])

    return (
        <>
            {submittingLocal && <Spinner />}

            <Helmet>
                <title>SchoolEverywhere · Harvest International School</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="school-everywhere-login-page">
                <div className="school-everywhere-login-page-form-controller">
                    <div className="school-everywhere-login-form-wrapper">
                        <h2>{copy.title}</h2>

                        {stageLabel && <p className="school-everywhere-stage">{stageLabel}</p>}

                        {notice && <p className="school-everywhere-login-notice">{notice}</p>}

                        {isOffline && (
                            <>
                                <p className="school-everywhere-login-notice">{copy.offlineTitle}</p>

                                <p className="school-everywhere-message">{copy.offlineBody}</p>
                            </>
                        )}

                        {!isOffline && mode === MODE.CHECKING && (
                            <p className="school-everywhere-message">{copy.checking}</p>
                        )}

                        {!isOffline && mode === MODE.BIOMETRIC && (
                            <>
                                <Form
                                    key={`school-everywhere-saved-${credentials.length}-${selectedCredentialId || 'none'}`}
                                    mailTo={''}
                                    sendPdf={false}
                                    formTitle={copy.title}
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
                                    differentSubmitButtonText={[copy.signInWith, copy.signingInButton]}
                                    fields={[
                                        {
                                            id: CREDENTIAL_FIELD_ID,
                                            type: 'select',
                                            name: 'credential',
                                            httpName: 'credential',
                                            required: true,
                                            label: 'Account',
                                            displayLabel: copy.accountLabel,
                                            placeholder: copy.accountLabel,
                                            errorMsg: copy.accountLabel,
                                            choices: credentialChoices,
                                            defaultValue: selectedCredential
                                                ? describeCredential(selectedCredential, language)
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
                                        {copy.editSaved}
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
                                        {copy.addAnother}
                                    </button>

                                    <button
                                        type="button"
                                        className="school-everywhere-link-btn"
                                        disabled={submittingLocal || !selectedCredential}
                                        onClick={handleRemoveCredential}
                                    >
                                        {copy.removeSaved}
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
                                    formTitle={copy.title}
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
                                    differentSubmitButtonText={[copy.signInWith, copy.signingInButton]}
                                    fields={[
                                        {
                                            id: USERNAME_FIELD_ID,
                                            type: 'text',
                                            name: 'username',
                                            httpName: 'username',
                                            required: true,
                                            label: 'Username',
                                            displayLabel: copy.usernameLabel,
                                            placeholder: copy.usernameLabel,
                                            errorMsg: copy.usernameLabel,
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
                                            displayLabel: copy.passwordLabel,
                                            placeholder: copy.passwordLabel,
                                            errorMsg: copy.passwordLabel,
                                            value: '',
                                            setValue: null,
                                            widthOfField: 1,
                                            labelOutside: true,
                                            labelOnTop: true,
                                            alwaysEnglish: true,
                                            dontLetTheBrowserSaveField: true,
                                        },
                                        {
                                            id: USER_TYPE_FIELD_ID,
                                            type: 'select',
                                            name: 'typeofuser',
                                            httpName: 'typeofuser',
                                            required: true,
                                            label: 'User type',
                                            displayLabel: copy.userTypeLabel,
                                            placeholder: copy.userTypeLabel,
                                            errorMsg: copy.userTypeLabel,
                                            choices: userTypeChoices,
                                            defaultValue: editingCredential
                                                ? describeUserType(editingCredential.typeofuser, language)
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
                                            displayLabel: copy.identifierLabel,
                                            placeholder: copy.identifierHint,
                                            errorMsg: copy.identifierLabel,
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

                                {credentials.length > 0 && (
                                    <div className="school-everywhere-login-links">
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
                                            {copy.backToSaved}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            type="button"
                            className="school-everywhere-link-btn"
                            disabled={submittingLocal}
                            onClick={goHome}
                        >
                            {copy.home}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}


export default SchoolEverywhere
