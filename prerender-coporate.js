import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

const template = fs.readFileSync(toAbsolute('dist/corporate/static/index.html'), 'utf-8');
const { render } = await import('./dist/corporate/prerender/entry-prerender-coporate.js');

const routesToPrerender = [
    '/',
    '/home',
    '/not-found',
];

console.log('Starting pre-rendering...');

const originalIndexPath = toAbsolute('dist/corporate/static/index.html');
const tempIndexPath = toAbsolute('dist/corporate/static/index.original.html');
if (fs.existsSync(originalIndexPath)) {
    fs.renameSync(originalIndexPath, tempIndexPath);
}

for (const url of routesToPrerender) {
    const { appHtml, helmet } = render(url);

    const currentTemplate = fs.readFileSync(tempIndexPath, 'utf-8');

    const finalHtml = currentTemplate
        .replace(`<!--ssr-outlet-->`, appHtml)
        .replace(`<!--helmet-tags-->`, helmet);

    const dirPath = `dist/corporate/static${url}`;
    const absoluteDirPath = toAbsolute(dirPath);

    if (!fs.existsSync(absoluteDirPath)) {
        fs.mkdirSync(absoluteDirPath, { recursive: true });
    }

    const filePath = path.join(absoluteDirPath, 'index.html');
    fs.writeFileSync(filePath, finalHtml);
    console.log('pre-rendered:', filePath);
}

const prerenderedRoot = toAbsolute('dist/corporate/static/index.html');
const homeHtmlPath = toAbsolute('dist/corporate/static/home.html');

if (fs.existsSync(prerenderedRoot)) {
    if (routesToPrerender.includes('/home')) {
        fs.unlinkSync(prerenderedRoot);
    } else {
        fs.renameSync(prerenderedRoot, homeHtmlPath);
    }
}

if (fs.existsSync(tempIndexPath)) {
    fs.renameSync(tempIndexPath, originalIndexPath);
}


console.log('Pre-rendering complete.');


function generateSitemap() {
    const domain = 'https://www.alfajralbasem.com';

    const excludedRoutes = [
        '/not-found',
    ];

    const urls = routesToPrerender
        .filter(route => !excludedRoutes.includes(route))
        .map(route => {
            const url = `${domain}${route}`;
            return `
    <url>
        <loc>${url}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>${route === '/' ? '1.0' : '0.8'}</priority>
    </url>`;
        });

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join('')}
</urlset>`;

    const sitemapPath = toAbsolute('dist/corporate/static/sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log('sitemap.xml generated at:', sitemapPath);
}

generateSitemap();