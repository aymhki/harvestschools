import { Capacitor, registerPlugin } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { endpoints, buildAuthHeaders, isMobileApp } from '../../General/GeneralUtils.jsx'
import { validateGraduationBookingSessionLocally } from './MainParentsGraduationBookingServices.jsx'


const WalletPass = registerPlugin('WalletPass')

const APPLE_WALLET_PLATFORM = 'ios'
const GOOGLE_WALLET_PLATFORM = 'android'


const isWalletSupported = () => isMobileApp()
    && (Capacitor.getPlatform() === APPLE_WALLET_PLATFORM || Capacitor.getPlatform() === GOOGLE_WALLET_PLATFORM)


const getWalletPassUrlFor = (offer) => {
    let url = null

    if (offer && Capacitor.getPlatform() === APPLE_WALLET_PLATFORM) {
        url = offer.applePassUrl || null
    } else if (offer) {
        url = offer.googleWalletUrl || null
    }

    return url
}


const fetchWalletPassOffer = async () => {
    let offer = null

    if (isWalletSupported()) {
        try {
            const sessionId = await validateGraduationBookingSessionLocally()

            if (sessionId) {
                const response = await fetch(endpoints.createGraduationBookingWalletPass, {
                    method: 'POST',
                    headers: await buildAuthHeaders(sessionId),
                })

                const result = response.ok ? await response.json() : null

                if (result && result.success && getWalletPassUrlFor(result)) {
                    offer = { applePassUrl: result.applePassUrl, googleWalletUrl: result.googleWalletUrl }
                }
            }
        } catch (offerError) {
            console.warn('The wallet pass is not available right now', offerError)
        }
    }

    return offer
}


const readBlobAsBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('The pass could not be read'))

    reader.onload = () => {
        const result = String(reader.result || '')

        const separatorIndex = result.indexOf(',')

        resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result)
    }

    reader.readAsDataURL(blob)
})


/* iOS adds the pass in place through the system review sheet, so the pass file
 * is downloaded here and handed to the native layer instead of being opened in
 * a browser. Google Wallet has no equivalent sheet: its save link is a URL. */
const addPassToAppleWallet = async (url) => {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error('The pass could not be downloaded')
    }

    const base64 = await readBlobAsBase64(await response.blob())

    return await WalletPass.addPass({ base64 })
}


const openWalletPass = async (offer) => {
    const url = getWalletPassUrlFor(offer)

    let result = { handled: false, alreadyInWallet: false, openedInWallet: false }

    if (url) {
        if (Capacitor.getPlatform() === APPLE_WALLET_PLATFORM) {
            const passResult = await addPassToAppleWallet(url)

            result = {
                handled: true,
                alreadyInWallet: Boolean(passResult && passResult.alreadyInWallet),
                openedInWallet: Boolean(passResult && passResult.opened),
            }
        } else {
            await Browser.open({ url, presentationStyle: 'popover' })

            result = { handled: true, alreadyInWallet: false, openedInWallet: false }
        }

        Haptics.notification({ type: NotificationType.Success }).catch(() => null)
    }

    return result
}


export {
    fetchWalletPassOffer,
    isWalletSupported,
    openWalletPass,
}
