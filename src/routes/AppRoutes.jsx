import { Route, Routes, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function AppRoutes({ routes, pages, ctx = {} }) {
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
};

export default AppRoutes;