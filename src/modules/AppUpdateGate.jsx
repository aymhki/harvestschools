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

    const restoreSavedPathIfNeeded = useCallback(async () => {
        const restorePath = await getAndClearRestorePath()

        if (!restorePath) {
            return
        }

        const here = window.location.pathname + window.location.search + window.location.hash

        if (restorePath !== here) {
            navigate(restorePath, { replace: true })
        }
    }, [navigate])

    const schedulePrefetch = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) {
            return
        }

        try {
            const bundleVersion = await getCurrentBundleVersion()

            runOfflinePrefetch({ bundleVersion }).catch((prefetchError) => {
                console.warn('Offline prefetch failed', prefetchError)
            })
        } catch (prefetchError) {
            console.warn('Could not schedule the offline prefetch', prefetchError)
        }
    }, [])

    const runCheck = useCallback(() => {
        setPhase('checking')
        setProgress(0)

        runMobileAppUpdateCheck({
            onProgress: (percent) => {
                setPhase('downloading')
                setProgress(percent)
            },
        }).then(async (result) => {
            const status = result ? result.status : 'skipped'

            if (status === 'ok' && result.updated) {
                setPhase('ready')
                setIsOffline(false)

                return
            }

            if (status === 'skipped' || status === 'ok') {
                setPhase('ready')
                setIsOffline(false)

                await restoreSavedPathIfNeeded()

                schedulePrefetch()

                return
            }

            if (status === 'offline') {
                setPhase('ready')
                setIsOffline(true)
                await restoreSavedPathIfNeeded()
                return
            }

            setPhase('ready')
            setIsOffline(false)
            await restoreSavedPathIfNeeded()
            schedulePrefetch()
        }).catch((checkError) => {
            console.warn('Update check threw unexpectedly', checkError)
            setPhase('ready')
        })
    }, [restoreSavedPathIfNeeded, schedulePrefetch])

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
                schedulePrefetch()
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
    }, [isOffline, schedulePrefetch])

    useEffect(() => {
        return attachPullToRefreshListener()
    }, [])

    if (phase === 'checking' || phase === 'downloading') {
        return <AppSplash showProgress={SHOW_DOWNLOAD_PROGRESS_BAR} progress={progress} />
    }

    return (
        <OfflineProvider initialOffline={isOffline}>
            {children}

            <OfflineBanner onRetry={runCheck} />
        </OfflineProvider>
    )
}


AppUpdateGate.propTypes = {
    children: PropTypes.node,
}


export default AppUpdateGate
