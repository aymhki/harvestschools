import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router";
import {Capacitor} from '@capacitor/core';
import {useEffect, useMemo, useRef, useState} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx';
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {pageGatesManagementPermissionLevel, isDevelopment} from "../../services/General/GeneralUtils.jsx";
import {
    fetchPageGatesForAdmin,
    updatePageGate
} from "../../services/Admin/PageGates/AdminPageGatesServices.jsx";

const STATUS_CHOICES = ['On', 'Off'];

const statusChoiceOf = (isEnabled) => (isEnabled ? STATUS_CHOICES[0] : STATUS_CHOICES[1]);
const statusValueOf = (choice) => choice === STATUS_CHOICES[0];

const sectionColIndex = 0;
const pageIdColIndex = 5;

const statusFieldId = 1;
const messageEnFieldId = 2;
const messageArFieldId = 3;

function PageGatesManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [pages, setPages] = useState([]);

    const [showEditorModal, setShowEditorModal] = useState(false);
    const [resetEditorModal, setResetEditorModal] = useState(false);
    const [editorFields, setEditorFields] = useState(null);
    const [editorContext, setEditorContext] = useState(null);

    const editorModalFooterButtonsRef = useRef(null);

    const animateEditorModal = useSpring({
        opacity: showEditorModal ? 1 : 0,
        transform: showEditorModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const reloadData = async () => {
        setIsLoading(true);
        await fetchPageGatesForAdmin(navigate, setPages);
        setIsLoading(false);
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, pageGatesManagementPermissionLevel, setIsLoading)
            .then(() => {
                reloadData();
            });
    }, []);

    const tableData = useMemo(() => ([
        ['Section', 'Page', 'Path', 'Status', 'Last Changed', 'Page ID'],
        ...pages.map((page) => ([
            page.section,
            page.title,
            page.path,
            statusChoiceOf(page.isEnabled),
            page.updatedAt || '',
            page.pageId,
        ])),
    ]), [pages]);

    const buildFormFields = (page) => ([
        { id: statusFieldId, type: 'select', name: 'status', label: 'Status', required: true, choices: STATUS_CHOICES, defaultValue: statusChoiceOf(page.isEnabled), value: '', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Status', httpName: 'page-gate-status' },
        { id: messageEnFieldId, type: 'textarea', name: 'message_en', label: 'Message (EN)', required: false, value: '', defaultValue: page.messageEn || '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Message while off (EN)', httpName: 'page-gate-message-en' },
        { id: messageArFieldId, type: 'textarea', name: 'message_ar', label: 'Message (AR)', required: false, value: '', defaultValue: page.messageAr || '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Message while off (AR)', lang: 'ar', httpName: 'page-gate-message-ar' },
    ]);


    const openPublicPage = (path) => {
        if (Capacitor.isNativePlatform()) {
            navigate(path);
            return;
        }

        const mainSite = isDevelopment() ? 'http://localhost:5173' : 'https://harvestschools.com';

        window.open(`${mainSite}${path}`, '_blank');
    };


    const openEditor = (rowIndex) => {
        const row = tableData[rowIndex];
        const page = row ? pages.find((candidate) => candidate.pageId === row[pageIdColIndex]) : null;

        if (!page) {
            return;
        }

        setEditorContext(page);
        setEditorFields(buildFormFields(page));
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

            const result = await updatePageGate({
                page_id: editorContext.pageId,
                is_enabled: statusValueOf(values[`field_${statusFieldId}`]),
                message_en: values[`field_${messageEnFieldId}`] || '',
                message_ar: values[`field_${messageArFieldId}`] || '',
            });

            if (result && result.success) {
                closeEditor();
                await reloadData();
                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            throw new Error(error.message || 'An error occurred while saving the page.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"page-gates-management-page"}>
                <Table tableData={tableData}
                       scrollable={true}
                       compact={true}
                       allowHideColumns={true}
                       allowSticky={true}
                       forceEnglishTable={true}
                       isLoading={isLoading}
                       defaultHiddenColumns={['Page ID']}
                       sortConfigParam={{column: sectionColIndex, direction: 'ascending'}}
                       filterableColumns={['Section', 'Status']}
                       likelyUrlColumns={{'Path': openPublicPage}}
                       allowEditEntryOption={true}
                       onEditEntryOption={openEditor}
                       allowDeleteEntryOption={false}
                       headerModuleElements={[
                           (<button key={1} onClick={reloadData} disabled={isLoading}>
                               {isLoading ? 'Loading...' : 'Reload Table Data'}
                           </button>),
                       ]}
                       footerModuleElements={[]}
                />
            </div>

            <animated.div style={animateEditorModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={closeEditor}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>{editorContext ? editorContext.title : 'Page'}</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {(showEditorModal && editorFields != null) && (
                            <>
                                <p>
                                    While this page is off, visitors still reach {editorContext.path} and
                                    see its heading, with the message below in place of the content. Leave a
                                    message empty to use the standard under construction wording.
                                </p>

                                <Form fields={editorFields}
                                      mailTo={''}
                                      sendPdf={false}
                                      formTitle={"Page Gate Modal Form"}
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
                            </>
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
        </>
    );
}

export default PageGatesManagement;
