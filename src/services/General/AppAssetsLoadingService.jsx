import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLoadingWhile } from './GlobalLoadingService.jsx'

const MAX_WAIT_MS = 8000

const waitForFonts = () => {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.ready) {
        return Promise.resolve()
    }

    return document.fonts.ready
}

const useAppAssetsLoading = () => {
    const { i18n } = useTranslation()
    const [areAssetsReady, setAreAssetsReady] = useState(false)

    useEffect(() => {
        let isActive = true
        let safetyTimeout = null

        const markReady = () => {
            if (isActive) {
                setAreAssetsReady(true)
            }
        }

        const startSafetyTimeout = () => {
            clearTimeout(safetyTimeout)
            safetyTimeout = setTimeout(markReady, MAX_WAIT_MS)
        }

        const settle = () => {
            if (!isActive) {
                return
            }

            requestAnimationFrame(() => {
                if (!isActive) {
                    return
                }

                if (typeof document === 'undefined' || !document.fonts || document.fonts.status === 'loaded') {
                    clearTimeout(safetyTimeout)
                    markReady()
                    return
                }

                setAreAssetsReady(false)
                startSafetyTimeout()

                waitForFonts().then(() => {
                    clearTimeout(safetyTimeout)
                    markReady()
                })
            })
        }

        startSafetyTimeout()

        if (i18n.isInitialized) {
            settle()
        }

        i18n.on('initialized', settle)
        i18n.on('languageChanged', settle)

        return () => {
            isActive = false
            clearTimeout(safetyTimeout)
            i18n.off('initialized', settle)
            i18n.off('languageChanged', settle)
        }
    }, [i18n])

    useLoadingWhile(!areAssetsReady)
}

function AppAssetsLoadingGate() {
    useAppAssetsLoading()

    return null
}

export { useAppAssetsLoading, AppAssetsLoadingGate }
