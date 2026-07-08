import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import { useMemo} from "react";
import PropTypes from "prop-types";
import {logoutCurrentAdmin} from "../../services/General/GeneralUtils.jsx";

function AdminDashboard({ dashboardOptions, isLoading, loggedInName }) {
    const navigate = useNavigate();

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        let timeGreeting = "Evening";
        if (hour < 12) {
            timeGreeting = "Morning";
        } else if (hour < 18) {
            timeGreeting = "Afternoon";
        }

        const finalLoggedInUsername = loggedInName ? loggedInName.split(' ')[0].slice(0, 24) : 'Admin'
        const timeBasedGreeting = `${timeGreeting}, ${finalLoggedInUsername}`;

        const otherOptions = [
            `Back at it, Boss`,
            `Welcome back, ${finalLoggedInUsername}`,
            `Ready to roll, ${finalLoggedInUsername}?`,
            `Let's get to work, ${finalLoggedInUsername}`
        ];

        if (Math.random() < 0.33) {
            return timeBasedGreeting;
        } else {
            const randomIndex = Math.floor(Math.random() * otherOptions.length);
            return otherOptions[randomIndex];
        }
    }, [loggedInName]);

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
                                    logoutCurrentAdmin(navigate);
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
    loggedInName: PropTypes.string.isRequired,
};

export default AdminDashboard;
