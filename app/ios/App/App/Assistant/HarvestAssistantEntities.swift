import Foundation
import AppIntents
import CoreSpotlight

enum HarvestAssistantContext {

    static func knowledge() async -> HarvestSchoolKnowledge? {
        return await HarvestAssistantStore.knowledge(language: HarvestAssistantStore.preferredLanguage())
    }

    static func matches(_ haystack: [String], terms: [String]) -> Bool {
        let joined = haystack.joined(separator: " ").lowercased()

        return terms.contains { joined.contains($0.lowercased()) }
    }
}

struct SchoolFactEntity: AppEntity, Identifiable {

    static var typeDisplayRepresentation: TypeDisplayRepresentation { "School Fact" }

    static var defaultQuery: SchoolFactQuery { SchoolFactQuery() }

    var id: String
    var topic: String
    var answer: String
    var keywords: [String]
    var routePath: String?

    var displayRepresentation: DisplayRepresentation {
        return DisplayRepresentation(title: "\(topic)", subtitle: "\(answer)")
    }

    init(fact: HarvestSchoolFact) {
        self.id = fact.id
        self.topic = fact.topic ?? ""
        self.answer = fact.answer ?? ""
        self.keywords = fact.keywords ?? []
        self.routePath = fact.routePath
    }
}

struct SchoolFactQuery: EntityStringQuery {

    func entities(for identifiers: [String]) async throws -> [SchoolFactEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        let wanted = Set(identifiers)

        return (knowledge.facts ?? []).filter { wanted.contains($0.id) }.map { SchoolFactEntity(fact: $0) }
    }

    func entities(matching string: String) async throws -> [SchoolFactEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        let terms = string.split(separator: " ").map(String.init).filter { !$0.isEmpty }

        let searchTerms: [String] = terms.isEmpty ? [string] : terms

        return (knowledge.facts ?? [])
            .filter { fact in
                var haystack: [String] = [fact.topic ?? "", fact.answer ?? ""]

                haystack.append(contentsOf: fact.keywords ?? [])

                return HarvestAssistantContext.matches(haystack, terms: searchTerms)
            }
            .prefix(20)
            .map { SchoolFactEntity(fact: $0) }
    }

    func suggestedEntities() async throws -> [SchoolFactEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        return (knowledge.facts ?? []).prefix(10).map { SchoolFactEntity(fact: $0) }
    }
}

struct SchoolStageEntity: AppEntity, Identifiable {

    static var typeDisplayRepresentation: TypeDisplayRepresentation { "School Stage" }

    static var defaultQuery: SchoolStageQuery { SchoolStageQuery() }

    var id: String
    var name: String
    var departmentName: String
    var sectionTitle: String
    var minimumAge: String?
    var tuitionFees: Int?
    var isOffered: Bool
    var routePath: String?

    var displayRepresentation: DisplayRepresentation {
        return DisplayRepresentation(title: "\(name)", subtitle: "\(departmentName)")
    }

    init(stage: HarvestSchoolStage) {
        self.id = stage.key
        self.name = stage.name ?? ""
        self.departmentName = stage.departmentName ?? ""
        self.sectionTitle = stage.sectionTitle ?? ""
        self.minimumAge = stage.minimumAge
        self.tuitionFees = stage.tuitionFees
        self.isOffered = stage.isOffered ?? true
        self.routePath = stage.routePath
    }
}

struct SchoolStageQuery: EntityStringQuery {

    func entities(for identifiers: [String]) async throws -> [SchoolStageEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        let wanted = Set(identifiers)

        return (knowledge.stages ?? []).filter { wanted.contains($0.key) }.map { SchoolStageEntity(stage: $0) }
    }

    func entities(matching string: String) async throws -> [SchoolStageEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        return (knowledge.stages ?? [])
            .filter { HarvestAssistantContext.matches([$0.name ?? "", $0.departmentName ?? "", $0.sectionTitle ?? ""], terms: [string]) }
            .map { SchoolStageEntity(stage: $0) }
    }

    func suggestedEntities() async throws -> [SchoolStageEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        return (knowledge.stages ?? []).filter { $0.isOffered ?? true }.prefix(10).map { SchoolStageEntity(stage: $0) }
    }
}

struct AcademicEventEntity: AppEntity, Identifiable {

    static var typeDisplayRepresentation: TypeDisplayRepresentation { "Academic Event" }

    static var defaultQuery: AcademicEventQuery { AcademicEventQuery() }

    var id: String
    var title: String
    var startDate: Date?
    var endDate: Date?
    var calendarLabel: String
    var routePath: String?

    var displayRepresentation: DisplayRepresentation {
        guard let startDate = startDate else {
            return DisplayRepresentation(title: "\(title)")
        }

        let formatted = DateFormatter.harvestEventFormatter.string(from: startDate)

        return DisplayRepresentation(title: "\(title)", subtitle: "\(formatted) — \(calendarLabel)")
    }

    init(event: HarvestAcademicEvent) {
        self.id = event.id
        self.title = event.title ?? ""
        self.startDate = event.startDate.map { Date(timeIntervalSince1970: $0 / 1000) }
        self.endDate = event.endDate.map { Date(timeIntervalSince1970: $0 / 1000) }
        self.calendarLabel = event.calendarLabel ?? ""
        self.routePath = event.routePath
    }
}

struct AcademicEventQuery: EntityStringQuery {

    func entities(for identifiers: [String]) async throws -> [AcademicEventEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        let wanted = Set(identifiers)

        return (knowledge.events ?? []).filter { wanted.contains($0.id) }.map { AcademicEventEntity(event: $0) }
    }

    func entities(matching string: String) async throws -> [AcademicEventEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        return (knowledge.events ?? [])
            .filter { HarvestAssistantContext.matches([$0.title ?? "", $0.calendarLabel ?? ""], terms: [string]) }
            .prefix(25)
            .map { AcademicEventEntity(event: $0) }
    }

    func suggestedEntities() async throws -> [AcademicEventEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        let now = Date().timeIntervalSince1970 * 1000

        return (knowledge.events ?? [])
            .filter { ($0.startDate ?? 0) >= now }
            .prefix(10)
            .map { AcademicEventEntity(event: $0) }
    }
}

struct AppPageEntity: AppEntity, Identifiable {

    static var typeDisplayRepresentation: TypeDisplayRepresentation { "School Page" }

    static var defaultQuery: AppPageQuery { AppPageQuery() }

    var id: String
    var title: String
    var keywords: [String]
    var routePath: String

    var displayRepresentation: DisplayRepresentation {
        return DisplayRepresentation(title: "\(title)")
    }

    init(page: HarvestAppPage) {
        self.id = page.id
        self.title = page.title ?? ""
        self.keywords = page.keywords ?? []
        self.routePath = page.routePath ?? "/home"
    }
}

struct AppPageQuery: EntityStringQuery {

    func entities(for identifiers: [String]) async throws -> [AppPageEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        let wanted = Set(identifiers)

        return (knowledge.pages ?? []).filter { wanted.contains($0.id) }.map { AppPageEntity(page: $0) }
    }

    func entities(matching string: String) async throws -> [AppPageEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        return (knowledge.pages ?? [])
            .filter { page in
                var haystack: [String] = [page.title ?? ""]

                haystack.append(contentsOf: page.keywords ?? [])

                return HarvestAssistantContext.matches(haystack, terms: [string])
            }
            .map { AppPageEntity(page: $0) }
    }

    func suggestedEntities() async throws -> [AppPageEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        return (knowledge.pages ?? []).prefix(12).map { AppPageEntity(page: $0) }
    }
}

struct SchoolDepartmentEntity: AppEntity, Identifiable {

    static var typeDisplayRepresentation: TypeDisplayRepresentation { "School Department" }

    static var defaultQuery: SchoolDepartmentQuery { SchoolDepartmentQuery() }

    var id: String
    var name: String
    var contactNumber: String
    var isAcademic: Bool
    var routePath: String?

    var displayRepresentation: DisplayRepresentation {
        return DisplayRepresentation(title: "\(name)")
    }

    init(department: HarvestSchoolDepartment) {
        self.id = department.key
        self.name = department.name ?? ""
        self.contactNumber = department.contactNumber ?? ""
        self.isAcademic = department.isAcademic ?? false
        self.routePath = department.routePath
    }
}

struct SchoolDepartmentQuery: EntityStringQuery, EnumerableEntityQuery {

    func allEntities() async throws -> [SchoolDepartmentEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        return (knowledge.departments ?? []).map { SchoolDepartmentEntity(department: $0) }
    }

    func entities(for identifiers: [String]) async throws -> [SchoolDepartmentEntity] {
        let wanted = Set(identifiers)

        return try await allEntities().filter { wanted.contains($0.id) }
    }

    func entities(matching string: String) async throws -> [SchoolDepartmentEntity] {
        return try await allEntities().filter { HarvestAssistantContext.matches([$0.name, $0.id], terms: [string]) }
    }
}

struct SchoolStaffEntity: AppEntity, Identifiable {

    static var typeDisplayRepresentation: TypeDisplayRepresentation { "School Staff Member" }

    static var defaultQuery: SchoolStaffQuery { SchoolStaffQuery() }

    var id: String
    var name: String
    var position: String
    var subject: String
    var departmentName: String
    var routePath: String?

    var displayRepresentation: DisplayRepresentation {
        let detail = subject.isEmpty ? position : "\(position) - \(subject)"

        return DisplayRepresentation(title: "\(name)", subtitle: "\(detail), \(departmentName)")
    }

    init(member: HarvestStaffMember, department: HarvestStaffDepartment, index: Int) {
        self.id = "staff.\(department.departmentKey).\(index)"
        self.name = member.name ?? ""
        self.position = member.position ?? ""
        self.subject = member.subject ?? ""
        self.departmentName = department.departmentName ?? ""
        self.routePath = department.routePath
    }
}

struct SchoolStaffQuery: EntityStringQuery {

    func allEntities() async throws -> [SchoolStaffEntity] {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return []
        }

        var entities: [SchoolStaffEntity] = []

        for department in knowledge.staff ?? [] {
            var index = 0

            for member in department.highlights ?? [] {
                entities.append(SchoolStaffEntity(member: member, department: department, index: index))
                index += 1
            }

            for member in department.members ?? [] {
                entities.append(SchoolStaffEntity(member: member, department: department, index: index))
                index += 1
            }
        }

        return entities
    }

    func entities(for identifiers: [String]) async throws -> [SchoolStaffEntity] {
        let wanted = Set(identifiers)

        return try await allEntities().filter { wanted.contains($0.id) }
    }

    func entities(matching string: String) async throws -> [SchoolStaffEntity] {
        let terms = string.split(separator: " ").map(String.init).filter { !$0.isEmpty }

        return try await allEntities().filter {
            HarvestAssistantContext.matches([$0.name, $0.position, $0.subject, $0.departmentName], terms: terms)
        }
    }
}

struct SchoolCalendarEntity: AppEntity, Identifiable {

    static let allCalendars: [SchoolCalendarEntity] = [
        SchoolCalendarEntity(id: "national", label: "National"),
        SchoolCalendarEntity(id: "british", label: "British"),
        SchoolCalendarEntity(id: "american", label: "American"),
        SchoolCalendarEntity(id: "national-kg", label: "National KG"),
        SchoolCalendarEntity(id: "british-kg", label: "British KG"),
        SchoolCalendarEntity(id: "american-kg", label: "American KG"),
    ]

    static var typeDisplayRepresentation: TypeDisplayRepresentation { "School Calendar" }

    static var defaultQuery: SchoolCalendarQuery { SchoolCalendarQuery() }

    var id: String

    var label: String

    var displayRepresentation: DisplayRepresentation {
        return DisplayRepresentation(title: "\(label)")
    }
}

struct SchoolCalendarQuery: EntityStringQuery, EnumerableEntityQuery {

    func allEntities() async throws -> [SchoolCalendarEntity] {
        return SchoolCalendarEntity.allCalendars
    }

    func entities(for identifiers: [String]) async throws -> [SchoolCalendarEntity] {
        let wanted = Set(identifiers)

        return SchoolCalendarEntity.allCalendars.filter { wanted.contains($0.id) }
    }

    func entities(matching string: String) async throws -> [SchoolCalendarEntity] {
        return SchoolCalendarEntity.allCalendars.filter { HarvestAssistantContext.matches([$0.label, $0.id], terms: [string]) }
    }
}

extension DateFormatter {

    static let harvestEventFormatter: DateFormatter = {
        let formatter = DateFormatter()

        formatter.dateStyle = .medium
        formatter.timeStyle = .none

        return formatter
    }()
}
