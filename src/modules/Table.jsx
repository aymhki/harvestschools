import {useEffect, useMemo, useState, useCallback, Fragment, useRef} from "react";
import PropTypes from "prop-types";
import '../styles/Table.css';
import {animated, useSpring} from 'react-spring';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {useTranslation} from 'react-i18next';

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
                    footerModuleElements,
                   onDeleteEntry,
                   allowDeleteEntryOption,
                   columnsToWrap,
                   allowEditEntryOption,
                   onEditEntryOption,
                   likelyUrlColumns,
                   allowSticky,
                   dataTypes,
                   hideHorizontalScrollBar,
                   hideVerticalScrollBar,
                   tablePages,
               }) {
    const [sortConfig, setSortConfig] = useState(sortConfigParam ? sortConfigParam : {
        column: null,
        direction: 'neutral'
    });
    const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns || []));
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
    const [columnToFilterBasedOn, setColumnToFilterBasedOn] = useState(null);
    const [uniqueValueSearch, setUniqueValueSearch] = useState('');
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return true;
    });
    const [finalTableData, setFinalTableData] = useState(tableData);
    const [rowMapping, setRowMapping] = useState([]);
    const {t} = useTranslation();
    const showPaginationOnMobile = true
    const maxItemsBeforePagination = 300;
    const mobilePageSize = 50;
    const desktopPageSize = 100;
    const [pageSize, setPageSize] = useState(isMobile ? mobilePageSize : desktopPageSize);
    const headerRowCount = tableHeader ? 2 : 1;
    const [currentPage, setCurrentPage] = useState(1);
    const scrollContainerRef = useRef(null);
    const scrollbarTrackRef = useRef(null);
    const scrollbarThumbRef = useRef(null);
    const tableModuleRef = useRef(null);
    const tableRef = useRef(null);
    const verticalScrollbarTrackRef = useRef(null);
    const verticalScrollbarThumbRef = useRef(null);
    const [isScrollbarVisible, setIsScrollbarVisible] = useState(false);
    const [thumbWidth, setThumbWidth] = useState(0);
    const [thumbLeft, setThumbLeft] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftStart, setScrollLeftStart] = useState(0);
    const [isVerticalScrollbarVisible, setIsVerticalScrollbarVisible] = useState(false);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);
    const [isVerticalDragging, setIsVerticalDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTopStart, setScrollTopStart] = useState(0);
    const [stickyRows, setStickyRows] = useState(allowSticky ? 1 : 0);
    const [stickyCols, setStickyCols] = useState(allowSticky ? 1 : 0);
    const [hoveredCell, setHoveredCell] = useState({r: null, c: null});
    const [colWidths, setColWidths] = useState([]);
    const [rowHeights, setRowHeights] = useState([]);
    const [columnFilters, setColumnFilters] = useState({});
    const showVerticalScrollBarInMobile = true
    const showHorizontalScrollBarInMobile = true
    const scrollIntervalRef = useRef(null);
    const verticalScrollIntervalRef = useRef(null);

    const dataRows = useMemo(() => {
        if (!finalTableData || finalTableData.length <= headerRowCount) return [];
        return finalTableData.slice(headerRowCount);
    }, [finalTableData, headerRowCount]);

    const [isPaginated, setIsPaginated] = useState(
        (tablePages === true) || (tablePages === undefined && (isMobile && showPaginationOnMobile && scrollable)) || (dataRows && dataRows.length > maxItemsBeforePagination)
    )
    const [totalPages, setTotalPage] = useState(Math.ceil(dataRows.length / pageSize));

    const paginatedDataRows = useMemo(() => {
        if (!isPaginated || totalPages <= 1) return dataRows;
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return dataRows.slice(start, end);
    }, [isPaginated, totalPages, currentPage, pageSize, dataRows]);

    const displayedTableData = useMemo(() => {
        if (!finalTableData) return [];
        return [...finalTableData.slice(0, headerRowCount), ...paginatedDataRows];
    }, [finalTableData, headerRowCount, paginatedDataRows]);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        return false;
    });

    const contentAnimation = useSpring({
        opacity: isAccordionOpen ? 1 : 0,
        transform: isAccordionOpen ? 'translateY(0)' : 'translateY(-100%)',
        config: {duration: 300},
    });

    const popupAnimation = useSpring({
        opacity: isFilterPopupOpen ? 1 : 0,
        transform: isFilterPopupOpen ? 'translateY(0)' : 'translateY(-100%)',
        config: {duration: 300},
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
    }, []);

    const parseDate = (val) => {
        if (!val) return null;
        let str = String(val).trim();
        if (str.includes(' ') && !str.includes('T')) {
            str = str.replace(' ', 'T');
        }
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    };

    const parseNumberValue = (val) => {
        if (val === null || val === undefined || val === '') return NaN;
        let str = String(val).trim();
        let isNegative = str.includes('-') || (str.includes('(') && str.includes(')'));
        let cleaned = str.replace(/[^\d.,]/g, '');
        const lastDot = cleaned.lastIndexOf('.');
        const lastComma = cleaned.lastIndexOf(',');
        if (lastDot > lastComma) {
            cleaned = cleaned.replace(/,/g, '');
        } else if (lastComma > lastDot) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            if (lastComma !== -1) {
                const parts = cleaned.split(',');
                if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                    cleaned = cleaned.replace(/,/g, '');
                } else {
                    cleaned = cleaned.replace(',', '.');
                }
            }
        }
        let num = parseFloat(cleaned);
        if (!isNaN(num) && isNegative) {
            num = -Math.abs(num);
        }
        return num;
    };

    const getColumnType = (columnName, dataTypes) => {
        if (!dataTypes) return 'text';
        for (const [type, columns] of Object.entries(dataTypes)) {
            if (columns.includes(columnName)) {
                return type;
            }
        }
        return 'text';
    };

    const applyFilter = useCallback((cellValue, filter) => {
        if (cellValue === undefined || cellValue === null || cellValue === '') {
            return false;
        }
        const strValue = String(cellValue).trim();

        if (filter.type === 'date') {
            const cellDate = parseDate(cellValue);
            const filterDate1 = filter.value ? parseDate(filter.value) : null;
            const filterDate2 = filter.value2 ? parseDate(filter.value2) : null;

            if (!cellDate || !filterDate1) return false;

            const cTime = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()).getTime();
            const fTime1 = new Date(filterDate1.getFullYear(), filterDate1.getMonth(), filterDate1.getDate()).getTime();
            const fTime2 = filterDate2 ? new Date(filterDate2.getFullYear(), filterDate2.getMonth(), filterDate2.getDate()).getTime() : null;

            if (filter.operator === 'equals') {
                return cTime === fTime1;
            } else if (filter.operator === 'before') {
                return cTime < fTime1;
            } else if (filter.operator === 'after') {
                return cTime > fTime1;
            } else if (filter.operator === 'between') {
                return fTime2 !== null && cTime >= fTime1 && cTime <= fTime2;
            }
        } else if (filter.type === 'number' || filter.type === 'currency') {
            const cellNum = parseNumberValue(cellValue);
            const filterNum1 = parseFloat(filter.value);
            const filterNum2 = filter.value2 ? parseFloat(filter.value2) : null;

            if (isNaN(cellNum) || isNaN(filterNum1)) return false;

            if (filter.operator === 'equals') {
                return cellNum === filterNum1;
            } else if (filter.operator === 'less_than') {
                return cellNum < filterNum1;
            } else if (filter.operator === 'greater_than') {
                return cellNum > filterNum1;
            } else if (filter.operator === 'between') {
                return filterNum2 !== null && !isNaN(filterNum2) && cellNum >= filterNum1 && cellNum <= filterNum2;
            }
        } else if (filter.type === 'text' || filter.type === 'phone') {
            const lowerCell = strValue.toLowerCase();
            const lowerFilter = filter.value ? String(filter.value).toLowerCase() : '';

            if (filter.operator === 'contains') {
                return lowerCell.includes(lowerFilter);
            } else if (filter.operator === 'equals') {
                return lowerCell === lowerFilter;
            } else if (filter.operator === 'starts_with') {
                return lowerCell.startsWith(lowerFilter);
            } else if (filter.operator === 'ends_with') {
                return lowerCell.endsWith(lowerFilter);
            }
        }
        return true;
    }, []);

    const applyScroll = (element, amount, smooth = false) => {
        const behavior = smooth ? 'smooth' : 'auto';
        if (amount === 0) return 0;
        if (!element) {
            const maxScroll = document.documentElement.scrollWidth - document.documentElement.clientWidth;
            if (maxScroll <= 0) return amount;
            const currentScroll = window.scrollX || window.pageXOffset;
            let newScroll = currentScroll + amount;
            let remainder;
            if (newScroll > maxScroll) {
                remainder = newScroll - maxScroll;
                window.scrollTo({left: maxScroll, behavior});
            } else if (newScroll < 0) {
                remainder = newScroll;
                window.scrollTo({left: 0, behavior});
            } else {
                window.scrollTo({left: newScroll, behavior});
                remainder = 0;
            }
            return remainder;
        }

        const maxScroll = element.scrollWidth - element.clientWidth;
        if (maxScroll <= 0) return amount;

        const currentScroll = element.scrollLeft;
        let newScroll = currentScroll + amount;
        let remainder;

        if (newScroll > maxScroll) {
            remainder = newScroll - maxScroll;
            element.scrollTo({left: maxScroll, behavior});
        } else if (newScroll < 0) {
            remainder = newScroll;
            element.scrollTo({left: 0, behavior});
        } else {
            element.scrollTo({left: newScroll, behavior});
            remainder = 0;
        }
        return remainder;
    };

    const applyVerticalScroll = (element, amount, smooth = false) => {
        const behavior = smooth ? 'smooth' : 'auto';
        if (amount === 0) return 0;
        if (!element) {
            const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (maxScroll <= 0) return amount;
            const currentScroll = window.scrollY || window.pageYOffset;
            let newScroll = currentScroll + amount;
            let remainder;
            if (newScroll > maxScroll) {
                remainder = newScroll - maxScroll;
                window.scrollTo({top: maxScroll, behavior});
            } else if (newScroll < 0) {
                remainder = newScroll;
                window.scrollTo({top: 0, behavior});
            } else {
                window.scrollTo({top: newScroll, behavior});
                remainder = 0;
            }
            return remainder;
        }

        const maxScroll = element.scrollHeight - element.clientHeight;
        if (maxScroll <= 0) return amount;

        const currentScroll = element.scrollTop;
        let newScroll = currentScroll + amount;
        let remainder;

        if (newScroll > maxScroll) {
            remainder = newScroll - maxScroll;
            element.scrollTo({top: maxScroll, behavior});
        } else if (newScroll < 0) {
            remainder = newScroll;
            element.scrollTo({top: 0, behavior});
        } else {
            element.scrollTo({top: newScroll, behavior});
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

    const cascadeVerticalScroll = useCallback((amount, smooth = false) => {
        let rem = applyVerticalScroll(scrollContainerRef.current, amount, smooth);
        if (rem !== 0) {
            rem = applyVerticalScroll(tableModuleRef.current, rem, smooth);
            if (rem !== 0) {
                applyVerticalScroll(null, rem, smooth);
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

    const updateVerticalThumbPosition = useCallback(() => {
        if (isVerticalDragging) return;
        const container = scrollContainerRef.current;
        const trackHeight = verticalScrollbarTrackRef.current?.clientHeight || 0;
        if (!container || trackHeight === 0) return;

        const containerMax = Math.max(container.scrollHeight - container.clientHeight, 0);
        const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollHeight - tableModuleRef.current.clientHeight, 0) : 0;
        const windowMax = Math.max(document.documentElement.scrollHeight - document.documentElement.clientHeight, 0);
        const totalMax = containerMax + moduleMax + windowMax;

        if (totalMax <= 0) return;

        const currentModule = tableModuleRef.current ? tableModuleRef.current.scrollTop : 0;
        const currentWindow = window.scrollY || window.pageYOffset;
        const currentTotal = container.scrollTop + currentModule + currentWindow;

        const ratio = currentTotal / totalMax;
        const maxThumbTop = trackHeight - thumbHeight;
        setThumbTop(Math.max(0, Math.min(ratio * maxThumbTop, maxThumbTop)));
    }, [isVerticalDragging, thumbHeight]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setStartX(e.clientX);
        const container = scrollContainerRef.current;
        const moduleScroll = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
        const windowScroll = window.scrollX || window.pageXOffset;
        setScrollLeftStart(container ? container.scrollLeft + moduleScroll + windowScroll : 0);
    };

    const handleVerticalMouseDown = (e) => {
        e.preventDefault();
        setIsVerticalDragging(true);
        setStartY(e.clientY);
        const container = scrollContainerRef.current;
        const moduleScroll = tableModuleRef.current ? tableModuleRef.current.scrollTop : 0;
        const windowScroll = window.scrollY || window.pageYOffset;
        setScrollTopStart(container ? container.scrollTop + moduleScroll + windowScroll : 0);
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

    const handleVerticalMouseMove = useCallback((e) => {
        if (!isVerticalDragging) return;
        e.preventDefault();
        const dy = e.clientY - startY;
        const trackHeight = verticalScrollbarTrackRef.current?.clientHeight || 0;
        const container = scrollContainerRef.current;
        if (!container) return;

        const containerMax = Math.max(container.scrollHeight - container.clientHeight, 0);
        const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollHeight - tableModuleRef.current.clientHeight, 0) : 0;
        const windowMax = Math.max(document.documentElement.scrollHeight - document.documentElement.clientHeight, 0);
        const totalMax = containerMax + moduleMax + windowMax;
        const maxThumbTop = trackHeight - thumbHeight;

        if (maxThumbTop <= 0 || totalMax <= 0) return;

        const scrollRatio = dy / maxThumbTop;
        const targetTotalScroll = scrollTopStart + scrollRatio * totalMax;

        const currentModule = tableModuleRef.current ? tableModuleRef.current.scrollTop : 0;
        const currentWindow = window.scrollY || window.pageYOffset;
        const currentTotal = container.scrollTop + currentModule + currentWindow;

        const delta = targetTotalScroll - currentTotal;
        cascadeVerticalScroll(delta, false);

        setThumbTop(Math.max(0, Math.min((targetTotalScroll / totalMax) * maxThumbTop, maxThumbTop)));
    }, [isVerticalDragging, startY, scrollTopStart, thumbHeight, cascadeVerticalScroll]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    const handleVerticalMouseUp = useCallback(() => setIsVerticalDragging(false), []);

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
        const container = scrollContainerRef.current;
        const moduleScroll = tableModuleRef.current ? tableModuleRef.current.scrollLeft : 0;
        const windowScroll = window.scrollX || window.pageXOffset;
        setScrollLeftStart(container ? container.scrollLeft + moduleScroll + windowScroll : 0);
    };

    const handleVerticalTouchStart = (e) => {
        setIsVerticalDragging(true);
        setStartY(e.touches[0].clientY);
        const container = scrollContainerRef.current;
        const moduleScroll = tableModuleRef.current ? tableModuleRef.current.scrollTop : 0;
        const windowScroll = window.scrollY || window.pageYOffset;
        setScrollTopStart(container ? container.scrollTop + moduleScroll + windowScroll : 0);
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

    const handleVerticalTouchMove = useCallback((e) => {
        if (!isVerticalDragging) return;
        const dy = e.touches[0].clientY - startY;
        const trackHeight = verticalScrollbarTrackRef.current?.clientHeight || 0;
        const container = scrollContainerRef.current;
        if (!container) return;

        const containerMax = Math.max(container.scrollHeight - container.clientHeight, 0);
        const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollHeight - tableModuleRef.current.clientHeight, 0) : 0;
        const windowMax = Math.max(document.documentElement.scrollHeight - document.documentElement.clientHeight, 0);
        const totalMax = containerMax + moduleMax + windowMax;
        const maxThumbTop = trackHeight - thumbHeight;

        if (maxThumbTop <= 0 || totalMax <= 0) return;

        const scrollRatio = dy / maxThumbTop;
        const targetTotalScroll = scrollTopStart + scrollRatio * totalMax;
        const currentModule = tableModuleRef.current ? tableModuleRef.current.scrollTop : 0;
        const currentWindow = window.scrollY || window.pageYOffset;
        const currentTotal = container.scrollTop + currentModule + currentWindow;

        const delta = targetTotalScroll - currentTotal;
        cascadeVerticalScroll(delta, false);

        setThumbTop(Math.max(0, Math.min((targetTotalScroll / totalMax) * maxThumbTop, maxThumbTop)));
    }, [isVerticalDragging, startY, scrollTopStart, thumbHeight, cascadeVerticalScroll]);

    const handleTouchEnd = useCallback(() => setIsDragging(false), []);

    const handleVerticalTouchEnd = useCallback(() => setIsVerticalDragging(false), []);

    const scrollBy = useCallback((direction) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const cols = finalTableData && finalTableData[0] ? finalTableData[0].length : 1;
        const step = Math.max(container.clientWidth / Math.max(cols / 2, 1), container.clientWidth / 4);
        const amount = step * direction;
        cascadeScroll(amount, true);
    }, [finalTableData, cascadeScroll]);

    const scrollVerticalBy = useCallback((direction) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const rows = finalTableData ? finalTableData.length : 1;
        const step = Math.max(container.clientHeight / Math.max(rows / 2, 1), container.clientHeight / 2);
        const amount = step * direction;
        cascadeVerticalScroll(amount, true);
    }, [finalTableData, cascadeVerticalScroll]);

    const startScrolling = useCallback((direction) => {
        scrollBy(direction);
        scrollIntervalRef.current = setInterval(() => scrollBy(direction), 200);
    }, [scrollBy]);

    const startVerticalScrolling = useCallback((direction) => {
        scrollVerticalBy(direction);
        verticalScrollIntervalRef.current = setInterval(() => scrollVerticalBy(direction), 200);
    }, [scrollVerticalBy]);

    const stopScrolling = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    const stopVerticalScrolling = useCallback(() => {
        if (verticalScrollIntervalRef.current) {
            clearInterval(verticalScrollIntervalRef.current);
            verticalScrollIntervalRef.current = null;
        }
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

    const handleVerticalTrackClick = (e) => {
        if (e.target.closest('.custom-scrollbar-thumb-vertical')) return;
        const track = e.currentTarget;
        const container = scrollContainerRef.current;
        if (!track || !container) return;

        const rect = track.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const trackHeight = rect.height;

        const containerMax = Math.max(container.scrollHeight - container.clientHeight, 0);
        const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollHeight - tableModuleRef.current.clientHeight, 0) : 0;
        const windowMax = Math.max(document.documentElement.scrollHeight - document.documentElement.clientHeight, 0);
        const totalMax = containerMax + moduleMax + windowMax;
        const maxThumbTop = trackHeight - thumbHeight;

        const targetThumbTop = clickY - (thumbHeight / 2);
        const clampedThumbTop = Math.max(0, Math.min(targetThumbTop, maxThumbTop));
        const scrollRatio = maxThumbTop > 0 ? clampedThumbTop / maxThumbTop : 0;
        const targetTotalScroll = scrollRatio * totalMax;

        const currentModule = tableModuleRef.current ? tableModuleRef.current.scrollTop : 0;
        const currentWindow = window.scrollY || window.pageYOffset;
        const currentTotal = container.scrollTop + currentModule + currentWindow;

        const delta = targetTotalScroll - currentTotal;
        cascadeVerticalScroll(delta, true);
    };

    const sortedDataWithIndices = useMemo(() => {
        if (!tableData || tableData.length === 0) return [];
        const withIndices = tableData?.map((row, index) => ({row, originalIndex: index}));
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

    const requestSort = (columnIndex) => {
        let direction = 'ascending';
        if (sortConfig.column === columnIndex) {
            if (sortConfig.direction === 'ascending') direction = 'descending';
            else if (sortConfig.direction === 'descending') {
                direction = 'neutral';
                columnIndex = null;
            }
        }
        setSortConfig({column: columnIndex, direction});
    };

    const getSortIndicator = (columnIndex) => {
        if (sortConfig.column !== columnIndex) return ' ⇅';
        if (sortConfig.direction === 'ascending') return ' ⇧';
        if (sortConfig.direction === 'descending') return ' ⇩';
        return ' ⇅';
    };

    const applyLikelyUrlFunction = (columnName, cellValue) => {
        if (likelyUrlColumns && likelyUrlColumns[columnName]) {
            return <p className={"table-link"} lang={"en"}
                      onClick={() => likelyUrlColumns[columnName](cellValue)}>{cellValue}</p>;
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
                if (filterableColumns.includes(columnName) && columnFilters[columnName]) {
                    const filter = columnFilters[columnName];
                    const hasCondition = filter.value !== '';
                    const hasListFilter = filter.checkedValues !== null;

                    if (hasCondition || hasListFilter) {
                        filteredDataWithIndices = filteredDataWithIndices.filter((item, rowIndex) => {
                            if (rowIndex === 0 || (tableHeader && rowIndex === 1)) return true;
                            const cellValue = item.row[i];

                            if (hasCondition) {
                                if (!applyFilter(cellValue, filter)) return false;
                            }
                            if (hasListFilter) {
                                if (cellValue === undefined || cellValue === null || cellValue === '') return false;
                                if (!filter.checkedValues.has(String(cellValue).trim())) return false;
                            }
                            return true;
                        });
                    }
                }
            }
        }

        const newRowMapping = filteredDataWithIndices?.map(item => item.originalIndex);
        setRowMapping(newRowMapping);
        const filteredData = filteredDataWithIndices?.map(item =>
            item.row.filter((cell, colIndex) => !hiddenColumns.has(sortedData[0][colIndex]))
        );
        setFinalTableData(filteredData);
    }, [tableData, sortedDataWithIndices, filterableColumns, columnFilters, tableHeader, applyFilter, hiddenColumns, sortedData]);

    const smartFilterData = useMemo(() => {
        if (!isFilterPopupOpen || !columnToFilterBasedOn || !tableData || tableData.length === 0) {
            return {uniqueValues: [], min: null, max: null};
        }

        const columnName = columnToFilterBasedOn;
        const colIndex = tableData[0].indexOf(columnName);
        if (colIndex === -1) return {uniqueValues: [], min: null, max: null};

        let filteredDataWithIndices = [...sortedDataWithIndices];
        let baseFilteredDataWithIndices = [...sortedDataWithIndices];

        if (filterableColumns && filterableColumns.length > 0) {
            for (let i = 0; i < tableData[0].length; i++) {
                const colName = tableData[0][i];
                if (filterableColumns.includes(colName) && columnFilters[colName]) {
                    const filter = columnFilters[colName];
                    const hasCondition = filter.value !== '';
                    const isCurrentColumn = colName === columnName;

                    const hasListFilter = !isCurrentColumn && filter.checkedValues !== null;

                    if (hasCondition || hasListFilter) {
                        filteredDataWithIndices = filteredDataWithIndices.filter((item, idx) => {
                            if (idx === 0 || (tableHeader && idx === 1)) return true;
                            const cellValue = item.row[i];

                            if (hasCondition) {
                                if (!applyFilter(cellValue, filter)) return false;
                            }
                            if (hasListFilter) {
                                if (cellValue === undefined || cellValue === null || cellValue === '') return false;
                                if (!filter.checkedValues.has(String(cellValue).trim())) return false;
                            }
                            return true;
                        });
                    }

                    if (!isCurrentColumn && (hasCondition || hasListFilter)) {
                        baseFilteredDataWithIndices = baseFilteredDataWithIndices.filter((item, idx) => {
                            if (idx === 0 || (tableHeader && idx === 1)) return true;
                            const cellValue = item.row[i];

                            if (hasCondition) {
                                if (!applyFilter(cellValue, filter)) return false;
                            }
                            if (hasListFilter) {
                                if (cellValue === undefined || cellValue === null || cellValue === '') return false;
                                if (!filter.checkedValues.has(String(cellValue).trim())) return false;
                            }
                            return true;
                        });
                    }
                }
            }
        }

        const uniqueSet = new Set();
        const baseUniqueSet = new Set();
        let minVal = null;
        let maxVal = null;
        const type = getColumnType(columnName, dataTypes);

        filteredDataWithIndices.forEach((item, idx) => {
            if (idx === 0 || (tableHeader && idx === 1)) return;
            const val = item.row[colIndex];
            if (val !== undefined && val !== null && val !== '') {
                uniqueSet.add(String(val));

                if (type === 'number' || type === 'currency') {
                    const num = parseNumberValue(val);
                    if (!isNaN(num)) {
                        if (minVal === null || num < minVal) minVal = num;
                        if (maxVal === null || num > maxVal) maxVal = num;
                    }
                } else if (type === 'date') {
                    const d = parseDate(val);
                    if (d) {
                        const time = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                        if (minVal === null || time < minVal) minVal = time;
                        if (maxVal === null || time > maxVal) maxVal = time;
                    }
                }
            }
        });

        let globalMinVal = null;
        let globalMaxVal = null;

        sortedDataWithIndices.forEach((item, idx) => {
            if (idx === 0 || (tableHeader && idx === 1)) return;
            const val = item.row[colIndex];
            if (val !== undefined && val !== null && val !== '') {
                if (type === 'number' || type === 'currency') {
                    const num = parseNumberValue(val);
                    if (!isNaN(num)) {
                        if (globalMinVal === null || num < globalMinVal) globalMinVal = num;
                        if (globalMaxVal === null || num > globalMaxVal) globalMaxVal = num;
                    }
                } else if (type === 'date') {
                    const d = parseDate(val);
                    if (d) {
                        const time = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                        if (globalMinVal === null || time < globalMinVal) globalMinVal = time;
                        if (globalMaxVal === null || time > globalMaxVal) globalMaxVal = time;
                    }
                }
            }
        });

        baseFilteredDataWithIndices.forEach((item, idx) => {
            if (idx === 0 || (tableHeader && idx === 1)) return;
            const val = item.row[colIndex];
            if (val !== undefined && val !== null && val !== '') {
                baseUniqueSet.add(String(val));
            }
        });

        let uniqueValues = Array.from(uniqueSet);
        let baseUniqueValues = Array.from(baseUniqueSet);

        if (type === 'number' || type === 'currency') {
            uniqueValues.sort((a, b) => parseNumberValue(a) - parseNumberValue(b));
            baseUniqueValues.sort((a, b) => parseNumberValue(a) - parseNumberValue(b));
        } else if (type === 'date') {
            uniqueValues.sort((a, b) => {
                const da = parseDate(a);
                const db = parseDate(b);
                const tA = da ? new Date(da.getFullYear(), da.getMonth(), da.getDate()).getTime() : 0;
                const tB = db ? new Date(db.getFullYear(), db.getMonth(), db.getDate()).getTime() : 0;
                return tA - tB;
            });
            baseUniqueValues.sort((a, b) => {
                const da = parseDate(a);
                const db = parseDate(b);
                const tA = da ? new Date(da.getFullYear(), da.getMonth(), da.getDate()).getTime() : 0;
                const tB = db ? new Date(db.getFullYear(), db.getMonth(), db.getDate()).getTime() : 0;
                return tA - tB;
            });
        } else {
            uniqueValues.sort();
            baseUniqueValues.sort();
        }

        let displayMin = globalMinVal;
        let displayMax = globalMaxVal;
        if (type === 'date' && globalMinVal !== null) {
            const formatGlobalDate = (timestamp) => {
                const d = new Date(timestamp);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            displayMin = formatGlobalDate(globalMinVal);
            displayMax = formatGlobalDate(globalMaxVal);
        }

        return {uniqueValues, baseUniqueValues, min: displayMin, max: displayMax};
    }, [isFilterPopupOpen, columnToFilterBasedOn, tableData, sortedDataWithIndices, filterableColumns, dataTypes, columnFilters, tableHeader, applyFilter]);

    const hasActiveFilters = useCallback(() => {
        return Object.keys(columnFilters).some(key => {
            const f = columnFilters[key];
            return (f && f.value !== '') || (f && f.checkedValues !== null);
        });
    }, [columnFilters]);

    const resetAllFilters = useCallback(() => {
        setColumnFilters({});
    }, []);

    const openFilterPopup = (columnName) => {
        setIsFilterPopupOpen(true);
        setColumnToFilterBasedOn(columnName);
        setUniqueValueSearch('');
        const type = getColumnType(columnName, dataTypes);
        if (!columnFilters[columnName]) {
            let defaultOperator = 'contains';
            if (type === 'date') defaultOperator = 'equals';
            if (type === 'number' || type === 'currency') defaultOperator = 'equals';

            setColumnFilters(prev => ({
                ...prev,
                [columnName]: {type, operator: defaultOperator, value: '', value2: '', checkedValues: null}
            }));
        } else {
            setColumnFilters(prev => ({
                ...prev,
                [columnName]: {...prev[columnName], type}
            }));
        }
    };

    const renderCustomScrollbar = (isTop) => {
        if (!scrollable || (isMobile && !showHorizontalScrollBarInMobile) || hideHorizontalScrollBar) return null;
        return (
            <div
                className={`custom-scrollbar-container ${!isTop ? 'footer' : ''} ${isScrollbarVisible ? 'visible' : ''} ${isDragging ? 'is-dragging' : ''}`}>
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
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                              strokeLinejoin="round"/>
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
                        style={{width: `${thumbWidth}px`, transform: `translateX(${thumbLeft}px)`}}
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
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        );
    };

    const renderVerticalCustomScrollbar = (left) => {
        if (!scrollable || (isMobile && !showVerticalScrollBarInMobile) || hideVerticalScrollBar) return null;
        return (
            <div
                className={`custom-scrollbar-container-vertical ${!left ? 'right' : ''} ${isVerticalScrollbarVisible ? 'visible' : ''} ${isVerticalDragging ? 'is-dragging' : ''}`}>
                <button
                    className="custom-scrollbar-arrow-vertical"
                    onMouseDown={() => startVerticalScrolling(-1)}
                    onMouseUp={stopVerticalScrolling}
                    onMouseLeave={stopVerticalScrolling}
                    onTouchStart={() => startVerticalScrolling(-1)}
                    onTouchEnd={stopVerticalScrolling}
                    aria-label="Scroll Up"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>
                <div
                    className="custom-scrollbar-track-vertical"
                    ref={verticalScrollbarTrackRef}
                    onClick={handleVerticalTrackClick}
                >
                    <div
                        className={`custom-scrollbar-thumb-vertical ${isVerticalDragging ? 'dragging' : ''}`}
                        ref={verticalScrollbarThumbRef}
                        style={{height: `${thumbHeight}px`, transform: `translateY(${thumbTop}px)`}}
                        onMouseDown={handleVerticalMouseDown}
                        onTouchStart={handleVerticalTouchStart}
                    >
                        <div className="thumb-grip-vertical">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
                <button
                    className="custom-scrollbar-arrow-vertical"
                    onMouseDown={() => startVerticalScrolling(1)}
                    onMouseUp={stopVerticalScrolling}
                    onMouseLeave={stopVerticalScrolling}
                    onTouchStart={() => startVerticalScrolling(1)}
                    onTouchEnd={stopVerticalScrolling}
                    aria-label="Scroll Down"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        );
    };

    const renderPagination = () => {
        if (!isPaginated || totalPages <= 1) return null;

        const handlePageChange = (page) => {
            if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
            }
        };

        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="table-pagination-controls">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                        className="pagination-btn">
                    Previous
                </button>

                {startPage > 1 && (
                    <>
                        <button onClick={() => handlePageChange(1)}
                                className={`pagination-btn ${1 === currentPage ? 'active' : ''}`}>1
                        </button>
                        {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}

                {pageNumbers.map(page => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                        <button onClick={() => handlePageChange(totalPages)}
                                className={`pagination-btn ${totalPages === currentPage ? 'active' : ''}`}>{totalPages}</button>
                    </>
                )}

                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                        className="pagination-btn">
                    Next
                </button>
            </div>
        );
    };

    useEffect(() => {
        return () => {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (verticalScrollIntervalRef.current) clearInterval(verticalScrollIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (event) => {
            setIsDarkMode(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setPageSize(mobilePageSize)
        } else {
            setPageSize(desktopPageSize)
        }
    }, [isMobile]);

    useEffect(() => {
        if (!isMobile) return;

        const prevent = (e) => e.preventDefault();

        const thumbs = [
            verticalScrollbarThumbRef.current,
            scrollbarThumbRef.current,
        ];

        const tracks = [
            verticalScrollbarTrackRef.current,
            scrollbarTrackRef.current,
        ];

        thumbs.forEach((el) => {
            if (!el) return;
            el.addEventListener("touchstart", prevent, {passive: false});
            el.addEventListener("touchmove", prevent, {passive: false});
        });

        tracks.forEach((el) => {
            if (!el) return;
            el.addEventListener("touchmove", prevent, {passive: false});
        });

        return () => {
            thumbs.forEach((el) => {
                if (!el) return;
                el.removeEventListener("touchstart", prevent);
                el.removeEventListener("touchmove", prevent);
            });
            tracks.forEach((el) => {
                if (!el) return;
                el.removeEventListener("touchmove", prevent);
            });
        };
    }, [isMobile]);

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
        const handleExternalScroll = () => updateThumbPosition();
        window.addEventListener('scroll', handleExternalScroll);
        const moduleEl = tableModuleRef.current;
        if (moduleEl) moduleEl.addEventListener('scroll', handleExternalScroll);
        return () => {
            window.removeEventListener('scroll', handleExternalScroll);
            if (moduleEl) moduleEl.removeEventListener('scroll', handleExternalScroll);
        };
    }, [updateThumbPosition]);

    useEffect(() => {
        const handleExternalVerticalScroll = () => updateVerticalThumbPosition();
        window.addEventListener('scroll', handleExternalVerticalScroll);
        const moduleEl = tableModuleRef.current;
        if (moduleEl) moduleEl.addEventListener('scroll', handleExternalVerticalScroll);
        return () => {
            window.removeEventListener('scroll', handleExternalVerticalScroll);
            if (moduleEl) moduleEl.removeEventListener('scroll', handleExternalVerticalScroll);
        };
    }, [updateVerticalThumbPosition]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    useEffect(() => {
        if ((dataRows && dataRows.length > maxItemsBeforePagination) || isMobile) {
            setIsPaginated(true);
        } else {
            setIsPaginated(false);
        }
    }, [tableData, isMobile, dataRows])

    useEffect(() => {
        setTotalPage(Math.ceil(dataRows.length / pageSize));
    }, [dataRows.length, pageSize])

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('touchmove', handleTouchMove, {passive: false});
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

    useEffect(() => {
        if (isVerticalDragging) {
            window.addEventListener('mousemove', handleVerticalMouseMove);
            window.addEventListener('mouseup', handleVerticalMouseUp);
        } else {
            window.removeEventListener('mousemove', handleVerticalMouseMove);
            window.removeEventListener('mouseup', handleVerticalMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleVerticalMouseMove);
            window.removeEventListener('mouseup', handleVerticalMouseUp);
        };
    }, [isVerticalDragging, handleVerticalMouseMove, handleVerticalMouseUp]);

    useEffect(() => {
        if (isVerticalDragging) {
            window.addEventListener('touchmove', handleVerticalTouchMove, {passive: false});
            window.addEventListener('touchend', handleVerticalTouchEnd);
        } else {
            window.removeEventListener('touchmove', handleVerticalTouchMove);
            window.removeEventListener('touchend', handleVerticalTouchEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleVerticalTouchMove);
            window.removeEventListener('touchend', handleVerticalTouchEnd);
        };
    }, [isVerticalDragging, handleVerticalTouchMove, handleVerticalTouchEnd]);

    useEffect(() => {
        updateFinalTableData();
    }, [hiddenColumns, sortedDataWithIndices, columnFilters, updateFinalTableData, sortConfig]);

    useEffect(() => {
        if (!scrollable || (isMobile && !showHorizontalScrollBarInMobile) || hideHorizontalScrollBar) {
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
                    const minWidth = isMobile ? 80 : 10;
                    const maxWidth = isMobile ? (trackWidth * 0.6) : (trackWidth * 0.1);
                    let newThumbWidth = ratio * trackWidth;
                    newThumbWidth = Math.max(minWidth, Math.min(newThumbWidth, maxWidth));
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
    }, [finalTableData, hiddenColumns, isAccordionOpen, isFilterPopupOpen, compact, scrollable, tableData, isMobile, showHorizontalScrollBarInMobile, hideHorizontalScrollBar]);

    useEffect(() => {
        if (!scrollable || (isMobile && !showVerticalScrollBarInMobile) || hideVerticalScrollBar) {
            setIsVerticalScrollbarVisible(false);
            return;
        }
        const container = scrollContainerRef.current;
        if (!container) return;

        const checkVerticalOverflow = () => {
            const containerMax = Math.max(container.scrollHeight - container.clientHeight, 0);
            if (containerMax > 0) {
                setIsVerticalScrollbarVisible(true);
                const trackHeight = verticalScrollbarTrackRef.current?.clientHeight || 0;
                if (trackHeight > 0) {
                    const moduleMax = tableModuleRef.current ? Math.max(tableModuleRef.current.scrollHeight - tableModuleRef.current.clientHeight, 0) : 0;
                    const windowMax = Math.max(document.documentElement.scrollHeight - document.documentElement.clientHeight, 0);
                    const totalMax = containerMax + moduleMax + windowMax;

                    const ratio = container.clientHeight / (container.clientHeight + totalMax);
                    const minHeight = isMobile ? 100 : 100;
                    const maxHeight = isMobile ? (trackHeight * 1) : (trackHeight * 0.5);
                    let newThumbHeight = ratio * trackHeight;
                    newThumbHeight = Math.max(minHeight, Math.min(newThumbHeight, maxHeight));
                    setThumbHeight(newThumbHeight);

                    const moduleScroll = tableModuleRef.current ? tableModuleRef.current.scrollTop : 0;
                    const windowScroll = window.scrollY || window.pageYOffset;
                    const currentTotal = container.scrollTop + moduleScroll + windowScroll;

                    const scrollRatio = totalMax > 0 ? currentTotal / totalMax : 0;
                    const maxThumbTop = trackHeight - newThumbHeight;
                    setThumbTop(scrollRatio * maxThumbTop);
                }
            } else {
                setIsVerticalScrollbarVisible(false);
            }
        };

        const timeoutId = setTimeout(checkVerticalOverflow, 50);
        const resizeObserver = new ResizeObserver(checkVerticalOverflow);
        resizeObserver.observe(container);
        const table = container.querySelector('table');
        if (table) resizeObserver.observe(table);
        window.addEventListener('resize', checkVerticalOverflow);

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkVerticalOverflow);
        };
    }, [finalTableData, hiddenColumns, isAccordionOpen, isFilterPopupOpen, compact, scrollable, tableData, isMobile, showVerticalScrollBarInMobile, hideVerticalScrollBar]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const module    = tableModuleRef.current;
        if (!container) return;

        const absorb = (el, prop, sizeKey, clientKey, delta) => {
            const max = el[sizeKey] - el[clientKey];
            if (max <= 0) return delta;
            const prev = el[prop];
            el[prop] = Math.max(0, Math.min(prev + delta, max));
            return delta - (el[prop] - prev);
        };

        const handleWheel = (e) => {
            if (e.ctrlKey) return;
            e.preventDefault();

            let remX = absorb(container, 'scrollLeft', 'scrollWidth', 'clientWidth',  e.deltaX);
            let remY = absorb(container, 'scrollTop',  'scrollHeight', 'clientHeight', e.deltaY);

            if (module) {
                remX = absorb(module, 'scrollLeft', 'scrollWidth',  'clientWidth',  remX);
                remY = absorb(module, 'scrollTop',  'scrollHeight', 'clientHeight', remY);
            }

            if (remX !== 0 || remY !== 0) window.scrollBy(remX, remY);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const module    = tableModuleRef.current;
        if (!container) return;

        const absorb = (el, prop, sizeKey, clientKey, delta) => {
            const max = el[sizeKey] - el[clientKey];
            if (max <= 0) return delta;
            const prev = el[prop];
            el[prop] = Math.max(0, Math.min(prev + delta, max));
            return delta - (el[prop] - prev);
        };

        const cascade = (dx, dy) => {
            let remX = absorb(container, 'scrollLeft', 'scrollWidth',  'clientWidth',  dx);
            let remY = absorb(container, 'scrollTop',  'scrollHeight', 'clientHeight', dy);
            if (module) {
                remX = absorb(module, 'scrollLeft', 'scrollWidth',  'clientWidth',  remX);
                remY = absorb(module, 'scrollTop',  'scrollHeight', 'clientHeight', remY);
            }
            if (remX !== 0 || remY !== 0) window.scrollBy(remX, remY);
        };

        const FRICTION            = 0.95;
        const MIN_VELOCITY        = 0.3;
        const MAX_VELOCITY        = 30;
        const VELOCITY_SCALE      = 16;
        const SAMPLE_WINDOW       = 80;
        const AXIS_LOCK_THRESHOLD = 5; // px of movement before committing to one axis

        let samples     = [];
        let velocityX   = 0;
        let velocityY   = 0;
        let rafId       = null;
        let lockedAxis  = null; // 'x' | 'y' | null

        const cancelMomentum = () => {
            if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        };

        const runMomentum = () => {
            velocityX *= FRICTION;
            velocityY *= FRICTION;
            if (Math.abs(velocityX) < MIN_VELOCITY && Math.abs(velocityY) < MIN_VELOCITY) {
                rafId = null;
                return;
            }
            cascade(
                lockedAxis === 'y' ? 0 : velocityX,
                lockedAxis === 'x' ? 0 : velocityY
            );
            rafId = requestAnimationFrame(runMomentum);
        };

        const onTouchStart = (e) => {
            cancelMomentum();
            lockedAxis = null;
            if (e.touches.length > 1) { samples = []; return; }
            velocityX = 0;
            velocityY = 0;
            samples = [{ x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() }];
        };

        const onTouchMove = (e) => {
            // two fingers: browser handles pinch-zoom natively, don't interfere
            if (e.touches.length > 1) return;

            // FIX 1: preventDefault BEFORE any early return — if this line is ever
            // skipped, the browser gets the event and scrolls the page natively
            e.preventDefault();

            if (!samples.length) return;

            const touch    = e.touches[0];
            const now      = performance.now();
            const last     = samples[samples.length - 1];
            const rawDeltaX = last.x - touch.clientX;
            const rawDeltaY = last.y - touch.clientY;

            // FIX 2: lock to primary axis once the user has moved enough to reveal intent.
            // Without this, a near-vertical swipe always has a small rawDeltaX which
            // absorb() passes straight through to window.scrollBy(), scrolling the page
            // horizontally even though the user was scrolling vertically.
            if (!lockedAxis) {
                const totalMoved = Math.abs(rawDeltaX) + Math.abs(rawDeltaY);
                if (totalMoved >= AXIS_LOCK_THRESHOLD) {
                    lockedAxis = Math.abs(rawDeltaX) > Math.abs(rawDeltaY) ? 'x' : 'y';
                }
            }

            samples.push({ x: touch.clientX, y: touch.clientY, t: now });
            while (samples.length > 2 && samples[0].t < now - SAMPLE_WINDOW * 2) samples.shift();

            cascade(
                lockedAxis === 'y' ? 0 : rawDeltaX,
                lockedAxis === 'x' ? 0 : rawDeltaY
            );
        };

        const onTouchEnd = (e) => {
            if (e.touches.length > 0) return;
            if (!samples.length) return;

            const now    = performance.now();
            const recent = samples.filter(s => s.t >= now - SAMPLE_WINDOW);

            if (recent.length >= 2) {
                const first = recent[0];
                const last  = recent[recent.length - 1];
                const dt    = last.t - first.t;
                if (dt > 0) {
                    velocityX = lockedAxis === 'y' ? 0 : Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, ((first.x - last.x) / dt) * VELOCITY_SCALE));
                    velocityY = lockedAxis === 'x' ? 0 : Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, ((first.y - last.y) / dt) * VELOCITY_SCALE));
                }
            }

            samples = [];
            if (Math.abs(velocityX) > MIN_VELOCITY || Math.abs(velocityY) > MIN_VELOCITY) {
                rafId = requestAnimationFrame(runMomentum);
            }
        };

        const onWindowTouchStart = (e) => {
            if (!container.contains(e.target)) cancelMomentum();
        };

        const prevTouchAction = container.style.touchAction;
        container.style.touchAction = 'pinch-zoom';

        container.addEventListener('touchstart', onTouchStart,       { passive: false });
        container.addEventListener('touchmove',  onTouchMove,        { passive: false });
        container.addEventListener('touchend',   onTouchEnd,         { passive: true  });
        window.addEventListener   ('touchstart', onWindowTouchStart, { passive: true  });

        return () => {
            cancelMomentum();
            container.style.touchAction = prevTouchAction;
            container.removeEventListener('touchstart', onTouchStart);
            container.removeEventListener('touchmove',  onTouchMove);
            container.removeEventListener('touchend',   onTouchEnd);
            window.removeEventListener   ('touchstart', onWindowTouchStart);
        };
    }, []);

    return (
        <div className="table-module" ref={tableModuleRef} >


            { (headerModuleElements || allowHideColumns || allowExport || hasActiveFilters() || isScrollbarVisible) && (

                    <div className={"table-module-header"}>
                    <div className={"table-module-header-buttons-wrapper"}>
                        {headerModuleElements && headerModuleElements.map((element, index) => (
                            <Fragment key={index}>{element}</Fragment>
                        ))}
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
                                const blob = new Blob([csv], {type: 'text/csv'});
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
                    </div>

                    {renderCustomScrollbar(true)}
                </div>
            )}

            <div className={`table-with-vertical-scrollbar-wrapper ${!isVerticalScrollbarVisible ? 'fixed' : ''}`}>
                {renderVerticalCustomScrollbar(true)}
                <div
                    className={`table-scroll-container ${scrollable ? 'table-module-table-scrollable scrollable' : ''}`}
                    ref={scrollContainerRef}
                    onScroll={() => {
                        updateThumbPosition();
                        updateVerticalThumbPosition();
                    }}
                >
                    { (!finalTableData || finalTableData.length === 0) ? (
                        <div className={"table-module-header-empty-state"}>
                            <h3>{t("common.no-table-enteries-found", {ns: 'common'})}</h3>
                        </div>
                    ) : (
                        <table className="table-module-table" ref={tableRef}>
                        <tbody>
                        {tableHeader &&
                            <tr>
                                <th colSpan={numCols} style={{
                                    position: stickyRows > 0 ? 'sticky' : 'relative',
                                    top: 0,
                                    zIndex: stickyRows > 0 ? 4 : undefined,
                                }}>
                                    <h1>{tableHeader}</h1>
                                </th>
                            </tr>
                        }
                        {displayedTableData && displayedTableData.map((row, rowIndex) => {
                            const actualRowIndex = tableHeader ? rowIndex + 1 : rowIndex;
                            const finalTableIndex = isPaginated && rowIndex >= headerRowCount
                                ? headerRowCount + (currentPage - 1) * pageSize + (rowIndex - headerRowCount)
                                : rowIndex;
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
                                                onMouseEnter={() => setHoveredCell({r: actualRowIndex, c: cellIndex})}
                                                onMouseLeave={() => setHoveredCell({r: null, c: null})}
                                            >
                                                {allowSticky && (showColControl || showRowControl) && (
                                                    <div className="sticky-control-widget">
                                                        {showColControl && (
                                                            <label className="sticky-control-checkbox"
                                                                   title="Fix all columns up to this one">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={stickyCols > cellIndex}
                                                                    onChange={(e) => setStickyCols(e.target.checked ? cellIndex + 1 : cellIndex)}
                                                                /> Fix Col
                                                            </label>
                                                        )}
                                                        {showRowControl && (
                                                            <label className="sticky-control-checkbox"
                                                                   title="Fix all rows up to this one">
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
                                                                wordWrap: columnsToWrap && columnsToWrap.includes(displayedTableData[0][cellIndex]) ? 'break-word' : 'normal',
                                                                textWrap: columnsToWrap && columnsToWrap.includes(displayedTableData[0][cellIndex]) ? 'wrap' : 'nowrap',
                                                            }}
                                                                 className={"compact-table-header-row"}
                                                            >
                                                                <h3 className={"compact-table-header-text"}
                                                                    lang={detectLang(cell)}
                                                                    onClick={() => requestSort(cellIndex)}>
                                                                    {cell}{getSortIndicator(cellIndex)}
                                                                </h3>
                                                                {(filterableColumns && displayedTableData[0] && filterableColumns.includes(displayedTableData[0][cellIndex])) &&
                                                                    <FilterAltIcon
                                                                        onClick={() => openFilterPopup(displayedTableData[0][cellIndex])}/>
                                                                }
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={"compact-table-header-row"}
                                                            >
                                                                <h2 lang={detectLang(cell)}
                                                                    onClick={() => requestSort(cellIndex)}>
                                                                    {cell}{getSortIndicator(cellIndex)}
                                                                </h2>
                                                                {(filterableColumns && displayedTableData[0] && filterableColumns.includes(displayedTableData[0][cellIndex])) &&
                                                                    <FilterAltIcon
                                                                        onClick={() => openFilterPopup(displayedTableData[0][cellIndex])}/>
                                                                }
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {compact ? (
                                                            <p className={"compact-table-cell-text"}
                                                               lang={detectLang(cell)}>
                                                                {applyLikelyUrlFunction(displayedTableData[0][cellIndex], cell)}
                                                            </p>
                                                        ) : (
                                                            <p lang={detectLang(cell)}>
                                                                {applyLikelyUrlFunction(displayedTableData[0][cellIndex], cell)}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        );
                                    })}
                                    {allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") && (
                                        <td
                                            onMouseEnter={() => setHoveredCell({r: actualRowIndex, c: row.length})}
                                            onMouseLeave={() => setHoveredCell({r: null, c: null})}
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
                                                            <label className="sticky-control-checkbox"
                                                                   title="Fix all columns up to this one">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={stickyCols > editCellIndex}
                                                                    onChange={(e) => setStickyCols(e.target.checked ? editCellIndex + 1 : editCellIndex)}
                                                                /> Fix Col
                                                            </label>
                                                        )}
                                                        {showRowControlEdit && (
                                                            <label className="sticky-control-checkbox"
                                                                   title="Fix all rows up to this one">
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
                                                <button onClick={() => onEditEntryOption(rowMapping[finalTableIndex])}
                                                        aria-label="Edit row">Edit</button>
                                            )}
                                        </td>
                                    )}
                                    {allowDeleteEntryOption && onDeleteEntry && !hiddenColumns.has("Delete") && (
                                        <td
                                            onMouseEnter={() => setHoveredCell({
                                                r: actualRowIndex,
                                                c: row.length + (allowEditEntryOption && onEditEntryOption && !hiddenColumns.has("Edit") ? 1 : 0)
                                            })}
                                            onMouseLeave={() => setHoveredCell({r: null, c: null})}
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
                                                            <label className="sticky-control-checkbox"
                                                                   title="Fix all columns up to this one">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={stickyCols > deleteCellIndex}
                                                                    onChange={(e) => setStickyCols(e.target.checked ? deleteCellIndex + 1 : deleteCellIndex)}
                                                                /> Fix Col
                                                            </label>
                                                        )}
                                                        {showRowControlDelete && (
                                                            <label className="sticky-control-checkbox"
                                                                   title="Fix all rows up to this one">
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
                                                <button onClick={() => onDeleteEntry(rowMapping[finalTableIndex])}
                                                        aria-label="Delete row">Delete</button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            { (isScrollbarVisible || isPaginated || footerModuleElements) && (
                    <div className={"table-module-footer"}>
                        {renderPagination()}
                        {footerModuleElements && footerModuleElements.map((element, index) => (
                            <Fragment key={index}>{element}</Fragment>
                        ))}
                    </div>
            )}

            <animated.div className="table-module-accordion" style={contentAnimation}>
                <div className="table-module-accordion-overlay" onClick={() => setIsAccordionOpen(false)}/>
                <div className="table-module-accordion-content">
                    <div className="table-module-accordion-buttons">
                        <button
                            onClick={() => setHiddenColumns(new Set(tableData && tableData[0] ? tableData[0].filter((header) => defaultHiddenColumns && defaultHiddenColumns.includes(header)) : []))}>Default
                        </button>
                        <button onClick={() => setHiddenColumns(new Set())}>Show All</button>
                        <button onClick={() => {
                            const allHeaders = tableData && tableData[0] ? [...tableData[0]] : [];
                            setHiddenColumns(new Set([...allHeaders, "Edit", "Delete"]));
                        }}>Hide All
                        </button>
                        <button onClick={() => setIsAccordionOpen(false)}>Close</button>
                    </div>
                    {tableData && tableData[0] && tableData[0].map((header, index) => (
                        <div key={index}>
                            <label><input type="checkbox" checked={!hiddenColumns.has(header)}
                                          onChange={() => toggleColumnVisibility(header)}/>{'\t' + header}</label>
                        </div>
                    ))}
                    {allowEditEntryOption && onEditEntryOption && (
                        <div>
                            <label><input type="checkbox" checked={!hiddenColumns.has("Edit")}
                                          onChange={() => toggleColumnVisibility("Edit")}/>{'\tEdit Column'}</label>
                        </div>
                    )}
                    {allowDeleteEntryOption && onDeleteEntry && (
                        <div>
                            <label><input type="checkbox" checked={!hiddenColumns.has("Delete")}
                                          onChange={() => toggleColumnVisibility("Delete")}/>{'\tDelete Column'}</label>
                        </div>
                    )}
                </div>
            </animated.div>

            <animated.div className={"table-module-filter-popup-container"} style={popupAnimation}>
                <div className={"table-module-filter-popup-background"} onClick={() => {
                    setIsFilterPopupOpen(false);
                }}/>
                <div className={"table-module-filter-popup"}>
                    <div className={"table-module-filter-popup-content"}>
                        {columnToFilterBasedOn && columnFilters[columnToFilterBasedOn] && (
                            <div>
                                <h3>Filter for {columnToFilterBasedOn}</h3>

                                {smartFilterData.min !== null && smartFilterData.max !== null && (
                                    <div className={"min-max-banner-in-filter-popup"}>
                                        <strong>Min:</strong> {smartFilterData.min} &nbsp;|&nbsp;
                                        <strong>Max:</strong> {smartFilterData.max}
                                    </div>
                                )}

                                <div className={"advanced-filter-search-container-in-filter-popup"}>
                                    <label>Condition: </label>
                                    <select
                                        className={"table-module-filter-search-input-field"}
                                        value={columnFilters[columnToFilterBasedOn].operator}
                                        onChange={(e) => setColumnFilters(prev => ({
                                            ...prev,
                                            [columnToFilterBasedOn]: {
                                                ...prev[columnToFilterBasedOn],
                                                operator: e.target.value
                                            }
                                        }))}
                                    >
                                        {columnFilters[columnToFilterBasedOn].type === 'text' || columnFilters[columnToFilterBasedOn].type === 'phone' ? (
                                            <>
                                                <option value="contains">Contains</option>
                                                <option value="equals">Equals</option>
                                                <option value="starts_with">Starts With</option>
                                                <option value="ends_with">Ends With</option>
                                            </>
                                        ) : columnFilters[columnToFilterBasedOn].type === 'number' || columnFilters[columnToFilterBasedOn].type === 'currency' ? (
                                            <>
                                                <option value="equals">Equals</option>
                                                <option value="greater_than">Greater Than</option>
                                                <option value="less_than">Less Than</option>
                                                <option value="between">Between</option>
                                            </>
                                        ) : columnFilters[columnToFilterBasedOn].type === 'date' ? (
                                            <>
                                                <option value="equals">Is Exactly</option>
                                                <option value="before">Before</option>
                                                <option value="after">After</option>
                                                <option value="between">Between</option>
                                            </>
                                        ) : null}
                                    </select>
                                </div>

                                <div className={"advanced-filter-search-container-in-filter-popup"}>
                                    <label>Value: </label>
                                    <input
                                        className={"table-module-filter-search-input-field"}
                                        type={columnFilters[columnToFilterBasedOn].type === 'date' ? 'date' : (columnFilters[columnToFilterBasedOn].type === 'number' || columnFilters[columnToFilterBasedOn].type === 'currency' ? 'number' : 'text')}
                                        value={columnFilters[columnToFilterBasedOn].value}
                                        onChange={(e) => setColumnFilters(prev => ({
                                            ...prev,
                                            [columnToFilterBasedOn]: {
                                                ...prev[columnToFilterBasedOn],
                                                value: e.target.value
                                            }
                                        }))}
                                    />
                                </div>

                                {columnFilters[columnToFilterBasedOn].operator === 'between' && (
                                    <div className={"advanced-filter-search-container-in-filter-popup"}>
                                        <label>And: </label>
                                        <input
                                            className={"table-module-filter-search-input-field"}
                                            type={columnFilters[columnToFilterBasedOn].type === 'date' ? 'date' : (columnFilters[columnToFilterBasedOn].type === 'number' || columnFilters[columnToFilterBasedOn].type === 'currency' ? 'number' : 'text')}
                                            value={columnFilters[columnToFilterBasedOn].value2 || ''}
                                            onChange={(e) => setColumnFilters(prev => ({
                                                ...prev,
                                                [columnToFilterBasedOn]: {
                                                    ...prev[columnToFilterBasedOn],
                                                    value2: e.target.value
                                                }
                                            }))}
                                        />
                                    </div>
                                )}

                                <div
                                    className={"unique-values-search-and-list-container-in-filter-popup"}
                                >
                                    <h3>Filter by Unique Values</h3>
                                    <input
                                        type="text"
                                        className={"table-module-filter-search-input-field"}
                                        placeholder={"Search unique values..."}
                                        value={uniqueValueSearch}
                                        onChange={(e) => setUniqueValueSearch(e.target.value)}
                                    />
                                    <div className={"table-module-filter-popup-values-list"}>
                                        {smartFilterData.uniqueValues
                                            .filter(v => uniqueValueSearch ? String(v).toLowerCase().includes(uniqueValueSearch.toLowerCase()) : true)
                                            .map((value, index) => (
                                                <label key={index}
                                                       className={"unique-values-list-item-label-in-filter-popup"}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(() => {
                                                            const filter = columnFilters[columnToFilterBasedOn];
                                                            if (!filter.checkedValues) return true;
                                                            return filter.checkedValues.has(value);
                                                        })()}
                                                        onChange={() => {
                                                            setColumnFilters(prev => {
                                                                const filter = prev[columnToFilterBasedOn];
                                                                let newChecked = filter.checkedValues ? new Set(filter.checkedValues) : new Set(smartFilterData.baseUniqueValues);
                                                                if (newChecked.has(value)) {
                                                                    newChecked.delete(value);
                                                                } else {
                                                                    newChecked.add(value);
                                                                }
                                                                if (newChecked.size === smartFilterData.baseUniqueValues.length) {
                                                                    newChecked = null;
                                                                }
                                                                return {
                                                                    ...prev,
                                                                    [columnToFilterBasedOn]: {
                                                                        ...filter,
                                                                        checkedValues: newChecked
                                                                    }
                                                                };
                                                            });
                                                        }}
                                                    /> {value}
                                                </label>
                                            ))
                                        }
                                        {smartFilterData.uniqueValues.filter(v => uniqueValueSearch ? String(v).toLowerCase().includes(uniqueValueSearch.toLowerCase()) : true).length === 0 && (
                                            <p
                                                className={"unique-values-no-items-in-list-body-text-in-filter-popup"}
                                            >
                                                No unique values found
                                            </p>
                                        )}
                                    </div>
                                    <div
                                        className={"unique-values-action-buttons-wrapper-in-filter-popup"}
                                    >
                                        <button onClick={() => {
                                            const visibleValues = smartFilterData.uniqueValues.filter(v =>
                                                uniqueValueSearch ? String(v).toLowerCase().includes(uniqueValueSearch.toLowerCase()) : true
                                            );
                                            setColumnFilters(prev => {
                                                const filter = prev[columnToFilterBasedOn];
                                                let currentChecked = filter.checkedValues ? new Set(filter.checkedValues) : new Set(smartFilterData.baseUniqueValues);
                                                visibleValues.forEach(v => currentChecked.add(v));
                                                const newChecked = currentChecked.size === smartFilterData.baseUniqueValues.length ? null : currentChecked;
                                                return {
                                                    ...prev,
                                                    [columnToFilterBasedOn]: {...filter, checkedValues: newChecked}
                                                };
                                            });
                                        }}>Check All
                                        </button>

                                        <button onClick={() => {
                                            const visibleValues = smartFilterData.uniqueValues.filter(v =>
                                                uniqueValueSearch ? String(v).toLowerCase().includes(uniqueValueSearch.toLowerCase()) : true
                                            );
                                            setColumnFilters(prev => {
                                                const filter = prev[columnToFilterBasedOn];
                                                let currentChecked = filter.checkedValues ? new Set(filter.checkedValues) : new Set(smartFilterData.baseUniqueValues);
                                                visibleValues.forEach(v => currentChecked.delete(v));
                                                const newChecked = currentChecked.size === smartFilterData.baseUniqueValues.length ? null : currentChecked;
                                                return {
                                                    ...prev,
                                                    [columnToFilterBasedOn]: {...filter, checkedValues: newChecked}
                                                };
                                            });
                                        }}>Uncheck All
                                        </button>

                                        <button onClick={() => {
                                            setIsFilterPopupOpen(false);
                                        }}>Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
    footerModuleElements: PropTypes.array,
    onDeleteEntry: PropTypes.func,
    allowDeleteEntryOption: PropTypes.bool,
    columnsToWrap: PropTypes.arrayOf(PropTypes.string),
    allowEditEntryOption: PropTypes.bool,
    onEditEntryOption: PropTypes.func,
    likelyUrlColumns: PropTypes.objectOf(PropTypes.func),
    allowSticky: PropTypes.bool,
    dataTypes: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
    hideHorizontalScrollBar: PropTypes.bool,
    hideVerticalScrollBar: PropTypes.bool,
    tablePages: PropTypes.bool,
};

export default Table;