import PropTypes from "prop-types";
import {useRef, useState} from "react";
import MarkdownContent from "./MarkdownContent.jsx";
import '../styles/AlumniStudents.css';
import {msgTimeout} from "../services/General/GeneralUtils.jsx";
import {LinkOutlined} from "@mui/icons-material";
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import TitleIcon from '@mui/icons-material/Title';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PreviewIcon from '@mui/icons-material/Preview';

const IMAGE_ALIGNMENT_CHOICES = [
    {value: 'center', label: 'Centered'},
    {value: 'left', label: 'Left of text'},
    {value: 'right', label: 'Right of text'},
    {value: 'full', label: 'Full width'},
];

function AlumniMarkdownEditor({value, onChange, onUploadImage, disabled, placeholder}) {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const [showPreview, setShowPreview] = useState(false);
    const [imageAlignment, setImageAlignment] = useState('center');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [editorError, setEditorError] = useState('');

    const applyToSelection = (transform) => {
        const textarea = textareaRef.current;

        if (!textarea) { return; }

        const start = textarea.selectionStart ?? value.length;
        const end = textarea.selectionEnd ?? value.length;
        const selected = value.slice(start, end);
        const {text, cursorStart, cursorEnd} = transform(selected, start, end);
        const newValue = value.slice(0, start) + text + value.slice(end);

        onChange(newValue);

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorStart, cursorEnd);
        });
    };

    const wrapSelection = (before, after, placeholderText) => {
        applyToSelection((selected, start) => {
            const inner = selected || placeholderText;
            return {
                text: `${before}${inner}${after}`,
                cursorStart: start + before.length,
                cursorEnd: start + before.length + inner.length,
            };
        });
    };

    const prefixLines = (prefix, placeholderText) => {
        applyToSelection((selected, start) => {
            const inner = selected || placeholderText;
            const prefixed = inner.split('\n').map(line => `${prefix}${line}`).join('\n');
            const needsLeadingNewline = start > 0 && value[start - 1] !== '\n';
            const text = `${needsLeadingNewline ? '\n' : ''}${prefixed}`;
            return {
                text,
                cursorStart: start + text.length - inner.length + (inner.length - inner.split('\n').pop().length),
                cursorEnd: start + text.length,
            };
        });
    };

    const insertBlock = (blockText) => {
        applyToSelection((selected, start) => {
            const needsLeadingNewline = start > 0 && value[start - 1] !== '\n';
            const text = `${needsLeadingNewline ? '\n\n' : ''}${blockText}\n`;
            return {
                text,
                cursorStart: start + text.length,
                cursorEnd: start + text.length,
            };
        });
    };

    const handleInsertLink = () => {
        applyToSelection((selected, start) => {
            const linkText = selected || 'link text';
            const text = `[${linkText}](https://)`;
            const urlStart = start + linkText.length + 3;
            return {
                text,
                cursorStart: urlStart,
                cursorEnd: urlStart + 8,
            };
        });
    };

    const handleImageButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageFileSelected = async (event) => {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';

        if (!file) { return; }

        try {
            setIsUploadingImage(true);
            setEditorError('');
            const filePath = await onUploadImage(file);
            const caption = file.name.replace(/\.[^/.]+$/, '').replace(/[|[\]()]/g, ' ').trim() || 'Image';
            const alignmentSuffix = imageAlignment === 'center' ? '' : `|${imageAlignment}`;
            insertBlock(`![${caption}${alignmentSuffix}](${filePath})`);
        } catch (error) {
            setEditorError(error.message || 'The image could not be uploaded.');
            setTimeout(() => setEditorError(''), msgTimeout);
        } finally {
            setIsUploadingImage(false);
        }
    };

    return (
        <div className={"alumni-markdown-editor"}>
            <div className={"alumni-markdown-editor-toolbar"}>
                <button type="button" disabled={disabled} title="Heading" onClick={() => prefixLines('## ', 'Heading')}>
                    <TitleIcon/>
                </button>

                <button type="button" disabled={disabled} title="Bold" onClick={() => wrapSelection('**', '**', 'bold text')}>
                    <FormatBoldIcon/>
                </button>

                <button type="button" disabled={disabled} title="Italic" onClick={() => wrapSelection('*', '*', 'italic text')}>
                    <FormatItalicIcon/>
                </button>

                <button type="button" disabled={disabled} title="Link" onClick={handleInsertLink}>

                    <LinkOutlined/>
                </button>

                <button type="button" disabled={disabled} title="Bulleted list" onClick={() => prefixLines('- ', 'List item')}>
                    <FormatListBulletedIcon/>
                </button>

                <button type="button" disabled={disabled} title="Quote" onClick={() => prefixLines('> ', 'Quote')}>
                    <FormatQuoteIcon/>
                </button>

                <span className={"alumni-markdown-editor-toolbar-separator"}/>

                <select
                    value={imageAlignment}
                    disabled={disabled || isUploadingImage}
                    onChange={(e) => setImageAlignment(e.target.value)}
                    aria-label="Image position"
                    className={"select-form-field"}
                >
                    {IMAGE_ALIGNMENT_CHOICES.map(choice => (
                        <option key={choice.value} value={choice.value}>{choice.label}</option>
                    ))}
                </select>

                <button type="button" disabled={disabled || isUploadingImage} onClick={handleImageButtonClick}>
                    <AddPhotoAlternateIcon/>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff"
                    style={{display: 'none'}}
                    onChange={handleImageFileSelected}
                />

                <span className={"alumni-markdown-editor-toolbar-separator"}/>

                <button
                    type="button"
                    className={showPreview ? 'alumni-markdown-editor-preview-toggle-active' : ''}
                    onClick={() => setShowPreview(prev => !prev)}
                >
                    <PreviewIcon/>
                </button>
            </div>

            {editorError && (
                <p className={"alumni-markdown-editor-error"}>{editorError}</p>
            )}

            <div className={`alumni-markdown-editor-panels ${showPreview ? 'with-preview' : ''}`}>
                <textarea
                    ref={textareaRef}
                    value={value}
                    disabled={disabled}
                    className={"textarea-form-field"}
                    placeholder={placeholder || "Share your story… Use the toolbar above for headings, formatting, and pictures."}
                    onChange={(e) => onChange(e.target.value)}
                    dir="auto"
                />

                {showPreview && (
                    <div className={"alumni-markdown-editor-preview"}>
                        {value.trim() !== '' ? (
                            <MarkdownContent content={value}/>
                        ) : (
                            <p className={"alumni-markdown-editor-preview-empty"}>
                                The preview of your post will appear here as you write.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <p className={"alumni-markdown-editor-hint"}>
                Tip: pictures added as &ldquo;Left of text&rdquo; or &ldquo;Right of text&rdquo; let your writing wrap around them, while &ldquo;Centered&rdquo; and &ldquo;Full width&rdquo; place them on their own line.
            </p>
        </div>
    );
}

AlumniMarkdownEditor.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onUploadImage: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    placeholder: PropTypes.string,
};

export default AlumniMarkdownEditor;
