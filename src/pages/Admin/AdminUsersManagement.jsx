import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import {useEffect, useState, useRef} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {fetchAllAdminUsers, addAdminUser, editAdminUser, deleteAdminUser} from "../../services/Admin/AdminUsers/AdminUsersManagementServices.jsx";
import {adminUserManagementPermissionLevel, msgTimeout, jackOfAllTradesPermissionLevel} from "../../services/General/GeneralUtils.jsx"
import PropTypes from "prop-types";

function AdminUsersManagement({loggedInUserId, setRefreshCurrentUserData}) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [adminUsers, setAdminUsers] = useState(null);
    const [rowIndexToDelete, setRowIndexToDelete] = useState(null);
    const [showAddAdminUserModal, setShowAddAdminUserModal] = useState(false);
    const [showDeleteAdminUserModal, setShowDeleteAdminUserModal] = useState(false);
    const [showEditAdminUserModal, setShowEditAdminUserModal] = useState(false);
    const [availablePermissionsDict, setAvailablePermissionsDict] = useState(null);
    const [permissionsFieldHasBeenPopulated, setPermissionsFieldHasBeenPopulated] = useState(false);
    const [resetAddAdminUserModal, setResetAddAdminUserModal] = useState(false);
    const [resetEditAdminUserModal, setResetEditAdminUserModal] = useState(false);
    const [userToEditId, setUserToEditId] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const addAdminUserModalFooterButtonsRef = useRef(null);
    const editAdminUserModalFooterButtonsRef = useRef(null);


    const animateAddAdminUserModal = useSpring({
        opacity: (showAddAdminUserModal && permissionsFieldHasBeenPopulated) ? 1 : 0,
        transform: (showAddAdminUserModal && permissionsFieldHasBeenPopulated) ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateDeleteAdminUserModal = useSpring({
        opacity: showDeleteAdminUserModal ? 1 : 0,
        transform: showDeleteAdminUserModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateEditAdminUserModal = useSpring({
        opacity: showEditAdminUserModal ? 1 : 0,
        transform: showEditAdminUserModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const usernameFieldId = 2;
    const nameFieldId = 3;
    const emailFieldId = 4;
    const passwordFieldId = 5;
    const confirmPasswordFieldId = 6;
    const permissionsFieldId = 7;

    const [addAdminUserCoreFormFields, setAddAdminUserCoreFormFields] = useState( [
        {
            id: usernameFieldId,
            type: 'text',
            name: 'username',
            label: 'Username',
            required: true,
            placeholder: 'Username',
            errorMsg: 'Please enter username',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'username',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            displayLabel: 'Username',
        },
        {
            id: nameFieldId,
            type: 'text',
            name: 'name',
            label: 'Name',
            required: true,
            placeholder: 'Name',
            errorMsg: 'Please enter name',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'name',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            displayLabel: 'Name',
        },
        {
            id: emailFieldId,
            type: 'email',
            name: 'email',
            label: 'Email',
            required: true,
            placeholder: 'Email',
            errorMsg: 'Please enter email',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'email',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            displayLabel: 'Email',
        },
        {
            id: passwordFieldId,
            type: 'password',
            name: 'password',
            label: 'Password',
            required: true,
            placeholder: 'Password',
            errorMsg: 'Please enter password',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'password',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            displayLabel: 'Password',
        },
        {
            id: confirmPasswordFieldId,
            type: 'password',
            name: 'confirm-password',
            label: 'Confirm Password',
            required: true,
            placeholder: 'Confirm Password',
            errorMsg: 'Please confirm password',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'confirm-password',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            displayLabel: 'Confirm Password',
            mustMatchFieldWithId: passwordFieldId,
        },
        {
            id: permissionsFieldId
        }
    ]);

    const [editAdminUserCoreFormFields, setEditAdminUserCoreFormFields] = useState( null)

    const reloadTableData = async () => {
        await fetchAllAdminUsers(navigate, setAdminUsers, setAvailablePermissionsDict);
    }

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, adminUserManagementPermissionLevel, setIsLoading)
            .then(
                () => {
                    reloadTableData()
                }
            )
    }, []);

    useEffect(() => {
        if (availablePermissionsDict != null && !permissionsFieldHasBeenPopulated) {
            const availablePermissionsDictChoicesArray = Object.values(availablePermissionsDict).map(permission => permission.name)
            const adminUsersPermissionName = availablePermissionsDict[adminUserManagementPermissionLevel].name
            const aJackOfAllTradesPermissionName = availablePermissionsDict[jackOfAllTradesPermissionLevel].name;

            setAddAdminUserCoreFormFields(prevState => {
                const permissionsField = {
                    id: permissionsFieldId,
                    type: 'select',
                    name: 'permissions',
                    label: 'Permissions',
                    multiple: true,
                    required: true,
                    placeholder: 'Permissions',
                    errorMsg: 'Please select permissions',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                    httpName: 'permissions',
                    displayLabel: 'Permissions',
                    labelOutside: true,
                    labelOnTop: true,
                    large: true,
                    dontLetTheBrowserSaveField: true,
                    choices: availablePermissionsDictChoicesArray,
                    defaultValue: [],
                    autoSelect: {
                        [aJackOfAllTradesPermissionName]: availablePermissionsDictChoicesArray,
                        [adminUsersPermissionName]: [aJackOfAllTradesPermissionName],
                    }
                };

                const fieldExists = prevState.some(field => field.id === permissionsFieldId);

                if (fieldExists) {
                    return prevState.map(field =>
                        field.id === permissionsFieldId ? permissionsField : field
                    );
                } else {
                    return [...prevState, permissionsField];
                }
            });

            setPermissionsFieldHasBeenPopulated(true);
            setIsLoading(false);
        } else if (!permissionsFieldHasBeenPopulated) {
            setIsLoading(true);
        }
    }, [availablePermissionsDict, permissionsFieldId, permissionsFieldHasBeenPopulated]);

    const colIndexForAdminId = 0;
    const colIndexForAdminUsername = 1;
    const colIndexForAdminName = 2;
    const colIndexForAdminEmail = 3
    const colIndexForAdminPermissions = 4;

    const handleEditAdminUserModalInitialization = (rowIndex) => {
        if (adminUsers != null && adminUsers[rowIndex]) {
            const adminUserToEditId = adminUsers[rowIndex][colIndexForAdminId];
            const adminUserToEditUsername = adminUsers[rowIndex][colIndexForAdminUsername];
            const adminUserToEditName = adminUsers[rowIndex][colIndexForAdminName];
            const adminUserToEditEmail = adminUsers[rowIndex][colIndexForAdminEmail];
            const adminUserToEditPermissions = adminUsers[rowIndex][colIndexForAdminPermissions];

            const updatedAddAdminUserCoreFormFields = addAdminUserCoreFormFields.map(field => {
                const updatedField = { ...field };

                if (updatedField.id === usernameFieldId) {
                    updatedField.value = adminUserToEditUsername;
                } else if (updatedField.id === nameFieldId) {
                    updatedField.value = adminUserToEditName;
                } else if (updatedField.id === passwordFieldId) {
                    updatedField.displayLabel = "New Password (Leave blank if you don't want to change it)";
                    updatedField.required = false;
                    updatedField.value = '';
                } else if (updatedField.id === confirmPasswordFieldId) {
                    updatedField.displayLabel = "Confirm New Password (Leave blank if you don't want to change it)";
                    updatedField.required = false;
                    updatedField.value = '';
                } else if (updatedField.id === permissionsFieldId) {
                    updatedField.value = adminUserToEditPermissions;
                } else if (updatedField.id === emailFieldId) {
                    updatedField.value = adminUserToEditEmail;
                }

                return updatedField;
            });

            setEditAdminUserCoreFormFields(updatedAddAdminUserCoreFormFields);
            setUserToEditId(adminUserToEditId);
            setShowEditAdminUserModal(true);
        }
    }

    const cancelAddAdminUserModal = () => {
        setShowAddAdminUserModal(false);
        setResetAddAdminUserModal(true);
        setEditAdminUserCoreFormFields(null);
    }

    const handleAddAdminUser = async (formData) => {
        setIsLoading(true);

        try {

            const formDataJson = Object.fromEntries(formData.entries());
            const permissionNames = formDataJson[`field_${permissionsFieldId}`].split(',').map(name => name.trim());
            const idArray = permissionNames.map(name => {
                return Object.keys(availablePermissionsDict).find(id => availablePermissionsDict[id].name === name);
            });

            const formDataToSend = {
                "new_admin_username": formDataJson[`field_${usernameFieldId}`],
                "new_admin_name": formDataJson[`field_${nameFieldId}`],
                "new_admin_email": formDataJson[`field_${emailFieldId}`],
                "new_admin_password": formDataJson[`field_${passwordFieldId}`],
                "new_admin_confirm_password": formDataJson[`field_${confirmPasswordFieldId}`],
                "new_admin_permissions": idArray
            };

            const result = await addAdminUser(formDataToSend);

            if (result && result.success) {
                setShowAddAdminUserModal(false);
                await reloadTableData();
                setResetAddAdminUserModal(true);
                return true;
            } else {
                throw new Error(result.message || result);
            }

        } catch (error) {
            throw new Error(error.message || 'An error occurred while adding the admin user.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleEditAdminUserModal = async (formData) => {
        setIsLoading(true);

        try {
            const formDataJson = Object.fromEntries(formData.entries());
            const permissionNames = formDataJson[`field_${permissionsFieldId}`].split(',').map(name => name.trim());
            const idArray = permissionNames.map(name => {
                return Object.keys(availablePermissionsDict).find(id => availablePermissionsDict[id].name === name);
            });
            const adminToEditNewPassword = formDataJson[`field_${passwordFieldId}`];

            const formDataToSend = {
                "edit_admin_id": userToEditId,
                "edit_admin_username": formDataJson[`field_${usernameFieldId}`],
                "edit_admin_name": formDataJson[`field_${nameFieldId}`],
                "edit_admin_email": formDataJson[`field_${emailFieldId}`],
                "edit_admin_password": adminToEditNewPassword,
                "edit_admin_confirm_password": formDataJson[`field_${confirmPasswordFieldId}`],
                "edit_admin_permissions": idArray,
                "the_current_user_editing_id": loggedInUserId,
            };

            const editingTheCurrentUser = Number(userToEditId) === Number(loggedInUserId);
            const thisUserNoLongerHasPermissionToManageAdminUser = !idArray.includes(`${adminUserManagementPermissionLevel}`) ;
            const logOutAfterEdit = editingTheCurrentUser && ( (adminToEditNewPassword && adminToEditNewPassword !== '') || thisUserNoLongerHasPermissionToManageAdminUser);

            const result = await editAdminUser(formDataToSend, logOutAfterEdit, navigate);

            if (result && result.success) {
                if (editingTheCurrentUser) {
                    setRefreshCurrentUserData(true);
                }

                setShowEditAdminUserModal(false);
                setResetEditAdminUserModal(true);
                setUserToEditId(null);
                setEditAdminUserCoreFormFields(null);
                await reloadTableData();
                return true;
            } else {
                throw new Error(result.message || result);
            }

        } catch (error) {
            throw new Error(error.message || 'An error occurred while adding the admin user.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleDeleteAdminUser = async () => {
        if (rowIndexToDelete === null) {
            setDeleteError('Please select an admin to delete.');
            setTimeout(() => { setDeleteError(null); }, msgTimeout);
            return;
        }

        setIsLoading(true);
        setIsDeleting(true);

        const adminUserToDeleteId = adminUsers[rowIndexToDelete][colIndexForAdminId];

        try {
            const logoutOnDelete = Number(adminUserToDeleteId) === Number(loggedInUserId)
            const result = await deleteAdminUser(adminUserToDeleteId, logoutOnDelete, navigate);

            if (result && result.success) {
                setShowDeleteAdminUserModal(false);
                setRowIndexToDelete(null);
                await reloadTableData();
                return true;
            } else {
                throw new Error(result.message || result);
            }

        } catch (error) {
            setDeleteError(error.message || 'An error occurred while deleting the admin user.');
            setTimeout(() => { setDeleteError(null); }, msgTimeout);
        } finally {
            setIsLoading(false);
            setIsDeleting(false);
        }
    }
    const cancelEditAdminUserModal = () => {
        setShowEditAdminUserModal(false);
        setResetEditAdminUserModal(true);
    }

    const cancelDeleteAdminUserModal = () => {
        setShowDeleteAdminUserModal(false);
        setRowIndexToDelete(null);
    }

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"admin-users-management-page"}>

                <Table tableData={adminUsers}
                       scrollable={true}
                       compact={true}
                       allowHideColumns={true}
                       allowSticky={true}
                       forceEnglishTable={true}
                       defaultHiddenColumns={
                            [
                                'Permissions In Numbers'
                            ]
                       }
                       sortConfigParam={{column: 0, direction: 'descending'}}
                       filterableColumns={
                           [
                               'Permissions'
                           ]
                       }
                       headerModuleElements={[
                           (
                               <button key={3} onClick={() => {
                                   setShowAddAdminUserModal(true);
                               }}>
                                   Add User
                               </button>
                           ),
                           (
                               <button key={4} onClick={reloadTableData} disabled={isLoading}>
                                   {isLoading ? 'Loading...' : 'Reload Table Data'}
                               </button>
                           )
                       ]}
                       footerModuleElements={[]}
                       onDeleteEntry={(rowIndex) => {
                           setRowIndexToDelete(rowIndex);
                           setShowDeleteAdminUserModal(true);
                       }}
                       allowDeleteEntryOption={true}
                       columnsToWrap={[]}
                       allowEditEntryOption={true}
                       onEditEntryOption={(rowIndex) => {
                           handleEditAdminUserModalInitialization(rowIndex);
                       }}
                       isLoading={isLoading}
                />

            </div>

            <animated.div style={animateAddAdminUserModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={cancelAddAdminUserModal}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>
                            Add A New Admin User
                        </h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        { (showAddAdminUserModal && permissionsFieldHasBeenPopulated) && (
                            <Form fields={addAdminUserCoreFormFields}
                              mailTo={''}
                              sendPdf={false}
                              formTitle={"Add Admin User Modal Form"}
                              lang={"en"}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              resetFormFromParent={resetAddAdminUserModal}
                              setResetForFromParent={setResetAddAdminUserModal}
                              hasDifferentResetBehaviour={true}
                              differentResetBehaviour={() => {setPermissionsFieldHasBeenPopulated(false)}}
                              hasDifferentOnSubmitBehaviour={true}
                              differentOnSubmitBehaviour={handleAddAdminUser}
                              formInModalPopup={true}
                              setShowFormModalPopup={setShowAddAdminUserModal}
                              formHasPasswordField={true}
                              footerButtonsSpaceBetween={true}
                              switchFooterButtonsOrder={true}
                              forceEnglishForm={true}
                              noClearOption={true}
                              hasDifferentSubmitButtonText={true}
                              differentSubmitButtonText={['Add Admin User', 'Adding Admin User...']}
                              formFooterButtonsAreOutside={true}
                              footerButtonsPortalTarget={addAdminUserModalFooterButtonsRef}
                          />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-admin-user-modal-form-cancel-button"} onClick={cancelAddAdminUserModal}>
                            Cancel
                        </button>
                        <div ref={addAdminUserModalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateEditAdminUserModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={cancelEditAdminUserModal}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>
                            Edit Admin User
                        </h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        { (showEditAdminUserModal && editAdminUserCoreFormFields != null) && (
                            <Form fields={editAdminUserCoreFormFields}
                              mailTo={''}
                              sendPdf={false}
                              formTitle={"Edit Admin User Modal Form"}
                              lang={"en"}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              resetFormFromParent={resetEditAdminUserModal}
                              setResetForFromParent={setResetEditAdminUserModal}
                              hasDifferentOnSubmitBehaviour={true}
                              differentOnSubmitBehaviour={handleEditAdminUserModal}
                              formInModalPopup={true}
                              setShowFormModalPopup={setShowEditAdminUserModal}
                              formHasPasswordField={true}
                              footerButtonsSpaceBetween={true}
                              switchFooterButtonsOrder={true}
                              forceEnglishForm={true}
                              noClearOption={true}
                              hasDifferentSubmitButtonText={true}
                              differentSubmitButtonText={['Edit Admin User', 'Editing Admin User...']}
                              formFooterButtonsAreOutside={true}
                              footerButtonsPortalTarget={editAdminUserModalFooterButtonsRef}

                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"edit-admin-user-modal-form-cancel-button"} onClick={cancelEditAdminUserModal}>
                            Cancel
                        </button>
                        <div ref={editAdminUserModalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>

            </animated.div>

            <animated.div style={animateDeleteAdminUserModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={cancelDeleteAdminUserModal}/>
                <div className={"general-small-admin-action-modal-container"}>
                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>
                            Delete Admin User
                        </h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>
                        <p>
                            Are you sure you want to delete {adminUsers && adminUsers[rowIndexToDelete] && adminUsers[rowIndexToDelete][colIndexForAdminName]}? This action cannot be reversed.
                        </p>

                        {deleteError && (
                            <>
                                <br/>
                                <p>{deleteError}</p>
                            </>
                        )}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>
                        <button onClick={cancelDeleteAdminUserModal}>
                            Cancel
                        </button>

                        <button onClick={() => {
                            handleDeleteAdminUser();
                        }}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    )
}

AdminUsersManagement.propTypes = {
    loggedInUserId: PropTypes.number.isRequired,
    setRefreshCurrentUserData: PropTypes.func.isRequired,
}

export default AdminUsersManagement;