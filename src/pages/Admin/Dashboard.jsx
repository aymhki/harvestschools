import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/Dashboard.css';
import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import {sessionDuration, getCookies} from "../../services/Utils.jsx";

function Dashboard() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardOptions, setDashboardOptions] = useState([]);

    useEffect(() => {
        const checkAdminSession = async () => {
            const cookies = getCookies();

            const sessionId = cookies.harvest_schools_admin_session_id;
            const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

            if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
                document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                navigate('/admin/login');
                return;
            }

            try {
                const sessionResponse = await axios.post('/scripts/checkAdminSession.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!sessionResponse.data.success) {
                    navigate('/admin/login');
                    return;
                }

                const permissionsResponse = await axios.post('/scripts/getDashboardPermissions.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (permissionsResponse.data.success) {
                    setDashboardOptions(permissionsResponse.data.dashboardOptions);
                }

                setIsLoading(false);

            } catch (error) {
                console.log(error.message);
                setIsLoading(false);
                navigate('/admin/login');
            }
        };

        checkAdminSession();
    }, []);

    return (
        <div className={"dashboard-page"}>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <OptionsGrid
                        options={dashboardOptions}
                        title={"Dashboard"}
                        divElements={[(
                            <div className={"dashboard-page-footer"} key={1}>
                                <button onClick={() => {
                                    document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                                    document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                                    navigate('/admin/login');
                                }}>Logout</button>
                            </div>
                        )]}
                    />



                </>
            )}
        </div>
    );
}

export default Dashboard;