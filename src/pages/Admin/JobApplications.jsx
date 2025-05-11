import '../../styles/Dashboard.css';
import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";
import {checkAdminSession} from "../../services/Utils.jsx";

function JobApplications() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [jobApplications, setJobApplications] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        checkAdminSession(navigate, setIsLoading, 0);
    }, []);

    const loadTableData = async () => {
        setIsLoading(true);
        setJobApplications(null);

        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();

        try {
            console.log("Fetching job applications data...");
            const startTime = new Date().getTime();

            const response = await axios.get(`/scripts/GetJobApplications.php?_=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            });

            const endTime = new Date().getTime();
            console.log(`Data fetch completed in ${endTime - startTime}ms`);

            // Ensure minimum loading time for better UX (optional)
            const minLoadingTime = 0; // ms
            const remainingTime = Math.max(0, minLoadingTime - (endTime - startTime));

            setTimeout(() => {
                if (!Array.isArray(response.data) || response.data.length === 0) {
                    console.log("No data returned or invalid format");
                    setJobApplications(null);
                } else {
                    console.log(`Received ${response.data.length} rows of data`);
                    setJobApplications(response.data);
                }

                setIsLoading(false);
                setLastUpdated(new Date().toLocaleTimeString());
            }, remainingTime);

        } catch (error) {
            console.error("Error fetching job applications:", error);
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
                           lastUpdated && (
                               <span key={2} className="last-updated">
                                   Last updated: {lastUpdated}
                               </span>
                           )
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
