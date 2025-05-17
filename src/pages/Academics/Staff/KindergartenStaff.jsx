import '../../../styles/Academics.css';
import Table from "../../../modules/Table.jsx";
import {Helmet} from "react-helmet-async";


function KindergartenStaff() {
  return (
    <div className="academics-kindergarten-staff-page">
        <Helmet>
            <title>Harvest International School | KG Staff</title>
            <meta name="description"
                  content="Learn more about the Kindergarten Division Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className={"extreme-padding-container"}>

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

                ]} numCols={3}
                   sortConfigParam={{column: 1, direction: 'ascending'}}/>

            <p>
                This page was last updated on June 20, 2021
            </p>
        </div>
    </div>
  );
}

export default KindergartenStaff;