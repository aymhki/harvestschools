import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLoadingWhile } from './GlobalLoadingService.jsx'

const MAX_WAIT_MS = 8000

const ARABIC_FONT_VARIABLES = ['--arabic-title-font', '--arabic-normal-font', '--arabic-normal-font-bold']
const ENGLISH_FONT_VARIABLES = ['--english-title-font', '--english-normal-font', '--english-normal-font-bold']

const hasFontsApi = () => typeof document !== 'undefined' && Boolean(document.fonts)

const fontSpecsForLanguage = (language) => {
    if (typeof document === 'undefined') {
        return []
    }

    const variables = language === 'ar' ? ARABIC_FONT_VARIABLES : ENGLISH_FONT_VARIABLES
    const rootStyle = getComputedStyle(document.documentElement)

    return variables
        .map((variable) => rootStyle.getPropertyValue(variable).trim())
        .filter(Boolean)
        .map((family) => `1em ${family}`)
}

const areLanguageFontsReady = (language) => {
    if (!hasFontsApi() || typeof document.fonts.check !== 'function') {
        return true
    }

    return fontSpecsForLanguage(language).every((spec) => {
        try {
            return document.fonts.check(spec)
        } catch (error) {
            return true
        }
    })
}

const loadLanguageFonts = (language) => {
    if (!hasFontsApi() || typeof document.fonts.load !== 'function') {
        return Promise.resolve()
    }

    const loads = fontSpecsForLanguage(language).map((spec) => {
        try {
            return document.fonts.load(spec).catch(() => null)
        } catch (error) {
            return Promise.resolve(null)
        }
    })

    return Promise.all(loads)
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

            const language = i18n.resolvedLanguage || i18n.language || 'en'

            if (areLanguageFontsReady(language)) {
                clearTimeout(safetyTimeout)
                markReady()
                return
            }

            setAreAssetsReady(false)
            startSafetyTimeout()

            loadLanguageFonts(language).then(() => {
                clearTimeout(safetyTimeout)
                markReady()
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
