import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import {useMemo} from "react";
import PropTypes from "prop-types";

function AdminDashboard({ dashboardOptions, isLoading, loggedInUsername }) {
    const navigate = useNavigate();

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        let timeGreeting = "Evening";
        if (hour < 12) {
            timeGreeting = "Morning";
        } else if (hour < 18) {
            timeGreeting = "Afternoon";
        }

        const timeBasedGreeting = `${timeGreeting}, ${loggedInUsername}`;

        const otherOptions = [
            `Back at it, Boss`,
            `Welcome back, ${loggedInUsername}`,
            `Ready to roll, ${loggedInUsername}?`,
            `Let's get to work, ${loggedInUsername}`
        ];

        if (Math.random() < 0.25) {
            return timeBasedGreeting;
        } else {
            const randomIndex = Math.floor(Math.random() * otherOptions.length);
            return otherOptions[randomIndex];
        }
    }, [loggedInUsername]);

    return (
        <div className={"dashboard-page"}>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <OptionsGrid
                        options={dashboardOptions}
                        compact={true}
                        title={greeting}
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
    loggedInUsername: PropTypes.string.isRequired,
};

export default AdminDashboard;
