import '../../styles/AdminDashboard.css';
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/AdminNavigationServices.jsx";


function OpenDaySignupsManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, 2, setIsLoading);
    }, []);


    return (
        <>
            {isLoading && <Spinner/>}
            <div className={"open-day-signups-page"}>
                <h1>Open Day Signups</h1>
                <p>This page is under construction. Please check back later.</p>
            </div>
        </>
    )
}

export default OpenDaySignupsManagement;