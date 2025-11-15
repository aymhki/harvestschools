import '../../styles/AdminLogin.css'
import {useState, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Form from '../../modules/Form.jsx'
import {headToAdminDashboardOnValidSession, validateAdminLogin} from "../../services/Utils.jsx";
import {useTranslation} from "react-i18next";

function AdminLogin() {
    const navigate = useNavigate();
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const usernameFieldId = 1
    const passwordFieldId = 2
    const { t } = useTranslation();

    const handleAdminLogin = async (formData) => {
        if (submittingLocal) {return;}
        setSubmittingLocal(true);

        try {
            const result = await  validateAdminLogin(formData, usernameFieldId, passwordFieldId, navigate);

            if (result && !result.success) {
                throw new Error(result.message);
            } else {
                return true;
            }
        } catch (error) {
            throw new Error(error.message);
        } finally {
            setSubmittingLocal(false);
        }
    };

    useEffect(() => {
        headToAdminDashboardOnValidSession(navigate, setSubmittingLocal)
    }, []);

  return (
      <>
          {submittingLocal && <Spinner/>}

            <div className={'admin-login-page'}>
                <div className={'admin-login-page-form-controller'}>
                    <div className={'admin-login-form-wrapper'}>

                            <h2>
                                {t("admin.login-page.title")}
                            </h2>

                            <Form mailTo={''}
                                  sendPdf={false}
                                  formTitle={t("admin.login-page.title")}
                                  lang={'en'}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={false}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleAdminLogin}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={[t("admin.login-page.login-btn"), t("admin.login-page.logging-in-btn")]}
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
                                            displayLabel: t("admin.login-page.username-field"),
                                            required: true,
                                            placeholder: t("admin.login-page.username-field"),
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
                                            displayLabel: t("admin.login-page.password-field"),
                                            required: true,
                                            placeholder: t("admin.login-page.password-field"),
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
