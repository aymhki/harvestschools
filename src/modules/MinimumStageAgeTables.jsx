import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import Table from './Table.jsx'
import Spinner from './Spinner.jsx'
import {fetchStages} from '../services/Public/SchoolInfo/PublicStagesServices.jsx'
import {usePreloadedData} from '../services/General/PrerenderDataContext.jsx'


function MinimumStageAgeTables() {
    const {t, i18n} = useTranslation(['faqs-pages', 'common'])

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const preloaded = usePreloadedData(`stages:${language}`)

    const [stages, setStages] = useState(preloaded)
    const [isLoading, setIsLoading] = useState(!preloaded)
    const [hasFailed, setHasFailed] = useState(false)

    useEffect(() => {
        let isActive = true

        if (!preloaded) {
            setIsLoading(true)
            setHasFailed(false)
        }

        fetchStages(language)
            .then((data) => {
                if (!isActive) {
                    return
                }

                if (data) {
                    setStages(data)
                    setHasFailed(false)
                } else if (!preloaded) {
                    setStages(null)
                    setHasFailed(true)
                }
            })
            .catch(() => {
                if (isActive && !preloaded) {
                    setStages(null)
                    setHasFailed(true)
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [language, preloaded])

    const tables = useMemo(() => {
        const headers = [
            t('faqs-pages.minimum-stage-age-page.stage-column-header'),
            t('faqs-pages.minimum-stage-age-page.minimum-registration-age-column-header'),
        ]

        return (stages?.departments || [])
            .filter((department) => department.ages.length > 0)
            .map((department) => ({
                key: department.key,
                name: department.name,
                data: [
                    headers,
                    ...department.ages.map((stage) => [stage.name, stage.minimumAge]),
                ],
            }))
    }, [stages, t])

    return (
        <>
            {isLoading && <Spinner/>}

            {hasFailed && <p>{t('faqs-pages.minimum-stage-age-page.unavailable')}</p>}

            {stages?.minimumAgeNote && <p>{stages.minimumAgeNote}</p>}

            {tables.map((table) => (
                <Table key={table.key} tableHeader={table.name} tableData={table.data} numCols={2}
                       ignoreSideMarginsOnFixed={true}
                />
            ))}
        </>
    )
}


export default MinimumStageAgeTables
