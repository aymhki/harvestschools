import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {infoSystemManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";
import TabsPage from "../../modules/TabsPage.jsx";

function InfoSystemManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const GlobalSettings = () => (
        <div className="admin-page-tab-content">
            <p>This Page is Under Construction</p>
        </div>
    );

    const Departments = () => (
        <div className="admin-page-tab-content">
            <p>This Page is Under Construction</p>
        </div>
    );

    const Stages = () => (
        <div className="admin-page-tab-content">
            <p>This Page is Under Construction</p>
        </div>
    );


    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, infoSystemManagementPermissionLevel, setIsLoading)
        .then(
            () => {
                //TODO: Fetch data here
            }
        )
    }, []);

    const tabData = [
            {
                id: 0,
                label: 'Global Settings',
                component: GlobalSettings
            },
            {
                id: 1,
                label: 'Departments',
                component: Departments
            },
            {
                id: 2,
                label: 'Stages',
                component: Stages
            },
    ]

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"info-system-management-page"}>
                <TabsPage tabData={tabData} initialTab={0}/>
            </div>
        </>
    )
}

export default InfoSystemManagement;