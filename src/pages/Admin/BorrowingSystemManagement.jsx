import '../../styles/AdminDashboard.css';
import {useEffect} from "react";
import {useNavigate} from "react-router";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {BorrowingSystemManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'

function BorrowingSystemManagement() {
    const navigate = useNavigate();
    const [, setIsLoading] = useLoading(false);


    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, BorrowingSystemManagementPermissionLevel, setIsLoading);
    }, []);

    return (
        <>
            <div className={"borrowing-system-management-page"}>


                <p>
                    This Page is Under Construction
                </p>

            </div>
        </>
    )

}

export default BorrowingSystemManagement;

