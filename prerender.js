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

for (const url of routesToPrerender) {

    const { appHtml, helmet } = render(url);

    const finalHtml = template
        .replace(`<!--ssr-outlet-->`, appHtml)
        .replace(`<!--helmet-tags-->`, helmet);

    const filePath = `dist/static${url === '/' ? '/index' : url}.html`;
    const absolutePath = toAbsolute(filePath);

    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, finalHtml);

    console.log('pre-rendered:', filePath);
}

console.log('Pre-rendering complete.');