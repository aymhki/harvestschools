import Foundation
import AppIntents

struct HarvestAppShortcuts: AppShortcutsProvider {

    static var shortcutTileColor: ShortcutTileColor { .navy }

    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GetSchoolInfoIntent(),
            phrases: [
                "Ask \(.applicationName) about the school",
                "Ask \(.applicationName)",
                "اسأل \(.applicationName)"
            ],
            shortTitle: "Ask about the school",
            systemImageName: "questionmark.circle"
        )

        AppShortcut(
            intent: GetTuitionFeesIntent(),
            phrases: [
                "Get tuition fees in \(.applicationName)",
                "Show \(.applicationName) fees",
                "مصروفات \(.applicationName)"
            ],
            shortTitle: "Tuition fees",
            systemImageName: "banknote"
        )

        AppShortcut(
            intent: GetStagesOfferedIntent(),
            phrases: [
                "Get stages offered in \(.applicationName)",
                "What grades does \(.applicationName) offer",
                "المراحل المتاحة في \(.applicationName)"
            ],
            shortTitle: "Stages offered",
            systemImageName: "list.bullet.rectangle"
        )

        AppShortcut(
            intent: NextSchoolEventIntent(),
            phrases: [
                "Next event in \(.applicationName)",
                "What is next at \(.applicationName)",
                "الفعالية القادمة في \(.applicationName)"
            ],
            shortTitle: "Next school event",
            systemImageName: "calendar"
        )

        AppShortcut(
            intent: FindAcademicEventsIntent(),
            phrases: [
                "Find events in \(.applicationName)",
                "Search the \(.applicationName) calendar",
                "ابحث في تقويم \(.applicationName)"
            ],
            shortTitle: "Find academic events",
            systemImageName: "calendar.badge.clock"
        )

        AppShortcut(
            intent: GetSchoolStaffIntent(),
            phrases: [
                "Get staff in \(.applicationName)",
                "Who teaches at \(.applicationName)",
                "كوادر \(.applicationName)"
            ],
            shortTitle: "School staff",
            systemImageName: "person.2"
        )

        AppShortcut(
            intent: GetLibraryBooksIntent(),
            phrases: [
                "Find a book in \(.applicationName)",
                "Search the \(.applicationName) library",
                "ابحث في مكتبة \(.applicationName)"
            ],
            shortTitle: "Library books",
            systemImageName: "books.vertical"
        )

        AppShortcut(
            intent: CallSchoolDepartmentIntent(),
            phrases: [
                "Call a department in \(.applicationName)",
                "Call \(.applicationName)",
                "اتصل بـ \(.applicationName)"
            ],
            shortTitle: "Call a department",
            systemImageName: "phone"
        )

        AppShortcut(
            intent: OpenSchoolLocationIntent(),
            phrases: [
                "Show \(.applicationName) location",
                "Where is \(.applicationName)",
                "أين \(.applicationName)"
            ],
            shortTitle: "School location",
            systemImageName: "mappin.and.ellipse"
        )

        AppShortcut(
            intent: OpenSchoolPageIntent(),
            phrases: [
                "Open a page in \(.applicationName)",
                "Open \(.applicationName)",
                "افتح \(.applicationName)"
            ],
            shortTitle: "Open a page",
            systemImageName: "doc.text"
        )
    }
}
