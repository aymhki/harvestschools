import '../../../styles/Academics.css';
import Table from "../../../modules/Table.jsx";
import {Helmet} from "react-helmet";

function AmericanStaff() {
    return (
        <div className="academics-american-staff-page">
            <Helmet>
                <title>Harvest International School | American Staff</title>
                <meta name="description"
                      content="Learn more about the American Division Staff members, teachers, coordinators, and administrative staff at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <container className={"extreme-padding-container"}>

                <p>
                    Head of Department: Ms. Salma Ehab
                </p>

                <Table tableData={[
                    ['Name', 'Subject', 'Title'],
                    ['Amany Yakout', 'P.E.', 'Teacher'],
                    ['Heba Moustafa', 'Art', 'Coordinator'],
                    ['Bassma Ossama', 'National Studies', 'Teacher'],
                    ['Beshoy Saad', 'National Studies', 'Coordinator'],
                    ['Bassma Ossama', 'Arabic + Religion', 'Teacher'],
                    ['Mayada Ossama', 'Arabic + Religion', 'Teacher'],
                    ['Hend Abdel Fattah', 'Arabic + Religion', 'Coordinator'],
                    ['Hadeel EL Hagan', 'Science', 'Teacher'],
                    ['Hanan ElAbd', 'Science', 'Coordinator'],
                    ['Marwa Moustafa', 'Mathematics', 'Teacher'],
                    ['Mennah Abady', 'Mathematics', 'Teacher'],
                    ['Abdelrahman ElShami', 'Mathematics', 'Coordinator'],
                    ['Mashaer Mohamed', 'English + Social Studies', 'Teacher'],
                    ['Walaa Gharib', 'English + Social Studies', 'Teacher'],
                    ['Ghada Said', 'English + Social Studies', 'Coordinator']

                ]} numCols={3} />

                <p>
                    This page was last updated on June 20, 2021
                </p>
            </container>
        </div>
    );
}

export default AmericanStaff;