import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import PropTypes from "prop-types";

function AdminDashboard({ dashboardOptions, isLoading }) {
    const navigate = useNavigate();

    return (
        <div className={"dashboard-page"}>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <OptionsGrid
                        options={dashboardOptions}
                        compact={true}
                        title={"Dashboard"}
                        divElements={[(
                            <div className={"dashboard-page-footer"} key={1}>
                                <button onClick={() => {
                                    document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                                    document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                                    navigate('/login');
                                }}>Logout</button>
                            </div>
                        )]}
                    />



                </>
            )}
        </div>
    );
}

AdminDashboard.propTypes = {
    dashboardOptions: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
};

export default AdminDashboard;
