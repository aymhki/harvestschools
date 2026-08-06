import Foundation

let harvestAssistantMetaKey = "harvest_assistant_meta"

let harvestAssistantKnowledgeDirectoryName = "HarvestAssistant"

let harvestAssistantSchemaVersion = 1

extension Notification.Name {

    static let harvestAssistantKnowledgeUpdated = Notification.Name("HarvestAssistantKnowledgeUpdated")
}

struct HarvestAssistantMeta: Codable {
    let language: String
    let schemaVersion: Int
    let contentHash: String
    let generatedAt: String?
    let storedAt: Double
}

struct HarvestSchoolProfile: Codable {
    let name: String?
    let address: String?
    let phone: [String]?
    let email: String?
    let website: String?
    let workingHours: String?
    let mapsUrl: String?
    let currency: String?
}

struct HarvestSchoolDepartment: Codable {
    let key: String
    let name: String?
    let contactNumber: String?
    let isAcademic: Bool?
    let routePath: String?
}

struct HarvestSchoolStage: Codable {
    let key: String
    let departmentKey: String?
    let departmentName: String?
    let sectionKey: String?
    let sectionTitle: String?
    let name: String?
    let isOffered: Bool?
    let minimumAge: String?
    let tuitionFees: Int?
    let routePath: String?
}

struct HarvestSchoolFact: Codable {
    let id: String
    let category: String?
    let topic: String?
    let answer: String?
    let keywords: [String]?
    let routePath: String?
    let source: String?
    let sourceKey: String?
}

struct HarvestAcademicEvent: Codable {
    let id: String
    let title: String?
    let startDate: Double?
    let rawStartDate: String?
    let endDate: Double?
    let calendarId: String?
    let calendarLabel: String?
    let routePath: String?
    let isMultiDay: Bool?
}

struct HarvestAppPage: Codable {
    let id: String
    let title: String?
    let routePath: String?
    let keywords: [String]?
    let section: String?
}

struct HarvestStaffMember: Codable {
    let name: String?
    let position: String?
    let subject: String?
}

struct HarvestStaffDepartment: Codable {
    let departmentKey: String
    let departmentName: String?
    let routePath: String?
    let highlights: [HarvestStaffMember]?
    let members: [HarvestStaffMember]?
    let memberCount: Int?
    let lastUpdated: Double?
}

struct HarvestSchoolKnowledge: Codable {
    let schemaVersion: Int
    let generatedAt: String?
    let contentHash: String
    let language: String
    let school: HarvestSchoolProfile?
    let departments: [HarvestSchoolDepartment]?
    let stages: [HarvestSchoolStage]?
    let facts: [HarvestSchoolFact]?
    let events: [HarvestAcademicEvent]?
    let pages: [HarvestAppPage]?
    let staff: [HarvestStaffDepartment]?
}

enum HarvestAssistantStore {
    static let supportedLanguages = ["en", "ar"]

    static func normalisedLanguage(_ value: String?) -> String {
        return (value ?? "").lowercased() == "ar" ? "ar" : "en"
    }

    static func sharedDefaults() -> UserDefaults? {
        return UserDefaults(suiteName: harvestAppGroupIdentifier)
    }

    static func knowledgeDirectory() -> URL? {
        guard let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: harvestAppGroupIdentifier) else {
            return nil
        }

        let directory = container.appendingPathComponent(harvestAssistantKnowledgeDirectoryName, isDirectory: true)

        if !FileManager.default.fileExists(atPath: directory.path) {
            try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        }

        return directory
    }

    static func knowledgeFileURL(language: String) -> URL? {
        return knowledgeDirectory()?.appendingPathComponent("knowledge-\(normalisedLanguage(language)).json")
    }

    @discardableResult
    static func save(language: String, payload: String) -> Bool {
        let normalised = normalisedLanguage(language)

        guard let fileURL = knowledgeFileURL(language: normalised) else {
            return false
        }

        guard let data = payload.data(using: .utf8) else {
            return false
        }

        do {
            try data.write(to: fileURL, options: .atomic)
        } catch {
            return false
        }

        if let decoded = try? JSONDecoder().decode(HarvestSchoolKnowledge.self, from: data) {
            let meta = HarvestAssistantMeta(
                language: normalised,
                schemaVersion: decoded.schemaVersion,
                contentHash: decoded.contentHash,
                generatedAt: decoded.generatedAt,
                storedAt: Date().timeIntervalSince1970
            )

            if let encodedMeta = try? JSONEncoder().encode(meta), let metaString = String(data: encodedMeta, encoding: .utf8) {
                sharedDefaults()?.set(metaString, forKey: "\(harvestAssistantMetaKey)_\(normalised)")
            }
        }

        return true
    }

    static func storedMeta(language: String) -> HarvestAssistantMeta? {
        let normalised = normalisedLanguage(language)

        guard let raw = sharedDefaults()?.string(forKey: "\(harvestAssistantMetaKey)_\(normalised)") else {
            return nil
        }

        guard let data = raw.data(using: .utf8) else {
            return nil
        }

        return try? JSONDecoder().decode(HarvestAssistantMeta.self, from: data)
    }

    static func storedKnowledge(language: String) -> HarvestSchoolKnowledge? {
        guard let fileURL = knowledgeFileURL(language: language) else {
            return nil
        }

        guard let data = try? Data(contentsOf: fileURL) else {
            return nil
        }

        guard let decoded = try? JSONDecoder().decode(HarvestSchoolKnowledge.self, from: data) else {
            return nil
        }

        return decoded.schemaVersion == harvestAssistantSchemaVersion ? decoded : nil
    }

    static func clear() {
        for language in supportedLanguages {
            if let fileURL = knowledgeFileURL(language: language) {
                try? FileManager.default.removeItem(at: fileURL)
            }

            sharedDefaults()?.removeObject(forKey: "\(harvestAssistantMetaKey)_\(language)")
        }
    }

    static func remoteKnowledgeURL(language: String) -> URL? {
        var components = URLComponents(string: "\(harvestUniversalLinkHost)/scripts/Public/SchoolInfo/getPublicSchoolInfo.php")

        components?.queryItems = [URLQueryItem(name: "lang", value: normalisedLanguage(language))]

        return components?.url
    }

    static func fetchRemoteKnowledge(language: String, timeout: TimeInterval = 6) async -> HarvestSchoolKnowledge? {
        guard let url = remoteKnowledgeURL(language: language) else {
            return nil
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = timeout
        request.cachePolicy = .reloadRevalidatingCacheData
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        guard let (data, response) = try? await URLSession.shared.data(for: request) else {
            return nil
        }

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            return nil
        }

        guard let envelope = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }

        guard let payload = envelope["data"], let payloadData = try? JSONSerialization.data(withJSONObject: payload) else {
            return nil
        }

        let decoded = try? JSONDecoder().decode(HarvestSchoolKnowledge.self, from: payloadData)

        if let decoded = decoded, decoded.schemaVersion == harvestAssistantSchemaVersion,
           let payloadString = String(data: payloadData, encoding: .utf8) {
            save(language: language, payload: payloadString)
        }

        return decoded
    }

    static func knowledge(language: String) async -> HarvestSchoolKnowledge? {
        if let stored = storedKnowledge(language: language) {
            return stored
        }

        return await fetchRemoteKnowledge(language: language)
    }

    static func preferredLanguage() -> String {
        let preferred = Locale.preferredLanguages.first ?? "en"

        return preferred.lowercased().hasPrefix("ar") ? "ar" : "en"
    }
}
