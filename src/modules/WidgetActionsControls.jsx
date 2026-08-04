import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useSpring, animated } from 'react-spring'
import { Haptics, NotificationType } from '@capacitor/haptics'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import {
    MINIMUM_WIDGET_ACTIONS,
    WIDGET_SIZE_CAPACITIES,
    getWidgetActionIds,
    setWidgetActionIds,
    syncWidgetQuickActions,
} from '../services/General/HomeWidgetService.jsx'
import '../styles/WidgetActions.css'


const CHOICE_TAP_TOLERANCE = 8


function WidgetActionsControls({ isOpen, catalogue, copy, language, onClose, onChosenCountChange }) {
    const [chosenActionIds, setChosenActionIds] = useState([])

    const pointerStartRef = useRef(null)

    const numberFormatter = useMemo(
        () => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US'),
        [language]
    )

    const animateModal = useSpring({
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: isOpen ? 'auto' : 'none',
    })

    const pushToWidgets = async (actionIds) => {
        await syncWidgetQuickActions({
            actionIds,
            catalogue,
            title: copy.widgetTitle,
            language,
        })
    }

    const toggleAction = (actionId) => {
        setChosenActionIds((current) => {
            const isChosen = current.includes(actionId)

            let next = current

            if (isChosen && current.length > MINIMUM_WIDGET_ACTIONS) {
                next = current.filter((id) => id !== actionId)
            } else if (!isChosen) {
                next = [...current, actionId]
            }

            return next
        })
    }

    const handlePointerDown = (event) => {
        pointerStartRef.current = { x: event.clientX, y: event.clientY }
    }

    const handlePointerUp = (event, actionId) => {
        const start = pointerStartRef.current

        const travel = start
            ? Math.hypot(event.clientX - start.x, event.clientY - start.y)
            : Number.MAX_SAFE_INTEGER

        pointerStartRef.current = null

        if (travel <= CHOICE_TAP_TOLERANCE) {
            toggleAction(actionId)
        }
    }

    const handleSave = async () => {
        const saved = await setWidgetActionIds(chosenActionIds)

        await pushToWidgets(saved)

        Haptics.notification({ type: NotificationType.Success }).catch(() => null)

        onChosenCountChange(saved.length)

        onClose()
    }

    useEffect(() => {
        let isActive = true

        const loadAndSync = async () => {
            const actionIds = await getWidgetActionIds(catalogue)

            if (isActive) {
                setChosenActionIds(actionIds)
                onChosenCountChange(actionIds.length)
            }

            await pushToWidgets(actionIds)
        }

        loadAndSync()

        return () => {
            isActive = false
        }
    }, [catalogue])

    const modal = (
        <animated.div style={animateModal} className={'widget-actions-modal'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className={'widget-actions-modal-overlay'} onClick={onClose}/>

            <div className={'widget-actions-modal-container'}>
                <div className={'widget-actions-modal-header'}>
                    <h3>{copy.widgetTitle}</h3>

                    <p className={'widget-actions-note'}>{copy.widgetHint}</p>

                    <p className={'widget-actions-note'}>
                        {copy.widgetSizes(
                            numberFormatter.format(Math.min(WIDGET_SIZE_CAPACITIES.small, catalogue.length)),
                            numberFormatter.format(Math.min(WIDGET_SIZE_CAPACITIES.medium, catalogue.length)),
                            numberFormatter.format(Math.min(WIDGET_SIZE_CAPACITIES.large, catalogue.length))
                        )}
                    </p>

                    <p className={'widget-actions-counter'}>
                        {copy.widgetCounter(
                            numberFormatter.format(chosenActionIds.length),
                            numberFormatter.format(catalogue.length)
                        )}
                    </p>
                </div>

                <div className={'widget-actions-modal-content'}>
                    {catalogue.map((action) => {
                        const isChosen = chosenActionIds.includes(action.id)

                        const isLastChoice = isChosen && chosenActionIds.length === MINIMUM_WIDGET_ACTIONS

                        return (
                            <button
                                key={action.id}
                                type={'button'}
                                className={`widget-actions-choice ${isChosen ? 'is-chosen' : ''}`}
                                onPointerDown={handlePointerDown}
                                onPointerUp={(event) => handlePointerUp(event, action.id)}
                                disabled={isLastChoice}
                                aria-pressed={isChosen}
                            >
                                <action.Icon className={'widget-actions-choice-icon'}/>

                                <span className={`widget-actions-choice-label ${action.id === 'schooleverywhere' ? 'always-english-font' : ''}`}>
                                    {action.label}
                                </span>

                                {isChosen && <CheckOutlinedIcon className={'widget-actions-choice-state'}/>}
                            </button>
                        )
                    })}
                </div>

                <div className={'widget-actions-modal-footer'}>
                    <button className={'widget-actions-modal-cancel-button'} onClick={onClose}>
                        {copy.cancel}
                    </button>

                    <button className={'widget-actions-modal-save-button'} onClick={handleSave}>
                        {copy.save}
                    </button>
                </div>
            </div>
        </animated.div>
    )

    return typeof document === 'undefined' ? null : createPortal(modal, document.body)
}


WidgetActionsControls.propTypes = {
    isOpen: PropTypes.bool,
    catalogue: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        Icon: PropTypes.elementType.isRequired,
    })).isRequired,
    copy: PropTypes.shape({
        widgetTitle: PropTypes.string.isRequired,
        widgetHint: PropTypes.string.isRequired,
        widgetSizes: PropTypes.func.isRequired,
        widgetCounter: PropTypes.func.isRequired,
        cancel: PropTypes.string.isRequired,
        save: PropTypes.string.isRequired,
    }).isRequired,
    language: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onChosenCountChange: PropTypes.func.isRequired,
}


export default WidgetActionsControls
