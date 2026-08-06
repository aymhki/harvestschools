import Foundation
import AppIntents

enum HarvestAssistantPendingAction {

    static let key = "harvest_assistant_pending_action"

    static func store(type: String, value: String) {
        let payload = ["type": type, "value": value]

        guard let encoded = try? JSONSerialization.data(withJSONObject: payload) else {
            return
        }

        HarvestAssistantStore.sharedDefaults()?.set(encoded, forKey: key)
    }

    static func consume() -> (type: String, value: String)? {
        guard let data = HarvestAssistantStore.sharedDefaults()?.data(forKey: key) else {
            return nil
        }

        HarvestAssistantStore.sharedDefaults()?.removeObject(forKey: key)

        guard let payload = try? JSONSerialization.jsonObject(with: data) as? [String: String] else {
            return nil
        }

        guard let type = payload["type"], let value = payload["value"] else {
            return nil
        }

        return (type, value)
    }
}

enum HarvestAssistantPhrasing {

    static var isArabic: Bool {
        return HarvestAssistantStore.preferredLanguage() == "ar"
    }

    static func unavailableKnowledge() -> String {
        return isArabic
            ? "لا تتوفر معلومات المدرسة حالياً. يرجى المحاولة مرة أخرى بعد الاتصال بالإنترنت."
            : "School information is not available right now. Please try again once you are online."
    }

    static func noMatch() -> String {
        return isArabic
            ? "لم أجد معلومات عن هذا. يمكنك التواصل مع قسم التقديمات للمساعدة."
            : "I could not find information about that. You can contact the admissions department for help."
    }

    static func feesUnpublished(for stageName: String) -> String {
        return isArabic
            ? "المصروفات الدراسية الخاصة بـ \(stageName) غير منشورة. يرجى التواصل مع قسم التقديمات."
            : "Tuition fees for \(stageName) are not published. Please contact the admissions department."
    }
}

struct GetSchoolInfoIntent: AppIntent {

    static var title: LocalizedStringResource { "Get Harvest School Information" }

    static var description: IntentDescription {
        return IntentDescription("Answers a question about Harvest International Schools using the school's published information.")
    }

    static var openAppWhenRun: Bool { false }

    @Parameter(title: "Topic")
    var fact: SchoolFactEntity?

    @Parameter(title: "Question")
    var query: String?

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
        if let fact = fact {
            return .result(value: fact.answer, dialog: IntentDialog(stringLiteral: fact.answer))
        }

        guard let query = query, !query.isEmpty else {
            let message = HarvestAssistantPhrasing.noMatch()

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        let matches = try await SchoolFactQuery().entities(matching: query)

        guard let best = matches.first else {
            let message = HarvestAssistantPhrasing.noMatch()

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        return .result(value: best.answer, dialog: IntentDialog(stringLiteral: best.answer))
    }
}

struct GetTuitionFeesIntent: AppIntent {

    static var title: LocalizedStringResource { "Get Harvest Tuition Fees" }

    static var description: IntentDescription {
        return IntentDescription("Reports the published annual tuition fees for a stage, or says clearly when a fee is not published.")
    }

    static var openAppWhenRun: Bool { false }

    @Parameter(title: "Department")
    var department: SchoolDepartmentEntity?

    @Parameter(title: "Stage")
    var stage: SchoolStageEntity?

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            let message = HarvestAssistantPhrasing.unavailableKnowledge()

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        let currency = knowledge.school?.currency ?? "EGP"
        var candidates = (knowledge.stages ?? []).map { SchoolStageEntity(stage: $0) }

        if let stage = stage {
            candidates = candidates.filter { $0.id == stage.id }
        } else if let department = department {
            candidates = candidates.filter { $0.departmentName == department.name }
        }

        guard !candidates.isEmpty else {
            let message = HarvestAssistantPhrasing.noMatch()

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        if candidates.count == 1, let only = candidates.first {
            let message = feeSentence(for: only, currency: currency)

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        let lines = candidates.prefix(12).map { feeSentence(for: $0, currency: currency) }
        let joined = lines.joined(separator: "\n")

        return .result(value: joined, dialog: IntentDialog(stringLiteral: joined))
    }

    private func feeSentence(for stage: SchoolStageEntity, currency: String) -> String {
        guard let fees = stage.tuitionFees, fees > 0 else {
            return HarvestAssistantPhrasing.feesUnpublished(for: stage.name)
        }

        let formatted = NumberFormatter.harvestFeeFormatter.string(from: NSNumber(value: fees)) ?? String(fees)

        return HarvestAssistantPhrasing.isArabic
            ? "\(stage.name): \(formatted) \(currency) سنوياً"
            : "\(stage.name): \(formatted) \(currency) per year"
    }
}

struct GetStagesOfferedIntent: AppIntent {

    static var title: LocalizedStringResource { "Get Harvest Stages Offered" }

    static var description: IntentDescription {
        return IntentDescription("Lists the stages Harvest International Schools currently offers, with their minimum registration ages.")
    }

    static var openAppWhenRun: Bool { false }

    @Parameter(title: "Department")
    var department: SchoolDepartmentEntity?

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            let message = HarvestAssistantPhrasing.unavailableKnowledge()

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        var stages = (knowledge.stages ?? []).map { SchoolStageEntity(stage: $0) }.filter { $0.isOffered }

        if let department = department {
            stages = stages.filter { $0.departmentName == department.name }
        }

        guard !stages.isEmpty else {
            let message = HarvestAssistantPhrasing.noMatch()

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        let lines = stages.prefix(20).map { stage -> String in
            guard let age = stage.minimumAge, !age.isEmpty else {
                return stage.name
            }

            return HarvestAssistantPhrasing.isArabic ? "\(stage.name) — الحد الأدنى للسن \(age)" : "\(stage.name) — minimum age \(age)"
        }

        let joined = lines.joined(separator: "\n")

        return .result(value: joined, dialog: IntentDialog(stringLiteral: joined))
    }
}

struct GetSchoolStaffIntent: AppIntent {

    static var title: LocalizedStringResource { "Get Harvest School Staff" }

    static var description: IntentDescription {
        return IntentDescription("Looks up the teachers, coordinators and heads Harvest International Schools publishes for each department.")
    }

    static var openAppWhenRun: Bool { false }

    @Parameter(title: "Name, subject or department")
    var query: String?

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            let message = HarvestAssistantPhrasing.unavailableKnowledge()

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        var staff = try await SchoolStaffQuery().allEntities()

        if let query = query, !query.trimmingCharacters(in: .whitespaces).isEmpty {
            let terms = query.split(separator: " ").map(String.init).filter { !$0.isEmpty }

            staff = staff.filter {
                HarvestAssistantContext.matches([$0.name, $0.position, $0.subject, $0.departmentName], terms: terms)
            }
        }

        guard !staff.isEmpty else {
            let message = HarvestAssistantPhrasing.noMatch()

            return .result(value: message, dialog: IntentDialog(stringLiteral: message))
        }

        let lines = staff.prefix(20).map { member -> String in
            let role = member.subject.isEmpty ? member.position : "\(member.position), \(member.subject)"

            return HarvestAssistantPhrasing.isArabic
                ? "\(member.name) — \(role) (\(member.departmentName))"
                : "\(member.name) — \(role) (\(member.departmentName))"
        }

        let joined = lines.joined(separator: "\n")

        return .result(value: joined, dialog: IntentDialog(stringLiteral: joined))
    }
}

struct FindAcademicEventsIntent: AppIntent {

    static var title: LocalizedStringResource { "Find Harvest Academic Events" }

    static var description: IntentDescription {
        return IntentDescription("Finds events in the Harvest academic calendars, optionally within a date range.")
    }

    static var openAppWhenRun: Bool { false }

    @Parameter(title: "Calendar")
    var calendar: SchoolCalendarEntity?

    @Parameter(title: "Search")
    var query: String?

    @Parameter(title: "From")
    var fromDate: Date?

    @Parameter(title: "To")
    var toDate: Date?

    func perform() async throws -> some IntentResult & ReturnsValue<[AcademicEventEntity]> & ProvidesDialog {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return .result(value: [], dialog: IntentDialog(stringLiteral: HarvestAssistantPhrasing.unavailableKnowledge()))
        }

        var events = (knowledge.events ?? []).map { AcademicEventEntity(event: $0) }

        if let calendar = calendar {
            let calendarId = calendar.id

            events = events.filter { event in
                (knowledge.events ?? []).contains { $0.id == event.id && $0.calendarId == calendarId }
            }
        }

        if let query = query, !query.isEmpty {
            events = events.filter { HarvestAssistantContext.matches([$0.title, $0.calendarLabel], terms: [query]) }
        }

        if let fromDate = fromDate {
            events = events.filter { ($0.endDate ?? $0.startDate ?? .distantPast) >= fromDate }
        }

        if let toDate = toDate {
            events = events.filter { ($0.startDate ?? .distantFuture) <= toDate }
        }

        let limited = Array(events.prefix(25))

        guard let first = limited.first else {
            return .result(value: [], dialog: IntentDialog(stringLiteral: HarvestAssistantPhrasing.noMatch()))
        }

        let summary = HarvestAssistantPhrasing.isArabic
            ? "وجدت \(limited.count) من الفعاليات. أقربها: \(first.title)."
            : "I found \(limited.count) events. The first is \(first.title)."

        return .result(value: limited, dialog: IntentDialog(stringLiteral: summary))
    }
}

struct NextSchoolEventIntent: AppIntent {

    static var title: LocalizedStringResource { "Next Harvest School Event" }

    static var description: IntentDescription {
        return IntentDescription("Reports the soonest upcoming event in the Harvest academic calendars.")
    }

    static var openAppWhenRun: Bool { false }

    @Parameter(title: "Calendar")
    var calendar: SchoolCalendarEntity?

    func perform() async throws -> some IntentResult & ReturnsValue<AcademicEventEntity?> & ProvidesDialog {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return .result(value: nil, dialog: IntentDialog(stringLiteral: HarvestAssistantPhrasing.unavailableKnowledge()))
        }

        let now = Date().timeIntervalSince1970 * 1000
        var upcoming = (knowledge.events ?? []).filter { ($0.startDate ?? 0) >= now }

        if let calendar = calendar {
            upcoming = upcoming.filter { $0.calendarId == calendar.id }
        }

        guard let next = upcoming.first else {
            return .result(value: nil, dialog: IntentDialog(stringLiteral: HarvestAssistantPhrasing.noMatch()))
        }

        let entity = AcademicEventEntity(event: next)
        let dateText = entity.startDate.map { DateFormatter.harvestEventFormatter.string(from: $0) } ?? ""

        let message = HarvestAssistantPhrasing.isArabic
            ? "الفعالية القادمة هي \(entity.title) بتاريخ \(dateText)."
            : "The next event is \(entity.title) on \(dateText)."

        return .result(value: entity, dialog: IntentDialog(stringLiteral: message))
    }
}

struct OpenSchoolPageIntent: AppIntent {

    static var title: LocalizedStringResource { "Open Harvest School Page" }

    static var description: IntentDescription {
        return IntentDescription("Opens a page in the Harvest Schools app.")
    }

    static var openAppWhenRun: Bool { true }

    @Parameter(title: "Page")
    var page: AppPageEntity

    func perform() async throws -> some IntentResult {
        HarvestAssistantPendingAction.store(type: "path", value: page.routePath)

        return .result()
    }
}

struct CallSchoolDepartmentIntent: AppIntent {

    static var title: LocalizedStringResource { "Call a Harvest School Department" }

    static var description: IntentDescription {
        return IntentDescription("Starts a phone call to one of the Harvest School departments.")
    }

    static var openAppWhenRun: Bool { true }

    @Parameter(title: "Department")
    var department: SchoolDepartmentEntity

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let digits = department.contactNumber.filter { $0.isNumber }

        guard !digits.isEmpty else {
            return .result(dialog: IntentDialog(stringLiteral: HarvestAssistantPhrasing.noMatch()))
        }

        HarvestAssistantPendingAction.store(type: "url", value: "tel:+\(digits)")

        let message = HarvestAssistantPhrasing.isArabic
            ? "جاري الاتصال بـ \(department.name)."
            : "Calling \(department.name)."

        return .result(dialog: IntentDialog(stringLiteral: message))
    }
}

struct OpenSchoolLocationIntent: AppIntent {

    static var title: LocalizedStringResource { "Show Harvest School Location" }

    static var description: IntentDescription {
        return IntentDescription("Opens the location of Harvest International Schools in Maps.")
    }

    static var openAppWhenRun: Bool { true }

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return .result(dialog: IntentDialog(stringLiteral: HarvestAssistantPhrasing.unavailableKnowledge()))
        }

        guard let mapsUrl = knowledge.school?.mapsUrl, !mapsUrl.isEmpty else {
            return .result(dialog: IntentDialog(stringLiteral: HarvestAssistantPhrasing.noMatch()))
        }

        HarvestAssistantPendingAction.store(type: "url", value: mapsUrl)

        let address = knowledge.school?.address ?? ""

        return .result(dialog: IntentDialog(stringLiteral: address.isEmpty ? mapsUrl : address))
    }
}

extension NumberFormatter {

    static let harvestFeeFormatter: NumberFormatter = {
        let formatter = NumberFormatter()

        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0

        return formatter
    }()
}
