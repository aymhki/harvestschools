import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/AdminNavigationServices.jsx";


function InfoSystemManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, 7, setIsLoading)
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

            </div>
        </>
    )
}

export default InfoSystemManagement;