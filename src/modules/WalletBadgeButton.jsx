import { useState } from 'react'
import PropTypes from 'prop-types'
import { servePublicAsset } from '../services/General/GeneralServices.jsx'
import '../styles/WalletBadgeButton.css'


const BADGE_ASSET_PATHS = {
    apple: {
        en: '/images/Wallet/add-to-apple-wallet-en.svg',
        ar: '/images/Wallet/add-to-apple-wallet-ar.svg',
    },
    google: {
        en: '/images/Wallet/add-to-google-wallet-en.svg',
        ar: '/images/Wallet/add-to-google-wallet-ar.svg',
    },
}


function WalletBadgeButton({ wallet, language, label, disabled, onClick }) {
    const [hasBadgeArtwork, setHasBadgeArtwork] = useState(true)

    const badgePath = BADGE_ASSET_PATHS[wallet][language === 'ar' ? 'ar' : 'en']

    return (
        <button
            type="button"
            className={hasBadgeArtwork ? 'wallet-badge-button' : 'wallet-badge-fallback-button'}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
        >
            {hasBadgeArtwork ? (
                <img
                    className={'wallet-badge-artwork'}
                    src={servePublicAsset(badgePath)}
                    alt={label}
                    onError={() => setHasBadgeArtwork(false)}
                />
            ) : label}
        </button>
    )
}


WalletBadgeButton.propTypes = {
    wallet: PropTypes.oneOf(['apple', 'google']).isRequired,
    language: PropTypes.string,
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
}


export default WalletBadgeButton
