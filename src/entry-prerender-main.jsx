import App from './routers/MainServerRouter.jsx';
import { createRender } from './entry-prerender-shared.jsx';

export const render = createRender(App);
