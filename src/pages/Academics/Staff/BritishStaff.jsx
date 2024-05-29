import '../../../styles/Academics.css';
import Table from "../../../modules/Table.jsx";

function BritishStaff() {
  return (
      <div className="academics-british-staff-page">
          <container className={"extreme-padding-container"}>

              <p>
                    Head of Department: Ms. Amal El Malt
              </p>

              <Table tableData={[
                  ['Name', 'Subject', 'Title'],
                  ['Amany Yakout', 'P.E.', 'Teacher'],
                  ['Sabah', 'Computer', 'Coordinator'],
                  ['Heba Moustafa', 'Art', 'Coordinator'],
                  ['Beshoy', 'National Studies', 'Coordinator'],
                  ['Ahmed Hassan', 'Arabic+Religion', 'Teacher'],
                  ['Nourhan', 'Arabic+Religion', 'Teacher'],
                  ['Rowan', 'Arabic+Religion', 'Teacher'],
                  ['Hanna Abdallah', 'Arabic+Religion', 'Coordinator'],
                  ['Sara Abdelfatah', 'Science', 'Teacher'],
                  ['Soha', 'Science', 'Teacher'],
                  ['Marwa Adel', 'Science', 'Coordinator'],
                  ['Salma Ramadan', 'Mathematics', 'Teacher'],
                  ['Dalia Essam', 'Mathematics', 'Coordinator'],
                  ['Yasmine Ashraf', 'English', 'Teacher'],
                  ['Fatima', 'English', 'Teacher'],
                  ['Cherihanne', 'English', 'Teacher'],
                  ['Mariam', 'English', 'Teacher'],
                  ['Eman', 'English', 'Teacher'],
                  ['Ayat Ashraf', 'English', 'Teacher'],
                  ['Rana Gamal', 'English', 'Teacher'],
                  ['Yasmine Alaa', 'English', 'Coordinator'],
                  ['Amany Yakout', 'P.E.', 'Teacher'],
                  ['Beshoy', 'National Studies', 'Coordinator'],
                  ['Ahmed Hassan', 'Arabic + Religion', 'Coordinator'],
                  ['Dina Yousry', 'ICT & Computer Science', 'Coordinator'],
                  ['Ghada Labeeb', 'Physics', 'Coordinator'],
                  ['Dr. Shereen Abo Hasheesh', 'Chemistry', 'Coordinator'],
                  ['Eman Abas', 'Mathematics', 'Coordinator'],
                  ['Dr. Zeinab El Shazly', 'Mathematics', 'Coordinator'],
                  ['Ghadeer Raslan', 'English', 'Coordinator']
                  ]} numCols={3} />

              <p>
                  This page was last updated on June 20, 2021
              </p>
          </container>
      </div>
);
}

export default BritishStaff;