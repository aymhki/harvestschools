import { useEffect, useMemo, useState, useCallback, Fragment, useRef } from "react";
import PropTypes from "prop-types";
import '../styles/Table.css';
import { animated, useSpring } from 'react-spring';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useTranslation } from 'react-i18next';

function Table({
                   tableHeader,
                   tableData,
                   numCols,
                   sortConfigParam,
                   scrollable,
                   compact,
                   allowHideColumns,
                   defaultHiddenColumns,
                   allowExport,
                   exportFileName,
                   filterableColumns,
                   headerModuleElements,
                   onDeleteEntry,
                   allowDeleteEntryOption,
                   columnsToWrap,
                   allowEditEntryOption,
                   onEditEntryOption,
                   likelyUrlColumns,
                   allowSticky,
                   bottomHorizontalScrollBar
               }) {
    const [sortConfig, setSortConfig] = useState(sortConfigParam ? sortConfigParam : { column: null, direction: 'neutral' });
    const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns || []));
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
    const [columnToFilterBasedOn, setColumnToFilterBasedOn] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobile, setIsMobile] = useState(true);
    const [finalTableData, setFinalTableData] = useState(tableData);
    const [rowMapping, setRowMapping] = useState([]);
    const { t } = useTranslation();

    const scrollContainerRef = useRef(null);
    const scrollbarTrackRef = useRef(null);
    const scrollbarThumbRef = useRef(null);
    const tableModuleRef = useRef(null);
    const tableRef = useRef(null);

    const [isScrollbarVisible, setIsScrollbarVisible] = useState(false);
    const [thumbWidth, setThumbWidth] = useState(0);
    const [thumbLeft, setThumbLeft] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftStart, setScrollLeftStart] = useState(0);

    const [stickyRows, setStickyRows] = useState(allowSticky ? 1 : 0);
    const [stickyCols, setStickyCols] = useState(allowSticky ? 1 : 0);
    const [hoveredCell, setHoveredCell] = useState({ r: null, c: null });
    const [colWidths, setColWidths] = useState([]);
    const [rowHeights, setRowHeights] = useState([]);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        return false;
    });

    const contentAnimation = useSpring({
        opacity: isAccordionOpen ? 1 : 0,
        transform: isAccordionOpen ? 'translateY(0)' : 'translateY(-100%)',
        config: { duration: 300 },
    });

    const popupAnimation = useSpring({
        opacity: isFilterPopupOpen ? 1 : 0,
        transform: isFilterPopupOpen ? 'translateY(0)' : 'translateY(-100%)',
        config: { duration: 300 },
    });

    const updateStickyOffsets = useCallback(() => {
        if (!tableRef.current) return;
        const rows = Array.from(tableRef.current.querySelectorAll('tr'));
        if (rows.length === 0) return;

        const heights = rows.map(r => r.getBoundingClientRect().height);
        const firstRowCells = Array.from(rows[0].children);
        const widths = firstRowCells.map(c => c.getBoundingClientRect().width);

        setRowHeights(heights);
        setColWidths(widths);
    }, [finalTableData, isAccordionOpen, isMobile, compact]);

    useEffect(() => {
        updateStickyOffsets();
        const resizeObserver = new ResizeObserver(updateStickyOffsets);
        if (scrollContainerRef.current) {
            resizeObserver.observe(scrollContainerRef.current);
        }
        window.addEventListener('resize', updateStickyOffsets);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateStickyOffsets);
        };
    }, [updateStickyOffsets]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (event) => {
            setIsDarkMode(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const applyScroll = (element, amount, smooth = false) => {
        const behavior = smooth ? 'smooth' : 'auto';
        if (amount === 0) return 0;
        if (!element) {
            const maxScroll = document.documentElement.scrollWidth - document.documentElement.clientWidth;
            if (maxScroll <= 0) return amount;
            const currentScroll = window.scrollX || window.pageXOffset;
            let newScroll = currentScroll + amount;
            let remainder = 0;
            if (newScroll > maxScroll) {
                remainder = newScroll - maxScroll;
                window.scrollTo({ left: maxScroll, behavior });
            } else if (newScroll < 0) {
                remainder = newScroll;
                window.scrollTo({ left: 0, behavior });
            } else {
                window.scrollTo({ left: newScroll, behavior });
                remainder = 0;
            }
            return remainder;
        }

        const maxScroll = element.scrollWidth - element.clientWidth;
        if (maxScroll <= 0) return amount;

        const currentScroll = element.scrollLeft;
        let newScroll = currentScroll + amount;
        let remainder = 0;

        if (newScroll > maxScroll) {
            remainder = newScroll - maxScroll;
            element.scrollTo({ left: maxScroll, behavior });
        } else if (newScroll < 0) {
            remainder = newScroll;
            element.scrollTo({ left: 0, behavior });
        } else {
            element.scrollTo({ left: newScroll, behavior });
            remainder = 0;
        }
        return remainder;
    };

    const cascadeScroll = useCallback((amount, smooth = false) => {
        let rem = applyScroll(scrollContainerRef.current, amount, smooth);
        if (rem !== 0) {
            rem = applyScroll(tableModuleRef.current, rem, smooth);
            if (rem !== 0) {
                applyScroll(null, rem, smooth);
            }
        }
    }, []);

    const updateThumbPosition = useCallback(() => {
        if (isDragging) return;
        const container = scrollContainerRef.current;
        const trackWidth = scrollbarTrackRef.current?.clientWidth || 0;
        if (!container || trackWidth === 0) return;

        const containerMax = Math.max(container.scrollWidth - container.clientWidth, 0);
        const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollWidth - tableModuleRef.current.clientWidth, 0) : 0;
        const windowMax = Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0);
        const totalMax = containerMax + moduleMax + windowMax;

        if (totalMax <= 0) return;

        const currentModule = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
        const currentWindow = window.scrollX || window.pageXOffset;
        const currentTotal = container.scrollLeft + currentModule + currentWindow;

        const ratio = currentTotal / totalMax;
        const maxThumbLeft = trackWidth - thumbWidth;
        setThumbLeft(Math.max(0, Math.min(ratio * maxThumbLeft, maxThumbLeft)));
    }, [isDragging, thumbWidth]);

    useEffect(() => {
        const handleExternalScroll = () => updateThumbPosition();
        window.addEventListener('scroll', handleExternalScroll);
        const moduleEl = tableModuleRef.current;
        if (moduleEl) moduleEl.addEventListener('scroll', handleExternalScroll);
        return () => {
            window.removeEventListener('scroll', handleExternalScroll);
            if (moduleEl) moduleEl.removeEventListener('scroll', handleExternalScroll);
        };
    }, [updateThumbPosition]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setStartX(e.clientX);
        const container = scrollContainerRef.current;
        const moduleScroll = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
        const windowScroll = window.scrollX || window.pageXOffset;
        setScrollLeftStart(container ? container.scrollLeft + moduleScroll + windowScroll : 0);
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        const trackWidth = scrollbarTrackRef.current?.clientWidth || 0;
        const container = scrollContainerRef.current;
        if (!container) return;

        const containerMax = Math.max(container.scrollWidth - container.clientWidth, 0);
        const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollWidth - tableModuleRef.current.clientWidth, 0) : 0;
        const windowMax = Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0);
        const totalMax = containerMax + moduleMax + windowMax;
        const maxThumbLeft = trackWidth - thumbWidth;

        if (maxThumbLeft <= 0 || totalMax <= 0) return;

        const scrollRatio = dx / maxThumbLeft;
        const targetTotalScroll = scrollLeftStart + scrollRatio * totalMax;

        const currentModule = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
        const currentWindow = window.scrollX || window.pageXOffset;
        const currentTotal = container.scrollLeft + currentModule + currentWindow;

        const delta = targetTotalScroll - currentTotal;
        cascadeScroll(delta, false);

        setThumbLeft(Math.max(0, Math.min((targetTotalScroll / totalMax) * maxThumbLeft, maxThumbLeft)));
    }, [isDragging, startX, scrollLeftStart, thumbWidth, cascadeScroll]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
        const container = scrollContainerRef.current;
        const moduleScroll = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
        const windowScroll = window.scrollX || window.pageXOffset;
        setScrollLeftStart(container ? container.scrollLeft + moduleScroll + windowScroll : 0);
    };

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - startX;
        const trackWidth = scrollbarTrackRef.current?.clientWidth || 0;
        const container = scrollContainerRef.current;
        if (!container) return;

        const containerMax = Math.max(container.scrollWidth - container.clientWidth, 0);
        const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollWidth - tableModuleRef.current.clientWidth, 0) : 0;
        const windowMax = Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0);
        const totalMax = containerMax + moduleMax + windowMax;
        const maxThumbLeft = trackWidth - thumbWidth;

        if (maxThumbLeft <= 0 || totalMax <= 0) return;

        const scrollRatio = dx / maxThumbLeft;
        const targetTotalScroll = scrollLeftStart + scrollRatio * totalMax;
        const currentModule = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
        const currentWindow = window.scrollX || window.pageXOffset;
        const currentTotal = container.scrollLeft + currentModule + currentWindow;

        const delta = targetTotalScroll - currentTotal;
        cascadeScroll(delta, false);

        setThumbLeft(Math.max(0, Math.min((targetTotalScroll / totalMax) * maxThumbLeft, maxThumbLeft)));
    }, [isDragging, startX, scrollLeftStart, thumbWidth, cascadeScroll]);

    const handleTouchEnd = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        } else {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, handleTouchMove, handleTouchEnd]);

    const scrollIntervalRef = useRef(null);

    const scrollBy = useCallback((direction) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const cols = finalTableData && finalTableData[0] ? finalTableData[0].length : 1;
        const step = Math.max(container.clientWidth / Math.max(cols / 2, 1), container.clientWidth / 4);
        const amount = step * direction;
        cascadeScroll(amount, true);
    }, [finalTableData, cascadeScroll]);

    const startScrolling = useCallback((direction) => {
        scrollBy(direction);
        scrollIntervalRef.current = setInterval(() => scrollBy(direction), 200);
    }, [scrollBy]);

    const stopScrolling = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        };
    }, []);

    const handleTrackClick = (e) => {
        if (e.target.closest('.custom-scrollbar-thumb')) return;
        const track = e.currentTarget;
        const container = scrollContainerRef.current;
        if (!track || !container) return;

        const rect = track.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const trackWidth = rect.width;

        const containerMax = Math.max(container.scrollWidth - container.clientWidth, 0);
        const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollWidth - tableModuleRef.current.clientWidth, 0) : 0;
        const windowMax = Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0);
        const totalMax = containerMax + moduleMax + windowMax;
        const maxThumbLeft = trackWidth - thumbWidth;

        const targetThumbLeft = clickX - (thumbWidth / 2);
        const clampedThumbLeft = Math.max(0, Math.min(targetThumbLeft, maxThumbLeft));
        const scrollRatio = maxThumbLeft > 0 ? clampedThumbLeft / maxThumbLeft : 0;
        const targetTotalScroll = scrollRatio * totalMax;

        const currentModule = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
        const currentWindow = window.scrollX || window.pageXOffset;
        const currentTotal = container.scrollLeft + currentModule + currentWindow;

        const delta = targetTotalScroll - currentTotal;
        cascadeScroll(delta, true);
    };

    useEffect(() => {
        if (!scrollable) {
            setIsScrollbarVisible(false);
            return;
        }
        const container = scrollContainerRef.current;
        if (!container) return;

        const checkOverflow = () => {
            const containerMax = Math.max(container.scrollWidth - container.clientWidth, 0);
            if (containerMax > 0) {
                setIsScrollbarVisible(true);
                const trackWidth = scrollbarTrackRef.current?.clientWidth || 0;
                if (trackWidth > 0) {
                    const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollWidth - tableModuleRef.current.clientWidth, 0) : 0;
                    const windowMax = Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0);
                    const totalMax = containerMax + moduleMax + windowMax;

                    const ratio = container.clientWidth / (container.clientWidth + totalMax);
                    const minWidth = isMobile ? 80 : 30;
                    const newThumbWidth = Math.max(ratio * trackWidth, minWidth);
                    setThumbWidth(newThumbWidth);

                    const moduleScroll = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
                    const windowScroll = window.scrollX || window.pageXOffset;
                    const currentTotal = container.scrollLeft + moduleScroll + windowScroll;

                    const scrollRatio = totalMax > 0 ? currentTotal / totalMax : 0;
                    const maxThumbLeft = trackWidth - newThumbWidth;
                    setThumbLeft(scrollRatio * maxThumbLeft);
                }
            } else {
                setIsScrollbarVisible(false);
            }
        };

        const timeoutId = setTimeout(checkOverflow, 50);
        const resizeObserver = new ResizeObserver(checkOverflow);
        resizeObserver.observe(container);
        const table = container.querySelector('table');
        if (table) resizeObserver.observe(table);
        window.addEventListener('resize', checkOverflow);

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkOverflow);
        };
    }, [finalTableData, hiddenColumns, isAccordionOpen, isFilterPopupOpen, compact, scrollable, tableData, isMobile]);

    const sortedDataWithIndices = useMemo(() => {
        if (!tableData || tableData.length === 0) return [];
        const withIndices = tableData?.map((row, index) => ({ row, originalIndex: index }));
        const startIndex = tableHeader ? 2 : 1;

        if (sortConfig.column === null || sortConfig.direction === 'neutral') return withIndices;

        const compare = (a, b) => {
            const valueA = a.row[sortConfig.column];
            const valueB = b.row[sortConfig.column];
            const numA = Number(valueA);
            const numB = Number(valueB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortConfig.direction === 'ascending' ? numA - numB : numB - numA;
            }
            if (valueA < valueB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valueA > valueB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        };
        const headerRows = withIndices?.slice(0, startIndex);
        const dataRows = withIndices?.slice(startIndex).sort(compare);
        return [...headerRows, ...dataRows];
    }, [tableData, sortConfig, tableHeader]);

    const sortedData = useMemo(() => sortedDataWithIndices?.map(item => item.row), [sortedDataWithIndices]);

    const getFilterUniqueValuesDict = useCallback(() => {
        if (!tableData || !tableData.length || !tableData[0]) return {};
        const filterUniqueValuesDict = {};
        const startIndex = tableHeader ? 2 : 1;

        if (filterableColumns && filterableColumns.length > 0) {
            for (let i = 0; i < tableData[0].length; i++) {
                const columnName = tableData[0][i];
                if (filterableColumns.includes(columnName)) {
                    const uniqueValues = [...new Set(
                        tableData?.slice(startIndex)
                            .map(row => row[i])
                            .filter(value => value !== undefined && value !== null)
                    )];
                    filterUniqueValuesDict[columnName] = {
                        uniqueValues: uniqueValues,
                        checked: new Array(uniqueValues.length).fill(true)
                    };
                }
            }
        }
        return filterUniqueValuesDict;
    }, [tableHeader, tableData, filterableColumns]);

    const [filterUniqueValuesDict, setFilterUniqueValuesDict] = useState({});

    useEffect(() => {
        if (tableData && tableData.length > 0) {
            setFilterUniqueValuesDict(getFilterUniqueValuesDict());
        }
    }, [tableData, getFilterUniqueValuesDict]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const requestSort = (columnIndex) => {
        let direction = 'ascending';
        if (sortConfig.column === columnIndex) {
            if (sortConfig.direction === 'ascending') direction = 'descending';
            else if (sortConfig.direction === 'descending') {
                direction = 'neutral';
                columnIndex = null;
            }
        }
        setSortConfig({ column: columnIndex, direction });
    };

    const getSortIndicator = (columnIndex) => {
        if (sortConfig.column !== columnIndex) return ' ⇅';
        if (sortConfig.direction === 'ascending') return ' ⇧';
        if (sortConfig.direction === 'descending') return ' ⇩';
        return ' ⇅';
    };

    const applyLikelyUrlFunction = (columnName, cellValue) => {
        if (likelyUrlColumns && likelyUrlColumns[columnName]) {
            return <p className={"table-link"} lang={"en"} onClick={() => likelyUrlColumns[columnName](cellValue)}>{cellValue}</p>;
        } else {
            return cellValue;
        }
    }

    const toggleColumnVisibility = (column) => {
        setHiddenColumns((prevHidden) => {
            const newHidden = new Set(prevHidden);
            if (newHidden.has(column)) newHidden.delete(column);
            else newHidden.add(column);
            return newHidden;
        });
    };

    const detectLang = (text) => /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';

    const updateFinalTableData = useCallback(() => {
        if (!tableData || !tableData.length) {
            setFinalTableData([]);
            setRowMapping([]);
            return;
        }

        let filteredDataWithIndices = [...sortedDataWithIndices];
        if (filterableColumns && filterableColumns.length > 0) {
            for (let i = 0; i < tableData[0].length; i++) {
                const columnName = tableData[0][i];
                if (filterableColumns.includes(columnName) && filterUniqueValuesDict[columnName]) {
                    const columnFilter = filterUniqueValuesDict[columnName];
                    filteredDataWithIndices = filteredDataWithIndices.filter((item, rowIndex) => {
                        if (rowIndex === 0 || (tableHeader && rowIndex === 1)) return true;
                        const cellValue = item.row[i];
                        const valueIndex = columnFilter.uniqueValues.indexOf(cellValue);
                        if (valueIndex === -1) return true;
                        return columnFilter.checked[valueIndex];
                    });
                }
            }
        }

        const newRowMapping = filteredDataWithIndices?.map(item => item.originalIndex);
        setRowMapping(newRowMapping);
        const filteredData = filteredDataWithIndices?.map(item =>
            item.row.filter((cell, colIndex) => !hiddenColumns.has(sortedData[0][colIndex]))
        );
        setFinalTableData(filteredData);
    }, [sortedDataWithIndices, sortedData, hiddenColumns, filterUniqueValuesDict, tableData, filterableColumns, tableHeader]);

    useEffect(() => {
        updateFinalTableData();
    }, [hiddenColumns, sortedDataWithIndices, filterUniqueValuesDict, updateFinalTableData]);

    useEffect(() => {
        updateFinalTableData();
    }, [sortConfig, updateFinalTableData]);

    const hasActiveFilters = useCallback(() => {
        if (!filterUniqueValuesDict) return false;
        return Object.keys(filterUniqueValuesDict).some(key =>
            filterUniqueValuesDict[key] && filterUniqueValuesDict[key].checked && filterUniqueValuesDict[key].checked.includes(false)
        );
    }, [filterUniqueValuesDict]);

    const resetAllFilters = useCallback(() => {
        const updatedFilters = { ...filterUniqueValuesDict };
        Object.keys(updatedFilters).forEach(key => {
            if (updatedFilters[key] && updatedFilters[key].checked) {
                updatedFilters[key].checked = updatedFilters[key].checked.map(() => true);
            }
        });
        setFilterUniqueValuesDict(updatedFilters);
    }, [filterUniqueValuesDict]);

    const renderCustomScrollbar = (isTop) => {
        if (!scrollable) return null;
        return (
            <div className={`custom-scrollbar-container ${!isTop ? 'footer' : ''} ${isScrollbarVisible ? 'visible' : ''} ${isDragging ? 'is-dragging' : ''}`}>
                <button
                    className="custom-scrollbar-arrow"
                    onMouseDown={() => startScrolling(-1)}
                    onMouseUp={stopScrolling}
                    onMouseLeave={stopScrolling}
                    onTouchStart={() => startScrolling(-1)}
                    onTouchEnd={stopScrolling}
                    aria-label="Scroll Left"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <div
                    className="custom-scrollbar-track"
                    ref={isTop ? scrollbarTrackRef : null}
                    onClick={handleTrackClick}
                >
                    <div
                        className={`custom-scrollbar-thumb ${isDragging ? 'dragging' : ''}`}
                        ref={isTop ? scrollbarThumbRef : null}
                        style={{ width: `${thumbWidth}px`, transform: `translateX(${thumbLeft}px)` }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                    >
                        <div className="thumb-grip">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
                <button
                    className="custom-scrollbar-arrow"
                    onMouseDown={() => startScrolling(1)}
                    onMouseUp={stopScrolling}
                    onMouseLeave={stopScrolling}
                    onTouchStart={() => startScrolling(1)}
                    onTouchEnd={stopScrolling}
                    aria-label="Scroll Right"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        );
    };

    return (
        <div className="table-module" ref={tableModuleRef} style={{ overflow: scrollable ? 'auto' : 'hidden' }}>
            <div className={"table-module-header"}>
                <div className={"table-module-header-buttons-wrapper"}>
                    {(!finalTableData || finalTableData.length === 0) && (
                        <div className={"table-module-header-empty-state"}>
                            <h3>{t("common.no-table-enteries-found", { ns: 'common' })}</h3>
                        </div>
                    )}
                    {finalTableData && allowHideColumns && (
                        <button onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
                            {isAccordionOpen ? 'Hide Columns' : 'Show Columns'}
                        </button>
                    )}
                    {finalTableData && allowExport && (
                        <button onClick={() => {
                            if (!finalTableData) return;
                            const csv = finalTableData.map(row =>
                                row.map(field => {
                                    if (field && typeof field === 'string' && field.length > 0) {
                                        return (field.includes(',') || field.includes('\n')) ? `"${field}"` : field
                                    } else return '';
                                }).join(',')
                            ).join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${exportFileName ? exportFileName : 'table'}-${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }}>
                            Export to CSV
                        </button>
                    )}
                    {finalTableData && hasActiveFilters() && (
                        <button onClick={resetAllFilters}>Reset Filters</button>
                    )}
                    {headerModuleElements && headerModuleElements.map((element, index) => (
                        <Fragment key={index}>{element}</Fragment>
                    ))}
                </div>

                {renderCustomScrollbar(true)}
            </div>

            <div
                className={`table-scroll-container ${scrollable ? 'table-module-table-scrollable scrollable' : ''}`}
                ref={scrollContainerRef}
                onScroll={updateThumbPosition}
            >
                <table className="table-module-table" ref={tableRef}>
                    <tbody>
                    {tableHeader &&
                        <tr>
                            <th colSpan={numCols} style={{
                                position: stickyRows > 0 ? 'sticky' : 'relative',
                                top: 0,
                                zIndex: stickyRows > 0 ? 4 : undefined,
                                backgroundColor: 'var(--harvest-white-color)'
                            }}>
                                <h1>{tableHeader}</h1>
                            </th>
                        </tr>
                    }
                    {finalTableData && finalTableData.map((row, rowIndex) => {
                        const actualRowIndex = tableHeader ? rowIndex + 1 : rowIndex;
                        return (
                            <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => {
                                    const isStickyRow = actualRowIndex < stickyRows;
                                    const isStickyCol = cellIndex < stickyCols;
                                    const isCorner = isStickyRow && isStickyCol;

                                    const isHovered = hoveredCell.r === actualRowIndex && hoveredCell.c === cellIndex;
                                    const showColControl = isHovered && rowIndex === 0 && cellIndex < 1;
                                    const showRowControl = isHovered && cellIndex === 0 && rowIndex < 1;

                                    let inlineStyles = {
                                        cursor: rowIndex === 0 ? 'pointer' : 'default',
                                        whiteSpace: `${(scrollable && rowIndex === 0) ? 'nowrap' : 'normal'}`,
                                        position: (isStickyRow || isStickyCol) ? 'sticky' : 'relative',
                                        zIndex: isCorner ? 3 : (isStickyRow || isStickyCol ? 2 : undefined),
                                        backgroundColor: (isStickyRow || isStickyCol) ? isDarkMode ? 'var(--dark-accent-color)' : 'var(--harvest-off-white-color)' : undefined,
                                    };

                                    if (isStickyRow) {
                                        inlineStyles.top = rowHeights.slice(0, actualRowIndex).reduce((a, b) => a + b, 0) || 0;
                                    }

                                    if (isStickyCol) {
                                        inlineStyles.left = colWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0) || 0;
                                    }

                                    return (
                                        <td
                                            key={cellIndex}
                                            style={inlineStyles}
                                            onMouseEnter={() => setHoveredCell({ r: actualRowIndex, c: cellIndex })}
                                            onMouseLeave={() => setHoveredCell({ r: null, c: null })}
                                        >
                                            {allowSticky && (showColControl || showRowControl) && (
                                                <div className="sticky-control-widget">
                                                    {showColControl && (
                                                        <label className="sticky-control-checkbox" title="Fix all columns up to this one">
                                                            <input
                                                                type="checkbox"
                                                                checked={stickyCols > cellIndex}
                                                                onChange={(e) => setStickyCols(e.target.checked ? cellIndex + 1 : cellIndex)}
                                                            /> Fix Col
                                                        </label>
                                                    )}
                                                    {showRowControl && (
                                                        <label className="sticky-control-checkbox" title="Fix all rows up to this one">
                                                            <input
                                                                type="checkbox"
                                                                checked={stickyRows > actualRowIndex}
                                                                onChange={(e) => setStickyRows(e.target.checked ? actualRowIndex + 1 : actualRowIndex)}
                                                            /> Fix Row
                                                        </label>
                                                    )}
                                                </div>
                                            )}

                                            {rowIndex === 0 ? (
                                                <>
                                                    {compact ? (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            wordWrap: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'break-word' : 'normal',
                                                            textWrap: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'wrap' : 'nowrap',
                                                            padding: '0.5rem',
                                                        }}
                                                             className={"compact-table-header-row"}
                                                        >
                                                            <h3 className={"compact-table-header-text"} lang={detectLang(cell)} onClick={() => requestSort(cellIndex)}>
                                                                {cell}{getSortIndicator(cellIndex)}
                                                            </h3>
                                                            {(filterableColumns && finalTableData[0] && filterableColumns.includes(finalTableData[0][cellIndex])) &&
                                                                <FilterAltIcon onClick={() => {
                                                                    setIsFilterPopupOpen(!isFilterPopupOpen);
                                                                    setSearchQuery('');
                                                                    setColumnToFilterBasedOn(finalTableData[0][cellIndex]);
                                                                }} />
                                                            }
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '0.5rem',
                                                        }}
                                                             className={"compact-table-header-row"}
                                                        >
                                                            <h2 lang={detectLang(cell)} onClick={() => requestSort(cellIndex)}>
                                                                {cell}{getSortIndicator(cellIndex)}
                                                            </h2>
                                                            {(filterableColumns && finalTableData[0] && filterableColumns.includes(finalTableData[0][cellIndex])) &&
                                                                <FilterAltIcon onClick={() => {
                                                                    setIsFilterPopupOpen(!isFilterPopupOpen);
                                                                    setSearchQuery('');
                                                                    setColumnToFilterBasedOn(finalTableData[0][cellIndex]);
                                                                }} />
                                                            }
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {compact ? (
                                                        <p className={"compact-table-cell-text"} lang={detectLang(cell)}>
                                                            {applyLikelyUrlFunction(finalTableData[0][cellIndex], cell)}
                                                        </p>
                                                    ) : (
                                                        <p lang={detectLang(cell)}>
                                                            {applyLikelyUrlFunction(finalTableData[0][cellIndex], cell)}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    );
                                })}
                                {allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") && (
                                    <td
                                        onMouseEnter={() => setHoveredCell({ r: actualRowIndex, c: row.length })}
                                        onMouseLeave={() => setHoveredCell({ r: null, c: null })}
                                        style={{
                                            textAlign: 'center',
                                            position: (actualRowIndex < stickyRows || row.length < stickyCols) ? 'sticky' : 'relative',
                                            zIndex: (actualRowIndex < stickyRows && row.length < stickyCols) ? 3 : ((actualRowIndex < stickyRows || row.length < stickyCols) ? 2 : undefined),
                                            backgroundColor: (actualRowIndex < stickyRows || row.length < stickyCols) ? isDarkMode ? 'var(--dark-accent-color)' : 'var(--harvest-off-white-color)' : undefined,
                                            top: actualRowIndex < stickyRows ? (rowHeights.slice(0, actualRowIndex).reduce((a, b) => a + b, 0) || 0) : undefined,
                                            left: row.length < stickyCols ? (colWidths.slice(0, row.length).reduce((a, b) => a + b, 0) || 0) : undefined,
                                        }}>
                                        {(() => {
                                            const editCellIndex = row.length;
                                            const isHoveredEdit = hoveredCell.r === actualRowIndex && hoveredCell.c === editCellIndex;
                                            const showColControlEdit = isHoveredEdit && rowIndex === 0 && editCellIndex < 1;
                                            const showRowControlEdit = isHoveredEdit && editCellIndex === 0 && rowIndex < 1;

                                            return allowSticky && (showColControlEdit || showRowControlEdit) ? (
                                                <div className="sticky-control-widget">
                                                    {showColControlEdit && (
                                                        <label className="sticky-control-checkbox" title="Fix all columns up to this one">
                                                            <input
                                                                type="checkbox"
                                                                checked={stickyCols > editCellIndex}
                                                                onChange={(e) => setStickyCols(e.target.checked ? editCellIndex + 1 : editCellIndex)}
                                                            /> Fix Col
                                                        </label>
                                                    )}
                                                    {showRowControlEdit && (
                                                        <label className="sticky-control-checkbox" title="Fix all rows up to this one">
                                                            <input
                                                                type="checkbox"
                                                                checked={stickyRows > actualRowIndex}
                                                                onChange={(e) => setStickyRows(e.target.checked ? actualRowIndex + 1 : actualRowIndex)}
                                                            /> Fix Row
                                                        </label>
                                                    )}
                                                </div>
                                            ) : null;
                                        })()}
                                        {rowIndex === 0 ? (
                                            <h3 className={"compact-table-header-text"}>Edit</h3>
                                        ) : (
                                            <button onClick={() => onEditEntryOption(rowMapping[rowIndex])} aria-label="Edit row">Edit</button>
                                        )}
                                    </td>
                                )}
                                {allowDeleteEntryOption && onDeleteEntry && !hiddenColumns.has("Delete") && (
                                    <td
                                        onMouseEnter={() => setHoveredCell({ r: actualRowIndex, c: row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0) })}
                                        onMouseLeave={() => setHoveredCell({ r: null, c: null })}
                                        style={{
                                            textAlign: 'center',
                                            position: (actualRowIndex < stickyRows || (row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0)) < stickyCols) ? 'sticky' : 'relative',
                                            zIndex: (actualRowIndex < stickyRows && (row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0)) < stickyCols) ? 3 : ((actualRowIndex < stickyRows || (row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0)) < stickyCols) ? 2 : undefined),
                                            backgroundColor: (actualRowIndex < stickyRows || (row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0)) < stickyCols) ? isDarkMode ? 'var(--dark-accent-color)' : 'var(--harvest-off-white-color)' : undefined,
                                            top: actualRowIndex < stickyRows ? (rowHeights.slice(0, actualRowIndex).reduce((a, b) => a + b, 0) || 0) : undefined,
                                            left: (row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0)) < stickyCols ? (colWidths.slice(0, row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0)).reduce((a, b) => a + b, 0) || 0) : undefined,
                                        }}>
                                        {(() => {
                                            const deleteCellIndex = row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0);
                                            const isHoveredDelete = hoveredCell.r === actualRowIndex && hoveredCell.c === deleteCellIndex;
                                            const showColControlDelete = isHoveredDelete && rowIndex === 0 && deleteCellIndex < 1;
                                            const showRowControlDelete = isHoveredDelete && deleteCellIndex === 0 && rowIndex < 1;

                                            return allowSticky && (showColControlDelete || showRowControlDelete) ? (
                                                <div className="sticky-control-widget">
                                                    {showColControlDelete && (
                                                        <label className="sticky-control-checkbox" title="Fix all columns up to this one">
                                                            <input
                                                                type="checkbox"
                                                                checked={stickyCols > deleteCellIndex}
                                                                onChange={(e) => setStickyCols(e.target.checked ? deleteCellIndex + 1 : deleteCellIndex)}
                                                            /> Fix Col
                                                        </label>
                                                    )}
                                                    {showRowControlDelete && (
                                                        <label className="sticky-control-checkbox" title="Fix all rows up to this one">
                                                            <input
                                                                type="checkbox"
                                                                checked={stickyRows > actualRowIndex}
                                                                onChange={(e) => setStickyRows(e.target.checked ? actualRowIndex + 1 : actualRowIndex)}
                                                            /> Fix Row
                                                        </label>
                                                    )}
                                                </div>
                                            ) : null;
                                        })()}
                                        {rowIndex === 0 ? (
                                            <h3 className={"compact-table-header-text"}>Delete</h3>
                                        ) : (
                                            <button onClick={() => onDeleteEntry(rowMapping[rowIndex])} aria-label="Delete row">Delete</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>

            <div className={"table-module-footer"}>

                {bottomHorizontalScrollBar && renderCustomScrollbar(false)}
            </div>

            <animated.div className="table-module-accordion" style={contentAnimation}>
                <div className="table-module-accordion-overlay" onClick={() => setIsAccordionOpen(false)} />
                <div className="table-module-accordion-content">
                    <div className="table-module-accordion-buttons">
                        <button onClick={() => setHiddenColumns(new Set(tableData && tableData[0] ? tableData[0].filter((header) => defaultHiddenColumns && defaultHiddenColumns.includes(header)) : []))}>Default</button>
                        <button onClick={() => setHiddenColumns(new Set())}>Show All</button>
                        <button onClick={() => {
                            const allHeaders = tableData && tableData[0] ? [...tableData[0]] : [];
                            setHiddenColumns(new Set([...allHeaders, "Edit", "Delete"]));
                        }}>Hide All</button>
                        <button onClick={() => setIsAccordionOpen(false)}>Close</button>
                    </div>
                    {tableData && tableData[0] && tableData[0].map((header, index) => (
                        <div key={index}>
                            <label><input type="checkbox" checked={!hiddenColumns.has(header)} onChange={() => toggleColumnVisibility(header)} />{'\t' + header}</label>
                        </div>
                    ))}
                    {allowEditEntryOption && onEditEntryOption && (
                        <div>
                            <label><input type="checkbox" checked={!hiddenColumns.has("Edit")} onChange={() => toggleColumnVisibility("Edit")} />{'\tEdit Column'}</label>
                        </div>
                    )}
                    {allowDeleteEntryOption && onDeleteEntry && (
                        <div>
                            <label><input type="checkbox" checked={!hiddenColumns.has("Delete")} onChange={() => toggleColumnVisibility("Delete")} />{'\tDelete Column'}</label>
                        </div>
                    )}
                </div>
            </animated.div>

            <animated.div className={"table-module-filter-popup-container"} style={popupAnimation}>
                <div className={"table-module-filter-popup-background"} onClick={() => { setIsFilterPopupOpen(false); setSearchQuery(''); }} />
                <div className={"table-module-filter-popup"}>
                    <div className={"table-module-filter-popup-content"}>
                        <h2>Filter Options</h2>
                        <div>
                            <h3>Unique Values</h3>
                            <input type="text" className={"table-module-filter-search-input-field"} placeholder={"Search"} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <div className={"table-module-filter-popup-values-list"}>
                                {columnToFilterBasedOn && filterUniqueValuesDict[columnToFilterBasedOn] && filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues
                                    .filter(value => searchQuery ? value && value.toString().toLowerCase().includes(searchQuery.toLowerCase()) : true)
                                    .map((value, index) => (
                                        <label key={index}>
                                            <input type="checkbox" checked={filterUniqueValuesDict[columnToFilterBasedOn].checked[filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues.indexOf(value)]} onChange={() => {
                                                const updatedFilters = { ...filterUniqueValuesDict };
                                                const valueIndex = updatedFilters[columnToFilterBasedOn].uniqueValues.indexOf(value);
                                                if (valueIndex !== -1) {
                                                    updatedFilters[columnToFilterBasedOn].checked[valueIndex] = !updatedFilters[columnToFilterBasedOn].checked[valueIndex];
                                                    setFilterUniqueValuesDict(updatedFilters);
                                                }
                                            }} />{value}
                                        </label>
                                    ))}
                            </div>
                        </div>
                        <div className={"table-module-filter-popup-buttons-wrapper"}>
                            {columnToFilterBasedOn && filterUniqueValuesDict[columnToFilterBasedOn] && (
                                <>
                                    <button onClick={() => {
                                        const updatedFilters = { ...filterUniqueValuesDict };
                                        if (updatedFilters[columnToFilterBasedOn]) {
                                            updatedFilters[columnToFilterBasedOn].checked = updatedFilters[columnToFilterBasedOn].checked.map(() => true);
                                            setFilterUniqueValuesDict(updatedFilters);
                                        }
                                    }}>Check All</button>
                                    <button onClick={() => {
                                        const updatedFilters = { ...filterUniqueValuesDict };
                                        if (updatedFilters[columnToFilterBasedOn]) {
                                            updatedFilters[columnToFilterBasedOn].checked = updatedFilters[columnToFilterBasedOn].checked.map(() => false);
                                            setFilterUniqueValuesDict(updatedFilters);
                                        }
                                    }}>Uncheck All</button>
                                </>
                            )}
                            <button onClick={() => { setIsFilterPopupOpen(false); setSearchQuery(''); }}>Close</button>
                        </div>
                    </div>
                </div>
            </animated.div>
        </div>
    );
}

Table.propTypes = {
    tableHeader: PropTypes.string,
    tableData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    numCols: PropTypes.number,
    sortConfigParam: PropTypes.shape({
        column: PropTypes.number,
        direction: PropTypes.string
    }),
    scrollable: PropTypes.bool,
    compact: PropTypes.bool,
    allowHideColumns: PropTypes.bool,
    defaultHiddenColumns: PropTypes.arrayOf(PropTypes.string),
    allowExport: PropTypes.bool,
    exportFileName: PropTypes.string,
    filterableColumns: PropTypes.arrayOf(PropTypes.string),
    headerModuleElements: PropTypes.array,
    onDeleteEntry: PropTypes.func,
    allowDeleteEntryOption: PropTypes.bool,
    columnsToWrap: PropTypes.arrayOf(PropTypes.string),
    allowEditEntryOption: PropTypes.bool,
    onEditEntryOption: PropTypes.func,
    likelyUrlColumns: PropTypes.objectOf(PropTypes.func),
    allowSticky: PropTypes.bool,
    bottomHorizontalScrollBar: PropTypes.bool,
};

export default Table;