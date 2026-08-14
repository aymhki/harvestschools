import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Spinner from '../../modules/Spinner.jsx'

let activeCount = 0
const listeners = new Set()

const notify = () => {
    listeners.forEach((listener) => listener())
}

const subscribe = (listener) => {
    listeners.add(listener)

    return () => {
        listeners.delete(listener)
    }
}

const getSnapshot = () => activeCount > 0

const getServerSnapshot = () => false

const acquire = () => {
    activeCount += 1
    notify()
}

const release = () => {
    activeCount = activeCount > 0 ? activeCount - 1 : 0
    notify()
}

const useLoadingWhile = (isLoading) => {
    const isHoldingRef = useRef(false)

    useEffect(() => {
        if (isLoading && !isHoldingRef.current) {
            isHoldingRef.current = true
            acquire()
        } else if (!isLoading && isHoldingRef.current) {
            isHoldingRef.current = false
            release()
        }
    }, [isLoading])

    useEffect(() => {
        return () => {
            if (isHoldingRef.current) {
                isHoldingRef.current = false
                release()
            }
        }
    }, [])
}

const useLoading = (initialValue = false) => {
    const [isLoading, setIsLoading] = useState(initialValue)

    useLoadingWhile(isLoading)

    return [isLoading, setIsLoading]
}

const useIsAnythingLoading = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

function GlobalLoadingFallback() {
    useLoadingWhile(true)

    return null
}

function GlobalSpinner() {
    const isAnythingLoading = useIsAnythingLoading()

    if (!isAnythingLoading) {
        return null
    }

    return <Spinner/>
}

export { useLoading, useLoadingWhile, useIsAnythingLoading, GlobalSpinner, GlobalLoadingFallback }
