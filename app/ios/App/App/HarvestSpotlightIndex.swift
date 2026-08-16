import Foundation
import CoreSpotlight
import UniformTypeIdentifiers

enum HarvestSpotlightIndex {

    private static let itemIdentifier = "com.harvestschools.app.spotlight.app"

    private static let domainIdentifier = "com.harvestschools.app"

    private static let searchTerms = [
        "Harvest",
        "Harvest School",
        "Harvest Schools",
        "Harvest International School",
        "Harvest International Schools",
        "HIS",
        "H.I.S.",
        "School",
        "Schools",
        "هارفست",
        "هارفيست",
        "هارڤست",
        "مدرسة",
        "مدارس",
        "مدرسة هارفست",
        "مدارس هارفست",
        "مدارس هارفست الدولية",
        "SchoolEverywhere",
        "School Every Where",
        "سكول ايفري وير",
        "سكول ايڤري وير"
    ]

    static func register() {
        let attributes = CSSearchableItemAttributeSet(contentType: UTType.item)

        attributes.title = "Harvest International Schools"
        attributes.displayName = "Harvest International Schools"
        attributes.alternateNames = searchTerms
        attributes.contentDescription = "Calendars, admission, event booking and the SchoolEverywhere portal."
        attributes.keywords = searchTerms

        let item = CSSearchableItem(
            uniqueIdentifier: itemIdentifier,
            domainIdentifier: domainIdentifier,
            attributeSet: attributes
        )

        item.expirationDate = Date.distantFuture

        CSSearchableIndex.default().indexSearchableItems([item]) { error in
            if let error = error {
                print("[harvest] Could not index the app for search: \(error.localizedDescription)")
            }
        }
    }
}
