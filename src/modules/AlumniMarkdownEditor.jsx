import PropTypes from "prop-types";
import {useRef, useState} from "react";
import MarkdownContent from "./MarkdownContent.jsx";
import '../styles/AlumniStudents.css';
import {msgTimeout} from "../services/General/GeneralUtils.jsx";
import {useTranslation} from "react-i18next";
import {LinkOutlined} from "@mui/icons-material";
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import TitleIcon from '@mui/icons-material/Title';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PreviewIcon from '@mui/icons-material/Preview';
import {capturePhotoAsFile, isCameraAvailable} from "../services/General/NativeCameraService.jsx";

const IMAGE_ALIGNMENT_VALUES = ['center', 'left', 'right', 'full'];

function AlumniMarkdownEditor({value, onChange, onUploadImage, disabled, placeholder}) {
    const {t} = useTranslation(['students-life-pages']);
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
            const linkText = selected || t('students-life-pages.alumni-markdown-editor.link-text-sample');
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

    const uploadAndInsertImage = async (file, fallbackCaption) => {
        try {
            setIsUploadingImage(true);
            setEditorError('');
            const filePath = await onUploadImage(file);
            const caption = file.name.replace(/\.[^/.]+$/, '').replace(/[|[\]()]/g, ' ').trim() || fallbackCaption;
            const alignmentSuffix = imageAlignment === 'center' ? '' : `|${imageAlignment}`;
            insertBlock(`![${caption}${alignmentSuffix}](${filePath})`);
        } catch (error) {
            setEditorError(error.message || t('students-life-pages.alumni-markdown-editor.upload-failed'));
            setTimeout(() => setEditorError(''), msgTimeout);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleImageFileSelected = async (event) => {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';

        if (file) {
            await uploadAndInsertImage(file, t('students-life-pages.alumni-markdown-editor.image-caption-fallback'));
        }
    };

    const handleTakePhotoClick = async () => {
        try {
            const capturedFile = await capturePhotoAsFile();

            if (capturedFile) {
                await uploadAndInsertImage(capturedFile, t('students-life-pages.alumni-markdown-editor.photo-caption-fallback'));
            }
        } catch (error) {
            setEditorError(error.message || t('students-life-pages.alumni-markdown-editor.camera-failed'));
            setTimeout(() => setEditorError(''), msgTimeout);
        }
    };

    return (
        <div className={"alumni-markdown-editor"}>
            <div className={"alumni-markdown-editor-toolbar"}>
                <button type="button" disabled={disabled} title={t('students-life-pages.alumni-markdown-editor.heading')} onClick={() => prefixLines('## ', t('students-life-pages.alumni-markdown-editor.heading-sample'))}>
                    <TitleIcon/>
                </button>

                <button type="button" disabled={disabled} title={t('students-life-pages.alumni-markdown-editor.bold')} onClick={() => wrapSelection('**', '**', t('students-life-pages.alumni-markdown-editor.bold-sample'))}>
                    <FormatBoldIcon/>
                </button>

                <button type="button" disabled={disabled} title={t('students-life-pages.alumni-markdown-editor.italic')} onClick={() => wrapSelection('*', '*', t('students-life-pages.alumni-markdown-editor.italic-sample'))}>
                    <FormatItalicIcon/>
                </button>

                <button type="button" disabled={disabled} title={t('students-life-pages.alumni-markdown-editor.link')} onClick={handleInsertLink}>

                    <LinkOutlined/>
                </button>

                <button type="button" disabled={disabled} title={t('students-life-pages.alumni-markdown-editor.bulleted-list')} onClick={() => prefixLines('- ', t('students-life-pages.alumni-markdown-editor.list-item-sample'))}>
                    <FormatListBulletedIcon/>
                </button>

                <button type="button" disabled={disabled} title={t('students-life-pages.alumni-markdown-editor.quote')} onClick={() => prefixLines('> ', t('students-life-pages.alumni-markdown-editor.quote'))}>
                    <FormatQuoteIcon/>
                </button>

                <span className={"alumni-markdown-editor-toolbar-separator"}/>

                <select
                    value={imageAlignment}
                    disabled={disabled || isUploadingImage}
                    onChange={(e) => setImageAlignment(e.target.value)}
                    aria-label={t('students-life-pages.alumni-markdown-editor.image-position')}
                    className={"select-form-field"}
                >
                    {IMAGE_ALIGNMENT_VALUES.map(choiceValue => (
                        <option key={choiceValue} value={choiceValue}>{t(`students-life-pages.alumni-markdown-editor.alignment-${choiceValue}`)}</option>
                    ))}
                </select>

                <button type="button" disabled={disabled || isUploadingImage} title={t('students-life-pages.alumni-markdown-editor.add-a-picture')} onClick={handleImageButtonClick}>
                    <AddPhotoAlternateIcon/>
                </button>

                {isCameraAvailable() && (
                    <button type="button" disabled={disabled || isUploadingImage} title={t('students-life-pages.alumni-markdown-editor.take-a-photo')} onClick={handleTakePhotoClick}>
                        <PhotoCameraIcon/>
                    </button>
                )}

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
                    title={t('students-life-pages.alumni-markdown-editor.preview')}
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
                    placeholder={placeholder || t('students-life-pages.alumni-markdown-editor.editor-placeholder')}
                    onChange={(e) => onChange(e.target.value)}
                    dir="auto"
                />

                {showPreview && (
                    <div className={"alumni-markdown-editor-preview"}>
                        {value.trim() !== '' ? (
                            <MarkdownContent content={value}/>
                        ) : (
                            <p className={"alumni-markdown-editor-preview-empty"}>
                                {t('students-life-pages.alumni-markdown-editor.preview-empty')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <p className={"alumni-markdown-editor-hint"}>
                {t('students-life-pages.alumni-markdown-editor.hint')}
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
