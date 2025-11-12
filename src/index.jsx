import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './i18n'


window.addEventListener('error', (event) => {
    const error = event.error;

    if (
        error && (
            error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('Importing a module script failed') ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('Loading CSS chunk')
        )
    ) {
        console.log('Dynamic import error detected, reloading page...');

        const currentPath = window.location.pathname + window.location.search;

        if (currentPath && currentPath !== '/') {
            window.location.href = currentPath;
        } else {
            window.location.reload();
        }
    }
});

window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    if (
        error && (
            error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('Importing a module script failed') ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('Loading CSS chunk')
        )
    ) {
        console.log('Dynamic import promise rejection detected, reloading page...');

        event.preventDefault();

        const currentPath = window.location.pathname + window.location.search;

        if (currentPath && currentPath !== '/') {
            window.location.href = currentPath;
        } else {
            window.location.reload();
        }
    }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </HelmetProvider>
    </React.StrictMode>
)