import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType, NavigationType } from 'react-router';
import { SCROLL_LOCK_CLASS } from './ScrollLockService.jsx';

const useScrollToTopOnNavigation = () => {
    const { pathname, search, hash } = useLocation();
    const navigationType = useNavigationType();
    const previousLocationRef = useRef({ pathname, search });

    useEffect(() => {
        const previous = previousLocationRef.current;
        previousLocationRef.current = { pathname, search };

        const pathnameChanged = previous.pathname !== pathname;
        const searchChanged = previous.search !== search;

        if (!pathnameChanged && !(searchChanged && navigationType === NavigationType.Push)) {
            return;
        }

        if (navigationType === NavigationType.Pop) {
            return;
        }

        if (hash) {
            return;
        }

        if (document.body.classList.contains(SCROLL_LOCK_CLASS)) {
            return;
        }

        const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }, [pathname, search, hash, navigationType]);
};

export { useScrollToTopOnNavigation };
