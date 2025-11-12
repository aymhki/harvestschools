import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Spinner from '../../modules/Spinner';
import '../../styles/FileViewer.css';

function FileViewer() {
    const [searchParams] = useSearchParams();

    const [fileBlobUrl, setFileBlobUrl] = useState(null);
    const [filename, setFilename] = useState('file');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFile = async () => {
            const filePath = searchParams.get('file');

            if (!filePath) {
                setError('No file was specified.');
                setIsLoading(false);
                return;
            }

            try {
                setFilename(decodeURIComponent(filePath.split('/').pop()));
            } catch (e) {
                setFilename('download');
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

    return (
        <div className="file-viewer-page">
            <div className="file-viewer-header">
                <div className="file-viewer-actions-wrapper">
                    {!error && fileBlobUrl && (
                        <button
                            ref={fileBlobUrl}
                            className="file-viewer-button primary"
                        >
                            Download File
                        </button>
                    )}
                </div>
            </div>

            <div className="file-viewer-content">
                {error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    fileBlobUrl && (
                        <embed
                            src={fileBlobUrl}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                        />
                    )
                )}
            </div>
        </div>
    );
}

export default FileViewer;