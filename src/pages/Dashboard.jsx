import OptionsGrid from "../modules/OptionsGrid.jsx";
import '../styles/Dashboard.css';
import {useEffect} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";


function Dashboard() {

    const navigate = useNavigate();

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
                navigate('/admin-login');
                return;
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
                    navigate('/admin-login');
                }
            } catch (error) {
                console.log(error);
            }
        };

        checkAdminSession();
    }, []);

  return (
      <div className={"dashboard-page"}>
          <OptionsGrid options={
              [
                  {
                      title: "Job Applications",
                      image: '/assets/images/Dashboard/JobApplications.png',
                      description: "View and manage job applications",
                      link: '/job-applications',
                      buttonText: 'View Applications',
                      titleInArabic: false,
                      descriptionInArabic: false
                  }
              ]
          } title={"Dashboard"}  />

      </div>
  );
}

export default Dashboard;