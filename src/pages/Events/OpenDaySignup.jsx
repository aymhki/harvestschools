import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/Events.css';

function OpenDaySignup() {
    const { t, i18n } = useTranslation();
    const [countdown, setCountdown] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const targetDate = new Date('2026-05-06T08:00:00+03:00');

        const updateCountdown = () => {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    const convertNumberToLocale = (num) => {
        try {
            const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
            return (num).toLocaleString(locale);
        } catch (e) {
            return num;
        }
    };

    const formatCountdown = (days, hours, minutes, seconds) => {
        const parts = [];

        if (days > 0) {
            parts.push(`${convertNumberToLocale(days)} ${t('common.' + (days === 1 ? 'day' : 'days'))}`);
        }
        if (days > 0 || hours > 0) {
            parts.push(`${convertNumberToLocale(hours)} ${t('common.' + (hours === 1 ? 'hour' : 'hours'))}`);
        }
        if (days > 0 || hours > 0 || minutes > 0) {
            parts.push(`${convertNumberToLocale(minutes)} ${t('common.' + (minutes === 1 ? 'minute' : 'minutes'))}`);
        }
        parts.push(`${convertNumberToLocale(seconds)} ${t('common.' + (seconds === 1 ? 'second' : 'seconds'))}`);

        return parts.join(' ');
    };

    return (
        <div className="open-day-signup-page">
            <p>{t('common.this-page-is-under-construction')}</p>
            <p>{t('common.please-come-back-in')}:</p>
            <div className="timer">
                <p>
                    {formatCountdown(countdown.days, countdown.hours, countdown.minutes, countdown.seconds)}
                </p>
            </div>
        </div>
    );
}

export default OpenDaySignup;