import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/Dashboard.css';
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import {checkAdminSessionFromAdminDashboard} from "../../services/Utils.jsx";

function Dashboard() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [dashboardOptions, setDashboardOptions] = useState([]);

    useEffect(() => {
        setIsLoading(true);
        checkAdminSessionFromAdminDashboard(navigate, setDashboardOptions)
        .finally(
            () => {
                setIsLoading(false);
            }
        );
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