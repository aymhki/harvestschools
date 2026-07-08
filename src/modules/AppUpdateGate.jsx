import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { Network } from '@capacitor/network'
import { runMobileAppUpdateCheck, getLastAttemptTimestamp, appUpdateRetryCooldown, getAndClearRestorePath } from '../services/General/AppUpdaterService.jsx'
import Spinner from './Spinner.jsx'
import PropTypes from "prop-types"
import '../styles/AppUpdateGate.css'


function AppUpdateGate({ children }) {
    const navigate = useNavigate()
    const [phase, setPhase] = useState('checking')
    const [progress, setProgress] = useState(0)
    const [canRetry, setCanRetry] = useState(false)
    const retryTimerRef = useRef(null)
    const offlineListenerRef = useRef(null)

    const armRetryTimer = () => {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
        const msRemaining = appUpdateRetryCooldown - (Date.now() - getLastAttemptTimestamp())
        if (msRemaining <= 0) {
            setCanRetry(true)
        } else {
            setCanRetry(false)
            retryTimerRef.current = setTimeout(() => setCanRetry(true), msRemaining)
        }
    }

    const runCheck = (force = false) => {
        try {
            const lastAttempt = getLastAttemptTimestamp()

            if (!force && lastAttempt > 0 && Date.now() - lastAttempt < appUpdateRetryCooldown) {
                setPhase('error')
                armRetryTimer()
                return
            }

            setPhase('checking')
            setProgress(0)

            runMobileAppUpdateCheck({
                onProgress: (percent) => {
                    setPhase('downloading')
                    setProgress(percent)
                },
            })
            .then((result) => {

                if (!result || result.status === 'skipped' || result.status === 'ok') {

                    const restorePath = getAndClearRestorePath()
                    const here = window.location.pathname + window.location.search + window.location.hash

                    if (restorePath && restorePath !== here) {
                        navigate(restorePath, {replace: true})
                    }

                    setPhase('ready')
                    return

                }

                if (result.status === 'offline') {
                    setPhase('offline')
                    return
                }

                setPhase('error')
                armRetryTimer()

            })

        } catch (error) {
            console.log('Error running app update check:', error)
            setPhase('error')
        }
    }

    useEffect(() => {
        runCheck()

        return () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
        }

    }, [])

    useEffect(() => {
        if (phase !== 'checking' && Capacitor.isNativePlatform()) {
            SplashScreen.hide()
        }
    }, [phase])

    useEffect(() => {
        if (phase !== 'offline' || !Capacitor.isNativePlatform()) return

        Network.addListener('networkStatusChange', (status) => {
            if (status.connected) {
                runCheck(true)
            }
        }).then((handle) => {
            offlineListenerRef.current = handle
        })

        return () => {
            if (offlineListenerRef.current) {
                offlineListenerRef.current.remove()
                offlineListenerRef.current = null
            }
        }

    }, [phase])

    if (phase === 'ready') {
        return children
    }


    if (phase === 'offline') {
        return (
            <div className="app-update-wrapper">
                <p className="app-update-message">You don&apos;t seem to be connected to the internet. Please check your connection and try again.</p>
                <button type="button" className="app-update-button" onClick={() => runCheck(true)}>Try Again</button>
            </div>
        )
    }

    if (phase === 'error') {
        return (
            <div className="app-update-wrapper">
                <p className="app-update-message">Sorry, looks like our servers are down right now. please try again later</p>

                {canRetry && (
                    <button type="button" className="app-update-button" onClick={() => runCheck(true)}>Try Again</button>
                )}
            </div>
        )
    }

    return (
        <div className="app-update-wrapper">
            {phase === 'checking' && <Spinner />}
            {phase === 'downloading' && (
                <div className="app-update-progress-track">
                    <div className="app-update-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    )
}


AppUpdateGate.propTypes = {
    children: PropTypes.node.isRequired,
}

export default AppUpdateGate