import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prerenderTargets } from './src/routes/routes.js';
import { prerenderFetchPlan, routeDataKeys } from './src/routes/prerenderData.js';

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

const PRERENDER_API_BASE = process.env.PRERENDER_API_BASE || 'https://www.harvestschools.com';
const PRERENDER_FETCH_TIMEOUT_MS = 15000;

async function fetchSnapshotEntry(key, plan) {
    const params = new URLSearchParams(plan.params);
    const url = `${PRERENDER_API_BASE}${plan.path}?${params.toString()}`;

    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(PRERENDER_FETCH_TIMEOUT_MS) });

        if (!response.ok) {
            throw new Error(`request failed with status ${response.status}`);
        }

        const body = await response.json();

        if (!body || body.success !== true || !body.data) {
            throw new Error(body && body.message ? body.message : 'the response was not usable');
        }

        return body.data;
    } catch (error) {
        console.warn(`Prerender data warning: could not fetch "${key}" (${url}): ${error.message}. Falling back to client-side fetching for this data.`);
        return null;
    }
}

async function fetchSnapshot(routes) {
    const neededKeys = new Set(routes.flatMap((route) => routeDataKeys[route] || []));
    const snapshot = {};

    await Promise.all([...neededKeys].map(async (key) => {
        const plan = prerenderFetchPlan[key];

        if (!plan) {
            console.warn(`Prerender data warning: no fetch plan found for key "${key}".`);
            return;
        }

        const data = await fetchSnapshotEntry(key, plan);

        if (data !== null) {
            snapshot[key] = data;
        }
    }));

    return snapshot;
}

function buildSnapshotScript(routeData) {
    const serialised = JSON.stringify(routeData).replace(/</g, '\\u003c');
    return `<script>window.__PRERENDER_DATA__ = ${serialised};</script>`;
}

console.log(`Starting pre-rendering (${targetName})...`);

const snapshot = await fetchSnapshot(routesToPrerender);

if (Object.keys(snapshot).length > 0) {
    console.log(`Fetched prerender data snapshot for ${Object.keys(snapshot).length} key(s).`);
}

const originalIndexPath = toAbsolute(`${distDir}/index.html`);
const tempIndexPath = toAbsolute(`${distDir}/index.original.html`);
if (fs.existsSync(originalIndexPath)) {
    fs.renameSync(originalIndexPath, tempIndexPath);
}

for (const url of routesToPrerender) {
    const routeData = {};

    for (const key of routeDataKeys[url] || []) {
        if (key in snapshot) {
            routeData[key] = snapshot[key];
        }
    }

    const hasRouteData = Object.keys(routeData).length > 0;
    const { appHtml, head } = render(url, hasRouteData ? routeData : null);

    if (!head.includes('<title')) {
        console.error(`Prerender error: no <title> tag was extracted for route "${url}". React metadata hoisting may have changed.`);
        process.exit(1);
    }

    const currentTemplate = fs.readFileSync(tempIndexPath, 'utf-8');

    let finalHtml = currentTemplate
        .replace(`<!--ssr-outlet-->`, appHtml)
        .replace(`<!--helmet-tags-->`, head);

    if (hasRouteData) {
        finalHtml = finalHtml.replace('</body>', `${buildSnapshotScript(routeData)}</body>`);
    }

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
