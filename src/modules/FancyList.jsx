import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import Spinner from './Spinner.jsx'
import '../styles/FancyList.css'

function FancyList({
                       items,
                       onSelect,
                       title,
                       headerElements,
                       emptyMessage,
                       isLoading = false,
                       selectedId = null,
                   }) {
    const { t } = useTranslation(['common'])

    const rows = Array.isArray(items) ? items : []

    return (
        <div className={'fancy-list'}>
            {title && (
                <h2 className={'fancy-list-title'}>{title}</h2>
            )}

            {Array.isArray(headerElements) && headerElements.length > 0 && (
                <div className={'fancy-list-header'}>
                    {headerElements}
                </div>
            )}

            {isLoading && <Spinner/>}

            {rows.length === 0 && (
                <div className={'fancy-list-empty'}>
                    <h3>{emptyMessage || t('common.no-table-enteries-found', { ns: 'common' })}</h3>
                </div>
            )}

            {rows.length > 0 && (
                <ul className={'fancy-list-items'}>
                    {rows.map((item) => (
                        <li key={item.id} className={'fancy-list-item-wrapper'}>
                            <button
                                type={'button'}
                                className={`fancy-list-item ${selectedId === item.id ? 'selected' : ''}`}
                                onClick={() => onSelect(item)}
                            >
                                <span className={'fancy-list-item-body'}>
                                    <span className={'fancy-list-item-title'}>{item.title}</span>

                                    {item.subtitle && (
                                        <span className={'fancy-list-item-subtitle'}>{item.subtitle}</span>
                                    )}
                                </span>

                                <span className={'fancy-list-item-side'}>
                                    {item.badge && (
                                        <span className={'fancy-list-item-badge'}>{item.badge}</span>
                                    )}

                                    {item.meta && (
                                        <span className={'fancy-list-item-meta'}>{item.meta}</span>
                                    )}

                                    <span className={'fancy-list-item-chevron'} aria-hidden={'true'}>&#10095;</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}


FancyList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string,
        meta: PropTypes.string,
        badge: PropTypes.string,
    })),
    onSelect: PropTypes.func.isRequired,
    title: PropTypes.string,
    headerElements: PropTypes.array,
    emptyMessage: PropTypes.string,
    isLoading: PropTypes.bool,
    selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}


export default FancyList
