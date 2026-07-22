import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'


const OfflineContext = createContext({
    isOffline: false,
    lastChangedAt: null,
    refreshNetworkStatus: () => Promise.resolve(true),
})


function OfflineProvider({ children, initialOffline = false }) {
    const [isOffline, setIsOffline] = useState(initialOffline)
    const [lastChangedAt, setLastChangedAt] = useState(null)
    const listenerHandleRef = useRef(null)

    const refreshNetworkStatus = useMemo(() => async () => {
        try {
            const status = await Network.getStatus()

            setIsOffline(!status.connected)

            setLastChangedAt(Date.now())

            return status.connected
        } catch (networkError) {
            console.warn('[offline-context] Could not read the network status', networkError)

            return true
        }
    }, [])

    useEffect(() => {
        setIsOffline(initialOffline)
    }, [initialOffline])

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            const handleOnline = () => {
                setIsOffline(false)
                setLastChangedAt(Date.now())
            }

            const handleOffline = () => {
                setIsOffline(true)
                setLastChangedAt(Date.now())
            }

            window.addEventListener('online', handleOnline)
            window.addEventListener('offline', handleOffline)

            return () => {
                window.removeEventListener('online', handleOnline)
                window.removeEventListener('offline', handleOffline)
            }
        }

        let isMounted = true

        refreshNetworkStatus()

        Network.addListener('networkStatusChange', (status) => {
            setIsOffline(!status.connected)
            setLastChangedAt(Date.now())
        }).then((handle) => {
            if (isMounted) {
                listenerHandleRef.current = handle
            } else {
                handle.remove()
            }
        })

        return () => {
            isMounted = false

            if (listenerHandleRef.current) {
                listenerHandleRef.current.remove()
                listenerHandleRef.current = null
            }
        }
    }, [refreshNetworkStatus])

    const contextValue = useMemo(
        () => ({ isOffline, lastChangedAt, refreshNetworkStatus }),
        [isOffline, lastChangedAt, refreshNetworkStatus]
    )

    return <OfflineContext.Provider value={contextValue}>{children}</OfflineContext.Provider>
}


OfflineProvider.propTypes = {
    children: PropTypes.node,
    initialOffline: PropTypes.bool,
}


const useOffline = () => useContext(OfflineContext)


export { OfflineProvider, useOffline, OfflineContext }
