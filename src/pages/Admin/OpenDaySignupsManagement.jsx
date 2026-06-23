import '../../styles/AdminDashboard.css';
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import { fetchAllOpenDaySignups } from "../../services/Public/OpenDaySignups/OpenDaySignupsServices.jsx";


function OpenDaySignupsManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [openDaySignups, setOpenDaySignups] = useState(null);

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, 2, setIsLoading);
    }, []);

    const loadTableData = async () => {
        try {
            setIsLoading(true);
            await fetchAllOpenDaySignups(navigate, setOpenDaySignups)
        } catch (error) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTableData();
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}
            <div className={"open-day-signups-page"}>
                <Table tableData={openDaySignups}
                       scrollable={true}
                       compact={true}
                       allowHideColumns={true}
                       allowSticky={true}
                       defaultHiddenColumns={
                            [
                                'Registration Created',
                                'Children Created',
                            ]
                       }
                       allowExport={true}
                       exportFileName={'open-day-signups'}
                       headerModuleElements={[
                           (
                               <button key={1} onClick={loadTableData} disabled={isLoading}>
                                   {isLoading ? 'Loading...' : 'Reload Table Data'}
                               </button>
                           ),

                       ]}
                       sortConfigParam={{column: 0, direction: 'descending'}}
                       filterableColumns={
                           [
                               'Payment Status'
                           ]
                       }
                />
            </div>
        </>
    )
}

export default OpenDaySignupsManagement;