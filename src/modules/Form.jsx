
import PropTypes from "prop-types";
import {useState} from "react";
import {Fragment} from "react";
import '../styles/Form.css'
import jsPDF from 'jspdf';


function Form({fields, mailTo, sendPdf, formTitle, lang}) {
    const [submitting, setSubmitting] = useState(false); //disable fields when submitting
    const [generalFormError, setGeneralFormError] = useState(''); //general form error message
    const [successMessage, setSuccessMessage] = useState(''); //success message

    const onChange = (e, field) => {
        const maxSizeInBytes = 2 * 1024 * 1024;
        const value = (field.type === 'radio' || field.type === 'checkbox') ? e.target.checked : e.target.value;

        if (field.type === 'file' && e.target.files[0].size > maxSizeInBytes) {
            e.target.setCustomValidity('File size must be less than 2MB');
        } else {

            if (field.regex && !new RegExp(field.regex).test(value)) {
                e.target.setCustomValidity(field.errorMsg);
            } else {
                e.target.setCustomValidity('');
                setGeneralFormError('');
                setSuccessMessage('');

            }
        }
    }

    const renderFieldBasedOnType = (field) => {


            return (
                <Fragment key={field.id} >
                {field.labelOutside && <label htmlFor={field.id} className={ "form-label-outside"}>
                    {field.label}

                </label>}

                    {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'time' || field.type === 'password') &&
                        <input
                            type={field.type}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={field.placeholder ? field.placeholder : field.label}
                            disabled={submitting}
                            onChange={(e) => onChange(e, field)}
                            className={`text-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                        />
                    }

                    {field.type === 'date' && (

                        <input
                            type={'text'}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={field.placeholder ? field.placeholder+' (YYYY-MM-DD)' : field.label+' (YYYY-MM-DD)'}
                            disabled={submitting}
                            onChange={(e) => {
                                onChange(e, field);
                            }}
                            className={`text-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                        />
                    )}

                    {field.type === 'textarea' &&
                        <textarea
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={field.placeholder ? field.placeholder : field.label}
                            disabled={submitting}
                            onChange={(e) => onChange(e, field)}
                            className={`textarea-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                        />
                    }

                    {field.type === 'select' &&
                        <select
                            multiple={field.multiple}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            disabled={submitting}

                            className={
                            field.multiple ? (
                                `select-multiple-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`
                                ) :

                                (`select-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`)

                            }

                            onChange={(e) => onChange(e, field)}
                        >
                            {(!field.multiple) && <option value="">{field.label}</option>}
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
                        <div className={`file-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                        <label htmlFor={field.id} >{field.label}</label>
                        <input
                            type="file"
                            id={field.id}
                            name={field.httpName}
                            label={field.label}
                            required={field.required}
                            accept={field.allowedFileTypes ? field.allowedFileTypes.join(',') : ''}
                            disabled={submitting}
                            onChange={(e) => {
                                const file = e.target.files[0];

                                if (file && !field.allowedFileTypes.includes(file.type)) {
                                    e.target.setCustomValidity(`File type must be one of the following: ${field.allowedFileTypes.join(', ')}`);
                                } else if (file && file.size > 2 * 1024 * 1024) {
                                    e.target.setCustomValidity('File size must be less than 2MB');
                                }else {
                                    e.target.setCustomValidity('');
                                    setGeneralFormError('');
                                    setSuccessMessage('');
                                    field.file = file;
                                }
                            }}
                        >
                        </input>
                            <label>
                                Maximum file size: 2MB
                            </label>

                        </div>

                    }

                </Fragment>
            );

    }



    const onSubmit = async (e) => {
        e.preventDefault();
        if (submitting) { return; }
        setSubmitting(true);
        setGeneralFormError('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            fields.forEach(field => {
                const value = document.getElementById(field.id).value;
                formData.append(`field_${field.id}`, value);
                formData.append(`label_${field.id}`, field.label); // Append labels separately

                if(field.type === 'file') {
                    formData.append(field.label, field.file, field.file.name ? field.file.name : field.label);
                }
            });

            if (sendPdf) {
                const pdf = new jsPDF();
                pdf.text("Form Submission", 10, 10);
                pdf.text(`Title: ${formTitle}`, 10, 20);
                fields.forEach((field, index) => {
                    const value = document.getElementById(field.id).value;
                    pdf.text(`${field.label}: ${value}`, 10, 30 + (index * 10));
                });

                const pdfBlob = pdf.output('blob');
                formData.append('pdfFile', pdfBlob, 'form.pdf');
            }

            formData.append('mailTo', mailTo);
            formData.append('formTitle', formTitle);

            const response = await fetch('/forms/script.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                setSuccessMessage(lang === 'ar' ? 'تم الارسال بنجاح' : 'Form submitted successfully!');
                setTimeout(() => { setSuccessMessage(''); }, 3000);
            } else {
                setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.');
                setTimeout(() => { setGeneralFormError(''); }, 3000);
            }
        } catch (error) {
            setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.');
            setTimeout(() => { setGeneralFormError(''); }, 3000);
        } finally {
            setSubmitting(false);
        }
    };




    return (
        <form
            className="form"
            onSubmit={onSubmit}
            method="post"
        >
            {fields.map((field, index) => (
                    renderFieldBasedOnType(field, index)
            ))}



            <div className="form-footer">

                {
                    lang === 'ar' ? (
                        <button type="submit" disabled={submitting}
                                className="submit-button">{submitting ? 'جاري الارسال...' : 'ارسال'}</button>
                    ) : (
                        <button type="submit" disabled={submitting}
                                className="submit-button">{submitting ? 'Submitting...' : 'Submit'}</button>
                    )
                }


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
        placeholder: PropTypes.string,
        multiple: PropTypes.bool,
    })).isRequired,
    mailTo: PropTypes.string.isRequired,
    sendPdf: PropTypes.bool.isRequired,
    formTitle: PropTypes.string.isRequired,
    lang: PropTypes.string.isRequired,
};

export default Form;