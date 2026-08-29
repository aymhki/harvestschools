import {endpoints} from "../../General/GeneralUtils.jsx";

const CONVERSATION_STORAGE_KEY = 'harvest_schools_web_chat_conversation_id';

const readStoredConversationId = () => {
    try {
        return localStorage.getItem(CONVERSATION_STORAGE_KEY) || '';
    } catch (error) {
        console.log(error.message);
        return '';
    }
}

const storeConversationId = (conversationId) => {
    try {
        if (conversationId) {
            localStorage.setItem(CONVERSATION_STORAGE_KEY, conversationId);
        } else {
            localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        }
    } catch (error) {
        console.log(error.message);
    }
}

const sendWebChatMessage = async ({conversationId, type, text, replyId, replyTitle, turnstileToken}) => {
    try {
        const headers = {'Content-Type': 'application/json'};

        if (turnstileToken) {
            headers['X-Turnstile-Token'] = turnstileToken;
        }

        const response = await fetch(endpoints.webChat, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                conversationId: conversationId || '',
                type: type,
                text: text || '',
                replyId: replyId || '',
                replyTitle: replyTitle || ''
            })
        });

        const result = await response.json();

        if (result && result.success) {
            storeConversationId(result.conversationId);

            return {
                success: true,
                conversationId: result.conversationId,
                replies: Array.isArray(result.replies) ? result.replies : []
            };
        }

        if (result && result.code === 410) {
            storeConversationId('');
        }

        return {success: false, code: result ? result.code : 500, message: result ? result.message : ''};
    } catch (error) {
        return {success: false, code: 0, message: error.message};
    }
}

export {
    readStoredConversationId,
    storeConversationId,
    sendWebChatMessage
}
