import '../../styles/AdminDashboard.css';
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {useTranslation} from "react-i18next";

function BorrowingSystemManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, 3, setIsLoading);
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}
            <div className={"borrowing-system-management-page"}>


                <p>
                    {t("common.this-page-is-under-construction", {ns: 'common'})}
                </p>

            </div>
        </>
    )

}

export default BorrowingSystemManagement;

