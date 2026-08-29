import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import ParallaxScrollSection from './ParallaxScrollSection.jsx'
import {servePublicAsset} from '../services/General/GeneralServices.jsx'
import {fetchStages} from '../services/Public/SchoolInfo/PublicStagesServices.jsx'
import {usePreloadedData} from '../services/General/PrerenderDataContext.jsx'
import { useLoading } from '../services/General/GlobalLoadingService.jsx'

const collapseIntoRuns = (stages) => {
    const runs = []

    for (const stage of stages) {
        const previous = runs[runs.length - 1]

        if (previous && stage.sortOrder === previous.lastSortOrder + 1) {
            previous.last = stage.name
            previous.lastSortOrder = stage.sortOrder
            previous.length += 1
            continue
        }

        runs.push({first: stage.name, last: stage.name, lastSortOrder: stage.sortOrder, length: 1})
    }

    return runs.map((run) => (run.length > 2 ? `${run.first} – ${run.last}` : run.first === run.last ? run.first : `${run.first}, ${run.last}`))
}

function AdmissionRequirementsList() {
    const {t, i18n} = useTranslation(['admission-pages', 'common'])

    const language = i18n.language === 'ar' ? 'ar' : 'en'
    const preloaded = usePreloadedData(`stages:${language}`)

    const [stages, setStages] = useState(preloaded)
    const [, setIsLoading] = useLoading(!preloaded)
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

    const groups = useMemo(() => {
        const grouped = new Map()

        for (const stage of stages?.admissionRequirements || []) {
            const signature = stage.requirements.join('\n')

            if (!grouped.has(signature)) {
                grouped.set(signature, {requirements: stage.requirements, departments: new Map()})
            }

            const departments = grouped.get(signature).departments

            if (!departments.has(stage.departmentKey)) {
                departments.set(stage.departmentKey, {name: stage.departmentName, stages: []})
            }

            departments.get(stage.departmentKey).stages.push(stage)
        }

        return Array.from(grouped.values()).map((group) => ({
            requirements: group.requirements,
            lines: Array.from(group.departments.values()).map((department) => {
                const ordered = [...department.stages].sort((a, b) => a.sortOrder - b.sortOrder)

                return {department: department.name, stages: collapseIntoRuns(ordered).join(', ')}
            }),
        }))
    }, [stages])

    const notes = stages?.admissionRequirementNotes || []

    return (
        <>
            <div className="extreme-padding-container">
                {(hasFailed || (stages && groups.length === 0)) && (
                    <p>{t('admission-pages.admission-requirements-page.common.unavailable')}</p>
                )}

                {groups.map((group) => (
                    <div className="admission-requirements-group" key={group.lines.map((line) => line.department + line.stages).join('|')}>
                        <h3 lang={language}>
                            {group.lines.map((line) => (
                                <span className="admission-requirements-group-line" key={line.department}>
                                    <span className="admission-requirements-group-department">{line.department}</span>
                                    <span className="admission-requirements-group-stages">{line.stages}</span>
                                </span>
                            ))}
                        </h3>

                        <div className="admission-requirements-list-container">
                            <ul className={"admission-requirements-list"} lang={language}>
                                {group.requirements.map((requirement) => (
                                    <li key={requirement}><p>{requirement}</p></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {notes.length > 0 && (
                <ParallaxScrollSection
                    backgroundImage={servePublicAsset('/images/AdmissionPages/OutsideEgyptRequirementsHeaderBackground.jpg')}
                    title={t('admission-pages.admission-requirements-page.common.admission-requirements-note')}
                    titleInArabic={false}
                    darken={true}
                    divElements={[(
                        <div className="admission-requirements-note" key={1}>
                            <ul className={"admission-note-list"} lang={language}>
                                {notes.map((note) => (
                                    <li key={note.key}>
                                        <p className="admission-note-question">{note.title}</p>
                                        <p className="admission-note-answer">{note.body}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )]}
                />
            )}
        </>
    )
}


export default AdmissionRequirementsList
