import '../../styles/Academics.css'
import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import {Helmet} from "react-helmet";

function Facilities() {
    return (
        <div className="academics-facilities-page">
            <Helmet>
                <title>Harvest International School | Facilities</title>
                <meta name="description"
                      content="Learn more about the classrooms, labs, libraries, canteens, sports facilities, and more at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>
            <container className={"extreme-padding-container"}>
                <h1>Facilities</h1>

                <div className="facilities-show-case-grid">
                    <img src="/assets/images/AcademicsPages/Facilities/HandballField2.jpg" alt="Handball Field"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/FootballField.jpg" alt="Football Field"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/Library.jpg" alt="Library"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/Gym1.jpg" alt={"Gym"} className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/BasketballField.jpg" alt="Basketball Field"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/Lab1.jpg" alt="Biology Lab"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/Lab2.jpg" alt="Chemistry Lab"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/Toys.jpg" alt="Playground"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/HandballField1.jpg" alt="Handball Field"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/BasketballField1.jpg" alt="Basketball Field"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/Lab3.jpg" alt="Physics Lab"  className="facilities-show-case-image"/>
                    <img src="/assets/images/AcademicsPages/Facilities/Gym2.jpg" alt="Gym"  className="facilities-show-case-image"/>
                </div>






            </container>

            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/ComputerLab.jpg"} title={"Computer Lab Policy"} darken={true}
                                   divElements={[
                                       (
                                           <div className={"computer-lab-policy"} key={"computer-lab-policy"}>
                                               <p>
                                                   Students are required to:
                                               </p>

                                               <ul className={"computer-lab-policy-list"}>
                                                   <li><p>Can’t use computer labs except for computer lessons.</p></li>
                                                   <li><p>Avoid touching or handle any equipment –especially the
                                                       computer screen- until they receive instructions.</p></li>
                                                   <li><p>Touch the keyboard lightly.</p></li>
                                                   <li><p>Put all materials and garbage in appropriate containers.</p>
                                                   </li>
                                                   <li><p>Avoid bringing food or other banned items into the
                                                       computer.</p></li>
                                                   <li><p>Raise hands if they need help and wait patiently and quietly
                                                       for help.</p></li>
                                                   <li><p>Respect the rights and belongings of classmates.</p></li>
                                                   <li><p>Avoid abusing the hardware, in case of any problem with
                                                       hardware or software, they tell the instructor who will contact
                                                       the computer lab technician.</p></li>
                                                   <li><p>Close all programs before leaving the lab.</p></li>
                                                   <li><p>Leave their places clean.</p></li>
                                               </ul>

                                               <p>
                                                   Students are responsible for all actions done on their computers:
                                               </p>

                                               <ul className={"computer-lab-policy-list"}>
                                                   <li><p>Log only onto their own user accounts.</p></li>
                                                   <li><p>Protect and remember their passwords.</p></li>
                                                   <li><p>Safeguard their computers and save all their work.</p></li>
                                                   <li><p>Log off their computer accounts when they are finished.</p>
                                                   </li>
                                                   <li><p>Students will be charged a fine for any damage they cause to
                                                       any equipment or materials in the computer lab.</p></li>

                                               </ul>
                                           </div>

                                       )]}/>
            
            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/Library.jpg"} title={"Library"} darken={true}
                                   divElements={[(
                                       <div className={"library-policy"} key={"library-policy"}>
                                           <p>
                                               Library Lessons: We have weekly Library lessons schedule for both English & Arabic languages.
                                           </p>

                                           <p>
                                               Circulation Policy:
                                           </p>

                                           <ul className={"library-policy-list"}>
                                                  <li><p>Students may have (2) items checked-out under their names at a time.</p></li>
                                                    <li><p>Most books circulate for two weeks.</p></li>
                                                    <li><p>The books must be returned to the library in the same condition they  were borrowed.</p></li>
                                                    <li><p>If damaged in any way, i.e., covers, pages damaged by having pictures cut out, or writing in the book, a student has to pay the replacement cost of the book.</p></li>
                                                    <li><p>Please place books in the book drop at the circulation desk.</p></li>
                                                    <li><p>No eating, drinking, chewing gum, etc., is allowed.</p></li>
                                                    <li><p>Proper respect toward other people, teachers, the books and other materials must be maintained at all times while in the Library.</p></li>
                                                    <li><p>The noise level in the library should not rise above a whisper.</p></li>

                                           </ul>

                                       </div>
                                   )]}/>


            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/Canteen.jpg"} title={"School Canteen"} darken={true}
                                      divElements={[(
                                        <div className={"canteen-policy"} key={"canteen-policy"}>
                                             <p>
                                                 Our school provides a variety of nutritious foods and beverages to students and staff that enables them to make healthy food choicesAll nutritious food choices are displayed on front shelves and in an area that students and staff can easily see.
                                             </p>

                                            <p>
                                                Policy:
                                            </p>

                                            <ul className={"canteen-policy-list"}>
                                                <li><p>Students are allowed to buy from the school canteen during break time only,  except water is allowed at any time but with permission.</p></li>
                                                <li><p>Students should line up when buying from the school canteen.</p></li>
                                                <li><p>Students should throw litters in the litter baskets, not on the floor.</p></li>
                                                <li><p>It is forbidden to take drinks in any glass, or metal containers; only disposable plastic or paper cups and containers are allowed.</p></li>
                                                <li><p>Teachers on duty have to watch over these rules.</p></li>
                                            </ul>

                                        </div>
                                      )]}/>

            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/Classroom.jpg"} title={"Smart Classes"} darken={true}

                                      divElements={[(
                                            <div className={"smart-classes-policy"} key={"smart-classes-policy"}>
                                                <p>
                                                    Smart classes are available in KG Department and Elementary schools We all know how helpful it is to remember something that is taught visually to us rather than the one that is read through pages after pages.                                                </p>

                                            </div>
                                      )]}/>

            <ParallaxScrollSection backgroundImage={"/assets/images/AcademicsPages/Facilities/Gym2.jpg"} title={"Sports"} darken={true}
                                      divElements={[(
                                        <div className={"sports-policy"} key={"sports-policy"}>
                                             <p>
                                                 Physical Education in schools concerns the involvement of children in fitness , activities, sports, Health Education, and gymnastics . All are designed to encourage a healthier, more enjoyable lifestyle.Through all the sports facilities, its apparatus and equipment, HIS offers excellent conditions for practicing physical sports, going all out to meet the needs of each user, thus increasing the number and quality of the available sports.
                                             </p>

                                            <p>
                                                Gym:
                                            </p>

                                            <ul className={"gym-list"}>
                                                <li><p>Aerobics</p></li>
                                                <li><p>Gymnastic</p></li>
                                            </ul>

                                            <p>
                                                Outdoor Courts:
                                            </p>

                                            <ul className={"outdoor-courts-list"}>
                                                <li><p>Football Court</p></li>
                                                <li><p>Volleyball</p></li>
                                                <li><p>Basketball</p></li>
                                                <li><p>Handball</p></li>
                                            </ul>

                                            <p>
                                                Gymnasiums:
                                            </p>

                                            <p>
                                                Please follow the below rules:
                                            </p>

                                            <ul className={"gym-rules"}>
                                                <li><p>No running or ball playing in the GYM.</p></li>
                                                <li><p>The hall and gym must be kept neat and clean.</p></li>
                                                <li><p>No gum chewing, candy, foods, seeds, or drink in the gym before, during or after school.</p></li>
                                                <li><p>Only sneakers are allowed on the GYM floor. They must be laced all the way and tied securely before entering the GYM.</p></li>
                                                <li><p>Do not leave the  GYM without permission.</p></li>
                                                <li><p>Your cooperation is greatly appreciated.</p></li>
                                            </ul>

                                            <p>
                                                Swimming Pool:
                                            </p>

                                            <ul className={"swimming-pool-rules"}>

                                                <li><p>Student may not be allowed to enter the swimming pool if he/she has suffered from any communicable diseases.</p></li>
                                                <li><p>No one shall enter a swimming pool without first having passed through a shower bath and foot bath.</p></li>
                                                <li><p>Swimmers must wear proper swimming suits when entering the pool.</p></li>
                                                <li><p>Slippers must be thoroughly cleaned when entering pool areas.</p></li>
                                                <li><p>Swimmers must follow the instructions of the venue in-charge or life guards on duty.</p></li>
                                            </ul>
                                        </div>
                                      )]}/>

        </div>
    );

}


export default Facilities;