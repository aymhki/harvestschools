import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {useTranslation} from "react-i18next";
import AlumniPostCard from "../../../modules/AlumniPostCard.jsx";
import '../../../styles/AlumniStudents.css';
import {fetchAlumniPublicProfile} from "../../../services/Public/AlumniStudents/AlumniStudentsPublicServices.jsx";
import {alumniPublicFileUrl, alumniStudentsPageUrl} from "../../../services/General/GeneralUtils.jsx";
import {useLoading} from '../../../services/General/GlobalLoadingService.jsx'
import {renderWithLanguageSpans, detectLanguage, localiseDigits} from "../../../services/General/MixedLanguageText.jsx";

function AlumniPublicProfile() {
    const {username} = useParams();
    const navigate = useNavigate();
    const {t, i18n} = useTranslation(['students-life-pages']);
    const language = i18n.language === 'ar' ? 'ar' : 'en';
    const [isLoading, setIsLoading] = useLoading(false);
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            setNotFound(false);

            const result = await fetchAlumniPublicProfile(username);

            if (result) {
                setProfile(result.profile);
                setPosts(result.posts);
            } else {
                setProfile(null);
                setPosts([]);
                setNotFound(true);
            }

            setIsLoading(false);
        };

        loadProfile();
    }, [username]);

    const pageTitle = profile
        ? t('students-life-pages.alumni-public-profile-page.page-title', {name: profile.name})
        : t('students-life-pages.alumni-public-profile-page.page-title-fallback');

    return (
        <>
            <title>{pageTitle}</title>
            <meta name="robots" content="noindex, nofollow"/>
            <meta name="googlebot" content="noindex, nofollow"/>

            <div className={"alumni-profile-page"}>
                <div className={"extreme-padding-container"}>
                    <div className={"alumni-profile-wrapper"}>
                        {profile && (
                            <>
                                <div className={"alumni-public-profile-card"}>
                                    {profile.profilePicture ? (
                                        <img
                                            className={"alumni-public-profile-avatar"}
                                            src={alumniPublicFileUrl(profile.profilePicture)}
                                            alt={profile.name}
                                        />
                                    ) : (
                                        <div
                                            className={"alumni-public-profile-avatar alumni-public-profile-avatar-fallback"}
                                            lang={detectLanguage(profile.name || profile.username)}
                                        >
                                            {(profile.name || profile.username || '?').trim().charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <h1 className={"alumni-public-profile-name"} lang={detectLanguage(profile.name)} dir="auto">
                                        {renderWithLanguageSpans(profile.name)}
                                    </h1>

                                    <p className={"alumni-public-profile-username alumni-profile-force-english"} lang={"en"} dir="ltr">@{profile.username}</p>

                                    {(profile.position || profile.graduationYear) && (
                                        <div className={"alumni-public-profile-meta"}>
                                            {profile.position && (
                                                <span className={"alumni-status-chip alumni-status-chip-placement"} lang={detectLanguage(profile.position)} dir="auto">
                                                    {renderWithLanguageSpans(profile.position)}
                                                </span>
                                            )}

                                            {profile.graduationYear && (
                                                <span className={"alumni-status-chip alumni-status-chip-placement"} lang={language}>
                                                    {t('students-life-pages.alumni-public-profile-page.class-of', {year: localiseDigits(profile.graduationYear, language)})}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {profile.bio && (
                                        <p className={"alumni-public-profile-bio"} lang={detectLanguage(profile.bio)} dir="auto">
                                            {renderWithLanguageSpans(profile.bio)}
                                        </p>
                                    )}
                                </div>

                                {posts.map(post => (
                                    <AlumniPostCard key={post.id} post={post} variant={"preview"} expandToFullOnReadMore={true} linkAuthorToProfile={false} renderMarkdownOnShortPreview={true}/>
                                ))}

                                {posts.length === 0 && !isLoading && (
                                    <p className={"alumni-students-page-empty"}>
                                        {t('students-life-pages.alumni-public-profile-page.no-posts-yet', {name: profile.name})}
                                    </p>
                                )}
                            </>
                        )}

                        {notFound && !isLoading && (
                            <div className={"alumni-profile-section"}>
                                <div className={"alumni-profile-section-header"}>
                                    <h2>{t('students-life-pages.alumni-public-profile-page.not-found-title')}</h2>
                                </div>

                                <p className={"alumni-profile-empty-hint"}>
                                    {t('students-life-pages.alumni-public-profile-page.not-found-message')}
                                </p>

                                <div className={"alumni-profile-header-actions"}>
                                    <button onClick={() => navigate(alumniStudentsPageUrl)}>
                                        {t('students-life-pages.alumni-public-profile-page.back-to-alumni')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AlumniPublicProfile;
