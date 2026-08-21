import '../../styles/AdminDashboard.css';
import '../../styles/AlumniStudents.css';
import {useNavigate} from "react-router";
import {useEffect, useRef, useState} from "react";
import {useSpring, animated} from "react-spring";
import Form from "../../modules/Form.jsx";
import Table from "../../modules/Table.jsx";
import TabsPage from "../../modules/TabsPage.jsx";
import MarkdownContent from "../../modules/MarkdownContent.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {alumniStudentsManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";
import {
    fetchAllAlumniAccounts,
    fetchAllAlumniPosts,
    setAlumniAccountStatus,
    reviewAlumniProfileUpdate,
    reviewAlumniDeletionRequest,
    deleteAlumniAccount,
    reviewAlumniPost,
    setAlumniPostPlacement,
    deleteAlumniPostByAdmin,
} from "../../services/Admin/AlumniStudents/AdminAlumniStudentsManagementServices.jsx";
import {Capacitor} from "@capacitor/core";
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'

const REVIEW_DECISIONS = {Approve: 'approved', Reject: 'rejected'};

const ACCOUNT_DECISIONS = {
    Approve: 'approved', Reject: 'rejected',
    'Enable the account': 'approved', 'Disable the account': 'disabled',
};

const accountDecisionChoices = (accountStatus) => {
    if (accountStatus === 'approved') { return ['Disable the account']; }
    if (accountStatus === 'disabled') { return ['Enable the account']; }
    if (accountStatus === 'rejected') { return ['Approve']; }

    return ['Approve', 'Reject'];
};

const decisionFieldId = 1;
const noteFieldId = 2;
const placementHomeFieldId = 3;
const placementAlumniFieldId = 4;
const notifyAuthorFieldId = 5;

const noteField = (displayLabel) => ({
    id: noteFieldId, type: 'textarea', name: 'admin-note', httpName: 'admin-note',
    label: 'Note', displayLabel: displayLabel, required: false, value: '',
    placeholder: 'Optional note that is included in the email sent to the alumni student',
    widthOfField: 1, labelOutside: true, labelOnTop: true,
});

const decisionField = (displayLabel, choices) => ({
    id: decisionFieldId, type: 'select', name: 'decision', httpName: 'decision',
    label: 'Decision', displayLabel: displayLabel, required: true,
    errorMsg: 'Choose what to do with this request', value: '', choices: choices,
    widthOfField: 1, labelOutside: true, labelOnTop: true,
});

const PROFILE_UPDATE_FIELDS = [
    {key: 'username', label: 'Username'},
    {key: 'name', label: 'Name'},
    {key: 'email', label: 'Email'},
    {key: 'position', label: 'Position'},
    {key: 'graduationDate', label: 'Graduation Date'},
    {key: 'bio', label: 'Bio'},
    {key: 'profilePictureLink', label: 'Profile Picture'},
];


function AlumniStudentsManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useLoading(false);
    const [accountsData, setAccountsData] = useState(null);
    const [accountRecordsById, setAccountRecordsById] = useState({});
    const [updatesData, setUpdatesData] = useState(null);
    const [updateRecordsById, setUpdateRecordsById] = useState({});
    const [postsData, setPostsData] = useState(null);
    const [postRecordsById, setPostRecordsById] = useState({});
    const [deletionRequestsData, setDeletionRequestsData] = useState(null);
    const [deletionRequestRecordsById, setDeletionRequestRecordsById] = useState({});
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedUpdate, setSelectedUpdate] = useState(null);
    const [selectedDeletionRequest, setSelectedDeletionRequest] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showAccountReviewModal, setShowAccountReviewModal] = useState(false);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [showUpdateReviewModal, setShowUpdateReviewModal] = useState(false);
    const [showDeletionReviewModal, setShowDeletionReviewModal] = useState(false);
    const [showPostReviewModal, setShowPostReviewModal] = useState(false);
    const [showPlacementModal, setShowPlacementModal] = useState(false);
    const [showDeletePostModal, setShowDeletePostModal] = useState(false);
    const [modalBusy, setModalBusy] = useState(false);
    const [modalError, setModalError] = useState('');
    const [modalFields, setModalFields] = useState(null);
    const [resetModalForm, setResetModalForm] = useState(false);
    const accountFooterRef = useRef(null);
    const updateFooterRef = useRef(null);
    const deletionFooterRef = useRef(null);
    const postFooterRef = useRef(null);
    const placementFooterRef = useRef(null);
    const deletePostFooterRef = useRef(null);

    const animateAccountReviewModal = useSpring({
        opacity: showAccountReviewModal ? 1 : 0,
        transform: showAccountReviewModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showAccountReviewModal ? 'auto' : 'none',
    });

    const animateDeleteAccountModal = useSpring({
        opacity: showDeleteAccountModal ? 1 : 0,
        transform: showDeleteAccountModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showDeleteAccountModal ? 'auto' : 'none',
    });

    const animateUpdateReviewModal = useSpring({
        opacity: showUpdateReviewModal ? 1 : 0,
        transform: showUpdateReviewModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showUpdateReviewModal ? 'auto' : 'none',
    });

    const animateDeletionReviewModal = useSpring({
        opacity: showDeletionReviewModal ? 1 : 0,
        transform: showDeletionReviewModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showDeletionReviewModal ? 'auto' : 'none',
    });

    const animatePostReviewModal = useSpring({
        opacity: showPostReviewModal ? 1 : 0,
        transform: showPostReviewModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showPostReviewModal ? 'auto' : 'none',
    });

    const animatePlacementModal = useSpring({
        opacity: showPlacementModal ? 1 : 0,
        transform: showPlacementModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showPlacementModal ? 'auto' : 'none',
    });

    const animateDeletePostModal = useSpring({
        opacity: showDeletePostModal ? 1 : 0,
        transform: showDeletePostModal ? 'translateY(0%)' : 'translateY(100%)',
        pointerEvents: showDeletePostModal ? 'auto' : 'none',
    });

    const reloadAccountsData = async () => {
        setIsLoading(true);
        await fetchAllAlumniAccounts(navigate, setAccountsData, setAccountRecordsById, setUpdatesData, setUpdateRecordsById, setDeletionRequestsData, setDeletionRequestRecordsById);
        setIsLoading(false);
    };

    const reloadPostsData = async () => {
        setIsLoading(true);
        await fetchAllAlumniPosts(navigate, setPostsData, setPostRecordsById);
        setIsLoading(false);
    };

    const reloadEverything = async () => {
        setIsLoading(true);
        await fetchAllAlumniAccounts(navigate, setAccountsData, setAccountRecordsById, setUpdatesData, setUpdateRecordsById, setDeletionRequestsData, setDeletionRequestRecordsById);
        await fetchAllAlumniPosts(navigate, setPostsData, setPostRecordsById);
        setIsLoading(false);
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, alumniStudentsManagementPermissionLevel, setIsLoading)
            .then(() => {
                reloadEverything();
            });
    }, []);

    const openAlumniFile = (filePath) => {
        if (!filePath) { return; }

        const url = `/view-alumni-file?file=${encodeURIComponent(filePath)}`;
        if (Capacitor.isNativePlatform()) {
            navigate(url);
        } else {
            window.open(url, '_blank');
        }
    };

    const finishModalAction = async (result, closeModal, reloadFn) => {
        if (result && result.success) {
            closeModal();
            setModalFields(null);
            setResetModalForm(true);
            await reloadFn();

            return true;
        }

        throw new Error((result && result.message) || 'The action could not be completed.');
    };

    const openAccountReviewModal = (rowIndex) => {
        if (!accountsData || !accountsData[rowIndex]) { return; }
        const accountId = accountsData[rowIndex][0];
        const record = accountRecordsById[String(accountId)];

        if (!record) { return; }

        setSelectedAccount(record);
        setModalFields([
            decisionField('Decision', accountDecisionChoices(record.accountStatus)),
            noteField('Note to the alumni student'),
        ]);
        setModalError('');
        setShowAccountReviewModal(true);
    };

    const openDeleteAccountModal = (rowIndex) => {
        if (!accountsData || !accountsData[rowIndex]) { return; }
        const accountId = accountsData[rowIndex][0];
        const record = accountRecordsById[String(accountId)];

        if (!record) { return; }

        setSelectedAccount(record);
        setModalError('');
        setShowDeleteAccountModal(true);
    };

    const handleSetAccountStatus = async (formData) => {
        if (!selectedAccount) { return false; }

        const values = Object.fromEntries(formData.entries());
        const status = ACCOUNT_DECISIONS[values[`field_${decisionFieldId}`]];

        setModalError('');
        const result = await setAlumniAccountStatus(selectedAccount.id, status, values[`field_${noteFieldId}`] || '');

        return finishModalAction(result, () => setShowAccountReviewModal(false), reloadAccountsData);
    };

    const handleDeleteAccount = async () => {
        if (!selectedAccount || modalBusy) { return; }

        setModalBusy(true);
        setModalError('');

        try {
            const result = await deleteAlumniAccount(selectedAccount.id);
            await finishModalAction(result, () => setShowDeleteAccountModal(false), reloadEverything);
        } catch (error) {
            setModalError(error.message);
        }

        setModalBusy(false);
    };

    const openUpdateReviewModal = (rowIndex) => {
        if (!updatesData || !updatesData[rowIndex]) { return; }
        const updateId = updatesData[rowIndex][0];
        const record = updateRecordsById[String(updateId)];

        if (!record) { return; }

        setSelectedUpdate(record);
        setModalFields([
            decisionField('Decision', ['Approve', 'Reject']),
            noteField('Note to the alumni student'),
        ]);
        setModalError('');
        setShowUpdateReviewModal(true);
    };

    const handleReviewProfileUpdate = async (formData) => {
        if (!selectedUpdate) { return false; }

        const values = Object.fromEntries(formData.entries());

        setModalError('');
        const result = await reviewAlumniProfileUpdate(
            selectedUpdate.id, REVIEW_DECISIONS[values[`field_${decisionFieldId}`]],
            values[`field_${noteFieldId}`] || ''
        );

        return finishModalAction(result, () => setShowUpdateReviewModal(false), reloadAccountsData);
    };

    const openDeletionReviewModal = (rowIndex) => {
        if (!deletionRequestsData || !deletionRequestsData[rowIndex]) { return; }
        const requestId = deletionRequestsData[rowIndex][0];
        const record = deletionRequestRecordsById[String(requestId)];

        if (!record) { return; }

        setSelectedDeletionRequest(record);
        setModalFields([
            decisionField('Decision', ['Approve', 'Reject']),
            noteField('Note to the alumni student'),
        ]);
        setModalError('');
        setShowDeletionReviewModal(true);
    };

    const handleReviewDeletionRequest = async (formData) => {
        if (!selectedDeletionRequest) { return false; }

        const values = Object.fromEntries(formData.entries());

        setModalError('');
        const result = await reviewAlumniDeletionRequest(
            selectedDeletionRequest.id, REVIEW_DECISIONS[values[`field_${decisionFieldId}`]], values[`field_${noteFieldId}`] || ''
        );

        return finishModalAction(result, () => setShowDeletionReviewModal(false), reloadEverything);
    };

    const openPostReviewModal = (rowIndex) => {
        if (!postsData || !postsData[rowIndex]) { return; }
        const postId = postsData[rowIndex][0];
        const record = postRecordsById[String(postId)];

        if (!record) { return; }

        setSelectedPost(record);
        setModalFields([
            decisionField(record.pendingEdit ? 'Decision on the edit' : 'Decision', ['Approve', 'Reject']),
            noteField('Note to the alumni student'),
        ]);
        setModalError('');
        setShowPostReviewModal(true);
    };

    const openPlacementModal = (rowIndex) => {
        if (!postsData || !postsData[rowIndex]) { return; }
        const postId = postsData[rowIndex][0];
        const record = postRecordsById[String(postId)];

        if (!record) { return; }

        setSelectedPost(record);
        setModalFields([
            {
                id: placementHomeFieldId, type: 'select', name: 'show-on-home', httpName: 'show-on-home',
                label: 'Home page', displayLabel: 'Show on the home page?', required: true,
                errorMsg: 'Choose whether this post shows on the home page', value: '',
                defaultValue: record.showOnHome ? 'Yes' : 'No', choices: ['No', 'Yes'],
                widthOfField: 2, labelOutside: true, labelOnTop: true,
            },
            {
                id: placementAlumniFieldId, type: 'select', name: 'show-on-alumni', httpName: 'show-on-alumni',
                label: 'Alumni page', displayLabel: 'Show on the alumni page?', required: true,
                errorMsg: 'Choose whether this post shows on the alumni students page', value: '',
                defaultValue: record.showOnAlumniPage ? 'Yes' : 'No', choices: ['No', 'Yes'],
                widthOfField: 2, labelOutside: true, labelOnTop: true,
            },
        ]);
        setModalError('');
        setShowPlacementModal(true);
    };

    const openDeletePostModal = (rowIndex) => {
        if (!postsData || !postsData[rowIndex]) { return; }
        const postId = postsData[rowIndex][0];
        const record = postRecordsById[String(postId)];

        if (!record) { return; }

        setSelectedPost(record);
        setModalFields([
            {
                id: notifyAuthorFieldId, type: 'select', name: 'notify-author', httpName: 'notify-author',
                label: 'Notify', displayLabel: 'Notify the author by email?', required: true,
                errorMsg: 'Choose whether the author is emailed', value: '',
                defaultValue: 'Yes', choices: ['Yes', 'No'],
                widthOfField: 1, labelOutside: true, labelOnTop: true,
            },
            noteField('Note to the alumni student, sent only if notified'),
        ]);
        setModalError('');
        setShowDeletePostModal(true);
    };

    const handleReviewPost = async (formData) => {
        if (!selectedPost) { return false; }

        const values = Object.fromEntries(formData.entries());
        const target = selectedPost.pendingEdit ? 'edit' : 'post';

        setModalError('');
        const result = await reviewAlumniPost(
            selectedPost.id, target, REVIEW_DECISIONS[values[`field_${decisionFieldId}`]],
            values[`field_${noteFieldId}`] || ''
        );

        return finishModalAction(result, () => setShowPostReviewModal(false), reloadPostsData);
    };

    const handleSavePlacement = async (formData) => {
        if (!selectedPost) { return false; }

        const values = Object.fromEntries(formData.entries());

        setModalError('');
        const result = await setAlumniPostPlacement(
            selectedPost.id,
            values[`field_${placementHomeFieldId}`] === 'Yes',
            values[`field_${placementAlumniFieldId}`] === 'Yes'
        );

        return finishModalAction(result, () => setShowPlacementModal(false), reloadPostsData);
    };

    const handleDeletePost = async (formData) => {
        if (!selectedPost) { return false; }

        const values = Object.fromEntries(formData.entries());
        const notify = values[`field_${notifyAuthorFieldId}`] === 'Yes';

        setModalError('');
        const result = await deleteAlumniPostByAdmin(
            selectedPost.id, notify, notify ? (values[`field_${noteFieldId}`] || '') : ''
        );

        return finishModalAction(result, () => setShowDeletePostModal(false), reloadPostsData);
    };

    const AccountsTab = () => (
        <div>
            <Table tableData={accountsData}
                   title={"Alumni Accounts"}
                   noDataMessage={"No alumni accounts were found"}
                   customActionColumn={{
                       headerText: 'Actions',
                       actions: [
                           {label: 'Review', onClick: openAccountReviewModal},
                       ],
                   }}
                   likelyUrlColumns={{
                       'Profile Picture': openAlumniFile,
                   }}
                   sortConfigParam={{column: 0, direction: 'descending'}}
                   filterableColumns={['Status', 'Pending Update', 'Deletion Requested']}
                   headerModuleElements={[
                       (
                           <button key={1} onClick={reloadAccountsData} disabled={isLoading}>
                               {isLoading ? 'Loading...' : 'Reload Table Data'}
                           </button>
                       )
                   ]}
                   footerModuleElements={[]}
                   allowDeleteEntryOption={true}
                   onDeleteEntry={openDeleteAccountModal}
                   isLoading={isLoading}
                   compact={true}
                   scrollable={true}
                   allowSticky={true}

            />
        </div>
    );

    const ProfileUpdatesTab = () => (
        <div>
            <Table tableData={updatesData}
                   title={"Profile Update Requests"}
                   noDataMessage={"No profile update requests were found"}
                   customActionColumn={{
                       headerText: 'Actions',
                       actions: [
                           {label: 'Review', onClick: openUpdateReviewModal},
                       ],
                   }}
                   sortConfigParam={{column: 0, direction: 'descending'}}
                   filterableColumns={['Status']}
                   headerModuleElements={[
                       (
                           <button key={1} onClick={reloadAccountsData} disabled={isLoading}>
                               {isLoading ? 'Loading...' : 'Reload Table Data'}
                           </button>
                       )
                   ]}
                   footerModuleElements={[]}
                   isLoading={isLoading}
                   compact={true}
                   scrollable={true}
                   allowSticky={true}
            />
        </div>
    );

    const DeletionRequestsTab = () => (
        <div>
            <Table tableData={deletionRequestsData}
                   title={"Account Deletion Requests"}
                   noDataMessage={"No account deletion requests were found"}
                   customActionColumn={{
                       headerText: 'Actions',
                       actions: [
                           {label: 'Review', onClick: openDeletionReviewModal},
                       ],
                   }}
                   sortConfigParam={{column: 0, direction: 'descending'}}
                   filterableColumns={['Status']}
                   headerModuleElements={[
                       (
                           <button key={1} onClick={reloadAccountsData} disabled={isLoading}>
                               {isLoading ? 'Loading...' : 'Reload Table Data'}
                           </button>
                       )
                   ]}
                   footerModuleElements={[]}
                   isLoading={isLoading}
                   compact={true}
                   scrollable={true}
                   allowSticky={true}
            />
        </div>
    );

    const PostsTab = () => (
        <div>
            <Table tableData={postsData}
                   title={"Alumni Posts"}
                   noDataMessage={"No alumni posts were found"}
                   customActionColumn={{
                       headerText: 'Actions',
                       actions: [
                           {label: 'Review', onClick: openPostReviewModal},
                           {label: 'Placement', onClick: openPlacementModal},
                       ],
                   }}
                   sortConfigParam={{column: 0, direction: 'descending'}}
                   filterableColumns={['Status', 'Pending Edit', 'On Home Page', 'On Alumni Page']}
                   headerModuleElements={[
                       (
                           <button key={1} onClick={reloadPostsData} disabled={isLoading}>
                               {isLoading ? 'Loading...' : 'Reload Table Data'}
                           </button>
                       )
                   ]}
                   footerModuleElements={[]}
                   allowDeleteEntryOption={true}
                   onDeleteEntry={openDeletePostModal}
                   isLoading={isLoading}
                   compact={true}
                   scrollable={true}
                   allowSticky={true}
            />
        </div>
    );

    const tabData = [
        {
            id: 0,
            label: 'Accounts',
            component: AccountsTab
        },
        {
            id: 1,
            label: 'Profile Updates',
            component: ProfileUpdatesTab
        },
        {
            id: 2,
            label: 'Deletion Requests',
            component: DeletionRequestsTab
        },
        {
            id: 3,
            label: 'Posts',
            component: PostsTab
        },
    ];

    const profileUpdateCellText = (value) => (
        value === null || value === undefined || value === '' ? '—' : String(value)
    );

    const renderPictureCell = (field, value, label, fallback) => {
        if (!field || field.key !== 'profilePictureLink') {
            return fallback;
        }

        if (value === null || value === undefined || value === '') {
            return fallback;
        }

        return (
            <button className={"alumni-admin-review-link"} onClick={() => openAlumniFile(value)}>
                {label}
            </button>
        );
    };

    const renderModalForm = (formTitle, onSubmit, submitText, closeModal, footerRef) => (
        <Form key={formTitle}
              fields={modalFields}
              mailTo={''}
              formTitle={formTitle}
              lang={"en"}
              captchaLength={1}
              noInputFieldsCache={true}
              noCaptcha={true}
              resetFormFromParent={resetModalForm}
              setResetForFromParent={setResetModalForm}
              hasDifferentOnSubmitBehaviour={true}
              differentOnSubmitBehaviour={onSubmit}
              formInModalPopup={true}
              setShowFormModalPopup={closeModal}
              formHasPasswordField={false}
              footerButtonsSpaceBetween={true}
              switchFooterButtonsOrder={true}
              forceEnglishForm={true}
              noClearOption={true}
              noSuccessMessage={true}
              hasDifferentSubmitButtonText={true}
              differentSubmitButtonText={submitText}
              formFooterButtonsAreOutside={true}
              footerButtonsPortalTarget={footerRef}
        />
    );

    return (
        <>
            <div className={"alumni-students-management-page"}>
                <TabsPage tabData={tabData} initialTab={0} title={"Alumni Students Management"}/>
            </div>

            <animated.div style={animateAccountReviewModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={() => setShowAccountReviewModal(false)}/>

                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>Review Alumni Account</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {selectedAccount && (
                            <div className={"alumni-admin-review-details"}>
                                <p><strong>Username:</strong> {selectedAccount.username}</p>
                                <p><strong>Name:</strong> {selectedAccount.name}</p>
                                <p><strong>Email:</strong> {selectedAccount.email}</p>
                                <p><strong>Position:</strong> {selectedAccount.position || '—'}</p>
                                <p><strong>Graduation Date:</strong> {selectedAccount.graduationDate || '—'}</p>
                                <p><strong>Bio:</strong> {selectedAccount.bio || '—'}</p>

                                <p>
                                    <strong>Profile Picture:</strong>{' '}
                                    {selectedAccount.profilePictureLink ? (
                                        <button className={"alumni-admin-review-link"} onClick={() => openAlumniFile(selectedAccount.profilePictureLink)}>
                                            View picture
                                        </button>
                                    ) : 'None uploaded'}
                                </p>

                                <p><strong>Current Status:</strong> {selectedAccount.accountStatus}</p>
                                <p><strong>Signed Up:</strong> {selectedAccount.signedUpAt}</p>
                                <p><strong>Last Login:</strong> {selectedAccount.lastLoginAt || 'Never'}</p>

                                {selectedAccount.adminNote && (
                                    <p><strong>Previous Note:</strong> {selectedAccount.adminNote}</p>
                                )}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}

                        {selectedAccount && modalFields && showAccountReviewModal && renderModalForm(
                            "Review Alumni Account Form", handleSetAccountStatus,
                            ['Save', 'Saving...'], () => setShowAccountReviewModal(false), accountFooterRef
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowAccountReviewModal(false)}>
                            Cancel
                        </button>
                        <div ref={accountFooterRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeleteAccountModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={() => setShowDeleteAccountModal(false)}/>

                <div className={"general-small-admin-action-modal-container"}>
                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>Delete Alumni Account</h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>
                        <p>
                            Are you sure you want to permanently delete the account
                            {selectedAccount ? ` '${selectedAccount.username}'` : ''}? All of its posts, profile updates,
                            passkeys, and uploaded files will be deleted with it. This cannot be reversed.
                        </p>

                        {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>
                        <button onClick={() => setShowDeleteAccountModal(false)} disabled={modalBusy}>
                            Cancel
                        </button>

                        <button onClick={handleDeleteAccount} disabled={modalBusy}>
                            {modalBusy ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateUpdateReviewModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={() => setShowUpdateReviewModal(false)}/>

                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>Review Profile Update</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {selectedUpdate && (
                            <div className={"alumni-admin-review-details"}>
                                <p>
                                    <strong>Account:</strong> {selectedUpdate.current.username}
                                    {' · '}<strong>Submitted:</strong> {selectedUpdate.submittedAt}
                                    {' · '}<strong>Status:</strong> {selectedUpdate.status}
                                </p>

                                <Table tableData={[
                                    ['Field', 'Current', 'Requested'],
                                    ...PROFILE_UPDATE_FIELDS.map((field) => [
                                        field.label,
                                        profileUpdateCellText(selectedUpdate.current[field.key]),
                                        selectedUpdate.requested[field.key] === null
                                        || selectedUpdate.requested[field.key] === undefined
                                            ? 'No change'
                                            : profileUpdateCellText(selectedUpdate.requested[field.key]),
                                    ]),
                                ]}
                                       reviewMode={true}
                                       forceEnglishTable={true}
                                       rowClassNames={(rowIndex) => {
                                           const field = PROFILE_UPDATE_FIELDS[rowIndex - 1];
                                           const value = field && selectedUpdate.requested[field.key];

                                           return (value === null || value === undefined)
                                               ? undefined
                                               : 'admin-diff-changed';
                                       }}
                                       cellRenderers={{
                                           Current: (value, rowIndex) => renderPictureCell(
                                               PROFILE_UPDATE_FIELDS[rowIndex - 1],
                                               selectedUpdate.current[PROFILE_UPDATE_FIELDS[rowIndex - 1].key],
                                               'View current picture', value
                                           ),
                                           Requested: (value, rowIndex) => renderPictureCell(
                                               PROFILE_UPDATE_FIELDS[rowIndex - 1],
                                               selectedUpdate.requested[PROFILE_UPDATE_FIELDS[rowIndex - 1].key],
                                               'View requested picture', value
                                           ),
                                       }}
                                />

                                {selectedUpdate.status !== 'pending' && selectedUpdate.adminNote && (
                                    <p><strong>Review Note:</strong> {selectedUpdate.adminNote}</p>
                                )}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}

                        {selectedUpdate && selectedUpdate.status === 'pending' && modalFields && showUpdateReviewModal && renderModalForm(
                            "Review Profile Update Form", handleReviewProfileUpdate,
                            ['Save', 'Saving...'], () => setShowUpdateReviewModal(false), updateFooterRef
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowUpdateReviewModal(false)}>
                            {selectedUpdate && selectedUpdate.status === 'pending' ? 'Cancel' : 'Close'}
                        </button>
                        <div ref={updateFooterRef} className="modal-footer-buttons-portal-target"/>

                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeletionReviewModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={() => setShowDeletionReviewModal(false)}/>

                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>Review Account Deletion Request</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {selectedDeletionRequest && (
                            <div className={"alumni-admin-review-details"}>
                                <p>
                                    <strong>Account:</strong> {selectedDeletionRequest.username}
                                    {' · '}<strong>Submitted:</strong> {selectedDeletionRequest.submittedAt}
                                    {' · '}<strong>Status:</strong> {selectedDeletionRequest.status}
                                </p>

                                <p><strong>Name:</strong> {selectedDeletionRequest.name}</p>
                                <p><strong>Email:</strong> {selectedDeletionRequest.email}</p>
                                <p><strong>Graduation Date:</strong> {selectedDeletionRequest.graduationDate || '—'}</p>
                                <p><strong>Reason given:</strong> {selectedDeletionRequest.reason || 'No reason was given'}</p>

                                {selectedDeletionRequest.status === 'pending' && (
                                    <p className={"alumni-inline-error-message"}>
                                        Approving this request permanently deletes the account &apos;{selectedDeletionRequest.username}&apos;,
                                        along with all of its posts, profile updates, passkeys, and uploaded files. This cannot be reversed.
                                    </p>
                                )}

                                {selectedDeletionRequest.status !== 'pending' && selectedDeletionRequest.adminNote && (
                                    <p><strong>Review Note:</strong> {selectedDeletionRequest.adminNote}</p>
                                )}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}

                        {selectedDeletionRequest && selectedDeletionRequest.status === 'pending' && modalFields
                            && showDeletionReviewModal && renderModalForm(
                                "Review Deletion Request Form", handleReviewDeletionRequest,
                                ['Save', 'Saving...'], () => setShowDeletionReviewModal(false), deletionFooterRef
                            )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowDeletionReviewModal(false)}>
                            {selectedDeletionRequest && selectedDeletionRequest.status === 'pending' ? 'Cancel' : 'Close'}
                        </button>
                        <div ref={deletionFooterRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animatePostReviewModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={() => setShowPostReviewModal(false)}/>

                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>Review Post</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {selectedPost && (
                            <div className={"alumni-admin-review-details"}>
                                <p>
                                    <strong>Author:</strong> {selectedPost.authorName} (@{selectedPost.authorUsername})
                                    {selectedPost.authorGraduationYear ? ` · Class of ${selectedPost.authorGraduationYear}` : ''}
                                </p>

                                <p>
                                    <strong>Status:</strong> {selectedPost.status}
                                    {' · '}<strong>Created:</strong> {selectedPost.createdAt}
                                    {selectedPost.reviewedAt ? <>{' · '}<strong>Reviewed:</strong> {selectedPost.reviewedAt}</> : null}
                                </p>

                                {selectedPost.pendingEdit ? (
                                    <>
                                        <p>
                                            <strong>This post has a pending edit</strong> (submitted {selectedPost.pendingEdit.submittedAt}).
                                            The proposed new version is shown below; approving it replaces the published version.
                                        </p>

                                        <p><strong>Proposed Title:</strong> {selectedPost.pendingEdit.newTitle}</p>

                                        <div className={"alumni-admin-post-preview"}>
                                            <MarkdownContent content={selectedPost.pendingEdit.newContent}/>
                                        </div>

                                        <p><strong>Currently Published Title:</strong> {selectedPost.title}</p>

                                        <div className={"alumni-admin-post-preview"}>
                                            <MarkdownContent content={selectedPost.content}/>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p><strong>Title:</strong> {selectedPost.title}</p>

                                        <div className={"alumni-admin-post-preview"}>
                                            <MarkdownContent content={selectedPost.content}/>
                                        </div>
                                    </>
                                )}

                                {selectedPost.adminNote && (
                                    <p><strong>Previous Note:</strong> {selectedPost.adminNote}</p>
                                )}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}

                        {selectedPost && (selectedPost.status === 'pending' || selectedPost.pendingEdit)
                            && modalFields && showPostReviewModal && renderModalForm(
                                "Review Post Form", handleReviewPost,
                                ['Save', 'Saving...'], () => setShowPostReviewModal(false), postFooterRef
                            )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowPostReviewModal(false)}>
                            {selectedPost && (selectedPost.status === 'pending' || selectedPost.pendingEdit)
                                ? 'Cancel' : 'Close'}
                        </button>
                        <div ref={postFooterRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animatePlacementModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={() => setShowPlacementModal(false)}/>

                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>Post Placement</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {selectedPost && (
                            <div className={"alumni-admin-review-details"}>
                                <p>
                                    <strong>Post:</strong> {selectedPost.title} by {selectedPost.authorName}
                                </p>

                                {selectedPost.status !== 'approved' && (
                                    <p className={"alumni-inline-error-message"}>
                                        This post is not approved yet, so it cannot be placed on any public page.
                                    </p>
                                )}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}

                        {selectedPost && modalFields && showPlacementModal && renderModalForm(
                            "Post Placement Form", handleSavePlacement,
                            ['Save Placement', 'Saving...'], () => setShowPlacementModal(false), placementFooterRef
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowPlacementModal(false)}>
                            Cancel
                        </button>
                        <div ref={placementFooterRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeletePostModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={() => setShowDeletePostModal(false)}/>

                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>Delete Post</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {selectedPost && (
                            <div className={"alumni-admin-review-details"}>
                                <p>
                                    Are you sure you want to permanently delete &quot;{selectedPost.title}&quot; by {selectedPost.authorName}?
                                    This cannot be reversed.
                                </p>

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}

                        {selectedPost && modalFields && showDeletePostModal && renderModalForm(
                            "Delete Post Form", handleDeletePost,
                            ['Delete', 'Deleting...'], () => setShowDeletePostModal(false), deletePostFooterRef
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowDeletePostModal(false)}>
                            Cancel
                        </button>
                        <div ref={deletePostFooterRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default AlumniStudentsManagement;