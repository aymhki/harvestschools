import {Fragment, useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from 'react-i18next';
import {useNavigate} from "react-router";
import {v6 as uuidv6} from 'uuid';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import '../styles/ChatWidget.css';
import {loadTurnstileScript, turnstileSiteKey, isMobileApp} from "../services/General/GeneralUtils.jsx";
import {useOffline} from "../services/General/OfflineContext.jsx";
import {readStoredConversationId, sendWebChatMessage} from "../services/Public/ChatBot/WebChatServices.jsx";

const ARABIC_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const INLINE_PATTERN = /(\*[^*\n]+\*|_[^_\n]+_)/g;
const INTERNAL_HOSTS = ['harvestschools.com', 'www.harvestschools.com'];

const internalPathOf = (url) => {
    try {
        const parsed = new URL(url);

        if (!INTERNAL_HOSTS.includes(parsed.hostname.toLowerCase())) {
            return '';
        }

        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (ignored) {
        return '';
    }
};

const detectLang = (text) => {
    const firstStrong = String(text ?? '').match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]|[A-Za-z\u00C0-\u024F]/);

    return firstStrong && ARABIC_PATTERN.test(firstStrong[0]) ? 'ar' : 'en';
};

const renderLine = (line) => line.split(INLINE_PATTERN).filter((part) => part !== '').map((part, index) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
    }

    if (part.length > 2 && part.startsWith('_') && part.endsWith('_')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return <Fragment key={index}>{part}</Fragment>;
});

const renderBotText = (text) => String(text ?? '').split('\n').map((line, index) => (
    <span className="chat-widget-line" key={index} lang={detectLang(line)} dir="auto">
        {renderLine(line)}
    </span>
));

function ChatWidget() {
    const {t} = useTranslation(['home']);
    const {isOffline} = useOffline();
    const navigate = useNavigate();
    const [conversationId, setConversationId] = useState('');
    const [entries, setEntries] = useState([]);
    const [isBusy, setIsBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [turnstileStatus, setTurnstileStatus] = useState('loading');
    const turnstileContainerRef = useRef(null);
    const turnstileTokenRef = useRef('');
    const turnstileWidgetIdRef = useRef(null);
    const turnstileRetriedRef = useRef(false);
    const transcriptRef = useRef(null);
    const openedRef = useRef(false);

    const hasConversation = conversationId !== '';

    const appendEntry = (author, payload) => setEntries((previous) => [...previous, {key: uuidv6(), author: author, payload: payload}]);

    const resetTurnstileWidget = useCallback(() => {
        turnstileTokenRef.current = '';
        setTurnstileStatus('loading');

        if (turnstileWidgetIdRef.current === null || !window.turnstile || typeof window.turnstile.reset !== 'function') {
            return;
        }

        try {
            window.turnstile.reset(turnstileWidgetIdRef.current);
        } catch (ignored) {
            setTurnstileStatus('failed');
        }
    }, []);

    const dispatchToBot = useCallback(async (request) => {
        if (isOffline) {
            setErrorMessage(t("home.chat.offline"));

            return;
        }

        setErrorMessage('');
        setIsBusy(true);

        const storedId = readStoredConversationId();

        const result = await sendWebChatMessage({
            ...request,
            conversationId: storedId,
            turnstileToken: storedId ? '' : turnstileTokenRef.current
        });

        setIsBusy(false);

        if (!result.success) {
            if (result.code === 410) {
                setConversationId('');
                setEntries([]);
                openedRef.current = false;
            }

            if (storedId === '') {
                resetTurnstileWidget();
            }

            setErrorMessage(result.message || t("home.chat.error"));

            return;
        }

        setConversationId(result.conversationId);
        setEntries((previous) => [...previous, ...result.replies.map((reply) => ({key: uuidv6(), author: 'bot', payload: reply}))]);
    }, [isOffline, t, resetTurnstileWidget]);

    useEffect(() => {
        const storedId = readStoredConversationId();

        if (storedId === '' || openedRef.current) {
            return;
        }

        openedRef.current = true;
        setConversationId(storedId);
        dispatchToBot({type: 'open'});
    }, [dispatchToBot]);

    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [entries, isBusy]);

    useEffect(() => {
        if (hasConversation) {
            return;
        }

        let cancelled = false;

        loadTurnstileScript().then((loaded) => {
            if (cancelled) {
                return;
            }

            if (!loaded || !window.turnstile || typeof window.turnstile.render !== 'function' || !turnstileContainerRef.current) {
                setTurnstileStatus('failed');

                return;
            }

            try {
                turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
                    sitekey: turnstileSiteKey,
                    theme: 'auto',
                    size: 'flexible',
                    appearance: 'always',
                    callback: (token) => {
                        turnstileTokenRef.current = token || '';
                        turnstileRetriedRef.current = false;
                        setTurnstileStatus('ready');
                    },
                    'error-callback': () => {
                        turnstileTokenRef.current = '';

                        const canReset = turnstileWidgetIdRef.current !== null
                            && window.turnstile
                            && typeof window.turnstile.reset === 'function';

                        if (turnstileRetriedRef.current || !canReset) {
                            setTurnstileStatus('failed');

                            return;
                        }

                        turnstileRetriedRef.current = true;

                        try {
                            window.turnstile.reset(turnstileWidgetIdRef.current);
                        } catch (ignored) {
                            setTurnstileStatus('failed');
                        }
                    },
                    'unsupported-callback': () => {
                        turnstileTokenRef.current = '';
                        setTurnstileStatus('failed');
                    },
                    'expired-callback': () => {
                        turnstileTokenRef.current = '';

                        if (turnstileWidgetIdRef.current !== null && window.turnstile && typeof window.turnstile.reset === 'function') {
                            try {
                                window.turnstile.reset(turnstileWidgetIdRef.current);
                            } catch (ignored) {
                                setTurnstileStatus('failed');
                            }
                        }
                    },
                });
            } catch (ignored) {
                setTurnstileStatus('failed');
            }
        });

        return () => {
            cancelled = true;

            if (turnstileWidgetIdRef.current !== null && typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.remove === 'function') {
                try {
                    window.turnstile.remove(turnstileWidgetIdRef.current);
                } catch (ignored) {
                    console.log(ignored);
                }
            }

            turnstileWidgetIdRef.current = null;
        };
    }, [hasConversation]);

    const handleStart = () => {
        openedRef.current = true;
        dispatchToBot({type: 'open'});
    };

    const handleReset = () => {
        if (isBusy) {
            return;
        }

        setEntries([]);
        dispatchToBot({type: 'reset'});
    };

    const handleReply = (kind, row) => {
        if (isBusy) {
            return;
        }

        appendEntry('user', {type: 'text', body: row.title});
        dispatchToBot({type: kind, replyId: row.id, replyTitle: row.title});
    };

    const handleCtaClick = async (event, url) => {
        const path = internalPathOf(url);

        if (path !== '') {
            event.preventDefault();
            navigate(path);

            return;
        }

        if (!isMobileApp()) {
            return;
        }

        event.preventDefault();

        const {openInOwningApp} = await import("../services/General/ExternalSiteService.jsx");

        openInOwningApp(url);
    };

    const renderBody = (body) => (
        <p className="chat-widget-body" lang={detectLang(body)} dir="auto">
            {renderBotText(body)}
        </p>
    );

    const renderPayload = (entry) => {
        const payload = entry.payload;

        if (payload.type === 'buttons') {
            return (
                <>
                    {renderBody(payload.body)}
                    <div className="chat-widget-quick-replies">
                        {payload.buttons.map((button) => (
                            <button
                                key={button.id}
                                type="button"
                                className="chat-widget-quick-reply"
                                lang={detectLang(button.title)}
                                dir="auto"
                                disabled={isBusy}
                                onClick={() => handleReply('button', button)}
                            >
                                {button.title}
                            </button>
                        ))}
                    </div>
                </>
            );
        }

        if (payload.type === 'list') {
            return (
                <>
                    {renderBody(payload.body)}
                    <div className="chat-widget-list">
                        {payload.sections.map((section, sectionIndex) => (
                            <div className="chat-widget-list-section" key={sectionIndex}>
                                {section.title !== '' && (
                                    <h3 className="chat-widget-list-title" lang={detectLang(section.title)} dir="auto">
                                        {section.title}
                                    </h3>
                                )}
                                {section.rows.map((row) => (
                                    <button
                                        key={row.id}
                                        type="button"
                                        className="chat-widget-list-row"
                                        lang={detectLang(row.title)}
                                        dir="auto"
                                        disabled={isBusy}
                                        onClick={() => handleReply('list', row)}
                                    >
                                        <span className="chat-widget-list-row-title">{row.title}</span>
                                        {row.description !== '' && (
                                            <span className="chat-widget-list-row-description">{row.description}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            );
        }

        if (payload.type === 'cta_url') {
            const path = internalPathOf(payload.url);
            const isInternal = path !== '';

            return (
                <>
                    {renderBody(payload.body)}
                    <a
                        className="chat-widget-cta"
                        href={isInternal ? path : payload.url}
                        target={isInternal ? undefined : "_blank"}
                        rel={isInternal ? undefined : "noopener noreferrer"}
                        lang={detectLang(payload.title)}
                        onClick={(event) => handleCtaClick(event, payload.url)}
                    >
                        <span className="chat-widget-cta-label">{payload.title}</span>
                        {isInternal
                            ? <ArrowForwardOutlinedIcon className="chat-widget-cta-icon"/>
                            : <OpenInNewOutlinedIcon className="chat-widget-cta-icon"/>}
                    </a>
                </>
            );
        }

        return renderBody(payload.body);
    };

    return (
        <div className="chat-widget">
            <div className="chat-widget-transcript" ref={transcriptRef}>
                {!hasConversation && entries.length === 0 && (
                    <p className="chat-widget-intro">{t("home.chat.intro")}</p>
                )}

                {entries.map((entry) => (
                    <div
                        className={`chat-widget-message chat-widget-message-${entry.author}`}
                        key={entry.key}
                        lang={detectLang(entry.payload.body)}
                        dir="auto"
                    >
                        {renderPayload(entry)}
                    </div>
                ))}

                {isBusy && (
                    <div className="chat-widget-message chat-widget-message-bot chat-widget-typing" aria-label={t("home.chat.typing")}>
                        <span/><span/><span/>
                    </div>
                )}
            </div>

            {errorMessage !== '' && <p className="chat-widget-error">{errorMessage}</p>}

            {isOffline && <p className="chat-widget-error">{t("home.chat.offline")}</p>}

            {!hasConversation ? (
                <div className="chat-widget-start">
                    <div className={`chat-widget-turnstile${turnstileStatus === 'failed' ? ' chat-widget-turnstile-hidden' : ''}`}>
                        <div ref={turnstileContainerRef}/>
                    </div>

                    {turnstileStatus === 'failed' ? (
                        <p className="chat-widget-error">{t("home.chat.verification-failed")}</p>
                    ) : (
                        <button
                            type="button"
                            className="chat-widget-start-button"
                            disabled={isBusy || isOffline || turnstileStatus !== 'ready'}
                            onClick={handleStart}
                        >
                            {t("home.chat.start")}
                        </button>
                    )}
                </div>
            ) : (
                <div className="chat-widget-footer">
                    <button
                        type="button"
                        className="chat-widget-reset-button"
                        disabled={isBusy || isOffline}
                        onClick={handleReset}
                    >
                        <RestartAltOutlinedIcon className="chat-widget-reset-icon"/>
                        {t("home.chat.reset")}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ChatWidget;
