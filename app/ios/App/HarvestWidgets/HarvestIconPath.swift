import SwiftUI
import CoreGraphics

struct HarvestIconShape: Shape {

    let pathData: String

    let viewport: Double

    func path(in rect: CGRect) -> Path {
        let scale = min(rect.width, rect.height) / CGFloat(viewport <= 0 ? 24 : viewport)
        let offsetX = rect.minX + (rect.width - CGFloat(viewport) * scale) / 2
        let offsetY = rect.minY + (rect.height - CGFloat(viewport) * scale) / 2
        var transform = CGAffineTransform(translationX: offsetX, y: offsetY).scaledBy(x: scale, y: scale)
        let iconPath = HarvestSVGPathParser(pathData: pathData).cgPath()
        return Path(iconPath.copy(using: &transform) ?? iconPath)
    }
}


struct HarvestSVGPathParser {

    let pathData: String

    private enum Token {
        case command(Character)
        case number(CGFloat)
    }

    func cgPath() -> CGMutablePath {
        let path = CGMutablePath()

        let tokens = tokenize()

        var index = 0

        var command: Character = "M"

        var current = CGPoint.zero

        var subpathStart = CGPoint.zero

        var lastControl = CGPoint.zero

        var lastCommandWasCurve = false

        var lastCommandWasQuadratic = false

        while index < tokens.count {
            if case .command(let next) = tokens[index] {
                command = next

                index += 1
            }

            let isRelative = command.isLowercase

            let upper = Character(command.uppercased())

            func nextNumber() -> CGFloat {
                var value: CGFloat = 0

                if index < tokens.count, case .number(let number) = tokens[index] {
                    value = number

                    index += 1
                }

                return value
            }

            func nextPoint() -> CGPoint {
                let x = nextNumber()

                let y = nextNumber()

                return isRelative ? CGPoint(x: current.x + x, y: current.y + y) : CGPoint(x: x, y: y)
            }

            switch upper {
            case "M":
                current = nextPoint()
                subpathStart = current
                path.move(to: current)
                command = isRelative ? "l" : "L"
                lastCommandWasCurve = false
                lastCommandWasQuadratic = false
            case "L":
                current = nextPoint()
                path.addLine(to: current)
                lastCommandWasCurve = false
                lastCommandWasQuadratic = false
            case "H":
                let x = nextNumber()
                current = CGPoint(x: isRelative ? current.x + x : x, y: current.y)
                path.addLine(to: current)
                lastCommandWasCurve = false
                lastCommandWasQuadratic = false
            case "V":
                let y = nextNumber()
                current = CGPoint(x: current.x, y: isRelative ? current.y + y : y)
                path.addLine(to: current)
                lastCommandWasCurve = false
                lastCommandWasQuadratic = false
            case "C":
                let firstControl = nextPoint()
                let secondControl = nextPoint()
                current = nextPoint()
                path.addCurve(to: current, control1: firstControl, control2: secondControl)
                lastControl = secondControl
                lastCommandWasCurve = true
                lastCommandWasQuadratic = false
            case "S":
                let firstControl = lastCommandWasCurve
                    ? CGPoint(x: 2 * current.x - lastControl.x, y: 2 * current.y - lastControl.y)
                    : current
                let secondControl = nextPoint()
                current = nextPoint()
                path.addCurve(to: current, control1: firstControl, control2: secondControl)
                lastControl = secondControl
                lastCommandWasCurve = true
                lastCommandWasQuadratic = false
            case "Q":
                let control = nextPoint()
                current = nextPoint()
                path.addQuadCurve(to: current, control: control)
                lastControl = control
                lastCommandWasCurve = false
                lastCommandWasQuadratic = true
            case "T":
                let control = lastCommandWasQuadratic
                    ? CGPoint(x: 2 * current.x - lastControl.x, y: 2 * current.y - lastControl.y)
                    : current
                current = nextPoint()
                path.addQuadCurve(to: current, control: control)
                lastControl = control
                lastCommandWasCurve = false
                lastCommandWasQuadratic = true
            case "A":
                let radiusX = nextNumber()
                let radiusY = nextNumber()
                let rotation = nextNumber()
                let isLargeArc = nextNumber() != 0
                let isSweep = nextNumber() != 0
                let end = nextPoint()
                addArc(to: path, from: current, to: end, radiusX: radiusX, radiusY: radiusY,
                       rotationDegrees: rotation, isLargeArc: isLargeArc, isSweep: isSweep)
                current = end
                lastCommandWasCurve = false
                lastCommandWasQuadratic = false
            case "Z":
                path.closeSubpath()
                current = subpathStart
                lastCommandWasCurve = false
                lastCommandWasQuadratic = false
            default:
                index = tokens.count
            }
        }

        return path
    }

    private func addArc(to path: CGMutablePath, from start: CGPoint, to end: CGPoint,
                        radiusX: CGFloat, radiusY: CGFloat, rotationDegrees: CGFloat,
                        isLargeArc: Bool, isSweep: Bool) {
        guard radiusX != 0, radiusY != 0 else {
            path.addLine(to: end)

            return
        }

        let angle = rotationDegrees * .pi / 180

        let dx = (start.x - end.x) / 2

        let dy = (start.y - end.y) / 2

        let x1 = cos(angle) * dx + sin(angle) * dy

        let y1 = -sin(angle) * dx + cos(angle) * dy

        var rx = abs(radiusX)

        var ry = abs(radiusY)

        let lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)

        if lambda > 1 {
            rx *= sqrt(lambda)
            ry *= sqrt(lambda)
        }

        let numerator = max(0, rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1)

        let denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1

        let factor = (isLargeArc == isSweep ? -1 : 1) * sqrt(denominator == 0 ? 0 : numerator / denominator)

        let cx1 = factor * rx * y1 / ry

        let cy1 = -factor * ry * x1 / rx

        let centreX = cos(angle) * cx1 - sin(angle) * cy1 + (start.x + end.x) / 2

        let centreY = sin(angle) * cx1 + cos(angle) * cy1 + (start.y + end.y) / 2

        let startAngle = atan2((y1 - cy1) / ry, (x1 - cx1) / rx)

        let endAngle = atan2((-y1 - cy1) / ry, (-x1 - cx1) / rx)

        let transform = CGAffineTransform(translationX: centreX, y: centreY)
            .rotated(by: angle)
            .scaledBy(x: rx, y: ry)

        path.addArc(center: .zero, radius: 1, startAngle: startAngle, endAngle: endAngle,
                    clockwise: !isSweep, transform: transform)
    }

    private func tokenize() -> [Token] {
        var tokens: [Token] = []

        var number = ""

        func flushNumber() {
            if let value = Double(number) {
                tokens.append(.number(CGFloat(value)))
            }

            number = ""
        }

        for character in pathData {
            if character.isNumber || character == "." {
                if character == "." && number.contains(".") {
                    flushNumber()
                }

                number.append(character)
            } else if character == "-" || character == "+" {
                let isExponentSign = number.hasSuffix("e") || number.hasSuffix("E")

                if !isExponentSign {
                    flushNumber()
                }

                number.append(character)
            } else if character == "e" || character == "E" {
                number.append(character)
            } else if character.isLetter {
                flushNumber()

                tokens.append(.command(character))
            } else {
                flushNumber()
            }
        }

        flushNumber()

        return tokens
    }
}
