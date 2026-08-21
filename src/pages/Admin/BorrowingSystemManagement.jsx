import '../../styles/AdminDashboard.css';
import {useNavigate, useSearchParams} from "react-router";
import {useEffect, useMemo, useRef, useState} from "react";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx';
import Table from "../../modules/Table.jsx";
import TabsPage from "../../modules/TabsPage.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {msgTimeout, anyBorrowingSystemPermissionLevels} from "../../services/General/GeneralUtils.jsx";
import {
    fetchBorrowingSystem,
    fetchEmployeeScore,
    recordEligibilityInputs,
    submitBorrowingApplication,
    reviewBorrowingApplication,
    submitBorrowingDelayRequest,
    reviewBorrowingDelayRequest,
    recordBorrowingPayment,
    reviewBorrowingEditRequest,
    updateBorrowingConfig
} from "../../services/Admin/BorrowingSystem/AdminBorrowingSystemServices.jsx";
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'

const applicationIdColIndex = 13;
const delayRequestIdColIndex = 11;
const ledgerApplicationIdColIndex = 10;
const editRequestIdColIndex = 8;
const settingKeyColIndex = 5;
const settingValueColIndex = 1;
const settingOptionsColIndex = 2;
const matrixScoreMinColIndex = 12;
const matrixGradeColIndex = 1;
const bandKeyColIndex = 5;
const bandThresholdColIndex = 2;
const bandScoreColIndex = 3;
const bandLabelColIndex = 4;
const capabilityKeyColIndex = 4;
const emailEventKeyColIndex = 5;

const employeeFieldId = 1;
const attendanceFieldId = 3;
const amountFieldId = 4;
const installmentsFieldId = 5;
const firstMonthFieldId = 6;
const reasonFieldId = 7;
const emailFieldId = 9;
const commitmentFieldId = 10;
const eligibilitySalaryFieldId = 11;
const eligibilityHireDateFieldId = 12;


const settingValueFieldId = 21;
const settingApplyToFieldId = 22;

const matrixGradeFieldId = 31;
const matrixMultiplierFieldIds = [32, 33, 34, 35, 36];
const matrixFlatFieldIds = [37, 38, 39, 40, 41];

const bandThresholdFieldId = 51;
const bandScoreFieldId = 52;
const bandLabelFieldId = 53;

const capabilityHrFieldId = 61;
const capabilityAccountingFieldId = 62;
const capabilityBoardFieldId = 63;

const emailEmployeeFieldId = 71;
const emailHrFieldId = 72;
const emailAccountingFieldId = 73;
const emailBoardFieldId = 74;

const installmentReasonFieldId = 111;

const detailDecisionFieldId = 101;
const detailNoteFieldId = 102;

const APPROVE_AS_REQUESTED = 'Approve as requested';
const APPROVE_WITH_CHANGES = 'Approve with changes';
const REJECT = 'Reject';

const detailDecisionField = (choices) => ({
    id: detailDecisionFieldId, type: 'select', name: 'decision', httpName: 'decision',
    label: 'Decision', displayLabel: 'Decision', required: true,
    errorMsg: 'Choose what to do with this request', value: '', choices: choices,
    widthOfField: 1, labelOutside: true, labelOnTop: true,
});

const detailNoteField = (displayLabel, required) => ({
    id: detailNoteFieldId, type: 'textarea', name: 'note', httpName: 'note',
    label: 'Note', displayLabel: displayLabel, required: !!required,
    errorMsg: 'A written reason is required', value: '',
    widthOfField: 1, labelOutside: true, labelOnTop: true,
});

const planAmountFieldId = 81;
const planFirstMonthFieldId = 82;
const planReasonFieldId = 83;
const planSectionId = 90;
const planRowAmountFieldId = 91;

const moneyRegex = '^[0-9]{1,9}([.][0-9]{1,2})?$';

const delayEffectWording = {
    append: 'The month moves to the end of the schedule as a new instalment of the same amount, so the balance is unchanged.',
    spread: 'The month is divided over the instalments still to run, so the balance is unchanged.',
    forgive: 'The month is written off, so the balance drops by that amount.',
};

const formatMoney = (value) => Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const addMonths = (isoDate, months) => {
    const [year, month] = String(isoDate).split('-').map(Number);
    const shifted = new Date(year, (month - 1) + months, 1);

    return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-01`;
};

const firstOfNextMonth = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
};

function BorrowingSystemManagement() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useLoading(false);

    const [data, setData] = useState(null);
    const [scoreData, setScoreData] = useState(null);
    const [scoreError, setScoreError] = useState('');
    const [selectedEmployeeLabel, setSelectedEmployeeLabel] = useState('');

    const [modalKind, setModalKind] = useState(null);
    const [modalFields, setModalFields] = useState(null);
    const [modalDynamicSections, setModalDynamicSections] = useState(null);
    const [modalContext, setModalContext] = useState(null);
    const [resetModal, setResetModal] = useState(false);
    const [modalBusy, setModalBusy] = useState(false);
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');

    const [detailFormFields, setDetailFormFields] = useState(null);
    const [resetDetailForm, setResetDetailForm] = useState(false);
    const [pendingOverLimit, setPendingOverLimit] = useState(null);

    const modalFooterButtonsRef = useRef(null);
    const detailFooterButtonsRef = useRef(null);
    const modalMessageRef = useRef(null);

    const openTab = searchParams.get('tab') || '';

    const animateFormModal = useSpring({
        opacity: (modalKind && modalFields) ? 1 : 0,
        transform: (modalKind && modalFields) ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: (modalKind && modalFields) ? 'auto' : 'none',
    });

    const animateOverLimitModal = useSpring({
        opacity: pendingOverLimit ? 1 : 0,
        transform: pendingOverLimit ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: pendingOverLimit ? 'auto' : 'none',
    });

    const animateDetailModal = useSpring({
        opacity: (modalKind && !modalFields) ? 1 : 0,
        transform: (modalKind && !modalFields) ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: (modalKind && !modalFields) ? 'auto' : 'none',
    });

    const reloadData = async (options = {}) => {
        setIsLoading(true);
        const next = await fetchBorrowingSystem(navigate, options);

        if (next) {
            setData(next);
        }

        setIsLoading(false);

        return next;
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, anyBorrowingSystemPermissionLevels, setIsLoading)
            .then(() => {
                reloadData();
            });
    }, []);

    const can = (capability) => !!(data && data.capabilities && data.capabilities[capability]);
    const manualLedgerAllowed = !!(data && data.repaymentMode !== 'auto');
    const canRecord = () => can('record_payment') && manualLedgerAllowed;
    const canCorrect = () => can('correct_payment') && manualLedgerAllowed;

    const employeeCodeForLabel = (label) => {
        const entry = data && data.employeeIndex ? data.employeeIndex[label] : null;

        return entry ? entry.code : '';
    };

    const closeModal = () => {
        setModalKind(null);
        setModalFields(null);
        setModalDynamicSections(null);
        setDetailFormFields(null);
        setResetDetailForm(true);
        setModalContext(null);
        setModalError('');
        setModalSuccess('');
        setModalBusy(false);
        setResetModal(true);
    };


    const revealModalMessage = () => {
        setTimeout(() => {
            const message = modalMessageRef.current;
            const body    = message && message.closest('.general-large-admin-action-modal-content');

            if (!message || !body) {
                return;
            }

            const offset = message.offsetTop - (body.clientHeight / 2) + (message.offsetHeight / 2);

            body.scrollTo({top: Math.max(0, offset), behavior: 'smooth'});
        }, 0);
    };

    const succeedModal = (message) => {
        setModalError('');
        setModalSuccess(message);
        setModalBusy(false);
        revealModalMessage();
        setTimeout(() => setModalSuccess(''), msgTimeout);
    };

    const loadScore = async (label, attendance, salary = '', hireDate = '') => {
        setSelectedEmployeeLabel(label);
        setScoreData(null);
        setScoreError('');

        const code = employeeCodeForLabel(label);

        if (!code) {
            return;
        }

        setIsLoading(true);

        if (attendance || salary || hireDate) {
            const recorded = await recordEligibilityInputs({
                employee_code: code,
                attendance_band: attendance && data.attendanceMode === 'bands' ? attendance : '',
                attendance_days: attendance && data.attendanceMode === 'exact_days' ? attendance : '',
                basic_salary: salary,
                hire_date: hireDate,
            });

            if (recorded && !recorded.success) {
                setIsLoading(false);
                setScoreError(typeof recorded === 'string' ? recorded : recorded.message);
                return;
            }
        }

        const result = await fetchEmployeeScore(code);
        setIsLoading(false);

        if (!result) {
            setScoreError('The score could not be loaded.');
            return;
        }

        if (result.error) {
            setScoreError(result.error);
            return;
        }

        setScoreData(result);
    };

    const employeePickerFields = useMemo(() => {
        const fields = [
            {
                id: employeeFieldId,
                type: 'search-select',
                name: 'employee',
                httpName: 'employee',
                label: 'Employee',
                displayLabel: 'Employee',
                placeholder: 'Type a name or an employee ID',
                required: true,
                errorMsg: 'Choose an employee',
                value: '',
                widthOfField: 1,
                labelOutside: true,
                labelOnTop: true,
                alwaysEnglish: true,
                choices: (data && data.employeeChoices) || [],
            },
        ];

        const askHere = data && data.attendanceCapture === 'eligibility_form';

        if (askHere && data.attendanceMode === 'bands') {
            fields.push({
                id: attendanceFieldId, type: 'select', name: 'attendance', httpName: 'attendance',
                label: 'Days Absent', displayLabel: `Days absent in ${data.contractYearLabel}`,
                required: true, errorMsg: 'Choose how many days this employee has been absent', value: '',
                choices: data.attendanceChoices,
                widthOfField: 1, labelOutside: true, labelOnTop: true,
            });
        } else if (askHere && data.attendanceMode === 'exact_days') {
            fields.push({
                id: attendanceFieldId, type: 'number', name: 'attendance_days', httpName: 'attendance-days',
                label: 'Days Absent', displayLabel: `Days absent in ${data.contractYearLabel}`,
                required: true, errorMsg: 'Enter how many days this employee has been absent', value: '',
                minimumValue: 0, maximumValue: 400,
                widthOfField: 1, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            });
        }

        if (data && data.hireDateCapture === 'eligibility_form') {
            fields.push({
                id: eligibilityHireDateFieldId, type: 'date', name: 'hire_date', httpName: 'hire-date',
                label: 'Hire Date', displayLabel: 'Hire date, leave blank to use the stored one',
                required: false, value: '',
                widthOfField: 1, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            });
        }

        if (data && data.salaryCapture === 'eligibility_form') {
            fields.push({
                id: eligibilitySalaryFieldId, type: 'text', name: 'basic_salary', httpName: 'basic-salary',
                label: 'Basic Salary',
                displayLabel: 'Basic salary in EGP, leave blank to use the stored one',
                required: false, errorMsg: 'Enter the salary as a number, for example 5000 or 5000.50',
                regex: moneyRegex, value: '',
                widthOfField: 1, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            });
        }

        return fields;
    }, [data]);

    const renderScorePanel = () => {
        if (scoreError !== '') {
            return <p className={"admin-inline-error-message"}>{scoreError}</p>;
        }

        if (!scoreData) {
            return null;
        }

        const factors = ['commitment', 'attendance', 'years'];
        const factorTitles = {
            commitment: 'Repayment commitment',
            attendance: 'Attendance',
            years: 'Years of service',
        };

        return (
            <div className={"borrowing-score-panel"}>
                <div className={"borrowing-score-headline"}>
                    <h3>{scoreData.scoreable ? scoreData.score : '—'}</h3>
                    <span>out of 100</span>
                    {scoreData.scoreable && scoreData.grade && (
                        <span className={"borrowing-score-grade"}>{scoreData.grade}</span>
                    )}
                    {!scoreData.scoringOn && (
                        <span>Scoring is switched off, so every employee passes the score gate</span>
                    )}
                </div>

                <div className={"borrowing-score-factors"}>
                    {factors.map((key) => {
                        const factor = scoreData.factors[key];
                        const percent = factor.max > 0 ? Math.round((factor.points / factor.max) * 100) : 0;

                        return (
                            <div key={key} className={"borrowing-score-factor"}>
                                <span className={"borrowing-score-factor-name"}>{factorTitles[key]}</span>
                                <span className={"borrowing-score-factor-value"}>
                                    {factor.recorded === false ? 'Not recorded' : `${factor.points} / ${factor.max}`}
                                </span>
                                {factor.recorded !== false && (
                                    <div className={"borrowing-score-bar"}>
                                        <span style={{width: `${Math.max(0, Math.min(100, percent))}%`}}/>
                                    </div>
                                )}
                                <span className={"borrowing-score-factor-detail"}>
                                    {factor.label}{factor.detail ? ` · ${factor.detail}` : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className={"borrowing-figures"}>
                    <div className={"borrowing-figure"}>
                        <span className={"borrowing-figure-label"}>Basic salary</span>
                        <span className={"borrowing-figure-value"}>{formatMoney(scoreData.employee.salary)} EGP</span>
                    </div>
                    <div className={"borrowing-figure"}>
                        <span className={"borrowing-figure-label"}>Years of service</span>
                        <span className={"borrowing-figure-value"}>
                            {scoreData.employee.years === null ? 'Unknown' : scoreData.employee.years}
                        </span>
                    </div>
                    <div className={"borrowing-figure"}>
                        <span className={"borrowing-figure-label"}>Salary multiplier</span>
                        <span className={"borrowing-figure-value"}>&times;{scoreData.multiplier}</span>
                    </div>
                    <div className={"borrowing-figure"}>
                        <span className={"borrowing-figure-label"}>Ceiling</span>
                        <span className={"borrowing-figure-value"}>{formatMoney(scoreData.maxAmount)} EGP</span>
                    </div>
                    <div className={"borrowing-figure"}>
                        <span className={"borrowing-figure-label"}>Already outstanding</span>
                        <span className={"borrowing-figure-value"}>{formatMoney(scoreData.openBalance)} EGP</span>
                    </div>
                    <div className={"borrowing-figure"}>
                        <span className={"borrowing-figure-label"}>May borrow now</span>
                        <span className={"borrowing-figure-value"}>{formatMoney(scoreData.available)} EGP</span>
                    </div>
                </div>

                <div className={`borrowing-verdict ${scoreData.eligible ? 'borrowing-verdict-eligible' : 'borrowing-verdict-blocked'}`}>
                    <h4>{scoreData.eligible ? 'Eligible' : 'Not eligible right now'}</h4>

                    {scoreData.eligible ? (
                        <p>
                            {scoreData.employee.nameEn} may take up to {formatMoney(scoreData.available)} EGP
                            over up to {data.maxInstallments} instalments.
                        </p>
                    ) : (
                        <ul>
                            {scoreData.reasons.map((reason, index) => (<li key={index}>{reason}</li>))}
                        </ul>
                    )}
                </div>

                {scoreData.canSubmit && (
                    <div className={"borrowing-inline-buttons"}>
                        <button onClick={() => openApplicationModal(scoreData)}>
                            {scoreData.eligible ? 'Submit an Application' : 'Submit Anyway for the Board to Decide'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const openApplicationModal = (score) => {
        const fields = [
            {
                id: employeeFieldId, type: 'text', name: 'employee', httpName: 'employee',
                label: 'Employee', displayLabel: 'Employee', required: true, value: '',
                defaultValue: `${score.employee.nameEn} · ${score.employee.employeeCode}`,
                widthOfField: 2, labelOutside: true, labelOnTop: true, readOnlyField: true, alwaysEnglish: true,
            },
        ];

        fields.push(
            {
                id: emailFieldId, type: 'email', name: 'email', httpName: 'employee-email',
                label: 'Email',
                displayLabel: score.employee.email
                    ? 'Employee email, changing it goes to the board for review'
                    : 'Employee email, none is on file so nothing can be sent to them',
                required: false, value: '', defaultValue: score.employee.email || '',
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            }
        );

        if (data.commitmentMode !== 'computed') {
            fields.push({
                id: commitmentFieldId, type: 'select', name: 'commitment', httpName: 'commitment',
                label: 'Repayment Commitment',
                displayLabel: data.commitmentMode === 'bands'
                    ? 'Repayment commitment'
                    : `Repayment commitment, leave as computed (${score.factors.commitment.label}) or override it`,
                required: data.commitmentMode === 'bands',
                errorMsg: 'Choose the repayment commitment band', value: '',
                defaultValue: score.factors.commitment.label || '',
                choices: data.commitmentChoices, widthOfField: 2, labelOutside: true, labelOnTop: true,
            });
        }

        fields.push(
            {
                id: amountFieldId, type: 'text', name: 'amount', httpName: 'amount',
                label: 'Amount',
                displayLabel: data.allowAboveLimit
                    ? `Amount in EGP, above ${formatMoney(score.available)} needs a board exception`
                    : `Amount in EGP, up to ${formatMoney(score.available)}`,
                required: true, errorMsg: 'Enter the amount as a number, for example 5000 or 5000.50',
                regex: moneyRegex, value: '', widthOfField: 2, labelOutside: true, labelOnTop: true,
                alwaysEnglish: true,
            },
            {
                id: installmentsFieldId, type: 'number', name: 'installments', httpName: 'installments',
                label: 'Instalments', displayLabel: `Number of monthly instalments (1 to ${data.maxInstallments})`,
                required: true, errorMsg: 'Choose how many months the repayment runs over', value: '',
                defaultValue: String(data.maxInstallments), minimumValue: 1, maximumValue: data.maxInstallments,
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            }
        );

        if (data.allowFirstMonth) {
            fields.push({
                id: firstMonthFieldId, type: 'date', name: 'first_month', httpName: 'first-month',
                label: 'First Instalment', displayLabel: 'Month the first instalment falls in',
                required: false, value: '', defaultValue: firstOfNextMonth(),
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            });
        }

        fields.push({
            id: reasonFieldId, type: 'text', name: 'reason', httpName: 'reason',
            label: 'Reason', displayLabel: 'Reason for the advance', required: false, value: '',
            widthOfField: 1, labelOutside: true, labelOnTop: true,
        });

        const halfWidthFields = fields.filter((field) => field.widthOfField === 2);

        if (halfWidthFields.length % 2 === 1) {
            halfWidthFields[halfWidthFields.length - 1].widthOfField = 1;
        }

        setModalContext({
            employeeCode: score.employee.employeeCode,
            employeeName: score.employee.nameEn,
            available: score.available,
            confirmedOverLimit: false,
        });
        setModalDynamicSections(null);
        setModalFields(fields);
        setModalKind('application');
    };

    const handleApplicationSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const requested = Number(values[`field_${amountFieldId}`]) || 0;

        if (data.allowAboveLimit && requested > modalContext.available && !modalContext.confirmedOverLimit) {
            setPendingOverLimit({requested, values});
            return false;
        }

        return submitApplicationValues(values);
    };

    const submitApplicationValues = async (values) => {

        const payload = {
            employee_code: modalContext.employeeCode,
            amount: values[`field_${amountFieldId}`],
            installment_count: values[`field_${installmentsFieldId}`],
            reason: values[`field_${reasonFieldId}`] || '',
            email: values[`field_${emailFieldId}`] || '',
            first_due_month: values[`field_${firstMonthFieldId}`] || '',
        };

        if (data.commitmentMode !== 'computed') {
            payload.commitment_band = values[`field_${commitmentFieldId}`] || '';
        }

        const result = await submitBorrowingApplication(payload);

        if (result && result.success) {
            setPendingOverLimit(null);
            closeModal();
            await reloadData();

            if (selectedEmployeeLabel !== '') {
                await loadScore(selectedEmployeeLabel, '');
            }

            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const openApplicationDetail = async (rowIndex) => {
        const row = data.applications[rowIndex];

        if (!row) {
            return;
        }

        await openApplicationDetailById(Number(row[applicationIdColIndex]));
    };

    const buildEvenPlan = (amount, count) => {
        const total = Number(amount) || 0;
        const months = Math.max(1, Number(count) || 1);
        const each = Math.ceil(total / months);
        const rows = [];

        for (let position = 0; position < months; position += 1) {
            const value = position === months - 1
                ? Math.round((total - (each * (months - 1))) * 100) / 100
                : each;

            rows.push(String(value));
        }

        return rows;
    };

    const openPlanEditor = (reason = '') => {
        const application = modalContext;

        setModalDynamicSections([{
            sectionId: planSectionId,
            title: 'Instalment',
            addButtonLabel: 'Add Instalment',
            removeButtonLabel: 'Remove Instalment',
            insertAfterFieldId: planFirstMonthFieldId,
            minInstances: 1,
            maxInstances: data.hardMaxInstallments,
            fields: [{
                id: planRowAmountFieldId, type: 'text', name: 'plan_installment', httpName: 'plan-installment',
                label: 'Instalment', displayLabel: 'Amount in EGP', required: true,
                errorMsg: 'Enter the instalment as a number, for example 500 or 500.50',
                regex: moneyRegex, value: '', widthOfField: 1, labelOutside: true, labelOnTop: true,
                alwaysEnglish: true,
            }],
            instances: buildEvenPlan(application.requestedAmount, application.installmentCount).map((amount) => ({[planRowAmountFieldId]: amount})),
        }]);

        setModalFields([
            {
                id: planAmountFieldId, type: 'text', name: 'plan_amount', httpName: 'plan-amount',
                label: 'Advance', displayLabel: 'Advance in EGP, the instalments must add up to it',
                required: true, errorMsg: 'Enter the advance as a number, for example 5000 or 5000.50',
                regex: moneyRegex, value: '', defaultValue: String(application.requestedAmount),
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            },
            {
                id: planFirstMonthFieldId, type: 'date', name: 'plan_first_month', httpName: 'plan-first-month',
                label: 'First Instalment', displayLabel: 'Month the first instalment falls in',
                required: true, errorMsg: 'Choose the month the first instalment falls in', value: '',
                defaultValue: application.firstDueMonth || firstOfNextMonth(),
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            },
            {
                id: planReasonFieldId, type: 'textarea', name: 'plan_reason', httpName: 'plan-reason',
                label: 'Reason', displayLabel: 'Reason for changing the terms',
                required: true, errorMsg: 'Every exception needs a written reason', value: '',
                defaultValue: reason,
                widthOfField: 1, labelOutside: true, labelOnTop: true,
            },
        ]);

        setModalKind('approve-plan');
    };

    const handlePlanSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const advance = Number(values[`field_${planAmountFieldId}`]) || 0;
        const firstMonth = values[`field_${planFirstMonthFieldId}`] || firstOfNextMonth();
        const reason = values[`field_${planReasonFieldId}`] || '';
        const count = Number(values[`dynamicSectionCount_${planSectionId}`] || 0);
        const schedule = [];
        let total = 0;

        for (let ordinal = 0; ordinal < count; ordinal += 1) {
            const amount = values[`field_${planSectionId}_i${ordinal}_f${planRowAmountFieldId}`] || '0';

            total = Math.round((total + (Number(amount) || 0)) * 100) / 100;
            schedule.push({amount, due_month: addMonths(firstMonth, ordinal)});
        }

        if (Math.abs(total - advance) >= 0.01) {
            throw new Error(`The instalments add up to ${formatMoney(total)} EGP but the advance is ${formatMoney(advance)} EGP.`);
        }

        const result = await reviewBorrowingApplication({
            application_id: modalContext.id,
            decision: 'approved',
            note: reason,
            with_changes: true,
            override_reason: reason,
            amount: values[`field_${planAmountFieldId}`],
            schedule,
        });

        if (result && result.success) {
            closeModal();
            await reloadData();

            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const decideApplication = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const decision = values[`field_${detailDecisionFieldId}`];
        const note = values[`field_${detailNoteFieldId}`] || '';

        if (decision === APPROVE_WITH_CHANGES) {
            openPlanEditor(note);

            return true;
        }

        const result = await reviewBorrowingApplication({
            application_id: modalContext.id,
            decision: decision === REJECT ? 'rejected' : 'approved',
            note,
            with_changes: false,
        });

        if (result && result.success) {
            closeModal();
            await reloadData();

            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const installmentActionTitles = {
        'delay': 'Ask the Board to Delay',
        'correct-paid': 'Ask the Board to Mark Paid',
        'correct-scheduled': 'Ask the Board to Mark Unpaid',
        'mark-paid': 'Mark Paid',
        'mark-scheduled': 'Mark Unpaid',
    };

    const openInstallmentAction = (installment, action) => {
        const needsReason = action === 'delay' || action === 'correct-paid' || action === 'correct-scheduled';

        setModalContext({
            ...modalContext,
            installment: installment,
            installmentAction: action,
            applicationId: modalContext.id,
        });
        setModalDynamicSections(null);
        setModalFields([{
            id: installmentReasonFieldId, type: 'textarea', name: 'reason', httpName: 'reason',
            label: 'Reason',
            displayLabel: needsReason
                ? `Reason for asking the board about ${installment.label}`
                : `Note about ${installment.label}, optional`,
            required: needsReason,
            errorMsg: 'The board needs a written reason', value: '',
            widthOfField: 1, labelOutside: true, labelOnTop: true,
        }]);
        setModalKind('installment-action');
    };

    const handleInstallmentActionSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const reason = values[`field_${installmentReasonFieldId}`] || '';
        const {installment, installmentAction, applicationId} = modalContext;

        let result;

        if (installmentAction === 'delay' || installmentAction === 'correct-paid'
            || installmentAction === 'correct-scheduled') {
            result = await submitBorrowingDelayRequest({
                installment_id: installment.id,
                kind: installmentAction === 'delay' ? 'delay' : 'payment_correction',
                requested_status: installmentAction === 'correct-paid' ? 'paid' : 'scheduled',
                reason,
            });
        } else {
            result = await recordBorrowingPayment({
                installment_id: installment.id,
                status: installmentAction === 'mark-paid' ? 'paid' : 'scheduled',
                note: reason,
            });
        }

        if (result && result.success) {
            setModalFields(null);
            await openApplicationDetailById(applicationId);
            succeedModal(installmentActionOutcomes[installmentAction](installment.label));

            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const installmentActionOutcomes = {
        'delay': (label) => `The board was asked to delay ${label}. It stays unpaid and in place until they decide.`,
        'correct-paid': (label) => `The board was asked to mark ${label} as paid. It is unchanged until they decide.`,
        'correct-scheduled': (label) => `The board was asked to mark ${label} as unpaid. It is unchanged until they decide.`,
        'mark-paid': (label) => `${label} is now recorded as paid.`,
        'mark-scheduled': (label) => `${label} is recorded as unpaid again.`,
    };

    const renderInstallmentActions = (installment) => {
        if (!installment) {
            return null;
        }

        if (installment.pending !== '') {
            return (
                <span className={"borrowing-pending-request"}>
                    {installment.pending} awaiting the board
                </span>
            );
        }

        return (
            <div className={"borrowing-inline-buttons"}>
                {canRecord() && installment.status === 'scheduled' && (
                    <button disabled={modalBusy}
                            onClick={() => openInstallmentAction(installment, 'mark-paid')}>
                        Mark Paid
                    </button>
                )}
                {canRecord() && installment.status === 'paid' && (
                    <button disabled={modalBusy}
                            onClick={() => openInstallmentAction(installment, 'mark-scheduled')}>
                        Mark Unpaid
                    </button>
                )}
                {can('submit_delay') && installment.status === 'scheduled' && (
                    <button disabled={modalBusy}
                            onClick={() => openInstallmentAction(installment, 'delay')}>
                        Ask to Delay
                    </button>
                )}
                {!canRecord() && canCorrect() && installment.status === 'paid' && (
                    <button disabled={modalBusy}
                            onClick={() => openInstallmentAction(installment, 'correct-scheduled')}>
                        Ask to Mark Unpaid
                    </button>
                )}
                {!canRecord() && canCorrect() && installment.status === 'scheduled' && (
                    <button disabled={modalBusy}
                            onClick={() => openInstallmentAction(installment, 'correct-paid')}>
                        Ask to Mark Paid
                    </button>
                )}
            </div>
        );
    };

    const renderApplicationDetail = () => {
        const application = modalContext;

        if (!application) {
            return null;
        }

        const isPending = application.status === 'pending';

        return (
            <div className={"admin-review-details"}>
                <p>
                    <strong>Employee:</strong> {application.employeeName}
                    {' · '}<strong>Position:</strong> {application.position || '—'}
                    {' · '}<strong>Contract year:</strong> {application.contractYear}
                </p>

                <p>
                    <strong>Requested:</strong> {formatMoney(application.requestedAmount)} EGP
                    {' · '}<strong>Instalments:</strong> {application.installmentCount}
                    {' · '}<strong>Score at submission:</strong> {application.score} ({application.grade})
                    {' · '}<strong>Ceiling then:</strong> {formatMoney(application.maxAmount)} EGP
                    {!application.wasEligible && ' · did not meet the eligibility rules'}
                </p>

                {isPending && application.aboveCeiling && (
                    <p className={"admin-inline-error-message"}>
                        This asks for more than the ceiling allowed at submission. Approving it needs
                        Approve With Changes and records a ceiling exception.
                    </p>
                )}

                {isPending && !application.wasEligible && (
                    <p className={"admin-inline-error-message"}>
                        This applicant did not meet the eligibility rules. Approving it needs
                        Approve With Changes and records an eligibility exception.
                    </p>
                )}

                <p>
                    <strong>Reason:</strong> {application.reason || '—'}
                    {' · '}<strong>Submitted by:</strong> {application.submittedBy || '—'}
                    {application.decidedBy ? <>{' · '}<strong>Decided by:</strong> {application.decidedBy}</> : null}
                </p>

                <p>
                    <strong>Employee email:</strong> {application.employeeEmail || 'No address on file'}
                </p>

                {application.overrides.length > 0 && (
                    <Table tableData={[
                        ['Exception', 'From', 'To', 'Reason', 'By'],
                        ...application.overrides.map((override) => [
                            override.type.replace(/_/g, ' '),
                            override.oldValue,
                            override.newValue,
                            override.reason,
                            `${override.createdBy}${override.createdAt ? ` · ${override.createdAt}` : ''}`,
                        ]),
                    ]}
                           reviewMode={true}
                           forceEnglishTable={true}
                           rowClassNames={() => 'admin-diff-changed'}
                    />
                )}

                {application.status === 'approved' && (
                    <>
                        <div className={"borrowing-figures"}>
                            <div className={"borrowing-figure"}>
                                <span className={"borrowing-figure-label"}>Borrowed</span>
                                <span className={"borrowing-figure-value"}>{formatMoney(application.ledger.borrowed)} EGP</span>
                            </div>
                            <div className={"borrowing-figure"}>
                                <span className={"borrowing-figure-label"}>Repaid to date</span>
                                <span className={"borrowing-figure-value"}>{formatMoney(application.ledger.repaid)} EGP</span>
                            </div>
                            <div className={"borrowing-figure"}>
                                <span className={"borrowing-figure-label"}>This month</span>
                                <span className={"borrowing-figure-value"}>
                                    {application.ledger.skipped ? 'Skipped' : `${formatMoney(application.ledger.thisMonth)} EGP`}
                                </span>
                            </div>
                            <div className={"borrowing-figure"}>
                                <span className={"borrowing-figure-label"}>Forgiven</span>
                                <span className={"borrowing-figure-value"}>{formatMoney(application.ledger.forgiven)} EGP</span>
                            </div>
                            <div className={"borrowing-figure"}>
                                <span className={"borrowing-figure-label"}>Outstanding</span>
                                <span className={"borrowing-figure-value"}>{formatMoney(application.ledger.outstanding)} EGP</span>
                            </div>
                            <div className={"borrowing-figure"}>
                                <span className={"borrowing-figure-label"}>Delays used</span>
                                <span className={"borrowing-figure-value"}>
                                    {application.delaysTaken} of {data.maxDelays}
                                </span>
                            </div>
                        </div>

                        <div className={"borrowing-ledger-strip"}>
                            {application.schedule.map((installment) => (
                                <div key={installment.id}
                                     className={`borrowing-ledger-month ${installment.status} ${installment.manual ? 'manual' : ''}`}>
                                    <span className={"borrowing-ledger-month-label"}>{installment.label}</span>
                                    <span className={"borrowing-ledger-month-amount"}>{formatMoney(installment.amount)}</span>
                                    <span className={"borrowing-ledger-month-label"}>{installment.statusLabel}</span>
                                </div>
                            ))}
                        </div>

                        {!application.settled && (canRecord() || can('submit_delay') || canCorrect()) && (
                            <>
                                <Table tableData={[
                                    ['Instalment', 'Amount', 'Status', 'Actions'],
                                    ...application.schedule.map((installment) => [
                                        installment.label,
                                        String(installment.amount),
                                        `${installment.statusLabel}${installment.paidAt ? ` · ${installment.paidAt}` : ''}`,
                                        '',
                                    ]),
                                ]}
                                       reviewMode={true}
                                       forceEnglishTable={true}
                                       currencyColumns={['Amount']}
                                       currencySymbols={['EGP']}
                                       currencySymbolPositions={['right-space']}
                                       cellRenderers={{Actions: (value, rowIndex) => renderInstallmentActions(application.schedule[rowIndex - 1])}}
                                />
                            </>
                        )}
                    </>
                )}

                <p ref={modalMessageRef}
                   className={modalSuccess !== '' ? "admin-inline-success-message" : "admin-inline-error-message"}>
                    {modalSuccess !== '' ? modalSuccess : modalError}
                </p>
            </div>
        );
    };

    const openDelayReview = (rowIndex) => {
        const row = data.delayRequests[rowIndex];

        if (!row) {
            return;
        }

        setModalContext({
            id: Number(row[delayRequestIdColIndex]),
            kind: row[1],
            employee: row[2],
            month: row[3],
            amount: row[4],
            currentStatus: String(row[5]).toLowerCase(),
            reason: row[6],
            status: row[7],
            overCap: row[8] === 'Yes',
            requestedBy: row[9],
            delayEffect: row[12],
        });
        setModalDynamicSections(null);
        setModalFields(null);
        setModalError('');
        setDetailFormFields(row[7] === 'Pending' && can('review_delay')
            ? [
                detailDecisionField(['Approve', REJECT]),
                detailNoteField(row[8] === 'Yes'
                    ? 'Reason for granting one more delay than the contract allows'
                    : 'Note to go with the decision', row[8] === 'Yes'),
            ]
            : null);
        setModalKind('delay-review');
    };

    const decideDelay = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const decision = values[`field_${detailDecisionFieldId}`] === REJECT ? 'rejected' : 'approved';
        const note = values[`field_${detailNoteFieldId}`] || '';

        const result = await reviewBorrowingDelayRequest({
            request_id: modalContext.id,
            decision,
            note,
        });

        if (result && result.success) {
            closeModal();
            await reloadData();

            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const openEditReview = async (rowIndex) => {
        const row = data.editRequests[rowIndex];

        if (!row) {
            return;
        }

        const editRequestId = Number(row[editRequestIdColIndex]);
        const next = await reloadData({editRequestId});

        if (!next || !next.editRequest) {
            return;
        }

        setModalContext(next.editRequest);
        setModalDynamicSections(null);
        setModalFields(null);
        setModalError('');
        setDetailFormFields(next.editRequest.status === 'pending' && can('review_edit_request')
            ? [
                detailDecisionField(['Approve & apply', REJECT]),
                detailNoteField('Note to go with the decision', false),
            ] : null);
        setModalKind('edit-review');
    };

    const decideEditRequest = async (formData) => {
        const values = Object.fromEntries(formData.entries());

        const result = await reviewBorrowingEditRequest({
            request_id: modalContext.id,
            decision: values[`field_${detailDecisionFieldId}`] === REJECT ? 'rejected' : 'approved',
            note: values[`field_${detailNoteFieldId}`] || '',
        });

        if (result && result.success) {
            closeModal();
            await reloadData();

            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const openSettingModal = (rowIndex) => {
        const row = data.settings[rowIndex];

        if (!row) {
            return;
        }

        const options = (row[settingOptionsColIndex] || '').split(',').map((value) => value.trim()).filter(Boolean);

        const fields = [{
            id: settingValueFieldId,
            type: options.length > 0 ? 'select' : 'text',
            name: 'value', httpName: 'setting-value',
            label: 'Value', displayLabel: row[4] || 'Value', required: true,
            errorMsg: 'Enter a value', value: '', defaultValue: row[settingValueColIndex],
            choices: options.length > 0 ? options : undefined,
            widthOfField: 1, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
        }];

        if (data.settingsApplyTo === 'ask') {
            fields.push({
                id: settingApplyToFieldId, type: 'select', name: 'apply_to', httpName: 'apply-to',
                label: 'Apply To',
                displayLabel: `Apply this to the ${data.runningContracts} contract${data.runningContracts === 1 ? '' : 's'} already running?`,
                required: true, value: '', defaultValue: 'New advances only',
                choices: ['New advances only', 'Rebuild the running contracts too'],
                widthOfField: 1, labelOutside: true, labelOnTop: true,
            });
        }

        setModalContext({settingKey: row[settingKeyColIndex], settingName: row[0]});
        setModalDynamicSections(null);
        setModalFields(fields);
        setModalKind('setting');
    };

    const handleSettingSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const applyChoice = values[`field_${settingApplyToFieldId}`];

        const result = await updateBorrowingConfig({
            section: 'setting',
            setting_key: modalContext.settingKey,
            setting_value: values[`field_${settingValueFieldId}`],
            apply_to: applyChoice === 'Rebuild the running contracts too' ? 'all_loans' : 'new_only',
        });

        if (result && result.success) {
            closeModal();
            await reloadData();
            return result.message;
        }

        throw new Error((result && result.message) || result);
    };

    const openMatrixModal = (rowIndex) => {
        const row = data.matrix[rowIndex];

        if (!row) {
            return;
        }

        const bracketLabels = data.matrix[0].slice(2, 7).map((label) => label.replace('x ', ''));

        const fields = [{
            id: matrixGradeFieldId, type: 'text', name: 'grade', httpName: 'grade',
            label: 'Grade', displayLabel: 'Grade name shown next to the score', required: true,
            errorMsg: 'The grade needs a name', value: '', defaultValue: row[matrixGradeColIndex],
            widthOfField: 1, labelOutside: true, labelOnTop: true,
        }];

        bracketLabels.forEach((label, position) => {
            fields.push({
                id: matrixMultiplierFieldIds[position], type: 'text', name: `m${position}`, httpName: `m${position}`,
                label: `Multiplier ${label}`, displayLabel: `Salary multiplier · ${label}`, required: true,
                errorMsg: 'Enter a number such as 1.25', regex: '^[0-9]{1,3}([.][0-9]{1,2})?$',
                value: '', defaultValue: row[2 + position],
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            }, {
                id: matrixFlatFieldIds[position], type: 'text', name: `f${position}`, httpName: `f${position}`,
                label: `Flat ${label}`, displayLabel: `Flat amount in EGP · ${label}`, required: true,
                errorMsg: 'Enter a number', regex: moneyRegex,
                value: '', defaultValue: row[7 + position],
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            });
        });

        setModalContext({scoreMin: row[matrixScoreMinColIndex], range: row[0]});
        setModalDynamicSections(null);
        setModalFields(fields);
        setModalKind('matrix');
    };

    const handleMatrixSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());

        const payload = {
            section: 'matrix',
            score_min: modalContext.scoreMin,
            grade_label: values[`field_${matrixGradeFieldId}`],
        };

        matrixMultiplierFieldIds.forEach((fieldId, position) => {
            payload[`m${position}`] = values[`field_${fieldId}`];
        });

        matrixFlatFieldIds.forEach((fieldId, position) => {
            payload[`f${position}`] = values[`field_${fieldId}`];
        });

        const result = await updateBorrowingConfig(payload);

        if (result && result.success) {
            closeModal();
            await reloadData();
            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const openBandModal = (rowIndex) => {
        const row = data.scoreBands[rowIndex];

        if (!row) {
            return;
        }

        setModalContext({key: row[bandKeyColIndex], name: `${row[0]} band ${row[1]}`});
        setModalDynamicSections(null);
        setModalFields([
            {
                id: bandThresholdFieldId, type: 'text', name: 'threshold', httpName: 'threshold',
                label: 'Threshold', displayLabel: 'Threshold, blank for the last band',
                required: false, value: '', defaultValue: row[bandThresholdColIndex],
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            },
            {
                id: bandScoreFieldId, type: 'number', name: 'score', httpName: 'score',
                label: 'Score', displayLabel: 'Score this band awards', required: true,
                errorMsg: 'A band score is between 0 and 100', value: '', defaultValue: row[bandScoreColIndex],
                minimumValue: 0, maximumValue: 100,
                widthOfField: 2, labelOutside: true, labelOnTop: true, alwaysEnglish: true,
            },
            {
                id: bandLabelFieldId, type: 'text', name: 'label', httpName: 'band-label',
                label: 'Label', displayLabel: 'Label shown to whoever fills the form', required: true,
                errorMsg: 'The band needs a label', value: '', defaultValue: row[bandLabelColIndex],
                widthOfField: 1, labelOutside: true, labelOnTop: true,
            },
        ]);
        setModalKind('band');
    };

    const handleBandSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());
        const [factor, bandIndex] = String(modalContext.key).split(':');

        const result = await updateBorrowingConfig({
            section: 'band',
            factor,
            band_index: bandIndex,
            threshold: values[`field_${bandThresholdFieldId}`] || '',
            score: values[`field_${bandScoreFieldId}`],
            label: values[`field_${bandLabelFieldId}`],
        });

        if (result && result.success) {
            closeModal();
            await reloadData();
            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const openCapabilityModal = (rowIndex) => {
        const row = data.roleCapabilities[rowIndex];

        if (!row) {
            return;
        }

        setModalContext({key: row[capabilityKeyColIndex], name: row[0]});
        setModalDynamicSections(null);
        setModalFields([
            {
                id: capabilityHrFieldId, type: 'select', name: 'hr', httpName: 'hr',
                label: 'Human Resources', displayLabel: 'Human Resources', required: true,
                choices: ['Yes', 'No'], value: '', defaultValue: row[1],
                widthOfField: 3, labelOutside: true, labelOnTop: true,
            },
            {
                id: capabilityAccountingFieldId, type: 'select', name: 'accounting', httpName: 'accounting',
                label: 'Accounting', displayLabel: 'Accounting & Finance', required: true,
                choices: ['Yes', 'No'], value: '', defaultValue: row[2],
                widthOfField: 3, labelOutside: true, labelOnTop: true,
            },
            {
                id: capabilityBoardFieldId, type: 'select', name: 'board', httpName: 'board',
                label: 'Board', displayLabel: 'Admin / Board, always kept', required: false,
                choices: ['Yes'], value: '', defaultValue: 'Yes', disabled: true,
                widthOfField: 3, labelOutside: true, labelOnTop: true,
            },
        ]);
        setModalKind('capability');
    };

    const handleCapabilitySubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());

        const result = await updateBorrowingConfig({
            section: 'capability',
            capability_key: modalContext.key,
            hr: values[`field_${capabilityHrFieldId}`],
            accounting: values[`field_${capabilityAccountingFieldId}`],
            board: 'Yes',
        });

        if (result && result.success) {
            closeModal();
            await reloadData();
            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const openEmailModal = (rowIndex) => {
        const row = data.emailRules[rowIndex];

        if (!row) {
            return;
        }

        setModalContext({key: row[emailEventKeyColIndex], name: row[0]});
        setModalDynamicSections(null);
        setModalFields([
            {
                id: emailEmployeeFieldId, type: 'select', name: 'employee', httpName: 'employee',
                label: 'Employee', displayLabel: 'Email the employee', required: true,
                choices: ['Yes', 'No'], value: '', defaultValue: row[1],
                widthOfField: 2, labelOutside: true, labelOnTop: true,
            },
            {
                id: emailHrFieldId, type: 'select', name: 'hr', httpName: 'hr',
                label: 'HR', displayLabel: 'Email Human Resources', required: true,
                choices: ['Yes', 'No'], value: '', defaultValue: row[2],
                widthOfField: 2, labelOutside: true, labelOnTop: true,
            },
            {
                id: emailAccountingFieldId, type: 'select', name: 'accounting', httpName: 'accounting',
                label: 'Accounting', displayLabel: 'Email Accounting & Finance', required: true,
                choices: ['Yes', 'No'], value: '', defaultValue: row[3],
                widthOfField: 2, labelOutside: true, labelOnTop: true,
            },
            {
                id: emailBoardFieldId, type: 'select', name: 'board', httpName: 'board',
                label: 'Board', displayLabel: 'Email the board', required: true,
                choices: ['Yes', 'No'], value: '', defaultValue: row[4],
                widthOfField: 2, labelOutside: true, labelOnTop: true,
            },
        ]);
        setModalKind('email');
    };

    const handleEmailSubmit = async (formData) => {
        const values = Object.fromEntries(formData.entries());

        const result = await updateBorrowingConfig({
            section: 'email',
            event_key: modalContext.key,
            employee: values[`field_${emailEmployeeFieldId}`],
            hr: values[`field_${emailHrFieldId}`],
            accounting: values[`field_${emailAccountingFieldId}`],
            board: values[`field_${emailBoardFieldId}`],
        });

        if (result && result.success) {
            closeModal();
            await reloadData();
            return true;
        }

        throw new Error((result && result.message) || result);
    };

    const reloadButton = (
        <button key={"reload"} onClick={() => reloadData()} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Reload Table Data'}
        </button>
    );

    const eligibilityTab = () => (
        <div className={`admin-page-tab-content borrowing-eligibility-tab ${scoreData || scoreError ? '' : 'is-empty'}`}>
            <div className={"borrowing-inline-form"}>
                <Form fields={employeePickerFields}
                      mailTo={''}
                      formTitle={"Borrowing Employee Picker"}
                      lang={"en"}
                      noInputFieldsCache={true}
                      noCaptcha={true}
                      hasDifferentOnSubmitBehaviour={true}
                      differentOnSubmitBehaviour={
                        async (formData) => {
                              const values = Object.fromEntries(formData.entries());
                              await loadScore(
                                  values[`field_${employeeFieldId}`] || '',
                                  values[`field_${attendanceFieldId}`] || '',
                                  values[`field_${eligibilitySalaryFieldId}`] || '',
                                  values[`field_${eligibilityHireDateFieldId}`] || ''
                              );
                              return false;
                        }}
                      forceEnglishForm={true}
                      noClearOption={true}
                      noSuccessMessage={true}
                      centerSubmitButton={true}
                      hasDifferentSubmitButtonText={true}
                      differentSubmitButtonText={['Check Eligibility', 'Checking...']}
                />
            </div>

            {renderScorePanel()}
        </div>
    );

    const applicationsTab = () => (
        <div className={"admin-page-tab-content"}>
            <Table tableData={data.applications}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   allowExport={true}
                   exportFileName={'borrowing-applications'}
                   forceEnglishTable={true}
                   isLoading={isLoading}
                   defaultHiddenColumns={['Application ID', 'Submitted By']}
                   sortConfigParam={{column: 0, direction: 'descending'}}
                   filterableColumns={['Status', 'Grade', 'Year', 'Exception']}
                   dataTypes={{number: ['ID', 'Score', 'Instalments'], currency: ['Amount'], date: ['Submitted', 'Decided']}}
                   currencyColumns={['Amount']}
                   currencySymbols={['EGP']}
                   currencySymbolPositions={['right-space']}
                   customActionColumn={{
                       headerText: 'Review',
                       actions: [{label: 'Open', onClick: openApplicationDetail}],
                   }}
                   headerModuleElements={[reloadButton]}
                   footerModuleElements={[]}
            />
        </div>
    );

    const delaysTab = () => (
        <div className={"admin-page-tab-content"}>
            <Table tableData={data.delayRequests}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   isLoading={isLoading}
                   defaultHiddenColumns={['Request ID', 'Effect']}
                   sortConfigParam={{column: 0, direction: 'descending'}}
                   filterableColumns={['Type', 'Status', 'Beyond Cap']}
                   dataTypes={{number: ['ID'], currency: ['Amount'], date: ['Requested']}}
                   currencyColumns={['Amount']}
                   currencySymbols={['EGP']}
                   currencySymbolPositions={['right-space']}
                   truncateValuesColumns={{'Reason': 60}}
                   customActionColumn={can('review_delay') ? {
                       headerText: 'Review',
                       actions: [{
                           label: 'Open',
                           onClick: openDelayReview,
                           isVisible: (rowIndex) => data.delayRequests[rowIndex]
                               && data.delayRequests[rowIndex][7] === 'Pending',
                       }],
                   } : undefined}
                   headerModuleElements={[reloadButton]}
                   footerModuleElements={[]}
            />
        </div>
    );

    const ledgerTab = () => (
        <div className={"admin-page-tab-content"}>
            <Table tableData={data.ledger}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   allowExport={true}
                   exportFileName={'borrowing-database'}
                   forceEnglishTable={true}
                   isLoading={isLoading}
                   defaultHiddenColumns={['Application ID', 'Forgiven']}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   filterableColumns={['Status', 'Position', 'Contact']}
                   dataTypes={{currency: ['Borrowed', 'Repaid to Date', 'Outstanding', 'Forgiven'], number: ['Months Left']}}
                   currencyColumns={['Borrowed', 'Repaid to Date', 'Outstanding', 'Forgiven']}
                   currencySymbols={['EGP', 'EGP', 'EGP', 'EGP']}
                   currencySymbolPositions={['right-space', 'right-space', 'right-space', 'right-space']}
                   customActionColumn={can('view_applications') ? {
                       headerText: 'Ledger',
                       actions: [{
                           label: 'Open',
                           onClick: (rowIndex) => {
                               const row = data.ledger[rowIndex];

                               if (row) {
                                   openApplicationDetailById(Number(row[ledgerApplicationIdColIndex]));
                               }
                           },
                       }],
                   } : undefined}
                   headerModuleElements={[reloadButton]}
                   footerModuleElements={[]}
            />
        </div>
    );

    const openApplicationDetailById = async (applicationId) => {
        const next = await reloadData({applicationId});

        if (!next || !next.application) {
            return;
        }

        setModalContext(next.application);
        setModalDynamicSections(null);
        setModalFields(null);
        setModalError('');

        if (next.application.status === 'pending' && can('review_application')) {
            const choices = [];

            if (!next.application.aboveCeiling && next.application.wasEligible) {
                choices.push(APPROVE_AS_REQUESTED);
            }

            if (can('override_terms')) {
                choices.push(APPROVE_WITH_CHANGES);
            }

            choices.push(REJECT);

            setDetailFormFields([
                detailDecisionField(choices),
                detailNoteField('Note to go with the decision', false),
            ]);
        } else {
            setDetailFormFields(null);
        }

        setModalKind('application-detail');
    };

    const editRequestsTab = () => (
        <div className={"admin-page-tab-content"}>
            <Table tableData={data.editRequests}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   isLoading={isLoading}
                   defaultHiddenColumns={['Request ID']}
                   sortConfigParam={{column: 0, direction: 'descending'}}
                   filterableColumns={['Status', 'Role', 'Target']}
                   dataTypes={{number: ['ID'], date: ['Requested']}}
                   customActionColumn={{
                       headerText: 'Review',
                       actions: [{
                           label: 'Open',
                           onClick: openEditReview,
                           isVisible: (rowIndex) => data.editRequests[rowIndex]
                               && (data.editRequests[rowIndex][6] === 'Pending' || can('review_edit_request')),
                       }],
                   }}
                   headerModuleElements={[
                       reloadButton,
                   ]}
                   footerModuleElements={[]}
            />
        </div>
    );

    const settingsTab = () => {
        const subTabs = [
            {
                id: 0,
                label: 'Rules',
                element: (
                    <div className={"admin-page-tab-content"}>
                        <Table tableData={data.settings}
                               scrollable={true}
                               compact={true}
                               allowHideColumns={true}
                               allowSticky={true}
                               forceEnglishTable={true}
                               isLoading={isLoading}
                               defaultHiddenColumns={['Key', 'Choices']}
                               filterableColumns={['Group']}
                               truncateValuesColumns={{'What it changes': 90}}
                               allowEditEntryOption={true}
                               onEditEntryOption={openSettingModal}
                               headerModuleElements={[reloadButton]}
                               footerModuleElements={[]}
                        />
                    </div>
                ),
            },
            {
                id: 1,
                label: 'Ceiling Matrix',
                element: (
                    <div className={"admin-page-tab-content"}>
                        <Table tableData={data.matrix}
                               scrollable={true}
                               compact={true}
                               allowHideColumns={true}
                               allowSticky={true}
                               forceEnglishTable={true}
                               isLoading={isLoading}
                               defaultHiddenColumns={['Score Min']}
                               allowEditEntryOption={true}
                               onEditEntryOption={openMatrixModal}
                               headerModuleElements={[reloadButton]}
                               footerModuleElements={[]}
                        />
                    </div>
                ),
            },
            {
                id: 2,
                label: 'Score Bands',
                element: (
                    <div className={"admin-page-tab-content"}>
                        <Table tableData={data.scoreBands}
                               scrollable={true}
                               compact={true}
                               allowHideColumns={true}
                               allowSticky={true}
                               forceEnglishTable={true}
                               isLoading={isLoading}
                               defaultHiddenColumns={['Key']}
                               filterableColumns={['Factor']}
                               allowEditEntryOption={true}
                               onEditEntryOption={openBandModal}
                               headerModuleElements={[reloadButton]}
                               footerModuleElements={[]}
                        />
                    </div>
                ),
            },
            {
                id: 3,
                label: 'Capabilities',
                element: (
                    <div className={"admin-page-tab-content"}>
                        <Table tableData={data.roleCapabilities}
                               scrollable={true}
                               compact={true}
                               allowHideColumns={true}
                               allowSticky={true}
                               forceEnglishTable={true}
                               isLoading={isLoading}
                               defaultHiddenColumns={['Key']}
                               allowEditEntryOption={true}
                               onEditEntryOption={openCapabilityModal}
                               headerModuleElements={[reloadButton]}
                               footerModuleElements={[]}
                        />
                    </div>
                ),
            },
            {
                id: 4,
                label: 'Notifications',
                element: (
                    <div className={"admin-page-tab-content"}>
                        <Table tableData={data.emailRules}
                               scrollable={true}
                               compact={true}
                               allowHideColumns={true}
                               allowSticky={true}
                               forceEnglishTable={true}
                               isLoading={isLoading}
                               defaultHiddenColumns={['Key']}
                               allowEditEntryOption={true}
                               onEditEntryOption={openEmailModal}
                               headerModuleElements={[reloadButton]}
                               footerModuleElements={[]}
                        />
                    </div>
                ),
            },
        ];

        return (
            <div className={"admin-page-tab-content"}>
                <TabsPage tabData={subTabs}
                          initialTab={0}
                          stickyOnDesktop={false}
                          pinnedInMobile={false}
                          stickUnderParentBarInMobile={true}
                          stickUnderParentBarOnDesktop={false}
                          title={"Borrowing System Settings"}/>
            </div>
        );
    };

    const tabData = useMemo(() => {
        if (!data) {
            return [];
        }

        const tabs = [];

        if (can('view_scores')) {
            tabs.push({id: tabs.length, key: 'eligibility', label: 'Eligibility', element: eligibilityTab()});
        }

        if (can('view_applications') && data.applications) {
            tabs.push({id: tabs.length, key: 'applications', label: 'Applications', element: applicationsTab()});
        }

        if (data.delayRequests) {
            tabs.push({id: tabs.length, key: 'delays', label: 'Delays & Corrections', element: delaysTab()});
        }

        if (can('view_database') && data.ledger) {
            tabs.push({id: tabs.length, key: 'database', label: 'Borrowing Database', element: ledgerTab()});
        }

        if (data.editRequests) {
            tabs.push({id: tabs.length, key: 'edits', label: 'Edit Requests', element: editRequestsTab()});
        }

        if (can('edit_policy') && data.settings) {
            tabs.push({id: tabs.length, key: 'settings', label: 'Settings', element: settingsTab()});
        }

        return tabs;
    }, [data, isLoading, scoreData, scoreError, selectedEmployeeLabel, employeePickerFields]);

    const openTabIndex = Math.max(0, tabData.findIndex((tab) => tab.key === openTab));

    const handleTabChange = (tabIndex) => {
        const tab = tabData[tabIndex];

        if (tab) {
            setSearchParams({tab: tab.key});
        }
    };

    const modalTitles = {
        'application': 'New Borrowing Application',
        'application-detail': 'Borrowing Application',
        'approve-plan': modalContext ? `Approve ${modalContext.employeeName} With Changes` : 'Approve With Changes',
        'installment-action': modalContext && modalContext.installmentAction
            ? installmentActionTitles[modalContext.installmentAction] : 'Instalment',
        'delay-review': 'Review Request',
        'edit-review': 'Review Data Change',
        'setting': modalContext ? modalContext.settingName : 'Setting',
        'matrix': modalContext ? `Ceiling for scores ${modalContext.range}` : 'Ceiling Matrix',
        'band': modalContext ? modalContext.name : 'Score Band',
        'capability': modalContext ? `Capability: ${modalContext.name}` : 'Capability',
        'email': modalContext ? `Notification: ${modalContext.name}` : 'Notification',
    };

    const detailSubmitHandlers = {
        'application-detail': decideApplication,
        'delay-review': decideDelay,
        'edit-review': decideEditRequest,
    };

    const modalSubmitHandlers = {
        'application': handleApplicationSubmit,
        'approve-plan': handlePlanSubmit,
        'installment-action': handleInstallmentActionSubmit,
        'setting': handleSettingSubmit,
        'matrix': handleMatrixSubmit,
        'band': handleBandSubmit,
        'capability': handleCapabilitySubmit,
        'email': handleEmailSubmit,
    };

    const renderDetailModalBody = () => {
        if (modalKind === 'application-detail') {
            return renderApplicationDetail();
        }

        if (modalKind === 'delay-review' && modalContext) {
            const asked = modalContext.kind === 'Delay'
                ? `Move ${modalContext.month} out of the schedule. ${delayEffectWording[modalContext.delayEffect] || ''}`
                : `Change ${modalContext.month} from ${modalContext.currentStatus} `
                  + `to ${modalContext.kind === 'Correction to paid' ? 'paid' : 'unpaid'}.`;

            return (
                <div className={"admin-review-details"}>
                    <p>
                        <strong>Type:</strong> {modalContext.kind}
                        {' · '}<strong>Employee:</strong> {modalContext.employee}
                        {' · '}<strong>Instalment:</strong> {modalContext.month}
                        {' · '}<strong>Amount:</strong> {modalContext.amount} EGP
                    </p>

                    <p><strong>What approving does:</strong> {asked}</p>

                    <p>
                        <strong>Reason given:</strong> {modalContext.reason}
                        {' · '}<strong>Requested by:</strong> {modalContext.requestedBy}
                        {' · '}<strong>Status:</strong> {modalContext.status}
                    </p>

                    {modalContext.overCap && (
                        <p className={"admin-inline-error-message"}>
                            This contract has already used every delay it is allowed. Approving needs the override
                            capability and a written reason.
                        </p>
                    )}

                    {modalError && <p className={"admin-inline-error-message"}>{modalError}</p>}
                </div>
            );
        }

        if (modalKind === 'edit-review' && modalContext) {
            const labels = {
                hire_date: 'Hire date',
                basic_salary: 'Basic salary',
                email: 'Email address',
                attendance_band: 'Attendance band',
                attendance_days: 'Days absent',
                approved_amount: 'Approved amount',
                installment_count: 'Number of instalments',
                reason: 'Reason',
            };

            return (
                <div className={"admin-review-details"}>
                    <p>
                        <strong>Target:</strong> {modalContext.targetType} {modalContext.targetKey}
                        {' · '}<strong>Requested by:</strong> {modalContext.requestedBy}
                        {' · '}<strong>Status:</strong> {modalContext.status}
                    </p>

                    <p><strong>Reason given:</strong> {modalContext.reason || '—'}</p>

                    <Table tableData={[
                        ['Field', 'Current', 'Requested'],
                        ...Object.keys(modalContext.changes).map((field) => [
                            labels[field] || field,
                            modalContext.current[field] === '' ? '—' : String(modalContext.current[field]),
                            String(modalContext.changes[field]),
                        ]),
                    ]}
                           reviewMode={true}
                           forceEnglishTable={true}
                           rowClassNames={() => 'admin-diff-changed'}
                    />

                    {modalContext.note && <p><strong>Review note:</strong> {modalContext.note}</p>}

                    {modalError && <p className={"admin-inline-error-message"}>{modalError}</p>}
                </div>
            );
        }

        return null;
    };

    return (
        <>
            <div className={"borrowing-system-management-page"}>
                {tabData.length > 0 && (
                    <TabsPage tabData={tabData}
                              initialTab={0}
                              stickyOnDesktop={false}
                              controlledTab={openTabIndex}
                              onTabChange={handleTabChange}
                              title={"Borrowing System"}/>
                )}

            </div>

            <animated.div style={animateFormModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={closeModal}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>{modalKind ? modalTitles[modalKind] : ''}</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {(modalKind && modalFields != null) && (
                            <Form fields={modalFields}
                                  dynamicSections={modalDynamicSections || undefined}
                                  mailTo={''}
                                  formTitle={`Borrowing ${modalKind} Modal Form`}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  resetFormFromParent={resetModal}
                                  setResetForFromParent={setResetModal}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={modalSubmitHandlers[modalKind]}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={() => closeModal()}
                                  formHasPasswordField={false}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  forceEnglishForm={true}
                                  noClearOption={true}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={modalKind === 'approve-plan'
                                      ? ['Approve With These Terms', 'Saving...']
                                      : ['Save', 'Saving...']}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={modalFooterButtonsRef}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-admin-user-modal-form-cancel-button"} onClick={closeModal}>
                            Cancel
                        </button>
                        <div ref={modalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateOverLimitModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={() => setPendingOverLimit(null)}/>
                <div className={"general-small-admin-action-modal-container"}>
                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>Above the Limit</h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>
                        {pendingOverLimit && (
                            <p>
                                {modalContext && modalContext.employeeName} may take
                                up to {formatMoney(modalContext && modalContext.available)} EGP, and this asks
                                for {formatMoney(pendingOverLimit.requested)} EGP.
                                It can still be submitted, but the board has to grant an exception before it can
                                be approved.
                            </p>
                        )}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>
                        <button onClick={() => setPendingOverLimit(null)}>Cancel</button>

                        <button onClick={async () => {
                            const pending = pendingOverLimit;
                            setPendingOverLimit(null);
                            setModalContext({...modalContext, confirmedOverLimit: true});
                            await submitApplicationValues(pending.values);
                        }}>
                            Submit for a Board Exception
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDetailModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={closeModal}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>{modalKind ? modalTitles[modalKind] : ''}</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {renderDetailModalBody()}

                        {detailFormFields && detailSubmitHandlers[modalKind] && (
                            <Form key={modalKind}
                                  fields={detailFormFields}
                                  mailTo={''}
                                  formTitle={`Borrowing ${modalKind} Decision Form`}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  resetFormFromParent={resetDetailForm}
                                  setResetForFromParent={setResetDetailForm}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={detailSubmitHandlers[modalKind]}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={() => closeModal()}
                                  formHasPasswordField={false}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  forceEnglishForm={true}
                                  noClearOption={true}
                                  noSuccessMessage={true}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={['Save', 'Saving...']}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={detailFooterButtonsRef}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button onClick={closeModal} disabled={modalBusy}>
                            {detailFormFields ? 'Cancel' : 'Close'}
                        </button>
                        <div ref={detailFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default BorrowingSystemManagement;
