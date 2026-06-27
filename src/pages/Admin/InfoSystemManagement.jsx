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
import {fetchInfoSystemData, updateInfoSystemData} from "../../services/Admin/InfoSystem/AdminInfoSystemManagementServices.jsx"

function InfoSystemManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [globalSettingsData, setGlobalSettingsData] = useState(null);
    const [departmentsData, setDepartmentsData] = useState(null);
    const [stagesData, setStagesData] = useState(null);

    const GlobalSettings = () => (
        <div className="admin-page-tab-content">
            <Table tableData={globalSettingsData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
           />
        </div>
    );

    const Departments = () => (
        <div className="admin-page-tab-content">
            <Table tableData={departmentsData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
            />
        </div>
    );

    const Stages = () => (
        <div className="admin-page-tab-content">
            <Table tableData={stagesData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
            />
        </div>
    );

    const reloadData = async () => {
        await fetchInfoSystemData(navigate, setGlobalSettingsData, setDepartmentsData, setStagesData);
    }


    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, infoSystemManagementPermissionLevel, setIsLoading)
        .then(
            () => {
                reloadData();
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