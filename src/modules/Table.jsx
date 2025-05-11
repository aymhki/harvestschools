import {useEffect, useMemo, useState, useCallback, Fragment} from "react";
import PropTypes from "prop-types";
import '../styles/Table.css';
import {animated, useSpring} from 'react-spring';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

function Table({ tableHeader, tableData, numCols, sortConfigParam, scrollable, compact, allowHideColumns, defaultHiddenColumns, allowExport, exportFileName, filterableColumns, headerModuleElements, onDeleteEntry, allowDeleteEntryOption }) {
    const [sortConfig, setSortConfig] = useState(sortConfigParam ? sortConfigParam : { column: null, direction: 'neutral' });
    const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns || []));
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
    const [columnToFilterBasedOn, setColumnToFilterBasedOn] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [finalTableData, setFinalTableData] = useState(tableData); // This is the data that will be displayed after filtering and sorting and hiding columns
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
    const sortedData = useMemo(() => {
        if (sortConfig.column === null) {
            return tableData;
        }
        if (!tableData) {
            return [];
        }
        const sorted = [...tableData];
        const startIndex = tableHeader ? 2 : 1;
        const compare = (a, b) => {
            const valueA = a[sortConfig.column];
            const valueB = b[sortConfig.column];
            const numA = Number(valueA);
            const numB = Number(valueB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortConfig.direction === 'ascending'
                    ? numA - numB
                    : numB - numA;
            }
            if (valueA < valueB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valueA > valueB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        };
        const sortedSection = sorted.slice(startIndex).sort(compare);
        return sorted.slice(0, startIndex).concat(sortedSection);
    }, [tableData, sortConfig, tableHeader]);

    const getFilterUniqueValuesDict = useCallback(() => {
            if (!tableData || !tableData.length || !tableData[0]) {
                return {};
            }

            const filterUniqueValuesDict = {};
            const startIndex = tableHeader ? 2 : 1;

            // Only process if we have filterable columns defined
            if (filterableColumns && filterableColumns.length > 0) {
                for (let i = 0; i < tableData[0].length; i++) {
                    const columnName = tableData[0][i];

                    // Check if this column is in the filterable columns list
                    if (filterableColumns.includes(columnName)) {
                        // Extract unique values for this column from the data rows
                        const uniqueValues = [...new Set(
                            tableData.slice(startIndex)
                                .map(row => row[i])
                                .filter(value => value !== undefined && value !== null)
                        )];

                        // Create the filter structure for this column
                        filterUniqueValuesDict[columnName] = {
                            uniqueValues: uniqueValues,
                            checked: new Array(uniqueValues.length).fill(true)
                        };
                    }
                }
            }

            return filterUniqueValuesDict;
        },
        [tableHeader, tableData, filterableColumns]
    );

    const [filterUniqueValuesDict, setFilterUniqueValuesDict] = useState({});

    // Initialize filterUniqueValuesDict when tableData changes
    useEffect(() => {
        if (tableData && tableData.length > 0) {
            setFilterUniqueValuesDict(getFilterUniqueValuesDict());
        }
    }, [tableData, getFilterUniqueValuesDict]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const requestSort = (columnIndex) => {
        let direction = 'ascending';
        if (sortConfig.column === columnIndex && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.column === columnIndex && sortConfig.direction === 'descending') {
            direction = 'neutral';
        }
        setSortConfig({ column: direction === 'neutral' ? null : columnIndex, direction });
    };

    const getSortIndicator = (columnIndex) => {
        if (sortConfig.column !== columnIndex) return ' ⇅';
        if (sortConfig.direction === 'ascending') return ' ⇧';
        if (sortConfig.direction === 'descending') return ' ⇩';
        return ' ⇅';
    };

    const detectLink = (text) => {
        if (text) {
            const linkRegex = /https?:\/\/[^\s]+?\.[a-zA-Z]{3}/g;
            const link = text.match(linkRegex);
            if (link) {
                const linkText = text.replace(linkRegex, '');
                return <p className={"table-link"} lang={"en"}
                          onClick={() => {
                              window.open(link + linkText, "_blank");
                          }}
                >{link + linkText}</p>;
            }
        }
        return text;
    };

    const toggleColumnVisibility = (column) => {
        setHiddenColumns((prevHidden) => {
            const newHidden = new Set(prevHidden);
            if (newHidden.has(column)) {
                newHidden.delete(column);
            } else {
                newHidden.add(column);
            }
            return newHidden;
        });
    };

    const detectLang = (text) => {
        const arabicRegex = /[\u0600-\u06FF]/;
        return arabicRegex.test(text) ? 'ar' : 'en';
    }

    const updateFinalTableData = useCallback(() => {
        if (!tableData || !tableData.length) {
            return;
        }

        // Start with sorted data
        let filteredData = [...sortedData];

        // Apply filtering only if we have filterableColumns
        if (filterableColumns && filterableColumns.length > 0) {
            for (let i = 0; i < tableData[0].length; i++) {
                const columnName = tableData[0][i];

                // Check if this column is filterable and has filter settings in the dictionary
                if (filterableColumns.includes(columnName) && filterUniqueValuesDict[columnName]) {
                    const columnFilter = filterUniqueValuesDict[columnName];

                    // Apply the filter
                    filteredData = filteredData.filter((row, rowIndex) => {
                        // Always keep header rows
                        if (rowIndex === 0 || (tableHeader && rowIndex === 1)) {
                            return true;
                        }

                        const cellValue = row[i];
                        const valueIndex = columnFilter.uniqueValues.indexOf(cellValue);

                        // If the value is not found in the unique values array, keep it (defensive programming)
                        if (valueIndex === -1) {
                            return true;
                        }

                        // Check if this value is checked in the filter
                        return columnFilter.checked[valueIndex];
                    });
                }
            }
        }

        // Apply column hiding
        const hiddenColumnsData = filteredData.map(row =>
            row.filter((cell, index) => !hiddenColumns.has(sortedData[0][index]))
        );

        setFinalTableData(hiddenColumnsData);
    }, [sortedData, hiddenColumns, filterUniqueValuesDict, tableData, filterableColumns, tableHeader]);

    useEffect(() => {
            updateFinalTableData();
        },
        [hiddenColumns, sortConfig, filterUniqueValuesDict, updateFinalTableData]
    );

    // Function to check if there are any active filters
    const hasActiveFilters = useCallback(() => {
        if (!filterUniqueValuesDict) return false;

        return Object.keys(filterUniqueValuesDict).some(key =>
            filterUniqueValuesDict[key] &&
            filterUniqueValuesDict[key].checked &&
            filterUniqueValuesDict[key].checked.includes(false)
        );
    }, [filterUniqueValuesDict]);

    // Function to reset all filters
    const resetAllFilters = useCallback(() => {
        const updatedFilters = {...filterUniqueValuesDict};

        Object.keys(updatedFilters).forEach(key => {
            if (updatedFilters[key] && updatedFilters[key].checked) {
                updatedFilters[key].checked = updatedFilters[key].checked.map(() => true);
            }
        });

        setFilterUniqueValuesDict(updatedFilters);
    }, [filterUniqueValuesDict]);

    return (
        <div className="table-module" style={{overflow: scrollable ? 'auto' : 'hidden'}}>
            <div className={"table-module-header"}>
                <div className={"table-module-header-buttons-wrapper"}>
                    {
                        (!finalTableData || finalTableData.length === 0) && (
                            <div className={"table-module-header-empty-state"}>
                                <h3>
                                    No Table Entries Found.
                                </h3>
                            </div>
                        )
                    }
                    {finalTableData && allowHideColumns && (
                        <button onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
                            {isAccordionOpen ? 'Hide Columns' : 'Show Columns'}
                        </button>
                    )}
                    {finalTableData && allowExport && (
                        <button onClick={() => {
                            if (!finalTableData) {return;}
                            const csv = finalTableData.map(row =>
                                row.map(field => {
                                        if (field && field !== null && field !== undefined && typeof field === 'string' && field.length > 0) {
                                            return (field.includes(',') || field.includes(', ') || field.includes('\n') || field.includes('\r') || field.includes('\r\n') || field.includes('\n\r'))  ? `"${field}"` : field
                                        } else {
                                            return '';
                                        }
                                    }
                                ).join(',')
                            ).join('\n');
                            const blob = new Blob([csv], {type: 'text/csv'});
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${exportFileName ? exportFileName : 'table'}-${new Date().toISOString().split('T')[0]}-${new Date().toLocaleTimeString().replace(/:/g, '-')}.csv`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }}>
                            Export to CSV
                        </button>
                    )}
                    {finalTableData && hasActiveFilters() && (
                        <button onClick={resetAllFilters}>
                            Reset Filters
                        </button>
                    )}
                    {
                        headerModuleElements && headerModuleElements.map((element, index) => (
                            <Fragment key={index}>
                                {element}
                            </Fragment>
                        ))
                    }
                </div>
            </div>
            <table className={`${scrollable ? 'table-module-table-scrollable' : 'table-module-table'}`}
                   style={{
                       marginTop: `${(allowExport || allowHideColumns) ? (isMobile ? '10rem' : '10rem') : '0'}`,
                   }}
            >
                <tbody>
                {tableHeader &&
                    <tr>
                        <th colSpan={numCols}>
                            <h1>{tableHeader}</h1>
                        </th>
                    </tr>
                }
                {finalTableData && finalTableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex}
                                style={{
                                    cursor: rowIndex === 0 ? 'pointer' : 'default',
                                    whiteSpace: `${(scrollable && rowIndex === 0) ? 'nowrap' : 'normal'}`,
                                }}>
                                {rowIndex === (tableHeader ? 0 : 0) ? (
                                    <>
                                        {compact ? (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <h3 className={"compact-table-header-text"} lang={detectLang(cell)} onClick={() => requestSort(cellIndex)}>
                                                    {detectLink(cell)}{getSortIndicator(cellIndex)}
                                                </h3>
                                                {(filterableColumns && finalTableData[0] &&
                                                        filterableColumns.includes(finalTableData[0][cellIndex])) &&
                                                    <FilterAltIcon onClick={() =>
                                                    {
                                                        setIsFilterPopupOpen(!isFilterPopupOpen);
                                                        setSearchQuery('');
                                                        setColumnToFilterBasedOn(finalTableData[0][cellIndex]);
                                                    }
                                                    }/>
                                                }
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <h2 lang={detectLang(cell)} onClick={() => requestSort(cellIndex)}>
                                                    {detectLink(cell)}{getSortIndicator(cellIndex)}
                                                </h2>
                                                {(filterableColumns && finalTableData[0] &&
                                                        filterableColumns.includes(finalTableData[0][cellIndex])) &&
                                                    <FilterAltIcon onClick={() =>
                                                    {
                                                        setIsFilterPopupOpen(!isFilterPopupOpen);
                                                        setSearchQuery('');
                                                        setColumnToFilterBasedOn(finalTableData[0][cellIndex]);
                                                    }
                                                    }/>
                                                }
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {compact ? (
                                            <p
                                                className={"compact-table-cell-text"}
                                                lang={detectLang(cell)}
                                            >
                                                {detectLink(cell)}
                                            </p>
                                        ) : (
                                            <p
                                                lang={detectLang(cell)}
                                            >
                                                {detectLink(cell)}
                                            </p>
                                        )}
                                    </>
                                )}
                            </td>
                        ))}
                        {allowDeleteEntryOption && onDeleteEntry && rowIndex !== 0 && (
                            <td style={{ textAlign: 'center' }}>
                                <button
                                    onClick={() => onDeleteEntry(rowIndex)}
                                    aria-label="Delete row"
                                >
                                    Delete
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
            <animated.div className="table-module-accordion" style={contentAnimation}>
                <div className="table-module-accordion-overlay" onClick={() => {
                    setIsAccordionOpen(false)
                }}/>
                <div className="table-module-accordion-content">
                    <div className="table-module-accordion-buttons">
                        <button
                            onClick={() => {
                                setHiddenColumns(new Set(tableData && tableData[0] ?
                                    tableData[0].filter((header) => defaultHiddenColumns && defaultHiddenColumns.includes(header)) :
                                    []
                                ));
                            }}
                        >
                            Default
                        </button>
                        <button onClick={() => setHiddenColumns(new Set())}>Show All</button>
                        <button onClick={() => setHiddenColumns(new Set(tableData && tableData[0] ? tableData[0] : []))}>Hide All</button>
                        <button onClick={() => setIsAccordionOpen(false)}>Close</button>
                    </div>
                    {tableData && tableData[0] && tableData[0].map((header, index) => (
                        <div key={index}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!hiddenColumns.has(header)}
                                    onChange={() => toggleColumnVisibility(header)}
                                />
                                {'\t' + header}
                            </label>
                        </div>
                    ))}
                </div>
            </animated.div>
            <animated.div className={"table-module-filter-popup-container"} style={popupAnimation}>
                <div className={"table-module-filter-popup-background"} onClick={() => {
                    setIsFilterPopupOpen(false);
                    setSearchQuery('');
                }}/>
                <div className={"table-module-filter-popup"}>
                    <div className={"table-module-filter-popup-content"}>
                        <h2>Filter Options</h2>
                        <div>
                            <h3>Unique Values</h3>
                            <input type="text" className={"table-module-filter-search-input-field"}
                                   placeholder={"Search"} value={searchQuery}
                                   onChange={(e) => setSearchQuery(e.target.value)}/>
                            <div className={"table-module-filter-popup-values-list"}>
                                {
                                    columnToFilterBasedOn &&
                                    filterUniqueValuesDict[columnToFilterBasedOn] &&
                                    filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues
                                        .filter(value => {
                                            // Filter based on search query
                                            if (searchQuery) {
                                                return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
                                            }
                                            return true;
                                        })
                                        .map((value, index) => (
                                            <label key={index}>
                                                <input
                                                    type="checkbox"
                                                    checked={filterUniqueValuesDict[columnToFilterBasedOn].checked[
                                                        filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues.indexOf(value)
                                                        ]}
                                                    onChange={() => {
                                                        const updatedFilters = {...filterUniqueValuesDict};
                                                        const valueIndex = updatedFilters[columnToFilterBasedOn].uniqueValues.indexOf(value);

                                                        if (valueIndex !== -1) {
                                                            updatedFilters[columnToFilterBasedOn].checked[valueIndex] =
                                                                !updatedFilters[columnToFilterBasedOn].checked[valueIndex];
                                                            setFilterUniqueValuesDict(updatedFilters);
                                                        }
                                                    }}
                                                />
                                                {value}
                                            </label>
                                        ))
                                }
                            </div>
                        </div>
                        <div className={"table-module-filter-popup-buttons-wrapper"}>
                            {columnToFilterBasedOn && filterUniqueValuesDict[columnToFilterBasedOn] && (
                                <>
                                    <button
                                        onClick={() => {
                                            const updatedFilters = {...filterUniqueValuesDict};
                                            if (updatedFilters[columnToFilterBasedOn]) {
                                                updatedFilters[columnToFilterBasedOn].checked =
                                                    updatedFilters[columnToFilterBasedOn].checked.map(() => true);
                                                setFilterUniqueValuesDict(updatedFilters);
                                            }
                                        }}
                                    >Check All
                                    </button>
                                    <button
                                        onClick={() => {
                                            const updatedFilters = {...filterUniqueValuesDict};
                                            if (updatedFilters[columnToFilterBasedOn]) {
                                                updatedFilters[columnToFilterBasedOn].checked =
                                                    updatedFilters[columnToFilterBasedOn].checked.map(() => false);
                                                setFilterUniqueValuesDict(updatedFilters);
                                            }
                                        }}
                                    >Uncheck All
                                    </button>
                                </>
                            )}
                            <button onClick={() => {
                                setIsFilterPopupOpen(false);
                                setSearchQuery('');
                            }}>Close</button>
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
};

export default Table;
