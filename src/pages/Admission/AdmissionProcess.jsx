import '../../styles/Admission.css';
import {useNavigate} from "react-router-dom";
import {Helmet} from "react-helmet-async";


function AdmissionProcess() {
    const navigate = useNavigate();

  return (
    <div className="admission-process-page">
        <Helmet>
            <title>Harvest International School | Admission Process</title>
            <meta name="description"
                  content="Learn more about the admission process in terms of the application process, the interview, and the follow-up process for Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Admission, Admission Process, Admission Requirements, Admissione Fees, مصاريف مدارس هارفست، متطلبات القبول، عملية القبول"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className="extreme-padding-container">
            <img src={'/assets/images/AdmissionPages/AdmissionProcess.png'} className={"admission-process-image"}
                 alt="Admission Process"/>

            <div className="admission-process-steps">
                <div className="admission-process-step">
                    <h2>Fill An Application</h2>

                    <p>
                        You can apply online by clicking the button below, or visit the schools reception fill the
                        application in person.
                    </p>

                    <div className={"admission-process-button-wrapper"}>

                        <button className="admission-process-button"
                                onClick={() => window.open('https://schooleverywhere-harvest.com/schooleverywhere/management/onlineadmission/applyonline/onlineadmission.php', '_blank')}>Apply
                            Now
                        </button>

                    </div>
                </div>
                <div className="admission-process-step">
                    <h2>Attend Your Interview</h2>
                    <p>
                        we will directly review your application and book an appointment for the interview with both the
                        parents and the students(Interviews with students could involve entry level tests according to
                        the educational stage of the student and his/her origin school).
                    </p>
                </div>
                <div className="admission-process-step">
                    <h2>Follow Up</h2>
                    <p>
                        After the interview, the students affairs department will get in touch with the accepted
                        applicants to start the registration process, which include providing the required documents and
                        paying the tuition fees.
                    </p>

                    <div className={"admission-process-button-wrapper"}>
                        <button onClick={() => navigate('/admission/admission-fees')}
                                className="admission-process-button">Admission Fees
                        </button>

                        <button onClick={() => navigate('/admission/admission-requirements')}
                                className="admission-process-button">Required Documents
                        </button>
                    </div>
                </div>
            </div>

        </div>


    </div>
  );
}

export default AdmissionProcess;