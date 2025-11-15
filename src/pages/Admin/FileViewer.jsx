import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Spinner from '../../modules/Spinner';
import '../../styles/FileViewer.css';
import { serveJobApplicationFile } from "../../services/Utils.jsx";


function FileViewer() {
    const [searchParams] = useSearchParams();


    const [fileBlobUrl, setFileBlobUrl] = useState(null);
    const [filename, setFilename] = useState('file');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [canEmbed, setCanEmbed] = useState(false);
    const [mimeType, setMimeType] = useState('');

    useEffect(() => {

        try {
            setIsLoading(true);
            serveJobApplicationFile(searchParams, setIsLoading, setError, setCanEmbed, setMimeType, setFilename, setFileBlobUrl);
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }

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
            <div className={"standard-padding-container"}>
                <div className="file-viewer-body">

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