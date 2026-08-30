import {useNavigate} from "react-router";
import {useEffect, useRef, useState} from "react";
import {useSpring, animated} from "react-spring";
import Form from "../../../modules/Form.jsx";
import AlumniMarkdownEditor from "../../../modules/AlumniMarkdownEditor.jsx";
import MarkdownContent from "../../../modules/MarkdownContent.jsx";
import '../../../styles/AlumniStudents.css';
import {
    fetchMyAlumniAccount,
    submitAlumniProfileUpdate,
    cancelAlumniProfileUpdate,
    requestAlumniAccountDeletion,
    cancelAlumniAccountDeletionRequest,
    changeAlumniPassword,
    updateAlumniBiometricCredentials,
    registerAlumniPasskey,
    deleteAlumniPasskey,
    submitAlumniPost,
    editAlumniPost,
    deleteAlumniPost,
    uploadAlumniPostImage,
    logoutCurrentAlumni,
} from "../../../services/Alumni/MainAlumniServices.jsx";
import {alumniPublicFileUrl, alumniPublicProfilePageUrl, publicSiteOrigin, isMobileApp, schoolFoundedYear} from "../../../services/General/GeneralUtils.jsx";
import {shareLink} from "../../../services/General/NativeFileShareService.jsx";
import {passkeySupported} from "../../../services/General/PasskeyUtils.jsx";
import { useLoading } from '../../../services/General/GlobalLoadingService.jsx'
import {useTranslation} from "react-i18next";
import {renderWithLanguageSpans, detectLanguage, localiseDigits, formatLocalisedDate} from "../../../services/General/MixedLanguageText.jsx";

const PENDING_UPDATE_FIELD_LABEL_KEYS = {
    newUsername: 'field-username',
    newName: 'field-name',
    newEmail: 'field-email',
    newPosition: 'field-position',
    newGraduationDate: 'graduation-date',
    newBio: 'about-you',
    newProfilePictureLink: 'profile-picture',
};

function AlumniProfile() {
    const navigate = useNavigate();
    const {t, i18n} = useTranslation(['students-life-pages']);
    const language = i18n.language === 'ar' ? 'ar' : 'en';
    const [isLoading, setIsLoading] = useLoading(true);
    const [account, setAccount] = useState(null);
    const [alertModal, setAlertModal] = useState(null);

    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showPostComposerModal, setShowPostComposerModal] = useState(false);
    const [showDeletePostModal, setShowDeletePostModal] = useState(false);
    const [showPostPreviewModal, setShowPostPreviewModal] = useState(false);
    const [showDeleteAccountRequestModal, setShowDeleteAccountRequestModal] = useState(false);
    const [deleteAccountReason, setDeleteAccountReason] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalBusy, setModalBusy] = useState(false);

    const [composerPost, setComposerPost] = useState(null);
    const [composerTitle, setComposerTitle] = useState('');
    const [composerContent, setComposerContent] = useState('');
    const [postToDelete, setPostToDelete] = useState(null);
    const [postToPreview, setPostToPreview] = useState(null);
    const changePasswordSubmitButtonRef = useRef(null);
    const submitProfileChangeForApprovalButtonRef = useRef(null);
    const [newPasskeyLabel, setNewPasskeyLabel] = useState('');

    const canUsePasskeys = passkeySupported() && !isMobileApp();
    const profilePageRef = useRef(null);

    const publicProfileOrigin = (isMobileApp() || typeof window === 'undefined') ? publicSiteOrigin : window.location.origin;
    const publicProfileUrl = account && account.profile && account.profile.username
        ? `${publicProfileOrigin}${alumniPublicProfilePageUrl(account.profile.username)}`
        : '';

    const copyPublicProfileUrl = async () => {
        try {
            await navigator.clipboard.writeText(publicProfileUrl);

            return true;
        } catch (ignored) {
            console.log(ignored);

            return false;
        }
    };

    const handleSharePublicProfileUrl = async () => {
        try {
            const shared = await shareLink({url: publicProfileUrl});

            if (!shared && await copyPublicProfileUrl()) {
                showAlert(t('students-life-pages.alumni-profile-page.link-copied'));
            }
        } catch (ignored) {
            console.log(ignored);
        }
    };


    const animateEditProfileModal = useSpring({
        opacity: showEditProfileModal ? 1 : 0,
        transform: showEditProfileModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showEditProfileModal ? 'auto' : 'none',
    });

    const animateChangePasswordModal = useSpring({
        opacity: showChangePasswordModal ? 1 : 0,
        transform: showChangePasswordModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showChangePasswordModal ? 'auto' : 'none',
    });

    const animatePostComposerModal = useSpring({
        opacity: showPostComposerModal ? 1 : 0,
        transform: showPostComposerModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showPostComposerModal ? 'auto' : 'none',
    });

    const animateDeletePostModal = useSpring({
        opacity: showDeletePostModal ? 1 : 0,
        transform: showDeletePostModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showDeletePostModal ? 'auto' : 'none',
    });

    const animatePostPreviewModal = useSpring({
        opacity: showPostPreviewModal ? 1 : 0,
        transform: showPostPreviewModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showPostPreviewModal ? 'auto' : 'none',
    });

    const animateAlertModal = useSpring({
        opacity: alertModal ? 1 : 0,
        transform: alertModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: alertModal ? 'auto' : 'none',
    });

    const animateDeleteAccountRequestModal = useSpring({
        opacity: showDeleteAccountRequestModal ? 1 : 0,
        transform: showDeleteAccountRequestModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showDeleteAccountRequestModal ? 'auto' : 'none',
    });

    const loadAccount = async () => {
        setIsLoading(true);
        const result = await fetchMyAlumniAccount(navigate);

        if (result) {
            setAccount(result);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        loadAccount();
    }, []);

    const showAlert = (message, isError = false) => {
        if (!message) {
            return;
        }

        setAlertModal({ message, isError });
    };

    const profile = account ? account.profile : null;
    const pendingUpdate = account ? account.pendingUpdate : null;
    const posts = account && Array.isArray(account.posts) ? account.posts : [];
    const passkeys = account && Array.isArray(account.passkeys) ? account.passkeys : [];
    const rejectedUpdate = account && Array.isArray(account.updateHistory)
        ? account.updateHistory.find(update => update.status === 'rejected')
        : null;
    const pendingDeletionRequest = account ? account.pendingDeletionRequest : null;
    const rejectedDeletionRequest = account && Array.isArray(account.deletionRequestHistory)
        ? account.deletionRequestHistory.find(request => request.status === 'rejected')
        : null;

    const editProfileFieldIds = {
        username: 1,
        name: 2,
        email: 3,
        position: 4,
        graduationDate: 5,
        bio: 6,
        profilePicture: 7,
    };

    const editProfilePictureFieldLabel = t('students-life-pages.alumni-profile-page.new-profile-picture');

    const changePasswordFieldIds = {
        currentPassword: 1,
        newPassword: 2,
        confirmNewPassword: 3,
    }

    const handleSubmitProfileUpdate = async (formData) => {
        try {
            const formDataJson = Object.fromEntries(formData.entries());

            const updateFormData = new FormData();
            updateFormData.append('username', formDataJson[`field_${editProfileFieldIds.username}`] || '');
            updateFormData.append('name', formDataJson[`field_${editProfileFieldIds.name}`] || '');
            updateFormData.append('email', formDataJson[`field_${editProfileFieldIds.email}`] || '');
            updateFormData.append('position', formDataJson[`field_${editProfileFieldIds.position}`] || '');
            updateFormData.append('graduation_date', formDataJson[`field_${editProfileFieldIds.graduationDate}`] || '');
            updateFormData.append('bio', formDataJson[`field_${editProfileFieldIds.bio}`] || '');

            const newProfilePicture = formData.get(editProfilePictureFieldLabel);
            if (newProfilePicture instanceof File && newProfilePicture.size > 0) {
                updateFormData.append('profile_picture', newProfilePicture, newProfilePicture.name);
            }

            const result = await submitAlumniProfileUpdate(updateFormData, navigate);

            if (result && result.success) {
                setShowEditProfileModal(false);
                showAlert(t('students-life-pages.alumni-profile-page.update-submitted'));
                await loadAccount();
                return true;
            } else {
                throw new Error((result && result.message) || t('students-life-pages.alumni-profile-page.update-failed'));
            }
        } catch (error) {
            throw new Error(error.message);
        }
    };

    const handleCancelPendingUpdate = async () => {
        setIsLoading(true);
        const result = await cancelAlumniProfileUpdate(navigate);
        setIsLoading(false);

        if (result && result.success) {
            showAlert(t('students-life-pages.alumni-profile-page.update-cancelled'));
            await loadAccount();
        } else {
            showAlert((result && result.message) || t('students-life-pages.alumni-profile-page.cancel-update-failed'), true);
        }
    };

    const openDeleteAccountRequestModal = () => {
        setShowEditProfileModal(false);
        setDeleteAccountReason('');
        setModalError('');
        setShowDeleteAccountRequestModal(true);
    };

    const handleRequestAccountDeletion = async () => {
        if (modalBusy) { return; }

        setModalBusy(true);
        setModalError('');

        const result = await requestAlumniAccountDeletion(deleteAccountReason.trim(), navigate);
        setModalBusy(false);

        if (result && result.success) {
            setShowDeleteAccountRequestModal(false);
            showAlert(t('students-life-pages.alumni-profile-page.deletion-submitted'));
            await loadAccount();
        } else {
            setModalError((result && result.message) || t('students-life-pages.alumni-profile-page.deletion-failed'));
        }
    };

    const handleCancelDeletionRequest = async () => {
        setIsLoading(true);
        const result = await cancelAlumniAccountDeletionRequest(navigate);
        setIsLoading(false);

        if (result && result.success) {
            showAlert(t('students-life-pages.alumni-profile-page.deletion-cancelled'));
            await loadAccount();
        } else {
            showAlert((result && result.message) || t('students-life-pages.alumni-profile-page.cancel-deletion-failed'), true);
        }
    };

    const openChangePasswordModal = () => {
        setModalError('');
        setShowChangePasswordModal(true);
    };

    const handleChangePassword = async (formData) => {
        if (modalBusy) { return; }

        const entries = Object.fromEntries(formData.entries());
        const currentPassword = entries[`field_${changePasswordFieldIds.currentPassword}`] || '';
        const newPassword = entries[`field_${changePasswordFieldIds.newPassword}`] || '';
        const confirmNewPassword = entries[`field_${changePasswordFieldIds.confirmNewPassword}`] || '';

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setModalError(t('students-life-pages.alumni-profile-page.password-fields-required'));
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setModalError(t('students-life-pages.alumni-profile-page.passwords-mismatch'));
            return;
        }

        setModalBusy(true);
        setModalError('');

        const result = await changeAlumniPassword(currentPassword, newPassword, confirmNewPassword, navigate);
        setModalBusy(false);

        if (result && result.success) {
            setShowChangePasswordModal(false);
            showAlert(t('students-life-pages.alumni-profile-page.password-changed'));
            if (profile && profile.username) {
                await updateAlumniBiometricCredentials(profile.username, newPassword);
            }
        } else {
            setModalError((result && result.message) || t('students-life-pages.alumni-profile-page.password-change-failed'));
        }
    };

    const handleRegisterPasskey = async () => {
        if (isLoading) { return; }

        setIsLoading(true);
        const result = await registerAlumniPasskey(newPasskeyLabel.trim(), navigate);
        setIsLoading(false);

        if (result && result.success) {
            setNewPasskeyLabel('');
            showAlert(t('students-life-pages.alumni-profile-page.passkey-added'));
            await loadAccount();
        } else if (result && !result.cancelled) {
            showAlert((result && result.message) || t('students-life-pages.alumni-profile-page.passkey-add-failed'), true);
        }
    };

    const handleDeletePasskey = async (passkeyId) => {
        setIsLoading(true);
        const result = await deleteAlumniPasskey(passkeyId, navigate);
        setIsLoading(false);

        if (result && result.success) {
            showAlert(t('students-life-pages.alumni-profile-page.passkey-removed'));
            await loadAccount();
        } else {
            showAlert((result && result.message) || t('students-life-pages.alumni-profile-page.passkey-remove-failed'), true);
        }
    };

    const openNewPostComposer = () => {
        setComposerPost(null);
        setComposerTitle('');
        setComposerContent('');
        setModalError('');
        setShowPostComposerModal(true);
    };

    const openEditPostComposer = (post) => {
        setComposerPost(post);

        if (post.pendingEdit && post.pendingEdit.status === 'pending') {
            setComposerTitle(post.pendingEdit.newTitle || '');
            setComposerContent(post.pendingEdit.newContent || '');
        } else {
            setComposerTitle(post.title || '');
            setComposerContent(post.content || '');
        }

        setModalError('');
        setShowPostComposerModal(true);
    };

    const handleSubmitComposer = async () => {
        if (modalBusy) { return; }

        if (!composerTitle.trim() || !composerContent.trim()) {
            setModalError(t('students-life-pages.alumni-profile-page.post-fields-required'));
            return;
        }

        setModalBusy(true);
        setModalError('');

        const result = composerPost
            ? await editAlumniPost(composerPost.id, composerTitle.trim(), composerContent, navigate)
            : await submitAlumniPost(composerTitle.trim(), composerContent, navigate);

        setModalBusy(false);

        if (result && result.success) {
            setShowPostComposerModal(false);
            showAlert(composerPost ? t('students-life-pages.alumni-profile-page.post-updated') : t('students-life-pages.alumni-profile-page.post-submitted'));
            await loadAccount();
        } else {
            setModalError((result && result.message) || t('students-life-pages.alumni-profile-page.post-failed'));
        }
    };

    const handleDeletePost = async () => {
        if (!postToDelete || modalBusy) { return; }

        setModalBusy(true);
        const result = await deleteAlumniPost(postToDelete.id, navigate);
        setModalBusy(false);
        setShowDeletePostModal(false);

        if (result && result.success) {
            showAlert(t('students-life-pages.alumni-profile-page.post-deleted'));
            await loadAccount();
        } else {
            showAlert((result && result.message) || t('students-life-pages.alumni-profile-page.post-delete-failed'), true);
        }
    };

    const describePostStatus = (post) => {
        if (post.status === 'pending') { return t('students-life-pages.alumni-profile-page.awaiting-approval'); }
        if (post.status === 'rejected') { return t('students-life-pages.alumni-profile-page.not-approved'); }
        return t('students-life-pages.alumni-profile-page.published');
    };

    return (
        <>

            <title>{t('students-life-pages.alumni-profile-page.page-title')}</title>
            <meta name="description" content={t('students-life-pages.alumni-profile-page.page-description')}/>
            <meta name="robots" content="noindex, nofollow"/>

            <div className={"alumni-profile-page"}>
                <div className={"extreme-padding-container"}>
                    <div className={"alumni-profile-wrapper"} ref={profilePageRef}>
                        {profile && (
                            <>
                                <div className={"alumni-profile-header-card"}>
                                    {profile.profilePictureLink ? (
                                        <img
                                            className={"alumni-profile-header-avatar"}
                                            src={alumniPublicFileUrl(profile.profilePictureLink)}
                                            alt={profile.name}
                                        />
                                    ) : (
                                        <div className={"alumni-profile-header-avatar alumni-profile-header-avatar-fallback"} lang={detectLanguage(profile.name || profile.username)}>
                                            {(profile.name || profile.username || '?').trim().charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className={"alumni-profile-header-info"}>
                                        <h2 lang={detectLanguage(profile.name)} dir="auto">{renderWithLanguageSpans(profile.name)}</h2>
                                        <p className={"alumni-profile-header-username alumni-profile-force-english"} lang={"en"} dir="ltr">@{profile.username} · {profile.email}</p>

                                        {profile.position && <p lang={detectLanguage(profile.position)} dir="auto">{renderWithLanguageSpans(profile.position)}</p>}

                                        {profile.graduationDate && (
                                            <p lang={language}>{t('students-life-pages.alumni-profile-page.class-of', {year: localiseDigits(profile.graduationDate.split('-')[0], language)})}</p>
                                        )}

                                        {profile.bio && <p lang={detectLanguage(profile.bio)} dir="auto">{renderWithLanguageSpans(profile.bio)}</p>}

                                        {profile.memberSince && (
                                            <p className={"alumni-profile-header-username"} lang={language}>{t('students-life-pages.alumni-profile-page.member-since', {date: formatLocalisedDate(profile.memberSinceIso, language, profile.memberSince)})}</p>
                                        )}
                                    </div>

                                    <div className={"alumni-profile-header-actions"}>
                                        {!pendingUpdate && (<button onClick={() => setShowEditProfileModal(true)} disabled={!!pendingUpdate}>
                                            {t('students-life-pages.alumni-profile-page.edit-profile')}
                                        </button>)}

                                        <button onClick={handleSharePublicProfileUrl}>
                                            {t('students-life-pages.alumni-profile-page.share')}
                                        </button>

                                        <button onClick={openChangePasswordModal}>
                                            {t('students-life-pages.alumni-profile-page.change-password')}
                                        </button>

                                        <button className={"alumni-danger-button"} onClick={() => logoutCurrentAlumni(navigate)}>
                                            {t('students-life-pages.alumni-profile-page.log-out')}
                                        </button>
                                    </div>
                                </div>

                                {pendingUpdate && (
                                    <div className={"alumni-profile-section"}>
                                        <div className={"alumni-profile-section-header"}>
                                            <h2>{t('students-life-pages.alumni-profile-page.pending-profile-update')}</h2>
                                            <span className={"alumni-status-chip alumni-status-chip-pending"}>{t('students-life-pages.alumni-profile-page.awaiting-approval')}</span>
                                        </div>

                                        <div className={"alumni-pending-update-banner"}>
                                            You asked to change the following, and the school is reviewing it (submitted {pendingUpdate.submittedAt}):
                                            <ul>
                                                {Object.keys(PENDING_UPDATE_FIELD_LABEL_KEYS)
                                                    .filter(fieldKey => pendingUpdate[fieldKey] !== null && pendingUpdate[fieldKey] !== undefined)
                                                    .map(fieldKey => (
                                                        <li key={fieldKey}>
                                                            {t(`students-life-pages.alumni-profile-page.${PENDING_UPDATE_FIELD_LABEL_KEYS[fieldKey]}`)}
                                                            {fieldKey !== 'newProfilePictureLink' ? `: ${pendingUpdate[fieldKey]}` : ` ${t('students-life-pages.alumni-profile-page.new-picture-uploaded')}`}
                                                        </li>
                                                    ))}
                                            </ul>
                                            {t('students-life-pages.alumni-profile-page.pending-update-note')}
                                        </div>

                                        <div className={"alumni-profile-post-item-actions"}>
                                            <button className={"alumni-danger-button"} onClick={handleCancelPendingUpdate}>
                                                {t('students-life-pages.alumni-profile-page.cancel-this-update')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!pendingUpdate && rejectedUpdate && rejectedUpdate.adminNote && (
                                    <div className={"alumni-profile-section"}>
                                        <div className={"alumni-profile-section-header"}>
                                            <h2>{t('students-life-pages.alumni-profile-page.last-profile-update')}</h2>
                                            <span className={"alumni-status-chip alumni-status-chip-rejected"}>{t('students-life-pages.alumni-profile-page.not-approved')}</span>
                                        </div>

                                        <p className={"alumni-note-from-school"}>
                                            Note from the school: {rejectedUpdate.adminNote}
                                        </p>
                                    </div>
                                )}

                                {pendingDeletionRequest && (
                                    <div className={"alumni-profile-section"}>
                                        <div className={"alumni-profile-section-header"}>
                                            <h2>{t('students-life-pages.alumni-profile-page.account-deletion-request')}</h2>
                                            <span className={"alumni-status-chip alumni-status-chip-pending"}>{t('students-life-pages.alumni-profile-page.awaiting-review')}</span>
                                        </div>

                                        <div className={"alumni-pending-update-banner"}>
                                            You asked for your account to be deleted, and the school is reviewing your request (submitted {pendingDeletionRequest.submittedAt}).
                                            Your account and posts stay active until the school approves it. If it is approved, your account, posts, and uploaded files will be permanently deleted.
                                        </div>

                                        <div className={"alumni-profile-post-item-actions"}>
                                            <button onClick={handleCancelDeletionRequest}>
                                                {t('students-life-pages.alumni-profile-page.cancel-this-request')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!pendingDeletionRequest && rejectedDeletionRequest && rejectedDeletionRequest.adminNote && (
                                    <div className={"alumni-profile-section"}>
                                        <div className={"alumni-profile-section-header"}>
                                            <h2>{t('students-life-pages.alumni-profile-page.last-deletion-request')}</h2>
                                            <span className={"alumni-status-chip alumni-status-chip-rejected"}>{t('students-life-pages.alumni-profile-page.not-approved')}</span>
                                        </div>

                                        <p className={"alumni-note-from-school"}>
                                            Note from the school: {rejectedDeletionRequest.adminNote}
                                        </p>
                                    </div>
                                )}


                                <div className={"alumni-profile-section"}>
                                    <div className={"alumni-profile-section-header"}>
                                        <h2>{t('students-life-pages.alumni-profile-page.my-posts')}</h2>

                                        <button onClick={openNewPostComposer}>
                                            {t('students-life-pages.alumni-profile-page.new-post')}
                                        </button>
                                    </div>

                                    {posts.length === 0 && (
                                        <p className={"alumni-profile-empty-hint"}>
                                            {t('students-life-pages.alumni-profile-page.no-posts-hint')}
                                        </p>
                                    )}

                                    {posts.map(post => (
                                        <div key={post.id} className={"alumni-profile-post-item"}>
                                            <div className={"alumni-profile-post-item-header"}>

                                                <div className={"alumni-profile-post-item-chips"}>
                                                    <span className={`alumni-status-chip alumni-status-chip-${post.status}`}>
                                                        {describePostStatus(post)}
                                                    </span>

                                                    {post.status === 'approved' && post.showOnHome && (
                                                        <span className={"alumni-status-chip alumni-status-chip-placement"}>{t('students-life-pages.alumni-profile-page.on-the-home-page')}</span>
                                                    )}

                                                    {post.status === 'approved' && post.showOnAlumniPage && (
                                                        <span className={"alumni-status-chip alumni-status-chip-placement"}>{t('students-life-pages.alumni-profile-page.on-the-alumni-page')}</span>
                                                    )}

                                                    {post.status === 'approved' && post.showOnProfile && (
                                                        <span className={"alumni-status-chip alumni-status-chip-placement"}>{t('students-life-pages.alumni-profile-page.on-my-public-page')}</span>
                                                    )}

                                                    {post.pendingEdit && post.pendingEdit.status === 'pending' && (
                                                        <span className={"alumni-status-chip alumni-status-chip-pending"}>{t('students-life-pages.alumni-profile-page.edit-awaiting-approval')}</span>
                                                    )}
                                                </div>

                                                <h3 lang={detectLanguage(post.title)} dir="auto">{renderWithLanguageSpans(post.title)}</h3>
                                            </div>



                                            <p className={"alumni-profile-post-item-meta"}>
                                                {t('students-life-pages.alumni-profile-page.written-on', {date: formatLocalisedDate(post.createdAtIso, language, post.createdAt)})}
                                                {post.reviewedAt ? ` · ${t('students-life-pages.alumni-profile-page.reviewed-on', {date: formatLocalisedDate(post.reviewedAtIso, language, post.reviewedAt)})}` : ''}
                                            </p>

                                            {post.status === 'rejected' && post.adminNote && (
                                                <p className={"alumni-note-from-school"}>
                                                    Note from the school: {post.adminNote}
                                                </p>
                                            )}

                                            {post.pendingEdit && post.pendingEdit.status === 'rejected' && post.pendingEdit.adminNote && (
                                                <p className={"alumni-note-from-school"}>
                                                    Your last edit was not approved. Note from the school: {post.pendingEdit.adminNote}
                                                </p>
                                            )}

                                            <div className={"alumni-profile-post-item-actions"}>
                                                <button

                                                    onClick={() => {
                                                        setPostToPreview(post);
                                                        setShowPostPreviewModal(true);
                                                    }}
                                                >
                                                    {t('students-life-pages.alumni-profile-page.view')}
                                                </button>

                                                <button onClick={() => openEditPostComposer(post)}>
                                                    {t('students-life-pages.alumni-profile-page.edit')}
                                                </button>

                                                <button
                                                    className={"alumni-danger-button"}
                                                    onClick={() => {
                                                        setPostToDelete(post);
                                                        setShowDeletePostModal(true);
                                                    }}
                                                >
                                                    {t('students-life-pages.alumni-profile-page.delete')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={"alumni-profile-section"}>
                                    <div className={"alumni-profile-section-header"}>
                                        <h2>{t('students-life-pages.alumni-profile-page.passkeys')}</h2>
                                    </div>

                                    <p className={"alumni-profile-empty-hint"}>
                                        {t('students-life-pages.alumni-profile-page.passkeys-hint')}
                                    </p>

                                    {passkeys.map(passkey => (
                                        <div key={passkey.id} className={"alumni-profile-passkey-row"}>
                                            <p>
                                                {passkey.label
                                                    ? <span lang={detectLanguage(passkey.label)} dir="auto">{renderWithLanguageSpans(passkey.label)}</span>
                                                    : t('students-life-pages.alumni-profile-page.passkey-default-label', {date: formatLocalisedDate(passkey.createdAtIso, language, passkey.createdAt)})}
                                                <span lang={language}>{t('students-life-pages.alumni-profile-page.passkey-added-on', {date: formatLocalisedDate(passkey.createdAtIso, language, passkey.createdAt)})}</span>
                                            </p>

                                            <button className={"alumni-danger-button"} onClick={() => handleDeletePasskey(passkey.id)}>
                                                {t('students-life-pages.alumni-profile-page.remove')}
                                            </button>
                                        </div>
                                    ))}

                                    {canUsePasskeys ? (
                                        <div className={"alumni-admin-actions-row"}>
                                            <input
                                                type="text"
                                                value={newPasskeyLabel}
                                                placeholder={t('students-life-pages.alumni-profile-page.passkey-name-placeholder')}
                                                onChange={(e) => setNewPasskeyLabel(e.target.value)}
                                                className={"text-form-field"}
                                            />

                                            <button onClick={handleRegisterPasskey}>
                                                {t('students-life-pages.alumni-profile-page.add-a-passkey')}
                                            </button>
                                        </div>
                                    ) : (

                                        <p className={"alumni-profile-empty-hint"}>
                                            {isMobileApp() ? t('students-life-pages.alumni-profile-page.passkeys-app-note') :
                                                t('students-life-pages.alumni-profile-page.passkeys-unsupported')
                                            }
                                        </p>

                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {profile && (
                <animated.div style={animateEditProfileModal} className={"alumni-modal"}>
                    <div className={"alumni-modal-overlay"} onClick={() => setShowEditProfileModal(false)}/>

                    <div className={"alumni-modal-container"}>
                        <div className={"alumni-modal-header"}>
                            <h3>{t('students-life-pages.alumni-profile-page.edit-profile')}</h3>
                        </div>

                        <div className={"alumni-modal-content"}>
                            <p className={"alumni-modal-content-note"}>
                                {t('students-life-pages.alumni-profile-page.profile-changes-note')}
                            </p>

                            {showEditProfileModal && (
                                <Form mailTo={''}
                                      sendPdf={false}
                                      formTitle={t('students-life-pages.alumni-profile-page.edit-profile-form-title')}
                                      lang={'en'}
                                      captchaLength={1}
                                      noInputFieldsCache={true}
                                      noCaptcha={true}
                                      hasDifferentOnSubmitBehaviour={true}
                                      differentOnSubmitBehaviour={handleSubmitProfileUpdate}
                                      hasDifferentSubmitButtonText={true}
                                      differentSubmitButtonText={[t('students-life-pages.alumni-profile-page.submit-for-approval'), 'Submitting...']}
                                      noClearOption={true}
                                      centerSubmitButton={true}
                                      fullMarginField={true}
                                      formFooterButtonsAreOutside={true}
                                      footerButtonsPortalTarget={submitProfileChangeForApprovalButtonRef}
                                      fields={[
                                          {
                                              id: editProfileFieldIds.username,
                                              type: 'text',
                                              name: 'username',
                                              label: 'Username',
                                              required: true,
                                              displayLabel: t('students-life-pages.alumni-profile-page.field-username'),
                                              placeholder: t('students-life-pages.alumni-profile-page.field-username'),
                                              errorMsg: t('students-life-pages.alumni-profile-page.username-error'),
                                              regex: '^[a-zA-Z0-9_]{3,30}$',
                                              value: profile.username || '',
                                              setValue: null,
                                              widthOfField: 2,
                                              httpName: 'username',
                                          },
                                          {
                                              id: editProfileFieldIds.name,
                                              type: 'text',
                                              name: 'name',
                                              label: t('students-life-pages.alumni-profile-page.full-name'),
                                              required: true,
                                              displayLabel: t('students-life-pages.alumni-profile-page.full-name'),
                                              placeholder: t('students-life-pages.alumni-profile-page.full-name'),
                                              errorMsg: t('students-life-pages.alumni-profile-page.name-error'),
                                              value: profile.name || '',
                                              setValue: null,
                                              widthOfField: 2,
                                              httpName: 'name',
                                          },
                                          {
                                              id: editProfileFieldIds.email,
                                              type: 'email',
                                              name: 'email',
                                              label: 'Email',
                                              required: true,
                                              displayLabel: t('students-life-pages.alumni-profile-page.field-email'),
                                              placeholder: t('students-life-pages.alumni-profile-page.field-email'),
                                              errorMsg: t('students-life-pages.alumni-profile-page.email-error'),
                                              value: profile.email || '',
                                              setValue: null,
                                              widthOfField: 2,
                                              httpName: 'email',
                                          },
                                          {
                                              id: editProfileFieldIds.position,
                                              type: 'text',
                                              name: 'position',
                                              label: t('students-life-pages.alumni-profile-page.current-position'),
                                              required: false,
                                              displayLabel: t('students-life-pages.alumni-profile-page.current-position'),
                                              placeholder: t('students-life-pages.alumni-profile-page.position-placeholder'),
                                              errorMsg: t('students-life-pages.alumni-profile-page.position-error'),
                                              value: profile.position || '',
                                              setValue: null,
                                              widthOfField: 2,
                                              httpName: 'position',
                                          },
                                          {
                                              id: editProfileFieldIds.graduationDate,
                                              type: 'date',
                                              minYear: schoolFoundedYear,
                                              name: 'graduation-date',
                                              label: t('students-life-pages.alumni-profile-page.graduation-date'),
                                              required: false,
                                              displayLabel: t('students-life-pages.alumni-profile-page.graduation-date'),
                                              placeholder: t('students-life-pages.alumni-profile-page.graduation-date'),
                                              errorMsg: t('students-life-pages.alumni-profile-page.graduation-date-error'),
                                              value: profile.graduationDate || '',
                                              setValue: null,
                                              widthOfField: 1,
                                              httpName: 'graduation-date',
                                          },
                                          {
                                              id: editProfileFieldIds.bio,
                                              type: 'textarea',
                                              name: 'bio',
                                              label: t('students-life-pages.alumni-profile-page.about-you'),
                                              required: false,
                                              displayLabel: t('students-life-pages.alumni-profile-page.about-you'),
                                              placeholder: t('students-life-pages.alumni-profile-page.bio-placeholder'),
                                              errorMsg: t('students-life-pages.alumni-profile-page.bio-error'),
                                              value: profile.bio || '',
                                              setValue: null,
                                              widthOfField: 2,
                                              httpName: 'bio',
                                          },
                                          {
                                              id: editProfileFieldIds.profilePicture,
                                              type: 'file',
                                              name: 'new-profile-picture',
                                              label: editProfilePictureFieldLabel,
                                              required: false,
                                              displayLabel: t('students-life-pages.alumni-profile-page.new-profile-picture-hint'),
                                              placeholder: t('students-life-pages.alumni-profile-page.new-profile-picture'),
                                              allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff', 'image/svg+xml', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
                                              errorMsg: t('students-life-pages.alumni-profile-page.profile-picture-error'),
                                              value: '',
                                              setValue: null,
                                              widthOfField: 2,
                                              httpName: 'new-profile-picture',
                                          },
                                      ]}
                                />
                            )}
                        </div>

                        <div className={"alumni-modal-footer"}>
                            <button onClick={() => setShowEditProfileModal(false)}>
                                {t('students-life-pages.alumni-profile-page.close')}
                            </button>

                            {!pendingDeletionRequest && (
                                <button className={"alumni-danger-button"} onClick={openDeleteAccountRequestModal}>
                                    {t('students-life-pages.alumni-profile-page.request-account-deletion')}
                                </button>
                            )}

                            <div ref={submitProfileChangeForApprovalButtonRef} className={'alumni-profile-submit-profile-change-button'}/>
                        </div>
                    </div>
                </animated.div>
            )}

            <animated.div style={animateDeleteAccountRequestModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setShowDeleteAccountRequestModal(false)}/>

                <div className={"alumni-modal-container alumni-modal-container-narrow"}>
                    <div className={"alumni-modal-header"}>
                        <h3>{t('students-life-pages.alumni-profile-page.request-account-deletion')}</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        <p className={"alumni-modal-content-note"}>
                            {t('students-life-pages.alumni-profile-page.deletion-modal-note')}
                        </p>

                        <div className={"alumni-modal-content-padding-wrapper"}>
                            <label className={"form-label-outside"}>
                                {t('students-life-pages.alumni-profile-page.reason-optional')}
                                <textarea
                                    value={deleteAccountReason}
                                    className={"textarea-form-field field-with-label-on-top"}
                                    placeholder={t('students-life-pages.alumni-profile-page.deletion-reason-placeholder')}
                                    onChange={(e) => setDeleteAccountReason(e.target.value)}
                                />
                            </label>
                        </div>

                        {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setShowDeleteAccountRequestModal(false)}>
                            {t('students-life-pages.alumni-profile-page.cancel')}
                        </button>

                        <button className={"alumni-danger-button"} onClick={handleRequestAccountDeletion} disabled={modalBusy}>
                            {modalBusy ? 'Submitting...' : t('students-life-pages.alumni-profile-page.submit-deletion-request')}
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateChangePasswordModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setShowChangePasswordModal(false)}/>

                <div className={"alumni-modal-container alumni-modal-container-narrow"}>
                    <div className={"alumni-modal-header"}>
                        <h3>{t('students-life-pages.alumni-profile-page.change-password')}</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        <Form
                            fields={[
                                {
                                    id: changePasswordFieldIds.currentPassword,
                                    name: 'current-password',
                                    httpName: 'current-password',
                                    type: 'password',
                                    widthOfField: 1,
                                    label: t('students-life-pages.alumni-profile-page.current-password'),
                                    displayLabel: t('students-life-pages.alumni-profile-page.current-password'),
                                    labelOutside: true,
                                    labelOnTop: true,
                                    required: true,
                                    value: '',
                                    setValue: null,
                                    errorMsg: t('students-life-pages.alumni-profile-page.current-password-error'),
                                    regex: '',
                                    placeholder: t('students-life-pages.alumni-profile-page.current-password'),
                                    dontLetTheBrowserSaveField: true,
                                    defaultValue: '',
                                    alwaysEnglish: true,
                                    lang: 'en',
                                },
                                {
                                    id: changePasswordFieldIds.newPassword,
                                    name: 'new-password',
                                    httpName: 'new-password',
                                    type: 'password',
                                    widthOfField: 1,
                                    label: t('students-life-pages.alumni-profile-page.new-password'),
                                    displayLabel: t('students-life-pages.alumni-profile-page.new-password'),
                                    labelOutside: true,
                                    labelOnTop: true,
                                    required: true,
                                    value: '',
                                    setValue: null,
                                    errorMsg: t('students-life-pages.alumni-profile-page.new-password-error'),
                                    regex: '',
                                    placeholder: t('students-life-pages.alumni-profile-page.new-password'),
                                    dontLetTheBrowserSaveField: true,
                                    defaultValue: '',
                                    alwaysEnglish: true,
                                    lang: 'en',
                                },
                                {
                                    id: changePasswordFieldIds.confirmNewPassword,
                                    name: 'confirm-new-password',
                                    httpName: 'confirm-new-password',
                                    type: 'password',
                                    widthOfField: 1,
                                    label: t('students-life-pages.alumni-profile-page.confirm-new-password'),
                                    displayLabel: t('students-life-pages.alumni-profile-page.confirm-new-password'),
                                    labelOutside: true,
                                    labelOnTop: true,
                                    required: true,
                                    value: '',
                                    setValue: null,
                                    errorMsg: t('students-life-pages.alumni-profile-page.confirm-new-password-error'),
                                    regex: '',
                                    placeholder: t('students-life-pages.alumni-profile-page.current-password'),
                                    dontLetTheBrowserSaveField: true,
                                    defaultValue: '',
                                    alwaysEnglish: true,
                                    lang: 'en',
                                }
                            ]}
                            mailTo={''}
                            formTitle={t('students-life-pages.alumni-profile-page.change-password')}
                            captchaLength={1}
                            noInputFieldsCache={true}
                            noCaptcha={true}
                            hasDifferentOnSubmitBehaviour={true}
                            differentOnSubmitBehaviour={handleChangePassword}
                            noClearOption={true}
                            hasDifferentSubmitButtonText={true}
                            differentSubmitButtonText={[t('students-life-pages.alumni-profile-page.change-password'), t('students-life-pages.alumni-profile-page.changing-password')]}
                            hasDifferentSuccessMessage={true}
                            differentSuccessMessage={t('students-life-pages.alumni-profile-page.password-changed')}
                            centerSubmitButton={true}
                            easySimpleCaptcha={true}
                            fullMarginField={true}
                            hasSetSubmittingLocal={true}
                            setSubmittingLocal={setModalBusy}
                            formInModalPopup={true}
                            setShowFormModalPopup={setShowChangePasswordModal}
                            forceEnglishForm={true}
                            formFooterButtonsAreOutside={true}
                            footerButtonsPortalTarget={changePasswordSubmitButtonRef}
                        />

                        <p className={"alumni-modal-content-note"}>
                            {t('students-life-pages.alumni-profile-page.password-policy-note')}
                        </p>

                        {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setShowChangePasswordModal(false)}>
                            {t('students-life-pages.alumni-profile-page.cancel')}
                        </button>

                        <div ref={changePasswordSubmitButtonRef} className={"alumni-profile-change-password-submit-button"} />

                    </div>
                </div>
            </animated.div>

            <animated.div style={animatePostComposerModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setShowPostComposerModal(false)}/>

                <div className={"alumni-modal-container alumni-markdown-post-editor"}>
                    <div className={"alumni-modal-header"}>
                        <h3>{composerPost ? t('students-life-pages.alumni-profile-page.edit-post') : t('students-life-pages.alumni-profile-page.new-post')}</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        <p className={"alumni-modal-content-note"}>
                            {composerPost && composerPost.status === 'approved'
                                ? t('students-life-pages.alumni-profile-page.edit-post-note')
                                : t('students-life-pages.alumni-profile-page.new-post-note')}
                        </p>

                        <label className={"form-label-outside"}>
                            {t('students-life-pages.alumni-profile-page.title-field')}
                            <input
                                type="text"
                                value={composerTitle}
                                className={"text-form-field field-with-label-on-top"}
                                maxLength={200}
                                placeholder={t('students-life-pages.alumni-profile-page.title-placeholder')}
                                onChange={(e) => setComposerTitle(e.target.value)}
                            />
                        </label>

                        <AlumniMarkdownEditor
                            value={composerContent}
                            onChange={setComposerContent}
                            onUploadImage={(file) => uploadAlumniPostImage(file, navigate)}
                            disabled={modalBusy}
                        />

                        {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setShowPostComposerModal(false)}>
                            {t('students-life-pages.alumni-profile-page.cancel')}
                        </button>

                        <button onClick={handleSubmitComposer} disabled={modalBusy}>
                            {modalBusy ? 'Submitting...' : t('students-life-pages.alumni-profile-page.submit-for-approval')}
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animatePostPreviewModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setShowPostPreviewModal(false)}/>

                <div className={"alumni-modal-container"}>
                    <div className={"alumni-modal-header"}>
                        <h3>{postToPreview ? postToPreview.title : ''}</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        {postToPreview && <MarkdownContent content={postToPreview.content}/>}
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setShowPostPreviewModal(false)}>
                            {t('students-life-pages.alumni-profile-page.close')}
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeletePostModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setShowDeletePostModal(false)}/>

                <div className={"alumni-modal-container alumni-modal-container-narrow"}>
                    <div className={"alumni-modal-header"}>
                        <h3>{t('students-life-pages.alumni-profile-page.delete-post')}</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        <p className={"alumni-modal-content-note"}>
                            Are you sure you want to permanently delete
                            {postToDelete ? ` "${postToDelete.title}"` : ` ${t('students-life-pages.alumni-profile-page.this-post')}`}? This cannot be undone
                            {postToDelete && (postToDelete.showOnHome || postToDelete.showOnAlumniPage || postToDelete.showOnProfile)
                                ? t('students-life-pages.alumni-profile-page.delete-post-featured-note')
                                : '.'}
                        </p>
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setShowDeletePostModal(false)}>
                            {t('students-life-pages.alumni-profile-page.cancel')}
                        </button>

                        <button className={"alumni-danger-button"} onClick={handleDeletePost} disabled={modalBusy}>
                            {modalBusy ? 'Deleting...' : t('students-life-pages.alumni-profile-page.delete')}
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateAlertModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setAlertModal(null)}/>

                <div className={"alumni-modal-container alumni-modal-container-narrow"}>
                    <div className={"alumni-modal-header"}>
                        <h3>{alertModal && alertModal.isError ? t('students-life-pages.alumni-profile-page.alert-error-title') : t('students-life-pages.alumni-profile-page.alert-success-title')}</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        <p className={alertModal && alertModal.isError ? "alumni-inline-error-message" : "alumni-inline-success-message"}>
                            {alertModal ? alertModal.message : ''}
                        </p>
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setAlertModal(null)}>
                            {t('students-life-pages.alumni-profile-page.close')}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default AlumniProfile;
