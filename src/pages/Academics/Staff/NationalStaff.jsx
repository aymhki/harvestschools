import '../../../styles/Academics.css';
import Table from "../../../modules/Table.jsx";
import {Helmet} from "react-helmet-async";


function NationalStaff() {
  return (
    <div className={"academics-national-staff-page"}>
        <Helmet>
            <title>Harvest International School | National Staff</title>
            <meta name="description"
                  content="Learn more about the National Division Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

      <div className={"extreme-padding-container"}>
          <p>
              Head of Department: Mr. Islam Ali Farag Ali
          </p>

          <p>
              Vice: Ms. Sara Ahmed Abd El Monim
          </p>

          <Table tableData={[
              ['Name', 'Subject', 'Title'],
              ['Sondos Ahmed Abdelhafiz Ahmed', 'ART', 'Teacher'],
              ['Hamed Soliman Mohamed Aly Mokkadam', 'P.E.', 'Teacher'],
              ['Dina Magdy Abdel Aziz Ghanem Saad', 'P.E.', 'Teacher'],
              ['Nada Gamal Mostafa Hassan Hassanin', 'ART', 'Teacher'],
              ['Nourhan Tarek Elsayed Ali Elsayed', 'MATHS', 'Teacher'],
              ['Nesreen Nabil Mohamed Ahmed Elzahar', 'MATHS', 'Teacher'],
              ['Sherine Mamdouh Abdelazim Elshamy', 'MATHS', 'Teacher'],
              ['Bakinaz Farouk Mohamed Gad Elgahamry', 'MATHS', 'Teacher'],
              ['Nasra Abdelkhalek Kamal Seyam', 'MATHS', 'Teacher'],
              ['Lojaina Mamdouh Tawfik Morsy Darwish', 'French', 'Teacher'],
              ['Abla Abdelmohsen Abdelfattah Salem Barakat', 'French', 'Teacher'],
              ['Nevein Hussein Mohamed Bassyouny', 'French', 'Teacher'],
              ['Salma Al Hussein Mohamed', 'Science', 'Teacher'],
              ['Basma Mahmoud Mosaad Ramadan Soliman', 'Science, Physics , Chemistry', 'Teacher'],
              ['Amany Hesham Mostafa Aly Elhamshary', 'Science', 'Teacher'],
              ['Nesreen Mohamed Ameen', 'English', 'Teacher'],
              ['Alaa Ahmed Mokhtar Mohamed Mohamed', 'English', 'Teacher'],
              ['Ayatallah Ahmed Abdelgawad Mohamed', 'English', 'Teacher'],
              ['Mohamed Salah Abdelhamid Metwaly Shahen', 'English', 'Teacher'],
              ['Amal Tarek Ahmed Ibrahim', 'English', 'Teacher'],
              ['Hagar Mahmoud Mohamed Abdelfattah Kenawy', 'English', 'Teacher'],
              ['Ahmed Adly Mohamed Mohamed Seyam', 'English', 'Teacher'],
              ['Ghada Mahroos Ibrahim', 'English', 'Teacher'],
              ['Amal Kamel Hassan Mohamed', 'N.S.', 'Teacher'],
              ['Laila Mohamed Saad Abelhamid Khodier', 'Pyscology', 'Teacher'],
              ['Marina Maged Saied Youssef Saied', 'Christianity + Social Studies', 'Teacher'],
              ['Hebatallah Ahmed Abdelsalam Ahmed', 'RELIGION', 'Teacher'],
              ['Samar Mahrous Ibrahim Ali Masoud', 'ARABIC, RELIGION', 'Teacher'],
              ['Asmaa Magdy Ahmed Badr', 'ARABIC, RELIGION', 'Teacher'],
              ['Samya Adel Metwally Abdel Mohsen', 'ARABIC, RELIGION', 'Teacher'],
              ['Sarah Hamdy Hamed Ahmed', 'ARABIC, RELIGION', 'Teacher'],
              ['Sara Ahmed Abd Elmonim', 'French', 'Teacher']
          ]} numCols={3}
                 sortConfigParam={{column: 1, direction: 'ascending'}}/>

          <p>
              This page was last updated on June 20, 2021
          </p>
      </div>


    </div>
  );
}

export default NationalStaff;