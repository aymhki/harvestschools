import Foundation
import AppIntents
import CoreSpotlight

@available(iOS 18.0, *)
extension SchoolFactEntity: IndexedEntity {

    var attributeSet: CSSearchableItemAttributeSet {
        let attributes = defaultAttributeSet

        attributes.title = topic
        attributes.contentDescription = answer
        attributes.keywords = keywords

        return attributes
    }
}

@available(iOS 18.0, *)
extension SchoolStageEntity: IndexedEntity {

    var attributeSet: CSSearchableItemAttributeSet {
        let attributes = defaultAttributeSet

        attributes.title = name
        attributes.contentDescription = [departmentName, sectionTitle, minimumAge].compactMap { $0 }.joined(separator: " · ")
        attributes.keywords = [name, departmentName, sectionTitle].filter { !$0.isEmpty }

        return attributes
    }
}

@available(iOS 18.0, *)
extension AcademicEventEntity: IndexedEntity {

    var attributeSet: CSSearchableItemAttributeSet {
        let attributes = defaultAttributeSet

        attributes.title = title
        attributes.contentDescription = calendarLabel
        attributes.startDate = startDate
        attributes.endDate = endDate
        attributes.keywords = [title, calendarLabel].filter { !$0.isEmpty }

        return attributes
    }
}

@available(iOS 18.0, *)
extension AppPageEntity: IndexedEntity {

    var attributeSet: CSSearchableItemAttributeSet {
        let attributes = defaultAttributeSet

        attributes.title = title
        attributes.keywords = keywords

        return attributes
    }
}

extension SchoolStaffEntity: IndexedEntity {

    var attributeSet: CSSearchableItemAttributeSet {
        let attributes = defaultAttributeSet

        attributes.title = name
        attributes.contentDescription = subject.isEmpty ? position : "\(position) - \(subject)"
        attributes.keywords = [position, subject, departmentName].filter { !$0.isEmpty }

        return attributes
    }
}

enum HarvestAssistantIndexer {

    static let indexedIdentifiersKey = "harvest_assistant_indexed_identifiers"

    static func start() {
        NotificationCenter.default.addObserver(
            forName: .harvestAssistantKnowledgeUpdated,
            object: nil,
            queue: .main
        ) { _ in
            Task {
                await reindexIfAvailable()
            }
        }

        NotificationCenter.default.addObserver(
            forName: NSLocale.currentLocaleDidChangeNotification,
            object: nil,
            queue: .main
        ) { _ in
            Task {
                await reindexIfAvailable()
            }
        }
    }

    static func reindexIfAvailable() async {
        guard #available(iOS 18.0, *) else {
            return
        }

        await reindex()
    }

    @available(iOS 18.0, *)
    static func reindex() async {
        guard let knowledge = await HarvestAssistantContext.knowledge() else {
            return
        }

        let index = CSSearchableIndex.default()

        let facts = (knowledge.facts ?? []).map { SchoolFactEntity(fact: $0) }
        let stages = (knowledge.stages ?? []).map { SchoolStageEntity(stage: $0) }
        let events = (knowledge.events ?? []).map { AcademicEventEntity(event: $0) }
        let pages = (knowledge.pages ?? []).map { AppPageEntity(page: $0) }
        let staff = (try? await SchoolStaffQuery().allEntities()) ?? []

        let currentIdentifiers: [String: [String]] = [
            "facts": facts.map { $0.id },
            "stages": stages.map { $0.id },
            "events": events.map { $0.id },
            "pages": pages.map { $0.id },
            "staff": staff.map { $0.id },
        ]

        let previousIdentifiers = storedIdentifiers()

        await deleteRemoved(index: index, kind: "facts", previous: previousIdentifiers, current: currentIdentifiers, type: SchoolFactEntity.self)
        await deleteRemoved(index: index, kind: "stages", previous: previousIdentifiers, current: currentIdentifiers, type: SchoolStageEntity.self)
        await deleteRemoved(index: index, kind: "events", previous: previousIdentifiers, current: currentIdentifiers, type: AcademicEventEntity.self)
        await deleteRemoved(index: index, kind: "pages", previous: previousIdentifiers, current: currentIdentifiers, type: AppPageEntity.self)
        await deleteRemoved(index: index, kind: "staff", previous: previousIdentifiers, current: currentIdentifiers, type: SchoolStaffEntity.self)

        try? await index.indexAppEntities(facts)
        try? await index.indexAppEntities(stages)
        try? await index.indexAppEntities(events)
        try? await index.indexAppEntities(pages)
        try? await index.indexAppEntities(staff)

        storeIdentifiers(currentIdentifiers)
    }

    @available(iOS 18.0, *)
    private static func deleteRemoved<Entity: IndexedEntity>(
        index: CSSearchableIndex,
        kind: String,
        previous: [String: [String]],
        current: [String: [String]],
        type: Entity.Type
    ) async where Entity.ID == String {
        let currentSet = Set(current[kind] ?? [])
        let removed = (previous[kind] ?? []).filter { !currentSet.contains($0) }

        if removed.isEmpty {
            return
        }

        try? await index.deleteAppEntities(identifiedBy: removed, ofType: type)
    }

    private static func storedIdentifiers() -> [String: [String]] {
        guard let raw = HarvestAssistantStore.sharedDefaults()?.data(forKey: indexedIdentifiersKey) else {
            return [:]
        }

        return (try? JSONDecoder().decode([String: [String]].self, from: raw)) ?? [:]
    }

    private static func storeIdentifiers(_ identifiers: [String: [String]]) {
        guard let encoded = try? JSONEncoder().encode(identifiers) else {
            return
        }

        HarvestAssistantStore.sharedDefaults()?.set(encoded, forKey: indexedIdentifiersKey)
    }
}
