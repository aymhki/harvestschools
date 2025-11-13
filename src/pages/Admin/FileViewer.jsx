import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Spinner from '../../modules/Spinner';
import '../../styles/FileViewer.css';

const EMBEDDABLE_EXTENSIONS = ['pdf', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];

function FileViewer() {
    const [searchParams] = useSearchParams();


    const getMimeType = (extension) => {
        switch (extension) {
            case 'pdf':
                return 'application/pdf';
            case 'txt':
                return 'text/plain';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'svg':
                return 'image/svg+xml';
            case 'webp':
                return 'image/webp';
            default:
                return 'application/octet-stream';
        }
    };


    const [fileBlobUrl, setFileBlobUrl] = useState(null);
    const [filename, setFilename] = useState('file');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canEmbed, setCanEmbed] = useState(false);
    const [mimeType, setMimeType] = useState('');

    useEffect(() => {
        const fetchFile = async () => {
            const filePath = searchParams.get('file');

            if (!filePath) {
                setError('No file was specified.');
                setIsLoading(false);
                return;
            }

            try {
                const decodedFilename = decodeURIComponent(filePath.split('/').pop());
                setFilename(decodedFilename);

                const extension = decodedFilename.split('.').pop().toLowerCase();
                setCanEmbed(EMBEDDABLE_EXTENSIONS.includes(extension));
                setMimeType(getMimeType(extension));
            } catch (e) {
                setFilename('download');
                setCanEmbed(false);
            }

            try {
                const response = await fetch(`/scripts/serveFile.php?file=${filePath}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `File not found or permission denied (Status: ${response.status})`);
                }

                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                setFileBlobUrl(blobUrl);

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFile();

        return () => {
            if (fileBlobUrl) {
                URL.revokeObjectURL(fileBlobUrl);
            }
        };
    }, [searchParams]);

    if (isLoading) {
        return <Spinner />;
    }

    const downloadFile = () => {
        const link = document.createElement('a');
        link.href = fileBlobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="file-viewer-page">
            <div className={"extreme-padding-container"}>
                <div className="file-viewer-body">
                    <div className="file-viewer-header">
                        <div className="file-viewer-actions-wrapper">
                            {!error && fileBlobUrl && (
                                <button
                                    onClick={downloadFile}
                                    className="file-viewer-button primary"
                                >
                                    Download File
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="file-viewer-embed-container">
                        {error ? (
                            <div className="error-message">{error}</div>
                        ) : (
                            fileBlobUrl && (
                                <>
                                    {canEmbed ? (
                                        <embed
                                            src={fileBlobUrl}
                                            type={mimeType}
                                            className="file-embed-viewer"
                                        />
                                    ) : (
                                        <div className="download-message">
                                            <p>This file cannot be previewed.</p>
                                            <p>Please download it to view.</p>
                                        </div>
                                    )}
                                </>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FileViewer;