import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { Network } from '@capacitor/network'
import { runMobileAppUpdateCheck, getLastAttemptTimestamp, appUpdateRetryCooldown, getAndClearRestorePath } from '../services/General/AppUpdaterService.jsx'
import Spinner from './Spinner.jsx'
import PropTypes from "prop-types";

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
        }).then((result) => {
            if (!result || result.status === 'skipped' || result.status === 'ok') {
                const restorePath = getAndClearRestorePath()
                const here = window.location.pathname + window.location.search + window.location.hash
                if (restorePath && restorePath !== here) {
                    navigate(restorePath, { replace: true })
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
            if (status.connected) runCheck(true)
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
            <div style={styles.wrapper}>
                <p style={styles.message}>You don&apos;t seem to be connected to the internet. Please check your connection and try again.</p>
                <button type="button" style={styles.button} onClick={() => runCheck(true)}>Try Again</button>
            </div>
        )
    }

    if (phase === 'error') {
        return (
            <div style={styles.wrapper}>
                <p style={styles.message}>Sorry, looks like our servers are down right now :( please try again later</p>
                {canRetry && (
                    <button type="button" style={styles.button} onClick={() => runCheck(true)}>Try Again</button>
                )}
            </div>
        )
    }

    return (
        <div style={styles.wrapper}>
            {phase === 'checking' && <Spinner />}
            {phase === 'downloading' && (
                <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
            )}
        </div>
    )
}

const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px', textAlign: 'center' },
    message: { maxWidth: '320px' },
    button: { padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' },
    progressTrack: { width: '200px', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: 'currentColor', transition: 'width 0.2s ease' },
}

AppUpdateGate.propTypes = {
    children: PropTypes.node.isRequired,
}

export default AppUpdateGate