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

    static let widestTileAspect: CGFloat = 1.5

    static let tallestTileAspect: CGFloat = 0.9

    static let gapShare: CGFloat = 0.12

    static let smallestGap: CGFloat = 6

    static let largestGap: CGFloat = 26

    static let emptySlotPenalty = 0.035

    static let extraRowBonus = 0.004

    let columns: Int

    let rows: Int

    static func make(count: Int, width: CGFloat, height: CGFloat,
                     maximumColumns: Int, maximumRows: Int) -> QuickActionsGridPlan {
        guard count > 0, width > 0, height > 0 else {
            return QuickActionsGridPlan(columns: 1, rows: 1)
        }

        var bestPlan = QuickActionsGridPlan(columns: min(count, maximumColumns), rows: 1)

        var bestScore = -Double.greatestFiniteMagnitude

        for rows in 1...min(count, maximumRows) {
            let columns = Int((Double(count) / Double(rows)).rounded(.up))

            guard columns <= maximumColumns else {
                continue
            }

            let tile = tileSize(inCell: CGSize(width: width / CGFloat(columns), height: height / CGFloat(rows)))
            let coverage = Double(tile.width * tile.height) * Double(count) / Double(width * height)
            let score = coverage
                - Double(columns * rows - count) * emptySlotPenalty
                + Double(rows) * extraRowBonus

            if score > bestScore {
                bestScore = score

                bestPlan = QuickActionsGridPlan(columns: columns, rows: rows)
            }
        }

        return bestPlan
    }

    static func tileSize(inCell cell: CGSize) -> CGSize {
        let gap = min(max(min(cell.width, cell.height) * gapShare, smallestGap), largestGap)
        var width = max(cell.width - gap, 1)
        var height = max(cell.height - gap, 1)
        width = min(width, height * widestTileAspect)
        height = min(height, width / tallestTileAspect)
        return CGSize(width: width, height: height)
    }
}


private struct QuickActionTile: View {

    let action: HarvestQuickAction

    let language: String

    let iconViewport: Double

    let tileSize: CGSize

    private var iconSize: CGFloat {
        min(max(min(tileSize.width, tileSize.height) * 0.36, 18), 72)
    }

    private var labelSize: CGFloat {
        min(max(min(tileSize.width, tileSize.height) * 0.15, 9), 22)
    }

    private var cornerRadius: CGFloat {
        min(max(min(tileSize.width, tileSize.height) * 0.16, 12), 30)
    }

    private var labelLanguage: String {
        HarvestUntranslatedActions.identifiers.contains(action.id) ? "en" : language
    }

    var body: some View {
        Link(destination: action.destinationURL) {
            VStack(spacing: labelSize * 0.45) {
                HarvestIconShape(pathData: action.iconPath, viewport: iconViewport)
                    .fill(harvestContentColor)
                    .frame(width: iconSize, height: iconSize)

                Text(action.label)
                    .font(HarvestFont.label(for: labelLanguage, size: labelSize))
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

    let maximumRows: Int

    var body: some View {
        GeometryReader { proxy in
            let plan = QuickActionsGridPlan.make(
                count: payload.actions.count,
                width: proxy.size.width,
                height: proxy.size.height,
                maximumColumns: maximumColumns,
                maximumRows: maximumRows
            )

            let cell = CGSize(
                width: proxy.size.width / CGFloat(plan.columns),
                height: proxy.size.height / CGFloat(plan.rows)
            )

            let tileSize = QuickActionsGridPlan.tileSize(inCell: cell)

            VStack(spacing: 0) {
                ForEach(0..<plan.rows, id: \.self) { row in
                    HStack(spacing: 0) {
                        ForEach(0..<plan.columns, id: \.self) { column in
                            let action = self.action(row: row, column: column, plan: plan)

                            Group {
                                if let action = action {
                                    QuickActionTile(
                                        action: action,
                                        language: payload.language,
                                        iconViewport: payload.iconViewport,
                                        tileSize: tileSize
                                    )
                                } else {
                                    Color.clear
                                }
                            }
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                        }
                    }
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
    }

    private func action(row: Int, column: Int, plan: QuickActionsGridPlan) -> HarvestQuickAction? {
        let rowStart = row * plan.columns
        let remaining = payload.actions.count - rowStart
        let inThisRow = min(remaining, plan.columns)

        guard inThisRow > 0 else {
            return nil
        }

        let leadingGap = (plan.columns - inThisRow) / 2
        let indexInRow = column - leadingGap

        guard indexInRow >= 0, indexInRow < inThisRow else {
            return nil
        }

        return payload.actions[rowStart + indexInRow]
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

    private var layout: (maximumColumns: Int, maximumRows: Int, limit: Int) {
        switch family {
        case .systemSmall:
            return (2, 2, 4)
        case .systemMedium:
            return (4, 2, 8)
        case .systemLarge:
            return (4, 4, 16)
        default:
            return (6, 4, 24)
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
                QuickActionsGrid(
                    payload: visiblePayload,
                    maximumColumns: layout.maximumColumns,
                    maximumRows: layout.maximumRows
                )
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
