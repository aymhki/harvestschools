import Foundation
import AppIntents

@available(iOS 18.4, *)
struct HarvestAppShortcuts: AppShortcutsProvider {

    static var shortcutTileColor: ShortcutTileColor { .navy }

    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GetSchoolInfoIntent(),
            phrases: [
                "Ask \(.applicationName) about the school",
                "Ask \(.applicationName)",
                "Ask \(.applicationName) a question",
                "Search \(.applicationName)",
                "Look something up in \(.applicationName)",
                "Tell me about \(.applicationName)",
                "What do you know about \(.applicationName)",
                "\(.applicationName) information",
                "Information about \(.applicationName)",
                "\(.applicationName) admission requirements",
                "What are the admission requirements at \(.applicationName)",
                "What documents do I need for \(.applicationName)",
                "Does \(.applicationName) have transport",
                "Is there a bus at \(.applicationName)",
                "What discounts does \(.applicationName) offer",
                "Is \(.applicationName) accredited",
                "When is \(.applicationName) open",
                "What are the working hours at \(.applicationName)",
                "اسأل \(.applicationName)",
                "اسأل \(.applicationName) عن المدرسة",
                "معلومات عن \(.applicationName)",
                "ابحث في \(.applicationName)",
                "متطلبات القبول في \(.applicationName)",
                "مواعيد العمل في \(.applicationName)",
                "هل يوجد باص في \(.applicationName)"
            ],
            shortTitle: "Ask about the school",
            systemImageName: "questionmark.circle"
        )

        AppShortcut(
            intent: GetTuitionFeesIntent(),
            phrases: [
                "Get tuition fees in \(.applicationName)",
                "Show \(.applicationName) fees",
                "\(.applicationName) fees",
                "\(.applicationName) tuition",
                "How much is \(.applicationName)",
                "How much does \(.applicationName) cost",
                "What are the fees at \(.applicationName)",
                "What is the tuition at \(.applicationName)",
                "How much are school fees at \(.applicationName)",
                "Price of \(.applicationName)",
                "\(.applicationName) prices",
                "مصروفات \(.applicationName)",
                "مصاريف \(.applicationName)",
                "كم مصاريف \(.applicationName)",
                "كم تكلفة \(.applicationName)",
                "أسعار \(.applicationName)",
                "المصروفات الدراسية في \(.applicationName)"
            ],
            shortTitle: "Tuition fees",
            systemImageName: "banknote"
        )

        AppShortcut(
            intent: GetStagesOfferedIntent(),
            phrases: [
                "Get stages offered in \(.applicationName)",
                "What grades does \(.applicationName) offer",
                "What stages does \(.applicationName) have",
                "What years does \(.applicationName) offer",
                "\(.applicationName) grades",
                "\(.applicationName) stages",
                "Does \(.applicationName) have kindergarten",
                "What is the minimum age for \(.applicationName)",
                "How old must my child be for \(.applicationName)",
                "Registration age at \(.applicationName)",
                "المراحل المتاحة في \(.applicationName)",
                "مراحل \(.applicationName)",
                "الصفوف في \(.applicationName)",
                "سن القبول في \(.applicationName)",
                "الحد الأدنى للسن في \(.applicationName)",
                "هل يوجد حضانة في \(.applicationName)"
            ],
            shortTitle: "Stages offered",
            systemImageName: "list.bullet.rectangle"
        )

        AppShortcut(
            intent: NextSchoolEventIntent(),
            phrases: [
                "Next event in \(.applicationName)",
                "What is next at \(.applicationName)",
                "What is coming up at \(.applicationName)",
                "\(.applicationName) next event",
                "When is the next holiday at \(.applicationName)",
                "When is the next day off at \(.applicationName)",
                "Is there school tomorrow at \(.applicationName)",
                "الفعالية القادمة في \(.applicationName)",
                "ما القادم في \(.applicationName)",
                "متى الإجازة القادمة في \(.applicationName)",
                "هل غدا إجازة في \(.applicationName)"
            ],
            shortTitle: "Next school event",
            systemImageName: "calendar"
        )

        AppShortcut(
            intent: FindAcademicEventsIntent(),
            phrases: [
                "Find events in \(.applicationName)",
                "Search the \(.applicationName) calendar",
                "\(.applicationName) calendar",
                "\(.applicationName) academic calendar",
                "\(.applicationName) events",
                "Show me the \(.applicationName) schedule",
                "When are the exams at \(.applicationName)",
                "When are the holidays at \(.applicationName)",
                "When does school start at \(.applicationName)",
                "When does term end at \(.applicationName)",
                "ابحث في تقويم \(.applicationName)",
                "تقويم \(.applicationName)",
                "التقويم الدراسي في \(.applicationName)",
                "فعاليات \(.applicationName)",
                "متى الامتحانات في \(.applicationName)",
                "متى تبدأ الدراسة في \(.applicationName)",
                "متى الإجازات في \(.applicationName)"
            ],
            shortTitle: "Find academic events",
            systemImageName: "calendar.badge.clock"
        )

        AppShortcut(
            intent: GetSchoolStaffIntent(),
            phrases: [
                "Get staff in \(.applicationName)",
                "Who teaches at \(.applicationName)",
                "\(.applicationName) staff",
                "\(.applicationName) teachers",
                "Show me the teachers at \(.applicationName)",
                "Who is the head of department at \(.applicationName)",
                "Who is the principal of \(.applicationName)",
                "Who teaches maths at \(.applicationName)",
                "Find a teacher in \(.applicationName)",
                "كوادر \(.applicationName)",
                "معلمي \(.applicationName)",
                "مدرسين \(.applicationName)",
                "من يدرس في \(.applicationName)",
                "من رئيس القسم في \(.applicationName)",
                "ابحث عن معلم في \(.applicationName)"
            ],
            shortTitle: "School staff",
            systemImageName: "person.2"
        )

        AppShortcut(
            intent: GetLibraryBooksIntent(),
            phrases: [
                "Find a book in \(.applicationName)",
                "Search the \(.applicationName) library",
                "\(.applicationName) library",
                "\(.applicationName) books",
                "What books does \(.applicationName) have",
                "Does \(.applicationName) have this book",
                "Can I borrow a book from \(.applicationName)",
                "Show me the reading list at \(.applicationName)",
                "ابحث في مكتبة \(.applicationName)",
                "مكتبة \(.applicationName)",
                "كتب \(.applicationName)",
                "ما الكتب المتاحة في \(.applicationName)",
                "هل يوجد كتاب في \(.applicationName)"
            ],
            shortTitle: "Library books",
            systemImageName: "books.vertical"
        )

        AppShortcut(
            intent: CallSchoolDepartmentIntent(),
            phrases: [
                "Call a department in \(.applicationName)",
                "Call \(.applicationName)",
                "Phone \(.applicationName)",
                "Ring \(.applicationName)",
                "\(.applicationName) phone number",
                "What is the number for \(.applicationName)",
                "Call admissions at \(.applicationName)",
                "Call accounting at \(.applicationName)",
                "Contact \(.applicationName)",
                "اتصل بـ \(.applicationName)",
                "رقم \(.applicationName)",
                "رقم هاتف \(.applicationName)",
                "اتصل بالتقديمات في \(.applicationName)",
                "تواصل مع \(.applicationName)"
            ],
            shortTitle: "Call a department",
            systemImageName: "phone"
        )

        AppShortcut(
            intent: OpenSchoolLocationIntent(),
            phrases: [
                "Show \(.applicationName) location",
                "Where is \(.applicationName)",
                "\(.applicationName) address",
                "Directions to \(.applicationName)",
                "Take me to \(.applicationName)",
                "Navigate to \(.applicationName)",
                "How do I get to \(.applicationName)",
                "\(.applicationName) on the map",
                "أين \(.applicationName)",
                "عنوان \(.applicationName)",
                "موقع \(.applicationName)",
                "الطريق إلى \(.applicationName)",
                "كيف أصل إلى \(.applicationName)"
            ],
            shortTitle: "School location",
            systemImageName: "mappin.and.ellipse"
        )

        AppShortcut(
            intent: OpenSchoolPageIntent(),
            phrases: [
                "Open a page in \(.applicationName)",
                "Open \(.applicationName)",
                "Show me \(.applicationName)",
                "Go to \(.applicationName)",
                "Launch \(.applicationName)",
                "Open the \(.applicationName) gallery",
                "Open \(.applicationName) careers",
                "Open \(.applicationName) admission",
                "افتح \(.applicationName)",
                "اذهب إلى \(.applicationName)",
                "أظهر \(.applicationName)",
                "افتح معرض \(.applicationName)",
                "افتح وظائف \(.applicationName)"
            ],
            shortTitle: "Open a page",
            systemImageName: "doc.text"
        )
    }
}
