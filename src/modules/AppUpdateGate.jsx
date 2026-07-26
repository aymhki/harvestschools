import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'
import {
    runMobileAppUpdateCheck,
    getAndClearRestorePath,
    attachPullToRefreshListener,
    getCurrentBundleVersion,
} from '../services/General/AppUpdaterService.jsx'
import { OfflineProvider } from '../services/General/OfflineContext.jsx'
import { bootstrapOfflineAssets, runOfflinePrefetch } from '../services/General/OfflinePrefetchService.jsx'
import AppSplash from './AppSplash.jsx'
import OfflineBanner from './OfflineBanner.jsx'
import '../styles/AppUpdateGate.css'
import PropTypes from 'prop-types'

const SHOW_DOWNLOAD_PROGRESS_BAR = false

const PROGRESS_BAR_HIDE_DELAY_MS = 1000

function AppUpdateGate({ children }) {
    const navigate = useNavigate()

    const [isPreparing, setIsPreparing] = useState(Capacitor.isNativePlatform())
    const [progress, setProgress] = useState(0)
    const [showProgressBar, setShowProgressBar] = useState(SHOW_DOWNLOAD_PROGRESS_BAR)
    const [isOffline, setIsOffline] = useState(false)
    const offlineListenerRef = useRef(null)
    const hasBootstrappedRef = useRef(false)
    const hasRunCheckRef = useRef(false)
    const navigateRef = useRef(navigate)

    useEffect(() => {
        navigateRef.current = navigate
    }, [navigate])

    const restoreSavedPathIfNeeded = useCallback(async () => {
        const restorePath = await getAndClearRestorePath()

        if (!restorePath) {
            return
        }

        const here = window.location.pathname + window.location.search + window.location.hash

        if (restorePath !== here) {
            navigateRef.current(restorePath, { replace: true })
        }
    }, [])

    const runPrefetch = useCallback(async ({ reportProgress }) => {
        if (!Capacitor.isNativePlatform()) {
            return
        }

        try {
            const bundleVersion = await getCurrentBundleVersion()

            await runOfflinePrefetch({
                bundleVersion,
                onProgress: ({ percent }) => {
                    if (reportProgress) {
                        setProgress(percent)
                    }
                },
            })
        } catch (prefetchError) {
            console.warn('Offline prefetch failed', prefetchError)
        }
    }, [])

    const prepareApp = useCallback(async ({ silent = false } = {}) => {
        let bundleIsAboutToReload = false

        if (!silent) {
            setIsPreparing(true)
            setProgress(0)
            setShowProgressBar(SHOW_DOWNLOAD_PROGRESS_BAR)
        }

        try {
            const result = await runMobileAppUpdateCheck({
                onProgress: (percent) => {
                    if (!silent) {
                        setProgress(percent)
                    }
                },
            })

            const status = result ? result.status : 'skipped'


            bundleIsAboutToReload = status === 'ok' && Boolean(result.updated)

            setIsOffline(status === 'offline')

            if (!bundleIsAboutToReload) {
                await restoreSavedPathIfNeeded()

                if (status !== 'offline') {
                    await runPrefetch({ reportProgress: !silent })
                }
            }
        } catch (prepareError) {
            console.warn('The app could not finish preparing', prepareError)
        }

        if (!bundleIsAboutToReload) {
            setIsPreparing(false)
        }
    }, [restoreSavedPathIfNeeded, runPrefetch])

    /* The bar only tracks the bundle download, so once it is full it steps aside
     * and lets the splash carry the rest of the preparing work on its own. */
    useEffect(() => {
        if (!showProgressBar || progress < 100) {
            return undefined
        }

        const hideTimer = setTimeout(() => setShowProgressBar(false), PROGRESS_BAR_HIDE_DELAY_MS)

        return () => clearTimeout(hideTimer)
    }, [showProgressBar, progress])

    useEffect(() => {
        if (hasBootstrappedRef.current) {
            return
        }

        hasBootstrappedRef.current = true
        bootstrapOfflineAssets().catch((bootstrapError) => {
            console.warn('Could not bootstrap the cached offline assets', bootstrapError)
        })
    }, [])

    useEffect(() => {
        if (hasRunCheckRef.current) {
            return
        }

        hasRunCheckRef.current = true

        prepareApp()
    }, [prepareApp])

    useEffect(() => {
        if (!isOffline) {
            return undefined
        }

        if (!Capacitor.isNativePlatform()) {
            return undefined
        }

        let isMounted = true

        Network.addListener('networkStatusChange', (status) => {
            if (status.connected) {
                setIsOffline(false)
                runPrefetch({ reportProgress: false })
            }
        }).then((handle) => {
            if (isMounted) {
                offlineListenerRef.current = handle
            } else {
                handle.remove()
            }
        })

        return () => {
            isMounted = false

            if (offlineListenerRef.current) {
                offlineListenerRef.current.remove()
                offlineListenerRef.current = null
            }
        }
    }, [isOffline, runPrefetch])

    useEffect(() => {
        return attachPullToRefreshListener()
    }, [])

    if (isPreparing) {
        return <AppSplash showProgress={showProgressBar} progress={progress} />
    }

    return (
        <OfflineProvider initialOffline={isOffline}>
            {children}
            <OfflineBanner onRetry={() => prepareApp({ silent: true })} />
        </OfflineProvider>
    )
}


AppUpdateGate.propTypes = {
    children: PropTypes.node,
}


export default AppUpdateGate
