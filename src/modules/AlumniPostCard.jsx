import PropTypes from "prop-types";
import MarkdownContent, {markdownToPlainText} from "./MarkdownContent.jsx";
import CachedImage from "./CachedImage.jsx";
import '../styles/AlumniStudents.css';
import {alumniPublicFileUrl, alumniPublicProfilePageUrl} from "../services/General/GeneralUtils.jsx";
import {useState} from "react";
import {useNavigate} from "react-router";
import {useTranslation} from "react-i18next";
import {renderWithLanguageSpans, detectLanguage, localiseDigits, formatLocalisedDate} from "../services/General/MixedLanguageText.jsx";

const PREVIEW_EXCERPT_LENGTH = 220;

function AlumniAuthorLine({post, linkAuthorToProfile}) {
    const navigate = useNavigate();
    const {t, i18n} = useTranslation(['students-life-pages']);
    const language = i18n.language === 'ar' ? 'ar' : 'en';
    const avatarUrl = post.authorProfilePicture ? alumniPublicFileUrl(post.authorProfilePicture) : '';
    const initial = (post.authorName || post.authorUsername || '?').trim().charAt(0).toUpperCase();
    const detailParts = [];
    const isLinked = linkAuthorToProfile && !!post.authorUsername;

    if (post.authorPosition) { detailParts.push(post.authorPosition); }
    if (post.authorGraduationYear) { detailParts.push(t('students-life-pages.alumni-post-card.class-of', {year: localiseDigits(post.authorGraduationYear, language)})); }

    const publishedLabel = formatLocalisedDate(post.publishedAtIso, language, post.publishedAt || '');

    const openProfile = () => navigate(alumniPublicProfilePageUrl(post.authorUsername));

    const interaction = isLinked ? {
        role: "link",
        tabIndex: 0,
        title: t('students-life-pages.alumni-post-card.view-profile', {name: post.authorName || post.authorUsername}),
        onClick: openProfile,
        onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openProfile();
            }
        },
    } : {};

    const linkedClass = isLinked ? ' alumni-post-card-author-link' : '';

    return (
        <div className={"alumni-post-card-author"}>
            <div className={`alumni-post-card-avatar-wrapper${linkedClass}`} {...interaction}>
                {avatarUrl ? (
                    <CachedImage className={"alumni-post-card-avatar"} fallbackClassName={"alumni-post-card-avatar"} src={avatarUrl} alt={post.authorName || post.authorUsername} loading="lazy"/>
                ) : (
                    <div className={"alumni-post-card-avatar alumni-post-card-avatar-fallback"} lang={detectLanguage(post.authorName || post.authorUsername)}>
                        {initial}
                    </div>
                )}
            </div>

            <div className={"alumni-post-card-author-text"}>
                <p className={`alumni-post-card-author-name${linkedClass}`} lang={detectLanguage(post.authorName || post.authorUsername)} dir="auto" {...interaction}>
                    {renderWithLanguageSpans(post.authorName || post.authorUsername)}
                </p>

                {(detailParts.length > 0 || publishedLabel) && (
                    <p className={"alumni-post-card-author-details"} dir="auto">
                        {renderWithLanguageSpans(detailParts.join(' · '))}
                        {detailParts.length > 0 && publishedLabel ? ' · ' : ''}
                        {publishedLabel}
                    </p>
                )}
            </div>
        </div>
    );
}

AlumniAuthorLine.propTypes = {
    post: PropTypes.object.isRequired,
    linkAuthorToProfile: PropTypes.bool,
};

function AlumniPostCard({post, variant, onReadMore, expandToFullOnReadMore, linkAuthorToProfile = true, renderMarkdownOnShortPreview = false}) {
    const {t} = useTranslation(['students-life-pages']);
    const [isPreview, setIsPreview] = useState(variant === 'preview');
    const [expandedPreview, setExpandedPreview] = useState(!expandToFullOnReadMore);

    return (
        <article className={`alumni-post-card ${isPreview ? 'alumni-post-card-preview' : 'alumni-post-card-full'}`}>
            <AlumniAuthorLine post={post} linkAuthorToProfile={linkAuthorToProfile}/>

                {(isPreview) ? (
                    <>
                        <div className={"alumni-post-card-content"}>
                            <h3 className={"alumni-post-card-title"} lang={detectLanguage(post.title)} dir="auto">{renderWithLanguageSpans(post.title)}</h3>
                            {renderMarkdownOnShortPreview ? (
                                <MarkdownContent content={post.content}/>
                            ) : (
                                <p className={"alumni-post-card-excerpt"} lang={detectLanguage(markdownToPlainText(post.content, PREVIEW_EXCERPT_LENGTH))} dir="auto">
                                    {renderWithLanguageSpans(markdownToPlainText(post.content, PREVIEW_EXCERPT_LENGTH))}
                                </p>
                            )}
                        </div>
                        {( (onReadMore || expandToFullOnReadMore)  && post.content.length > PREVIEW_EXCERPT_LENGTH) && (
                            <span className={"alumni-post-card-read-more"} onClick={() => {
                                if (expandToFullOnReadMore) {
                                    setIsPreview(false);
                                    setExpandedPreview(true);
                                } else {
                                    onReadMore(post);
                                }
                            }}>
                                {expandToFullOnReadMore ? t('students-life-pages.alumni-post-card.expand') : t('students-life-pages.alumni-post-card.read-full-story')}
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        <h3 className={"alumni-post-card-title"} lang={detectLanguage(post.title)} dir="auto">{renderWithLanguageSpans(post.title)}</h3>
                        <MarkdownContent content={post.content}/>
                        { (expandedPreview) && (
                            <span className={"alumni-post-card-read-more"} onClick={() => setIsPreview(true)}>
                                {t('students-life-pages.alumni-post-card.collapse')}
                            </span>
                        )}
                    </>
                )}

        </article>
    );
}

AlumniPostCard.propTypes = {
    post: PropTypes.shape({
        id: PropTypes.number,
        title: PropTypes.string,
        content: PropTypes.string,
        publishedAt: PropTypes.string,
        authorName: PropTypes.string,
        authorUsername: PropTypes.string,
        authorPosition: PropTypes.string,
        authorGraduationYear: PropTypes.string,
        authorProfilePicture: PropTypes.string,
        publishedAtIso: PropTypes.string,
    }).isRequired,
    variant: PropTypes.oneOf(['preview', 'full']),
    onReadMore: PropTypes.func,
    expandToFullOnReadMore: PropTypes.bool,
    linkAuthorToProfile: PropTypes.bool,
    renderMarkdownOnShortPreview: PropTypes.bool,
};

export default AlumniPostCard;
