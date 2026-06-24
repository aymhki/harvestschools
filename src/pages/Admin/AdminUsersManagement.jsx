import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";


function AdminUsersManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, 1000, setIsLoading)
            .then(
                () => {
                    //TODO: Fetch data here
                }
            )
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"admin-users-management-page"}>

                <p>
                    This Page is Under Construction
                </p>

            </div>
        </>
    )
}

export default AdminUsersManagement;