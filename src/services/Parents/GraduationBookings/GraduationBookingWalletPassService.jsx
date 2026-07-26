import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { endpoints, buildAuthHeaders, isMobileApp } from '../../General/GeneralUtils.jsx'
import { validateGraduationBookingSessionLocally } from './MainParentsGraduationBookingServices.jsx'


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


const openWalletPass = async (offer) => {
    const url = getWalletPassUrlFor(offer)

    let opened = false

    if (url) {
        await Browser.open({ url, presentationStyle: 'popover' })

        Haptics.notification({ type: NotificationType.Success }).catch(() => null)

        opened = true
    }

    return opened
}


export {
    fetchWalletPassOffer,
    isWalletSupported,
    openWalletPass,
}
