import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router";
import {useEffect, useMemo, useRef, useState} from "react";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx';
import Table from "../../modules/Table.jsx";
import TabsPage from "../../modules/TabsPage.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {msgTimeout, libraryManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";
import {
    fetchLibraryBooks,
    addLibraryBook,
    editLibraryBook,
    deleteLibraryBook
} from "../../services/Admin/Library/AdminLibraryServices.jsx";
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'
import {fetchImportDescriptor, importCsvFile} from "../../services/Admin/Imports/AdminImportServices.jsx";

const titleEnColIndex = 1;
const titleArColIndex = 2;
const seriesEnColIndex = 3;
const seriesArColIndex = 4;
const isPublicColIndex = 5;
const bookIdColIndex = 7;

const categoryFieldId = 1;
const titleEnFieldId = 2;
const titleArFieldId = 3;
const seriesEnFieldId = 4;
const seriesArFieldId = 5;
const isPublicFieldId = 6;

function LibraryManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useLoading(false);
    const [collections, setCollections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [importDescriptor, setImportDescriptor] = useState(null);

    const [showEditorModal, setShowEditorModal] = useState(false);
    const [resetEditorModal, setResetEditorModal] = useState(false);
    const [editorFields, setEditorFields] = useState(null);
    const [editorMode, setEditorMode] = useState('add');
    const [editorContext, setEditorContext] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteContext, setDeleteContext] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const editorModalFooterButtonsRef = useRef(null);

    const animateEditorModal = useSpring({
        opacity: showEditorModal ? 1 : 0,
        transform: showEditorModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateDeleteModal = useSpring({
        opacity: showDeleteModal ? 1 : 0,
        transform: showDeleteModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const reloadData = async () => {
        setIsLoading(true);
        await fetchLibraryBooks(navigate, setCollections, setCategories);
        setIsLoading(false);
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, libraryManagementPermissionLevel, setIsLoading)
            .then(() => {
                reloadData();
                fetchImportDescriptor(navigate, 'library').then(setImportDescriptor);
            });
    }, []);

    const categoryChoices = useMemo(
        () => categories.map((category) => `${category.collectionLabel} — ${category.label}`),
        [categories]
    );

    const categoryKeyForChoice = (choice) => {
        const match = categories.find((category) => `${category.collectionLabel} — ${category.label}` === choice);

        return match ? match.key : '';
    };

    const choiceForCategoryKey = (categoryKey) => {
        const match = categories.find((category) => category.key === categoryKey);

        return match ? `${match.collectionLabel} — ${match.label}` : '';
    };

    const buildFormFields = (categoryKey, rowData) => ([
        { id: categoryFieldId, type: 'select', name: 'category', label: 'Category', required: true, choices: categoryChoices, defaultValue: choiceForCategoryKey(categoryKey), value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Category', httpName: 'library-category' },
        { id: isPublicFieldId, type: 'select', name: 'is_public', label: 'Shown Publicly', required: true, choices: ['Yes', 'No'], defaultValue: rowData ? rowData[isPublicColIndex] : 'Yes', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Shown Publicly', httpName: 'library-is-public' },
        { id: titleEnFieldId, type: 'text', name: 'title_en', label: 'Title (EN)', required: true, errorMsg: 'Please enter the English title', value: '', defaultValue: rowData ? rowData[titleEnColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (EN)', httpName: 'library-title-en' },
        { id: titleArFieldId, type: 'text', name: 'title_ar', label: 'Title (AR)', required: true, errorMsg: 'Please enter the Arabic title', value: '', defaultValue: rowData ? rowData[titleArColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (AR)', lang: 'ar', httpName: 'library-title-ar' },
        { id: seriesEnFieldId, type: 'text', name: 'series_en', label: 'Series (EN)', required: false, value: '', defaultValue: rowData ? rowData[seriesEnColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Series or Distributor (EN)', httpName: 'library-series-en' },
        { id: seriesArFieldId, type: 'text', name: 'series_ar', label: 'Series (AR)', required: false, value: '', defaultValue: rowData ? rowData[seriesArColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Series or Distributor (AR)', lang: 'ar', httpName: 'library-series-ar' },
    ]);

    const openEditor = (mode, category, rowIndex) => {
        const rowData = mode === 'edit' ? category.books[rowIndex] : null;

        setEditorMode(mode);
        setEditorContext({ categoryKey: category.key, rowData });
        setEditorFields(buildFormFields(category.key, rowData));
        setShowEditorModal(true);
    };

    const closeEditor = () => {
        setShowEditorModal(false);
        setResetEditorModal(true);
        setEditorFields(null);
        setEditorContext(null);
    };

    const handleEditorSubmit = async (formData) => {
        setIsLoading(true);

        try {
            const values = Object.fromEntries(formData.entries());

            const payload = {
                category_key: categoryKeyForChoice(values[`field_${categoryFieldId}`]),
                title_en: values[`field_${titleEnFieldId}`],
                title_ar: values[`field_${titleArFieldId}`],
                series_en: values[`field_${seriesEnFieldId}`] || '',
                series_ar: values[`field_${seriesArFieldId}`] || '',
                is_public: values[`field_${isPublicFieldId}`],
            };

            if (editorMode === 'edit') {
                payload.book_id = Number(editorContext.rowData[bookIdColIndex]);
            }

            const result = editorMode === 'edit' ? await editLibraryBook(payload) : await addLibraryBook(payload);

            if (result && result.success) {
                closeEditor();
                await reloadData();
                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            throw new Error(error.message || 'An error occurred while saving the book.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteContext) {
            return;
        }

        setIsLoading(true);
        setIsDeleting(true);

        try {
            const result = await deleteLibraryBook(Number(deleteContext.rowData[bookIdColIndex]));

            if (result && result.success) {
                setShowDeleteModal(false);
                setDeleteContext(null);
                await reloadData();
                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            setDeleteError(error.message || 'An error occurred while deleting the book.');
            setTimeout(() => { setDeleteError(null); }, msgTimeout);
        } finally {
            setIsLoading(false);
            setIsDeleting(false);
        }
    };

    const renderCategoryTable = (category) => (
        <div className="admin-page-tab-content">
            <Table tableData={category.books}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   isLoading={isLoading}
                   defaultHiddenColumns={['Book ID']}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   filterableColumns={['Public']}
                   allowSearch={true}
                   searchPlaceholder={'Search this category'}
                   allowExport={true}
                   exportFileName={`library-${category.key}`}
                   importConfig={{
                       templateName: `library-${category.key}`,
                       descriptor: importDescriptor,
                       onImport: async (file) => {
                           const result = await importCsvFile('library', {category_key: category.key}, file);

                           if (result.imported > 0) {
                               await reloadData();
                           }

                           return result;
                       },
                   }}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => openEditor('edit', category, rowIndex)}
                   allowDeleteEntryOption={true}
                   onDeleteEntry={(rowIndex) => {
                       setDeleteContext({ rowData: category.books[rowIndex] });
                       setDeleteError(null);
                       setShowDeleteModal(true);
                   }}
                   headerModuleElements={[
                       (<button key={1} onClick={() => openEditor('add', category, null)}>Add Book</button>),
                       (<button key={2} onClick={reloadData} disabled={isLoading}>
                           {isLoading ? 'Loading...' : 'Reload Table Data'}
                       </button>),
                   ]}
                   footerModuleElements={[]}
            />
        </div>
    );


    const tabData = useMemo(() => collections.map((collection, index) => {
        const owned = categories.filter((category) => category.collection === collection.key);

        return {
            id: index,
            label: collection.label,
            element: (
                <TabsPage
                    tabData={owned.map((category, categoryIndex) => ({
                        id: categoryIndex,
                        label: category.label,
                        element: renderCategoryTable(category),
                    }))}
                    initialTab={0}
                    stickyOnDesktop={false}
                    pinnedInMobile={false}
                    stickUnderParentBarInMobile={true}
                    stickUnderParentBarOnDesktop={false}
                    title={`Library Management ${collection.key}`}
                />
            ),
        };
    }), [collections, categories, isLoading]);

    return (
        <>

            <div className={"library-management-page"}>
                {collections.length > 0 && (
                    <TabsPage tabData={tabData} initialTab={0} stickyOnDesktop={false} title={"Library Management"}/>
                )}
            </div>

            <animated.div style={animateEditorModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={closeEditor}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>{editorMode === 'edit' ? 'Edit Book' : 'Add Book'}</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>

                        {(showEditorModal && editorFields != null) && (
                            <Form fields={editorFields}
                                  mailTo={''}
                                  sendPdf={false}
                                  formTitle={"Library Modal Form"}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  resetFormFromParent={resetEditorModal}
                                  setResetForFromParent={setResetEditorModal}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleEditorSubmit}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={setShowEditorModal}
                                  formHasPasswordField={false}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  forceEnglishForm={true}
                                  noClearOption={true}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={['Save Changes', 'Saving...']}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={editorModalFooterButtonsRef}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-admin-user-modal-form-cancel-button"} onClick={closeEditor}>
                            Cancel
                        </button>
                        <div ref={editorModalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeleteModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={() => setShowDeleteModal(false)}/>
                <div className={"general-small-admin-action-modal-container"}>
                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>Delete Book</h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>
                        <p>
                            Are you sure you want to delete {deleteContext && deleteContext.rowData[titleEnColIndex]}?
                            This action cannot be reversed.
                        </p>

                        {deleteError && (
                            <>
                                <br/>
                                <p>{deleteError}</p>
                            </>
                        )}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>
                        <button onClick={() => { setShowDeleteModal(false); setDeleteContext(null); }}>
                            Cancel
                        </button>

                        <button onClick={handleDelete}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default LibraryManagement;
