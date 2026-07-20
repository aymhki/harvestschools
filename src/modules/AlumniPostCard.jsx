import PropTypes from "prop-types";
import MarkdownContent, {markdownToPlainText} from "./MarkdownContent.jsx";
import '../styles/AlumniStudents.css';
import {alumniPublicFileUrl} from "../services/General/GeneralUtils.jsx";
import {useState} from "react";

const PREVIEW_EXCERPT_LENGTH = 220;

function AlumniAuthorLine({post}) {
    const avatarUrl = post.authorProfilePicture ? alumniPublicFileUrl(post.authorProfilePicture) : '';
    const initial = (post.authorName || post.authorUsername || '?').trim().charAt(0).toUpperCase();
    const detailParts = [];

    if (post.authorPosition) { detailParts.push(post.authorPosition); }
    if (post.authorGraduationYear) { detailParts.push(`Class of ${post.authorGraduationYear}`); }

    return (
        <div className={"alumni-post-card-author"}>
            {avatarUrl ? (
                <img className={"alumni-post-card-avatar"} src={avatarUrl} alt={post.authorName || post.authorUsername} loading="lazy"/>
            ) : (
                <div className={"alumni-post-card-avatar alumni-post-card-avatar-fallback"}>
                    {initial}
                </div>
            )}

            <div className={"alumni-post-card-author-text"}>
                <p className={"alumni-post-card-author-name"}>
                    {post.authorName || post.authorUsername}
                </p>

                {(detailParts.length > 0 || post.publishedAt) && (
                    <p className={"alumni-post-card-author-details"}>
                        {detailParts.join(' · ')}
                        {detailParts.length > 0 && post.publishedAt ? ' · ' : ''}
                        {post.publishedAt || ''}
                    </p>
                )}
            </div>
        </div>
    );
}

AlumniAuthorLine.propTypes = {
    post: PropTypes.object.isRequired,
};

function AlumniPostCard({post, variant, onReadMore, expandToFullOnReadMore}) {
    const [isPreview, setIsPreview] = useState(variant === 'preview');
    const [expandedPreview, setExpandedPreview] = useState(!expandToFullOnReadMore);

    return (
        <article className={`alumni-post-card ${isPreview ? 'alumni-post-card-preview' : 'alumni-post-card-full'}`}>
            <AlumniAuthorLine post={post}/>

                {(isPreview) ? (
                    <>
                        <div className={"alumni-post-card-content"}>
                            <h3 className={"alumni-post-card-title"}>{post.title}</h3>
                            <p className={"alumni-post-card-excerpt"}>
                                {markdownToPlainText(post.content, PREVIEW_EXCERPT_LENGTH)}
                            </p>
                        </div>
                        {( (onReadMore || expandToFullOnReadMore)  && post.content.length > PREVIEW_EXCERPT_LENGTH) && (
                            <button className={"alumni-post-card-read-more"} onClick={() => {
                                if (expandToFullOnReadMore) {
                                    setIsPreview(false);
                                    setExpandedPreview(true);
                                } else {
                                    onReadMore(post);
                                }
                            }}>
                                {expandToFullOnReadMore ? "Expand" : "Read the full story"}
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <h3 className={"alumni-post-card-title"}>{post.title}</h3>
                        <MarkdownContent content={post.content}/>
                        { (expandedPreview) && (
                            <button className={"alumni-post-card-read-more"} onClick={() => setIsPreview(true)}>
                                Collapse
                            </button>
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
    }).isRequired,
    variant: PropTypes.oneOf(['preview', 'full']),
    onReadMore: PropTypes.func,
    expandToFullOnReadMore: PropTypes.bool,
};

export default AlumniPostCard;
