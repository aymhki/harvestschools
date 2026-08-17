import { setModalOpen } from './AppChromeService.jsx'

const SCROLL_LOCK_CLASS = 'lock-scroll'

const MINIMUM_VISIBLE_OPACITY = 0.01

const MODAL_OVERLAY_SELECTORS = [
    '[data-modal-overlay]',
    '.general-large-admin-action-modal',
    '.general-small-admin-action-modal',
    '.alumni-modal',
    '.calendar-actions-modal',
    '.widget-actions-modal',
    '.form-select-date-modal',
    '.sidebar-overlay',
    '.table-module-filter-popup-container',
    '.table-module-accordion',
    '.lightbox',
]

const SCROLL_LOCK_EXEMPT_SELECTORS = [
    '[data-scroll-lock="off"]',
]

let observer = null

let scheduledFrame = 0

let lockedScrollOffset = 0

let isLocked = false

let lockGeneration = 0


const isOverlayExempt = (element) => SCROLL_LOCK_EXEMPT_SELECTORS.some((selector) => element.closest(selector) !== null)


const isEffectivelyVisible = (element) => {
    let current = element

    let isVisible = true

    while (current !== null && isVisible) {
        const styles = window.getComputedStyle(current)

        isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && Number(styles.opacity) > MINIMUM_VISIBLE_OPACITY
        current = current.parentElement
    }

    return isVisible
}


const isOverlayOpen = (element) => {
    let isOpen = false

    if (!isOverlayExempt(element) && isEffectivelyVisible(element)) {
        const box = element.getBoundingClientRect()
        isOpen = box.width > 0 && box.height > 0
    }

    return isOpen
}


const hasOpenOverlay = () => {
    let isOpen = false

    if (MODAL_OVERLAY_SELECTORS.length > 0) {
        const overlays = document.querySelectorAll(MODAL_OVERLAY_SELECTORS.join(','))

        isOpen = Array.from(overlays).some(isOverlayOpen)
    }

    return isOpen
}


const lockPageScroll = () => {
    if (!isLocked) {
        lockedScrollOffset = window.scrollY || document.documentElement.scrollTop || 0

        document.body.style.top = `-${lockedScrollOffset}px`
        document.documentElement.classList.add(SCROLL_LOCK_CLASS)
        document.body.classList.add(SCROLL_LOCK_CLASS)

        isLocked = true

        lockGeneration += 1

        setModalOpen(true)

        if (window.AndroidNativeBridge) {
            window.AndroidNativeBridge.setSwipeRefreshEnabled(false)
        }
    }
}


const unlockPageScroll = () => {
    if (isLocked) {
        document.documentElement.classList.remove(SCROLL_LOCK_CLASS)
        document.body.classList.remove(SCROLL_LOCK_CLASS)
        document.body.style.top = ''

        window.scrollTo(0, lockedScrollOffset)

        isLocked = false

        lockGeneration += 1

        const unlockGeneration = lockGeneration

        window.requestAnimationFrame(() => {
            if (unlockGeneration === lockGeneration) {
                setModalOpen(false)

                if (window.AndroidNativeBridge) {
                    window.AndroidNativeBridge.setSwipeRefreshEnabled(true)
                }
            }
        })
    }
}


const syncScrollLock = () => {
    if (hasOpenOverlay()) {
        lockPageScroll()
    } else {
        unlockPageScroll()
    }
}


const scheduleScrollLockSync = () => {
    if (!scheduledFrame) {
        scheduledFrame = window.requestAnimationFrame(() => {
            scheduledFrame = 0

            syncScrollLock()
        })
    }
}


const addModalOverlaySelector = (selector) => {
    if (selector && !MODAL_OVERLAY_SELECTORS.includes(selector)) {
        MODAL_OVERLAY_SELECTORS.push(selector)

        scheduleScrollLockSync()
    }
}


const addScrollLockExemptSelector = (selector) => {
    if (selector && !SCROLL_LOCK_EXEMPT_SELECTORS.includes(selector)) {
        SCROLL_LOCK_EXEMPT_SELECTORS.push(selector)

        scheduleScrollLockSync()
    }
}


const stopModalScrollLockWatcher = () => {
    if (observer) {
        observer.disconnect()

        observer = null
    }

    if (scheduledFrame) {
        window.cancelAnimationFrame(scheduledFrame)

        scheduledFrame = 0
    }

    unlockPageScroll()
}


const startModalScrollLockWatcher = () => {
    if (typeof document !== 'undefined' && !observer) {
        observer = new MutationObserver(scheduleScrollLockSync)

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden'],
        })

        syncScrollLock()
    }

    return stopModalScrollLockWatcher
}


export {
    SCROLL_LOCK_CLASS,
    MODAL_OVERLAY_SELECTORS,
    SCROLL_LOCK_EXEMPT_SELECTORS,
    addModalOverlaySelector,
    addScrollLockExemptSelector,
    startModalScrollLockWatcher,
    stopModalScrollLockWatcher,
}
