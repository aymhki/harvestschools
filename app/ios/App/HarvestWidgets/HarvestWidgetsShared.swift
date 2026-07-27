import Foundation



let harvestAppGroupIdentifier = "group.com.harvestschools.app"

let harvestQuickActionsKey = "harvest_quick_actions"

let harvestUniversalLinkHost = "https://harvestschools.com"


struct HarvestQuickAction: Codable, Identifiable, Hashable {

    let id: String

    let label: String

    let path: String

    let iconPath: String

    var destinationURL: URL {
        URL(string: harvestUniversalLinkHost + path) ?? URL(string: harvestUniversalLinkHost)!
    }
}


struct HarvestQuickActionsPayload: Codable {

    let title: String

    let language: String

    let isRightToLeft: Bool

    let iconViewport: Double

    let actions: [HarvestQuickAction]

    static let placeholder = HarvestQuickActionsPayload(
        title: "Quick actions",
        language: "en",
        isRightToLeft: false,
        iconViewport: 24,
        actions: [
            HarvestQuickAction(
                id: "calendars",
                label: "Calendars",
                path: "/events",
                iconPath: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 16H5V10h14zm0-12H5V6h14zM9 14H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zm-8 4H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2z"
            ),
            HarvestQuickAction(
                id: "booking",
                label: "Graduation booking",
                path: "/events/graduation-booking",
                iconPath: "M11 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2M5 18c.2-.63 2.57-1.68 4.96-1.94l2.04-2c-.39-.04-.68-.06-1-.06-2.67 0-8 1.34-8 4v2h9l-2-2zm15.6-5.5-5.13 5.17-2.07-2.08L12 17l3.47 3.5L22 13.91z"
            ),
            HarvestQuickAction(
                id: "admission",
                label: "Admission",
                path: "/admission",
                iconPath: "M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9zm6.82 6L12 12.72 5.18 9 12 5.28zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73z"
            ),
            HarvestQuickAction(
                id: "gallery",
                label: "Gallery",
                path: "/gallery",
                iconPath: "M20 4v12H8V4zm0-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-8.5 9.67 1.69 2.26 2.48-3.1L19 15H9zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6z"
            )
        ]
    )

    static func load() -> HarvestQuickActionsPayload {
        let defaults = UserDefaults(suiteName: harvestAppGroupIdentifier)

        let stored = defaults?.string(forKey: harvestQuickActionsKey)

        let data = stored?.data(using: .utf8)

        let decoded = data.flatMap { try? JSONDecoder().decode(HarvestQuickActionsPayload.self, from: $0) }

        guard let payload = decoded, !payload.actions.isEmpty else {
            return .placeholder
        }

        return payload
    }
}
