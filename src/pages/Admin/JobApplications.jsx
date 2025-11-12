import '../../styles/AdminDashboard.css';
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession, fetchJobApplicationsRequest} from "../../services/Utils.jsx";

function JobApplications() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [jobApplications, setJobApplications] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, 0, setIsLoading);
    }, []);

    const loadTableData = async () => {
        try {
            setIsLoading(true);
            await fetchJobApplicationsRequest(navigate, setJobApplications)
        } catch (error) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTableData();
    }, []);

    function onJobApplicationFileUrlClick(cellValue) {
        // open a new tab with https://harvestschools.com/admin/view-file?file=<cellValue>
        const url = `/admin/view-file?file=${encodeURIComponent(cellValue)}`;
        window.open(url, '_blank');
    }

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
                       likelyUrlColumns={
                            {
                                'Resume Link': onJobApplicationFileUrlClick,
                                'Cover Letter Link': onJobApplicationFileUrlClick,
                                'Personal Photo Link': onJobApplicationFileUrlClick,
                                'Other Documents Link First': onJobApplicationFileUrlClick,
                                'Other Documents Link Second': onJobApplicationFileUrlClick,
                                'Other Documents Link Third': onJobApplicationFileUrlClick,
                            }
                       }
                />
            </div>
        </>
    );
}

export default JobApplications;

