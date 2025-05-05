import '../../styles/Dashboard.css';
import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";

function JobApplications() {

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [jobApplications, setJobApplications] = useState(
        null
    );


    useEffect(() => {
        const checkAdminSession = async () => {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});

            const sessionId = cookies.harvest_schools_session_id;
            const sessionTime = parseInt(cookies.harvest_schools_session_time, 10);

            if (!sessionId || !sessionTime || (Date.now() - sessionTime) > 3600000) {
                document.cookie = 'harvest_schools_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'harvest_schools_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                navigate('/admin/login');
            }

            try {
                const response = await axios.post('scripts/checkAdminSession.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.data.success) {
                    navigate('/admin/login');
                }


                const userPermissionsResponse = await axios.post('scripts/getUserPermissions.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });


                if (!userPermissionsResponse.data.contains(0)) {
                    navigate('/admin/login');
                    return;
                }

                setIsLoading(false);

            } catch (error) {
                console.log(error);
            }
        };

        checkAdminSession();
    }, []);

    useEffect(() => {
        try {

            axios.get('scripts/GetJobApplications.php')
                .then((response) => {

                    if (!Array.isArray(response.data) || !response.data.length > 0) {
                        setJobApplications(null)
                    } else {
                        setJobApplications(response.data);
                    }

                    setIsLoading(false);
                })
                .catch((error) => {
                    console.log(error);
                    setIsLoading(false);
                    setJobApplications(null);
                });

        } catch (error) {
            console.log(error);
            setIsLoading(false);
            setJobApplications(null);
        }

    }, []);

  return (
      <>
          {isLoading && <Spinner/>}

          <div className={"job-applications-page"}>
              {(

              (
                  jobApplications && Array.isArray(jobApplications) && jobApplications.length > 0
              ) ? (
                  <Table tableData={jobApplications}
                         numCols={3}
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
              ) : (
                  isLoading ? <h1>Loading...</h1> : <h1>No job applications found.</h1>
              )

              )}
          </div>

      </>
  );
}

export default JobApplications;