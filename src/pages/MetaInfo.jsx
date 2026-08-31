import '../styles/MetaInfo.css'
import { servePublicAsset } from "../services/General/GeneralServices.jsx";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {useSpring, animated} from "react-spring";
import {getQrCodeBaseUrl, msgTimeout, useToggleLanguage} from "../services/General/GeneralUtils.jsx";
import { Capacitor } from "@capacitor/core";
import {shareFileFromBlob} from "../services/General/NativeFileShareService.jsx";
import {openInOwningApp} from "../services/General/ExternalSiteService.jsx"
import {fetchMetaInfo} from "../services/Public/SchoolInfo/PublicMetaInfoServices.jsx";
import {usePreloadedData} from "../services/General/PrerenderDataContext.jsx";
import { useLoading } from '../services/General/GlobalLoadingService.jsx'

function MetaInfo() {
    const { t, i18n } = useTranslation(['meta-info']);
    const [showCopiedToClipboardAlert, setShowCopiedToClipboardAlert] = useState(false);
    const toggleLanguage = useToggleLanguage({ignoreDocUpdate: false});
    const language = i18n.language === 'ar' ? 'ar' : 'en';
    const preloaded = usePreloadedData(`metaInfo:${language}`);

    const [metaInfo, setMetaInfo] = useState(preloaded);
    const [, setIsLoading] = useLoading(!preloaded);
    const [hasFailed, setHasFailed] = useState(false);

    const qrInProd = true;
    const showQrButtons = import.meta.env?.DEV || qrInProd;
    const prependCountryCodeToPhoneNumberCopy = false;

    const items = metaInfo?.items || [];
    const phoneItem = items.find((item) => item.actions.includes('whatsapp'));

    useEffect(() => {
        let isActive = true;

        if (!preloaded) {
            setIsLoading(true);
            setHasFailed(false);
        }

        fetchMetaInfo(language)
            .then((data) => {
                if (!isActive) {
                    return;
                }

                if (data) {
                    setMetaInfo(data);
                    setHasFailed(false);
                } else if (!preloaded) {
                    setMetaInfo(null);
                    setHasFailed(true);
                }
            })
            .catch(() => {
                if (isActive && !preloaded) {
                    setMetaInfo(null);
                    setHasFailed(true);
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [language, preloaded]);

    const copyToClipboardAnimation = useSpring({
        opacity: showCopiedToClipboardAlert ? 1 : 0,
        transform: showCopiedToClipboardAlert ? 'translateY(0%)' : 'translateY(100%)'
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

        const countryCodePrefix = language === "ar" ? "+٠٢" : "+02";

        const formatValue = (value) => {
            if (prependCountryCodeToPhoneNumberCopy && phoneItem && value === phoneItem.value) {
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

    const renderActionButton = (item, action) => {
        if (action === 'copy') {
            return (
                <button key={action} className="meta-info-body-grid-item-button" onClick={async () => {
                    await copyToClipboard(item.value)
                }}>
                    {t("meta-info.copy")}
                </button>
            );
        }

        if (action === 'qr') {
            if (!showQrButtons || !item.linkUrl) {
                return null;
            }

            return (
                <button key={action} className="meta-info-body-grid-item-button always-english-btn" onClick={async () => {
                    await downloadQrCode(item.linkUrl, item.qrFileName);
                }}>
                    {t("meta-info.qr")}
                </button>
            );
        }

        if (!item.linkUrl) {
            return null;
        }

        return (
            <button key={action} className="meta-info-body-grid-item-button" onClick={() => {
                openInOwningApp(item.linkUrl);
            }}>
                {t(`meta-info.${action}`)}
            </button>
        );
    }

    const copyAll = metaInfo?.copyAll || [];

    return (
        <>
            <div className="meta-info-page">
                <title>Harvest International School | Meta Info</title>
                <meta name="description" content={"Meta Info for Harvest International School."}/>
                <meta name="robots" content="noindex, nofollow"/>

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
                                <h3 lang={language}>
                                    {metaInfo?.header?.value || ''}
                                </h3>
                            </div>
                        </div>

                        {(hasFailed || (metaInfo && items.length === 0)) && (
                            <div className="meta-info-body-container error-state">
                                <p>{t("meta-info.unavailable")}</p>
                            </div>
                        )}

                        <div className="meta-info-body-container">
                            {items.map((item) => (
                                <div className="meta-info-body-grid-item-container" key={item.key} lang={language}>
                                    <p>
                                        {item.label}
                                    </p>


                                    <div className={`meta-info-body-grid-item-value-box${item.forceEnglish ? ' always-english-value-box' : ''}`}>
                                        <p>
                                            {item.value}
                                        </p>
                                    </div>

                                    <div className="meta-info-body-grid-item-button-wrapper">
                                        {item.actions.map((action) => renderActionButton(item, action))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {copyAll.length > 0 && (
                            <div className="meta-info-footer-container">
                                <button className="meta-info-footer-button" onClick={async () => {
                                    await copyToClipboard(copyAll.flatMap((entry) => [entry.label + ":", entry.value]))
                                }}>
                                    {t("meta-info.copy-all")}
                                </button>

                                <button  className="meta-info-footer-button toggle-language-btn" onClick={async () => {
                                    language === 'ar' ? toggleLanguage({lng: 'en'} ) : toggleLanguage({lng: 'ar'})
                                }}>
                                    {language == 'ar' ? 'English' : 'العربية'}
                                </button>

                                <button className="meta-info-footer-button always-english-btn" onClick={async () => {
                                    await copyToClipboard(`${getQrCodeBaseUrl()}${location.pathname}`);
                                    await downloadQrCode(`${getQrCodeBaseUrl()}${location.pathname}`, "all-meta-info-qr-code");

                                }}>
                                    {t("meta-info.qr")}
                                </button>
                            </div>
                        )}
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
