import { CapacitorHttp } from '@capacitor/core'


const PORTAL_ORIGIN = 'https://schooleverywhere-harvest.com'

const PORTAL_LOGIN_PAGE = `${PORTAL_ORIGIN}/schooleverywhere/`

const BROWSER_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'

const SUCCESS_TOKEN = /^correct/i

const AUTH_RESULT = {
    OK: 'ok',
    REJECTED: 'rejected',
    UNREACHABLE: 'unreachable',
    CONTRACT_CHANGED: 'contract-changed',
}


const readHeader = (headers, name) => {
    if (!headers) { return null }

    const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase())

    return match ? headers[match] : null
}


const readSessionCookie = (headers) => {
    const raw = readHeader(headers, 'set-cookie')

    if (!raw) { return null }

    const text = Array.isArray(raw) ? raw.join(';') : String(raw)
    const match = text.match(/PHPSESSID=([^;,\s]+)/)

    return match ? `PHPSESSID=${match[1]}` : null
}


const readLoginContext = (html) => {
    const dataLine = (html.match(/var\s+dataString\s*=\s*[^;]+;/) || [])[0] || ''
    const endpoint = (html.match(/["']([\w./-]*processed\.php)["']/) || [])[1]
    const mydb = (dataLine.match(/mydb=([^&"'+]*)/) || [])[1]
    const mip = (dataLine.match(/mip=([^&"'+]*)/) || [])[1]

    if (!endpoint || mydb === undefined || mip === undefined) { return null }

    return {
        endpoint: new URL(endpoint, PORTAL_LOGIN_PAGE).href,
        mydb,
        mip,
    }
}


const loadLoginContext = async () => {
    const response = await CapacitorHttp.get({
        url: PORTAL_LOGIN_PAGE,
        headers: { 'User-Agent': BROWSER_USER_AGENT, Accept: 'text/html' },
        responseType: 'text',
        webFetchExtra: { credentials: 'include' },
    })

    if (!response || response.status < 200 || response.status >= 300) {
        return { status: AUTH_RESULT.UNREACHABLE, httpStatus: response ? response.status : 0 }
    }

    const context = readLoginContext(String(response.data || ''))

    if (!context) {
        return { status: AUTH_RESULT.CONTRACT_CHANGED, message: 'sign-in endpoint not found' }
    }

    return {
        status: AUTH_RESULT.OK,
        context,
        cookie: readSessionCookie(response.headers),
    }
}

const authenticateWithPortal = async ({ username, password, typeofuser, iden }) => {
    let preflight

    try {
        preflight = await loadLoginContext()
    } catch (loadError) {
        return { status: AUTH_RESULT.UNREACHABLE, message: loadError.message }
    }

    if (preflight.status !== AUTH_RESULT.OK) { return preflight }

    const { context, cookie } = preflight

    const body = new URLSearchParams({
        uname: username,
        password,
        typeofuser,
        iden,
        remember: '',
        mydb: context.mydb,
        mip: context.mip,
    }).toString()

    let response

    try {
        response = await CapacitorHttp.post({
            url: context.endpoint,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': BROWSER_USER_AGENT,
                Accept: '*/*',
                ...(cookie ? { Cookie: cookie } : {}),
            },
            data: body,
            responseType: 'text',
            webFetchExtra: { credentials: 'include' },
        })
    } catch (postError) {
        return { status: AUTH_RESULT.UNREACHABLE, message: postError.message }
    }

    if (!response || response.status < 200 || response.status >= 300) {
        return { status: AUTH_RESULT.UNREACHABLE, httpStatus: response ? response.status : 0 }
    }

    const answer = String(response.data || '').trim()

    if (SUCCESS_TOKEN.test(answer)) {
        return {
            status: AUTH_RESULT.OK,
            token: answer,
            cookie: readSessionCookie(response.headers) || cookie,
        }
    }

    return {
        status: AUTH_RESULT.REJECTED,
        message: answer.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    }
}


export {
    AUTH_RESULT,
    PORTAL_LOGIN_PAGE,
    readLoginContext,
    readSessionCookie,
    loadLoginContext,
    authenticateWithPortal,
}
