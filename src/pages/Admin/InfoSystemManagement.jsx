import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {infoSystemManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";

function InfoSystemManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, infoSystemManagementPermissionLevel, setIsLoading)
        .then(
            () => {
                //TODO: Fetch data here
            }
        )
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"info-system-management-page"}>

                <p>
                    This Page is Under Construction
                </p>

            </div>
        </>
    )
}

export default InfoSystemManagement;