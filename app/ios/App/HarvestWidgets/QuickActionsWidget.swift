import WidgetKit
import SwiftUI
import UIKit


private let tileCornerRadius: CGFloat = 16
private let tileSpacing: CGFloat = 6
private let widgetPadding: CGFloat = 8
private let tileGlowRadius: CGFloat = 4
private let harvestNavyUIColor = UIColor(red: 0x1F / 255.0, green: 0x21 / 255.0, blue: 0x52 / 255.0, alpha: 1)
private let harvestDarkSurfaceUIColor = UIColor(red: 0x24 / 255.0, green: 0x24 / 255.0, blue: 0x25 / 255.0, alpha: 1)

private func harvestDynamicColor(light: UIColor, dark: UIColor) -> Color {
    Color(UIColor { traits in
        traits.userInterfaceStyle == .dark ? dark : light
    })
}

private let harvestSurfaceColor = harvestDynamicColor(light: .white, dark: harvestDarkSurfaceUIColor)

private let harvestContentColor = harvestDynamicColor(light: harvestNavyUIColor, dark: .white)
private let harvestGlowColor = harvestDynamicColor(light: harvestNavyUIColor, dark: .white)


private enum HarvestFont {

    static func label(for language: String, size: CGFloat) -> Font {
        Font.custom(language == "ar" ? "ArianLT-Regular" : "FuturaLT", size: size)
    }

    static func title(for language: String, size: CGFloat) -> Font {
        Font.custom(language == "ar" ? "ArianLT-Demi" : "FuturaLT-Bold", size: size)
    }
}


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


struct QuickActionsGridPlan {

    let columns: Int
    let rows: Int

    static func make(count: Int, width: CGFloat, height: CGFloat, maximumColumns: Int) -> QuickActionsGridPlan {
        guard count > 0, width > 0, height > 0 else {
            return QuickActionsGridPlan(columns: 1, rows: 1)
        }

        let idealColumns = (Double(count) * Double(width) / Double(height)).squareRoot().rounded()

        let columns = min(max(Int(idealColumns), 1), min(count, maximumColumns))

        let rows = Int((Double(count) / Double(columns)).rounded(.up))

        return QuickActionsGridPlan(columns: columns, rows: max(rows, 1))
    }
}


private struct QuickActionTile: View {

    let action: HarvestQuickAction

    let language: String

    let iconViewport: Double

    let tileSize: CGSize

    private var iconSize: CGFloat {
        min(max(min(tileSize.width, tileSize.height) * 0.34, 18), 64)
    }

    private var labelSize: CGFloat {
        min(max(min(tileSize.width, tileSize.height) * 0.14, 9), 20)
    }

    private var cornerRadius: CGFloat {
        min(max(min(tileSize.width, tileSize.height) * 0.16, 12), 28)
    }

    var body: some View {
        Link(destination: action.destinationURL) {
            VStack(spacing: labelSize * 0.45) {
                HarvestIconShape(pathData: action.iconPath, viewport: iconViewport)
                    .fill(harvestContentColor)
                    .frame(width: iconSize, height: iconSize)

                Text(action.label)
                    .font(HarvestFont.label(for: language, size: labelSize))
                    .foregroundStyle(harvestContentColor)
                    .multilineTextAlignment(.center)
                    .minimumScaleFactor(0.6)
                    .lineLimit(2)
            }
            .padding(labelSize * 0.5)
            .frame(width: tileSize.width, height: tileSize.height)
            .background(harvestSurfaceColor, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .shadow(color: harvestGlowColor.opacity(0.45), radius: tileGlowRadius)
        }
    }
}


private struct QuickActionsGrid: View {

    let payload: HarvestQuickActionsPayload

    let maximumColumns: Int

    var body: some View {
        GeometryReader { proxy in
            let plan = QuickActionsGridPlan.make(
                count: payload.actions.count,
                width: proxy.size.width,
                height: proxy.size.height,
                maximumColumns: maximumColumns
            )

            let tileWidth = (proxy.size.width - tileSpacing * CGFloat(plan.columns - 1)) / CGFloat(plan.columns)

            let tileHeight = (proxy.size.height - tileSpacing * CGFloat(plan.rows - 1)) / CGFloat(plan.rows)

            let tileSize = CGSize(width: max(tileWidth, 1), height: max(tileHeight, 1))

            VStack(spacing: tileSpacing) {
                ForEach(0..<plan.rows, id: \.self) { row in
                    HStack(spacing: tileSpacing) {
                        ForEach(rowActions(for: row, columns: plan.columns)) { action in
                            QuickActionTile(
                                action: action,
                                language: payload.language,
                                iconViewport: payload.iconViewport,
                                tileSize: tileSize
                            )
                        }
                    }
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
    }

    private func rowActions(for row: Int, columns: Int) -> [HarvestQuickAction] {
        let start = row * columns
        let end = min(start + columns, payload.actions.count)
        return start < end ? Array(payload.actions[start..<end]) : []
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

                if let action = payload.actions.first {
                    HarvestIconShape(pathData: action.iconPath, viewport: payload.iconViewport)
                        .fill(.primary)
                        .frame(width: 22, height: 22)
                }
            }
        case .accessoryInline:
            Text(payload.actions.first?.label ?? payload.title)
        default:
            HStack(spacing: 12) {
                ForEach(payload.actions.prefix(4)) { action in
                    Link(destination: action.destinationURL) {
                        HarvestIconShape(pathData: action.iconPath, viewport: payload.iconViewport)
                            .fill(.primary)
                            .frame(width: 20, height: 20)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}


struct QuickActionsWidgetView: View {

    @Environment(\.widgetFamily) private var family

    let entry: QuickActionsEntry

    private var layout: (maximumColumns: Int, limit: Int) {
        switch family {
        case .systemSmall:
            return (2, 4)
        case .systemMedium:
            return (4, 8)
        case .systemLarge:
            return (4, 16)
        default:
            return (6, 24)
        }
    }

    private var isAccessory: Bool {
        family == .accessoryCircular || family == .accessoryInline || family == .accessoryRectangular
    }

    private var visiblePayload: HarvestQuickActionsPayload {
        HarvestQuickActionsPayload(
            title: entry.payload.title,
            language: entry.payload.language,
            isRightToLeft: entry.payload.isRightToLeft,
            iconViewport: entry.payload.iconViewport,
            actions: Array(entry.payload.actions.prefix(layout.limit))
        )
    }

    var body: some View {
        Group {
            if isAccessory {
                QuickActionsAccessoryView(payload: entry.payload, family: family)
            } else {
                QuickActionsGrid(payload: visiblePayload, maximumColumns: layout.maximumColumns)
            }
        }
        .padding(isAccessory ? 0 : widgetPadding)
        .environment(\.layoutDirection, entry.payload.isRightToLeft ? .rightToLeft : .leftToRight)
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
        .contentMarginsDisabled()
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
