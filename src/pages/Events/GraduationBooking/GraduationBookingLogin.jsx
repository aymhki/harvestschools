import {Helmet} from "react-helmet-async";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import Spinner from "../../../modules/Spinner.jsx";
import Form from "../../../modules/Form.jsx";
import '../../../styles/Events.css'
import {
    GRADUATION_BOOKING_SESSION_NAME,
    validateGraduationBookingLogin,
    validateGraduationBookingLoginWithCredentials,
    requestGraduationBookingPasswordReset,
    requestGraduationBookingResetEmailCode,
    completeGraduationBookingPasswordReset,
    listGraduationBookingStudents,
    recoverGraduationBookingUsername
} from "../../../services/Parents/GraduationBookings/MainParentsGraduationBookingServices.jsx";
import {useTranslation} from "react-i18next";
import {headToGraduationBookingDashboardOnValidSession} from "../../../services/Parents/GraduationBookings/GraduationBookingNavigationServices.jsx";
import {isMobileApp, mfaResendCooldownSeconds} from "../../../services/General/GeneralUtils.jsx";
import {
    isBiometricAvailable,
    hasSavedBiometricCredentials,
    getBiometricCredentials,
    deleteBiometricCredentials,
    verifyBiometricIdentity,
} from "../../../services/General/CapacitorSecureAuthUtils.jsx";


const GB_DEPARTMENTS = ['International', 'National', 'Kindergarten', 'American', 'British'];
const GB_GRADES = ['Pre Play', 'PlaySchool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'IF1', 'IF2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const GB_PASSWORD_POLICY_REGEX = '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$';


function GraduationBookingLogin() {
    const navigate = useNavigate();
    const {t} = useTranslation(['events-pages']);
    const isMountedRef = useRef(true);
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const [loginMode, setLoginMode] = useState('checking');
    const [prefillUsername, setPrefillUsername] = useState('');
    const [loginNotice, setLoginNotice] = useState(null);
    const usernameFieldId = 1
    const passwordFieldId = 2

    const [view, setView] = useState('login');

    const [pwResetState, setPwResetState] = useState(null);
    const [pwResetUsername, setPwResetUsername] = useState('');
    const [pwResetStatus, setPwResetStatus] = useState(null);
    const [pwResetError, setPwResetError] = useState(null);
    const [resendIn, setResendIn] = useState(0);
    const forgotPwUsernameFieldId = 11;
    const resetCodeFieldId = 12;
    const newPasswordFieldId = 13;
    const confirmPasswordFieldId = 14;

    const [recoverMethod, setRecoverMethod] = useState('student');
    const [allStudents, setAllStudents] = useState([]);
    const [studentsLoaded, setStudentsLoaded] = useState(false);
    const [gradeFilter, setGradeFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [recoveredUsernames, setRecoveredUsernames] = useState(null);
    const [recoverError, setRecoverError] = useState(null);
    const studentFieldId = 21;
    const contactFieldId = 24;
    const studentSubmitSeqRef = useRef(0);


    const curriculumGroup = ['international', 'american', 'british', 'national'];
    const normalizeLite = (s) => String(s || '').trim().toLowerCase();

    useEffect(() => {
        if (resendIn <= 0) { return undefined; }
        const timer = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
        return () => clearInterval(timer);
    }, [resendIn]);

    const goToLoginView = (notice) => {
        setView('login');
        setPwResetState(null);
        setPwResetStatus(null);
        setPwResetError(null);
        setResendIn(0);
        setGradeFilter('');
        setDepartmentFilter('');
        setRecoveredUsernames(null);
        setRecoverError(null);
        setLoginNotice(notice || null);
    };

    const handleBookingLogin = async (formData) => {
        if (submittingLocal) {return;}
        setSubmittingLocal(true);

        try {
            const result = await validateGraduationBookingLogin(formData, usernameFieldId, passwordFieldId, navigate);

            if (result && !result.success) {
                throw new Error(result.message || result);
            } else {
                return true;
            }
        } catch (error) {
            throw new Error(error.message);
        } finally {
            setSubmittingLocal(false);
        }
    }

    const resetToFirstTimeMobileExperience = async () => {
        await deleteBiometricCredentials(GRADUATION_BOOKING_SESSION_NAME);

        if (isMountedRef.current) {
            setPrefillUsername('');
            setLoginNotice(null);
            setLoginMode('full');
        }
    };

    const attemptBiometricLogin = async () => {
        setSubmittingLocal(true);
        try {
            const verified = await verifyBiometricIdentity({
                reason: 'Log in to your graduation booking',
                title: 'Booking Sign In',
                subtitle: 'Use your biometrics to sign in',
                description: 'Confirm your identity to continue',
                fallbackTitle: 'Log in to your graduation booking',
            });

            if (!verified) {
                return;
            }

            const credentials = await getBiometricCredentials(GRADUATION_BOOKING_SESSION_NAME);
            if (!credentials || !credentials.username || !credentials.password) {
                return;
            }

            const result = await validateGraduationBookingLoginWithCredentials(
                credentials.username,
                credentials.password,
                navigate
            );

            if (result && !result.success) {
                const credentialsLikelyChanged = result.code === 401 || result.code === 404;
                if (credentialsLikelyChanged) {
                    const wantsToUpdateCredentials = window.confirm(
                        "Did you change your username or password? Tap OK to enter your new username and password. Tap Cancel to remove biometric sign-in on this device."
                    );
                    if (wantsToUpdateCredentials) {
                        if (isMountedRef.current) {
                            setPrefillUsername(credentials.username);
                            setLoginMode('recovery');
                        }
                    } else {
                        await resetToFirstTimeMobileExperience();
                    }
                } else if (isMountedRef.current) {
                    setLoginNotice(result.message || 'Could not sign in with biometrics. Please try again.');
                }
            }
        } finally {
            if (isMountedRef.current) {
                setSubmittingLocal(false);
            }
        }
    };

    useEffect (() => {
        isMountedRef.current = true;

        const autoSessionCheck = async () => {
            setSubmittingLocal(true);

            try {
                await headToGraduationBookingDashboardOnValidSession(navigate, setSubmittingLocal);

                if (!isMountedRef.current) {return;}

                if (!isMobileApp()) {
                    setLoginMode('full');
                    return;
                }

                const biometricHardwareAvailable = await isBiometricAvailable();
                if (!isMountedRef.current) {return;}

                if (!biometricHardwareAvailable) {
                    setLoginMode('full');
                    return;
                }

                const credentialsSaved = await hasSavedBiometricCredentials(GRADUATION_BOOKING_SESSION_NAME);
                if (!isMountedRef.current) {return;}

                if (credentialsSaved) {
                    setLoginMode('biometric');
                } else {
                    setLoginMode('full');
                }
            } finally {
                if (isMountedRef.current) {
                    setSubmittingLocal(false);
                }
            }
        };

        autoSessionCheck();

        return () => {
            isMountedRef.current = false;
        };
    }, [])


    const sendResetCode = async (resetToken, {silent = false} = {}) => {
        if (!resetToken) { return; }
        const result = await requestGraduationBookingResetEmailCode(resetToken);
        if (!isMountedRef.current) { return; }

        if (typeof result?.retryAfter === 'number') { setResendIn(result.retryAfter); }
        else if (result?.success) { setResendIn(mfaResendCooldownSeconds); }

        if (result?.success) {
            setPwResetError(null);
            if (!silent) { setPwResetStatus(t("events-pages.graduation-booking-pages.login-page.code-resent")); }
        } else if (!silent || result?.code === 429) {
            setPwResetStatus(null);
            setPwResetError(result?.message || t("events-pages.graduation-booking-pages.login-page.code-send-failed"));
        }
    };

    const handleForgotPassword = async (formData) => {
        const username = (Object.fromEntries(formData.entries())[`field_${forgotPwUsernameFieldId}`] || '').trim();
        const result = await requestGraduationBookingPasswordReset(username);

        if (result && result.resetRequired) {
            setPwResetState(result);
            setPwResetUsername(username);
            setPwResetStatus(null);
            setPwResetError(null);
            setResendIn(0);
            setView('resetPassword');
            sendResetCode(result.resetToken, {silent: true});
            return true;
        }
        if (result && result.success && result.adminNotified) {
            goToLoginView(result.message);
            return true;
        }
        if (result && !result.success) { throw new Error(result.message || 'Could not start the reset'); }
        return true;
    };

    const handleResetPassword = async (formData) => {
        setPwResetStatus(null);
        setPwResetError(null);
        const entries = Object.fromEntries(formData.entries());
        const code = entries[`field_${resetCodeFieldId}`] || '';
        const newPassword = entries[`field_${newPasswordFieldId}`] || '';
        const confirmPassword = entries[`field_${confirmPasswordFieldId}`] || '';
        if (newPassword !== confirmPassword) { throw new Error(t("events-pages.graduation-booking-pages.login-page.confirm-password-error")); }

        const result = await completeGraduationBookingPasswordReset(pwResetState.resetToken, code, newPassword, pwResetUsername);

        if (result && result.success) {
            setPrefillUsername(pwResetUsername);
            goToLoginView(result.message || t("events-pages.graduation-booking-pages.login-page.reset-success"));
            return true;
        }
        if (result && (result.code === 429 || /expired/i.test(result.message || ''))) {
            goToLoginView(result.code === 429
                ? t("events-pages.graduation-booking-pages.login-page.too-many-attempts")
                : t("events-pages.graduation-booking-pages.login-page.session-expired"));
            return true;
        }
        const suffix = typeof result?.attemptsLeft === 'number' && result.attemptsLeft > 0 ? ` (${result.attemptsLeft})` : '';
        throw new Error((result?.message || 'Incorrect code') + suffix);
    };


    const ensureStudentsLoaded = async () => {
        if (studentsLoaded) { return; }
        const list = await listGraduationBookingStudents();
        if (!isMountedRef.current) { return; }
        setAllStudents(list);
        setStudentsLoaded(true);
    };

    const buildStudentOptions = () => {
        const g = normalizeLite(gradeFilter);
        const d = normalizeLite(departmentFilter);

        const filtered = allStudents.filter((s) => {
            if (g && normalizeLite(s.grade) !== g) { return false; }
            if (d) {
                const sd = normalizeLite(s.division);
                if (sd !== d) {
                    const bothCurriculum = curriculumGroup.includes(sd) && curriculumGroup.includes(d);
                    if (!bothCurriculum) { return false; }
                }
            }
            return true;
        });

        const labelToId = {};
        const seen = {};
        const choices = filtered.map((s) => {
            let label = s.label;
            if (seen[label]) { label = `${label} (#${s.student_id})`; }
            seen[label] = true;
            labelToId[label] = s.student_id;
            return label;
        });
        return {choices, labelToId};
    };

    const revealUsernames = (result) => {
        if (result && result.success && result.found) {
            setRecoveredUsernames(result.usernames || []);
            setRecoverError(null);
            return true;
        }
        if (result && result.success && !result.found) {
            setRecoveredUsernames([]);
            setRecoverError(result.message || t("events-pages.graduation-booking-pages.login-page.username-not-found"));
            return true;
        }
        throw new Error(result?.message || 'Could not look up the username');
    };

    const handleRecoverByStudent = async (formData) => {
        setRecoverError(null);
        setRecoveredUsernames(null);
        const {labelToId} = buildStudentOptions();
        const chosenLabel = formData ? (Object.fromEntries(formData.entries())[`field_${studentFieldId}`] || '') : '';
        const studentId = labelToId[chosenLabel];
        if (!studentId) { throw new Error(t("events-pages.graduation-booking-pages.login-page.choose-child")); }
        const result = await recoverGraduationBookingUsername('student', {student_id: Number(studentId)});
        return revealUsernames(result);
    };

    const handleRecoverByContact = async (formData) => {
        setRecoverError(null);
        setRecoveredUsernames(null);
        const value = (Object.fromEntries(formData.entries())[`field_${contactFieldId}`] || '').trim();
        const result = await recoverGraduationBookingUsername(recoverMethod, {value});
        return revealUsernames(result);
    };

    const useRecoveredUsername = (username) => {
        setPrefillUsername(username);
        goToLoginView(null);
    };


    const buildNewPasswordFields = () => ([
        {
            id: newPasswordFieldId, type: 'password', name: 'new-password', httpName: 'new-password', required: true,
            label: 'New Password', displayLabel: t("events-pages.graduation-booking-pages.login-page.new-password-field"),
            placeholder: t("events-pages.graduation-booking-pages.login-page.new-password-field"),
            errorMsg: t("events-pages.graduation-booking-pages.login-page.password-policy-error"),
            regex: GB_PASSWORD_POLICY_REGEX, value: '', setValue: null, widthOfField: 1, labelOutside: true, labelOnTop: true,
        },
        {
            id: confirmPasswordFieldId, type: 'password', name: 'confirm-new-password', httpName: 'new-password', required: true,
            label: 'Confirm New Password', displayLabel: t("events-pages.graduation-booking-pages.login-page.confirm-new-password-field"),
            placeholder: t("events-pages.graduation-booking-pages.login-page.confirm-new-password-field"),
            errorMsg: t("events-pages.graduation-booking-pages.login-page.confirm-password-error"),
            value: '', setValue: null, widthOfField: 1, labelOutside: true, labelOnTop: true,
        },
    ]);

    const renderForgotPasswordScreen = () => (
        <>
            <p className={'booking-login-instructions'}>{t("events-pages.graduation-booking-pages.login-page.forgot-password-instructions")}</p>
            <Form key={'booking-forgot-password'} mailTo={''} sendPdf={false}
                  formTitle={'Graduation Booking Forgot Password'} noSuccessMessage={true} lang={'en'} captchaLength={1}
                  noInputFieldsCache={true} noCaptcha={true} easySimpleCaptcha={true}
                  noClearOption={true} centerSubmitButton={true} fullMarginField={true}
                  hasSetSubmittingLocal={true} setSubmittingLocal={setSubmittingLocal}
                  hasDifferentOnSubmitBehaviour={true} differentOnSubmitBehaviour={handleForgotPassword}
                  hasDifferentSubmitButtonText={true}
                  differentSubmitButtonText={[t("events-pages.graduation-booking-pages.login-page.continue-btn"), t("events-pages.graduation-booking-pages.login-page.checking-btn")]}
                  fields={[{
                      id: forgotPwUsernameFieldId, type: 'text', name: 'username', httpName: 'username', required: true,
                      label: 'Username', displayLabel: t("events-pages.graduation-booking-pages.login-page.username-field"),
                      placeholder: t("events-pages.graduation-booking-pages.login-page.username-field"),
                      errorMsg: 'Please enter username', value: '', setValue: null, widthOfField: 1, labelOutside: true, labelOnTop: true,
                  }]}
            />
            <button type={'button'} className={'booking-login-link-btn'} onClick={() => goToLoginView(null)}>
                {t("events-pages.graduation-booking-pages.login-page.back-to-login")}
            </button>
        </>
    );

    const renderResetPasswordScreen = () => (
        <>
            <p className={'booking-login-instructions'}>
                {t("events-pages.graduation-booking-pages.login-page.reset-instructions", {emails: (pwResetState?.maskedEmails || []).join(', ')})}
            </p>
            <Form key={'booking-reset-password'} mailTo={''} sendPdf={false}
                  formTitle={'Graduation Booking Reset Password'} noSuccessMessage={true} lang={'en'} captchaLength={1}
                  noInputFieldsCache={true} noCaptcha={true} easySimpleCaptcha={true}
                  noClearOption={true} centerSubmitButton={true} fullMarginField={true} formHasPasswordField={true}
                  hasSetSubmittingLocal={true} setSubmittingLocal={setSubmittingLocal}
                  hasDifferentOnSubmitBehaviour={true} differentOnSubmitBehaviour={handleResetPassword}
                  hasDifferentSubmitButtonText={true}
                  differentSubmitButtonText={[t("events-pages.graduation-booking-pages.login-page.reset-submit"), t("events-pages.graduation-booking-pages.login-page.resetting-btn")]}
                  fields={[
                      ...buildNewPasswordFields(),
                      {
                          id: resetCodeFieldId, type: 'text', name: 'reset-code', httpName: 'one-time-code', required: true,
                          label: 'Verification Code', displayLabel: t("events-pages.graduation-booking-pages.login-page.verification-code-field"),
                          placeholder: '000000', errorMsg: t("events-pages.graduation-booking-pages.login-page.verification-code-error"),
                          regex: '^[0-9]{6}$', value: '', setValue: null, widthOfField: 1, labelOutside: true, labelOnTop: true,
                      },
                  ]}
            />
            {pwResetStatus && <p className={'booking-login-status'} role={'status'}>{pwResetStatus}</p>}
            {pwResetError && <p className={'booking-login-notice'} role={'alert'}>{pwResetError}</p>}
            <div className={'booking-login-recovery-actions'}>
                <button type={'button'} className={'booking-login-link-btn'} disabled={submittingLocal || resendIn > 0}
                        onClick={() => sendResetCode(pwResetState.resetToken)}>
                    {resendIn > 0
                        ? t("events-pages.graduation-booking-pages.login-page.resend-in", {seconds: resendIn})
                        : t("events-pages.graduation-booking-pages.login-page.resend-code")}
                </button>
                <button type={'button'} className={'booking-login-link-btn'} onClick={() => goToLoginView(null)}>
                    {t("events-pages.graduation-booking-pages.login-page.back-to-login")}
                </button>
            </div>
        </>
    );

    const renderRecoveredUsernames = () => {
        if (recoveredUsernames === null) { return null; }
        if (recoveredUsernames.length === 0) {
            return <p className={'booking-login-notice'} role={'alert'}>{recoverError}</p>;
        }
        return (
            <div className={'booking-login-username-results'} role={'status'}>
                <p>{t("events-pages.graduation-booking-pages.login-page.username-found")}</p>
                <ul>
                    {recoveredUsernames.map((u) => (
                        <li key={u}>
                            <span className={'booking-login-username-value'}>{u}</span>
                            <button type={'button'} className={'booking-login-link-btn'} onClick={() => useRecoveredUsername(u)}>
                                {t("events-pages.graduation-booking-pages.login-page.use-this-username")}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };


    const renderByStudent = () => {
        const {choices} = buildStudentOptions();
        return (
            <>
                <Form key={'booking-recover-student'} mailTo={''} sendPdf={false}
                      formTitle={'Graduation Booking Find Username By Student'} noSuccessMessage={true} lang={'en'} captchaLength={1}
                      noInputFieldsCache={true} noCaptcha={true} easySimpleCaptcha={true}
                      noClearOption={true} centerSubmitButton={true} fullMarginField={true}
                      hasSetSubmittingLocal={true} setSubmittingLocal={setSubmittingLocal}
                      hasDifferentOnSubmitBehaviour={true} differentOnSubmitBehaviour={handleRecoverByStudent}
                      hasDifferentSubmitButtonText={true}
                      differentSubmitButtonText={[t("events-pages.graduation-booking-pages.login-page.find-username-btn"), t("events-pages.graduation-booking-pages.login-page.searching-btn")]}
                      fields={[{
                          id: studentFieldId, type: 'search-select', name: 'student', httpName: 'student', required: true,
                          label: 'Student', displayLabel: t("events-pages.graduation-booking-pages.login-page.student-field"),
                          placeholder: t("events-pages.graduation-booking-pages.login-page.student-search-placeholder"),
                          errorMsg: t("events-pages.graduation-booking-pages.login-page.choose-child"),
                          choices,
                          value: '', setValue: null, widthOfField: 1, labelOutside: true, labelOnTop: true,
                      }]}
                />
                <p className={'booking-login-hint'}>
                    {!studentsLoaded && t("events-pages.graduation-booking-pages.login-page.loading-students")}
                </p>
            </>
        );
    };

    const renderByContact = () => (
        <Form key={`booking-recover-${recoverMethod}`} mailTo={''} sendPdf={false}
              formTitle={'Graduation Booking Find Username By Contact'} noSuccessMessage={true} lang={'en'} captchaLength={1}
              noInputFieldsCache={true} noCaptcha={true} easySimpleCaptcha={true}
              noClearOption={true} centerSubmitButton={true} fullMarginField={true}
              hasSetSubmittingLocal={true} setSubmittingLocal={setSubmittingLocal}
              hasDifferentOnSubmitBehaviour={true} differentOnSubmitBehaviour={handleRecoverByContact}
              hasDifferentSubmitButtonText={true}
              differentSubmitButtonText={[t("events-pages.graduation-booking-pages.login-page.find-username-btn"), t("events-pages.graduation-booking-pages.login-page.searching-btn")]}
              fields={[{
                  id: contactFieldId,
                  type: recoverMethod === 'email' ? 'email' : 'text',
                  name: recoverMethod, httpName: recoverMethod, required: true,
                  label: recoverMethod,
                  displayLabel: recoverMethod === 'email'
                      ? t("events-pages.graduation-booking-pages.login-page.parent-email-field")
                      : t("events-pages.graduation-booking-pages.login-page.parent-phone-field"),
                  placeholder: recoverMethod === 'email'
                      ? t("events-pages.graduation-booking-pages.login-page.parent-email-field")
                      : t("events-pages.graduation-booking-pages.login-page.parent-phone-field"),
                  errorMsg: recoverMethod === 'email'
                      ? t("events-pages.graduation-booking-pages.login-page.email-error")
                      : t("events-pages.graduation-booking-pages.login-page.phone-error"),
                  value: '', setValue: null, widthOfField: 1, labelOutside: true, labelOnTop: true,
              }]}
        />
    );

    const renderForgotUsernameScreen = () => (
        <>
            <p className={'booking-login-instructions'}>{t("events-pages.graduation-booking-pages.login-page.forgot-username-instructions")}</p>
            <div className={'booking-login-method-switch'}>
                {['student', 'email', 'phone'].map((m) => (
                    <button key={m} type={'button'} className={m === recoverMethod ? 'current' : ''} aria-pressed={m === recoverMethod}
                            onClick={() => { setRecoverMethod(m); setRecoveredUsernames(null); setRecoverError(null); if (m === 'student') { ensureStudentsLoaded(); } }}>
                        <span className={'booking-login-method-radio'} aria-hidden={'true'}/>
                        {t(`events-pages.graduation-booking-pages.login-page.method-${m}`)}
                    </button>
                ))}
            </div>

            {recoverMethod === 'student' ? renderByStudent() : renderByContact()}

            {renderRecoveredUsernames()}

            <button type={'button'} className={'booking-login-link-btn'} onClick={() => goToLoginView(null)}>
                {t("events-pages.graduation-booking-pages.login-page.back-to-login")}
            </button>
        </>
    );

    const renderBiometricScreen = () => (
        <div className={'booking-login-biometric-only'}>
            <button
                type={'button'}
                onClick={attemptBiometricLogin}
                disabled={submittingLocal}
            >
                {t("events-pages.graduation-booking-pages.login-page.biometric-button")}
            </button>
            <button
                type={'button'}
                onClick={() => {
                    setLoginNotice(null);
                    setLoginMode('full');
                }}
                disabled={submittingLocal}
            >
                {t("events-pages.graduation-booking-pages.login-page.biometric-different-login")}
            </button>
        </div>
    );

    return (
        <>
            {submittingLocal && <Spinner/>}

            <Helmet>
                <title>Harvest International School | Events | Booking</title>
                <meta name="description" content="Access booking info, extras, and media."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Events, Calendar, Academic Year, National, British, American, Kindergarten, Booking,  سنة أكاديمية, تقويم, وطني, بريطاني, أمريكي, روضة, الروضة, سنة دراسية, مواعيد, امتحنات, اجازات"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className={'booking-login-page'}>
                <div className={'booking-login-page-form-controller'}>
                    <div className={'booking-login-form-wrapper'}>
                        {loginMode !== 'checking' && (
                            <h2>
                                {t("events-pages.graduation-booking-pages.login-page.title")}
                            </h2>
                        )}

                        {loginNotice && loginMode !== 'biometric' && (
                            <p className={'booking-login-notice'}>{loginNotice}</p>
                        )}

                        {loginMode === 'biometric' && renderBiometricScreen()}

                        {(loginMode === 'full' || loginMode === 'recovery') && (
                        view === 'forgotPassword' ? renderForgotPasswordScreen() : view === 'resetPassword' ? renderResetPasswordScreen() : view === 'forgotUsername' ? renderForgotUsernameScreen() : (
                        <>

                        {loginMode === 'recovery' && (
                            <button type={'button'} className={'booking-login-different-login-btn'} onClick={resetToFirstTimeMobileExperience}>
                                {t("events-pages.graduation-booking-pages.login-page.biometric-different-login")}
                            </button>
                        )}

                        <Form key={loginMode === 'recovery' ? 'booking-recovery-form' : 'booking-normal-form'}
                              mailTo={''}
                              sendPdf={false}
                              formTitle={t("events-pages.graduation-booking-pages.login-page.title")}
                              lang={'en'}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              hasDifferentOnSubmitBehaviour={true}
                              differentOnSubmitBehaviour={handleBookingLogin}
                              hasDifferentSubmitButtonText={true}
                              differentSubmitButtonText={[t("events-pages.graduation-booking-pages.login-page.login-btn"), t("events-pages.graduation-booking-pages.login-page.logging-in-btn")]}
                              noClearOption={true}
                              centerSubmitButton={true}
                              easySimpleCaptcha={true}
                              fullMarginField={true}
                              hasSetSubmittingLocal={true}
                              setSubmittingLocal={setSubmittingLocal}
                              fields={
                                  [
                                      {
                                          id: usernameFieldId,
                                          type: 'text',
                                          name: 'username',
                                          label: 'Username',
                                          required: true,
                                          displayLabel: t("events-pages.graduation-booking-pages.login-page.username-field"),
                                          placeholder: t("events-pages.graduation-booking-pages.login-page.username-field"),
                                          errorMsg: 'Please enter username',
                                          value: '',
                                          defaultValue: prefillUsername,
                                          setValue: null,
                                          widthOfField: 1,
                                          httpName: 'username',


                                      },
                                      {
                                          id: passwordFieldId,
                                          type: 'password',
                                          name: 'password',
                                          label: 'Password',
                                          required: true,
                                          displayLabel: t("events-pages.graduation-booking-pages.login-page.password-field"),
                                          placeholder: t("events-pages.graduation-booking-pages.login-page.password-field"),
                                          errorMsg: 'Please enter password',
                                          widthOfField: 1,
                                          value: '',
                                          setValue: null,
                                          httpName: 'password',
                                      },
                                  ]
                              }
                        />

                        <div className={'booking-login-recovery-links'}>
                            <button type={'button'} className={'booking-login-link-btn'}
                                    onClick={() => { setLoginNotice(null); setRecoveredUsernames(null); setRecoverError(null); setRecoverMethod('student'); ensureStudentsLoaded(); setView('forgotUsername'); }}>
                                {t("events-pages.graduation-booking-pages.login-page.forgot-username-link")}
                            </button>
                            <button type={'button'} className={'booking-login-link-btn'}
                                    onClick={() => { setLoginNotice(null); setView('forgotPassword'); }}>
                                {t("events-pages.graduation-booking-pages.login-page.forgot-password-link")}
                            </button>
                        </div>
                        </>
                        )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default GraduationBookingLogin;


