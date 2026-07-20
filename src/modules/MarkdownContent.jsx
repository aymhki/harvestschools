import PropTypes from "prop-types";
import {Fragment} from "react";
import '../styles/MarkdownContent.css';
import {alumniPublicFileUrl} from "../services/General/GeneralUtils.jsx";

const IMAGE_ALIGNMENTS = ['left', 'right', 'center', 'full'];

const sanitizeLinkUrl = (url) => {
    const trimmed = String(url || '').trim();

    if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
        return null;
    }

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
        return trimmed;
    }

    return null;
};

const sanitizeImageSrc = (src) => {
    const trimmed = String(src || '').trim();

    if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
        return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    if (trimmed.includes('..') || trimmed.startsWith('/')) {
        return null;
    }

    return alumniPublicFileUrl(trimmed);
};

const splitImageAltAndAlignment = (rawAlt) => {
    const alt = String(rawAlt || '');
    const separatorIndex = alt.lastIndexOf('|');

    if (separatorIndex !== -1) {
        const possibleAlignment = alt.slice(separatorIndex + 1).trim().toLowerCase();

        if (IMAGE_ALIGNMENTS.includes(possibleAlignment)) {
            return {alt: alt.slice(0, separatorIndex).trim(), alignment: possibleAlignment};
        }
    }

    return {alt: alt.trim(), alignment: 'center'};
};

const INLINE_REGEX_SOURCE = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`/;

const parseInline = (text, keyPrefix, allowNested = true) => {
    const elements = [];
    let lastIndex = 0;
    let matchIndex = 0;
    const source = String(text || '');
    const inlineRegex = new RegExp(INLINE_REGEX_SOURCE.source, 'g');
    let match;

    while ((match = inlineRegex.exec(source)) !== null) {
        if (match.index > lastIndex) {
            elements.push(source.slice(lastIndex, match.index));
        }

        const key = `${keyPrefix}-in-${matchIndex}`;

        if (match[1] !== undefined || (match[0].startsWith('![') && match[2] !== undefined)) {
            const {alt} = splitImageAltAndAlignment(match[1]);
            const src = sanitizeImageSrc(match[2]);

            if (src) {
                elements.push(<img key={key} className={"markdown-inline-image"} src={src} alt={alt} loading="lazy"/>);
            } else {
                elements.push(alt);
            }
        } else if (match[3] !== undefined) {
            const href = sanitizeLinkUrl(match[4]);
            const linkChildren = allowNested ? parseInline(match[3], key, false) : match[3];

            if (href) {
                elements.push(
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer">
                        {linkChildren}
                    </a>
                );
            } else {
                elements.push(match[3]);
            }
        } else if (match[5] !== undefined) {
            elements.push(<strong key={key}>{allowNested ? parseInline(match[5], key, false) : match[5]}</strong>);
        } else if (match[6] !== undefined) {
            elements.push(<em key={key}>{allowNested ? parseInline(match[6], key, false) : match[6]}</em>);
        } else if (match[7] !== undefined) {
            elements.push(<code key={key}>{match[7]}</code>);
        }

        lastIndex = match.index + match[0].length;
        matchIndex += 1;
    }

    if (lastIndex < source.length) {
        elements.push(source.slice(lastIndex));
    }

    return elements;
};

const STANDALONE_IMAGE_REGEX = /^!\[([^\]]*)\]\(([^)]+)\)$/;

const parseBlocks = (content) => {
    const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();

        if (trimmed === '') {
            index += 1;
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
            blocks.push({type: 'heading', level: headingMatch[1].length, text: headingMatch[2]});
            index += 1;
            continue;
        }

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            blocks.push({type: 'hr'});
            index += 1;
            continue;
        }

        const imageMatch = trimmed.match(STANDALONE_IMAGE_REGEX);
        if (imageMatch) {
            const {alt, alignment} = splitImageAltAndAlignment(imageMatch[1]);
            blocks.push({type: 'image', alt, alignment, src: imageMatch[2]});
            index += 1;
            continue;
        }

        if (/^[-*]\s+/.test(trimmed)) {
            const items = [];
            while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
                items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
                index += 1;
            }
            blocks.push({type: 'ul', items});
            continue;
        }

        if (/^\d+\.\s+/.test(trimmed)) {
            const items = [];
            while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
                items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
                index += 1;
            }
            blocks.push({type: 'ol', items});
            continue;
        }

        if (/^>\s?/.test(trimmed)) {
            const quoteLines = [];
            while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
                quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
                index += 1;
            }
            blocks.push({type: 'quote', lines: quoteLines});
            continue;
        }

        const paragraphLines = [];
        while (index < lines.length) {
            const currentTrimmed = lines[index].trim();

            if (currentTrimmed === ''
                || /^(#{1,3})\s+/.test(currentTrimmed)
                || /^[-*]\s+/.test(currentTrimmed)
                || /^\d+\.\s+/.test(currentTrimmed)
                || /^>\s?/.test(currentTrimmed)
                || /^(-{3,}|\*{3,}|_{3,})$/.test(currentTrimmed)
                || STANDALONE_IMAGE_REGEX.test(currentTrimmed)) {
                break;
            }

            paragraphLines.push(currentTrimmed);
            index += 1;
        }

        if (paragraphLines.length > 0) {
            blocks.push({type: 'paragraph', lines: paragraphLines});
        }
    }

    return blocks;
};

const renderBlock = (block, blockIndex) => {
    const key = `md-block-${blockIndex}`;

    switch (block.type) {
        case 'heading': {
            const children = parseInline(block.text, key);
            if (block.level === 1) { return <h2 key={key}>{children}</h2>; }
            if (block.level === 2) { return <h3 key={key}>{children}</h3>; }
            return <h4 key={key}>{children}</h4>;
        }
        case 'hr':
            return <hr key={key}/>;
        case 'image': {
            const src = sanitizeImageSrc(block.src);

            if (!src) {
                return null;
            }

            return (
                <figure key={key} className={`markdown-image-figure markdown-image-${block.alignment}`}>
                    <img src={src} alt={block.alt} loading="lazy"/>
                    {block.alt && <figcaption>{block.alt}</figcaption>}
                </figure>
            );
        }
        case 'ul':
            return (
                <ul key={key}>
                    {block.items.map((item, itemIndex) => (
                        <li key={`${key}-li-${itemIndex}`}>{parseInline(item, `${key}-li-${itemIndex}`)}</li>
                    ))}
                </ul>
            );
        case 'ol':
            return (
                <ol key={key}>
                    {block.items.map((item, itemIndex) => (
                        <li key={`${key}-li-${itemIndex}`}>{parseInline(item, `${key}-li-${itemIndex}`)}</li>
                    ))}
                </ol>
            );
        case 'quote':
            return (
                <blockquote key={key}>
                    {block.lines.map((quoteLine, lineIndex) => (
                        <Fragment key={`${key}-q-${lineIndex}`}>
                            {lineIndex > 0 && <br/>}
                            {parseInline(quoteLine, `${key}-q-${lineIndex}`)}
                        </Fragment>
                    ))}
                </blockquote>
            );
        case 'paragraph':
            return (
                <p key={key}>
                    {block.lines.map((paragraphLine, lineIndex) => (
                        <Fragment key={`${key}-p-${lineIndex}`}>
                            {lineIndex > 0 && <br/>}
                            {parseInline(paragraphLine, `${key}-p-${lineIndex}`)}
                        </Fragment>
                    ))}
                </p>
            );
        default:
            return null;
    }
};

const markdownToPlainText = (content, maxLength = 0) => {
    let text = String(content || '')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*\n]+)\*/g, '$1')
        .replace(/`([^`\n]+)`/g, '$1')
        .replace(/^#{1,3}\s+/gm, '')
        .replace(/^>\s?/gm, '')
        .replace(/^[-*]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '')
        .replace(/\n{2,}/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();

    if (maxLength > 0 && text.length > maxLength) {
        text = text.slice(0, maxLength).trimEnd() + '…';
    }

    return text;
};

function MarkdownContent({content, className}) {
    const blocks = parseBlocks(content);

    return (
        <div className={`markdown-content ${className || ''}`}>
            {blocks.map((block, blockIndex) => renderBlock(block, blockIndex))}
        </div>
    );
}

MarkdownContent.propTypes = {
    content: PropTypes.string,
    className: PropTypes.string,
};

export default MarkdownContent;
export {markdownToPlainText};
