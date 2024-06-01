import PhotoSlider from "../modules/PhotoSlider.jsx";
import '../styles/Home.css';
import {Helmet} from "react-helmet";
import ParallaxScrollSection from "../modules/ParallaxScrollSection.jsx";
import Form from "../modules/Form.jsx";

function Home() {

    const homeSliderPhotos = [
        { id: 1, url: '/assets/images/HomePage/VisionBackground.jpg', title: 'Our Vision', text: 'Is to invest in an interactive, authentic, effective, and creative generation, in which students are thirsty for knowledge and prepared for global leadership in a safe educational environment.' },
        { id: 2, url: '/assets/images/HomePage/MissionBackground.jpg', title: 'Our Mission', text: 'Is to invest in the skills of educators and administrative calibers to provide an inspirational environment made fit to qualify students to be part of a gleaming future placing technology in its best use to activate the most effective educational system.' },
    ]

    const contactUsFormFields = [
        { id: 1, type: 'text', label:     'Name', httpName: 'name', required: true, value: '', setValue: null, widthOfField: 1 },
        { id: 2, type: 'email', label:    'Email', httpName: 'email', required: true, value: '', setValue: null, widthOfField: 2 },
        { id: 3, type: 'tel', label:   'Phone Number', httpName: 'phone', required: true, value: '', setValue: null, widthOfField: 2 },
        {id:  4, type: 'select', label:   'Subject', httpName: 'subject', required: true, value: '', setValue: null, widthOfField: 1, choices: ['Admissions', 'General Inquiry', 'Feedback', 'Other']},
        { id: 5, type: 'textarea', label: 'Message', httpName: 'message', required: true, value: '', setValue: null, widthOfField: 1 }
    ]

    return (

        <div className="home-page">

            <Helmet>
                <title>Harvest International School | Egypt</title>
                <meta name="description"
                      content="Harvest International School (HIS) was founded in 2016 by Eng. Hassan Khalil Ibrahim to be the first international school in Borg El-Arab recruiting highly qualified teachers and administrators. "/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, International School, British Syllabus, American Syllabus, Egyptian Syllabus, Education, School, Learning, Teaching, Students, Teachers, World-Class Educational Facility, Sports Fields, Gymnasium, Swimming Pool, Twenty-First Century, Education, Eng. Hassan Khalil Ibrahim, مدارس هارفست, برج العرب, مدرسة, هارفست"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className="home-page-vision-and-mission-slider">
                <PhotoSlider photos={homeSliderPhotos} darken={true}/>
            </div>

            <div className="home-page-about-us-section">
                <h1>About Us</h1>
                <p>Harvest International School (HIS) was founded in 2016 by Eng. Hassan Khalil Ibrahim to be the first international school in Borg El-Arab recruiting highly qualified teachers and administrators. Eng. Hassan has, for many years, dreamt and planned of founding a school with a true mission and vision. He consulted various specialized educators and finally, the dream came true. HIS aims to offer an ideal learning environment where students can satisfy their thirst for knowledge enjoying an extensive extracurricular program. The purpose-built world-class educational facility includes extended grounds, specialized sports fields and courts, a well-equipped gymnasium and an outdoor swimming pool. Eng. Hassan’s mission is to raise well-rounded young people who are physically, ethically and educationally capable to face the challenges of the twenty-first century in an ever-evolving global community. At HIS, we are committed to providing the best by offering simultaneously the Egyptian, British and American syllabi.  Lifelong education and eagerness to discover and experiment are at the heart of our mission.</p>

                <div className="home-page-about-us-video">
                    <iframe className="home-page-about-us-video"
                            src="https://www.youtube.com/embed/c_NWecZZ01M"
                            title="YouTube video player"
                            frameBorder={0}
                            loading={"lazy"}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen/>
                </div>
            </div>

            <div className="home-page-accreditations-section-container">
                <div className="home-page-accreditations-section">
                    <img className="accreditation-photo" src="/assets/images/HomePage/AccreditedCognia.png" alt="Cognia Accredited" />
                    <img className="accreditation-photo" src="/assets/images/HomePage/CICIS.png" alt="University of Cambridge Accredited" />
                </div>
            </div>

            <div className="home-page-admission-section">
                <ParallaxScrollSection
                    title="E-Learning & Academics"
                    text="At Harvest Schools, E-learning is integrated with all National, British, and American stages making it the first school in Egypt that not only allow parents to access classes live from anywhere around the world but also allow students to follow up with their previously recorded lessons online and solve related assignments. All of this is powered by an advanced, moderated, and well-tested system called schoolEverywhere. To understand the policies and the curriculums that are embedded within the online system, learn more below."
                    backgroundImage="/assets/images/HomePage/E-Learning&Academics.jpg"
                    darken={true}
                    buttonText="Learn More"
                    buttonLink="/academics/partners"
                />
            </div>


            <div className="home-page-explore-section">
                <ParallaxScrollSection title={null} text={null} backgroundImage={'/assets/images/HomePage/Explore360.jpg'} darken={true} buttonText={'Explore'} buttonLink={'/gallery/360-tour'} />
            </div>

            <div className="home-page-contact-and-visit-us-container">
                <div className="home-page-contact-us-section">
                    <h1>Contact Us</h1>

                    <p className="important-info-hyperlink-text">
                        Phone: &nbsp;
                        <span  onClick={() => window.open('tel:+201028329668')}>
                             01028329668,
                        </span> &nbsp;
                        <span  onClick={() => window.open('tel:+201097875407')}>
                            01097875407,
                        </span> &nbsp;
                        <span onClick={() => window.open('tel:+201028940675')}>
                           01028940675
                        </span>
                    </p>


                    <Form fields={contactUsFormFields} sendPdf={false} mailTo={'asmaa.samir@harvestschools.com'} formTitle={'Contact Us'}/>
                </div>

                <div className="home-page-visit-us-section">
                    <h1>Visit Us</h1>

                    <p className="important-info-hyperlink-text"
                       onClick={() => window.open('https://maps.app.goo.gl/4mWYs9jX5T2gK1FL7', '_blank')}>
                        Borg Al Arab City, Second Territory, Alexandria Governorate, Egypt
                    </p>

                    <div className="home-page-visit-us-section-map-container">
                        <iframe className="home-page-visit-us-section-map"
                            frameBorder={0}
                            allowFullScreen
                            loading="lazy"
                            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13698.65926645064!2d29.59631!3d30.868058!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x6e0538b2d2ee1e57!2sHarvest%20International%20School!5e0!3m2!1sen!2sus!4v1623455102421!5m2!1sen!2sus;output=embed;frameborder=0;loading=lazy;"/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;