const ARABIC_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_PATTERN = /[A-Za-z\u00C0-\u024F]/;

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

const classifyCharacter = (character) => {
    if (ARABIC_PATTERN.test(character)) {
        return 'ar';
    }

    return LATIN_PATTERN.test(character) ? 'en' : 'neutral';
};

const splitByLanguage = (text) => {
    const runs = [];

    for (const character of text) {
        const type = classifyCharacter(character);
        const previous = runs[runs.length - 1];

        if (previous && previous.type === type) {
            previous.text += character;
            continue;
        }

        runs.push({type, text: character});
    }

    const merged = [];

    runs.forEach((run, index) => {
        const previous = runs[index - 1];
        const next = runs[index + 1];
        const sitsInsideOneLanguage = run.type === 'neutral'
            && previous && next
            && previous.type !== 'neutral'
            && previous.type === next.type;

        const type = sitsInsideOneLanguage ? previous.type : run.type;
        const last = merged[merged.length - 1];

        if (last && last.type === type) {
            last.text += run.text;
            return;
        }

        merged.push({type, text: run.text});
    });

    return merged;
};

const renderWithLanguageSpans = (value) => {
    if (typeof value !== 'string' || !ARABIC_PATTERN.test(value) || !LATIN_PATTERN.test(value)) {
        return value;
    }

    return splitByLanguage(value).map((segment, index) => (
        segment.type === 'neutral' ? segment.text : <span key={index} lang={segment.type}>{segment.text}</span>
    ));
};

const detectLanguage = (text) => {
    const firstStrong = String(text ?? '').match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]|[A-Za-z\u00C0-\u024F]/);

    return firstStrong && ARABIC_PATTERN.test(firstStrong[0]) ? 'ar' : 'en';
};

const localiseDigits = (value, language) => {
    if (language !== 'ar') {
        return String(value ?? '');
    }

    return String(value ?? '').replace(/[0-9]/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)]);
};

const formatLocalisedDate = (isoValue, language, fallbackLabel = '') => {
    if (!isoValue) {
        return fallbackLabel;
    }

    const parsed = new Date(isoValue);

    if (Number.isNaN(parsed.getTime())) {
        return fallbackLabel;
    }

    try {
        return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(parsed);
    } catch (ignored) {
        return fallbackLabel;
    }
};

export {
    ARABIC_PATTERN,
    LATIN_PATTERN,
    classifyCharacter,
    splitByLanguage,
    renderWithLanguageSpans,
    detectLanguage,
    localiseDigits,
    formatLocalisedDate,
}
