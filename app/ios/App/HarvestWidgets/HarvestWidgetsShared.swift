import Foundation

/* The app writes this payload into the shared app group whenever the language or
 * the chosen actions change, so the widget only has to read and draw it: no
 * network, no refresh logic and nothing to keep in sync on a timer. */

let harvestAppGroupIdentifier = "group.com.harvestschools.app"

let harvestQuickActionsKey = "harvest_quick_actions"

let harvestDeepLinkScheme = "harvestapp"


struct HarvestQuickAction: Codable, Identifiable, Hashable {

    let id: String

    let label: String

    let icon: String

    let path: String

    var deepLinkURL: URL? {
        var components = URLComponents()

        components.scheme = harvestDeepLinkScheme
        components.host = "open"
        components.queryItems = [URLQueryItem(name: "path", value: path)]

        return components.url
    }
}


struct HarvestQuickActionsPayload: Codable {

    let title: String

    let isRightToLeft: Bool

    let actions: [HarvestQuickAction]

    static let placeholder = HarvestQuickActionsPayload(
        title: "Quick actions",
        isRightToLeft: false,
        actions: [
            HarvestQuickAction(id: "calendars", label: "Calendars", icon: "🗓️", path: "/events"),
            HarvestQuickAction(id: "booking", label: "Graduation booking", icon: "🎓", path: "/events/graduation-booking"),
            HarvestQuickAction(id: "admission", label: "Admission", icon: "📝", path: "/admission"),
            HarvestQuickAction(id: "gallery", label: "Gallery", icon: "🖼️", path: "/gallery")
        ]
    )

    static func load() -> HarvestQuickActionsPayload {
        let defaults = UserDefaults(suiteName: harvestAppGroupIdentifier)

        let stored = defaults?.string(forKey: harvestQuickActionsKey)

        let data = stored?.data(using: .utf8)

        let decoded = data.flatMap { try? JSONDecoder().decode(HarvestQuickActionsPayload.self, from: $0) }

        return (decoded?.actions.isEmpty == false) ? decoded! : .placeholder
    }
}
