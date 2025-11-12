import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Spinner from '../../modules/Spinner';
import '../../styles/FileViewer.css';

function FileViewer() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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

    const handleGoBack = () => {
        navigate(-1);
    };

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <div className="file-viewer-container">
            <div className="file-viewer-header">
                <h1>{error ? 'Error' : filename}</h1>
                <div className="file-viewer-actions">
                    <button onClick={handleGoBack} className="file-viewer-button secondary">Go Back</button>
                    {!error && fileBlobUrl && (
                        <a href={fileBlobUrl} download={filename} className="file-viewer-button primary">
                            Download File
                        </a>
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