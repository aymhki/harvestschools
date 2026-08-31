import '../styles/MetaInfo.css'
import { servePublicAsset } from "../services/General/GeneralServices.jsx";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {useSpring, animated} from "react-spring";
import {msgTimeout} from "../services/General/GeneralUtils.jsx";
import { Capacitor } from "@capacitor/core";
import {shareFileFromBlob} from "../services/General/NativeFileShareService.jsx";
import {openInOwningApp} from "../services/General/ExternalSiteService.jsx"

function MetaInfo() {
    const { t, i18n } = useTranslation(['meta-info']);
    const [showCopiedToClipboardAlert, setShowCopiedToClipboardAlert] = useState(false);

    const qrInProd = true;
    const showQrButtons = import.meta.env?.DEV || qrInProd;
    const prependCountryCodeToPhoneNumberCopy = false;

    const phoneNumberEnglishValue = t("meta-info.phone-number-value", { lng: "en" });
    const whatsappLink = `https://wa.me/${phoneNumberEnglishValue.replace(/^\+/, "")}`;

    const copyToClipboardAnimation = useSpring({
        opacity: showCopiedToClipboardAlert ? 1 : 0,
        transform: showCopiedToClipboardAlert ? 'translateY(0%)' : 'translateY(100%)',
        config: { tension: 170, friction: 26 }
    });

    const downloadQrCode = async (value, fileName) => {

        const { default: QRCode } = await import("qrcode");
        const qrCodeDataUrl = await QRCode.toDataURL(value, { width: 1000, margin: 1, errorCorrectionLevel: "M" });

        if (Capacitor.isNativePlatform()) {
            const qrCodeBlob = await (await fetch(qrCodeDataUrl)).blob();

            await shareFileFromBlob(qrCodeBlob, `${fileName}.png`);
            return;
        }

        const downloadLink = document.createElement("a");
        downloadLink.href = qrCodeDataUrl;
        downloadLink.download = `${fileName}.png`;
        downloadLink.click();
    }

    const copyToClipboard = async (textToCopy) => {

        const phoneNumberValue = t("meta-info.phone-number-value");
        const countryCodePrefix = i18n.language === "ar" ? "+٠٢" : "+02";

        const formatValue = (value) => {
            if (prependCountryCodeToPhoneNumberCopy && value === phoneNumberValue) {
                return countryCodePrefix + value;
            }

            return value;
        }

        if (Array.isArray(textToCopy)) {

            let textToCopyString = "";

            for (let i = 0; i < textToCopy.length; i++) {
                textToCopyString += formatValue(textToCopy[i]);

                if (i % 2 === 0) {
                    textToCopyString += "\n";
                } else {
                    textToCopyString += "\n\n";
                }
            }

            await navigator.clipboard.writeText(textToCopyString);
        } else {
            await navigator.clipboard.writeText(formatValue(textToCopy));
        }

        setShowCopiedToClipboardAlert(true);

        setTimeout(() => {
            setShowCopiedToClipboardAlert(false);
        }, msgTimeout);
    }

    return (
        <>
            <div className="meta-info-page">
                <div className="meta-info-container-wrapper">
                    <div className="meta-info-container">
                        <div className="meta-info-header-container">
                            <div className="meta-info-header-image-container">
                                <img src={servePublicAsset("/images/MetaInfo/Showcase.jpg")}
                                     className="meta-info-header-image"
                                     alt="Meta Info"
                                />
                            </div>

                            <div className="meta-info-header-title">
                                <h3>
                                    {t("meta-info.business-name")}
                                </h3>
                            </div>
                        </div>

                        <div className="meta-info-body-container">
                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.name-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box">
                                    <p>
                                        {t("meta-info.name-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.name-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.address-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box">
                                    <p>
                                        {t("meta-info.address-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.address-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>

                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        openInOwningApp("https://maps.app.goo.gl/3CqafLC8KrCSydaH9");
                                    }}>
                                        {t("meta-info.maps")}
                                    </button>
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.phone-number-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box always-english-value-box">
                                    <p>
                                        {t("meta-info.phone-number-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.phone-number-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>

                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        const { openInOwningApp } = await import("../services/General/ExternalSiteService.jsx");
                                        openInOwningApp(whatsappLink);
                                    }}>
                                        {t("meta-info.whatsapp")}
                                    </button>

                                    {showQrButtons &&
                                        <button className="meta-info-body-grid-item-button always-english-btn" onClick={async () => {
                                            await downloadQrCode(whatsappLink, "whatsapp-qr");
                                        }}>
                                            {t("meta-info.qr")}
                                        </button>
                                    }
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.bank-one-name-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box">
                                    <p>
                                        {t("meta-info.bank-one-name-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.bank-one-name-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.bank-one-account-number-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box always-english-value-box">
                                    <p>
                                        {t("meta-info.bank-one-account-number-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.bank-one-account-number-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.bank-one-instapay-link-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box always-english-value-box">
                                    <p>
                                        {t("meta-info.bank-one-instapay-link-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.bank-one-instapay-link-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>

                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        const { openInOwningApp } = await import("../services/General/ExternalSiteService.jsx");
                                        openInOwningApp(t("meta-info.bank-one-instapay-link-value"));
                                    }}>
                                        {t("meta-info.instapay")}
                                    </button>

                                    {showQrButtons &&
                                        <button className="meta-info-body-grid-item-button always-english-btn" onClick={async () => {
                                            await downloadQrCode(t("meta-info.bank-one-instapay-link-value"), "bank-one-instapay-qr");
                                        }}>
                                            {t("meta-info.qr")}
                                        </button>
                                    }
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.bank-two-name-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box">
                                    <p>
                                        {t("meta-info.bank-two-name-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.bank-two-name-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.bank-two-account-number-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box always-english-value-box">
                                    <p>
                                        {t("meta-info.bank-two-account-number-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.bank-two-account-number-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.bank-two-instapay-link-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box always-english-value-box">
                                    <p>
                                        {t("meta-info.bank-two-instapay-link-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.bank-two-instapay-link-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>

                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        const { openInOwningApp } = await import("../services/General/ExternalSiteService.jsx");
                                        openInOwningApp(t("meta-info.bank-two-instapay-link-value"));
                                    }}>
                                        {t("meta-info.instapay")}
                                    </button>

                                    {showQrButtons &&
                                        <button className="meta-info-body-grid-item-button always-english-btn" onClick={async () => {
                                            await downloadQrCode(t("meta-info.bank-two-instapay-link-value"), "bank-two-instapay-qr");
                                        }}>
                                            {t("meta-info.qr")}
                                        </button>
                                    }
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.email-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box always-english-value-box">
                                    <p>
                                        {t("meta-info.email-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.email-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>

                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        const { openInOwningApp } = await import("../services/General/ExternalSiteService.jsx");
                                        openInOwningApp(`mailto:${t("meta-info.email-value")}`);
                                    }}>
                                        {t("meta-info.email")}
                                    </button>
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.website-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box always-english-value-box">
                                    <p>
                                        {t("meta-info.website-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.website-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>
                                </div>
                            </div>

                            <div className="meta-info-body-grid-item-container">
                                <p>
                                    {t("meta-info.facebook-label")}
                                </p>


                                <div className="meta-info-body-grid-item-value-box always-english-value-box">
                                    <p>
                                        {t("meta-info.facebook-value")}
                                    </p>
                                </div>

                                <div className="meta-info-body-grid-item-button-wrapper">
                                    <button className="meta-info-body-grid-item-button" onClick={async () => {
                                        await copyToClipboard(t("meta-info.facebook-value"))
                                    }}>
                                        {t("meta-info.copy")}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="meta-info-footer-container">
                            <button className="meta-info-footer-button" onClick={async () => {
                                await copyToClipboard([
                                    t("meta-info.name-label") + ":",
                                    t("meta-info.name-value"),
                                    t("meta-info.phone-number-label") + ":",
                                    t("meta-info.phone-number-value"),
                                    t("meta-info.email-label") + ":",
                                    t("meta-info.email-value"),
                                    t("meta-info.website-label") + ":",
                                    t("meta-info.website-value"),
                                    t("meta-info.address-label") + ":",
                                    t("meta-info.address-value"),
                                    t("meta-info.facebook-label") + ":",
                                    t("meta-info.facebook-value"),
                                    t("meta-info.bank-one-name-label") + ":",
                                    t("meta-info.bank-one-name-value"),
                                    t("meta-info.bank-one-account-number-label") + ":",
                                    t("meta-info.bank-one-account-number-value"),
                                    t("meta-info.bank-one-instapay-link-label") + ":",
                                    t("meta-info.bank-one-instapay-link-value"),
                                    t("meta-info.bank-two-name-label") + ":",
                                    t("meta-info.bank-two-name-value"),
                                    t("meta-info.bank-two-account-number-label") + ":",
                                    t("meta-info.bank-two-account-number-value"),
                                    t("meta-info.bank-two-instapay-link-label") + ":",
                                    t("meta-info.bank-two-instapay-link-value")
                                ])
                            }}>
                                {t("meta-info.copy-all")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <animated.div style={copyToClipboardAnimation} className={'copy-to-clipboard-alert-container'}>
                <div className="copy-to-clipboard-alert">
                    <p>
                        {t("meta-info.copied-to-clipboard")}
                    </p>
                </div>
            </animated.div>
        </>
    )
}

export default MetaInfo;