import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import Table from './Table.jsx'
import Spinner from './Spinner.jsx'
import {fetchStages} from '../services/Public/SchoolInfo/PublicStagesServices.jsx'


function MinimumStageAgeTables() {
    const {t, i18n} = useTranslation(['faqs-pages', 'common'])
    const [stages, setStages] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasFailed, setHasFailed] = useState(false)

    const language = i18n.language === 'ar' ? 'ar' : 'en'

    useEffect(() => {
        let isActive = true

        setIsLoading(true)
        setHasFailed(false)

        fetchStages(language)
            .then((data) => {
                if (!isActive) {
                    return
                }

                setStages(data)
                setHasFailed(data === null)
            })
            .catch(() => {
                if (isActive) {
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
    }, [language])

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
