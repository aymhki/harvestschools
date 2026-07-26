import WidgetKit
import SwiftUI
import UIKit


private let tileCornerRadius: CGFloat = 14
private let tileSpacing: CGFloat = 8


private let harvestNavyUIColor = UIColor(red: 0x1F / 255.0, green: 0x21 / 255.0, blue: 0x52 / 255.0, alpha: 1)
private let harvestDarkSurfaceUIColor = UIColor(red: 0x24 / 255.0, green: 0x24 / 255.0, blue: 0x25 / 255.0, alpha: 1)

private func harvestDynamicColor(light: UIColor, dark: UIColor) -> Color {
    Color(UIColor { traits in
        traits.userInterfaceStyle == .dark ? dark : light
    })
}

private let harvestSurfaceColor = harvestDynamicColor(light: .white, dark: harvestDarkSurfaceUIColor)

private let harvestCardTextColor = harvestDynamicColor(light: harvestNavyUIColor, dark: .white)

private let harvestCardGlowColor = harvestDynamicColor(light: harvestNavyUIColor, dark: .white)


struct QuickActionsEntry: TimelineEntry {

    let date: Date

    let payload: HarvestQuickActionsPayload
}


struct QuickActionsProvider: TimelineProvider {

    func placeholder(in context: Context) -> QuickActionsEntry {
        QuickActionsEntry(date: Date(), payload: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (QuickActionsEntry) -> Void) {
        completion(QuickActionsEntry(date: Date(), payload: HarvestQuickActionsPayload.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuickActionsEntry>) -> Void) {
        let entry = QuickActionsEntry(date: Date(), payload: HarvestQuickActionsPayload.load())
        completion(Timeline(entries: [entry], policy: .never))
    }
}


private struct QuickActionTile: View {

    let action: HarvestQuickAction

    let iconSize: CGFloat

    let labelSize: CGFloat

    var body: some View {
        Link(destination: action.deepLinkURL ?? URL(string: "\(harvestDeepLinkScheme)://open")!) {
            VStack(spacing: 4) {
                Text(action.icon)
                    .font(.system(size: iconSize))

                Text(action.label)
                    .font(.system(size: labelSize, weight: .semibold))
                    .foregroundStyle(harvestCardTextColor)
                    .multilineTextAlignment(.center)
                    .minimumScaleFactor(0.7)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(4)
            .background(harvestSurfaceColor, in: RoundedRectangle(cornerRadius: tileCornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: tileCornerRadius, style: .continuous)
                    .strokeBorder(harvestCardGlowColor.opacity(0.35), lineWidth: 1)
            )
        }
    }
}


private struct QuickActionsGrid: View {

    let actions: [HarvestQuickAction]

    let columns: Int

    let iconSize: CGFloat

    let labelSize: CGFloat

    var body: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: tileSpacing), count: columns),
            spacing: tileSpacing
        ) {
            ForEach(actions) { action in
                QuickActionTile(action: action, iconSize: iconSize, labelSize: labelSize)
            }
        }
    }
}


private struct QuickActionsAccessoryView: View {

    let payload: HarvestQuickActionsPayload

    let family: WidgetFamily

    var body: some View {
        switch family {
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()

                Text(payload.actions.first?.icon ?? "🏫")
                    .font(.system(size: 22))
            }
        case .accessoryInline:
            Text(payload.actions.first?.label ?? payload.title)
        default:
            VStack(alignment: .leading, spacing: 2) {
                Text(payload.title)
                    .font(.headline)

                ForEach(payload.actions.prefix(2)) { action in
                    Text("\(action.icon) \(action.label)")
                        .font(.caption)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}


struct QuickActionsWidgetView: View {

    @Environment(\.widgetFamily) private var family

    let entry: QuickActionsEntry

    private var layout: (columns: Int, limit: Int, iconSize: CGFloat, labelSize: CGFloat) {
        switch family {
        case .systemSmall:
            return (2, 4, 20, 9)
        case .systemMedium:
            return (4, 8, 22, 9)
        case .systemLarge:
            return (4, 16, 26, 10)
        default:
            return (6, 18, 26, 10)
        }
    }

    private var isAccessory: Bool {
        family == .accessoryCircular || family == .accessoryInline || family == .accessoryRectangular
    }

    var body: some View {
        Group {
            if isAccessory {
                QuickActionsAccessoryView(payload: entry.payload, family: family)
            } else {
                QuickActionsGrid(
                    actions: Array(entry.payload.actions.prefix(layout.limit)),
                    columns: layout.columns,
                    iconSize: layout.iconSize,
                    labelSize: layout.labelSize
                )
            }
        }
        .environment(\.layoutDirection, entry.payload.isRightToLeft ? .rightToLeft : .leftToRight)
        .widgetURL(URL(string: "\(harvestDeepLinkScheme)://open"))
        .containerBackground(for: .widget) {
            isAccessory ? Color.clear : harvestSurfaceColor
        }
    }
}


struct QuickActionsWidget: Widget {

    let kind = "HarvestQuickActions"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuickActionsProvider()) { entry in
            QuickActionsWidgetView(entry: entry)
        }
        .configurationDisplayName("Quick actions")
        .description("Jump straight to the parts of the school app you use the most.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .systemExtraLarge,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}
