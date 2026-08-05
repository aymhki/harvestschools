import Foundation
import Capacitor

@objc(AssistantBridgePlugin)
public class AssistantBridgePlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "AssistantBridgePlugin"

    public let jsName = "AssistantBridge"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setKnowledge", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getKnowledgeInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearKnowledge", returnType: CAPPluginReturnPromise)
    ]

    @objc func isSupported(_ call: CAPPluginCall) {
        var supportsAppIntents = false

        if #available(iOS 16.0, *) {
            supportsAppIntents = HarvestAssistantStore.sharedDefaults() != nil
        }

        call.resolve([
            "appIntents": supportsAppIntents,
            "appFunctions": false
        ])
    }

    @objc func setKnowledge(_ call: CAPPluginCall) {
        guard let payload = call.getString("payload") else {
            call.reject("A payload is required")

            return
        }

        let language = HarvestAssistantStore.normalisedLanguage(call.getString("language"))

        guard HarvestAssistantStore.knowledgeDirectory() != nil else {
            call.reject("The shared app group is not available")

            return
        }

        let previousHash = HarvestAssistantStore.storedMeta(language: language)?.contentHash

        guard HarvestAssistantStore.save(language: language, payload: payload) else {
            call.reject("The knowledge payload could not be stored")

            return
        }

        let currentHash = HarvestAssistantStore.storedMeta(language: language)?.contentHash

        if previousHash != currentHash {
            NotificationCenter.default.post(
                name: .harvestAssistantKnowledgeUpdated,
                object: nil,
                userInfo: ["language": language]
            )
        }

        call.resolve(["value": true])
    }

    @objc func getKnowledgeInfo(_ call: CAPPluginCall) {
        let language = HarvestAssistantStore.normalisedLanguage(call.getString("language"))

        guard let meta = HarvestAssistantStore.storedMeta(language: language) else {
            call.resolve()

            return
        }

        call.resolve([
            "language": meta.language,
            "schemaVersion": meta.schemaVersion,
            "contentHash": meta.contentHash,
            "generatedAt": meta.generatedAt ?? "",
            "storedAt": meta.storedAt
        ])
    }

    @objc func clearKnowledge(_ call: CAPPluginCall) {
        HarvestAssistantStore.clear()

        NotificationCenter.default.post(
            name: .harvestAssistantKnowledgeUpdated,
            object: nil,
            userInfo: ["cleared": true]
        )

        call.resolve(["value": true])
    }
}
