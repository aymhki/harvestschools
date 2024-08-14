import '../styles/Dashboard.css';
import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Spinner from "../modules/Spinner.jsx";
import Table from "../modules/Table.jsx";

function JobApplications() {

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [jobApplications, setJobApplications] = useState(
        // [
        //     ["ID", "Application Time", "First Name", "Last Name", "Date of Birth", "Email", "Phone Number", "Gender", "Address Street", "Address District", "Address District Other", "Position Applying For", "Position Applying For Other", "Position Applying For Specialty", "High School Name", "High School System", "High School System Other", "High School Graduation Date", "Institution Name", "Institution Major", "Institution Graduation Date", "Years of Experience", "Experience Details", "Skills or Hobbies", "Other Details", "Reference Name", "Reference Position", "Reference Email", "Reference Phone Number", "Personal Photo Link", "CV Link", "Cover Letter Link", "Other Documents Link First", "Other Documents Link Second", "Other Documents Link Third"],
        //     ["34", "2024-08-13", "Nourelden", "Ehab", "1995-04-20", "nourelden4231@gmail.com", "01122646936", "Male", "3 Elmardny shots Alexandria", "Raml Station", "", "Coordinator", "", "", "النصرية", "National", "", "2013-06-01", "law", "law", "2017-08-15", "4", "", "", "", "", "", "", "", "https://harvestschools.com/fileUploads/CV_nourelden-14fd300c-4330-468d-b9c0-baacbc5380e4.pdf", "", "", ""],
        //     ["29", "2024-08-12", "Marina", "Estafanous", "1988-08-01", "rina.maros@gmail.com", "01282612520", "Female", "Kamal el din", "Smouha", "No", "Teacher", "No", "Math", "Moharam Bek", "National", "No", "2005-07-01", "Faculty of education", "Mathematics", "2009-06-01", "10+", "2019-2024  in Genesis International Schools cairo\n2015-2019 saint Joseph school in Obour city\n2012-2015 Stamford in El Obour City\n2009-2010 saint Venice de Paul Alexandria", "Reading & travelling", "No", "Nancy Nabil", "Math super visor", "rina.maros@gmail.com", "01282612520", "https://harvestschools.com/fileUploads/inbound6059887960820155442-bb02a66b-c418-4d2c-a3d9-753cbf2c3b0d-637881b6-e208-49ce-ad6b-13664077555b.jpg", "", "", ""],
        //     ["26", "2024-08-08", "Mai", "Safwat", "1984-09-16", "mai.safwat2005@gmail.com", "01001948650", "Female", "El sheikh Mohamed Abdou", "Other", "El Gomrom", "Administrator", "", "", "Moustafa el Nagar", "National", "", "2001-06-30", "Tourism & Hotels", "Tourism", "2005-05-30", "10+", "Assistant head of Elementary department\nSchool deputy", "", "", "", "0", "", "", "https://harvestschools.com/fileUploads/Mai Mohamed Safwat Darwish- CV.pdf", "", "", ""],
        //     ["25", "2024-08-08", "Hala", "Khamis", "1990-01-08", "Hala.khamis90@gmail.com", "01008733065", "Female", "15", "Abo Youssef", "", "Teacher", "", "Math", "Wasel Experimental Language School", "National", "", "2007-07-30", "Pharos university in Alexandria", "Faculty of Financial and Administrative Sciences", "2011-07-30", "9", "4 years as a Maths Teacher in el quds Language School\n5 years as a Maths Teacher in Future International school", "", "", "", "0", "", "", "https://harvestschools.com/fileUploads/Hala C.V. math-1.pdf", "", "", ""],
        //     ["24", "2024-08-08", "Hala", "Salam", "1974-01-23", "hala.s.idriss@gmail.com", "90 536 468 52 44", "Female", "Istanbul", "Other", "Takism", "Other", "Admin Assistant - Teacher Assistant", "", "Philosophy", "National", "", "1993-06-30", "Abdul Kader Hight School", "Philosopy", "1993-06-30", "10+", "1. Leadership and Management Experience\nTeam Leadership: Experience in leading and managing a team of educators and support staff, fostering a collaborative and supportive work environment.\n2. Operational Management: Proficiency in managing the day-to-day operations of a school or educational facility, including budgeting, scheduling, and resource allocation.\nCrisis Management: Ability to handle emergencies and unexpected situations effectively, ensuring the safety and well-being of students and staff.\n3. Communication and Interpersonal Skills\nParent and Community Relations: Strong skills in communicating with parents and building positive relationships with the broader school community, including addressing concerns and promoting engagement.\nCross-Cultural Communication: Experience working in a multicultural environment, with the ability to communicate effectively with diverse groups of people, including non-native English speakers.\n4. Curriculum Development and Implementation\nCurriculum Planning: Experience in developing and implementing age-appropriate curricula that meet the developmental needs of children and align with international standards.\nAssessment and Evaluation: Proficiency in assessing student progress and using data to inform teaching practices and curriculum adjustments.\n5. Regulatory and Compliance Knowledge\nLocal and International Regulations: Understanding of the regulatory requirements for operating an educational institution, including health and safety standards, child protection policies, and licensing requirements.\nAccreditation Processes: Familiarity with the processes for achieving and maintaining accreditation from relevant educational bodies.\n6. Financial Management\nBudgeting and Financial Planning: Experience in managing budgets, financial planning, and resource allocation to ensure the financial stability and growth of the institution.\nEnrollment Management: Skills in managing enrollment processes, including marketing the school to prospective parents and ensuring high retention rates.\n7. Technology Integration\nEdTech Integration: Experience in integrating educational technology into the classroom to enhance learning experiences and administrative efficiency.\nData Management: Proficiency in using management information systems (MIS) to track student progress, staff performance, and other key metrics.\n8. Professional Development and Training\nStaff Development: Experience in organizing and leading professional development programs for teachers and staff to ensure continuous improvement in teaching practices and educational outcomes.\nMentorship and Coaching: Ability to mentor and coach staff, fostering their growth and development within the institution.\n9. Strategic Planning\nVisionary Leadership: Experience in setting and implementing the strategic vision for the school, including long-term planning and growth strategies.\nInnovation and Improvement: Ability to identify areas for improvement and implement innovative solutions to enhance the educational experience and operational efficiency.\n10. Cultural Awareness and Sensitivity\nCultural Sensitivity: A deep understanding of cultural differences and the ability to create an inclusive environment that respects and celebrates diversity.\nLanguage Skills: Proficiency in multiple languages can be an asset, particularly in an international setting.", "Leadership, .Empathy, patience, and adaptability to create a nurturing and safe atmosphere for young children.", "I am interested in any admin job at your school, as well a class assistant. I am in turkey till end of August and would love to hear from you.", "Mais Gharaibeh", "0", "", "00974 4432 5205", "https://harvestschools.com/fileUploads/Hala Photo 11.jpg", "https://harvestschools.com/fileUploads/Hala Salam Idriss.pdf", "https://harvestschools.com/fileUploads/Cover Letter..pdf", "", ""],
        //     ["23", "2024-08-05", "Bossayna", "Anwar", "2024-07-02", "anwarbossayna@gmail.com", "01552330964", "Female", "7 hatem mosque", "Smouha", "", "Teacher", "", "Math", "Girard school", "Other", "", "2017-07-01", "University of Alexandria", "Faculty of commerce accounting section", "2021-08-01", "3", "I worked as an english assistant for 3 years in Alexandria language school for lower junior and I’m seeking for better experience and better performance as a math teacher", "Patience\nCommunications\nTime management\nAdaptability\nTeam work\nClassroom management\nCreativity\nActive listening\nProblem solving\nExcel sheet\nWorld document\nPower point\nGoogle classroom", "My passion for mathematics and teaching has been the driving force behind my career, and I am excited about the opportunity to bring my expertise to Harvest School as a Math Teacher.", "", "0", "", "", "https://harvestschools.com/fileUploads/AD328158-544D-440F-B1C4-EDE81631825C.jpeg", "https://harvestschools.com/fileUploads/Bossayna Anwar CV -2024 (1).pdf", "", "", ""],
        //     ["22", "2024-08-04", "Jana", "Daw", "2001-01-16", "jana.h.daw23@gmail.com", "01007508253", "Female", "Omar El Mokhtar", "Loran", "", "Teacher", "", "English", "El Zahraa Language School", "National", "", "2020-07-21", "0", "The Higher Institute of Social Work", "Social Work", "2022-05-15", "3", "Saint Vincent de Paul Alexandria", "", "", "", "0", "", "", "https://harvestschools.com/fileUploads/20230805_164054.jpg", "https://harvestschools.com/fileUploads/Jana CV.pdf", "", "", ""],
        // ]
        null
    );


    useEffect(() => {
        const checkSession = async () => {
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
                navigate('/login');
            }

            try {
                const response = await axios.post('scripts/checkSession.php', {
                    session_id: sessionId
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.data.success) {
                    navigate('/login');
                }
            } catch (error) {
                console.log(error);
            }
        };

        checkSession();
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
              {((
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
                  <h1>
                      No job applications found.
                  </h1>
              ))}
          </div>
      </>
  );
}

export default JobApplications;