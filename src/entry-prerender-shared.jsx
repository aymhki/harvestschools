import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { PrerenderDataContext } from './services/General/PrerenderDataContext.jsx';
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

function splitHoistedMetadata(html) {
    const metadataTagPattern = /^(?:<title[^>]*>[\s\S]*?<\/title>|<meta[^>]*\/?>|<link[^>]*\/?>)/;
    let head = '';
    let rest = html;

    for (;;) {
        const match = rest.match(metadataTagPattern);

        if (!match) {
            break;
        }

        head += match[0];
        rest = rest.slice(match[0].length);
    }

    return [head, rest];
}

export function createRender(App) {
    return function render(url, preloadedData = null) {
        const html = ReactDOMServer.renderToString(
            <PrerenderDataContext.Provider value={preloadedData}>
                <StaticRouter location={url}>
                    <App />
                </StaticRouter>
            </PrerenderDataContext.Provider>
        );

        const [head, appHtml] = splitHoistedMetadata(html);

        return { appHtml, head };
    };
}
