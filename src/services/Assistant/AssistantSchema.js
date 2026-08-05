const ASSISTANT_SCHEMA_VERSION = 1

const ASSISTANT_SUPPORTED_LANGUAGES = ['en', 'ar']

const ASSISTANT_FACT_CATEGORIES = [
    'contact',
    'admission',
    'academics',
    'stages',
    'fees',
    'faq',
    'about',
    'policy',
    'identity',
    'location',
    'social',
    'hours',
    'general',
]

const ASSISTANT_FACT_SOURCES = ['infosystem', 'locales', 'routes']


const normaliseAssistantLanguage = (value) => (String(value || '').toLowerCase() === 'ar' ? 'ar' : 'en')


const slugifyKeySegment = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')


const factIdFromLocaleKey = (category, localeKeyPath) => `fact.${category}.${slugifyKeySegment(localeKeyPath)}`


const pageIdFromPath = (routePath) => `page${slugifyKeySegment(routePath) === '' ? '.root' : '.' + slugifyKeySegment(routePath)}`


const hashAssistantPayload = (value) => {
    const serialised = typeof value === 'string' ? value : JSON.stringify(value)

    let hash = 0x811c9dc5

    for (let index = 0; index < serialised.length; index += 1) {
        hash ^= serialised.charCodeAt(index)
        hash = Math.imul(hash, 0x01000193) >>> 0
    }

    let secondary = 0x2545f491

    for (let index = serialised.length - 1; index >= 0; index -= 1) {
        secondary ^= serialised.charCodeAt(index)
        secondary = Math.imul(secondary, 0x85ebca6b) >>> 0
    }

    return (hash.toString(16).padStart(8, '0') + secondary.toString(16).padStart(8, '0'))
}


const createEmptyAssistantKnowledge = (language) => ({
    schemaVersion: ASSISTANT_SCHEMA_VERSION,
    generatedAt: null,
    contentHash: '',
    language: normaliseAssistantLanguage(language),
    school: {
        name: null,
        address: null,
        phone: [],
        email: null,
        website: null,
        socials: {},
        workingHours: null,
        mapsUrl: null,
        coordinates: null,
        currency: 'EGP',
    },
    departments: [],
    stages: [],
    policies: {},
    facts: [],
    events: [],
    pages: [],
})


const isAssistantKnowledgeUsable = (knowledge) => Boolean(
    knowledge
    && Number(knowledge.schemaVersion) === ASSISTANT_SCHEMA_VERSION
    && Array.isArray(knowledge.facts)
    && Array.isArray(knowledge.stages)
)


export {
    ASSISTANT_SCHEMA_VERSION,
    ASSISTANT_SUPPORTED_LANGUAGES,
    ASSISTANT_FACT_CATEGORIES,
    ASSISTANT_FACT_SOURCES,
    createEmptyAssistantKnowledge,
    factIdFromLocaleKey,
    hashAssistantPayload,
    isAssistantKnowledgeUsable,
    normaliseAssistantLanguage,
    pageIdFromPath,
    slugifyKeySegment,
}
