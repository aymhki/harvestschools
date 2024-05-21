
import PropTypes from "prop-types";
import {useState} from "react";
import footer from "./Footer.jsx";
import {Fragment} from "react";
import '../styles/Form.css'
function Form({fields, mailTo, sendPdf}) {
    const [submitting, setSubmitting] = useState(false); //disable fields when submitting
    const [generalFormError, setGeneralFormError] = useState(''); //general form error message
    const [successMessage, setSuccessMessage] = useState(''); //success message

    const onChange = (e, field) => {
        const value = (field.type === 'radio' || field.type === 'checkbox') ? e.target.checked : e.target.value;

        if (field.regex && !new RegExp(field.regex).test(value)) {
            e.target.setCustomValidity(field.errorMsg);
        } else {
            e.target.setCustomValidity('');
            setGeneralFormError('');
            setSuccessMessage('');
        }
    }

    const renderFieldBasedOnType = (field) => {
            return (
                <Fragment key={field.id}>
                {field.labelOutside && <label htmlFor={field.id}>{field.label}
                    {field.required && <span className="required">*</span>}
                </label>}

                    {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'date' || field.type === 'time' || field.type === 'password') &&
                        <input
                            type={field.type}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={field.label}
                            disabled={submitting}
                            onChange={(e) => onChange(e, field)}
                            className={`text-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                        />
                    }

                    {field.type === 'textarea' &&
                        <textarea
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={field.label}
                            disabled={submitting}
                            onChange={(e) => onChange(e, field)}
                            className={`textarea-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                        />
                    }

                    {field.type === 'select' &&
                        <select
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            disabled={submitting}
                            className={`select-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                            onChange={(e) => onChange(e, field)}
                        >
                            <option value="">{field.label}</option>
                            {field.choices.map((choice, index) => (
                                <option key={index} value={choice}>{choice}</option>
                            ))}
                        </select>
                    }

                    {field.type === 'radio' &&
                        field.choices.map((choice, index) => (
                            <label key={index}>
                                <input
                                    type="radio"
                                    id={field.id}
                                    name={field.httpName}
                                    required={field.required}
                                    value={choice}
                                    disabled={submitting}
                                    className={`radio-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                                    onChange={(e) => onChange(e, field)}
                                />
                                {choice}
                            </label>
                        ))
                    }

                    {field.type === 'checkbox' &&
                        field.choices.map((choice, index) => (
                            <label key={index}>
                                <input
                                    type="checkbox"
                                    id={field.id}
                                    name={field.httpName}
                                    required={field.required}
                                    value={choice}
                                    disabled={submitting}
                                    className={`checkbox-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                                    onChange={(e) => onChange(e, field)}
                                />
                                {choice}
                            </label>
                        ))
                    }

                    {field.type === 'file' &&
                        <input
                            type="file"
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            accept={field.allowedFileTypes ? field.allowedFileTypes.map(type => type.type).join(',') : '*/*'}
                            disabled={submitting}
                            className={`file-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file && !field.allowedFileTypes.some(type => type.type === file.type)) {
                                    e.target.setCustomValidity(`File type must be one of the following: ${field.allowedFileTypes.map(type => type.description).join(', ')}`);
                                } else {
                                    e.target.setCustomValidity('');
                                    setGeneralFormError('');
                                    setSuccessMessage('');
                                    field.setValue(file);
                                }
                            }}
                        />
                    }

                </Fragment>
            );

    }

    const onSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.target);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', mailTo);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    setSuccessMessage('Your form has been submitted successfully!');
                    setTimeout(() => { setSuccessMessage(''); }, 5000);
                } else {
                    setGeneralFormError('There was an error submitting the form. Please try again later.');
                    setTimeout(() => { setGeneralFormError(''); }, 5000);
                }
                setSubmitting(false);
            }
        };

        xhr.send(formData);

        if (sendPdf) {
            const pdf = new Blob([footer], {type: 'application/pdf'});
            const pdfFormData = new FormData();
            pdfFormData.append('pdf', pdf);
            const pdfXhr = new XMLHttpRequest();
            pdfXhr.open('POST', mailTo);
            pdfXhr.send(pdfFormData);
        }


    }

    return (
        <form
            className="form"
            onSubmit={onSubmit}
        >
            {fields.map((field, index) => (
                    renderFieldBasedOnType(field, index)
            ))}



            <div className="form-footer">
                <button type="submit" disabled={submitting} className="submit-button">{submitting ? 'Submitting...' : 'Submit'}</button>
                {generalFormError && <p className="general-form-error">{generalFormError}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
            </div>
        </form>
    );
}

Form.propTypes = {
    fields: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        httpName: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        required: PropTypes.bool.isRequired,
        errorMsg: PropTypes.string,
        choices: PropTypes.arrayOf(PropTypes.string),
        regex: PropTypes.string,
        widthOfField: PropTypes.number, // a number between 1 and 3 where 1 means taking 100% of the width, 2 means taking 50% of the width, and 3 means taking 33.33% of the width
        labelOutside: PropTypes.bool,
        allowedFileTypes: PropTypes.arrayOf(PropTypes.string.isRequired),
    })).isRequired,
    mailTo: PropTypes.string.isRequired,
    sendPdf: PropTypes.bool.isRequired,
};

export default Form;