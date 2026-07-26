import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSpring, animated } from 'react-spring'
import { Haptics, NotificationType } from '@capacitor/haptics'
import {
    MAXIMUM_WIDGET_ACTIONS,
    getWidgetActionIcon,
    getWidgetActionIds,
    setWidgetActionIds,
    syncWidgetQuickActions,
} from '../services/General/HomeWidgetService.jsx'
import '../styles/WidgetActions.css'


function WidgetActionsControls({ catalogue, copy, isRightToLeft, onChosenCountChange }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [chosenActionIds, setChosenActionIds] = useState([])

    const animateModal = useSpring({
        opacity: isModalOpen ? 1 : 0,
        transform: isModalOpen ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: isModalOpen ? 'auto' : 'none',
    })

    const pushToWidgets = async (actionIds) => {
        await syncWidgetQuickActions({
            actionIds,
            catalogue,
            title: copy.widgetTitle,
            isRightToLeft,
        })
    }

    const toggleAction = (actionId) => {
        setChosenActionIds((current) => {
            const isChosen = current.includes(actionId)

            const hasRoom = current.length < MAXIMUM_WIDGET_ACTIONS

            let next = current

            if (isChosen && current.length > 1) {
                next = current.filter((id) => id !== actionId)
            } else if (!isChosen && hasRoom) {
                next = [...current, actionId]
            }

            return next
        })
    }

    const handleSave = async () => {
        const saved = await setWidgetActionIds(chosenActionIds)

        await pushToWidgets(saved)

        Haptics.notification({ type: NotificationType.Success }).catch(() => null)

        onChosenCountChange(saved.length)

        setIsModalOpen(false)
    }

    useEffect(() => {
        let isActive = true

        const loadAndSync = async () => {
            const actionIds = await getWidgetActionIds()

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

    return (
        <>
            <button className={'app-home-device-action'} onClick={() => setIsModalOpen(true)}>
                {copy.widgetAction}
            </button>

            <animated.div style={animateModal} className={'widget-actions-modal'}>
                <div className={'widget-actions-modal-overlay'} onClick={() => setIsModalOpen(false)}/>

                <div className={'widget-actions-modal-container'}>
                    <div className={'widget-actions-modal-header'}>
                        <h3>{copy.widgetTitle}</h3>

                        <p className={'widget-actions-note'}>{copy.widgetHint}</p>
                    </div>

                    <div className={'widget-actions-modal-content'}>
                        {catalogue.map((action) => (
                            <button
                                key={action.id}
                                className={`widget-actions-choice ${chosenActionIds.includes(action.id) ? 'is-chosen' : ''}`}
                                onClick={() => toggleAction(action.id)}
                                aria-pressed={chosenActionIds.includes(action.id)}
                            >
                                <span className={'widget-actions-choice-icon'} aria-hidden={'true'}>
                                    {getWidgetActionIcon(action.id)}
                                </span>

                                <span className={'widget-actions-choice-label'}>{action.label}</span>

                                <span className={'widget-actions-choice-state'} aria-hidden={'true'}>
                                    {chosenActionIds.includes(action.id) ? '✓' : ''}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className={'widget-actions-modal-footer'}>
                        <button className={'widget-actions-modal-cancel-button'} onClick={() => setIsModalOpen(false)}>
                            {copy.cancel}
                        </button>

                        <button className={'widget-actions-modal-save-button'} onClick={handleSave}>
                            {copy.save}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    )
}


WidgetActionsControls.propTypes = {
    catalogue: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
    })).isRequired,
    copy: PropTypes.shape({
        widgetTitle: PropTypes.string.isRequired,
        widgetHint: PropTypes.string.isRequired,
        widgetAction: PropTypes.string.isRequired,
        cancel: PropTypes.string.isRequired,
        save: PropTypes.string.isRequired,
    }).isRequired,
    isRightToLeft: PropTypes.bool,
    onChosenCountChange: PropTypes.func.isRequired,
}


export default WidgetActionsControls
