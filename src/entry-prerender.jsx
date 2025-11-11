import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

export function render(url) {
    const helmetContext = {};
    const appHtml = ReactDOMServer.renderToString(
        <HelmetProvider context={helmetContext}>
            <StaticRouter location={url} >
                <App />
            </StaticRouter>
        </HelmetProvider>
    );

    const { helmet } = helmetContext;
    const helmetStrings = [
        helmet.title.toString(),
        helmet.meta.toString(),
        helmet.link.toString(),

    ].join('');

    return { appHtml, helmet: helmetStrings };
}