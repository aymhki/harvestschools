import '../../../styles/Academics.css';
import Table from "../../../modules/Table.jsx";

function AmericanStaff() {
    return (
        <div className="academics-american-staff-page">
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