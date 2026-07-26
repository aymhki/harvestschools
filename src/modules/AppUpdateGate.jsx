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

function AppUpdateGate({ children }) {
    const navigate = useNavigate()

    const [phase, setPhase] = useState('checking')
    const [progress, setProgress] = useState(0)
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

    const runPrefetch = useCallback(async ({ behindSplash }) => {
        if (!Capacitor.isNativePlatform()) {
            return
        }

        try {
            const bundleVersion = await getCurrentBundleVersion()

            if (behindSplash) {
                setPhase('installing')
                setProgress(0)
            }

            await runOfflinePrefetch({
                bundleVersion,
                onProgress: ({ percent }) => {
                    if (behindSplash) {
                        setProgress(percent)
                    }
                },
            })
        } catch (prefetchError) {
            console.warn('Offline prefetch failed', prefetchError)
        }
    }, [])

    const runCheck = useCallback(({ silent = false } = {}) => {
        if (!silent) {
            setPhase('checking')
            setProgress(0)
        }

        runMobileAppUpdateCheck({
            onProgress: (percent) => {
                if (!silent) {
                    setPhase('downloading')
                }

                setProgress(percent)
            },
        }).then(async (result) => {
            const status = result ? result.status : 'skipped'

            /* A downloaded bundle reloads the web view straight after this, so
             * the splash stays up rather than flashing the app in between. */
            if (status === 'ok' && result.updated) {
                setIsOffline(false)

                return
            }

            if (status === 'offline') {
                setIsOffline(true)
                await restoreSavedPathIfNeeded()
                setPhase('ready')

                return
            }

            setIsOffline(false)

            await restoreSavedPathIfNeeded()

            await runPrefetch({ behindSplash: !silent })

            setPhase('ready')
        }).catch((checkError) => {
            console.warn('Update check threw unexpectedly', checkError)
            setPhase('ready')
        })
    }, [restoreSavedPathIfNeeded, runPrefetch])

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

        runCheck()
    }, [runCheck])

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
                runPrefetch({ behindSplash: false })
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

    if (phase !== 'ready') {
        return <AppSplash showProgress={SHOW_DOWNLOAD_PROGRESS_BAR} progress={progress} />
    }

    return (
        <OfflineProvider initialOffline={isOffline}>
            {children}
            <OfflineBanner onRetry={() => runCheck({ silent: true })} />
        </OfflineProvider>
    )
}


AppUpdateGate.propTypes = {
    children: PropTypes.node,
}


export default AppUpdateGate
