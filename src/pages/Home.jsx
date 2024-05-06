import PhotoSlider from "../modules/PhotoSlider.jsx";
import '../styles/Home.css';
import {Helmet} from "react-helmet";
import ParallaxScrollSection from "../modules/ParallaxScrollSection.jsx";
import Form from "../modules/Form.jsx";
function Home() {
    const homeSliderPhotos = [
        { id: 1, url: '/assets/images/HomePagePhotos/VisionBackground.jpg', title: 'Our Vision', text: 'Is to invest in an interactive, authentic, effective, and creative generation, in which students are thirsty for knowledge and prepared for global leadership in a safe educational environment.' },
        { id: 2, url: '/assets/images/HomePagePhotos/MissionBackground.jpg', title: 'Our Mission', text: 'Is to invest in the skills of educators and administrative calibers to provide an inspirational environment made fit to qualify students to be part of a gleaming future placing technology in its best use to activate the most effective educational system.' },
    ]

    const contactUsFormFields = [
        { id: 1, type: 'text', label: 'Name', httpName: 'name', required: true, value: '', setValue: null, widthOfField: 1 },
        { id: 2, type: 'email', label: 'Email', httpName: 'email', required: true, value: '', setValue: null, widthOfField: 2 },
        { id: 3, type: 'tel', label: 'Phone Number', httpName: 'phone', required: true, value: '', setValue: null, widthOfField: 2 },
        { id: 4, type: 'textarea', label: 'Message', httpName: 'message', required: true, value: '', setValue: null, widthOfField: 1 },

    ]

    return (

        <div className="home-page">
            <Helmet>
                <title>Harvest International School</title>
                <meta name="description" content="Harvest International School is the first international school in Borg El-Arab recruiting highly qualified teachers and administrators. HIS aims to offer an ideal learning environment where students can satisfy their thirst for knowledge enjoying an extensive extracurricular program." />
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Egypt, International School, British Syllabus, American Syllabus, Egyptian Syllabus, Education, School, Learning, Teaching, Students, Teachers, Administrators, Extracurricular Program, World-Class Educational Facility, Sports Fields, Gymnasium, Swimming Pool, Lifelong Education, Global Community, Well-Rounded Young People, Twenty-First Century, Education, Discover, Experiment, Mission, Vision, Eng. Hassan Khalil Ibrahim" />
                <meta name="author" content="Harvest International School" />
            </Helmet>

            <div className="home-page-vision-and-mission-slider">
                <PhotoSlider photos={homeSliderPhotos} darken={true}/>
            </div>

            <div className="home-page-about-us-section">
                <h1>About Us</h1>
                <p>Harvest International School (HIS) was founded in 2016 by Eng. Hassan Khalil Ibrahim to be the first international school in Borg El-Arab recruiting highly qualified teachers and administrators. Eng. Hassan has, for many years, dreamt and planned of founding a school with a true mission and vision. He consulted various specialized educators and finally, the dream came true. HIS aims to offer an ideal learning environment where students can satisfy their thirst for knowledge enjoying an extensive extracurricular program. The purpose-built world-class educational facility includes extended grounds, specialized sports fields and courts, a well-equipped gymnasium and an outdoor swimming pool. Eng. Hassan’s mission is to raise well-rounded young people who are physically, ethically and educationally capable to face the challenges of the twenty-first century in an ever-evolving global community. At HIS, we are committed to providing the best by offering simultaneously the Egyptian, British and American syllabi.  Lifelong education and eagerness to discover and experiment are at the heart of our mission.</p>

                <div className="home-page-about-us-video">
                    <iframe className="home-page-about-us-video" src="https://www.youtube.com/embed/c_NWecZZ01M" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
            </div>

            <div className="home-page-accreditations-section-container">
                <div className="home-page-accreditations-section">
                    <img className="accreditation-photo" src="/assets/images/HomePagePhotos/AccreditedCognia.png" alt="Cognia Accredited" />
                    <img className="accreditation-photo" src="/assets/images/HomePagePhotos/university-of-cambridge-logo-1.png" alt="University of Cambridge Accredited" />
                </div>
            </div>

            <div className="home-page-admission-section">
                <ParallaxScrollSection
                    title="E-Learning & Academics"
                    text="At Harvest Schools, E-learning is integrated with all National, British, and American stages making it the first school in Egypt that not only allow parents to access classes live from anywhere around the world but also allow students to follow up with their previously recorded lessons online and solve related assignments. All of this is powered by an advanced, moderated, and well-tested system called schoolEverywhere. To understand the policies and the curriculums that are embedded within the online system, learn more below."
                    image="/assets/images/HomePagePhotos/E-Learning&Academics.png"
                    darken={true}
                    buttonText="Learn More"
                    buttonLink="/academics/partners"
                />
            </div>


            <div className="home-page-explore-section">
                <ParallaxScrollSection image={'/assets/images/HomePagePhotos/Explore360.png'} darken={true}  buttonText={'Explore'} buttonLink={'/gallery/360-tour'} />
            </div>

            {/*<div className="home-page-contact-us-section">*/}
            {/*    <h1>Contact Us</h1>*/}
            {/*    <Form fields={contactUsFormFields} sendPdf={true} mailTo={'ayman.ibrahim@harvestschools.com'} />*/}
            {/*</div>*/}
        </div>
    );
}

export default Home;