import '../../styles/Admission.css';
import {useNavigate} from "react-router-dom";

function AdmissionProcess() {
    const navigate = useNavigate();

  return (
    <div className="admission-process-page">
        <container className="extreme-padding-container">
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

        </container>


    </div>
  );
}

export default AdmissionProcess;