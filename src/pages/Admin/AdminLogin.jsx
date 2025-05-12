import '../../styles/AdminLogin.css'
import {useState, useEffect} from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Form from '../../modules/Form.jsx'

function AdminLogin() {
    const navigate = useNavigate();
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const usernameFieldId = 1
    const passwordFieldId = 2

    const handleAdminLogin = async (formData) => {

        if (submittingLocal) {
            return;
        }

        const formDataEntries = Array.from(formData.entries());
        const username = formDataEntries.find(entry => entry[0] ===  ('field_' + usernameFieldId) )[1];
        const password = formDataEntries.find(entry => entry[0] ===  ('field_' + passwordFieldId) )[1];

        try {
            const response = await axios.post('/scripts/validateAdminLogin.php', {
                username,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const sessionId = uuidv4();
                const sessionExpiry = new Date();
                sessionExpiry.setHours(sessionExpiry.getHours() + 1);
                document.cookie = `harvest_schools_admin_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
                document.cookie = `harvest_schools_admin_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;


                const sessionResponse = await axios.post('/scripts/createAdminSession.php', {
                    username: username,
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (sessionResponse.data.success) {
                    navigate('/admin/dashboard');
                } else {
                    throw new Error('Session creation failed. Please try again');
                }

            } else {
                throw new Error('Login failed. Wrong Username or Password. Please try again');
            }

        } catch (error) {
            throw new Error(error.message);
        }
    };



    useEffect(() => {
        const checkAdminSession = async () => {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});

            const sessionId = cookies.harvest_schools_admin_session_id;
            const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

            if (!sessionId || !sessionTime || (Date.now() - sessionTime) > 3600000) {
                document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                return;
            }

            try {
                const response = await axios.post('/scripts/checkAdminSession.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    navigate('/admin/dashboard');
                }
            } catch (error) {
                console.log(error);
            }
        };

        checkAdminSession().then(() =>
            console.log('Session checked')
        );
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