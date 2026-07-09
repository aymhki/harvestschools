import '../../styles/AdminDashboard.css';
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {BorrowingSystemManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";

function BorrowingSystemManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, BorrowingSystemManagementPermissionLevel, setIsLoading);
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}
            <div className={"borrowing-system-management-page"}>


                <p>
                    This Page is Under Construction
                </p>

            </div>
        </>
    )

}

export default BorrowingSystemManagement;

