import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prerenderTargets } from './src/routes/routes.js';

const targetName = process.argv[2];
const target = prerenderTargets[targetName];

if (!target) {
    console.error(`Unknown prerender target "${targetName}". Valid targets: ${Object.keys(prerenderTargets).join(', ')}`);
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

const { distDir, entry, domain, routes: routesToPrerender, sitemapExclude } = target;

const { render } = await import(entry);

console.log(`Starting pre-rendering (${targetName})...`);

const originalIndexPath = toAbsolute(`${distDir}/index.html`);
const tempIndexPath = toAbsolute(`${distDir}/index.original.html`);
if (fs.existsSync(originalIndexPath)) {
    fs.renameSync(originalIndexPath, tempIndexPath);
}

for (const url of routesToPrerender) {
    const { appHtml, helmet } = render(url);

    const currentTemplate = fs.readFileSync(tempIndexPath, 'utf-8');

    const finalHtml = currentTemplate
        .replace(`<!--ssr-outlet-->`, appHtml)
        .replace(`<!--helmet-tags-->`, helmet);

    const dirPath = `${distDir}${url}`;
    const absoluteDirPath = toAbsolute(dirPath);

    if (!fs.existsSync(absoluteDirPath)) {
        fs.mkdirSync(absoluteDirPath, { recursive: true });
    }

    const filePath = path.join(absoluteDirPath, 'index.html');
    fs.writeFileSync(filePath, finalHtml);
    console.log('pre-rendered:', filePath);
}

const prerenderedRoot = toAbsolute(`${distDir}/index.html`);
const homeHtmlPath = toAbsolute(`${distDir}/home.html`);

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
    const urls = routesToPrerender
        .filter(route => !sitemapExclude.includes(route))
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

    const sitemapPath = toAbsolute(`${distDir}/sitemap.xml`);
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log('sitemap.xml generated at:', sitemapPath);
}

generateSitemap();
