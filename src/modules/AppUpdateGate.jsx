import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Network } from '@capacitor/network'
import {
    runMobileAppUpdateCheck,
    getAndClearRestorePath,
    attachPullToRefreshListener,
    getCurrentBundleVersion,
} from '../services/General/AppUpdaterService.jsx'
import { attachDeepLinkListener, readPathFromDeepLink } from '../services/General/DeepLinkService.jsx'
import { setNavigationBarVisible } from '../services/General/AppChromeService.jsx'
import { OfflineProvider } from '../services/General/OfflineContext.jsx'
import { bootstrapOfflineAssets, runOfflinePrefetch } from '../services/General/OfflinePrefetchService.jsx'
import { getCurrentWeather } from '../services/General/WeatherService.jsx'
import AppSplash from './AppSplash.jsx'
import OfflineBanner from './OfflineBanner.jsx'
import '../styles/AppUpdateGate.css'
import PropTypes from 'prop-types'

const SHOW_DOWNLOAD_PROGRESS_BAR = false

const PROGRESS_BAR_HIDE_DELAY_MS = 1000

const OFFLINE_CONTENT_SAVED_EVENT = 'harvestOfflineContentSaved'

const LAUNCH_UNKNOWN = 'unknown'
const LAUNCH_NORMAL = 'normal'
const LAUNCH_FROM_LINK = 'link'


function AppUpdateGate({ children }) {
    const navigate = useNavigate()

    const [launchKind, setLaunchKind] = useState(Capacitor.isNativePlatform() ? LAUNCH_UNKNOWN : LAUNCH_NORMAL)
    const [isPreparing, setIsPreparing] = useState(Capacitor.isNativePlatform())
    const [progress, setProgress] = useState(0)
    const [showProgressBar, setShowProgressBar] = useState(SHOW_DOWNLOAD_PROGRESS_BAR)
    const [isOffline, setIsOffline] = useState(false)
    const offlineListenerRef = useRef(null)
    const hasBootstrappedRef = useRef(false)
    const hasRunCheckRef = useRef(false)
    const navigateRef = useRef(navigate)
    const hasOpenedDeepLinkRef = useRef(false)

    useEffect(() => {
        navigateRef.current = navigate
    }, [navigate])

    const restoreSavedPathIfNeeded = useCallback(async () => {
        const restorePath = await getAndClearRestorePath()

        if (!restorePath) {
            return
        }

        const here = window.location.pathname + window.location.search + window.location.hash

        if (restorePath !== here && !hasOpenedDeepLinkRef.current) {
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

            window.dispatchEvent(new Event(OFFLINE_CONTENT_SAVED_EVENT))
        } catch (prefetchError) {
            console.warn('Offline prefetch failed', prefetchError)
        }
    }, [])

    const refreshWeather = useCallback(async () => {
        try {
            await getCurrentWeather({ force: true })
        } catch (weatherError) {
            console.warn('The weather could not be refreshed', weatherError)
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
                    await Promise.all([runPrefetch({ reportProgress: !silent }), refreshWeather()])
                }
            }
        } catch (prepareError) {
            console.warn('The app could not finish preparing', prepareError)
        }

        if (!bundleIsAboutToReload) {
            setIsPreparing(false)
        }
    }, [refreshWeather, restoreSavedPathIfNeeded, runPrefetch])


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
        if (launchKind !== LAUNCH_UNKNOWN) {
            return
        }

        CapacitorApp.getLaunchUrl()
            .then((launch) => {
                const path = launch && launch.url ? readPathFromDeepLink(launch.url) : null

                setLaunchKind(path ? LAUNCH_FROM_LINK : LAUNCH_NORMAL)
            })
            .catch(() => setLaunchKind(LAUNCH_NORMAL))
    }, [launchKind])

    useEffect(() => {
        if (launchKind === LAUNCH_UNKNOWN || hasRunCheckRef.current) {
            return
        }

        hasRunCheckRef.current = true

        prepareApp({ silent: launchKind === LAUNCH_FROM_LINK })
    }, [launchKind, prepareApp])

    useEffect(() => {
        setNavigationBarVisible(!isPreparing)
    }, [isPreparing])

    useEffect(() => {
        if (!isOffline || !Capacitor.isNativePlatform()) {
            return undefined
        }

        let isMounted = true

        Network.addListener('networkStatusChange', (status) => {
            if (status.connected) {
                setIsOffline(false)

                prepareApp({ silent: true })
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
    }, [isOffline, prepareApp])

    useEffect(() => {
        return attachPullToRefreshListener()
    }, [])

    useEffect(() => {
        return attachDeepLinkListener((path) => {
            hasOpenedDeepLinkRef.current = true

            navigateRef.current(path)
        })
    }, [])

    if (launchKind === LAUNCH_UNKNOWN) {
        return null
    }

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

export { OFFLINE_CONTENT_SAVED_EVENT }
