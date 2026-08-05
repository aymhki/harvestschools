import {
    ASSISTANT_SCHEMA_VERSION,
    createEmptyAssistantKnowledge,
    factIdFromLocaleKey,
    hashAssistantPayload,
    normaliseAssistantLanguage,
} from './AssistantSchema.js'

const PLACEHOLDER_MARKERS = ['this-page-is-under-construction', 'under-construction']

const NARRATIVE_LOCALE_KEYS = [
    { key: 'home.harvest-schools-vision', category: 'about', topicEn: 'Vision', topicAr: 'الرؤية' },
    { key: 'home.harvest-schools-mission', category: 'about', topicEn: 'Mission', topicAr: 'الرسالة' },
    { key: 'home.harvest-schools-about-us', category: 'about', topicEn: 'About Harvest Schools', topicAr: 'عن مدارس هارڤست' },
    { key: 'home.harvest-schools-elearning-and-academics', category: 'academics', topicEn: 'E-learning and academics', topicAr: 'التعلم الإلكتروني والأكاديميات' },
]

const LOCALE_AGE_TABLE_KEYS = [
    'faqs-pages.minimum-stage-age-page.international-division-table-data',
    'faqs-pages.minimum-stage-age-page.national-division-table-data',
]

const FOOTER_CONTACT_NUMBER = '+201028329668'

const LOCALE_ADDRESS_KEY = 'home.harvest-schools-address'

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']


const isPlaceholderText = (value) => {
    const text = String(value || '').trim().toLowerCase()

    return text === '' || PLACEHOLDER_MARKERS.some((marker) => text.includes(marker))
}


const stripInlineLinks = (value) => String(value || '')
    .replace(/\{\{([^|}]+)\|[^}]*\}\}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()


const toWesternDigits = (value) => {
    let text = String(value || '')

    ARABIC_INDIC_DIGITS.forEach((digit, index) => {
        text = text.split(digit).join(String(index))
    })

    return text
}


const leadingNumber = (value) => {
    const match = toWesternDigits(value).match(/\d+/)

    return match ? Number(match[0]) : null
}


const normaliseStageToken = (value) => {
    const text = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[.\-_]/g, ' ')
        .replace(/\s+/g, ' ')

    const patterns = [
        [/^(?:grade|g)\s*(\d+)$/, 'g'],
        [/^(?:year|y)\s*(\d+)$/, 'y'],
        [/^(?:junior|jr|j)\s*(\d+)$/, 'j'],
        [/^(?:senior|sr|s)\s*(\d+)$/, 's'],
        [/^(?:middle|prep|preparatory|m)\s*(\d+)$/, 'm'],
        [/^(?:kg|kindergarten)\s*(\d+)$/, 'kg'],
        [/^(?:fs)\s*(\d+)$/, 'fs'],
    ]

    for (const [pattern, prefix] of patterns) {
        const match = text.match(pattern)

        if (match) {
            return `${prefix}${match[1]}`
        }
    }

    if (/^pre\s*k$/.test(text) || text === 'prek') {
        return 'prek'
    }

    if (text === 'k' || text === 'kindergarten') {
        return 'kg'
    }

    return text.replace(/\s+/g, '')
}


const buildLocaleAgeIndex = (lookup) => {
    const index = new Map()

    LOCALE_AGE_TABLE_KEYS.forEach((tableKey) => {
        const rows = lookup(tableKey, { returnObjects: true })

        if (!Array.isArray(rows)) {
            return
        }

        rows.forEach((row, rowIndex) => {
            if (rowIndex === 0 || !row || typeof row !== 'object') {
                return
            }

            const age = leadingNumber(row['minimum-registration-age'])

            if (age === null) {
                return
            }

            String(row.stage || '')
                .split(',')
                .map((token) => normaliseStageToken(token))
                .filter((token) => token !== '')
                .forEach((token) => {
                    if (!index.has(token)) {
                        index.set(token, { age, tableKey, rowIndex, rawStage: row.stage })
                    }
                })
        })
    })

    return index
}


const detectConflicts = ({ document, lookup }) => {
    const conflicts = []

    const localeAddress = lookup(LOCALE_ADDRESS_KEY)

    if (typeof localeAddress === 'string' && localeAddress.trim() !== '' && document.school && document.school.address
        && localeAddress.trim() !== document.school.address.trim()) {
        conflicts.push({
            field: 'school.address',
            infoSystemValue: document.school.address,
            otherValue: localeAddress.trim(),
            otherSource: LOCALE_ADDRESS_KEY,
            resolution: 'infosystem',
        })
    }

    const knownNumbers = Array.isArray(document.school && document.school.phone) ? document.school.phone : []
    const normalisedNumbers = knownNumbers.map((number) => String(number).replace(/[^\d]/g, ''))

    if (!normalisedNumbers.includes(FOOTER_CONTACT_NUMBER.replace(/[^\d]/g, ''))) {
        conflicts.push({
            field: 'school.phone',
            infoSystemValue: knownNumbers.join(', '),
            otherValue: FOOTER_CONTACT_NUMBER,
            otherSource: 'src/modules/Footer.jsx',
            resolution: 'infosystem',
        })
    }

    const localeAges = buildLocaleAgeIndex(lookup)

    ;(document.stages || []).forEach((stage) => {
        const token = normaliseStageToken(stage.name)
        const localeEntry = localeAges.get(token)

        if (!localeEntry) {
            return
        }

        const infoSystemAge = leadingNumber(stage.minimumAge)

        if (infoSystemAge !== null && infoSystemAge !== localeEntry.age) {
            conflicts.push({
                field: `stage.${stage.key}.minimumAge`,
                infoSystemValue: stage.minimumAge,
                otherValue: localeEntry.rawStage + ' = ' + localeEntry.age,
                otherSource: `${localeEntry.tableKey}[${localeEntry.rowIndex}]`,
                resolution: 'infosystem',
            })
        }
    })

    return conflicts
}


const buildNarrativeFacts = ({ lookup, language }) => {
    const facts = []

    NARRATIVE_LOCALE_KEYS.forEach((entry) => {
        const value = lookup(entry.key)

        if (typeof value !== 'string' || isPlaceholderText(value)) {
            return
        }

        facts.push({
            id: factIdFromLocaleKey(entry.category, entry.key),
            category: entry.category,
            topic: language === 'ar' ? entry.topicAr : entry.topicEn,
            answer: stripInlineLinks(value),
            keywords: [entry.topicEn, entry.topicAr].filter(Boolean),
            routePath: '/home',
            source: 'locales',
            sourceKey: entry.key,
        })
    })

    return facts
}


const buildAssistantKnowledge = ({ document, lookup, language, renderablePaths = null } = {}) => {
    const normalisedLanguage = normaliseAssistantLanguage(language)

    if (!document) {
        return { knowledge: createEmptyAssistantKnowledge(normalisedLanguage), conflicts: [] }
    }

    const safeLookup = typeof lookup === 'function' ? lookup : () => null

    const narrativeFacts = buildNarrativeFacts({ lookup: safeLookup, language: normalisedLanguage })

    const existingFactIds = new Set((document.facts || []).map((fact) => fact.id))
    const mergedFacts = (document.facts || []).concat(
        narrativeFacts.filter((fact) => !existingFactIds.has(fact.id))
    )

    const pages = (document.pages || [])
        .filter((page) => renderablePaths === null || renderablePaths.has(page.routePath))
        .map((page) => ({ ...page, renderableInApp: true }))

    const knowledge = {
        ...createEmptyAssistantKnowledge(normalisedLanguage),
        ...document,
        schemaVersion: ASSISTANT_SCHEMA_VERSION,
        language: normalisedLanguage,
        facts: mergedFacts,
        pages,
    }

    knowledge.contentHash = hashAssistantPayload({
        upstream: document.contentHash,
        facts: mergedFacts.length,
        pages: pages.map((page) => page.routePath),
        language: normalisedLanguage,
    })

    const conflicts = detectConflicts({ document, lookup: safeLookup })

    return { knowledge, conflicts }
}


const logAssistantConflicts = (conflicts, language) => {
    if (!Array.isArray(conflicts) || conflicts.length === 0) {
        return
    }

    console.warn(`[assistant] ${conflicts.length} source conflict(s) for "${language}" — InfoSystem wins:`)

    conflicts.forEach((conflict) => {
        console.warn(`[assistant]   ${conflict.field}: InfoSystem "${conflict.infoSystemValue}" vs ${conflict.otherSource} "${conflict.otherValue}"`)
    })
}


export {
    buildAssistantKnowledge,
    buildLocaleAgeIndex,
    detectConflicts,
    isPlaceholderText,
    leadingNumber,
    logAssistantConflicts,
    normaliseStageToken,
    stripInlineLinks,
}
