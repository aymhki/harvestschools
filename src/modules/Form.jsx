import PropTypes from 'prop-types';
import {useEffect, useState, useRef, createRef, useId, useMemo} from "react";
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
import {useLoadingWhile} from "../services/General/GlobalLoadingService.jsx";
import {msgTimeout, turnstileSiteKey, TURNSTILE_SCRIPT_URL, TURNSTILE_SCRIPT_TIMEOUT_MS, setPendingTurnstileToken, ARABIC_MARKS_REGEX, normalizeArabicText} from "../services/General/GeneralUtils.jsx";
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
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/(.)\1+/g, '$1')
        .replace(/[aeiouwy]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};




const SKELETON_MIN_QUERY_LENGTH = 3;
const SKELETON_MIN_KEY_LENGTH = 2;

const searchSelectMatches = (choice, query) => {
    const trimmedQuery = String(query || '').trim();
    if (!trimmedQuery) return true;
    const normChoice = normalizeArabicText(choice).toLowerCase();
    const normQuery = normalizeArabicText(trimmedQuery).toLowerCase();
    if (normChoice.includes(normQuery)) return true;
    if (normQuery.length < SKELETON_MIN_QUERY_LENGTH) return false;
    const choiceKey = toTransliterationKey(choice);
    const queryKey = toTransliterationKey(trimmedQuery);
    if (queryKey.length < SKELETON_MIN_KEY_LENGTH) return false;
    return ` ${choiceKey}`.includes(` ${queryKey}`);
};

const OPTION_TAP_TOLERANCE = 8;
const CUSTOM_VALUE_MAX_LENGTH = 255;

const sanitiseCustomValue = (value) => String(value)
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CUSTOM_VALUE_MAX_LENGTH);

const scrollElementIntoCentre = (element) => {
    let scroller = element.parentElement;

    while (scroller && scroller.scrollHeight <= scroller.clientHeight) {
        scroller = scroller.parentElement;
    }

    if (!scroller) {
        element.scrollIntoView({behavior: 'smooth', block: 'center'});
        return;
    }

    const elementTop = element.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    const target     = scroller.scrollTop + elementTop - (scroller.clientHeight / 2) + (element.offsetHeight / 2);

    scroller.scrollTo({top: Math.max(0, target), behavior: 'smooth'});
};

const DEFAULT_MAX_FILE_BYTES = 2 * 1024 * 1024;

const describeBytes = (bytes) => {
    const size = Number(bytes) || 0;

    if (size >= 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    if (size >= 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(size / 1024))} KB`;
};


function Form({
                  fields,
                  mailTo = '',
                  formKey = '',
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
                  dynamicSections,
                  fieldStateFromParent,
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
    const [videoThumbnailUrls, setVideoThumbnailUrls] = useState({});
    const [videoThumbnailDurations, setVideoThumbnailDurations] = useState({});
    const [videoThumbnailValues, setVideoThumbnailValues] = useState({});
    const [heicConverting, setHeicConverting] = useState({});
    const [videoThumbnailSeeking, setVideoThumbnailSeeking] = useState({});
    const [fileDropTargets, setFileDropTargets] = useState({});
    const [filePreviewUrls, setFilePreviewUrls] = useState({});
    const [showSelectDateModal, setShowSelectDateModal] = useState(false);
    const [selectedDateDay, setSelectedDateDay] = useState('');
    const [selectedDateMonth, setSelectedDateMonth] = useState('');
    const [selectedDateYear, setSelectedDateYear] = useState('');
    const [selectedDateFieldID, setSelectedDateFieldID] = useState(null);
    const [selectedDateFieldLabel, setSelectedDateFieldLabel] = useState('');
    const [selectedDateError, setSelectedDateError] = useState('');
    const animateDateModal = useSpring({ opacity: showSelectDateModal ? 1 : 0, transform: showSelectDateModal ? 'translateY(0)' : 'translateY(-100%)' });
    const [showPasswords, setShowPasswords] = useState(false);
    const generalFormErrorRef = useRef(null);
    const uploadProgressRef = useRef(null);
    const wasUploadingRef = useRef(false);
    const dynamicInstanceUidCounter = useRef(0);
    const dynamicInstanceSeeds = useRef({});
    const DYNAMIC_CACHE_MAX_PROBE = 25;

    const normalizedDynamicSections = useMemo(() => (
        Array.isArray(dynamicSections)
            ? dynamicSections.filter(section =>
                section &&
                section.sectionId !== undefined &&
                section.sectionId !== null &&
                Array.isArray(section.fields) &&
                section.fields.length > 0
            )
            : []
    ), [dynamicSections]);

    const getDynamicSectionMaxInstances = (section) => (
        (section.maxInstances === undefined || section.maxInstances === null) ? Infinity : section.maxInstances
    );

    const getDynamicRuntimeFieldId = (sectionId, instanceUid, templateFieldId) => `dyn_${sectionId}_${instanceUid}_${templateFieldId}`;
    const getDynamicInstanceRefKeyPrefix = (sectionId, instanceUid) => `dyn_${sectionId}_${instanceUid}_`;
    const getDynamicCacheId = (sectionId, ordinal, templateFieldId) => `dyn_${sectionId}_i${ordinal}_${templateFieldId}`;

    const buildInitialDynamicInstances = (sections, includeSeedsFromProps = true) => {
        const initialInstances = {};

        sections.forEach(section => {
            const instances = [];

            if (includeSeedsFromProps) {
                (section.instances || []).forEach(seedValues => {
                    const uid = dynamicInstanceUidCounter.current++;
                    dynamicInstanceSeeds.current[uid] = seedValues || {};
                    instances.push({uid: uid});
                });
            }

            initialInstances[section.sectionId] = instances;
        });

        return initialInstances;
    };

    const [dynamicSectionInstances, setDynamicSectionInstances] = useState(() => buildInitialDynamicInstances(normalizedDynamicSections));

    const cacheableFields = useMemo(() => {
        if (noInputFieldsCache || normalizedDynamicSections.length === 0) {
            return fields;
        }

        const extendedFields = [...fields];

        normalizedDynamicSections.forEach(section => {
            const probeBound = Math.min(getDynamicSectionMaxInstances(section), DYNAMIC_CACHE_MAX_PROBE);

            for (let ordinal = 0; ordinal < probeBound; ordinal++) {
                section.fields.forEach(templateField => {
                    extendedFields.push({
                        id: getDynamicCacheId(section.sectionId, ordinal, templateField.id),
                        label: templateField.label
                    });
                });
            }
        });

        return extendedFields;
    }, [fields, normalizedDynamicSections, noInputFieldsCache]);

    const {loadCachedValues, saveToCache, clearCache} = useFormCache(formTitle, cacheableFields);
    const [prefilledInitialized, setPrefilledInitialized] = useState(false);
    const [captchaValue, setCaptchaValue] = useState('');
    const fieldRefs = useRef({});
    const enteredCaptcha = useRef('');
    const captchaCanvasRef = useRef(null);
    const turnstileContainerRef = useRef(null);
    const turnstileWidgetIdRef = useRef(null);
    const turnstileTokenRef = useRef('');
    const turnstileRetriedRef = useRef(false);
    const [turnstileStatus, setTurnstileStatus] = useState('pending');
    const [refsVersion, setRefsVersion] = useState(0);
    const refsHaveBeenSet = refsVersion > 0;
    const [cacheHaveBeenLoaded, setCacheHaveBeenLoaded] = useState(false);
    const { t } = useTranslation(['all-forms'], forceEnglishForm ? { lng: 'en' } : {});
    const formId = useId();
    const [searchSelectSelections, setSearchSelectSelections] = useState({});
    const [searchSelectQueries, setSearchSelectQueries] = useState({});
    const [openSearchSelectId, setOpenSearchSelectId] = useState(null);
    const [searchSelectOpensUpwards, setSearchSelectOpensUpwards] = useState(false);
    const [searchSelectHighlight, setSearchSelectHighlight] = useState(-1);
    const searchSelectWrapperRefs = useRef({});
    const searchSelectDropdownRef = useRef(null);
    const optionPointerStartRef = useRef(null);
    const fileDropDepths = useRef({});

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

    const getDynamicSection = (sectionId) => normalizedDynamicSections.find(section => section.sectionId === sectionId);

    const getDynamicInstanceOrdinal = (sectionId, instanceUid) => (
        (dynamicSectionInstances[sectionId] || []).findIndex(instance => instance.uid === instanceUid)
    );

    const ensureFieldRef = (fieldId) => {
        if (!fieldRefs.current[fieldId]) {
            fieldRefs.current[fieldId] = createRef();
        }

        return fieldRefs.current[fieldId];
    };

    const buildDynamicInstanceField = (section, instance, templateField) => {
        const runtimeId = getDynamicRuntimeFieldId(section.sectionId, instance.uid, templateField.id);
        const seedValues = dynamicInstanceSeeds.current[instance.uid] || {};
        const seedValue = seedValues[templateField.id];

        const remapInSectionFieldId = (targetFieldId) => {
            if (targetFieldId !== undefined && targetFieldId !== null && section.fields.some(sectionField => sectionField.id === targetFieldId)) {
                return getDynamicRuntimeFieldId(section.sectionId, instance.uid, targetFieldId);
            }

            return targetFieldId;
        };

        const instanceField = {
            ...templateField,
            id: runtimeId,
            httpName: `${templateField.httpName}-${section.sectionId}-${instance.uid}`,
            defaultValue: seedValue !== undefined ? seedValue : (templateField.defaultValue || ''),
            __dynamicSection: {
                sectionId: section.sectionId,
                uid: instance.uid,
                templateId: templateField.id,
                templateLabel: templateField.label
            }
        };

        if ((templateField.type === 'radio' || templateField.type === 'checkbox') && seedValue !== undefined) {
            instanceField.value = seedValue;
        }

        if (templateField.mustMatchFieldWithId !== undefined) {
            instanceField.mustMatchFieldWithId = remapInSectionFieldId(templateField.mustMatchFieldWithId);
        }

        if (templateField.mustNotMatchFieldWithId !== undefined) {
            instanceField.mustNotMatchFieldWithId = remapInSectionFieldId(templateField.mustNotMatchFieldWithId);
        }

        if (templateField.onChangeResult) {
            instanceField.onChangeResult = templateField.onChangeResult.map(result => {
                const remappedResult = {...result};

                if (remappedResult.idOfTheFieldThatShouldChangeBasedOnThisNewValue !== undefined) {
                    remappedResult.idOfTheFieldThatShouldChangeBasedOnThisNewValue = remapInSectionFieldId(remappedResult.idOfTheFieldThatShouldChangeBasedOnThisNewValue);
                }

                if (remappedResult.fieldIdsToAddAndMultiplyTogether) {
                    const remappedIds = {};

                    Object.keys(remappedResult.fieldIdsToAddAndMultiplyTogether).forEach(key => {
                        const numericKey = isNaN(Number(key)) ? key : Number(key);
                        remappedIds[remapInSectionFieldId(numericKey)] = remappedResult.fieldIdsToAddAndMultiplyTogether[key];
                    });

                    remappedResult.fieldIdsToAddAndMultiplyTogether = remappedIds;
                }

                if (remappedResult.fieldIdsToCheckIfBiggerThanZero) {
                    remappedResult.fieldIdsToCheckIfBiggerThanZero = remappedResult.fieldIdsToCheckIfBiggerThanZero.map(fieldId => remapInSectionFieldId(fieldId));
                }

                return remappedResult;
            });
        }

        if (instanceField.rules) {
            delete instanceField.rules;
        }

        ensureFieldRef(runtimeId);

        return instanceField;
    };

    const composedFields = useMemo(() => {
        if (normalizedDynamicSections.length === 0) {
            return dynamicFields;
        }

        const buildSectionBlock = (section) => {
            const sectionBlock = [];
            const instances = dynamicSectionInstances[section.sectionId] || [];

            instances.forEach((instance, ordinal) => {
                sectionBlock.push({
                    id: `dynh_${section.sectionId}_${instance.uid}`,
                    type: 'dynamic-section-instance-header',
                    label: `${section.title} ${ordinal + 1}`,
                    __dynamicSectionHeader: {sectionId: section.sectionId, uid: instance.uid}
                });

                section.fields.forEach(templateField => {
                    sectionBlock.push(buildDynamicInstanceField(section, instance, templateField));
                });
            });

            if (!formIsReadOnly && instances.length < getDynamicSectionMaxInstances(section)) {
                sectionBlock.push({
                    id: `dyna_${section.sectionId}`,
                    type: 'dynamic-section-add-button',
                    label: section.addButtonLabel || `+ ${section.title}`,
                    __dynamicSectionAdd: {sectionId: section.sectionId}
                });
            }

            return sectionBlock;
        };

        const anchoredSections = {};
        const unanchoredSections = [];

        normalizedDynamicSections.forEach(section => {
            if (
                section.insertAfterFieldId !== undefined &&
                section.insertAfterFieldId !== null &&
                dynamicFields.some(field => field.id === section.insertAfterFieldId)
            ) {
                if (!anchoredSections[section.insertAfterFieldId]) {
                    anchoredSections[section.insertAfterFieldId] = [];
                }

                anchoredSections[section.insertAfterFieldId].push(section);
            } else {
                unanchoredSections.push(section);
            }
        });

        const mergedFields = [];

        dynamicFields.forEach(field => {
            mergedFields.push(field);

            (anchoredSections[field.id] || []).forEach(section => {
                mergedFields.push(...buildSectionBlock(section));
            });
        });

        unanchoredSections.forEach(section => {
            mergedFields.push(...buildSectionBlock(section));
        });

        return mergedFields;
    }, [dynamicFields, dynamicSectionInstances, normalizedDynamicSections, formIsReadOnly]);

    const hasFieldUploadProgress = fieldStateFromParent ? Object.values(fieldStateFromParent).some((state) => state && state.upload && state.upload.phase) : false;

    useLoadingWhile(submitting && !hasFieldUploadProgress);

    useEffect(() => {
        const wasUploading = wasUploadingRef.current;
        wasUploadingRef.current = hasFieldUploadProgress;

        if (wasUploading || !hasFieldUploadProgress || !uploadProgressRef.current) {
            return;
        }

        scrollElementIntoCentre(uploadProgressRef.current);
    }, [hasFieldUploadProgress]);

    const resolveSourceFieldId = (field) => {
        const dynamicSectionInfo = field.__dynamicSection;

        return dynamicSectionInfo
            ? getDynamicRuntimeFieldId(dynamicSectionInfo.sectionId, dynamicSectionInfo.uid, field.sourceFieldId)
            : field.sourceFieldId;
    };

    const framePickerSourceIds = new Set(
        composedFields
            .filter((candidate) => candidate.type === 'video-thumbnail')
            .map((candidate) => resolveSourceFieldId(candidate))
    );

    const previewSourcesSignature = composedFields
        .filter((field) => field.type === 'video-thumbnail' || field.type === 'files' || (field.type === 'file' && field.showPreview))
        .map((field) => `${field.id}:${field.type}:${resolveSourceFieldId(field) ?? ''}`)
        .join('|');

    useEffect(() => {
        const videoUrls = {};
        const previewUrls = {};

        composedFields.forEach((field) => {
            if (field.type === 'video-thumbnail') {
                const source = fileInputs[resolveSourceFieldId(field)];

                if (source instanceof File) {
                    videoUrls[field.id] = URL.createObjectURL(source);
                }
            } else if (field.type === 'files') {
                const chosen = Array.isArray(fileInputs[field.id]) ? fileInputs[field.id] : [];

                previewUrls[field.id] = chosen.map((file) => (
                    String(file.type).startsWith('image/') ? URL.createObjectURL(file) : ''
                ));
            } else if (field.type === 'file' && field.showPreview && !framePickerSourceIds.has(field.id)) {
                const chosen = fileInputs[field.id];
                const canPreview = chosen instanceof File && (String(chosen.type).startsWith('image/') || String(chosen.type).startsWith('video/'));

                previewUrls[field.id] = canPreview ? [URL.createObjectURL(chosen)] : [];
            }
        });

        setVideoThumbnailUrls(videoUrls);
        setFilePreviewUrls(previewUrls);

        return () => {
            Object.values(videoUrls).forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
            Object.values(previewUrls).forEach((list) => list.forEach((objectUrl) => {
                if (objectUrl !== '') {
                    URL.revokeObjectURL(objectUrl);
                }
            }));
        };
    }, [fileInputs, previewSourcesSignature]);

    const getFieldSubmitValue = (field) => {
        const ref = fieldRefs.current[field.id];

        if (ref && ref.current) {
            if (field.type === 'checkbox' || field.type === 'radio') {
                return ref.current.checked ? ref.current.value : '';
            } else if (field.type === 'select' && field.multiple) {
                if (field.readOnlyField || formIsReadOnly) {
                    const vals = Array.isArray(field.value) ? field.value : String(field.value || '').split(',').map(v => v.trim()).filter(Boolean);
                    return vals.join(',');
                } else {
                    const selected = [];

                    (field.choices || []).forEach((choice, i) => {
                        const choiceRef = fieldRefs.current[`${field.id}_${i}`];
                        if (choiceRef?.current?.checked) selected.push(choice);
                    });

                    return selected.join(',');
                }
            } else if (field.type === 'search-select') {
                return getSearchSelectSelected(field).join(',');
            } else {
                return ref.current.value || '';
            }
        }

        return field.readOnlyField ? (field.value || '') : '';
    };

    const saveFieldToCache = (field, value) => {
        if (noInputFieldsCache) {
            return;
        }

        if (field.__dynamicSection) {
            const ordinal = getDynamicInstanceOrdinal(field.__dynamicSection.sectionId, field.__dynamicSection.uid);

            if (ordinal === -1) {
                return;
            }

            saveToCache(
                {
                    id: getDynamicCacheId(field.__dynamicSection.sectionId, ordinal, field.__dynamicSection.templateId),
                    label: field.__dynamicSection.templateLabel
                },
                value
            );
        } else {
            saveToCache(field, value);
        }
    };

    const addDynamicInstance = (sectionId) => {
        const section = getDynamicSection(sectionId);

        if (!section) {
            return;
        }

        setDynamicSectionInstances(previousInstances => {
            const instances = previousInstances[sectionId] || [];

            if (instances.length >= getDynamicSectionMaxInstances(section)) {
                return previousInstances;
            }

            const uid = dynamicInstanceUidCounter.current++;
            dynamicInstanceSeeds.current[uid] = {};

            return {...previousInstances, [sectionId]: [...instances, {uid: uid}]};
        });

        setGeneralFormError('');
        setSuccessMessage('');
    };

    const removeDynamicInstance = (sectionId, instanceUid) => {
        const section = getDynamicSection(sectionId);

        if (!section) {
            return;
        }

        const currentInstances = dynamicSectionInstances[sectionId] || [];
        const remainingInstances = currentInstances.filter(instance => instance.uid !== instanceUid);

        if (remainingInstances.length === currentInstances.length) {
            return;
        }

        if (!noInputFieldsCache) {
            remainingInstances.forEach((instance, ordinal) => {
                section.fields.forEach(templateField => {
                    const instanceField = buildDynamicInstanceField(section, instance, templateField);

                    saveToCache(
                        {id: getDynamicCacheId(sectionId, ordinal, templateField.id), label: templateField.label},
                        getFieldSubmitValue(instanceField)
                    );
                });
            });

            section.fields.forEach(templateField => {
                saveToCache(
                    {id: getDynamicCacheId(sectionId, remainingInstances.length, templateField.id), label: templateField.label},
                    ''
                );
            });
        }

        const refKeyPrefix = getDynamicInstanceRefKeyPrefix(sectionId, instanceUid);

        Object.keys(fieldRefs.current).forEach(refKey => {
            if (String(refKey).startsWith(refKeyPrefix)) {
                delete fieldRefs.current[refKey];
            }
        });

        Object.keys(searchSelectWrapperRefs.current).forEach(refKey => {
            if (String(refKey).startsWith(refKeyPrefix)) {
                delete searchSelectWrapperRefs.current[refKey];
            }
        });

        const pruneKeysWithPrefix = (previousObject) => {
            const nextObject = {};

            Object.keys(previousObject).forEach(key => {
                if (!String(key).startsWith(refKeyPrefix)) {
                    nextObject[key] = previousObject[key];
                }
            });

            return nextObject;
        };

        setSearchSelectSelections(pruneKeysWithPrefix);
        setSearchSelectQueries(pruneKeysWithPrefix);
        setFileInputs(pruneKeysWithPrefix);
        setVideoThumbnailDurations(pruneKeysWithPrefix);

        if (openSearchSelectId !== null && String(openSearchSelectId).startsWith(refKeyPrefix)) {
            setOpenSearchSelectId(null);
            setSearchSelectHighlight(-1);
        }

        delete dynamicInstanceSeeds.current[instanceUid];

        setDynamicSectionInstances(previousInstances => ({
            ...previousInstances,
            [sectionId]: (previousInstances[sectionId] || []).filter(instance => instance.uid !== instanceUid)
        }));

        setGeneralFormError('');
        setSuccessMessage('');
    };


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

        if (normalizedDynamicSections.length > 0) {
            Object.keys(fieldRefs.current).forEach(refKey => {
                if (String(refKey).startsWith('dyn_')) {
                    delete fieldRefs.current[refKey];
                }
            });

            Object.keys(searchSelectWrapperRefs.current).forEach(refKey => {
                if (String(refKey).startsWith('dyn_')) {
                    delete searchSelectWrapperRefs.current[refKey];
                }
            });

            dynamicInstanceSeeds.current = {};
            setDynamicSectionInstances(buildInitialDynamicInstances(normalizedDynamicSections, !shouldClearFieldDefaults));
        }

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
                        disabled: newFieldData.disabled,
                        required: newFieldData.required,
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
        required: field.required && !field.disabled,
        disabled: submitting || field.disabled || false,
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
            className: `text-form-field ${(field.readOnlyField || field.disabled) ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''}`,
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
                        saveFieldToCache(field, currentValue + delta);
                    }
                }

            }
        };

        const numberInput = (
            <div className={`number-input-container ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${ (field.readOnlyField || formIsReadOnly || submitting) ? 'read-only-field' : ''} ${(field.alwaysEnglish) ? 'always-english' : ''}`}>
                <button className="number-input-reduce-button" type="button" onClick={handleNumberChange(-1)}
                        disabled={field.readOnlyField || submitting || formIsReadOnly || field.disabled || false}
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
                        disabled={field.readOnlyField || submitting || formIsReadOnly || field.disabled || false}
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
                className={`textarea-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.large ? 'large-height-textarea' : ''} ${(field.readOnlyField || field.disabled) ? 'read-only-field' : ''}`}
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

            if (!noInputFieldsCache) saveFieldToCache(field, commaValue);

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
                        `select-multiple-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${(field.readOnlyField || field.disabled) ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''}` :
                        `select-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${(field.readOnlyField || field.disabled) ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''}`
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
                        required={field.required && !field.disabled}
                        value={choice}
                        disabled={submitting || field.disabled || false}
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

    const getMaxFileBytes = (field) => field.maxFileSizeInBytes || DEFAULT_MAX_FILE_BYTES;

    const describeFileSizeLimit = (field) => {
        const megabytes = getMaxFileBytes(field) / (1024 * 1024);

        return megabytes >= 1024 ? `${Math.round(megabytes / 1024)}GB` : `${Math.round(megabytes)}MB`;
    };


    const isFileTypeAllowed = (field, file) => {
        if (!Array.isArray(field.allowedFileTypes) || field.allowedFileTypes.length === 0) {
            return true;
        }

        const extension = `.${String(file.name.split('.').pop() || '').toLowerCase()}`;

        return field.allowedFileTypes.some((allowed) => (
            allowed.startsWith('.') ? allowed.toLowerCase() === extension : allowed === file.type
        ));
    };

    const describeFileProblem = (field, file) => {
        if (file.size > getMaxFileBytes(field)) {
            return `File size must be less than ${describeFileSizeLimit(field)}`;
        }

        if (!isFileTypeAllowed(field, file)) {
            return `File type must be one of the following: ${field.allowedFileTypes.join(', ')}`;
        }

        return '';
    };

    const getChosenFiles = (field) => (Array.isArray(fileInputs[field.id]) ? fileInputs[field.id] : []);

    const renderFilesInput = (field) => {
        const widthClass = getWidthClass(field.widthOfField);
        const chosen = getChosenFiles(field);
        const isUploading = !!(field.upload && field.upload.phase);

        if (!fieldRefs.current[field.id]) {
            fieldRefs.current[field.id] = createRef();
        }

        const setChosen = (nextFiles) => {
            field.files = nextFiles;
            setFileInputs(prev => ({...prev, [field.id]: nextFiles}));
        };

        return (
            <div className={`file-form-field-styled files-form-field-styled ${widthClass} ${fileDropTargets[field.id] ? 'is-drop-target' : ''}`}{...dropTargetProps(field)}>
                <label htmlFor={field.id}>
                    {getLabelText(field)}
                </label>

                {!isUploading && (
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

                    {chosen.length > 0 && (
                        <button
                            className="remove-button"
                            type="button"
                            disabled={submitting}
                            onClick={(e) => {
                                e.preventDefault();
                                setChosen([]);
                            }}
                        >
                            {t("all-forms.remove")}
                        </button>
                    )}
                </div>
                )}

                {isUploading && renderUploadProgress(field)}

                {heicConverting[field.id] && (
                    <label>
                        {`Converting iPhone photos... ${heicConverting[field.id].done} of ${heicConverting[field.id].total}`}
                    </label>
                )}

                {chosen.length === 0 ? (
                    <label>{t('all-forms.drop-files-here')}</label>
                ) : (
                    <ul className="files-form-field-grid">
                        {chosen.map((file, index) => (
                            <li key={`${file.name}-${file.size}-${index}`} className="files-form-field-grid-item">
                                {(filePreviewUrls[field.id] || [])[index] ? (
                                    <img
                                        className="files-form-field-grid-preview"
                                        src={filePreviewUrls[field.id][index]}
                                        alt={file.name}
                                    />
                                ) : (
                                    <span className="files-form-field-grid-preview files-form-field-grid-preview-empty">
                                        {String(file.name.split('.').pop() || '').toUpperCase()}
                                    </span>
                                )}

                                <span className="files-form-field-grid-name" title={file.name}>{file.name}</span>

                                <button
                                    type="button"
                                    className="files-form-field-grid-remove"
                                    disabled={submitting}
                                    aria-label={`Remove ${file.name}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setChosen(chosen.filter((chosenFile, position) => position !== index));
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                        <path d="M6 6 L18 18 M18 6 L6 18" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <input
                    type="file"
                    className="file-form-field"
                    id={field.id}
                    name={field.httpName}
                    multiple
                    accept={field.allowedFileTypes ? field.allowedFileTypes.join(',') : ''}
                    disabled={submitting}
                    onChange={(e) => onChange(e, field)}
                    ref={fieldRefs.current[field.id]}
                />

                <label>
                    {chosen.length > 0 ? `${chosen.length} selected. ` : ''}
                    Maximum file size: {describeFileSizeLimit(field)}
                    {field.maxFiles ? `, up to ${field.maxFiles} files` : ''}
                </label>
            </div>
        );
    };

    const renderVideoThumbnailPicker = (field) => {
        const widthClass = getWidthClass(field.widthOfField);
        const objectUrl = videoThumbnailUrls[field.id] || field.videoUrl || '';
        const duration = videoThumbnailDurations[field.id] || 0;

        if (!fieldRefs.current[field.id]) {
            fieldRefs.current[field.id] = createRef();
        }

        const videoRefKey = `${field.id}_video`;

        if (!fieldRefs.current[videoRefKey]) {
            fieldRefs.current[videoRefKey] = createRef();
        }

        const scrubberRefKey = `${field.id}_scrubber`;
        const readoutRefKey = `${field.id}_readout`;

        if (!fieldRefs.current[scrubberRefKey]) {
            fieldRefs.current[scrubberRefKey] = createRef();
        }

        if (!fieldRefs.current[readoutRefKey]) {
            fieldRefs.current[readoutRefKey] = createRef();
        }

        const pickedValue = videoThumbnailValues[field.id] !== undefined ? String(videoThumbnailValues[field.id]) : (field.defaultValue || '');

        const describePoint = (seconds, total) => {
            const span = Number.isFinite(total) ? total : duration;

            return `Frame at ${(Number(seconds) || 0).toFixed(1)}s of ${span.toFixed(1)}s`;
        };

        const markSeeking = (isSeeking) => setVideoThumbnailSeeking(prev => {
            if (!!prev[field.id] === isSeeking) {
                return prev;
            }

            const next = {...prev};

            if (isSeeking) {
                next[field.id] = true;
            } else {
                delete next[field.id];
            }

            return next;
        });

        const seekTo = (seconds, total) => {
            const input = fieldRefs.current[field.id];
            const video = fieldRefs.current[videoRefKey];
            const scrubber = fieldRefs.current[scrubberRefKey];
            const readout = fieldRefs.current[readoutRefKey];

            if (input && input.current) {
                input.current.value = String(seconds);
            }

            if (video && video.current) {
                video.current.currentTime = Number(seconds);
            }

            if (scrubber && scrubber.current) {
                scrubber.current.value = String(seconds);
            }

            if (readout && readout.current) {
                readout.current.textContent = describePoint(seconds, total);
            }

            setVideoThumbnailValues((prev) => (
                String(prev[field.id]) === String(seconds) ? prev : {...prev, [field.id]: seconds}
            ));
        };

        return (
            <div className={`file-form-field-styled video-thumbnail-field ${widthClass}`}>
                <label htmlFor={field.id}>
                    {getLabelText(field)}
                </label>

                {objectUrl === '' ? (
                    <label>Choose a video first, then pick its cover frame here</label>
                ) : (
                    <>
                        <div className="video-thumbnail-field-stage">
                            <video
                                className="video-thumbnail-field-preview"
                                src={objectUrl}
                                ref={fieldRefs.current[videoRefKey]}
                                preload="metadata"
                                muted
                                playsInline
                                onSeeking={() => markSeeking(true)}
                                onSeeked={() => markSeeking(false)}
                                onError={() => markSeeking(false)}
                                onLoadedMetadata={(e) => {
                                    const loaded = Number(e.target.duration) || 0;

                                    setVideoThumbnailDurations(prev => (
                                        prev[field.id] === loaded ? prev : {...prev, [field.id]: loaded}
                                    ));

                                    const scrubber = fieldRefs.current[scrubberRefKey];

                                    if (scrubber && scrubber.current) {
                                        scrubber.current.max = String(Math.max(loaded - 0.1, 0.1));
                                    }

                                    const picked = fieldRefs.current[field.id];
                                    const alreadyPicked = (picked && picked.current) ? Number(picked.current.value) : NaN;
                                    const wanted = (Number.isFinite(alreadyPicked) && alreadyPicked > 0) ? alreadyPicked : (Number(field.defaultValue) || 0);
                                    const startAt = Math.min(Math.max(wanted, 0), Math.max(loaded - 0.1, 0));
                                    seekTo(Number(startAt.toFixed(1)), loaded);
                                }}
                            />

                            {videoThumbnailSeeking[field.id] && (
                                <span className="video-thumbnail-field-seeking" role="status" aria-live="polite">
                                    Loading the frame...
                                </span>
                            )}
                        </div>

                        <input
                            type="range"
                            className="video-thumbnail-field-scrubber"
                            min={0}
                            max={Math.max(duration - 0.1, 0.1)}
                            step={0.1}
                            disabled={submitting}
                            onChange={(e) => seekTo(e.target.value)}
                            aria-label={`${getLabelText(field)} position`}
                            ref={fieldRefs.current[scrubberRefKey]}
                        />

                        <label className="video-thumbnail-field-readout" ref={fieldRefs.current[readoutRefKey]}>
                            {describePoint(pickedValue)}
                        </label>
                    </>
                )}

                <input type="hidden" {...getCommonInputProps(field)} defaultValue={pickedValue} />
            </div>
        );
    };

    const renderUploadProgress = (field) => {
        const upload = field.upload;
        const percent = Math.min(100, Math.max(0, Number(upload.percent) || 0));
        const isFinishing = upload.phase === 'finishing';

        return (
            <div className="file-form-field-upload" ref={uploadProgressRef}>
                <div className="file-form-field-upload-bar" role="progressbar"
                     aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
                     aria-label={`${getLabelText(field)} upload progress`}>
                    <span className="file-form-field-upload-bar-fill" style={{width: `${percent}%`}}/>
                </div>

                <label className="file-form-field-upload-readout">
                    {isFinishing
                        ? 'Upload complete, handing the file over to the server...'
                        : `Uploading ${percent}% (${describeBytes(upload.sentBytes)} of ${describeBytes(upload.totalBytes)})`}
                </label>

                <label className="file-form-field-upload-warning">
                    Please keep this tab open until the upload finishes. Closing it now loses the progress.
                </label>

                {typeof upload.onCancel === 'function' && (
                    <button
                        type="button"
                        className="remove-button file-form-field-upload-cancel"
                        disabled={!!upload.isCancelling}
                        onClick={(e) => {
                            e.preventDefault();
                            upload.onCancel();
                        }}
                    >
                        {upload.isCancelling ? 'Cancelling...' : 'Cancel Upload'}
                    </button>
                )}
            </div>
        );
    };

    const renderFileInput = (field) => {
        const widthClass = getWidthClass(field.widthOfField);
        const isUploading = !!(field.upload && field.upload.phase);
        const previewUrl = (filePreviewUrls[field.id] || [])[0] || '';
        const chosenFile = fileInputs[field.id];

        if (!fieldRefs.current[field.id]) {
            fieldRefs.current[field.id] = createRef();
        }

        return (
            <div className={`file-form-field-styled ${widthClass} ${fileDropTargets[field.id] ? 'is-drop-target' : ''}`}{...dropTargetProps(field)}>
                <label htmlFor={field.id}>
                    {getLabelText(field)}
                </label>

                {!isUploading && (
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
                        {chosenFile && (
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
                )}

                <label className="file-form-field-chosen-name">
                    {chosenFile
                        ? (chosenFile.name.length > 20
                                ? chosenFile.name.substring(0, 20) + '...'
                                : chosenFile.name
                        ) : t('all-forms.drop-file-here')
                    }
                    {(chosenFile && field.showPreview) ? ` (${describeBytes(chosenFile.size)})` : ''}
                </label>

                {(chosenFile && previewUrl !== '') && (
                    String(chosenFile.type).startsWith('video/') ? (
                        <video className="file-form-field-preview" src={previewUrl}
                               preload="metadata" muted playsInline controls/>
                    ) : (
                        <img className="file-form-field-preview" src={previewUrl} alt={chosenFile.name}/>
                    )
                )}

                {isUploading && renderUploadProgress(field)}

                {heicConverting[field.id] && (
                    <label>
                        {`Converting iPhone photos... ${heicConverting[field.id].done} of ${heicConverting[field.id].total}`}
                    </label>
                )}

                <input
                    type="file"
                    className="file-form-field"
                    id={field.id}
                    name={field.httpName}
                    label={field.label}
                    accept={field.allowedFileTypes ? field.allowedFileTypes.join(',') : ''}
                    disabled={submitting}
                    onChange={(e) => onChange(e, field)}
                    ref={fieldRefs.current[field.id]}
                />

                {!isUploading && <label>Maximum file size: {describeFileSizeLimit(field)}</label>}
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

    const renderDynamicSectionInstanceHeader = (field) => {
        const section = getDynamicSection(field.__dynamicSectionHeader.sectionId);
        const widthClass = getWidthClass(1);

        return (
            <div className={`form-title-section dynamic-section-instance-header ${widthClass}`} id={field.id}>
                <div className="dynamic-section-instance">
                    <h3>
                        {field.label}
                    </h3>
                </div>

                {!formIsReadOnly && (
                    <div className="dynamic-section-control">
                        <button
                            type="button"
                            className="remove-section-button"
                            disabled={submitting}
                            onClick={() => removeDynamicInstance(field.__dynamicSectionHeader.sectionId, field.__dynamicSectionHeader.uid)}
                        >
                            {(section && section.removeButtonLabel) || t('all-forms.remove')}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderDynamicSectionAddButton = (field) => {
        const widthClass = getWidthClass(1);

        return (
            <div className={`dynamic-section-button-wrapper ${widthClass}`} id={field.id}>
                <button
                    type="button"
                    className="add-section-button"
                    disabled={submitting}
                    onClick={() => addDynamicInstance(field.__dynamicSectionAdd.sectionId)}
                >
                    {field.label}
                </button>
            </div>
        );
    };

    const renderFieldBasedOnType = (field) => {
        const stateFromParent = fieldStateFromParent ? fieldStateFromParent[field.id] : null;

        if (stateFromParent) {
            Object.assign(field, stateFromParent);
        }

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
                {field.type === 'files' && renderFilesInput(field)}
                {field.type === 'video-thumbnail' && renderVideoThumbnailPicker(field)}
                {field.type === 'button' && renderButton(field)}
                {field.type === 'section' && ( renderSection(field) ) }
                {field.type === 'dynamic-section-instance-header' && renderDynamicSectionInstanceHeader(field)}
                {field.type === 'dynamic-section-add-button' && renderDynamicSectionAddButton(field)}
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
            saveFieldToCache(field, commaValue);
        }
        const newFields = processFieldRules(dynamicFields, field, commaValue);
        setDynamicFields(newFields);
        processFieldOnChangeResult(field, commaValue);
    };

    const renderSearchSelect = (field) => {
        const widthClass = getWidthClass(field.widthOfField);

        if (!fieldRefs.current[field.id]) fieldRefs.current[field.id] = createRef();
        if (!searchSelectWrapperRefs.current[field.id]) searchSelectWrapperRefs.current[field.id] = createRef();

        const isFieldReadOnly = field.readOnlyField || formIsReadOnly || submitting || field.disabled;
        const selected = getSearchSelectSelected(field);
        const typedQuery = searchSelectQueries[field.id];
        const filterText = typedQuery ?? '';
        const displayText = typedQuery ?? (!field.multiple ? (selected[0] || '') : '');
        const isOpen = openSearchSelectId === field.id && !isFieldReadOnly;

        const filteredChoices = (field.choices || []).filter(choice =>
            (!field.multiple || !selected.includes(choice))
            && (field.onSearchQueryChange !== undefined || searchSelectMatches(choice, filterText))
        );

        const customValue = field.allowCustomValues ? sanitiseCustomValue(filterText) : '';
        const alreadyKnown = (value) => (field.choices || []).some(choice => String(choice).toLowerCase() === value.toLowerCase()) || selected.some(chosen => String(chosen).toLowerCase() === value.toLowerCase());
        const canAddCustomValue = customValue !== '' && filteredChoices.length === 0 && !alreadyKnown(customValue);
        const dropdownEntries = canAddCustomValue ? [{isCustom: true, value: customValue}, ...filteredChoices.map(choice => ({isCustom: false, value: choice}))] : filteredChoices.map(choice => ({isCustom: false, value: choice}));

        const clearQuery = () => setSearchSelectQueries(prev => {
            const next = { ...prev };
            delete next[field.id];
            return next;
        });

        const closeDropdown = () => {
            if (canAddCustomValue) {
                applySearchSelectSelection(field, field.multiple ? [...selected, customValue] : [customValue]);
            }

            setOpenSearchSelectId(null);
            setSearchSelectHighlight(-1);
            clearQuery();
        };

        const openDropdown = () => {
            if (!isFieldReadOnly) {
                const wrapper = searchSelectWrapperRefs.current[field.id]?.current;

                if (wrapper) {
                    const rect = wrapper.getBoundingClientRect();
                    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

                    setSearchSelectOpensUpwards((viewportHeight - rect.bottom) < 200 && rect.top > (viewportHeight - rect.bottom));
                }

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

            if (field.onSearchQueryChange) {
                field.onSearchQueryChange(e.target.value);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!isOpen) { openDropdown(); setSearchSelectHighlight(0); return; }
                setSearchSelectHighlight(h => (dropdownEntries.length === 0 ? -1 : Math.min(h + 1, dropdownEntries.length - 1)));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSearchSelectHighlight(h => Math.max(h - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (isOpen && searchSelectHighlight >= 0 && dropdownEntries[searchSelectHighlight]) {
                    pickChoice(dropdownEntries[searchSelectHighlight].value);
                } else if (isOpen && dropdownEntries.length === 1) {
                    pickChoice(dropdownEntries[0].value);
                } else {
                    const exactMatch = (field.choices || []).find(
                        c => String(c).toLowerCase() === String(displayText).trim().toLowerCase()
                    );

                    if (exactMatch) {
                        pickChoice(exactMatch);
                    } else if (canAddCustomValue) {
                        pickChoice(customValue);
                    }
                }
            } else if (e.key === 'Escape' || e.key === 'Tab') {
                closeDropdown();
            } else if (e.key === 'Backspace' && field.multiple && !filterText && selected.length > 0 && !isFieldReadOnly) {
                removeChoice(selected[selected.length - 1]);
            }
        };

        const markup = (
            <div
                className={`search-select-wrapper ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${isFieldReadOnly ? 'read-only-field' : ''} ${field.alwaysEnglish ? 'always-english' : ''} ${isOpen ? 'has-open-dropdown' : ''} ${isOpen && searchSelectOpensUpwards ? 'opens-upwards' : ''}`}
                ref={searchSelectWrapperRefs.current[field.id]}
                style={{ anchorName: `--search-select-${field.id}` }}
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
                        disabled={submitting || field.disabled || false}
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
                {isOpen && (
                    <ul
                        className={`search-select-dropdown ${field.alwaysEnglish ? 'always-english' : ''}`}
                        style={{ positionAnchor: `--search-select-${field.id}` }}
                        role="listbox"
                        ref={searchSelectDropdownRef}
                        {...(field.lang !== undefined && { lang: field.lang })}
                    >
                        {dropdownEntries.length === 0 && (
                            <li className="search-select-no-results">{t('all-forms.no-results')}</li>
                        )}
                        {dropdownEntries.map(({isCustom, value: choice}, index) => (
                            <li
                                key={isCustom ? '__custom__' : choice}
                                role="option"
                                aria-selected={!field.multiple && selected[0] === choice}
                                className={`search-select-option ${isCustom ? 'search-select-option-create' : ''} ${index === searchSelectHighlight ? 'highlighted' : ''} ${!field.multiple && selected[0] === choice ? 'selected' : ''}`}
                                onPointerDown={(e) => {
                                    if (e.pointerType === 'mouse') {
                                        e.preventDefault();
                                    }

                                    optionPointerStartRef.current = { id: e.pointerId, y: e.clientY, x: e.clientX };
                                }}
                                onPointerUp={(e) => {
                                    const start = optionPointerStartRef.current;

                                    optionPointerStartRef.current = null;

                                    const movedWhileDown = !start
                                        || start.id !== e.pointerId
                                        || Math.abs(e.clientY - start.y) > OPTION_TAP_TOLERANCE
                                        || Math.abs(e.clientX - start.x) > OPTION_TAP_TOLERANCE;

                                    if (!movedWhileDown) {
                                        pickChoice(choice);
                                    }
                                }}
                                onPointerCancel={() => { optionPointerStartRef.current = null; }}
                                onMouseEnter={() => setSearchSelectHighlight(index)}
                            >
                                {isCustom ? t('all-forms.use-typed-value', {value: choice}) : choice}
                            </li>
                        ))}
                    </ul>
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
            const dateField = composedFields.find(field => field.id === selectedDateFieldID);

            if (dateField && dateField.__dynamicSection) {
                saveFieldToCache(dateField, dateValue);
            } else {
                saveToCache({id: selectedDateFieldID, label: selectedDateFieldLabel}, dateValue);
            }
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

    const isHeicFile = (file) => (
        /image\/hei[cf]/i.test(file.type)
        || ['heic', 'heif'].includes(String(file.name.split('.').pop() || '').toLowerCase())
    );

    const clearHeicConverting = (field) => setHeicConverting((prev) => {
        const next = {...prev};
        delete next[field.id];
        return next;
    });

    const loadHeicConverter = async () => {
        try {
            const converterModule = await import('heic-to/csp');

            return [converterModule.heicTo, converterModule.default && converterModule.default.heicTo]
                .find((candidate) => typeof candidate === 'function') || null;
        } catch (loadError) {
            return null;
        }
    };

    const convertHeicThenAccept = async (field, chosen) => {
        const total = chosen.filter(isHeicFile).length;

        setHeicConverting((prev) => ({...prev, [field.id]: {done: 0, total}}));

        const converter = await loadHeicConverter();

        if (!converter) {
            clearHeicConverting(field);
            setGeneralFormError('The photo converter could not be loaded. Please export these photos as JPEG and try again.');
            setTimeout(() => setGeneralFormError(''), msgTimeout);

            return;
        }

        const converted = [];
        const unreadable = [];
        let done = 0;

        for (const file of chosen) {
            if (!isHeicFile(file)) {
                converted.push(file);
                continue;
            }

            try {
                const output = await converter({blob: file, type: 'image/jpeg', quality: 0.92});
                const jpeg = Array.isArray(output) ? output[0] : output;

                converted.push(new File([jpeg], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, {type: 'image/jpeg'}));
            } catch (conversionError) {
                unreadable.push(file.name);
            }

            done += 1;
            setHeicConverting((prev) => ({...prev, [field.id]: {done, total}}));
        }

        clearHeicConverting(field);

        if (converted.length > 0) {
            const problem = acceptFiles(field, converted);

            if (problem !== '') {
                setGeneralFormError(problem);
                setTimeout(() => setGeneralFormError(''), msgTimeout);
            }
        }

        if (unreadable.length > 0) {
            setGeneralFormError(`${unreadable.length} photo${unreadable.length === 1 ? '' : 's'} could not be read in this browser (${unreadable.join(', ')}). Please export ${unreadable.length === 1 ? 'it' : 'them'} as JPEG and try again.`);
            setTimeout(() => setGeneralFormError(''), msgTimeout);
        }
    };

    const acceptFiles = (field, fileList) => {
        const chosen = Array.from(fileList || []);

        if (chosen.length === 0) {
            return '';
        }

        const problem = chosen.map((file) => describeFileProblem(field, file)).find(Boolean) || '';

        if (problem !== '') {
            return problem;
        }

        setGeneralFormError('');
        setSuccessMessage('');

        if (chosen.some(isHeicFile)) {
            convertHeicThenAccept(field, chosen);

            return '';
        }

        if (field.type === 'files') {
            const existing = getChosenFiles(field);
            const alreadyChosen = new Set(existing.map((file) => `${file.name}:${file.size}`));
            const added = chosen.filter((file) => !alreadyChosen.has(`${file.name}:${file.size}`));
            const merged = [...existing, ...added];
            const capped = field.maxFiles ? merged.slice(0, field.maxFiles) : merged;

            field.files = capped;
            setFileInputs(prev => ({...prev, [field.id]: capped}));
            syncFileInputElement(field, capped);
        } else {
            field.file = chosen[0];
            setFileInputs(prev => ({...prev, [field.id]: chosen[0]}));
            syncFileInputElement(field, [chosen[0]]);
        }

        return '';
    };

    const syncFileInputElement = (field, files) => {
        const ref = fieldRefs.current[field.id];
        if (!ref || !ref.current) {
            return;
        }
        ref.current.setCustomValidity('');
        if (field.type !== 'file' || typeof DataTransfer === 'undefined') {
            return;
        }
        try {
            const transfer = new DataTransfer();
            files.forEach((file) => transfer.items.add(file));
            ref.current.files = transfer.files;
        } catch (ignored) {
            console.log(ignored);
        }
    };

    const dropTargetProps = (field) => {
        const isBusy = submitting || !!(field.upload && field.upload.phase);

        const setHovering = (hovering) => setFileDropTargets(prev => (
            prev[field.id] === hovering ? prev : {...prev, [field.id]: hovering}
        ));

        return {
            onDragEnter: (event) => {
                event.preventDefault();

                if (isBusy) {
                    return;
                }

                fileDropDepths.current[field.id] = (fileDropDepths.current[field.id] || 0) + 1;
                setHovering(true);
            },
            onDragOver: (event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = isBusy ? 'none' : 'copy';
            },
            onDragLeave: (event) => {
                event.preventDefault();
                fileDropDepths.current[field.id] = Math.max(0, (fileDropDepths.current[field.id] || 0) - 1);

                if (fileDropDepths.current[field.id] === 0) {
                    setHovering(false);
                }
            },
            onDrop: (event) => {
                event.preventDefault();
                fileDropDepths.current[field.id] = 0;
                setHovering(false);

                if (isBusy) {
                    return;
                }

                const ref = fieldRefs.current[field.id];

                if (ref && ref.current) {
                    ref.current.setCustomValidity('');
                }

                const dropped = Array.from(event.dataTransfer.files || []);
                const problem = acceptFiles(field, field.type === 'files' ? dropped : dropped.slice(0, 1));

                if (problem !== '') {
                    setGeneralFormError(problem);
                    setTimeout(() => setGeneralFormError(''), msgTimeout);
                }
            },
        };
    };

    const onChange = (e, field) => {
        const value = (field.type === 'radio' || field.type === 'checkbox') ? e.target.checked : e.target.value;

        if (field.type === 'number' && (isNaN(value) || (field.minimumValue && Number(value) < field.minimumValue) || (field.maximumValue && Number(value) > field.maximumValue))) {
            e.target.setCustomValidity(`Value must be a number between ${field.minimumValue} and ${field.maximumValue}`);
        } else if (field.type === 'file' || field.type === 'files') {
            const problem = acceptFiles(field, e.target.files);

            if (problem !== '') {
                e.target.setCustomValidity(problem);
                e.target.reportValidity();

                return;
            }

            e.target.setCustomValidity('');

            if (field.type === 'files') {
                e.target.value = '';
            }
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
                    saveFieldToCache(field, value);
                }
            }

            const newFields = processFieldRules(dynamicFields, field, value);
            setDynamicFields(newFields);

            processFieldOnChangeResult(field, value);
        }
    }

    const resetTurnstileWidget = () => {
        turnstileTokenRef.current = '';
        setPendingTurnstileToken('');

        if (noCaptcha || turnstileWidgetIdRef.current === null || !window.turnstile || typeof window.turnstile.reset !== 'function') {
            return;
        }

        try {
            window.turnstile.reset(turnstileWidgetIdRef.current);
        } catch (error) {
            console.log(error);
        }
    };

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

        for (let i = 0; i < normalizedDynamicSections.length; i++) {
            const section = normalizedDynamicSections[i];
            const minInstances = section.minInstances || 0;
            const instanceCount = (dynamicSectionInstances[section.sectionId] || []).length;

            if (instanceCount < minInstances) {
                setGeneralFormError(t('all-forms.dynamic-section-min-error', {min: minInstances, title: section.title}));
                setTimeout(() => {
                    setGeneralFormError('');
                }, msgTimeout);
                return;
            }
        }

        for (let i = 0; i < composedFields.length; i++) {
            const currentField = composedFields[i];

            if (currentField.type === 'dynamic-section-instance-header' || currentField.type === 'dynamic-section-add-button') {
                continue;
            }

            if (currentField.mustMatchFieldWithId) {
                const field1Ref = fieldRefs.current[currentField.id];
                const field2Ref = fieldRefs.current[currentField.mustMatchFieldWithId];

                if (field1Ref?.current && field2Ref?.current) {
                    const firstValue = field1Ref.current.value;
                    const secondValue = field2Ref.current.value;

                    if (firstValue && secondValue) {
                        if (firstValue !== secondValue) {
                            const field1 = getWhichLabelToUse(currentField);
                            const field2 = getWhichLabelToUse(composedFields.find(field => field.id === currentField.mustMatchFieldWithId));

                            setGeneralFormError( t('all-forms.fields-must-match-error', {field1: field1, field2: field2} ) );

                            setTimeout(() => {
                                setGeneralFormError('');
                            }, msgTimeout);

                            return;
                        }
                    }
                }
            }

            if (currentField.mustNotMatchFieldWithId) {
                const field1Ref = fieldRefs.current[currentField.id];
                const field2Ref = fieldRefs.current[currentField.mustNotMatchFieldWithId];

                if (field1Ref?.current && field2Ref?.current) {
                    const firstValue = field1Ref.current.value;
                    const secondValue = field2Ref.current.value;

                    if (firstValue && secondValue) {
                        if (firstValue === secondValue) {
                            const field1 = getWhichLabelToUse(currentField);
                            const field2 = getWhichLabelToUse(composedFields.find(field => field.id === currentField.mustNotMatchFieldWithId));

                            setGeneralFormError( t('all-forms.fields-must-not-match-error', {field1: field1, field2: field2} ) );

                            setTimeout(() => {
                                setGeneralFormError('');
                            }, msgTimeout);

                            return;
                        }
                    }
                }
            }

            if (currentField.type === 'select' && currentField.multiple && currentField.required) {

                const selected = [];

                (currentField.choices || []).forEach((choice, j) => {
                    const choiceRef = fieldRefs.current[`${currentField.id}_${j}`];
                    if (choiceRef?.current?.checked) selected.push(choice);
                });


                if (selected.length === 0) {
                    setGeneralFormError( t('all-forms.field-required', { field1: getWhichLabelToUse(currentField) } ) );
                    setTimeout(() => setGeneralFormError(''), msgTimeout);
                    return;
                }

            }

            if (currentField.type === 'search-select' && currentField.required) {
                if (getSearchSelectSelected(currentField).length === 0) {
                    setGeneralFormError(t('all-forms.field-required', { field1: getWhichLabelToUse(currentField) }));
                    setTimeout(() => setGeneralFormError(''), msgTimeout);
                    return;
                }
            }

            if (currentField.type === 'files' && currentField.required) {
                if (getChosenFiles(currentField).length === 0) {
                    setGeneralFormError(t('all-forms.field-required', { field1: getWhichLabelToUse(currentField) }));
                    setTimeout(() => setGeneralFormError(''), msgTimeout);
                    return;
                }
            }

            if (currentField.type === 'file' && currentField.required) {
                if (!(currentField.file || fileInputs[currentField.id])) {
                    setGeneralFormError(t('all-forms.field-required', { field1: getWhichLabelToUse(currentField) }));
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
            composedFields.forEach(field => {
                if (field.type === 'dynamic-section-instance-header' || field.type === 'dynamic-section-add-button') {
                    return;
                }

                let value;
                const dynamicSectionInfo = field.__dynamicSection;
                const ordinalForDynamicField = dynamicSectionInfo ? getDynamicInstanceOrdinal(dynamicSectionInfo.sectionId, dynamicSectionInfo.uid) : -1;
                const fieldKeySuffix = dynamicSectionInfo
                    ? `${dynamicSectionInfo.sectionId}_i${ordinalForDynamicField}_f${dynamicSectionInfo.templateId}`
                    : `${field.id}`;
                const labelForField = dynamicSectionInfo ? dynamicSectionInfo.templateLabel : field.label;
                const uploadedFile = (field.type === 'file') ? (field.file || fileInputs[field.id]) : null;
                const fileFieldLabel = dynamicSectionInfo ? `${labelForField} ${ordinalForDynamicField + 1}` : field.label;

                if (field.type === 'file' && uploadedFile) {
                    const file = uploadedFile;
                    const fileExtension = file.name.split('.').pop();
                    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                    const uniqueFileName = `${fileNameWithoutExt}-${uuidv6()}.${fileExtension}`;
                    const renamedFile = new File([file], uniqueFileName, {type: file.type});
                    value = uniqueFileName;
                    formData.append(`uniqueFileName_${fileFieldLabel}`, uniqueFileName);
                    formData.append(fileFieldLabel, renamedFile, uniqueFileName);
                } else if (field.type === 'files') {
                    const uniqueFileNames = [];

                    getChosenFiles(field).forEach((file) => {
                        const fileExtension = file.name.split('.').pop();
                        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                        const uniqueFileName = `${fileNameWithoutExt}-${uuidv6()}.${fileExtension}`;

                        uniqueFileNames.push(uniqueFileName);
                        formData.append(fileFieldLabel, new File([file], uniqueFileName, {type: file.type}), uniqueFileName);
                    });

                    value = uniqueFileNames.join(',');
                    formData.append(`uniqueFileNames_${fileFieldLabel}`, value);
                } else {
                    value = getFieldSubmitValue(field);
                }

                formData.append(`field_${fieldKeySuffix}`, value);
                formData.append(`label_${fieldKeySuffix}`, labelForField);
            });

            normalizedDynamicSections.forEach(section => {
                formData.append(`dynamicSectionCount_${section.sectionId}`, String((dynamicSectionInstances[section.sectionId] || []).length));
            });

            formData.append('mailTo', mailTo);
            formData.append('formKey', formKey);
            formData.append('formTitle', formTitle);

            if (!noCaptcha && turnstileTokenRef.current) {
                formData.append('cf-turnstile-response', turnstileTokenRef.current);
            }

            setPendingTurnstileToken(noCaptcha ? '' : turnstileTokenRef.current);

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

                    resetTurnstileWidget();

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

                        resetTurnstileWidget();
                    }
                } catch (error) {
                    setGeneralFormError(error.message || t('all-forms.general-error'));
                    setTimeout(() => {
                        setGeneralFormError('');
                    }, msgTimeout);

                    resetTurnstileWidget();

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
            setPendingTurnstileToken('');
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

        normalizedDynamicSections.forEach(section => {
            if ((section.instances || []).length > 0) {
                return;
            }

            if ((dynamicSectionInstances[section.sectionId] || []).length > 0) {
                return;
            }

            const probeBound = Math.min(getDynamicSectionMaxInstances(section), DYNAMIC_CACHE_MAX_PROBE);
            const spawnedInstances = [];

            for (let ordinal = 0; ordinal < probeBound; ordinal++) {
                const seedValues = {};
                let hasAnyCachedValue = false;

                section.fields.forEach(templateField => {
                    const cachedValue = cachedValues[getDynamicCacheId(section.sectionId, ordinal, templateField.id)];

                    if (cachedValue !== undefined) {
                        seedValues[templateField.id] = cachedValue;
                        hasAnyCachedValue = true;
                    }
                });

                if (!hasAnyCachedValue) {
                    break;
                }

                const uid = dynamicInstanceUidCounter.current++;
                dynamicInstanceSeeds.current[uid] = seedValues;
                spawnedInstances.push({uid: uid});
            }

            if (spawnedInstances.length > 0) {
                setDynamicSectionInstances(previousInstances => ({
                    ...previousInstances,
                    [section.sectionId]: [...(previousInstances[section.sectionId] || []), ...spawnedInstances]
                }));
            }
        });

        setCacheHaveBeenLoaded(true);


    }, [dynamicFields, noInputFieldsCache, cacheHaveBeenLoaded, fieldRefs, processFieldRules, refsHaveBeenSet, loadCachedValues, normalizedDynamicSections, dynamicSectionInstances]);

    useEffect(() => {
        let createdAnyRef = false;

        dynamicFields.forEach(field => {
            if (!fieldRefs.current[field.id]) {
                fieldRefs.current[field.id] = createRef();
                createdAnyRef = true;

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

        setRefsVersion(version => (createdAnyRef || version === 0 ? version + 1 : version));
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
        if (generalFormError === '' || !generalFormErrorRef.current) {
            return;
        }

        scrollElementIntoCentre(generalFormErrorRef.current);
    }, [generalFormError]);

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
                    appearance: 'always',
                    callback: (token) => {
                        turnstileTokenRef.current = token || '';
                        turnstileRetriedRef.current = false;
                        setTurnstileStatus('ready');
                    },
                    'error-callback': () => {
                        turnstileTokenRef.current = '';

                        const canReset = turnstileWidgetIdRef.current !== null
                            && window.turnstile
                            && typeof window.turnstile.reset === 'function';

                        if (turnstileRetriedRef.current || !canReset) {
                            setTurnstileStatus('failed');

                            return;
                        }

                        turnstileRetriedRef.current = true;

                        try {
                            window.turnstile.reset(turnstileWidgetIdRef.current);
                        } catch (ignored) {
                            setTurnstileStatus('failed');
                        }
                    },
                    'unsupported-callback': () => {
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
            turnstileRetriedRef.current = false;
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
        const measureCtx = document.createElement('canvas').getContext('2d');
        measureCtx.font = ctx.font;
        const characterWidths = captchaCharacters.map(character => measureCtx.measureText(character).width);
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
                {generalFormError && <p ref={generalFormErrorRef} className="general-form-error">{generalFormError}</p>}
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

        const generateYearOptions = () => {
            const openField = composedFields.find(field => field.id === selectedDateFieldID);
            const fromYear = Number(openField?.minYear) || 1950;
            const toYear = Number(openField?.maxYear) || new Date().getFullYear();
            const years = toYear >= fromYear ? Array.from({length: toYear - fromYear + 1}, (v, k) => k + fromYear) : [];
            const storedYear = parseInt(selectedDateYear, 10);

            if (storedYear && !years.includes(storedYear)) {
                years.push(storedYear);
                years.sort((first, second) => first - second);
            }

            return years.map(year => (
                <option key={year} value={year}>{year}</option>
            ));
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

                                {generateYearOptions()}
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
                <form
                    className={`form ${openSearchSelectId !== null ? 'has-open-search-select' : ''}`}
                    onSubmit={onSubmit}
                    method="post"
                    onReset={resetForm}
                    id={formId}
                >
                    {composedFields.map((field) => (renderFieldBasedOnType(field)))}
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
    name: PropTypes.string.isRequired,
    displayLabel: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    required: PropTypes.bool.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    disabled: PropTypes.bool,
    setValue: PropTypes.func,
    errorMsg: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.string),
    regex: PropTypes.string,
    widthOfField: PropTypes.number,
    labelOutside: PropTypes.bool,
    allowedFileTypes: PropTypes.arrayOf(PropTypes.string),
    maxFileSizeInBytes: PropTypes.number,
    maxFiles: PropTypes.number,
    sourceFieldId: PropTypes.number,
    videoUrl: PropTypes.string,
    showPreview: PropTypes.bool,
    upload: PropTypes.shape({
        phase: PropTypes.string,
        percent: PropTypes.number,
        sentBytes: PropTypes.number,
        totalBytes: PropTypes.number,
        isCancelling: PropTypes.bool,
        onCancel: PropTypes.func,
    }),
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
    minYear: PropTypes.number,
    maxYear: PropTypes.number,
    rules: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        ruleResult: PropTypes.arrayOf(PropTypes.object).isRequired
    })),
    alwaysEnglish: PropTypes.bool,
    allowCustomValues: PropTypes.bool,
    lang: PropTypes.string,
    autoSelect: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
    onSearchQueryChange: PropTypes.func,
};

Form.propTypes = {
    fields: PropTypes.arrayOf(PropTypes.shape(fieldShape)).isRequired,
    mailTo: PropTypes.string,
    formKey: PropTypes.string,
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
    dynamicSections: PropTypes.arrayOf(PropTypes.shape({
        sectionId: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        addButtonLabel: PropTypes.string,
        removeButtonLabel: PropTypes.string,
        insertAfterFieldId: PropTypes.number,
        minInstances: PropTypes.number,
        maxInstances: PropTypes.number,
        fields: PropTypes.arrayOf(PropTypes.shape(fieldShape)).isRequired,
        instances: PropTypes.arrayOf(PropTypes.object),
    })),
    fieldStateFromParent: PropTypes.objectOf(PropTypes.object),
};

export default Form;