import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'
import {
    runMobileAppUpdateCheck,
    getLastAttemptTimestamp,
    appUpdateRetryCooldown,
    getAndClearRestorePath,
} from '../services/General/AppUpdaterService.jsx'
import Spinner from './Spinner.jsx'
import '../styles/AppUpdateGate.css'
import PropTypes from "prop-types";

function AppUpdateGate({ children }) {
    const navigate = useNavigate()

    const [phase, setPhase] = useState('checking')
    const [progress, setProgress] = useState(0)
    const [canRetry, setCanRetry] = useState(false)

    const retryTimerRef = useRef(null)
    const offlineListenerRef = useRef(null)

    const armRetryTimer = () => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current)
        }

        const msRemaining = appUpdateRetryCooldown - (Date.now() - getLastAttemptTimestamp())

        if (msRemaining <= 0) {
            setCanRetry(true)
        } else {
            setCanRetry(false)

            retryTimerRef.current = setTimeout(() => {
                setCanRetry(true)
            }, msRemaining)
        }
    }

    const restoreSavedPathIfNeeded = async () => {
        const restorePath = getAndClearRestorePath()

        if (!restorePath) {
            return
        }

        const here = window.location.pathname + window.location.search + window.location.hash

        if (restorePath !== here) {
            navigate(restorePath, { replace: true })
        }
    }

    const runCheck = (force = false) => {
        const lastAttempt = getLastAttemptTimestamp()
        const withinCooldown = lastAttempt > 0 && Date.now() - lastAttempt < appUpdateRetryCooldown

        if (!force && withinCooldown) {
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
            const status = result ? result.status : 'skipped'

            if (status === 'skipped' || status === 'ok') {
                restoreSavedPathIfNeeded()
                setPhase('ready')
                return
            }

            if (status === 'offline') {
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
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (phase !== 'offline') {
            return undefined
        }

        if (!Capacitor.isNativePlatform()) {
            return undefined
        }

        let isMounted = true

        Network.addListener('networkStatusChange', (status) => {
            if (status.connected) {
                runCheck(true)
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
    }, [phase])

    if (phase === 'ready') {
        return children
    }

    if (phase === 'offline') {
        return (
            <div className="app-update-gate">
                <p className="app-update-gate__message" role="status" aria-live="polite">
                    You don&apos;t seem to be connected to the internet. Please check your connection and try again.
                </p>
                <button
                    type="button"
                    className="app-update-gate__button"
                    onClick={() => runCheck(true)}
                >
                    Try Again
                </button>
            </div>
        )
    }

    if (phase === 'error') {
        return (
            <div className="app-update-gate">
                <p className="app-update-gate__message" role="status" aria-live="assertive">
                    Sorry, looks like our servers are down right now :( please try again later
                </p>

                {/*{canRetry && (*/}
                {/*    <button*/}
                {/*        type="button"*/}
                {/*        className="app-update-gate__button"*/}
                {/*        onClick={() => runCheck(true)}*/}
                {/*    >*/}
                {/*        Try Again*/}
                {/*    </button>*/}
                {/*)}*/}

                <button
                    type="button"
                    className="app-update-gate__button"
                    onClick={() => runCheck(true)}
                >
                    Try Again
                </button>

            </div>
        )
    }

    if (phase === 'downloading') {
        return (
            <div className="app-update-gate">
                <div
                    className="app-update-gate__progress-track"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div
                        className="app-update-gate__progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="app-update-gate">
            <Spinner />
        </div>
    )
}

AppUpdateGate.propTypes = {
    children: PropTypes.node.isRequired,
}

export default AppUpdateGate
