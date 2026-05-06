import { useTranslation } from 'react-i18next';
import '../../styles/Events.css';
import {useState} from "react";
import Form from "../../modules/Form.jsx";
import {costPerChildInOpenDaySignup} from "../../services/GeneralUtils.jsx";
import {submitOpenDaySignupRequest} from "../../services/MainParentsBookingServices.jsx";
import Spinner from "../../modules/Spinner.jsx";

function OpenDaySignup() {
    const { t } = useTranslation();
    const [numberOfAttendeesSelected, setNumberOfAttendeesSelected] = useState(false);
    const [openDaySignupFormFields, setOpenDaySignupFormFields] = useState([])
    const [isLoading, setIsLoading] = useState(false);
    const [openDaySignupFormSubmitted, setOpenDaySignupFormSubmitted] = useState(false)
    const [numberOfAttendees, setNumberOfAttendees] = useState(1);

    const basicConstantFields = [
        {
            id: 1,
            type: 'text',
            name: 'parent-name',
            label: 'Parent Name',
            required: true,
            placeholder: 'Parent Name',
            errorMsg: 'Please enter parent name',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'parent-name',
            displayLabel: 'Parent Name'
        },
        {
            id: 2,
            type: 'tel',
            name: 'parent-phone-number',
            label: 'Parent Phone Number',
            required: true,
            placeholder: 'Parent Phone Number',
            errorMsg: 'Please enter parent phone number',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'parent-phone-number',
            displayLabel: 'Parent Phone Number'
        }
    ]

    const fieldsPerChild = [
        {
            type: 'text',
            name: 'child-name',
            label: 'Child Name',
            required: true,
            placeholder: 'Child Name',
            errorMsg: 'Please enter child name',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'child-name',
            displayLabel: 'Child Name'
        },
        {
            type: 'number',
            name: 'child-age',
            label: 'Child Age',
            required: true,
            placeholder: 'Child Age',
            errorMsg: 'Please enter child age',
            value: '',
            setValue: null,
            widthOfField: 2,
            httpName: 'child-age',
            displayLabel: 'Child Age',
            minimumValue: 1,
            maximumValue: 12
        }
    ]

    const onNumberOfAttendeesSelected = (newNumberOfAttendeesSelected) => {
        const finalFormFieldsToPopulate = []

        finalFormFieldsToPopulate.push(...basicConstantFields);

        for (let i = 0; i < newNumberOfAttendeesSelected; i++) {

            const fieldsForCurrentChild = fieldsPerChild.map((field, fieldIndex) => {
                let newId = basicConstantFields.length + (i * fieldsPerChild.length) + fieldIndex + 1
                return {
                    ...field,
                    id: newId,
                    displayLabel: `${field.displayLabel} ${i + 1}`,
                    placeholder: `${field.placeholder} ${i +1}`,
                    label: `${field.label} ${i + 1}`
                }
            });

            finalFormFieldsToPopulate.push(...fieldsForCurrentChild);
        }

        setOpenDaySignupFormFields(finalFormFieldsToPopulate);
    }

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
                            Welcome to the Open Day Signup
                        </h2>

                        <p>
                            Please enter the number of children you want to bring to start ({costPerChildInOpenDaySignup} EGP Per Child)
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
                                                  placeholder: 'Number of Attendees',
                                                  errorMsg: 'Please enter the number of children attending',
                                                  value: '',
                                                  setValue: null,
                                                  widthOfField: 1,
                                                  defaultValue: 1,
                                                  httpName: 'number-of-attendees',
                                                  displayLabel: 'Number of Attendees'
                                              }
                                          ]
                                      }
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={onSubmitNumberAttendeesSelected}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={["Next", "Next"]}
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
                                    Open Day Signup Form
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
                                    Your submission has been received, thank you!
                                </h2>

                                <p>
                                    Please pay {numberOfAttendees * costPerChildInOpenDaySignup} EGP at the School
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