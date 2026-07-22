import {Helmet} from "react-helmet-async";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {useSpring, animated} from "react-spring";
import Spinner from "../../../modules/Spinner.jsx";
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
import {alumniPublicFileUrl, msgTimeout, isMobileApp} from "../../../services/General/GeneralUtils.jsx";
import {passkeySupported} from "../../../services/General/PasskeyUtils.jsx";

const PENDING_UPDATE_FIELD_LABELS = {
    newUsername: 'Username',
    newName: 'Name',
    newEmail: 'Email',
    newPosition: 'Position',
    newGraduationDate: 'Graduation Date',
    newBio: 'About You',
    newProfilePictureLink: 'Profile Picture',
};

function AlumniProfile() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [account, setAccount] = useState(null);
    const [pageMessage, setPageMessage] = useState('');
    const [pageError, setPageError] = useState('');

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

    const flashMessage = (message, isError = false) => {
        if (isError) {
            setPageError(message);
            setTimeout(() => setPageError(''), msgTimeout);
        } else {
            setPageMessage(message);
            setTimeout(() => setPageMessage(''), msgTimeout);
        }

        profilePageRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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

    const editProfilePictureFieldLabel = 'New Profile Picture';

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
                flashMessage(result.message);
                await loadAccount();
                return true;
            } else {
                throw new Error((result && result.message) || 'The profile update could not be submitted.');
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
            flashMessage(result.message);
            await loadAccount();
        } else {
            flashMessage((result && result.message) || 'Could not cancel the pending update.', true);
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
            flashMessage(result.message);
            await loadAccount();
        } else {
            setModalError((result && result.message) || 'The deletion request could not be submitted.');
        }
    };

    const handleCancelDeletionRequest = async () => {
        setIsLoading(true);
        const result = await cancelAlumniAccountDeletionRequest(navigate);
        setIsLoading(false);

        if (result && result.success) {
            flashMessage(result.message);
            await loadAccount();
        } else {
            flashMessage((result && result.message) || 'Could not cancel the deletion request.', true);
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
            setModalError('Please fill in all three password fields.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setModalError('The new passwords do not match.');
            return;
        }

        setModalBusy(true);
        setModalError('');

        const result = await changeAlumniPassword(currentPassword, newPassword, confirmNewPassword, navigate);
        setModalBusy(false);

        if (result && result.success) {
            setShowChangePasswordModal(false);
            flashMessage(result.message);
            if (profile && profile.username) {
                await updateAlumniBiometricCredentials(profile.username, newPassword);
            }
        } else {
            setModalError((result && result.message) || 'The password could not be changed.');
        }
    };

    const handleRegisterPasskey = async () => {
        if (isLoading) { return; }

        setIsLoading(true);
        const result = await registerAlumniPasskey(newPasskeyLabel.trim(), navigate);
        setIsLoading(false);

        if (result && result.success) {
            setNewPasskeyLabel('');
            flashMessage('Your passkey was added. You can now sign in with it instead of your password.');
            await loadAccount();
        } else if (result && !result.cancelled) {
            flashMessage((result && result.message) || 'The passkey could not be added.', true);
        }
    };

    const handleDeletePasskey = async (passkeyId) => {
        setIsLoading(true);
        const result = await deleteAlumniPasskey(passkeyId, navigate);
        setIsLoading(false);

        if (result && result.success) {
            flashMessage('The passkey was removed.');
            await loadAccount();
        } else {
            flashMessage((result && result.message) || 'The passkey could not be removed.', true);
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
            setModalError('Please add both a title and some content before submitting.');
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
            flashMessage(result.message);
            await loadAccount();
        } else {
            setModalError((result && result.message) || 'The post could not be submitted.');
        }
    };

    const handleDeletePost = async () => {
        if (!postToDelete || modalBusy) { return; }

        setModalBusy(true);
        const result = await deleteAlumniPost(postToDelete.id, navigate);
        setModalBusy(false);
        setShowDeletePostModal(false);

        if (result && result.success) {
            flashMessage(result.message);
            await loadAccount();
        } else {
            flashMessage((result && result.message) || 'The post could not be deleted.', true);
        }
    };

    const describePostStatus = (post) => {
        if (post.status === 'pending') { return 'Awaiting approval'; }
        if (post.status === 'rejected') { return 'Not approved'; }
        return 'Published';
    };

    return (
        <>
            {isLoading && <Spinner/>}

            <Helmet>
                <title>Harvest International School | Students Life | Alumni Profile</title>
                <meta name="description" content="Manage your Harvest International School alumni profile and share your stories with the Harvest community."/>
                <meta name="robots" content="noindex, nofollow"/>
            </Helmet>

            <div className={"alumni-profile-page"}>
                <div className={"extreme-padding-container"}>
                    <div className={"alumni-profile-wrapper"} ref={profilePageRef}>
                        {pageMessage && <p className={"alumni-inline-success-message"}>{pageMessage}</p>}
                        {pageError && <p className={"alumni-inline-error-message"}>{pageError}</p>}

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
                                        <div className={"alumni-profile-header-avatar alumni-profile-header-avatar-fallback"}>
                                            {(profile.name || profile.username || '?').trim().charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className={"alumni-profile-header-info"}>
                                        <h2>{profile.name}</h2>
                                        <p className={"alumni-profile-header-username"}>@{profile.username} · {profile.email}</p>

                                        {profile.position && <p>{profile.position}</p>}

                                        {profile.graduationDate && (
                                            <p>Class of {profile.graduationDate.split('-')[0]}</p>
                                        )}

                                        {profile.bio && <p>{profile.bio}</p>}

                                        {profile.memberSince && (
                                            <p className={"alumni-profile-header-username"}>Member since {profile.memberSince}</p>
                                        )}
                                    </div>

                                    <div className={"alumni-profile-header-actions"}>
                                        {!pendingUpdate && (<button onClick={() => setShowEditProfileModal(true)} disabled={!!pendingUpdate}>
                                            Edit Profile
                                        </button>)}

                                        <button onClick={openChangePasswordModal}>
                                            Change Password
                                        </button>

                                        <button className={"alumni-danger-button"} onClick={() => logoutCurrentAlumni(navigate)}>
                                            Log Out
                                        </button>
                                    </div>
                                </div>

                                {pendingUpdate && (
                                    <div className={"alumni-profile-section"}>
                                        <div className={"alumni-profile-section-header"}>
                                            <h2>Pending Profile Update</h2>
                                            <span className={"alumni-status-chip alumni-status-chip-pending"}>Awaiting approval</span>
                                        </div>

                                        <div className={"alumni-pending-update-banner"}>
                                            You asked to change the following, and the school is reviewing it (submitted {pendingUpdate.submittedAt}):
                                            <ul>
                                                {Object.keys(PENDING_UPDATE_FIELD_LABELS)
                                                    .filter(fieldKey => pendingUpdate[fieldKey] !== null && pendingUpdate[fieldKey] !== undefined)
                                                    .map(fieldKey => (
                                                        <li key={fieldKey}>
                                                            {PENDING_UPDATE_FIELD_LABELS[fieldKey]}
                                                            {fieldKey !== 'newProfilePictureLink' ? `: ${pendingUpdate[fieldKey]}` : ' (new picture uploaded)'}
                                                        </li>
                                                    ))}
                                            </ul>
                                            Your live profile stays unchanged until the school approves the update.
                                        </div>

                                        <div className={"alumni-profile-post-item-actions"}>
                                            <button className={"alumni-danger-button"} onClick={handleCancelPendingUpdate}>
                                                Cancel this update
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!pendingUpdate && rejectedUpdate && rejectedUpdate.adminNote && (
                                    <div className={"alumni-profile-section"}>
                                        <div className={"alumni-profile-section-header"}>
                                            <h2>Last Profile Update</h2>
                                            <span className={"alumni-status-chip alumni-status-chip-rejected"}>Not approved</span>
                                        </div>

                                        <p className={"alumni-note-from-school"}>
                                            Note from the school: {rejectedUpdate.adminNote}
                                        </p>
                                    </div>
                                )}

                                {pendingDeletionRequest && (
                                    <div className={"alumni-profile-section"}>
                                        <div className={"alumni-profile-section-header"}>
                                            <h2>Account Deletion Request</h2>
                                            <span className={"alumni-status-chip alumni-status-chip-pending"}>Awaiting review</span>
                                        </div>

                                        <div className={"alumni-pending-update-banner"}>
                                            You asked for your account to be deleted, and the school is reviewing your request (submitted {pendingDeletionRequest.submittedAt}).
                                            Your account and posts stay active until the school approves it. If it is approved, your account, posts, and uploaded files will be permanently deleted.
                                        </div>

                                        <div className={"alumni-profile-post-item-actions"}>
                                            <button onClick={handleCancelDeletionRequest}>
                                                Cancel this request
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!pendingDeletionRequest && rejectedDeletionRequest && rejectedDeletionRequest.adminNote && (
                                    <div className={"alumni-profile-section"}>
                                        <div className={"alumni-profile-section-header"}>
                                            <h2>Last Deletion Request</h2>
                                            <span className={"alumni-status-chip alumni-status-chip-rejected"}>Not approved</span>
                                        </div>

                                        <p className={"alumni-note-from-school"}>
                                            Note from the school: {rejectedDeletionRequest.adminNote}
                                        </p>
                                    </div>
                                )}


                                <div className={"alumni-profile-section"}>
                                    <div className={"alumni-profile-section-header"}>
                                        <h2>My Posts</h2>

                                        <button onClick={openNewPostComposer}>
                                            New Post
                                        </button>
                                    </div>

                                    {posts.length === 0 && (
                                        <p className={"alumni-profile-empty-hint"}>
                                            You have not written any posts yet. Share your story with the Harvest community — every post is reviewed by the school before it appears publicly.
                                        </p>
                                    )}

                                    {posts.map(post => (
                                        <div key={post.id} className={"alumni-profile-post-item"}>
                                            <div className={"alumni-profile-post-item-header"}>

                                                <div className={"alumni-profile-post-item-chips"}>
                                                    <span className={`alumni-status-chip alumni-status-chip-${post.status}`}>
                                                        {describePostStatus(post)}
                                                    </span>

                                                    {post.showOnHome && (
                                                        <span className={"alumni-status-chip alumni-status-chip-placement"}>On the home page</span>
                                                    )}

                                                    {post.showOnAlumniPage && (
                                                        <span className={"alumni-status-chip alumni-status-chip-placement"}>On the alumni page</span>
                                                    )}

                                                    {post.pendingEdit && post.pendingEdit.status === 'pending' && (
                                                        <span className={"alumni-status-chip alumni-status-chip-pending"}>Edit awaiting approval</span>
                                                    )}
                                                </div>

                                                <h3>{post.title}</h3>
                                            </div>



                                            <p className={"alumni-profile-post-item-meta"}>
                                                Written {post.createdAt}
                                                {post.reviewedAt ? ` · Reviewed ${post.reviewedAt}` : ''}
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
                                                    View
                                                </button>

                                                <button onClick={() => openEditPostComposer(post)}>
                                                    Edit
                                                </button>

                                                <button
                                                    className={"alumni-danger-button"}
                                                    onClick={() => {
                                                        setPostToDelete(post);
                                                        setShowDeletePostModal(true);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={"alumni-profile-section"}>
                                    <div className={"alumni-profile-section-header"}>
                                        <h2>Passkeys</h2>
                                    </div>

                                    <p className={"alumni-profile-empty-hint"}>
                                        Passkeys let you sign in with your fingerprint, face, or device PIN instead of your password.
                                    </p>

                                    {passkeys.map(passkey => (
                                        <div key={passkey.id} className={"alumni-profile-passkey-row"}>
                                            <p>
                                                {passkey.label}
                                                <span>Added {passkey.createdAt}</span>
                                            </p>

                                            <button className={"alumni-danger-button"} onClick={() => handleDeletePasskey(passkey.id)}>
                                                Remove
                                            </button>
                                        </div>
                                    ))}

                                    {canUsePasskeys ? (
                                        <div className={"alumni-admin-actions-row"}>
                                            <input
                                                type="text"
                                                value={newPasskeyLabel}
                                                placeholder={"Passkey name (e.g. My iPhone)"}
                                                onChange={(e) => setNewPasskeyLabel(e.target.value)}
                                                className={"text-form-field"}
                                            />

                                            <button onClick={handleRegisterPasskey}>
                                                Add a Passkey
                                            </button>
                                        </div>
                                    ) : (

                                        <p className={"alumni-profile-empty-hint"}>
                                            {isMobileApp() ? 'Passkeys are managed from a web browser. This app already supports biometric sign-in on this device.' :
                                                'Passkeys are not supported on this device or browser.'
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
                            <h3>Edit Profile</h3>
                        </div>

                        <div className={"alumni-modal-content"}>
                            <p className={"alumni-modal-content-note"}>
                                Profile changes are reviewed by the school before they appear publicly. Your password is the only thing you can change instantly, from the Change Password option.
                            </p>

                            {showEditProfileModal && (
                                <Form mailTo={''}
                                      sendPdf={false}
                                      formTitle={"Alumni Edit Profile Form"}
                                      lang={'en'}
                                      captchaLength={1}
                                      noInputFieldsCache={true}
                                      noCaptcha={true}
                                      hasDifferentOnSubmitBehaviour={true}
                                      differentOnSubmitBehaviour={handleSubmitProfileUpdate}
                                      hasDifferentSubmitButtonText={true}
                                      differentSubmitButtonText={['Submit for Approval', 'Submitting...']}
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
                                              displayLabel: 'Username',
                                              placeholder: 'Username',
                                              errorMsg: 'Username must be 3-30 characters of letters, numbers, and underscores',
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
                                              label: 'Full Name',
                                              required: true,
                                              displayLabel: 'Full Name',
                                              placeholder: 'Full Name',
                                              errorMsg: 'Please enter your full name',
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
                                              displayLabel: 'Email',
                                              placeholder: 'Email',
                                              errorMsg: 'Please enter a valid email address',
                                              value: profile.email || '',
                                              setValue: null,
                                              widthOfField: 2,
                                              httpName: 'email',
                                          },
                                          {
                                              id: editProfileFieldIds.position,
                                              type: 'text',
                                              name: 'position',
                                              label: 'Current Position',
                                              required: false,
                                              displayLabel: 'Current Position',
                                              placeholder: 'e.g. Software Engineer at ...',
                                              errorMsg: 'Please enter your current position',
                                              value: profile.position || '',
                                              setValue: null,
                                              widthOfField: 2,
                                              httpName: 'position',
                                          },
                                          {
                                              id: editProfileFieldIds.graduationDate,
                                              type: 'date',
                                              name: 'graduation-date',
                                              label: 'Graduation Date',
                                              required: false,
                                              displayLabel: 'Graduation Date',
                                              placeholder: 'Graduation Date',
                                              errorMsg: 'Please enter your graduation date',
                                              value: profile.graduationDate || '',
                                              setValue: null,
                                              widthOfField: 1,
                                              httpName: 'graduation-date',
                                          },
                                          {
                                              id: editProfileFieldIds.bio,
                                              type: 'textarea',
                                              name: 'bio',
                                              label: 'About You',
                                              required: false,
                                              displayLabel: 'About You',
                                              placeholder: 'A short introduction about yourself',
                                              errorMsg: 'Please tell us about yourself',
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
                                              displayLabel: 'New Profile Picture (leave empty to keep the current one)',
                                              placeholder: 'New Profile Picture',
                                              allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff', 'image/svg+xml', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
                                              errorMsg: 'Please upload your profile picture in a valid image format',
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
                                Close
                            </button>

                            {!pendingDeletionRequest && (
                                <button className={"alumni-danger-button"} onClick={openDeleteAccountRequestModal}>
                                    Request Account Deletion
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
                        <h3>Request Account Deletion</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        <p className={"alumni-modal-content-note"}>
                            This sends a request to the school to permanently delete your alumni account, including your posts, profile updates, passkeys, and uploaded files.
                            Your account stays active until the school approves the request, and you can cancel it from your profile page at any time before then.
                        </p>

                        <div className={"alumni-modal-content-padding-wrapper"}>
                            <label className={"form-label-outside"}>
                                Reason (optional)
                                <textarea
                                    value={deleteAccountReason}
                                    className={"textarea-form-field field-with-label-on-top"}
                                    placeholder={"Let the school know why you would like your account deleted"}
                                    onChange={(e) => setDeleteAccountReason(e.target.value)}
                                />
                            </label>
                        </div>

                        {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setShowDeleteAccountRequestModal(false)}>
                            Cancel
                        </button>

                        <button className={"alumni-danger-button"} onClick={handleRequestAccountDeletion} disabled={modalBusy}>
                            {modalBusy ? 'Submitting...' : 'Submit Deletion Request'}
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateChangePasswordModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setShowChangePasswordModal(false)}/>

                <div className={"alumni-modal-container alumni-modal-container-narrow"}>
                    <div className={"alumni-modal-header"}>
                        <h3>Change Password</h3>
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
                                    label: 'Current Password',
                                    displayLabel: 'Current Password',
                                    labelOutside: true,
                                    labelOnTop: true,
                                    required: true,
                                    value: '',
                                    setValue: null,
                                    errorMsg: 'Please enter your current password',
                                    regex: '',
                                    placeholder: 'Current Password',
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
                                    label: 'New Password',
                                    displayLabel: 'New Password',
                                    labelOutside: true,
                                    labelOnTop: true,
                                    required: true,
                                    value: '',
                                    setValue: null,
                                    errorMsg: 'Please enter your new password',
                                    regex: '',
                                    placeholder: 'New Password',
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
                                    label: 'Confirm New Password',
                                    displayLabel: 'Confirm New Password',
                                    labelOutside: true,
                                    labelOnTop: true,
                                    required: true,
                                    value: '',
                                    setValue: null,
                                    errorMsg: 'Please confirm your new password',
                                    regex: '',
                                    placeholder: 'Current Password',
                                    dontLetTheBrowserSaveField: true,
                                    defaultValue: '',
                                    alwaysEnglish: true,
                                    lang: 'en',
                                }
                            ]}
                            mailTo={''}
                            formTitle={'Change Password'}
                            captchaLength={1}
                            noInputFieldsCache={true}
                            noCaptcha={false}
                            hasDifferentOnSubmitBehaviour={true}
                            differentOnSubmitBehaviour={handleChangePassword}
                            noClearOption={true}
                            hasDifferentSubmitButtonText={true}
                            differentSubmitButtonText={['Change Password', 'Changing Password']}
                            hasDifferentSuccessMessage={true}
                            differentSuccessMessage={'Password changed successfully'}
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
                            The new password must be at least 8 characters long with an uppercase letter, a lowercase letter, a number, and a special character. Changing the password signs you out of your other devices.
                        </p>

                        {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setShowChangePasswordModal(false)}>
                            Cancel
                        </button>

                        <div ref={changePasswordSubmitButtonRef} className={"alumni-profile-change-password-submit-button"} />

                    </div>
                </div>
            </animated.div>

            <animated.div style={animatePostComposerModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setShowPostComposerModal(false)}/>

                <div className={"alumni-modal-container alumni-markdown-post-editor"}>
                    <div className={"alumni-modal-header"}>
                        <h3>{composerPost ? 'Edit Post' : 'New Post'}</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        <p className={"alumni-modal-content-note"}>
                            {composerPost && composerPost.status === 'approved'
                                ? 'This post is already published, so your edit will be reviewed by the school first. The current version stays visible until the edit is approved.'
                                : 'Every post is reviewed by the school before it appears publicly.'}
                        </p>

                        <label className={"form-label-outside"}>
                            Title*
                            <input
                                type="text"
                                value={composerTitle}
                                className={"text-form-field field-with-label-on-top"}
                                maxLength={200}
                                placeholder={"Give your story a title"}
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
                            Cancel
                        </button>

                        <button onClick={handleSubmitComposer} disabled={modalBusy}>
                            {modalBusy ? 'Submitting...' : 'Submit for Approval'}
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
                            Close
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeletePostModal} className={"alumni-modal"}>
                <div className={"alumni-modal-overlay"} onClick={() => setShowDeletePostModal(false)}/>

                <div className={"alumni-modal-container alumni-modal-container-narrow"}>
                    <div className={"alumni-modal-header"}>
                        <h3>Delete Post</h3>
                    </div>

                    <div className={"alumni-modal-content"}>
                        <p className={"alumni-modal-content-note"}>
                            Are you sure you want to permanently delete
                            {postToDelete ? ` "${postToDelete.title}"` : ' this post'}? This cannot be undone
                            {postToDelete && (postToDelete.showOnHome || postToDelete.showOnAlumniPage)
                                ? ', and it will also disappear from the school pages where it is featured.'
                                : '.'}
                        </p>
                    </div>

                    <div className={"alumni-modal-footer"}>
                        <button onClick={() => setShowDeletePostModal(false)}>
                            Cancel
                        </button>

                        <button className={"alumni-danger-button"} onClick={handleDeletePost} disabled={modalBusy}>
                            {modalBusy ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default AlumniProfile;
