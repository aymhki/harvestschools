const ROUTER_IDS = {
    main: 'main',
    admin: 'admin',
    corporate: 'corporate',
    mobile: 'mobile',
}

const redirects = [
    {
        from: '/vacancies',
        to: '/careers',
        routers: [ROUTER_IDS.main, ROUTER_IDS.mobile],
    },
]


const appliesToRouter = (redirect, routerId) => {
    if (!routerId) {
        return false
    }

    if (Array.isArray(redirect.routers) && redirect.routers.length > 0) {
        return redirect.routers.includes(routerId)
    }

    if (Array.isArray(redirect.excludeRouters) && redirect.excludeRouters.includes(routerId)) {
        return false
    }

    return true
}


const redirectsForRouter = (routerId) => redirects.filter((redirect) => appliesToRouter(redirect, routerId))


const resolveRedirectTarget = (redirect, { params = {}, location = null } = {}) => {
    const target = typeof redirect.to === 'function' ? redirect.to({ params, location }) : redirect.to

    if (typeof target !== 'string' || target === '') {
        return null
    }

    const search = location && location.search ? location.search : ''

    if (redirect.keepSearch === false || search === '') {
        return target
    }

    return target + (target.includes('?') ? '&' + search.replace(/^\?/, '') : search)
}


const isExternalRedirect = (redirect) => redirect.external === true


const redirectedPathsForRouter = (routerId) => redirectsForRouter(routerId).map((redirect) => redirect.from)

export {
    ROUTER_IDS,
    appliesToRouter,
    isExternalRedirect,
    redirects,
    redirectedPathsForRouter,
    redirectsForRouter,
    resolveRedirectTarget,
}
