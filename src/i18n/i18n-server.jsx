import i18n from 'i18next';
import { i18nConfig } from './i18n-shared';
import Backend from 'i18next-fs-backend';
import { initReactI18next } from 'react-i18next';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const i18nInstance = i18n.use(initReactI18next);


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootPath = join(__dirname, '../../');


i18nInstance
    .use(Backend)
    .init({
        ...i18nConfig,
        backend: {
            loadPath: join(rootPath, 'assets/locales/{{lng}}/{{ns}}.json')
        },
        react: {
            useSuspense: false
        }
});

export default i18n;