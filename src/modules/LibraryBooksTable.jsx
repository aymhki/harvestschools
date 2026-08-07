import {useEffect, useMemo, useState} from 'react'
import PropTypes from 'prop-types'
import {useTranslation} from 'react-i18next'
import Table from './Table.jsx'
import Spinner from './Spinner.jsx'
import {fetchLibraryCategory} from '../services/Public/Library/PublicLibraryServices.jsx'

function LibraryBooksTable({categoryKey}) {
    const {t, i18n} = useTranslation(['students-life-pages', 'common'])
    const [library, setLibrary] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasFailed, setHasFailed] = useState(false)

    const language = i18n.language === 'ar' ? 'ar' : 'en'

    useEffect(() => {
        let isActive = true

        setIsLoading(true)
        setHasFailed(false)

        fetchLibraryCategory(categoryKey, language)
            .then((data) => {
                if (!isActive) {
                    return
                }

                setLibrary(data)
                setHasFailed(data === null)
            })
            .catch(() => {
                if (isActive) {
                    setLibrary(null)
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
    }, [categoryKey, language])


    const showsSeries = useMemo(
        () => (library?.books || []).some((book) => book.series),
        [library]
    )

    const tableData = useMemo(() => {
        const headers = showsSeries
            ? [
                t('students-life-pages.library-pages.book-title-column-header'),
                t('students-life-pages.library-pages.book-series-column-header'),
            ]
            : [t('students-life-pages.library-pages.book-title-column-header')]

        const rows = (library?.books || []).map((book) => (
            showsSeries ? [book.title, book.series] : [book.title]
        ))

        return [headers, ...rows]
    }, [library, showsSeries, t])

    return (
        <>
            {isLoading && <Spinner/>}

            {hasFailed && <p>{t('students-life-pages.library-pages.unavailable')}</p>}

            <Table tableData={tableData} numCols={showsSeries ? 2 : 1}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   ignoreSideMarginsOnFixed={true}
                   tablePages={false}
            />
        </>
    )
}


LibraryBooksTable.propTypes = {
    categoryKey: PropTypes.string.isRequired,
}


export default LibraryBooksTable
