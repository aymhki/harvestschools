import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

const template = fs.readFileSync(toAbsolute('dist/static/index.html'), 'utf-8');
const { render } = await import('./dist/prerender/entry-prerender.js');

const routesToPrerender = [
    '/',
    '/home',
    '/faqs',
    '/minimum-stage-age',
    '/more-info',
    '/vacancies',
    '/admission',
    '/admission/admission-process',
    '/admission/admission-requirements',
    '/admission/inside-egypt-requirements',
    '/admission/outside-egypt-requirements',
    '/admission/outside-egypt-requirements-foreigners',
    '/admission/admission-fees',
    '/academics',
    '/academics/national',
    '/academics/american',
    '/academics/british',
    '/academics/partners',
    '/academics/facilities',
    '/academics/staff',
    '/academics/staff/national-staff',
    '/academics/staff/british-staff',
    '/academics/staff/american-staff',
    '/academics/staff/kindergarten-staff',
    '/students-life',
    '/students-life/students-union',
    '/students-life/activities',
    '/students-life/library',
    '/students-life/library/english-library',
    '/students-life/library/arabic-library',
    '/students-life/library/english-fairy-tales',
    '/students-life/library/english-drama',
    '/students-life/library/english-levels',
    '/students-life/library/english-general',
    '/students-life/library/arabic-information',
    '/students-life/library/arabic-general',
    '/students-life/library/arabic-religion',
    '/students-life/library/arabic-stories',
    '/events',
    '/events/national-calendar',
    '/events/british-calendar',
    '/events/american-calendar',
    '/events/kg-calendar',
    '/gallery',
    '/gallery/photos',
    '/gallery/videos',
    '/gallery/360-tour',
    '/covid-19',
    '/covid-19/covid-19-english-read',
    '/covid-19/covid-19-arabic-read',
    '/covid-19/covid-19-english',
    '/covid-19/covid-19-arabic',
    '/not-found',

];

console.log('Starting pre-rendering...');

const originalIndexPath = toAbsolute('dist/static/index.html');
const tempIndexPath = toAbsolute('dist/static/index.original.html');
if (fs.existsSync(originalIndexPath)) {
    fs.renameSync(originalIndexPath, tempIndexPath);
}

for (const url of routesToPrerender) {
    const { appHtml, helmet } = render(url);

    const currentTemplate = fs.readFileSync(tempIndexPath, 'utf-8');

    const finalHtml = currentTemplate
        .replace(`<!--ssr-outlet-->`, appHtml)
        .replace(`<!--helmet-tags-->`, helmet);

    const dirPath = `dist/static${url}`;
    const absoluteDirPath = toAbsolute(dirPath);

    if (!fs.existsSync(absoluteDirPath)) {
        fs.mkdirSync(absoluteDirPath, { recursive: true });
    }

    const filePath = path.join(absoluteDirPath, 'index.html');
    fs.writeFileSync(filePath, finalHtml);
    console.log('pre-rendered:', filePath);
}

const prerenderedRoot = toAbsolute('dist/static/index.html');
const homeHtmlPath = toAbsolute('dist/static/home.html');

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
    const domain = 'https://www.harvestschools.com';

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

    const sitemapPath = toAbsolute('dist/static/sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log('sitemap.xml generated at:', sitemapPath);
}

generateSitemap();