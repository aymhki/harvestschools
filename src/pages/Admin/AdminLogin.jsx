import '../../styles/AdminLogin.css'
import {useState, useEffect} from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Form from '../../modules/Form.jsx'
import {
    checkAdminSessionFromAdminLogin,
    checkBookingSessionFromBookingLogin,
    validateAdminLogin
} from "../../services/Utils.jsx";

function AdminLogin() {
    const navigate = useNavigate();
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const usernameFieldId = 1
    const passwordFieldId = 2

    const handleAdminLogin = async (formData) => {
        if (submittingLocal) {return;}
        setSubmittingLocal(true);

        try {
            const result = await  validateAdminLogin(formData, usernameFieldId, passwordFieldId, navigate);

            if (result && !result.success) {
                throw new Error(result.message);
            }
        } catch (error) {
            throw new Error(error.message);
        } finally {
            setSubmittingLocal(false);
        }
    };

    useEffect(() => {
        async function goToAdminDashboardIfSessionIsValid() {
            try {
                await checkAdminSessionFromAdminLogin(navigate);
            } catch (error) {
                console.log(error.message);
            }
        }

        goToAdminDashboardIfSessionIsValid()
    }, []);

  return (
      <>
          {submittingLocal && <Spinner/>}

            <div className={'admin-login-page'}>
                <div className={'admin-login-page-form-controller'}>
                    <div className={'admin-login-form-wrapper'}>

                            <h2>Admin Login</h2>

                            <Form mailTo={''}
                                  sendPdf={false}
                                  formTitle={'Admin Login'}
                                  lang={'en'}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={false}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleAdminLogin}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={['Login', 'Logging in...', 'تسجيل دخول', 'جاري تسجيل الدخول...']}
                                  noClearOption={true}
                                  centerSubmitButton={true}
                                  easySimpleCaptcha={true}
                                  fullMarginField={true}
                                  hasSetSubmittingLocal={true}
                                  setSubmittingLocal={setSubmittingLocal}
                                  fields={
                                    [
                                        {
                                            id: usernameFieldId,
                                            type: 'text',
                                            name: 'username',
                                            label: 'Username',
                                            required: true,
                                            placeholder: 'Username',
                                            errorMsg: 'Please enter username',
                                            value: '',
                                            setValue: null,
                                            widthOfField: 1,
                                            httpName: 'username',

                                        },
                                        {
                                            id: passwordFieldId,
                                            type: 'password',
                                            name: 'password',
                                            label: 'Password',
                                            required: true,
                                            placeholder: 'Password',
                                            errorMsg: 'Please enter password',
                                            widthOfField: 1,
                                            value: '',
                                            setValue: null,
                                            httpName: 'password',
                                        },
                                    ]
                                  }

                            />
                    </div>
                </div>
            </div>

      </>
  );
}

export default AdminLogin;