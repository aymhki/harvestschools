import PropTypes from 'prop-types';
import {useEffect, useState, useRef, createRef, useId} from "react";
import {Fragment} from "react";
import '../styles/Form.css'
import {v6 as uuidv6} from 'uuid';
import {useSpring, animated} from "react-spring";
import {useCallback} from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import {useFormCache} from "../services/General/UseFormCache.jsx";
import {msgTimeout, turnstileSiteKey, TURNSTILE_SCRIPT_URL, TURNSTILE_SCRIPT_TIMEOUT_MS} from "../services/General/GeneralUtils.jsx";
import {submitFormRequest} from "../services/General/GeneralServices.jsx";
import { useTranslation } from 'react-i18next';
import {createPortal} from "react-dom";


let turnstileScriptPromise = null;

const loadTurnstileScript = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.resolve(false);
    }

    if (window.turnstile) {
        return Promise.resolve(true);
    }

    if (turnstileScriptPromise) {
        return turnstileScriptPromise;
    }

    turnstileScriptPromise = new Promise((resolve) => {
        let settled = false;

        const settle = (loaded) => {
            if (settled) {
                return;
            }

            settled = true;

            if (!loaded) {
                turnstileScriptPromise = null;
            }

            resolve(loaded);
        };

        try {
            const script = document.createElement('script');
            script.src = TURNSTILE_SCRIPT_URL;
            script.async = true;
            script.defer = true;
            script.onload = () => settle(!!window.turnstile);
            script.onerror = () => settle(false);
            document.head.appendChild(script);
            setTimeout(() => settle(!!window.turnstile), TURNSTILE_SCRIPT_TIMEOUT_MS);
        } catch (ignored) {
            settle(false);
        }
    });

    return turnstileScriptPromise;
};

const captchaSeededUnitRandom = (seed, index) => {
    const str = `${seed}_${index}`;
    let h = 2166136261 >>> 0;

    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }

    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;

    return ((h >>> 0) % 100000) / 100000;
};

const ARABIC_MARKS_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

const AR_TO_LAT = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ٱ': 'a', 'ب': 'b', 'ت': 't', 'ث': 's',
    'ج': 'g', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'س': 's',
    'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
    'ق': 'k', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'h', 'و': 'w',
    'ي': 'y', 'ى': 'a', 'ء': '', 'ئ': 'y', 'ؤ': 'w',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

const FRANCO_DIGITS = { '2': '', '3': 'a', '5': 'kh', '6': 't', '7': 'h', '8': 'gh', '9': 's' };

const toTransliterationKey = (text) => {
    let out = '';
    const source = String(text).toLowerCase().replace(ARABIC_MARKS_REGEX, '');
    for (const ch of source) {
        out += Object.prototype.hasOwnProperty.call(AR_TO_LAT, ch) ? AR_TO_LAT[ch] : ch;
    }

    if (/[a-z]/.test(out)) {
        out = out.replace(/[235679 8]/g, (d) => FRANCO_DIGITS[d] ?? d);
    }

    return out
        .replace(/ch/g, 'sh')
        .replace(/th/g, 's')
        .replace(/dh/g, 'z')
        .replace(/ph/g, 'f')
        .replace(/j/g, 'g')
        .replace(/[qc]/g, 'k')
        .replace(/x/g, 'ks')
        .replace(/p/g, 'b')
        .replace(/v/g, 'f')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/(.)\1+/g, '$1')
        .replace(/[aeiou]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const normalizeArabicText = (text) => String(text)
    .replace(ARABIC_MARKS_REGEX, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');



const searchSelectMatches = (choice, query) => {
    const trimmedQuery = String(query || '').trim();
    if (!trimmedQuery) return true;
    const normChoice = normalizeArabicText(choice).toLowerCase();
    const normQuery = normalizeArabicText(trimmedQuery).toLowerCase();
    if (normChoice.includes(normQuery)) return true;
    const choiceKey = toTransliterationKey(choice);
    const queryKey = toTransliterationKey(trimmedQuery);
    return queryKey.length > 0 && choiceKey.includes(queryKey);
};

function Form({
                  fields,
                  mailTo,
                  formTitle,
                  captchaLength = 1,
                  noInputFieldsCache,
                  noCaptcha,
                  hasDifferentOnSubmitBehaviour,
                  differentOnSubmitBehaviour,
                  noClearOption,
                  hasDifferentSubmitButtonText,
                  differentSubmitButtonText,
                  hasDifferentSuccessMessage,
                  differentSuccessMessage,
                  noSuccessMessage,
                  centerSubmitButton,
                  easySimpleCaptcha,
                  fullMarginField,
                  hasSetSubmittingLocal,
                  setSubmittingLocal,
                  resetFormFromParent,
                  setResetForFromParent,
                  formInModalPopup,
                  setShowFormModalPopup,
                  formIsReadOnly,
                  footerButtonsSpaceBetween,
                  switchFooterButtonsOrder,
                  forceEnglishForm,
                  hasDifferentResetBehaviour,
                  differentResetBehaviour,
                  formFooterButtonsAreOutside,
                  footerButtonsPortalTarget,
              }) {

    const [submitting, setSubmitting] = useState(false);
    const [generalFormError, setGeneralFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [dynamicFields, setDynamicFields] = useState(() =>
        fields.map(field => ({ ...field, value: field.value !== undefined ? field.value : '' }))
    );
    const captchaMaxLength = easySimpleCaptcha ? 4 : 6;
    const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghkmnopqrstuvwxyz0123456789@#$%&';
    const [fileInputs, setFileInputs] = useState({});
    const [showSelectDateModal, setShowSelectDateModal] = useState(false);
    const [selectedDateDay, setSelectedDateDay] = useState('');
    const [selectedDateMonth, setSelectedDateMonth] = useState('');
    const [selectedDateYear, setSelectedDateYear] = useState('');
    const [selectedDateFieldID, setSelectedDateFieldID] = useState(null);
    const [selectedDateFieldLabel, setSelectedDateFieldLabel] = useState('');
    const [selectedDateError, setSelectedDateError] = useState('');
    const animateDateModal = useSpring({ opacity: showSelectDateModal ? 1 : 0, transform: showSelectDateModal ? 'translateY(0)' : 'translateY(-100%)' });
    const [showPasswords, setShowPasswords] = useState(false);
    const {loadCachedValues, saveToCache, clearCache} = useFormCache(formTitle, fields);
    const [prefilledInitialized, setPrefilledInitialized] = useState(false);
    const [captchaValue, setCaptchaValue] = useState('');
    const fieldRefs = useRef({});
    const enteredCaptcha = useRef('');
    const captchaCanvasRef = useRef(null);
    const turnstileContainerRef = useRef(null);
    const turnstileWidgetIdRef = useRef(null);
    const turnstileTokenRef = useRef('');
    const [turnstileStatus, setTurnstileStatus] = useState('pending');
    const [refsHaveBeenSet, setRefsHaveBeenSet] = useState(false);
    const [cacheHaveBeenLoaded, setCacheHaveBeenLoaded] = useState(false);
    const { t } = useTranslation(['all-forms'], forceEnglishForm ? { lng: 'en' } : {});
    const formId = useId();
    const [searchSelectSelections, setSearchSelectSelections] = useState({});
    const [searchSelectQueries, setSearchSelectQueries] = useState({});
    const [openSearchSelectId, setOpenSearchSelectId] = useState(null);
    const [searchSelectHighlight, setSearchSelectHighlight] = useState(-1);
    const searchSelectWrapperRefs = useRef({});
    const [searchSelectDropdownRect, setSearchSelectDropdownRect] = useState(null);
    const searchSelectDropdownRef = useRef(null);

    const measureSearchSelectDropdown = useCallback(() => {
        if (openSearchSelectId === null) return;
        const wrapperRef = searchSelectWrapperRefs.current[openSearchSelectId];
        if (!wrapperRef?.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const dropdownMaxHeight = 224; // keep in sync with CSS max-height (14rem)
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < Math.min(dropdownMaxHeight, 160) && rect.top > spaceBelow;
        setSearchSelectDropdownRect({
            left: rect.left,
            width: rect.width,
            top: openUp ? undefined : rect.bottom + 4,
            bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
        });
    }, [openSearchSelectId]);

    const processFieldOnChangeResult = useCallback((field, value) => {

        if (field.onChangeResult) {
            field.onChangeResult.forEach((result) => {
                const fieldToChange = fieldRefs.current[result.idOfTheFieldThatShouldChangeBasedOnThisNewValue];

                if (fieldToChange && fieldToChange.current) {
                    let newValue;
                    if (result.whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue === 'multiply') {
                        newValue = result.firstValueToMultiplyWith * value;
                    } else if (result.whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue === 'add & multiply') {
                        let finalValueToSet = 0;

                        Object.keys(result.fieldIdsToAddAndMultiplyTogether).forEach((key) => {
                            const fieldRef = fieldRefs.current[key];
                            if (fieldRef && fieldRef.current) {
                                const fieldValue = parseFloat(fieldRef.current.value) || 0;
                                const fieldCost = parseFloat(result.fieldIdsToAddAndMultiplyTogether[key]) || 0;
                                finalValueToSet += fieldValue * fieldCost;
                            }
                        });

                        newValue = finalValueToSet;
                    } else if (result.whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue === 'set') {
                        const fieldIdsToCheckIfBiggerThanZero = result.fieldIdsToCheckIfBiggerThanZero;
                        const isAnyFieldBiggerThanZero = fieldIdsToCheckIfBiggerThanZero.some(fieldId => {
                            const fieldRef = fieldRefs.current[fieldId];
                            return fieldRef && fieldRef.current && parseFloat(fieldRef.current.value) > 0;
                        });
                        newValue = isAnyFieldBiggerThanZero ? result.valueToSetOnValuesBiggerThanZero : result.valueToSetOnValuesZero;
                    }

                    if (newValue !== undefined) {
                        if (result.isCurrency) {
                            fieldToChange.current.value = `${newValue} EGP`;
                        } else {
                            fieldToChange.current.value = newValue;
                        }
                    }
                }
            });
        }

    }, []);


    const resetFormCommon = (shouldClearFieldDefaults = false) => {

        if (shouldClearFieldDefaults) {
            const newFields = fields.map(field => ({
                ...field,
                defaultValue: '',
                value: ''
            }));
            setDynamicFields(newFields);
        } else {
            setDynamicFields([...fields]);
        }

        Object.keys(fieldRefs.current).forEach(fieldId => {
            const ref = fieldRefs.current[fieldId];
            if (ref.current) {
                if (ref.current.type === 'checkbox' || ref.current.type === 'radio') {
                    ref.current.checked = false;
                } else {
                    ref.current.value = '';
                }
            }
        });

        setFileInputs({});

        setSearchSelectSelections(() => {
            const cleared = {};
            fields.forEach(f => {
                if (f.type === 'search-select') cleared[f.id] = [];
            });
            return cleared;
        });

        setSearchSelectQueries({});
        setOpenSearchSelectId(null);
        setSearchSelectHighlight(-1);
        setCaptchaValue(generateCaptcha());

        enteredCaptcha.current = '';
        turnstileTokenRef.current = '';

        if (turnstileWidgetIdRef.current !== null && typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.reset === 'function') {
            try {
                window.turnstile.reset(turnstileWidgetIdRef.current);
            } catch (ignored) {
                console.log(ignored);
            }
        }

        setGeneralFormError('');
        setSuccessMessage('');

        if (hasSetSubmittingLocal) {
            setSubmittingLocal(false);
        }
        if (!shouldClearFieldDefaults && prefilledInitialized) {
            setPrefilledInitialized(false);
        }
    };

    const resetFormCompletely = useCallback(() => {
        resetFormCommon(false);
    }, [fields]);

    useEffect(() => {
        setDynamicFields(currentFields =>
            currentFields.map(currentField => {
                const newFieldData = fields.find(f => f.id === currentField.id);
                if (newFieldData) {
                    return {
                        ...currentField,
                        label: newFieldData.label,
                        displayLabel: newFieldData.displayLabel,
                        placeholder: newFieldData.placeholder,
                        errorMsg: newFieldData.errorMsg,
                        choices: newFieldData.choices,
                        value: newFieldData.value !== undefined ? newFieldData.value : currentField.value,
                    };
                }
                return currentField;
            })
        );
    }, [t, fields]);

    const resetForm = () => {
        resetFormCompletely();
        clearCache();

        if (hasDifferentResetBehaviour) {
            differentResetBehaviour()
        }
    }

    const generateCaptcha = useCallback(() => {
        let captcha = '';

        for (let i = 0; i < captchaMaxLength; i++) {
            captcha += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        return captcha;
    }, [captchaMaxLength, characters])

    const getWidthClass = (widthOfField) => {
        if (widthOfField === 1) return fullMarginField ? 'full-width-with-margin' : 'full-width';
        if (widthOfField === 1.5) return 'two-thirds-width';
        if (widthOfField === 2) return 'half-width';
        return 'third-width';
    };

    const getCommonInputProps = (field) => ({
        id: field.id,
        name: field.httpName,
        required: field.required,
        disabled: submitting,
        readOnly: field.readOnlyField || formIsReadOnly || submitting || false,
        onChange: (e) => onChange(e, field),
        ref: fieldRefs.current[field.id],
        defaultValue: field.defaultValue || '',
        ...(field.lang !== undefined && { lang: field.lang })
    });

    const expandAutoSelectDependents = (autoSelect, choiceName, visited = new Set()) => {
        if (!autoSelect || !Object.prototype.hasOwnProperty.call(autoSelect, choiceName) || visited.has(choiceName)) {
            return [];
        }
        visited.add(choiceName);
        let dependents = [];
        (autoSelect[choiceName] || []).forEach(dep => {
            dependents.push(dep);
            dependents = dependents.concat(expandAutoSelectDependents(autoSelect, dep, visited));
        });
        return dependents;
    };


    const getPlaceholder = (field) =>
        `${field.placeholder || getWhichLabelToUse(field)}${field.required ? '*' : ''}`;

    const getLabelText = (field) =>
        `${getWhichLabelToUse(field)}${field.required ? '*' : ''}`;

    const getWhichLabelToUse = (field) => {
        if (field.displayLabel !== undefined && field.displayLabel.length > 0) {
            return field.displayLabel;
        } else {
            return field.label;
        }
    }

    const renderLabel = (field, htmlFor = field.id) => (
        <label htmlFor={htmlFor} className="form-label-outside">
            {getLabelText(field)}
        </label>
    );

    const renderWithOptionalLabel = (field, children) => {
        const widthClass = getWidthClass(field.widthOfField);

        if (field.labelOutside && field.labelOnTop) {
            return (
                <div className={`field-with-label-on-top ${widthClass} ${field.alwaysEnglish ? 'always-english' : ''}`}>
                    {renderLabel(field)}
                    {children}
                </div>
            );
        }

        return children;
    };

    const renderTextInput = (field, type = field.type) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);

        const inputProps = {
            ...baseProps,
            type,
            placeholder: getPlaceholder(field),
            className: `text-form-field ${field.readOnlyField ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''}`,
        };

        if (field.dontLetTheBrowserSaveField) {
            inputProps.name = 'hidden';
            inputProps.autoComplete = 'new-password';
            inputProps['data-lpignore'] = 'true';
        }

        const input = <input {...inputProps} className={`${inputProps.className} ${!field.labelOutside || !field.labelOnTop ? widthClass : ''}`}/>;

        return renderWithOptionalLabel(field, input);
    };

    const renderNumberInput = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);

        const handleNumberChange = (delta) => (e) => {
            e.preventDefault();
            const ref = fieldRefs.current[field.id];
            const hasMax = field.maximumValue !== undefined && field.maximumValue !== null;
            const hasMin = field.minimumValue !== undefined && field.minimumValue !== null;

            if (ref && ref.current) {
                const currentValue = parseInt(ref.current.value) || 0;

                if ((
                    ( (currentValue + delta <= field.maximumValue) || !hasMax ) &&
                    ( (currentValue + delta >= field.minimumValue) || !hasMin ) &&
                    ( !isNaN(currentValue + delta) )
                )) {
                    ref.current.value = currentValue + delta;
                    ref.current.setCustomValidity('');


                    processFieldOnChangeResult(field, currentValue + delta);

                    if (!noInputFieldsCache) {
                        saveToCache(field, currentValue + delta);
                    }
                }

            }
        };

        const numberInput = (
            <div className={`number-input-container ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${ (field.readOnlyField || formIsReadOnly || submitting) ? 'read-only-field' : ''} ${(field.alwaysEnglish) ? 'always-english' : ''}`}>
                <button className="number-input-reduce-button" type="button" onClick={handleNumberChange(-1)}
                        disabled={field.readOnlyField || submitting || formIsReadOnly || false}
                >
                    <span><RemoveIcon/></span>
                </button>

                <input
                    {...baseProps}
                    type="text"
                    placeholder={getPlaceholder(field)}
                    className={`number-form-field ${ (field.readOnlyField || formIsReadOnly || submitting) ? 'read-only-field' : ''} ${(field.alwaysEnglish) ? 'always-english' : ''}`}
                    min={field.minimumValue || ''}
                    max={field.maximumValue || ''}
                />

                <button className="number-input-add-button" type="button" onClick={handleNumberChange(1)}
                        disabled={field.readOnlyField || submitting || formIsReadOnly || false}
                >
                    <span><AddIcon/></span>
                </button>
            </div>
        );

        return renderWithOptionalLabel(field, numberInput);
    };

    const renderPasswordInput = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);

        const inputProps = {
            ...baseProps,
            type: field.dontLetTheBrowserSaveField ? "text" : (showPasswords ? "text" : "password"),
            placeholder: getPlaceholder(field),
            className: `text-form-field ${(!showPasswords && field.dontLetTheBrowserSaveField) ? 'txtPassword' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`
        };

        if (field.dontLetTheBrowserSaveField) {
            inputProps.name = 'hidden';
            inputProps.autoComplete = 'new-password';
            inputProps['data-lpignore'] = 'true';
        }

        const passwordField = (
            <div className={`password-field-wrapper ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.alwaysEnglish ? 'always-english' : ''}`}>
                <input {...inputProps} />
                <button
                    type="button"
                    className="toggle-password-visibility"
                    onClick={() => setShowPasswords(!showPasswords)}
                    aria-label={showPasswords ? "Hide password" : "Show password"}
                    tabIndex="-1"
                >
                    {showPasswords ? <VisibilityOffIcon/> : <VisibilityIcon/>}
                </button>
            </div>
        );

        return renderWithOptionalLabel(field, passwordField);
    };

    const renderDateInput = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);

        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                setShowSelectDateModal(false);
                // setSelectedDateMonth('');
                // setSelectedDateDay('');
                // setSelectedDateYear('');
                setSelectedDateError('');

                // const ref = fieldRefs.current[selectedDateFieldID];
                //
                // if (ref && ref.current) {
                //     ref.current.value = '';
                // }
            }
        };

        const dateInput = (
            <input
                {...baseProps}
                type="text"
                placeholder={`${field.placeholder ? field.placeholder + t("all-forms.year-month-day") : getWhichLabelToUse(field) + t("all-forms.year-month-day")}${field.required ? '*' : ''}`}
                readOnly={true}
                onFocus={() => showSelectDateModalForField(field.id, getWhichLabelToUse(field), fieldRefs.current[field.id]?.current?.value)}
                onKeyDown={handleKeyDown}
                className={`text-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
            />
        );

        return renderWithOptionalLabel(field, dateInput);
    };

    const renderTextarea = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);

        const textarea = (
            <textarea
                {...baseProps}
                placeholder={getPlaceholder(field)}
                className={`textarea-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.large ? 'large-height-textarea' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
            />
        );

        return renderWithOptionalLabel(field, textarea);
    };

    const renderMultipleSelectCheckboxGrid = (field) => {
        const widthClass = getWidthClass(field.widthOfField);

        if (!fieldRefs.current[field.id]) {
            fieldRefs.current[field.id] = createRef();
        }

        const parseValues = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            return String(val).split(',').map(v => v.trim()).filter(Boolean);
        };

        const selectedValues = parseValues(field.defaultValue || field.value || '');

        const updateHiddenInput = () => {
            const checked = [];

            (field.choices || []).forEach((choice, i) => {
                const r = fieldRefs.current[`${field.id}_${i}`];
                if (r?.current?.checked) checked.push(choice);
            });

            const commaValue = checked.join(',');

            const hiddenRef = fieldRefs.current[field.id];
            if (hiddenRef?.current) hiddenRef.current.value = commaValue;

            setGeneralFormError('');
            setSuccessMessage('');

            if (!noInputFieldsCache) saveToCache(field, commaValue);

            const newFields = processFieldRules(dynamicFields, field, commaValue);
            setDynamicFields(newFields);

            processFieldOnChangeResult(field, commaValue);
        };

        const handleChoiceChange = (choice, isChecked) => {
            if (field.autoSelect) {
                const dependents = expandAutoSelectDependents(field.autoSelect, choice);
                dependents.forEach(dep => {
                    const depIndex = (field.choices || []).indexOf(dep);
                    if (depIndex !== -1) {
                        const r = fieldRefs.current[`${field.id}_${depIndex}`];
                        if (r?.current) r.current.checked = isChecked;
                    }
                });
            }
            updateHiddenInput();
        };

        const orderedChoices = field.autoSelect
            ? [...(field.choices || [])].sort((a, b) => {
                const aIsSmart = Object.prototype.hasOwnProperty.call(field.autoSelect, a) ? 0 : 1;
                const bIsSmart = Object.prototype.hasOwnProperty.call(field.autoSelect, b) ? 0 : 1;
                return aIsSmart - bIsSmart;
            })
            : (field.choices || []);

        const checkAll = () => {
            (field.choices || []).forEach((_, i) => {
                const r = fieldRefs.current[`${field.id}_${i}`];
                if (r?.current) r.current.checked = true;
            });
            updateHiddenInput();
        };

        const uncheckAll = () => {
            (field.choices || []).forEach((_, i) => {
                const r = fieldRefs.current[`${field.id}_${i}`];
                if (r?.current) r.current.checked = false;
            });
            updateHiddenInput();
        };

        const grid = (
            <div className={`select-multiple-form-field checkbox-grid-wrapper ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''}`}>
                <input
                    type="hidden"
                    id={field.id}
                    name={field.httpName}
                    ref={fieldRefs.current[field.id]}
                    defaultValue={selectedValues.join(',')}
                />

                {!field.readOnlyField && !formIsReadOnly && (
                    <div className="checkbox-grid-controls">
                        <button type="button" onClick={checkAll}   disabled={submitting}>Select all</button>
                        <button type="button" onClick={uncheckAll} disabled={submitting}>Clear all</button>
                    </div>
                )}

                {orderedChoices.map((choice) => {
                    const i = (field.choices || []).indexOf(choice);
                    const choiceRefKey = `${field.id}_${i}`;
                    if (!fieldRefs.current[choiceRefKey]) fieldRefs.current[choiceRefKey] = createRef();
                    return (
                        <label key={choiceRefKey} className="checkbox-grid-item">
                            <input
                                type="checkbox"
                                value={choice}
                                disabled={submitting || field.readOnlyField || formIsReadOnly}
                                ref={fieldRefs.current[choiceRefKey]}
                                defaultChecked={selectedValues.includes(choice)}
                                onChange={(e) => handleChoiceChange(choice, e.target.checked)}
                            />
                            {choice}
                        </label>
                    );
                })}

            </div>
        );

        return renderWithOptionalLabel(field, grid);
    };

    const renderSelect = (field) => {
        if (field.multiple) {
            return renderMultipleSelectCheckboxGrid(field);
        }

        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);

        const selectElement = (
            <select
                {...baseProps}
                multiple={field.multiple}
                className={
                    field.multiple ?
                        `select-multiple-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''}` :
                        `select-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''}`
                }
            >
                {!field.multiple && <option value="">{getLabelText(field)}</option>}
                {field.choices && field.choices.map((choice, index) => (
                    <option key={index} value={choice}>{choice}</option>
                ))}
            </select>
        );

        return renderWithOptionalLabel(field, selectElement);
    };

    const renderChoiceInputs = (field, type) => {
        const widthClass = getWidthClass(field.widthOfField);

        return field.choices && field.choices.map((choice, index) => {
            const choiceRefKey = `${field.id}_${index}`;
            if (!fieldRefs.current[choiceRefKey]) {
                fieldRefs.current[choiceRefKey] = createRef();
            }

            return (
                <label key={index}>
                    <input
                        type={type}
                        id={field.id}
                        name={field.httpName}
                        required={field.required}
                        value={choice}
                        disabled={submitting}
                        className={`${type}-form-field ${widthClass}`}
                        onChange={(e) => onChange(e, field)}
                        defaultChecked={(!field.readOnlyField && field.value) ? field.value === choice : false}
                        ref={fieldRefs.current[choiceRefKey]}
                    />
                    {choice}
                </label>
            );
        });
    };

    const renderFileInput = (field) => {
        const widthClass = getWidthClass(field.widthOfField);

        if (!fieldRefs.current[field.id]) {
            fieldRefs.current[field.id] = createRef();
        }

        return (
            <div className={`file-form-field-styled ${widthClass}`} >
                <label htmlFor={field.id}>
                    {getLabelText(field)}
                </label>
                <div className="file-form-field-styled-buttons-wrapper">
                    <button type="button" disabled={submitting}
                            onClick={() => {
                                const ref = fieldRefs.current[field.id];
                                if (ref && ref.current) {
                                    ref.current.click();
                                }
                            }}
                    >
                        {t("all-forms.upload")}
                    </button>
                    {fileInputs[field.id] && (
                        <button
                            className="remove-button"
                            onClick={(e) => {
                                e.preventDefault();
                                field.file = null;
                                setFileInputs(prev => ({...prev, [field.id]: null}));

                                const ref = fieldRefs.current[field.id];
                                if (ref && ref.current) {
                                    ref.current.value = '';
                                }
                            }}
                            type="button"
                            disabled={submitting}
                        >
                            {t("all-forms.remove")}
                        </button>
                    )}
                </div>
                <label>
                    {fileInputs[field.id]
                        ? (fileInputs[field.id].name.length > 20
                                ? fileInputs[field.id].name.substring(0, 20) + '...'
                                : fileInputs[field.id].name
                        )
                        : 'No file selected'
                    }
                </label>
                <input
                    type="file"
                    className="file-form-field"
                    id={field.id}
                    name={field.httpName}
                    label={field.label}
                    required={field.required}
                    accept={field.allowedFileTypes ? field.allowedFileTypes.join(',') : ''}
                    disabled={submitting}
                    onChange={(e) => onChange(e, field)}
                    ref={fieldRefs.current[field.id]}
                />
                <label>Maximum file size: 2MB</label>
            </div>
        );
    };

    const renderButton = (field) => {
        const widthClass = getWidthClass(field.widthOfField);

        return (
            <button
                className={`form-button ${widthClass}`}
                onClick={(e) => field.onClick(e, field)}
                type="button"
                disabled={submitting}
                id={field.id}
            >
                {field.label}
            </button>
        );
    };

    const renderSection = ( field ) => {
        const widthClass = getWidthClass(field.widthOfField);


        return (
            <div className= {`form-title-section ${widthClass}`}
                 ref={fieldRefs.current[field.id]}
                 id={field.id}>
                <h3>
                    {getWhichLabelToUse(field)}
                </h3>
            </div>
        );
    }

    const renderFieldBasedOnType = (field) => {
        if (field.type === 'hidden') {
            if (!fieldRefs.current[field.id]) {
                fieldRefs.current[field.id] = createRef();
            }

            return (
                <input
                    type="hidden"
                    id={field.id}
                    name={field.httpName}
                    defaultValue={field.defaultValue || ''}
                    ref={fieldRefs.current[field.id]}
                />
            );
        }
        return (
            <Fragment key={String(field.id)}>
                {(field.labelOutside && !field.labelOnTop) && renderLabel(field)}
                {(['text', 'email', 'tel', 'time'].includes(field.type)) && renderTextInput(field)}
                {field.type === 'number' && renderNumberInput(field)}
                {field.type === 'password' && renderPasswordInput(field)}
                {field.type === 'date' && renderDateInput(field)}
                {field.type === 'textarea' && renderTextarea(field)}
                {field.type === 'select' && renderSelect(field)}
                {field.type === 'radio' && renderChoiceInputs(field, 'radio')}
                {field.type === 'checkbox' && renderChoiceInputs(field, 'checkbox')}
                {field.type === 'search-select' && renderSearchSelect(field)}
                {field.type === 'file' && renderFileInput(field)}
                {field.type === 'button' && renderButton(field)}
                {field.type === 'section' && ( renderSection(field) ) }
            </Fragment>
        );
    };

    const handleCopy = (event) => {
        event.preventDefault();
    };

    const handleCut = (event) => {
        event.preventDefault();
    };

    const handlePaste = (event) => {
        event.preventDefault();
    };

    const handleMouseDown = (event) => {
        event.preventDefault();
    };

    const handleKeyDown = (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    };

    const showSelectDateModalForField = (fieldID, fieldLabel, currentValue) => {
        setSelectedDateFieldID(fieldID);
        setSelectedDateFieldLabel(fieldLabel);

        if (currentValue) {
            const [year, month, day] = currentValue.split('-');
            setSelectedDateYear(year || '');
            setSelectedDateMonth(month ? String(parseInt(month, 10)) : '');
            setSelectedDateDay(day ? String(parseInt(day, 10)) : '');
        } else {
            setSelectedDateYear('');
            setSelectedDateMonth('');
            setSelectedDateDay('');
        }

        setShowSelectDateModal(true);
    }

    const parseSearchSelectValues = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return String(val).split(',').map(v => v.trim()).filter(Boolean);
    };

    const getSearchSelectSelected = (field) => {
        if (field.readOnlyField || formIsReadOnly) {
            return parseSearchSelectValues(field.value || field.defaultValue || '');
        }
        if (searchSelectSelections[field.id] !== undefined) {
            return searchSelectSelections[field.id];
        }
        return parseSearchSelectValues(field.defaultValue || field.value || '');
    };

    const applySearchSelectSelection = (field, selected) => {
        setSearchSelectSelections(prev => ({ ...prev, [field.id]: selected }));
        const commaValue = selected.join(',');
        const hiddenRef = fieldRefs.current[field.id];
        if (hiddenRef?.current) hiddenRef.current.value = commaValue;
        setGeneralFormError('');
        setSuccessMessage('');
        if (!noInputFieldsCache) {
            saveToCache(field, commaValue);
        }
        const newFields = processFieldRules(dynamicFields, field, commaValue);
        setDynamicFields(newFields);
        processFieldOnChangeResult(field, commaValue);
    };

    const renderSearchSelect = (field) => {
        const widthClass = getWidthClass(field.widthOfField);

        if (!fieldRefs.current[field.id]) fieldRefs.current[field.id] = createRef();
        if (!searchSelectWrapperRefs.current[field.id]) searchSelectWrapperRefs.current[field.id] = createRef();

        const isFieldReadOnly = field.readOnlyField || formIsReadOnly || submitting;
        const selected = getSearchSelectSelected(field);
        const typedQuery = searchSelectQueries[field.id];
        const filterText = typedQuery ?? '';
        const displayText = typedQuery ?? (!field.multiple ? (selected[0] || '') : '');
        const isOpen = openSearchSelectId === field.id && !isFieldReadOnly;

        const filteredChoices = (field.choices || []).filter(choice =>
            (!field.multiple || !selected.includes(choice)) && searchSelectMatches(choice, filterText)
        );

        const clearQuery = () => setSearchSelectQueries(prev => {
            const next = { ...prev };
            delete next[field.id];
            return next;
        });

        const closeDropdown = () => {
            setOpenSearchSelectId(null);
            setSearchSelectHighlight(-1);
            clearQuery();
        };

        const openDropdown = () => {
            if (!isFieldReadOnly) {
                setOpenSearchSelectId(field.id);
                setSearchSelectHighlight(-1);
            }
        };

        const pickChoice = (choice) => {
            if (field.multiple) {
                if (!selected.includes(choice)) {
                    applySearchSelectSelection(field, [...selected, choice]);
                }

                clearQuery();
                setSearchSelectHighlight(-1);

            } else {
                applySearchSelectSelection(field, [choice]);
                closeDropdown();
            }
        };

        const removeChoice = (choice) => {
            applySearchSelectSelection(field, selected.filter(c => c !== choice));
        };

        const handleInputChange = (e) => {
            setSearchSelectQueries(prev => ({ ...prev, [field.id]: e.target.value }));
            setSearchSelectHighlight(0);
            if (openSearchSelectId !== field.id) setOpenSearchSelectId(field.id);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!isOpen) { openDropdown(); setSearchSelectHighlight(0); return; }
                setSearchSelectHighlight(h => (filteredChoices.length === 0 ? -1 : Math.min(h + 1, filteredChoices.length - 1)));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSearchSelectHighlight(h => Math.max(h - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (isOpen && searchSelectHighlight >= 0 && filteredChoices[searchSelectHighlight]) {
                    pickChoice(filteredChoices[searchSelectHighlight]);
                } else if (isOpen && filteredChoices.length === 1) {
                    pickChoice(filteredChoices[0]);
                } else {
                    const exactMatch = (field.choices || []).find(
                        c => String(c).toLowerCase() === String(displayText).trim().toLowerCase()
                    );
                    if (exactMatch) pickChoice(exactMatch);
                }
            } else if (e.key === 'Escape' || e.key === 'Tab') {
                closeDropdown();
            } else if (e.key === 'Backspace' && field.multiple && !filterText && selected.length > 0 && !isFieldReadOnly) {
                removeChoice(selected[selected.length - 1]);
            }
        };

        const markup = (
            <div
                className={`search-select-wrapper ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${isFieldReadOnly ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''}`}
                ref={searchSelectWrapperRefs.current[field.id]}
                {...(field.lang !== undefined && { lang: field.lang })}
            >
                <input
                    type="hidden"
                    id={field.id}
                    name={field.httpName}
                    ref={fieldRefs.current[field.id]}
                    defaultValue={selected.join(',')}
                />
                <div
                    className="search-select-input-area"
                    onClick={(e) => {
                        openDropdown();
                        e.currentTarget.querySelector('.search-select-search-input')?.focus();
                    }}
                >
                    {field.multiple && selected.map(choice => (
                        <span key={choice} className="search-select-tag">
                        <span className="search-select-tag-label">{choice}</span>
                            {!isFieldReadOnly && (
                                <button
                                    type="button"
                                    className="search-select-tag-remove"
                                    aria-label={`${t('all-forms.remove')} ${choice}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={(e) => { e.stopPropagation(); removeChoice(choice); }}
                                >
                                    ×
                                </button>
                            )}
                    </span>
                    ))}
                    <input
                        type="text"
                        className="search-select-search-input"
                        id={`${field.id}_search`}
                        value={displayText}
                        placeholder={selected.length === 0 ? getPlaceholder(field) : ''}
                        disabled={submitting}
                        readOnly={isFieldReadOnly}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-autocomplete="list"
                        onFocus={openDropdown}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {isOpen && searchSelectDropdownRect && createPortal(
                    <ul
                        className={`search-select-dropdown ${field.alwaysEnglish ? 'always-english' : ''}`}
                        style={{
                            left: searchSelectDropdownRect.left,
                            right: 'auto',
                            width: searchSelectDropdownRect.width,
                            top: searchSelectDropdownRect.top,
                            bottom: searchSelectDropdownRect.bottom,
                        }}
                        role="listbox"
                        ref={searchSelectDropdownRef}
                        {...(field.lang !== undefined && { lang: field.lang })}
                    >
                        {filteredChoices.length === 0 && (
                            <li className="search-select-no-results">{t('all-forms.no-results')}</li>
                        )}
                        {filteredChoices.map((choice, index) => (
                            <li
                                key={choice}
                                role="option"
                                aria-selected={!field.multiple && selected[0] === choice}
                                className={`search-select-option ${index === searchSelectHighlight ? 'highlighted' : ''} ${!field.multiple && selected[0] === choice ? 'selected' : ''}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickChoice(choice)}
                                onMouseEnter={() => setSearchSelectHighlight(index)}
                            >
                                {choice}
                            </li>
                        ))}
                    </ul>,
                    document.body
                )}
            </div>
        );
        return renderWithOptionalLabel(field, markup);
    };

    const handleDateSelection = (day, month, year) => {
        if (!day || !month || !year) {
            setSelectedDateError( 'Please select a valid date');
            setTimeout(() => {
                setSelectedDateError('');
            }, msgTimeout);
            return;
        }
        if (day < 10) {
            day = `0${day}`;
        }
        if (month < 10) {
            month = `0${month}`;
        }
        setSelectedDateDay(day);
        setSelectedDateMonth(month);
        setSelectedDateYear(year);
        const dateValue = `${year}-${month}-${day}`;
        const ref = fieldRefs.current[selectedDateFieldID];

        if (ref && ref.current) {
            ref.current.value = dateValue;
        }

        setSelectedDateMonth('');
        setSelectedDateDay('');
        setSelectedDateYear('');
        setShowSelectDateModal(false);

        if (!noInputFieldsCache) {
            saveToCache({id: selectedDateFieldID, label: selectedDateFieldLabel}, dateValue);
        }
    }

    const processFieldRules = useCallback((currentFields, field, value) => {
        if (field.rules) {

            const rule = field.rules.find(r => r.value === value);

            if (rule) {
                const newFields = currentFields.filter(f => {
                    let keep = true;
                    field.rules.forEach(rule => {
                        rule.ruleResult.forEach(newField => {
                            if (newField.name === f.name) {
                                keep = false;
                            } else if (newField.rules) {
                                newField.rules.forEach(subRule => {
                                    subRule.ruleResult.forEach(subNewField => {
                                        if (subNewField.name === f.name) {
                                            keep = false;
                                        }
                                    });
                                });
                            }
                        });
                    });
                    return keep;
                });

                const currentIndex = newFields.findIndex(f => f.name === field.name);

                rule.ruleResult.forEach(newField => {
                    newFields.splice(currentIndex + 1, 0, newField);
                });

                return newFields;

            } else {

                return currentFields.filter(f => {
                    let keep = true;
                    field.rules.forEach(rule => {
                        rule.ruleResult.forEach(newField => {
                            if (newField.name === f.name) {
                                keep = false;
                            } else if (newField.rules) {
                                newField.rules.forEach(subRule => {
                                    subRule.ruleResult.forEach(subNewField => {
                                        if (subNewField.name === f.name) {
                                            keep = false;
                                        }
                                    });
                                });
                            }
                        });
                    });

                    return keep;
                });
            }
        }

        return currentFields;
    }, []);

    const onChange = (e, field) => {
        const maxSizeInBytes = 2 * 1024 * 1024;
        const value = (field.type === 'radio' || field.type === 'checkbox') ? e.target.checked : e.target.value;

        if (field.type === 'number' && (isNaN(value) || (field.minimumValue && Number(value) < field.minimumValue) || (field.maximumValue && Number(value) > field.maximumValue))) {
            e.target.setCustomValidity(`Value must be a number between ${field.minimumValue} and ${field.maximumValue}`);
        } else if (field.type === 'file' && e.target.files[0].size > maxSizeInBytes) {
            e.target.setCustomValidity('File size must be less than 2MB');
        } else if (field.type === 'file' && !field.allowedFileTypes.includes(e.target.files[0].type)) {
            e.target.setCustomValidity(`File type must be one of the following: ${field.allowedFileTypes.join(', ')}`);
        } else if (field.type === 'file') {
            const file = e.target.files[0];
            e.target.setCustomValidity('');
            setGeneralFormError('');
            setSuccessMessage('');
            setFileInputs(prev => ({...prev, [field.id]: file}));
            field.file = file;
        } else {
            if (field.regex && !new RegExp(field.regex).test(value)) {
                e.target.setCustomValidity(field.errorMsg);
                e.target.reportValidity();
            } else {
                e.target.setCustomValidity('');
                e.target.reportValidity();
                setGeneralFormError('');
                setSuccessMessage('');

                if (!noInputFieldsCache) {
                    saveToCache(field, value);
                }
            }

            const newFields = processFieldRules(dynamicFields, field, value);
            setDynamicFields(newFields);

            processFieldOnChangeResult(field, value);
        }
    }

    const onSubmit = async (e) => {
        e.preventDefault();

        if (submitting) {
            return;
        }

        if (!noCaptcha) {
            if (turnstileStatus === 'failed') {
                if (enteredCaptcha.current && enteredCaptcha.current.value !== captchaValue) {
                    setGeneralFormError(t('all-forms.captcha-error'));
                    setTimeout(() => {
                        setGeneralFormError('');
                    }, msgTimeout);
                    return;
                }
            } else if (!turnstileTokenRef.current) {
                setGeneralFormError(t('all-forms.human-verification-pending'));
                setTimeout(() => {
                    setGeneralFormError('');
                }, msgTimeout);
                return;
            }
        }

        for (let i = 0; i < dynamicFields.length; i++) {
            if (dynamicFields[i].mustMatchFieldWithId) {
                const field1Ref = fieldRefs.current[dynamicFields[i].id];
                const field2Ref = fieldRefs.current[dynamicFields[i].mustMatchFieldWithId];

                if (field1Ref?.current && field2Ref?.current) {
                    const firstValue = field1Ref.current.value;
                    const secondValue = field2Ref.current.value;

                    if (firstValue && secondValue) {
                        if (firstValue !== secondValue) {
                            const field1 = getWhichLabelToUse(dynamicFields[i]);
                            const field2 = getWhichLabelToUse(dynamicFields.find(field => field.id === dynamicFields[i].mustMatchFieldWithId));

                            setGeneralFormError( t('all-forms.fields-must-match-error', {field1: field1, field2: field2} ) );

                            setTimeout(() => {
                                setGeneralFormError('');
                            }, msgTimeout);

                            return;
                        }
                    }
                }
            }

            if (dynamicFields[i].mustNotMatchFieldWithId) {
                const field1Ref = fieldRefs.current[dynamicFields[i].id];
                const field2Ref = fieldRefs.current[dynamicFields[i].mustNotMatchFieldWithId];

                if (field1Ref?.current && field2Ref?.current) {
                    const firstValue = field1Ref.current.value;
                    const secondValue = field2Ref.current.value;

                    if (firstValue && secondValue) {
                        if (firstValue === secondValue) {
                            const field1 = getWhichLabelToUse(dynamicFields[i]);
                            const field2 = getWhichLabelToUse(dynamicFields.find(field => field.id === dynamicFields[i].mustNotMatchFieldWithId));

                            setGeneralFormError( t('all-forms.fields-must-not-match-error', {field1: field1, field2: field2} ) );

                            setTimeout(() => {
                                setGeneralFormError('');
                            }, msgTimeout);

                            return;
                        }
                    }
                }
            }

            if (dynamicFields[i].type === 'select' && dynamicFields[i].multiple && dynamicFields[i].required) {

                const selected = [];

                (dynamicFields[i].choices || []).forEach((choice, j) => {
                    const choiceRef = fieldRefs.current[`${dynamicFields[i].id}_${j}`];
                    if (choiceRef?.current?.checked) selected.push(choice);
                });


                if (selected.length === 0) {
                    setGeneralFormError( t('all-forms.field-required', { field1: getWhichLabelToUse(dynamicFields[i]) } ) );
                    setTimeout(() => setGeneralFormError(''), msgTimeout);
                    return;
                }

            }

            if (dynamicFields[i].type === 'search-select' && dynamicFields[i].required) {
                if (getSearchSelectSelected(dynamicFields[i]).length === 0) {
                    setGeneralFormError(t('all-forms.field-required', { field1: getWhichLabelToUse(dynamicFields[i]) }));
                    setTimeout(() => setGeneralFormError(''), msgTimeout);
                    return;
                }
            }
        }

        setSubmitting(true);

        if (hasSetSubmittingLocal) {
            setSubmittingLocal(true);
        }

        setGeneralFormError('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            dynamicFields.forEach(field => {
                let value;

                if (field.type === 'file' && field.file) {
                    const file = field.file;
                    const fileExtension = file.name.split('.').pop();
                    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                    const uniqueFileName = `${fileNameWithoutExt}-${uuidv6()}.${fileExtension}`;
                    const renamedFile = new File([file], uniqueFileName, {type: file.type});
                    value = uniqueFileName;
                    formData.append(`uniqueFileName_${field.label}`, uniqueFileName);
                    formData.append(field.label, renamedFile, uniqueFileName);
                } else {
                    const ref = fieldRefs.current[field.id];
                    if (ref && ref.current) {

                        if (field.type === 'checkbox' || field.type === 'radio') {

                            value = ref.current.checked ? ref.current.value : '';

                        } else if (field.type === 'select' && field.multiple) {

                            if (field.readOnlyField || formIsReadOnly) {

                                const vals = Array.isArray(field.value) ? field.value : String(field.value || '').split(',').map(v => v.trim()).filter(Boolean);
                                value = vals.join(',');

                            } else {

                                const selected = [];

                                (field.choices || []).forEach((choice, i) => {
                                    const choiceRef = fieldRefs.current[`${field.id}_${i}`];
                                    if (choiceRef?.current?.checked) selected.push(choice);
                                });

                                value = selected.join(',');
                            }

                        } else if (field.type === 'search-select') {
                            value = getSearchSelectSelected(field).join(',');
                        } else {
                            value = ref.current.value || '';
                        }
                    } else {
                        value = field.readOnlyField ? (field.value || '') : '';
                    }
                }

                formData.append(`field_${field.id}`, value);
                formData.append(`label_${field.id}`, field.label);
            });

            formData.append('mailTo', mailTo);
            formData.append('formTitle', formTitle);

            if (!noCaptcha && turnstileTokenRef.current) {
                formData.append('cf-turnstile-response', turnstileTokenRef.current);
            }

            if (hasDifferentOnSubmitBehaviour && differentOnSubmitBehaviour) {
                try {
                    const result = await differentOnSubmitBehaviour(formData);

                    if (result) {
                        const resolvedMessage = typeof result === 'string' ? result : hasDifferentSuccessMessage ? differentSuccessMessage : t('all-forms.success-message');
                        const showMessage = !noSuccessMessage && !!resolvedMessage;

                        if (showMessage) {
                            setSuccessMessage(resolvedMessage);
                        }

                        setTimeout(() => {
                            setSuccessMessage('');
                            resetFormCompletely();
                            clearCache();
                        }, showMessage ? msgTimeout : 0);
                    }
                } catch (error) {
                    setGeneralFormError(error.message || ( t('all-forms.general-error')));
                    setTimeout(() => {
                        setGeneralFormError('');
                    }, msgTimeout);

                    turnstileTokenRef.current = '';
                    if (!noCaptcha && turnstileWidgetIdRef.current !== null && window.turnstile && typeof window.turnstile.reset === 'function') {
                        try {
                            window.turnstile.reset(turnstileWidgetIdRef.current);
                        } catch (error) {
                            console.log(error);
                        }
                    }

                    setSubmitting(false);

                    if (hasSetSubmittingLocal) {
                        setSubmittingLocal(false)
                    }
                }
            } else {
                try {
                    const result = await submitFormRequest(formData)
                    if (result.success) {
                        if (!noSuccessMessage) {
                            setSuccessMessage(hasDifferentSuccessMessage
                                ? differentSuccessMessage
                                : t('all-forms.success-message'));
                        }
                        setTimeout(() => {
                            setSuccessMessage('');
                            if (formInModalPopup) {
                                setShowFormModalPopup(false);
                            }
                            resetFormCompletely();
                            clearCache();

                        }, msgTimeout);
                    } else {
                        setGeneralFormError( result.message || t('all-forms.general-error'));
                        setTimeout(() => {
                            setGeneralFormError('');
                        }, msgTimeout);
                    }
                } catch (error) {
                    setGeneralFormError(error.message || t('all-forms.general-error'));
                    setTimeout(() => {
                        setGeneralFormError('');
                    }, msgTimeout);
                    setSubmitting(false);
                    if (hasSetSubmittingLocal) {
                        setSubmittingLocal(false)
                    }
                }
            }
        } catch (error) {
            setGeneralFormError(error || error.message + ': ' +   t('all-forms.general-error'));
            setTimeout(() => {setGeneralFormError('');}, msgTimeout);
        } finally {
            setSubmitting(false);

            if (hasSetSubmittingLocal) {
                setSubmittingLocal(false);
            }
        }
    };

    useEffect(() => {
        if ( noInputFieldsCache || cacheHaveBeenLoaded || (!refsHaveBeenSet) ) {
            return;
        }

        const cachedValues = loadCachedValues();

        dynamicFields.forEach(field => {
            const cachedValue = cachedValues[field.id];
            if (cachedValue !== undefined && field.value === '') {
                const ref = fieldRefs.current[field.id];
                if (ref && ref.current) {

                    if (field.type === 'checkbox' || field.type === 'radio') {
                        ref.current.checked = cachedValue;

                    } else if (field.type === 'select' && field.multiple) {

                        ref.current.value = cachedValue;
                        const vals = String(cachedValue).split(',').map(v => v.trim()).filter(Boolean);

                        (field.choices || []).forEach((choice, i) => {
                            const choiceRef = fieldRefs.current[`${field.id}_${i}`];
                            if (choiceRef?.current) choiceRef.current.checked = vals.includes(choice);
                        });

                    } else if (field.type === 'search-select') {
                        ref.current.value = cachedValue;

                        setSearchSelectSelections(prev => ({
                            ...prev,
                            [field.id]: String(cachedValue).split(',').map(v => v.trim()).filter(Boolean)
                        }));

                    } else {
                        ref.current.value = cachedValue;
                    }
                }
            }

        });


        let currentFields = [...dynamicFields];

        dynamicFields.forEach(field => {
            const cachedValue = cachedValues[field.id];

            if (field.rules && cachedValue) {
                currentFields = processFieldRules(currentFields, field, cachedValue);
            }
        });

        setDynamicFields(currentFields);

        setCacheHaveBeenLoaded(true);


    }, [dynamicFields, noInputFieldsCache, cacheHaveBeenLoaded, fieldRefs, processFieldRules, refsHaveBeenSet, loadCachedValues]);

    useEffect(() => {
        dynamicFields.forEach(field => {
            if (!fieldRefs.current[field.id]) {
                fieldRefs.current[field.id] = createRef();

                if (field.value !== undefined && field.value !== null && field.value !== '') {
                    const ref = fieldRefs.current[field.id];
                    if (ref && ref.current) {
                        if (field.type === 'checkbox' || field.type === 'radio') {
                            ref.current.checked = field.value;
                        } else {
                            ref.current.value = field.value;
                        }
                    }
                }
            }
        });

        setRefsHaveBeenSet(true);
    }, [dynamicFields]);

    useEffect(() => {
        if (refsHaveBeenSet) {
            dynamicFields.forEach(field => {
                if (field.value !== undefined && field.value !== null && field.value !== '') {
                    const ref = fieldRefs.current[ field.id ];

                    if ( ref && ref.current ) {

                        if ( field.type === 'checkbox' || field.type === 'radio' ) {
                            ref.current.checked = field.value;

                        } else if (field.type === 'select' && field.multiple) {

                            const vals = Array.isArray(field.value) ? field.value : String(field.value).split(',').map(v => v.trim()).filter(Boolean);
                            ref.current.value = vals.join(',');

                            (field.choices || []).forEach((choice, i) => {
                                const choiceRef = fieldRefs.current[`${field.id}_${i}`];
                                if (choiceRef?.current) choiceRef.current.checked = vals.includes(choice);
                            });

                        } else if (field.type === 'search-select') {
                            if (searchSelectSelections[field.id] === undefined) {
                                ref.current.value = parseSearchSelectValues(field.value).join(',');
                            }

                        } else {
                            ref.current.value = field.value;
                        }
                    }
                }
            })
        }
    }, [refsHaveBeenSet, dynamicFields, fieldRefs]);

    useEffect(() => {
        if (captchaValue === '') {
            setCaptchaValue(generateCaptcha());
        }
    }, [captchaValue, setCaptchaValue, generateCaptcha, turnstileStatus]);

    useEffect(() => {
        if (noCaptcha) {
            return;
        }

        let cancelled = false;

        loadTurnstileScript().then((loaded) => {
            if (cancelled) {
                return;
            }

            if (!loaded || !window.turnstile || typeof window.turnstile.render !== 'function' || !turnstileContainerRef.current) {
                setTurnstileStatus('failed');
                return;
            }

            try {
                const widgetId = window.turnstile.render(turnstileContainerRef.current, {
                    sitekey: turnstileSiteKey,
                    theme: 'auto',
                    size: 'flexible',
                    callback: (token) => {
                        turnstileTokenRef.current = token || '';
                        setTurnstileStatus('ready');
                    },
                    'error-callback': () => {
                        turnstileTokenRef.current = '';
                        setTurnstileStatus('failed');
                    },
                    'expired-callback': () => {
                        turnstileTokenRef.current = '';

                        if (turnstileWidgetIdRef.current !== null && window.turnstile && typeof window.turnstile.reset === 'function') {
                            try {
                                window.turnstile.reset(turnstileWidgetIdRef.current);
                            } catch (ignored) {
                                setTurnstileStatus('failed');
                            }
                        }
                    },
                    'timeout-callback': () => {
                        turnstileTokenRef.current = '';
                    },
                });

                turnstileWidgetIdRef.current = widgetId;
            } catch (ignored) {
                setTurnstileStatus('failed');
            }
        });

        return () => {
            cancelled = true;

            if (turnstileWidgetIdRef.current !== null && typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.remove === 'function') {
                try {
                    window.turnstile.remove(turnstileWidgetIdRef.current);
                } catch (ignored) {
                    console.log(ignored);
                }
            }

            turnstileWidgetIdRef.current = null;
            turnstileTokenRef.current = '';
        };
    }, [noCaptcha]);

    const drawCaptcha = useCallback(() => {
        const canvas = captchaCanvasRef.current;

        if (!canvas || !captchaValue) {
            return;
        }

        const computedStyle = window.getComputedStyle(canvas);
        const fontSize = parseFloat(computedStyle.fontSize) || 16;
        const letterSpacing = parseFloat(computedStyle.letterSpacing) || 0;
        const fontFamily = computedStyle.fontFamily || 'sans-serif';
        const fontWeight = computedStyle.fontWeight || '400';
        const fontStyle = computedStyle.fontStyle || 'normal';
        const textColor = computedStyle.color;
        const strikeThroughColor = computedStyle.textDecorationColor || textColor;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
        const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
        const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
        const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
        const rect = canvas.getBoundingClientRect();
        const contentWidth = Math.max(0, rect.width - paddingLeft - paddingRight - borderLeft - borderRight);
        const contentHeight = Math.max(0, rect.height - paddingTop - paddingBottom - borderTop - borderBottom);

        if (contentWidth === 0 || contentHeight === 0) {
            return;
        }

        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(contentWidth * devicePixelRatio));
        canvas.height = Math.max(1, Math.round(contentHeight * devicePixelRatio));

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        ctx.clearRect(0, 0, contentWidth, contentHeight);
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;

        const captchaCharacters = captchaValue.split('');
        const characterWidths = captchaCharacters.map(character => ctx.measureText(character).width);
        const totalTextWidth = characterWidths.reduce((sum, width) => sum + width, 0) + (letterSpacing * Math.max(0, captchaCharacters.length - 1));
        const centerY = contentHeight / 2;
        let currentX = (contentWidth - totalTextWidth) / 2;

        captchaCharacters.forEach((character, characterIndex) => {
            const rotation = (captchaSeededUnitRandom(captchaValue, characterIndex * 2) - 0.5) * 0.26;
            const verticalJitter = (captchaSeededUnitRandom(captchaValue, (characterIndex * 2) + 1) - 0.5) * fontSize * 0.16;

            ctx.save();
            ctx.translate(currentX + (characterWidths[characterIndex] / 2), centerY + verticalJitter);
            ctx.rotate(rotation);
            ctx.fillText(character, -(characterWidths[characterIndex] / 2), 0);
            ctx.restore();

            currentX += characterWidths[characterIndex] + letterSpacing;
        });

        ctx.strokeStyle = strikeThroughColor;
        ctx.lineWidth = Math.max(1, fontSize / 14);
        ctx.beginPath();
        ctx.moveTo(Math.max(0, (contentWidth - totalTextWidth) / 2), centerY);
        ctx.lineTo(Math.min(contentWidth, ((contentWidth - totalTextWidth) / 2) + totalTextWidth), centerY);
        ctx.stroke();
    }, [captchaValue]);

    useEffect(() => {
        if (noCaptcha || turnstileStatus !== 'failed') {
            return;
        }

        drawCaptcha();

        const canvas = captchaCanvasRef.current;
        let resizeObserver = null;
        let cleanedUp = false;

        if (canvas && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                drawCaptcha();
            });
            resizeObserver.observe(canvas);
        }

        const darkSchemeMediaQuery = (typeof window.matchMedia === 'function') ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        const handleColorSchemeChange = () => {
            drawCaptcha();
        };

        if (darkSchemeMediaQuery && typeof darkSchemeMediaQuery.addEventListener === 'function') {
            darkSchemeMediaQuery.addEventListener('change', handleColorSchemeChange);
        }

        if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
            document.fonts.ready.then(() => {
                if (!cleanedUp) {
                    drawCaptcha();
                }
            });
        }

        return () => {
            cleanedUp = true;

            if (resizeObserver) {
                resizeObserver.disconnect();
            }

            if (darkSchemeMediaQuery && typeof darkSchemeMediaQuery.removeEventListener === 'function') {
                darkSchemeMediaQuery.removeEventListener('change', handleColorSchemeChange);
            }
        };
    }, [drawCaptcha, noCaptcha, turnstileStatus]);

    useEffect(() => {
        if (resetFormFromParent) {
            resetFormCompletely();

            if (setResetForFromParent) {
                setResetForFromParent(false);
            }

            if (hasDifferentResetBehaviour) {
                differentResetBehaviour()
            }
        }
    }, [resetFormFromParent, setResetForFromParent, fields.length, resetFormCompletely]);

    useEffect(() => {
        if (openSearchSelectId === null) return;

        const handlePointerDown = (e) => {
            const wrapperRef = searchSelectWrapperRefs.current[openSearchSelectId];
            const clickedInWrapper = wrapperRef?.current?.contains(e.target);
            const clickedInDropdown = searchSelectDropdownRef.current?.contains(e.target);
            if (!clickedInWrapper && !clickedInDropdown) {
                setOpenSearchSelectId(null);
                setSearchSelectHighlight(-1);
                setSearchSelectQueries(prev => {
                    const next = { ...prev };
                    delete next[openSearchSelectId];
                    return next;
                });
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
        };

    }, [openSearchSelectId]);

    useEffect(() => {
        if (openSearchSelectId === null) {
            setSearchSelectDropdownRect(null);
            return;
        }
        measureSearchSelectDropdown();
        window.addEventListener('scroll', measureSearchSelectDropdown, true);
        window.addEventListener('resize', measureSearchSelectDropdown);
        return () => {
            window.removeEventListener('scroll', measureSearchSelectDropdown, true);
            window.removeEventListener('resize', measureSearchSelectDropdown);
        };
    }, [openSearchSelectId, measureSearchSelectDropdown]);

    useEffect(() => {
        measureSearchSelectDropdown();
    }, [searchSelectQueries, searchSelectSelections, measureSearchSelectDropdown]);

    const CaptchaField = () => {
        if (noCaptcha) return null;

        const captchaWrapperClass = captchaLength === 2
            ? (fullMarginField ? 'captcha-wrapper-with-half-width-full-margin' : 'captcha-wrapper-half-width')
            : (fullMarginField ? 'captcha-wrapper-with-full-margin' : 'captcha-wrapper');
        const fieldWidthClass = captchaLength === 2 ? 'full-width' : 'half-width';
        const refreshButtonClass = captchaLength === 2 ? 'captcha-refresh-button-half-width' : 'refresh-captcha-button';

        return (
            <>
                <div className={`${fullMarginField ? 'turnstile-wrapper-with-full-margin' : 'turnstile-wrapper'}${turnstileStatus === 'failed' ? ' turnstile-wrapper-hidden' : ''}`}>
                    <div ref={turnstileContainerRef} className="turnstile-container"/>
                </div>
                {turnstileStatus === 'pending' && (
                    <p className="turnstile-loading">Verifying you&apos;re human...</p>
                )}
                {turnstileStatus === 'failed' && (
                    <>
                        {!easySimpleCaptcha && (
                            <label htmlFor="captcha" className="form-label-outside">
                                { t("all-forms.captcha")}*
                            </label>
                        )}
                        <div className={captchaWrapperClass}>
                            <input
                                className={`text-form-field ${fieldWidthClass} captcha-input`}
                                type="text"
                                placeholder=""
                                required
                                ref={enteredCaptcha}
                                onPaste={handlePaste}
                            />
                            <canvas
                                className={`text-form-field ${fieldWidthClass} captcha-box`}
                                ref={(node) => {
                                    captchaCanvasRef.current = node;

                                    if (node) {
                                        requestAnimationFrame(() => drawCaptcha());
                                    }
                                }}
                                role="img"
                                aria-label={t("all-forms.captcha")}
                                onCopy={handleCopy}
                                onCut={handleCut}
                                onPaste={handlePaste}
                                onMouseDown={handleMouseDown}
                                onKeyDown={handleKeyDown}
                                onTouchStart={handleMouseDown}
                            />
                            <button
                                className={refreshButtonClass}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCaptchaValue(generateCaptcha());
                                }}
                                type="button"
                            >
                                ⟳
                            </button>
                        </div>
                    </>
                )}
            </>
        );
    };

    const SubmitButton = () => {
        if (hasDifferentSubmitButtonText) {
            const buttonText = (submitting ? differentSubmitButtonText[1] : differentSubmitButtonText[0]);
            return (
                <button type="submit" form={formId} disabled={submitting} className="submit-button">
                    {buttonText}
                </button>
            );
        }

        return (
            <button type="submit" form={formId} disabled={submitting} className="submit-button">
                {submitting ? t('all-forms.submitting') : t('all-forms.submit')}
            </button>
        );
    };

    const ResetButtons = () => (
        <div className="reset-buttons-wrapper">
            {!noClearOption && (
                <button type="reset"  form={formId} disabled={submitting} className="reset-button">
                    {t('all-forms.clear')}
                </button>
            )}
        </div>
    );

    const FormFooter = () => {
        if (formIsReadOnly) return null;
        const footerClass = `form-footer ${centerSubmitButton ? 'center-buttons' : footerButtonsSpaceBetween ? '' : ''}`;
        const buttonsWrapperClass = `form-footer-buttons-wrapper ${centerSubmitButton ? 'center-buttons' : footerButtonsSpaceBetween ? '' : 'left-buttons'}`;

        const submitButton = (
            <SubmitButton/>
        );

        const resetButtons = (
            <ResetButtons/>
        );

        const buttonsMarkup = (
            <div className={buttonsWrapperClass}>
                {switchFooterButtonsOrder ? (
                    <>
                        {resetButtons}
                        {submitButton}
                    </>
                ) : (
                    <>
                        {submitButton}
                        {resetButtons}
                    </>
                )}
            </div>
        );

        return (
            <div className={footerClass}>
                {generalFormError && <p className="general-form-error">{generalFormError}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                {formFooterButtonsAreOutside && footerButtonsPortalTarget?.current
                    ? createPortal(buttonsMarkup, footerButtonsPortalTarget.current)
                    : buttonsMarkup}
            </div>
        );
    };

    const DateModal = () => {
        const closeModal = () => {
            setShowSelectDateModal(false);
            // setSelectedDateMonth('');
            // setSelectedDateDay('');
            // setSelectedDateYear('');
            setSelectedDateError('');

            // const ref = fieldRefs.current[selectedDateFieldID];
            //
            // if (ref && ref.current) {
            //     ref.current.value = '';
            // }
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
            }
        };

        const generateDayOptions = () => {
            if (selectedDateMonth && selectedDateYear && parseInt(selectedDateYear) && parseInt(selectedDateMonth)) {
                const daysInMonth = new Date(parseInt(selectedDateYear), parseInt(selectedDateMonth), 0).getDate();
                return Array.from({length: daysInMonth}, (v, k) => k + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                ));
            }
            return null;
        };

        return (
            <animated.div style={animateDateModal} className="form-select-date-modal">
                <div className="form-select-date-modal-overlay" onClick={closeModal}/>
                <div className="form-select-date-modal-container">
                    <div className="form-select-date-modal-header">
                        <p>{selectedDateFieldLabel}</p>
                    </div>
                    <div className="form-select-date-modal-content">
                        <form
                            className="form-select-date-modal-form"
                            onSubmit={handleSubmit}
                            onKeyDown={handleKeyDown}
                        >
                            <select
                                className="select-form-field third-width"
                                onChange={(e) => setSelectedDateYear(e.target.value)}
                                value={selectedDateYear}
                            >
                                <option value="">
                                    {t('all-forms.year')}
                                </option>

                                {Array.from({length: new Date().getFullYear() - 1950 + 1}, (v, k) => k + 1950).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select
                                className="select-form-field third-width"
                                onChange={(e) => setSelectedDateMonth(e.target.value)}
                                value={selectedDateMonth}
                            >
                                <option value="">
                                    {t('all-forms.month')}
                                </option>

                                {Array.from({length: 12}, (v, k) => k + 1).map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}

                            </select>
                            <select
                                className="select-form-field third-width"
                                onChange={(e) => setSelectedDateDay(e.target.value)}
                                value={selectedDateDay}
                            >
                                <option value="">
                                    {t('all-forms.day')}
                                </option>

                                {generateDayOptions()}
                            </select>
                        </form>
                    </div>
                    {selectedDateError && <p className="general-form-error">{selectedDateError}</p>}
                    <div className="form-select-date-modal-footer">
                        <button className="form-select-date-modal-close-btn" onClick={closeModal}>
                            {t('all-forms.cancel')}
                        </button>
                        <button
                            className="form-select-date-modal-confirm-btn"
                            onClick={() => handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear)}
                            type="submit"
                        >
                            {t('all-forms.confirm')}
                        </button>
                    </div>
                </div>
            </animated.div>
        );
    };

    const MainForm = () => {
        return (
            <>
                <form className="form" onSubmit={onSubmit} method="post" onReset={resetForm} id={formId}>
                    {dynamicFields.map((field) => (renderFieldBasedOnType(field)))}
                    {CaptchaField()}
                    {FormFooter()}
                </form>
                {DateModal()}
            </>
        );
    };

    return (
        <>
            {MainForm()}
        </>
    );
}

const fieldShape = {
    id: PropTypes.number.isRequired,
    httpName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    displayLabel: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    required: PropTypes.bool.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    setValue: PropTypes.func,
    errorMsg: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.string),
    regex: PropTypes.string,
    widthOfField: PropTypes.number,
    labelOutside: PropTypes.bool,
    allowedFileTypes: PropTypes.arrayOf(PropTypes.string),
    placeholder: PropTypes.string,
    dontLetTheBrowserSaveField: PropTypes.bool,
    multiple: PropTypes.bool,
    onClick: PropTypes.func,
    mustMatchFieldWithId: PropTypes.number,
    mustNotMatchFieldWithId: PropTypes.number,
    labelOnTop: PropTypes.bool,
    readOnlyField: PropTypes.bool,
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    minimumValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maximumValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rules: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        ruleResult: PropTypes.arrayOf(PropTypes.object).isRequired
    })),
    alwaysEnglish: PropTypes.bool,
    lang: PropTypes.string,
    autoSelect: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
};

Form.propTypes = {
    fields: PropTypes.arrayOf(PropTypes.shape(fieldShape)).isRequired,
    mailTo: PropTypes.string.isRequired,
    formTitle: PropTypes.string.isRequired,
    captchaLength: PropTypes.number,
    noInputFieldsCache: PropTypes.bool,
    noCaptcha: PropTypes.bool,
    hasDifferentOnSubmitBehaviour: PropTypes.bool,
    differentOnSubmitBehaviour: PropTypes.func,
    noClearOption: PropTypes.bool,
    hasDifferentSubmitButtonText: PropTypes.bool,
    differentSubmitButtonText: PropTypes.arrayOf(PropTypes.string),
    hasDifferentSuccessMessage: PropTypes.bool,
    differentSuccessMessage: PropTypes.string,
    noSuccessMessage: PropTypes.bool,
    centerSubmitButton: PropTypes.bool,
    easySimpleCaptcha: PropTypes.bool,
    fullMarginField: PropTypes.bool,
    hasSetSubmittingLocal: PropTypes.bool,
    setSubmittingLocal: PropTypes.func,
    resetFormFromParent: PropTypes.bool,
    setResetForFromParent: PropTypes.func,
    formInModalPopup: PropTypes.bool,
    setShowFormModalPopup: PropTypes.func,
    formIsReadOnly: PropTypes.bool,
    footerButtonsSpaceBetween: PropTypes.bool,
    switchFooterButtonsOrder: PropTypes.bool,
    forceEnglishForm: PropTypes.bool,
    hasDifferentResetBehaviour: PropTypes.bool,
    differentResetBehaviour: PropTypes.func,
    formFooterButtonsAreOutside: PropTypes.bool,
    footerButtonsPortalTarget: PropTypes.object,
};

export default Form;