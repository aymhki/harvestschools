import {Helmet} from "react-helmet-async";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Spinner from "../../../modules/Spinner.jsx";
import AlumniPostCard from "../../../modules/AlumniPostCard.jsx";
import '../../../styles/AlumniStudents.css';
import {fetchApprovedAlumniPosts} from "../../../services/Public/AlumniStudents/AlumniStudentsPublicServices.jsx";
import {alumniLoginPageUrl} from "../../../services/General/GeneralUtils.jsx";

function AlumniStudents() {
    const navigate = useNavigate();
    const {t} = useTranslation(['students-life-pages']);
    const [isLoading, setIsLoading] = useState(false);
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const loadPosts = async () => {
            setIsLoading(true);
            const fetchedPosts = await fetchApprovedAlumniPosts('alumni-page');
            setPosts(fetchedPosts);
            setIsLoading(false);
        };

        loadPosts();
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}

            <Helmet>
                <title>Harvest International School | Students Life | Alumni Students</title>
                <meta name="description" content="Stories, updates, and achievements shared by the alumni students of Harvest International Schools in Borg El Arab, Egypt. Current and future alumni can sign up to share their own stories."/>
                <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Alumni, Alumni Students, Graduates, Stories, خريجين, خريجي هارفست, قصص الخريجين"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <div className={"alumni-students-page"}>
                <div className={"extreme-padding-container"}>
                    <div className={"alumni-students-page-header"}>
                        <h1>
                            {t("students-life-pages.alumni-students-page.title")}
                        </h1>

                        <div className={"alumni-students-page-header-wrapper"}>
                            <p>
                                {t("students-life-pages.alumni-students-page.description")}
                            </p>

                            <div className={"alumni-students-page-header-actions"}>
                                <button onClick={() => navigate(alumniLoginPageUrl)}>
                                    {t("students-life-pages.alumni-students-page.sign-in-up-button")}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={"alumni-students-page-posts"}>
                        {posts.length > 0 ? (
                            posts.map(post => (
                                <AlumniPostCard key={post.id} post={post} variant={"preview"} expandToFullOnReadMore={true}/>
                            ))
                        ) : (
                            !isLoading && (
                                <p className={"alumni-students-page-empty"}>
                                    {t("students-life-pages.alumni-students-page.no-posts-yet")}
                                </p>
                            )
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}

export default AlumniStudents;
