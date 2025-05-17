import ParallaxScrollSection from "../../modules/ParallaxScrollSection.jsx";
import '../../styles/Academics.css';
import {Helmet} from "react-helmet-async";

function American() {
  return (
      <div className={"american-academics-page"}>
          <Helmet>
              <title>Harvest International School | American</title>
              <meta name="description"
                    content="Learn more about the American academics, the curriculum, and facilities for the American Division at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageHeader.jpg"}
                                 title={"Dear Harvest International School Families,"}
                                 darken={true} image={"../../assets/images/AcademicsPages/OpeningQuote.png"}
                                 imageAlt={"American Academics Page Header Opening Quote"}/>


          <div className={"standard-padding-container"}>
              <p>
                  Welcome to our Harvest International School Website! We hope you will find the information you're
                  looking for on this page. We also have an active HIS Facebook page account where you will find
                  information, updates, and all of the fun and exciting things going on at HIS.
              </p>

              <p>
                  HIS is a special place with warm and friendly teachers, students, parents, and staff, and I am
                  grateful for the opportunity to be your principal. I believe in working collaboratively with staff,
                  students, parents, and community partners in order to continue the success. Through this
                  collaboration, I believe we will keep moving our students and school forward, as we navigate our way
                  through this ever changing world.
              </p>

          </div>

          <ParallaxScrollSection
              backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageMiddle1.jpg"}/>

          <div className={"standard-padding-container"}>
              <p>
                  In the Upper School, students take great pride in challenging themselves and supporting one another academically while also developing and deepening their values and interests in and beyond the classroom.
              </p>

              <p>
                  Harvest International School provides a high quality, rigorous, and student centered curriculum, which is aligned withCommon Core State Standards (CCSS) and Next Generation Science Standards (NGSS)learning standards. It is our goal that every learner feels happy, safe, accepted and valued while receiving a quality education.
              </p>

              <p>
                  It is our aim to remain focused on Egyptian values while equipping our students with both a passion for learning and the ambition to make a difference to the local and global communities.
              </p>
          </div>

          <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageMiddle2.jpg"}/>

            <div className={"standard-padding-container"}>
                <p>
                    Our school is made up of outstanding students across all grades. Our faculty and staff are dedicated, caring professionals, who love and support one an other as both, friends and colleagues. HIS is also very lucky to have a group of parents who are an open, approachable, creative, dedicated, and committed to working together toward the success of their children at HIS.
                </p>

                <p>
                    Students in our Lower School enjoy an environment in which they are encouraged by their teachers to explore new academic and social frontiers in a safe environment. Middle School students gain healthy confidence and character as they boldly expand their learning with elective courses in preparation for the Upper School.
                </p>
            </div>

            <ParallaxScrollSection backgroundImage={"../../assets/images/AcademicsPages/AmericanAcademicsPageFooter.jpg"} text={"- Ms. Salma Ehab, American School Principal"} darken={true} image={"../../assets/images/AcademicsPages/ClosingQuote.png"} imageAlt={"American Academics Page Footer Closing Quote"}/>

      </div>
);
}

export default American;