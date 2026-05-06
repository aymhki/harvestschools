import { useTranslation } from 'react-i18next';
import '../../styles/Events.css';
import {useState, useEffect, useMemo} from "react";
import Form from "../../modules/Form.jsx";
import {costPerChildInOpenDaySignup, formatNumberByLocale} from "../../services/GeneralUtils.jsx";
import {submitOpenDaySignupRequest} from "../../services/MainParentsBookingServices.jsx";
import Spinner from "../../modules/Spinner.jsx";

function OpenDaySignup() {
    const { t } = useTranslation();
    const [numberOfAttendeesSelected, setNumberOfAttendeesSelected] = useState(false);
    const [openDaySignupFormFields, setOpenDaySignupFormFields] = useState([])
    const [isLoading, setIsLoading] = useState(false);
    const [openDaySignupFormSubmitted, setOpenDaySignupFormSubmitted] = useState(false)
    const [numberOfAttendees, setNumberOfAttendees] = useState(1);

    const basicConstantFields = useMemo(() => [
        {
            id: 1,
            type: 'text',
            name: 'parent-name',
            label: 'Parent Name',
            required: true,
            placeholder: t("events-pages.open-day-signup-page.parent-name-field"),
            errorMsg: 'Please enter parent name',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'parent-name',
            displayLabel: t("events-pages.open-day-signup.parent-name-field")
        },
        {
            id: 2,
            type: 'tel',
            name: 'parent-phone-number',
            label: 'Parent Phone Number',
            required: true,
            placeholder: t("events-pages.open-day-signup-page.parent-phone-number-field"),
            errorMsg: 'Please enter parent phone number',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'parent-phone-number',
            displayLabel: t("events-pages.open-day-signup-page.parent-phone-number-field")
        }
    ], [t]);

    const fieldsPerChild = useMemo(() => [
        {
            type: 'text',
            name: 'child-name',
            label: 'Child Name',
            required: true,
            placeholder: t("events-pages.open-day-signup-page.child-name-field"),
            errorMsg: 'Please enter child name',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'child-name',
            displayLabel: t("events-pages.open-day-signup-page.child-name-field")
        },
        {
            type: 'number',
            name: 'child-age',
            label: 'Child Age',
            required: true,
            placeholder: t("events-pages.open-day-signup-page.child-age-field"),
            errorMsg: 'Please enter child age',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'child-age',
            displayLabel: t("events-pages.open-day-signup-page.child-age-field"),
            minimumValue: 1,
            maximumValue: 12
        }
    ], [t]);

    const onNumberOfAttendeesSelected = (newNumberOfAttendeesSelected) => {
        const finalFormFieldsToPopulate = []

        finalFormFieldsToPopulate.push(...basicConstantFields);

        for (let i = 0; i < newNumberOfAttendeesSelected; i++) {

            const fieldsForCurrentChild = fieldsPerChild.map((field, fieldIndex) => {
                let newId = basicConstantFields.length + (i * fieldsPerChild.length) + fieldIndex + 1
                const childNumber = formatNumberByLocale(i + 1);
                return {
                    ...field,
                    id: newId,
                    displayLabel: `${field.displayLabel} ${childNumber}`,
                    placeholder: `${field.placeholder} ${childNumber}`,
                    label: `${field.label} ${i + 1}`
                }
            });

            finalFormFieldsToPopulate.push(...fieldsForCurrentChild);
        }

        setOpenDaySignupFormFields(finalFormFieldsToPopulate);
    }

    useEffect(() => {
        if (numberOfAttendeesSelected) {
            onNumberOfAttendeesSelected(numberOfAttendees);
        }
    }, [basicConstantFields, fieldsPerChild]);

    const onSubmitNumberAttendeesSelected = (formData) => {
        const numberOfAttendeesFromForm = parseInt(formData.get('field_1'));

        if (numberOfAttendeesFromForm && numberOfAttendeesFromForm > 0) {
            setNumberOfAttendeesSelected(true);
            setNumberOfAttendees(numberOfAttendeesFromForm);
            onNumberOfAttendeesSelected(numberOfAttendeesFromForm);
        } else {
           throw new Error('Please enter a valid number of attendees');
        }
    }

    const onResetBehaviour = () => {
        setNumberOfAttendeesSelected(false);
    }

    const onSubmitOpenDaySignupFormBehaviour = async (formData) => {
        try {
            setIsLoading(true);
            const result = await submitOpenDaySignupRequest(formData, numberOfAttendees);

            if (result.success) {
                setOpenDaySignupFormSubmitted(true);
            } else {
                throw new Error(result.message || result || 'Form submission failed. Please try again.');
            }

        } catch (error) {
            throw new Error(error.message || 'Error while submitting the form');

        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            {isLoading && (<Spinner/>)}

            <div className="open-day-signup-page">
                {!numberOfAttendeesSelected ? (
                    <div className="number-of-attendees-selection">
                        <h2>
                            {t("events-pages.open-day-signup-page.welcome-to-open-day-signup")}
                        </h2>

                        <p>
                            {t("events-pages.open-day-signup-page.please-enter-the-children-you-want-to-bring", {costPerChildField: formatNumberByLocale(costPerChildInOpenDaySignup) })}
                        </p>

                        <div className={"number-of-attendees-form-container"}>
                            <Form fields=
                                      {
                                          [
                                              {
                                                  id: 1,
                                                  type: 'number',
                                                  name: 'number-of-attendees',
                                                  label: 'Number of Attendees',
                                                  required: true,
                                                  placeholder: t("events-pages.open-day-signup-page.number-of-attendees-field"),
                                                  errorMsg: 'Please enter the number of children attending',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 1,
                                                  defaultValue: 1,
                                                  minimumValue: 1,
                                                  maximumValue: 2000,
                                                  httpName: 'number-of-attendees',
                                                  displayLabel: t("events-pages.open-day-signup-page.number-of-attendees-field")
                                              }
                                          ]
                                      }
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={onSubmitNumberAttendeesSelected}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={[t("events-pages.open-day-signup-page.next-btn"), t("events-pages.open-day-signup-page.next-btn")]}
                                  noClearOption={true}
                                  noCaptcha={true}
                                  noInputFieldsCache={true}
                                  switchFooterButtonsOrder={true}
                                  footerButtonsSpaceBetween={true}

                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {!openDaySignupFormSubmitted ? (
                            <div className="open-day-signup-step-container">
                                <h2>
                                    {t("events-pages.open-day-signup-page.open-day-signup-form")}
                                </h2>

                                <div className={"open-day-signup-form-container"}>
                                    <Form
                                        fields={openDaySignupFormFields}
                                        hasDifferentOnSubmitBehaviour={true}
                                        differentOnSubmitBehaviour={onSubmitOpenDaySignupFormBehaviour}
                                        noCaptcha={true}
                                        noInputFieldsCache={true}
                                        switchFooterButtonsOrder={true}
                                        footerButtonsSpaceBetween={true}
                                        hasDifferentResetBehaviour={true}
                                        differentResetBehaviour={onResetBehaviour}
                                    />
                                </div>

                            </div>
                        ) : (
                            <div className="open-day-signup-success-message">
                                <h2>
                                    {t("events-pages.open-day-signup-page.confirmation-message")}
                                </h2>

                                <p>
                                    {t("events-pages.open-day-signup-page.please-pay-message", {totalCostForAllChildren: formatNumberByLocale(numberOfAttendees * costPerChildInOpenDaySignup)})}
                                </p>
                            </div>


                        )}
                    </>
                )
                }
            </div>
        </>

    );
}

export default OpenDaySignup;