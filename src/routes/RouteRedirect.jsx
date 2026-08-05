import { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isExternalRedirect, resolveRedirectTarget } from './redirects.js';

function RouteRedirect({ redirect }) {
    const location = useLocation();
    const params = useParams();

    const target = resolveRedirectTarget(redirect, { params, location });
    const external = isExternalRedirect(redirect);

    useEffect(() => {
        if (!external || !target) {
            return;
        }

        if (redirect.replace === false) {
            window.location.assign(target);
        } else {
            window.location.replace(target);
        }
    }, [external, target, redirect.replace]);

    if (!target) {
        if (import.meta.env?.DEV) {
            console.warn(`RouteRedirect: "${redirect.from}" resolved to an empty target and was skipped.`);
        }

        return null;
    }

    if (external) {
        return null;
    }

    return <Navigate to={target} replace={redirect.replace !== false} />;
}

RouteRedirect.propTypes = {
    redirect: PropTypes.shape({
        from: PropTypes.string.isRequired,
        to: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
        external: PropTypes.bool,
        keepSearch: PropTypes.bool,
        replace: PropTypes.bool,
    }).isRequired,
};

export default RouteRedirect;
