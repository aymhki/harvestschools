import '../../styles/AdminDashboard.css';
import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";
import {checkAdminSession} from "../../services/Utils.jsx";

function JobApplications() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [jobApplications, setJobApplications] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        checkAdminSession(navigate, 0)
        .finally(
            () => {
                setIsLoading(false)
            }
        )
    }, []);

    const loadTableData = async () => {
        setIsLoading(true);
        setJobApplications(null);
        const timestamp = new Date().getTime();

        try {
            const response = await axios.get(`/scripts/getJobApplications.php?_=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            });

            if (!Array.isArray(response.data) || response.data.length === 0) {
                setJobApplications(null);
            } else {
                setJobApplications(response.data);
            }

            setIsLoading(false);
            setLastUpdated(new Date().toLocaleTimeString());

        } catch (error) {

            if (error.response && error.response.data && error.response.data.message && error.response.data.code) {
                console.log(error.response.data.message);

                if (error.response.data.code === 401 || error.response.data.code === 403) {
                    navigate('/admin/login');
                }

            } else {
                console.log(error.message);

                if (error.status === 401 || error.status === 403 || error.code === 401 || error.code === 403) {
                    navigate('/admin/login');
                }
            }

            setIsLoading(false);
            setJobApplications(null);
        }
    };

    useEffect(() => {
        loadTableData();
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}
            <div className={"job-applications-page"}>
                <Table tableData={jobApplications}
                       scrollable={true}
                       compact={true}
                       allowHideColumns={true}
                       defaultHiddenColumns={
                           [
                               'Skills or Hobbies',
                               'Experience Details',
                               'Other Details',
                               'Address District Other',
                               'Address Street',
                               'Position Applying For Other',
                               'High School System Other',
                               'Other Documents Link First',
                               'Other Documents Link Second',
                               'Other Documents Link Third'
                           ]
                       }
                       allowExport={true}
                       exportFileName={'job-applications'}
                       headerModuleElements={[
                           (
                               <button key={1} onClick={loadTableData} disabled={isLoading}>
                                   {isLoading ? 'Loading...' : 'Reload Table Data'}
                               </button>
                           ),
                           // lastUpdated && (
                           //     <span key={2} className="last-updated">
                           //         Last updated: {lastUpdated}
                           //     </span>
                           // )
                       ]}
                       sortConfigParam={{column: 0, direction: 'descending'}}
                       filterableColumns={
                           [
                               'Date of Birth',
                               'Application Time',
                               'Gender',
                               'Address District',
                               'Position Applying For',
                               'Position Applying For Specialty',
                               'High School System',
                               'High School Graduation Date',
                               'Institution Major',
                               'Institution Graduation Date',
                               'Years of Experience',
                           ]
                       }
                />
            </div>
        </>
    );
}

export default JobApplications;
