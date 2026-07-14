import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './routers/MainServerRouter.jsx';
import i18n from './i18n/i18n-server.jsx';

const localeFiles = import.meta.glob('../assets/locales/*/*.json', { eager: true });

for (const path in localeFiles) {
    const match = path.match(/locales\/([^/]+)\/([^/]+)\.json$/);
    if (match) {
        const lang = match[1];
        const ns = match[2];
        const translationData = localeFiles[path].default || localeFiles[path];
        i18n.addResourceBundle(lang, ns, translationData, true, true);
    }
}


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