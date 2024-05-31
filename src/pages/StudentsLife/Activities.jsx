import '../../styles/StudentsLife.css'
import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import Table from "../../modules/Table.jsx";
import Form from "../../modules/Form.jsx";
function Activities() {
  return (
    <div className={'students-life-activities-page'}>

            <ParallaxScrollSection title={'Harvest Academy'} backgroundImage={'/assets/images/AcademicsPages/AmericanAcademicsPageMiddle1.png'} darken={true}
                                   divElements={[
                                       (
                                             <div className={'students-life-activities-page-content'} key={1}>
                                                 <p>
                                                     At Harvest Schools we believe that a great part of any learning journey is health and activeness. that is why we provide stunning facilities for all kinds of activities accompanied by trainers for all the learning stages, including kindergarten. However, Activities should not affect students' school performance during the week days, therefore, Harvest Academy operates mostly during weekend times. In addition of course to all P.E. lessons through out the week.Students are allowed to join any time of the year through the form below.Or by contacting: <span onClick={() => window.open('tel:+201062255862')}>+20 106 225 5862</span>
                                                 </p>



                                             </div>


                                       )
                                   ]}
            />

        <container className={'extreme-padding-container'}>
            <Table tableData={[
                ['Sports', 'Days', 'Times'],
                ['Swimming', 'Friday, Saturday', '10:00 AM - 11:30 AM'],
                ['Football (Soccer)', 'Sunday, Tuesday', '4:00 PM - 5:00 PM'],
                ['Gymnastics', 'Sunday, Tuesday', '4:00 PM - 5:00 PM'],
                ['Basketball', 'Monday, Wednesday', '3:30 PM - 4:30 PM'],

            ]} numCols={3}/>

            <h1>
                Enroll Now
            </h1>

            <Form sendPdf={false} mailTo={'asmaa.samir@harvestschools.com'} formTitle={'Harvest Academy Enrollment'} fields={[
                {id: 1, type: 'text', label: 'Student Name', required: true, value: '', setValue: null, widthOfField: 3 },
                {id: 2, type: 'tel', label: 'Contact Phone Number', required: true, value: '', setValue: null, widthOfField: 3 },
                {id: 3, type: 'date', label: 'Date of Birth', required: true, value: '', setValue: null, widthOfField: 3 },
                {id: 4, type: 'select', multiple: true, label: 'Select a Sport (You can select more than one)', required: true, value: '', setValue: null, widthOfField: 1, choices: ['Swimming', 'Football (Soccer)', 'Gymnastics', 'Basketball'], labelOutside: true },
            ]}/>


        </container>

    </div>
  );
}

export default Activities;