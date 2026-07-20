import '../../styles/AdminDashboard.css';
import '../../styles/AlumniStudents.css';
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Table from "../../modules/Table.jsx";
import TabsPage from "../../modules/TabsPage.jsx";
import MarkdownContent from "../../modules/MarkdownContent.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {alumniStudentsManagementPermissionLevel, msgTimeout} from "../../services/General/GeneralUtils.jsx";
import {
    fetchAllAlumniAccounts,
    fetchAllAlumniPosts,
    setAlumniAccountStatus,
    reviewAlumniProfileUpdate,
    deleteAlumniAccount,
    reviewAlumniPost,
    setAlumniPostPlacement,
    deleteAlumniPostByAdmin,
} from "../../services/Admin/AlumniStudents/AdminAlumniStudentsManagementServices.jsx";

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
    const [isLoading, setIsLoading] = useState(false);

    const [accountsData, setAccountsData] = useState(null);
    const [accountRecordsById, setAccountRecordsById] = useState({});
    const [updatesData, setUpdatesData] = useState(null);
    const [updateRecordsById, setUpdateRecordsById] = useState({});
    const [postsData, setPostsData] = useState(null);
    const [postRecordsById, setPostRecordsById] = useState({});

    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedUpdate, setSelectedUpdate] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);

    const [showAccountReviewModal, setShowAccountReviewModal] = useState(false);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [showUpdateReviewModal, setShowUpdateReviewModal] = useState(false);
    const [showPostReviewModal, setShowPostReviewModal] = useState(false);
    const [showPlacementModal, setShowPlacementModal] = useState(false);
    const [showDeletePostModal, setShowDeletePostModal] = useState(false);

    const [adminNote, setAdminNote] = useState('');
    const [placementHome, setPlacementHome] = useState('no');
    const [placementAlumniPage, setPlacementAlumniPage] = useState('no');
    const [notifyAuthorOnDelete, setNotifyAuthorOnDelete] = useState(true);
    const [modalBusy, setModalBusy] = useState(false);
    const [modalError, setModalError] = useState('');

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
        await fetchAllAlumniAccounts(navigate, setAccountsData, setAccountRecordsById, setUpdatesData, setUpdateRecordsById);
        setIsLoading(false);
    };

    const reloadPostsData = async () => {
        setIsLoading(true);
        await fetchAllAlumniPosts(navigate, setPostsData, setPostRecordsById);
        setIsLoading(false);
    };

    const reloadEverything = async () => {
        setIsLoading(true);
        await fetchAllAlumniAccounts(navigate, setAccountsData, setAccountRecordsById, setUpdatesData, setUpdateRecordsById);
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
        window.open(url, '_blank');
    };

    const finishModalAction = async (result, closeModal, reloadFn) => {
        setModalBusy(false);

        if (result && result.success) {
            closeModal();
            await reloadFn();
        } else {
            setModalError((result && result.message) || 'The action could not be completed.');
        }
    };

    const openAccountReviewModal = (rowIndex) => {
        if (!accountsData || !accountsData[rowIndex]) { return; }
        const accountId = accountsData[rowIndex][0];
        const record = accountRecordsById[String(accountId)];

        if (!record) { return; }

        setSelectedAccount(record);
        setAdminNote('');
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

    const handleSetAccountStatus = async (newStatus) => {
        if (!selectedAccount || modalBusy) { return; }

        setModalBusy(true);
        setModalError('');
        const result = await setAlumniAccountStatus(selectedAccount.id, newStatus, adminNote);
        await finishModalAction(result, () => setShowAccountReviewModal(false), reloadAccountsData);
    };

    const handleDeleteAccount = async () => {
        if (!selectedAccount || modalBusy) { return; }

        setModalBusy(true);
        setModalError('');
        const result = await deleteAlumniAccount(selectedAccount.id);
        await finishModalAction(result, () => setShowDeleteAccountModal(false), reloadEverything);
    };

    const openUpdateReviewModal = (rowIndex) => {
        if (!updatesData || !updatesData[rowIndex]) { return; }
        const updateId = updatesData[rowIndex][0];
        const record = updateRecordsById[String(updateId)];

        if (!record) { return; }

        setSelectedUpdate(record);
        setAdminNote('');
        setModalError('');
        setShowUpdateReviewModal(true);
    };

    const handleReviewProfileUpdate = async (decision) => {
        if (!selectedUpdate || modalBusy) { return; }

        setModalBusy(true);
        setModalError('');
        const result = await reviewAlumniProfileUpdate(selectedUpdate.id, decision, adminNote);
        await finishModalAction(result, () => setShowUpdateReviewModal(false), reloadAccountsData);
    };

    const openPostReviewModal = (rowIndex) => {
        if (!postsData || !postsData[rowIndex]) { return; }
        const postId = postsData[rowIndex][0];
        const record = postRecordsById[String(postId)];

        if (!record) { return; }

        setSelectedPost(record);
        setAdminNote('');
        setModalError('');
        setShowPostReviewModal(true);
    };

    const openPlacementModal = (rowIndex) => {
        if (!postsData || !postsData[rowIndex]) { return; }
        const postId = postsData[rowIndex][0];
        const record = postRecordsById[String(postId)];

        if (!record) { return; }

        setSelectedPost(record);
        setPlacementHome(record.showOnHome ? 'yes' : 'no');
        setPlacementAlumniPage(record.showOnAlumniPage ? 'yes' : 'no');
        setModalError('');
        setShowPlacementModal(true);
    };

    const openDeletePostModal = (rowIndex) => {
        if (!postsData || !postsData[rowIndex]) { return; }
        const postId = postsData[rowIndex][0];
        const record = postRecordsById[String(postId)];

        if (!record) { return; }

        setSelectedPost(record);
        setNotifyAuthorOnDelete(true);
        setAdminNote('');
        setModalError('');
        setShowDeletePostModal(true);
    };

    const handleReviewPost = async (target, decision) => {
        if (!selectedPost || modalBusy) { return; }

        setModalBusy(true);
        setModalError('');
        const result = await reviewAlumniPost(selectedPost.id, target, decision, adminNote);
        await finishModalAction(result, () => setShowPostReviewModal(false), reloadPostsData);
    };

    const handleSavePlacement = async () => {
        if (!selectedPost || modalBusy) { return; }

        setModalBusy(true);
        setModalError('');
        const result = await setAlumniPostPlacement(selectedPost.id, placementHome === 'yes', placementAlumniPage === 'yes');
        await finishModalAction(result, () => setShowPlacementModal(false), reloadPostsData);
    };

    const handleDeletePost = async () => {
        if (!selectedPost || modalBusy) { return; }

        setModalBusy(true);
        setModalError('');
        const result = await deleteAlumniPostByAdmin(selectedPost.id, notifyAuthorOnDelete, adminNote);
        await finishModalAction(result, () => setShowDeletePostModal(false), reloadPostsData);
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
                   filterableColumns={['Status', 'Pending Update']}
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
            label: 'Posts',
            component: PostsTab
        },
    ];

    const renderNoteField = (labelText) => (
        <label className={"alumni-admin-note-field"}>
            {labelText}
            <textarea
                value={adminNote}
                className="textarea-form-field"
                maxLength={500}
                placeholder={"Optional note that is included in the email sent to the alumni student"}
                onChange={(e) => setAdminNote(e.target.value)}
            />
        </label>
    );

    return (
        <>
            {isLoading && <Spinner/>}

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

                                {renderNoteField('Note to the alumni student (optional)')}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowAccountReviewModal(false)} disabled={modalBusy}>
                            Close
                        </button>

                        {selectedAccount && selectedAccount.accountStatus !== 'approved' && (
                            <button onClick={() => handleSetAccountStatus('approved')} disabled={modalBusy}>
                                {selectedAccount.accountStatus === 'disabled' ? 'Enable Account' : 'Approve'}
                            </button>
                        )}

                        {selectedAccount && selectedAccount.accountStatus === 'pending' && (
                            <button onClick={() => handleSetAccountStatus('rejected')} disabled={modalBusy}>
                                Reject
                            </button>
                        )}

                        {selectedAccount && selectedAccount.accountStatus === 'approved' && (
                            <button onClick={() => handleSetAccountStatus('disabled')} disabled={modalBusy}>
                                Disable Account
                            </button>
                        )}
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

                                <table className={"alumni-admin-diff-table"}>
                                    <thead>
                                        <tr>
                                            <th>Field</th>
                                            <th>Current</th>
                                            <th>Requested</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PROFILE_UPDATE_FIELDS.map(field => {
                                            const requestedValue = selectedUpdate.requested[field.key];
                                            const currentValue = selectedUpdate.current[field.key];
                                            const changed = requestedValue !== null && requestedValue !== undefined;

                                            return (
                                                <tr key={field.key} className={changed ? 'alumni-admin-diff-changed' : ''}>
                                                    <td>{field.label}</td>
                                                    <td>
                                                        {field.key === 'profilePictureLink' ? (
                                                            currentValue ? (
                                                                <button className={"alumni-admin-review-link"} onClick={() => openAlumniFile(currentValue)}>
                                                                    View current picture
                                                                </button>
                                                            ) : '—'
                                                        ) : (currentValue || '—')}
                                                    </td>
                                                    <td>
                                                        {changed ? (
                                                            field.key === 'profilePictureLink' ? (
                                                                <button className={"alumni-admin-review-link"} onClick={() => openAlumniFile(requestedValue)}>
                                                                    View requested picture
                                                                </button>
                                                            ) : requestedValue
                                                        ) : 'No change'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {selectedUpdate.status === 'pending'
                                    ? renderNoteField('Note to the alumni student (optional)')
                                    : selectedUpdate.adminNote && (
                                        <p><strong>Review Note:</strong> {selectedUpdate.adminNote}</p>
                                    )}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowUpdateReviewModal(false)} disabled={modalBusy}>
                            Close
                        </button>

                        {selectedUpdate && selectedUpdate.status === 'pending' && (
                            <>
                                <button onClick={() => handleReviewProfileUpdate('rejected')} disabled={modalBusy}>
                                    Reject
                                </button>

                                <button onClick={() => handleReviewProfileUpdate('approved')} disabled={modalBusy}>
                                    Approve &amp; Apply
                                </button>
                            </>
                        )}
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

                                {(selectedPost.status === 'pending' || selectedPost.pendingEdit) &&
                                    renderNoteField('Note to the alumni student (optional)')}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowPostReviewModal(false)} disabled={modalBusy}>
                            Close
                        </button>

                        {selectedPost && selectedPost.pendingEdit && (
                            <>
                                <button onClick={() => handleReviewPost('edit', 'rejected')} disabled={modalBusy}>
                                    Reject Edit
                                </button>

                                <button onClick={() => handleReviewPost('edit', 'approved')} disabled={modalBusy}>
                                    Approve Edit
                                </button>
                            </>
                        )}

                        {selectedPost && !selectedPost.pendingEdit && selectedPost.status === 'pending' && (
                            <>
                                <button onClick={() => handleReviewPost('post', 'rejected')} disabled={modalBusy}>
                                    Reject
                                </button>

                                <button onClick={() => handleReviewPost('post', 'approved')} disabled={modalBusy}>
                                    Approve
                                </button>
                            </>
                        )}
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

                                <div className={"alumni-admin-placement-selects"}>
                                    <label className={"form-label-outside"}>
                                        Show on the home page?
                                        <select className={"select-form-field field-with-label-on-top"} value={placementHome} onChange={(e) => setPlacementHome(e.target.value)}>
                                            <option value="no">No</option>
                                            <option value="yes">Yes</option>
                                        </select>
                                    </label>

                                    <label className={"form-label-outside"}>
                                        Show on the alumni students page?
                                        <select className={"select-form-field field-with-label-on-top"} value={placementAlumniPage} onChange={(e) => setPlacementAlumniPage(e.target.value)}>
                                            <option value="no">No</option>
                                            <option value="yes">Yes</option>
                                        </select>
                                    </label>
                                </div>

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowPlacementModal(false)} disabled={modalBusy}>
                            Cancel
                        </button>

                        <button onClick={handleSavePlacement} disabled={modalBusy}>
                            {modalBusy ? 'Saving...' : 'Save Placement'}
                        </button>
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

                                <div className={"alumni-admin-actions-row"}>
                                    <label className={"alumni-admin-note-field"} style={{flexDirection: 'row', alignItems: 'center', gap: '0.5rem'}}>
                                        <input
                                            type="checkbox"
                                            checked={notifyAuthorOnDelete}
                                            onChange={(e) => setNotifyAuthorOnDelete(e.target.checked)}
                                        />
                                        Notify the author by email
                                    </label>
                                </div>

                                {notifyAuthorOnDelete && renderNoteField('Note to the alumni student (optional)')}

                                {modalError && <p className={"alumni-inline-error-message"}>{modalError}</p>}
                            </div>
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={() => setShowDeletePostModal(false)} disabled={modalBusy}>
                            Cancel
                        </button>

                        <button onClick={handleDeletePost} disabled={modalBusy}>
                            {modalBusy ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default AlumniStudentsManagement;
