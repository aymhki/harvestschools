import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import MobileAppRouter from '../../src/routers/MobileAppRouter.jsx'
import AppUpdateGate from '../../src/modules/AppUpdateGate.jsx'

import '../../src/styles/index.css'
import '../../src/i18n/i18n-client.jsx'

const handleDynamicImportError = (errorMsg, event) => {
    if (
        errorMsg && (
            errorMsg.includes('Failed to fetch dynamically imported module') ||
            errorMsg.includes('Importing a module script failed') ||
            errorMsg.includes('Loading chunk') ||
            errorMsg.includes('Loading CSS chunk')
        )
    ) {
        console.log('Dynamic import error detected, reloading page...');
        if (event && event.preventDefault) event.preventDefault();

        const currentPath = window.location.pathname + window.location.search;
        if (currentPath && currentPath !== '/') {
            window.location.href = currentPath;
        } else {
            window.location.reload();
        }
    }
};

window.addEventListener('error', (event) => {
    handleDynamicImportError(event.error?.message, event);
});

window.addEventListener('unhandledrejection', (event) => {
    handleDynamicImportError(event.reason?.message, event);
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <BrowserRouter
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <Routes>
                    <Route path="/*" element={<AppUpdateGate><MobileAppRouter /></AppUpdateGate>} />
                </Routes>
            </BrowserRouter>
        </HelmetProvider>
    </React.StrictMode>
)

