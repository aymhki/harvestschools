import '../../styles/Academics.css';
import Table from '../../modules/Table';
import PhotoCollage from '../../modules/PhotoCollage';
import {useNavigate} from "react-router-dom";
import {Helmet} from "react-helmet-async";


function National() {

    const navigate = useNavigate();

    const tableData = [
        ["Grade", "Break Time"],
        ["Junior 1", "From 9:20 To 10:000"],
        ["Junior 2 & 5", "From 10:00 To 10:40"],
        ["Junior 3, M. 1, 2, 3 & Senior 1, 2, 3", "From 10:40 To 11:20"],
        ["Junior 4 & Junior 6", "From 11:20 To 12:00"]
    ];

    const preparationToTheNewAcademicYearPhotos = [
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/Countries.jpg',
            alt: 'Countries'
        },
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/HarvestLanguageSchoolLogo.jpg',
            alt: 'Harvest Language School Logo'
        },
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/LearnDiscoverExplore.jpg',
            alt: 'Learn Discover Explore'
        },
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/MagnifyingGlass.jpg',
            alt: 'Magnifying Glass'
        },
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/MindsetIsEverything.jpg',
            alt: 'Mindset Is Everything'
        },
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/MinionsClimbing.jpg',
            alt: 'Minions Climbing'
        },
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/OpenTheWorld.jpg',
            alt: 'Open The World'
        },
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/STEMIcons.jpg',
            alt: 'STEM Icons'
        },
        {
            src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/ThinkLikeAProton.jpg',
            alt: 'Think Like A Proton'
        }
    ]

    const scienceLabsPhotos = [
        {
            src: '../assets/images/AcademicsPages/ScienceLabs/ScienceLab1.jpg',
            alt: 'Science Lab 1'
        },
        {
            src: '../assets/images/AcademicsPages/ScienceLabs/ScienceLab2.jpg',
            alt: 'Science Lab 2'
        },
        {
            src: '../assets/images/AcademicsPages/ScienceLabs/ScienceLab3.jpg',
            alt: 'Science Lab 3'
        },
        {
            src: '../assets/images/AcademicsPages/ScienceLabs/ScienceLab4.jpg',
            alt: 'Science Lab 4'
        },
    ]

    const preparationToTheNewAcademicYearCollagePreview = {
        src: '../assets/images/AcademicsPages/PreparationToTheNewAcademicYear/PreparationToTheNewAcademicYear.jpg',
        alt: 'Preparation To The New Academic Year'
    }

    const scienceLabsCollagePreview = {
        src: '../assets/images/AcademicsPages/ScienceLabs/ScienceLabs.jpg',
        alt: 'Science Labs'
    }


  return (
    <div className="national-academics-page">
        <Helmet>
            <title>Harvest International School | National</title>
            <meta name="description"
                  content="Learn more about the National academics, the curriculum, and facilities for the National Division at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Academics, American, National, British, Partners, Staff, Facilities, مدارس هارفست، برج العرب، مدرسة، أكاديميات، أمريكي، وطني، بريطاني، شركاء، موظفين، مرافق"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className="national-academics-page-header">

                <img src={'../assets/images/HarvestLogos/The National school logo-01.png'} alt="Harvest Language School"
                     className="national-academics-page-header-title-logo"/>
                <h1>Harvest Language School</h1>
            
        </div>

        <div className="national-academics-vision-and-mission">
            <div className={"standard-padding-container"}>
                <h1>Our Vision:</h1>
                <p>Is to invest in an interactive, authentic, effective, and creative generation, in which students are thirsty for knowledge and prepared for global leadership in a safe educational environment.</p>

                <h1>Our Mission:</h1>
                <p>Is to invest in the skills of educators and administrative calibers to provide an inspirational environment made fit to qualify students to be part of a gleaming future placing technology in its best use to activate the most effective educational system.</p>
            </div>
        </div>

        <div className="national-academics-page-grades-and-break-times-table-container">
            <div className={"standard-padding-container"}>
                <Table tableData={tableData} numCols={2}/>
            </div>
        </div>

        <div className="national-academics-page-safe-environment">
            <div className={"standard-padding-container"}>
            <h1>Safe Environment</h1>
            <img src={'../assets/images/AcademicsPages/SafeEnvironment.jpg'} alt="Safe Environment" className="national-academics-page-safe-environment-image"/>
            </div>
        </div>

        <div className="national-academics-page-preparation-to-the-new-academic-year-images-section">
            <div className={"standard-padding-container"}>
                <h1>Preparation To The New Academic Year</h1>
                <PhotoCollage photos={preparationToTheNewAcademicYearPhotos}
                              title="Preparation To The New Academic Year" type="collage"
                              collagePreview={preparationToTheNewAcademicYearCollagePreview}/>

            </div>
        </div>

        <div className="national-academics-page-science-labs-images-section">

            <div className={"standard-padding-container"}>
                <h1>Science Labs</h1>
                <PhotoCollage photos={scienceLabsPhotos} title="Science Labs" type="collage"
                              collagePreview={scienceLabsCollagePreview}/>

            </div>
        </div>

        <div className="national-academics-page-english-syllabus">
            <div className={"standard-padding-container"}>
                <h1>New English Syllabus</h1>
                <img src={'../assets/images/AcademicsPages/WORLDBooks.png'} alt="New English Syllabus"
                     className="national-academics-page-english-syllabus-image"/>
            </div>
        </div>

        <div className="national-academics-page-science-syllabus">
            <div className={"standard-padding-container"}>
            <h1>New Science Syllabus</h1>
            <img src={'../assets/images/AcademicsPages/RichmondScienceBooks.png'} alt="New Science Syllabus" className="national-academics-page-science-syllabus-image"/>
            </div>
        </div>

        <div className="national-academics-page-extra-worksheets-syllabus">
            <div className={"standard-padding-container"}>
                <h1>Extra Worksheets</h1>
                <img src={'../assets/images/AcademicsPages/Booklet.png'} alt="Extra Worksheets"
                     className="national-academics-page-extra-worksheets-image"/>
            </div>
        </div>

        <div className="national-academics-page-quran-syllabus">
            <div className={"standard-padding-container"}>
                <h1>Quran Syllabus</h1>
                <iframe className="national-academics-page-quran-syllabus-video"
                        src="https://www.youtube-nocookie.com/embed/eCiGLdBqHpA?si=YVck_mUlGvxNXtSh"
                        title="منهج القرآن الكريم"
                        frameBorder={0}
                        loading={"lazy"}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen/>
            </div>
        </div>

        <div className="national-academics-page-math-junior-one">
            <div className={"standard-padding-container"}>
                <h1>Math (Junior 1)</h1>
                <iframe className="national-academics-page-math-junior-one-video"
                        src="https://www.youtube-nocookie.com/embed/NoHx7-DK4NU?si=QQ6u6r30BxX7mls_"
                        title="Math J1"
                        frameBorder={0}
                        loading={"lazy"}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen/>
            </div>
        </div>

        <div className="national-academics-page-english-junior-one">
            <div className={"standard-padding-container"}>
                <h1>English (Junior 1)</h1>
                <iframe className="national-academics-page-english-junior-one-video"
                        src="https://www.youtube-nocookie.com/embed/W-xeX1XFDkY?si=ZvayNB-C2_a0Js4Z"
                        title="jr1 Eng"
                        frameBorder={0}
                        loading={"lazy"}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen/>
            </div>
        </div>

        <div className="national-academics-page-english-junior-six">
            <div className={"standard-padding-container"}>
                <h1>English (Junior 6)</h1>
                <iframe className="national-academics-page-english-junior-six-video"
                        src="https://www.youtube-nocookie.com/embed/r-KQ7RzYDH8?si=e6uxAqgPX2W1cSkg"
                        title="jr6 english"
                        frameBorder={0}
                        loading={"lazy"}
                        allow="accelometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen/>
            </div>
        </div>

        <div className="national-academics-page-french-junior-one">
            <div className={"standard-padding-container"}>
                <h1>French (Junior 1)</h1>
                <iframe className="national-academics-page-french-junior-one-video"
                        src="https://www.youtube-nocookie.com/embed/XwAGJNs6gTU?si=Jtejjsfl0jxnrWFA"
                        title="Fr jr 1"
                        frameBorder={0}
                        loading={"lazy"}
                        allow="accelometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen/>
            </div>
        </div>

        <div className="national-academics-page-arabic-junior-one">
            <div className={"standard-padding-container"}>
                <h1>Arabic (Junior 1)</h1>
                <iframe className="national-academics-page-arabic-junior-one-video"
                        src="https://www.youtube-nocookie.com/embed/J48T7RuyNcw?si=HZH95R3FFABrkmh8"
                        title="حرف الألف أ"
                        frameBorder={0}
                        loading={"lazy"}
                        allow="accelometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen/>
            </div>
        </div>

        <div className="national-academics-page-science-middle-two">
            <div className={"standard-padding-container"}>
                <h1>Science (Middle 2)</h1>
                <iframe className="national-academics-page-science-middle-two-video"
                        src="https://www.youtube-nocookie.com/embed/6zJYZw0AA2U?si=eDD5eDcxzNaX_aYU"
                        title="Science m2"
                        frameBorder={0}
                        loading={"lazy"}
                        allow="accelometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen/>
            </div>
        </div>

        <div className="national-academics-page-covid-19-policy">
            <div className={"standard-padding-container"}>
                <h1>Precautions For Covid-19</h1>
                <p>Follow our guide for safety environment during School day.</p>
                <button onClick={() => navigate('/covid-19')}
                        className="national-academics-page-covid-19-policy-button">
                    Learn More
                </button>
            </div>
        </div>

    </div>
);
}

export default National;