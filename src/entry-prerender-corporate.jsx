import App from './routers/CorporateServerRouter.jsx';
import { createRender } from './entry-prerender-shared.jsx';

export const render = createRender(App);
