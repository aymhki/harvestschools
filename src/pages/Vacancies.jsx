import {Helmet} from "react-helmet";
import '../styles/Vacancies.css'
import Form from "../modules/Form";

function Vacancies() {
  return (
    <div className={"vacancies-page"}>
        <Helmet>
            <title>Harvest International School | Vacancies</title>
            <meta name="description"
                  content="Learn more about the available vacancies, job openings, and career opportunities, and the job application process at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, International School, Vacancies, Job Openings, Career Opportunities, Job Application, مدارس هارفست, برج العرب, مدرسة, فرص عمل, وظائف شاغرة, تقديم للوظائف"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <container className={"extreme-padding-container"}>


          <h1>Vacancies</h1>
            <h2>
                Dear Applicant,
            </h2>
            <p>
                Harvest Schools does not only hire experienced people or fresh graduates, At Harvest Schools, we believe in opportunities for creative, knowledgeable, and open mindsets. We are always hiring, upload it here using this tool:
            </p>



            <Form sendPdf={false} mailTo={'info@harvestschools.com'} formTitle={'Resume Submission'} fields={[
                {
                    id: 1,
                    type: 'file',
                    name: 'resume',
                    label: 'Resume',
                    required: true,
                    placeholder: 'Upload your resume here',
                    allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', '.pdf', '.doc', '.docx', '.odt'],
                    errorMessage: 'Please upload your resume in PDF format',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                    httpName: 'resume'


                }
            ]} />

            <p>
                However, If you would like to create a new CV, you can use the application tool  below. After filing the form, your new CV will be sent to us. If you are not sure about any of the fields required in the form, please read the example pdf available here:
            </p>

            <div className={"download-cv-button-wrapper"} >
                <button className={"download-cv-button"} onClick={() => {window.open("/assets/documents/Vacancies/ResumeExample.pdf", "_blank")}}>Download CV Example</button>
            </div>

            <p>
                Note: After submitting, a confirmation message should appear. Do not close your browser until you see this message otherwise we will not receive your form. If a field does not apply to your experience/education, please type "N/A."
            </p>

            <Form sendPdf={false} formTitle={'Resume Submission'} mailTo={'info@harvestschools.com'} fields={[
                {
                    id: 1,
                    type: 'text',
                    name: 'first-name',
                    label: 'First Name',
                    required: true,
                    placeholder: 'First Name',
                    errorMsg: 'Please enter your first name',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'first-name',


                },
                {
                    id: 2,
                    type: 'text',
                    name: 'last-name',
                    label: 'Last Name',
                    required: true,
                    placeholder: 'Last Name',
                    errorMsg: 'Please enter your last name',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'last-name'
                },
                {
                    id: 3,
                    type: 'date',
                    name: 'dob',
                    label: 'Date of Birth',
                    required: true,
                    placeholder: 'Date of Birth',
                    errorMsg: 'Please enter your date of birth in the format YYYY-MM-DD',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'dob',
                    regex: /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/

                },
                {
                    id: 4,
                    type: 'email',
                    name: 'email',
                    label: 'Email',
                    required: true,
                    placeholder: 'Email',
                    errorMsg: 'Please enter your email',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'email'
                },
                {
                    id: 5,
                    type: 'tel',
                    name: 'phone',
                    label: 'Phone Number',
                    required: true,
                    placeholder: 'Phone Number',
                    errorMsg: 'Please enter your phone number',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'phone'
                },
                {
                    id: 6,
                    type: 'select',
                    name: 'gender',
                    choices: ['Male', 'Female'],
                    widthOfField: 3,
                    required: true,
                    label: 'Gender',
                    errorMsg: 'Please select your gender',
                    value: '',
                    setValue: null,
                    httpName: 'gender'
                },
                {
                    id: 7,
                    type: 'file',
                    name: 'personal-photo',
                    label: 'Personal Photo',
                    required: false,
                    placeholder: 'Upload your personal photo here',
                    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff', 'image/svg+xml', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
                    errorMsg: 'Please upload your personal photo in a valid format',
                    value: '',
                    setValue: null,
                    widthOfField: 1,

                },
                {
                    id: 8,
                    type: 'text',
                    name: 'address-1',
                    label: 'Address 1: Street',
                    required: true,
                    placeholder: 'Address 1: Street',
                    errorMsg: 'Please enter your street address',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'address-1'
                },
                {
                    id: 9,
                    type: 'select',
                    name: 'address-2',
                    choices: ['Burj Al Arab', 'Raml Station', 'Azareta', 'Al Shoban Al Muslimen', 'Al Shatby', 'Kamp Cheezar', 'Ibrahmia', 'Sporting', 'Kilopatra', 'Sidi Gaber', 'Mostafa Kamel', 'Roshdy', 'Bolkely', 'Al Wzara', 'Fliming', 'Bakoos', 'Safr', 'Janakless', 'San Stefano', 'Thrwt', 'Loran', 'Al Sraia', 'Al Siof', 'Victoria', 'Street 45', 'Smouha', 'Abo Qeer', 'Mandra', 'Manshia', 'Mohram Beek', 'Bitash', 'Hanoviel', 'Abo Youssef', 'Agmy', 'Al Kilo 21', 'North Coast', 'Other'],
                    widthOfField: 3,
                    required: true,
                    label: 'Address 2: District',
                    errorMsg: 'Please select your district',
                    value: '',
                    setValue: null,
                    httpName: 'address-2'

                },
                {
                    id: 10,
                    type: 'text',
                    name: 'address-2-other',
                    label: 'If Other District: Specify',
                    required: false,
                    placeholder: 'If Other District: Specify',
                    errorMsg: 'Please specify your district',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'address-2-other'
                },
                {
                    id: 11,
                    type: 'select',
                    name: 'position-applying-for',
                    choices: ['Teacher', 'Assistant', 'Social Worker', 'Coordinator', 'Administrator', 'Human Resources (HR)', 'Accountant', 'Event Planner', 'Project Manger', 'Marketing Manger', 'Designer', 'Stock Manger', 'IT Engineer', 'Quality Control Manger', 'Maintainance Manger', 'Transportation Manger', 'Receptionist', 'Secretary', 'Intern', 'Worker', 'Part - Timer', 'Other'],
                    widthOfField: 3,
                    required: true,
                    label: 'Position Applying For',
                    errorMsg: 'Please select the position you are applying for',
                    value: '',
                    setValue: null,
                    httpName: 'position-applying-for'
                },
                {
                    id: 12,
                    type: 'text',
                    name: 'position-applying-for-other',
                    label: 'If Other Position: Specify',
                    required: false,
                    placeholder: 'If Other Position: Specify',
                    errorMsg: 'Please specify the position you are applying for',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'position-applying-for-other'
                },
                {
                    id: 13,
                    type: 'text',
                    name: 'high-school',
                    label: 'What was your high school?',
                    required: true,
                    placeholder: 'What was your high school?',
                    errorMsg: 'Please enter the name of your high school',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'high-school'
                },
                {
                    id: 14,
                    type: 'select',
                    name: 'high-school-system',
                    choices: ['IGCSE', 'American', 'National', 'Other'],
                    widthOfField: 3,
                    required: true,
                    label: 'What was your high school system?',
                    errorMsg: 'Please select the system of your high school',
                    value: '',
                    setValue: null,
                    httpName: 'high-school-system'
                },
                {
                    id: 15,
                    type: 'text',
                    name: 'high-school-system-other',
                    label: 'If Other System: Specify',
                    required: false,
                    placeholder: 'If Other System: Specify',
                    errorMsg: 'Please specify the system of your high school',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'high-school-system-other'
                },
                {
                    id: 16,
                    type: 'date',
                    name: 'high-school-finish-date',
                    label: 'When did you finish high school?',
                    required: true,
                    placeholder: 'When did you finish high school?',
                    errorMsg: 'Please enter the date you finished high school in the format YYYY-MM-DD',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'high-school-finish-date',
                    regex: /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/

                },
                {
                    id: 17,
                    type: 'text',
                    name: 'graduation-institution',
                    label: 'What institution did you graduate from?',
                    required: true,
                    placeholder: 'What institution did you graduate from?',
                    errorMsg: 'Please enter the institution you graduated from',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'graduation-institution'

                },
                {
                    id: 18,
                    type: 'text',
                    name: 'graduation-degree',
                    label: 'What did you graduate in?',
                    required: true,
                    placeholder: 'What did you graduate in?',
                    errorMsg: 'Please enter the degree you graduated in',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'graduation-degree'
                },
                {
                    id: 19,
                    type: 'date',
                    name: 'graduation-date',
                    label: 'When did you graduate?',
                    required: true,
                    placeholder: 'When did you graduate?',
                    errorMsg: 'Please enter the date you graduated in the format YYYY-MM-DD',
                    value: '',
                    setValue: null,
                    widthOfField: 3,
                    httpName: 'graduation-date',
                    regex: /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/

                },
                {
                    id: 20,
                    type: 'select',
                    name: 'years-of-experience',
                    choices: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'],
                    widthOfField: 1,
                    required: true,
                    label: 'Number of Years of Experience',
                    errorMsg: 'Please select the number of years of experience',
                    value: '',
                    setValue: null,
                    httpName: 'years-of-experience'
                },
                {
                    id: 21,
                    type: 'textarea',
                    name: 'experience',
                    label: 'Write your experience here',
                    required: false,
                    placeholder: 'Write your experience here',
                    errorMsg: 'Please write about your experience',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                    httpName: 'experience'
                },
                {
                    id: 22,
                    type: 'textarea',
                    name: 'skills',
                    label: 'Write your skills or hobbies here',
                    required: false,
                    placeholder: 'Write your skills or hobbies here',
                    errorMsg: 'Please write about your skills or hobbies',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                    httpName: 'skills'
                },
                {
                    id: 23,
                    type: 'textarea',
                    name: 'about',
                    label: 'Here you can write anything you want to add about yourself',
                    required: false,
                    placeholder: 'Here you can write anything you want to add about yourself',
                    errorMsg: 'Please write about yourself',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                },
                {
                    id: 24,
                    type: 'file',
                    name: 'attachment-1',
                    label: 'If you wanted to attach cover letters, certificates, or anything that you\'re proud of!',
                    required: false,
                    placeholder: 'Upload your attachment here',
                    allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', '.pdf', '.doc', '.docx', '.odt'],
                    errorMsg: 'Please upload your attachment in PDF format',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                    httpName: 'attachment-1'
                },
                {
                    id: 25,
                    type: 'file',
                    name: 'attachment-2',
                    label: 'If you wanted to attach cover letters, certificates, or anything that you\'re proud of!',
                    required: false,
                    placeholder: 'Upload your attachment here',
                    allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', '.pdf', '.doc', '.docx', '.odt'],
                    errorMsg: 'Please upload your attachment in PDF format',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                    httpName: 'attachment-2'
                },
                {
                    id: 26,
                    type: 'file',
                    name: 'attachment-3',
                    label: 'If you wanted to attach cover letters, certificates, or anything that you\'re proud of!',
                    required: false,
                    placeholder: 'Upload your attachment here',
                    allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', '.pdf', '.doc', '.docx', '.odt'],
                    errorMsg: 'Please upload your attachment in PDF format',
                    value: '',
                    setValue: null,
                    widthOfField: 1,
                    httpName: 'attachment-3'
                }

            ]}/>

        </container>
    </div>
  );
}

export default Vacancies;