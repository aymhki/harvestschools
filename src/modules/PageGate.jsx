import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import PropTypes from 'prop-types'
import Spinner from './Spinner.jsx'
import {usePreloadedData} from '../services/General/PrerenderDataContext.jsx'
import {fetchPageGates} from '../services/Public/SchoolInfo/PageGatesServices.jsx'


const usePageGate = (paths) => {
    const preloadedDocument = usePreloadedData('pageGates')
    const preloadedGates = preloadedDocument && preloadedDocument.gates ? preloadedDocument.gates : null

    const [gates, setGates] = useState(preloadedGates)
    const [isResolved, setIsResolved] = useState(Boolean(preloadedGates))

    useEffect(() => {
        let isActive = true

        fetchPageGates().then((fetched) => {
            if (!isActive) {
                return
            }

            if (fetched) {
                setGates(fetched)
            }

            setIsResolved(true)
        })

        return () => {
            isActive = false
        }
    }, [])

    if (!isResolved) {
        return {status: 'loading', entry: null}
    }

    if (!gates) {
        return {status: 'on', entry: null}
    }

    for (const path of paths) {
        if (gates[path]) {
            return {status: 'off', entry: gates[path]}
        }
    }

    return {status: 'on', entry: null}
}


function GatedPage({entry}) {
    const {t, i18n} = useTranslation(['nav', 'events-pages', 'common'])

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const override = language === 'ar' ? entry.messageAr : entry.messageEn

    const namespace = entry.titleKey ? entry.titleKey.split('.')[0] : null
    const translatedTitle = entry.titleKey ? t(entry.titleKey, {ns: namespace}) : null
    const title = translatedTitle && translatedTitle !== entry.titleKey ? translatedTitle : entry.titleEn

    const message = override && override.trim() !== '' ? override : t('common.this-page-is-under-construction', {ns: 'common'})

    return (
        <div className={'gated-page'}>
            <title>{`Harvest International School | ${entry.titleEn}`}</title>
            <meta name="robots" content="noindex"/>
            <meta name="googlebot" content="noindex"/>

            <div className={'extreme-padding-container'}>
                <h1>
                    {title}
                </h1>

                <p>
                    {message}
                </p>
            </div>
        </div>
    )
}

GatedPage.propTypes = {
    entry: PropTypes.shape({
        titleKey: PropTypes.string,
        titleEn: PropTypes.string.isRequired,
        messageEn: PropTypes.string,
        messageAr: PropTypes.string,
    }).isRequired,
}


function PageGate({paths, children}) {
    const gate = usePageGate(paths)

    if (gate.status === 'loading') {
        return <Spinner/>
    }

    if (gate.status === 'off') {
        return <GatedPage entry={gate.entry}/>
    }

    return children
}

PageGate.propTypes = {
    paths: PropTypes.arrayOf(PropTypes.string).isRequired,
    children: PropTypes.node,
}


export default PageGate
