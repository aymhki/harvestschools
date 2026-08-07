import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import Table from './Table.jsx'
import Spinner from './Spinner.jsx'
import {fetchStages} from '../services/Public/SchoolInfo/PublicStagesServices.jsx'

function TuitionFeesTables() {
    const {t, i18n} = useTranslation(['admission-pages', 'common'])
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
            t('admission-pages.admission-fees-page.stage-column-header'),
            t('admission-pages.admission-fees-page.fees-column-header'),
        ]

        return (stages?.departments || [])
            .filter((department) => department.fees.length > 0)
            .map((department) => ({
                key: department.key,
                name: department.name,
                data: [
                    headers,
                    ...department.fees.map((stage) => [stage.name, String(stage.fees)]),
                ],
            }))
    }, [stages, t])

    const feeExclusions = stages?.feeExclusions || []

    return (
        <>
            {isLoading && <Spinner/>}

            {hasFailed && <p>{t('admission-pages.admission-fees-page.unavailable')}</p>}

            {feeExclusions.length > 0 && (
                <p>
                    {t('admission-pages.admission-fees-page.fees-do-not-include')}
                    {' '}
                    {feeExclusions.join(t('common.list-separator', {ns: 'common'}))}
                </p>
            )}

            {tables.map((table) => (
                <Table key={table.key} tableHeader={table.name} tableData={table.data} numCols={2}
                       ignoreSideMarginsOnFixed={true}
                       currencyColumns={[t('admission-pages.admission-fees-page.fees-column-header')]}
                       currencySymbols={[stages.currency]}
                       currencySymbolPositions={['right-space']}
                />
            ))}
        </>
    )
}


export default TuitionFeesTables
