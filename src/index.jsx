import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import axios from 'axios';

axios.interceptors.response.use(
    response => response,
    error => {
        const suppressedError = new Error(error.message);
        suppressedError.response = error.response;
        suppressedError.request = error.request;
        suppressedError.config = error.config;
        suppressedError.stack = '';

        return Promise.reject(suppressedError);
    }
);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
