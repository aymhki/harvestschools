import '../../../styles/Academics.css';
import Table from "../../../modules/Table.jsx";

function KindergartenStaff() {
  return (
    <div className="academics-kindergarten-staff-page">


        <container className={"extreme-padding-container"}>

            <p>
                Head of Department: Ms. Shimaa Ahmed Khalil
            </p>

            <p>
                Vice: Ms. Rana Sayed Mokhtar
            </p>

            <Table tableData={[
                ['Name', 'Subject', 'Title'],
                ['Rehab Abdallah Ali Abdelbaky', 'Religion', 'Teacher'],
                ['Naglaa Fathy Gaber Aboel Magd', 'General', 'Teacher'],
                ['May Hamdy Khalaf Abdelgawad Elsayed', 'General', 'Assistant'],
                ['Alaa Ahmed Ibrahim Mohamed', 'General', 'Teacher'],
                ['Asmaa Abdelrehem Mohamed Abdelrehem Mohamed', 'Arabic', 'Teacher'],
                ['Sara Mohamed Ahmed Fatouh', 'Arabic', 'Teacher'],
                ['Rehab Nasreldin Reteb Abdelalim', 'General', 'Teacher'],
                ['Marwa Mostafa Abdelaziz Mahmoud Saleh', 'General', 'Teacher'],
                ['Rana Mohamed Salah Mohamed Agamy', 'General', 'Teacher'],
                ['Yostina Ezzat Faiz', 'General', 'Assistant'],
                ['Bassant Hefny Fouad Hefny', 'General', 'Assistant'],
                ['Fatma Karam Saad Ahmed Elsharkawy', 'General', 'Assistant'],
                ['Maha Mohamed Kamal Mohamed Abdelmaksoud', 'General', 'Teacher'],
                ['Asmaa Mohamed Abbas Aglan', 'Assistant KG1', 'Assistant']

                ]} numCols={3} />

            <p>
                This page was last updated on June 20, 2021
            </p>
        </container>
    </div>
  );
}

export default KindergartenStaff;