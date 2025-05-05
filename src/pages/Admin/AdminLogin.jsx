import '../../styles/AdminLogin.css'
import {useState, useEffect} from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";

function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleAdminLogin = async (e) => {
        e.preventDefault();

        if (submitting) {
            return;
        }

        if (username === '' || password === '') {
            setErrorMsg('Please enter username and password');
            setTimeout(() => { setErrorMsg(''); }, 3000);
            return;
        }

        setSubmitting(true);

        try {
            const response = await axios.post('scripts/validateAdminLogin.php', {
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
                document.cookie = `harvest_schools_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
                document.cookie = `harvest_schools_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;


                const sessionResponse = await axios.post('scripts/createAdminSession.php', {
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
                    setErrorMsg('Session creation failed. Please try again');

                    setTimeout(() => { setErrorMsg(''); }, 3000);
                }

                setSubmitting(false);
            } else {
                setErrorMsg('Login failed. Wrong Username or Password. Please try again');
                console.log(response.data);
                setTimeout(() => { setErrorMsg(''); }, 3000);
                setSubmitting(false);
            }

        } catch (error) {
            setErrorMsg('Login failed. Please try again');
            console.log(error);
            setTimeout(() => { setErrorMsg(''); }, 3000);
            setSubmitting(false);
        }
    };



    useEffect(() => {
        const checkAdminSession = async () => {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});

            const sessionId = cookies.harvest_schools_session_id;
            const sessionTime = parseInt(cookies.harvest_schools_session_time, 10);

            if (!sessionId || !sessionTime || (Date.now() - sessionTime) > 3600000) {
                document.cookie = 'harvest_schools_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'harvest_schools_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                return;
            }

            try {
                const response = await axios.post('scripts/checkAdminSession.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    navigate('/dashboard');
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
          {submitting && <Spinner/>}

            <div className={'admin-login-page'}>
                <div className={'admin-login-page-form-controller'}>
                    <div className={'admin-login-form-wrapper'}>

                        <form className={'admin-login-form'} onSubmit={handleAdminLogin}
                              onReset={(e) => {
                                    e.preventDefault();
                                    setUsername('');
                                    setPassword('');
                              }}
                        >
                            <h2>Admin Login</h2>
                            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)}
                                   value={username}/>
                            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)}
                                   value={password}/>
                            <p className={'admin-login-error-msg'}>{errorMsg}</p>
                            <button disabled={submitting} type={"submit"}>Login</button>
                        </form>
                    </div>
                </div>
            </div>

      </>
  );
}

export default AdminLogin;