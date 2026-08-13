import { Route, Routes, Navigate } from 'react-router';
import PropTypes from 'prop-types';
import RouteRedirect from './RouteRedirect.jsx';
import { ROUTER_IDS, redirectsForRouter } from './redirects.js';

function AppRoutes({ routes, pages, ctx = {}, router = null }) {
    const declaredRedirects = redirectsForRouter(router);
    const routePaths = new Set(routes.map((route) => route.path));

    return (
        <Routes>
            {routes.map((route) => {
                if (route.redirect) {
                    return (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<Navigate to={route.redirect} replace />}
                        />
                    );
                }

                const Component = pages[route.page];

                if (!Component) {
                    if (import.meta.env?.DEV) {
                        console.warn(`AppRoutes: no page found for "${route.page}" (path ${route.path}). Check the glob pattern in this router.`);
                    }
                    return null;
                }

                const props = route.props ? route.props(ctx) : {};

                return (
                    <Route key={route.path} path={route.path} element={<Component {...props} />} />
                );
            })}

            {declaredRedirects.map((redirect) => {
                if (routePaths.has(redirect.from)) {
                    if (import.meta.env?.DEV) {
                        console.warn(`AppRoutes: redirect "${redirect.from}" collides with a real route in this router and was skipped.`);
                    }

                    return null;
                }

                return (
                    <Route
                        key={`redirect:${redirect.from}`}
                        path={redirect.from}
                        element={<RouteRedirect redirect={redirect} />}
                    />
                );
            })}
        </Routes>
    );
}

const routeShape = PropTypes.shape({
    path: PropTypes.string.isRequired,
    page: PropTypes.string,
    redirect: PropTypes.string,
    props: PropTypes.func,
    prerender: PropTypes.bool,
    chromeExcluded: PropTypes.bool,
    section: PropTypes.oneOf(['admin']),
    adminEntry: PropTypes.bool,
});

AppRoutes.propTypes = {
    routes: PropTypes.arrayOf(routeShape).isRequired,
    pages: PropTypes.objectOf(PropTypes.elementType).isRequired,
    ctx: PropTypes.object,
    router: PropTypes.oneOf(Object.values(ROUTER_IDS)),
};

export default AppRoutes;
