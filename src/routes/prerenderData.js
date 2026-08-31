export const prerenderLanguage = 'en';

const STAFF_DEPARTMENTS = ['national', 'british', 'american', 'kindergarten'];

const LIBRARY_CATEGORIES = [
    'english-fairy-tales', 'english-drama', 'english-levels', 'english-general',
    'arabic-information', 'arabic-general', 'arabic-religion', 'arabic-stories',
];

const GALLERY_SECTIONS = ['photos', 'videos'];

const CALENDAR_IDS = ['national', 'british', 'american', 'national-kg', 'british-kg', 'american-kg'];

const SCRIPT_PATHS = {
    staff: '/scripts/Public/Staff/getPublicStaff.php',
    stages: '/scripts/Public/SchoolInfo/getPublicStages.php',
    metaInfo: '/scripts/Public/SchoolInfo/getPublicMetaInfo.php',
    library: '/scripts/Public/Library/getPublicLibrary.php',
    gallery: '/scripts/Public/Gallery/getPublicGallery.php',
    calendar: '/scripts/Public/Calendars/getPublicCalendar.php',
    pageGates: '/scripts/Public/SchoolInfo/getPublicPageGates.php',
};

export const prerenderFetchPlan = {};

prerenderFetchPlan.pageGates = {
    path: SCRIPT_PATHS.pageGates,
    params: {},
};

for (const department of STAFF_DEPARTMENTS) {
    prerenderFetchPlan[`staff:${department}:${prerenderLanguage}`] = {
        path: SCRIPT_PATHS.staff,
        params: { department, lang: prerenderLanguage },
    };
}

prerenderFetchPlan[`stages:${prerenderLanguage}`] = {
    path: SCRIPT_PATHS.stages,
    params: { lang: prerenderLanguage },
};

prerenderFetchPlan[`metaInfo:${prerenderLanguage}`] = {
    path: SCRIPT_PATHS.metaInfo,
    params: { lang: prerenderLanguage },
};

for (const category of LIBRARY_CATEGORIES) {
    prerenderFetchPlan[`library:${category}:${prerenderLanguage}`] = {
        path: SCRIPT_PATHS.library,
        params: { category, lang: prerenderLanguage },
    };
}

for (const section of GALLERY_SECTIONS) {
    prerenderFetchPlan[`gallery:${section}:${prerenderLanguage}`] = {
        path: SCRIPT_PATHS.gallery,
        params: { section, lang: prerenderLanguage },
    };
}

for (const calendarId of CALENDAR_IDS) {
    prerenderFetchPlan[`calendar:${calendarId}:${prerenderLanguage}`] = {
        path: SCRIPT_PATHS.calendar,
        params: { calendar: calendarId, lang: prerenderLanguage },
    };
}

export const globalDataKeys = ['pageGates'];

export const routeDataKeys = {
    '/academics/staff/national-staff': [`staff:national:${prerenderLanguage}`],
    '/academics/staff/british-staff': [`staff:british:${prerenderLanguage}`],
    '/academics/staff/american-staff': [`staff:american:${prerenderLanguage}`],
    '/academics/staff/kindergarten-staff': [`staff:kindergarten:${prerenderLanguage}`],
    '/meta-info': [`metaInfo:${prerenderLanguage}`],
    '/admission/admission-fees': [`stages:${prerenderLanguage}`],
    '/admission/admission-requirements': [`stages:${prerenderLanguage}`],
    '/minimum-stage-age': [`stages:${prerenderLanguage}`],
    '/students-life/library/english-fairy-tales': [`library:english-fairy-tales:${prerenderLanguage}`],
    '/students-life/library/english-drama': [`library:english-drama:${prerenderLanguage}`],
    '/students-life/library/english-levels': [`library:english-levels:${prerenderLanguage}`],
    '/students-life/library/english-general': [`library:english-general:${prerenderLanguage}`],
    '/students-life/library/arabic-information': [`library:arabic-information:${prerenderLanguage}`],
    '/students-life/library/arabic-general': [`library:arabic-general:${prerenderLanguage}`],
    '/students-life/library/arabic-religion': [`library:arabic-religion:${prerenderLanguage}`],
    '/students-life/library/arabic-stories': [`library:arabic-stories:${prerenderLanguage}`],
    '/gallery/photos': [`gallery:photos:${prerenderLanguage}`],
    '/gallery/videos': [`gallery:videos:${prerenderLanguage}`],
    '/events/national-calendar': [`calendar:national:${prerenderLanguage}`],
    '/events/british-calendar': [`calendar:british:${prerenderLanguage}`],
    '/events/american-calendar': [`calendar:american:${prerenderLanguage}`],
    '/events/national-kg-calendar': [`calendar:national-kg:${prerenderLanguage}`],
    '/events/british-kg-calendar': [`calendar:british-kg:${prerenderLanguage}`],
    '/events/american-kg-calendar': [`calendar:american-kg:${prerenderLanguage}`],
};
