import {useEffect, useMemo, useState, useCallback} from "react";
import PropTypes from "prop-types";
import '../styles/Table.css';
import {animated, useSpring} from 'react-spring';
import FilterAltIcon from '@mui/icons-material/FilterAlt';


function Table({ tableHeader, tableData, numCols, sortConfigParam, scrollable, compact, allowHideColumns, defaultHiddenColumns, allowExport, exportFileName, filterableColumns }) {
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
            const filterUniqueValuesDict = {};
            const startIndex = tableHeader ? 2 : 1;
            for (let i = 0; i < tableData[0].length; i++) {
                if (filterableColumns && filterableColumns.includes(tableData[0][i])) {
                    filterUniqueValuesDict[tableData[0][i]] = {
                        uniqueValues: [...new Set(tableData.slice(startIndex).map(row => row[i]))],
                        checked: [...new Array([...new Set(tableData.slice(startIndex).map(row => row[i]))].length).fill(true)]
                    };
                }
            }

            return filterUniqueValuesDict;
        },
        [tableHeader, tableData, filterableColumns]
    );

    const [filterUniqueValuesDict, setFilterUniqueValuesDict] = useState(getFilterUniqueValuesDict());


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
        let filteredData = [...sortedData];
        for (let i = 0; i < tableData[0].length; i++) {
            if (filterableColumns && filterableColumns.includes(tableData[0][i])) {
                filteredData = filteredData.filter((row, rowIndex) => rowIndex === 0 || filterUniqueValuesDict[tableData[0][i]].checked[filterUniqueValuesDict[tableData[0][i]].uniqueValues.indexOf(row[i])]);
            }
        }
        let hiddenColumnsData = filteredData.map(row => row.filter((cell, index) => !hiddenColumns.has(sortedData[0][index])));
        setFinalTableData(hiddenColumnsData);
    }, [sortedData, hiddenColumns, filterUniqueValuesDict, tableData, filterableColumns]);

    useEffect(() => {
            updateFinalTableData();
        },
        [hiddenColumns, sortConfig, updateFinalTableData]
    );


    return (
        <div className="table-module" style={{overflow: scrollable ? 'auto' : 'hidden',}}>
            <div className={"table-module-header"}>
                <div className={"table-module-header-buttons-wrapper"}>
                    {allowHideColumns && (
                        <button onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
                            {isAccordionOpen ? 'Hide Columns' : 'Show Columns'}
                        </button>

                    )}
                    {allowExport && (
                        <button onClick={() => {
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

                    {
                        // if one value in the filterUniqueValuesDict is not checked, show the reset filter button
                        Object.keys(filterUniqueValuesDict).some(key => filterUniqueValuesDict[key].checked.includes(false)) &&
                        <button onClick={() => {
                            for (let i = 0; i < tableData[0].length; i++) {
                                if (filterableColumns && filterableColumns.includes(tableData[0][i])) {
                                    filterUniqueValuesDict[tableData[0][i]].checked = filterUniqueValuesDict[tableData[0][i]].checked.map(() => true);
                                }
                            }
                            setFilterUniqueValuesDict({...filterUniqueValuesDict});
                        }}>
                            Reset Filters
                        </button>

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
                {finalTableData.map((row, rowIndex) => (
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

                                                    {(filterableColumns && filterableColumns.includes(finalTableData[0][cellIndex])) &&
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

                                                    {(filterableColumns && filterableColumns.includes(finalTableData[0][cellIndex])) &&
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
                                setHiddenColumns(new Set(tableData[0].filter((header) => defaultHiddenColumns.includes(header))));
                            }}
                        >
                            Default
                        </button>
                        <button onClick={() => setHiddenColumns(new Set())}>Show All</button>
                        <button onClick={() => setHiddenColumns(new Set(tableData[0]))}>Hide All</button>
                        <button onClick={() => setIsAccordionOpen(false)}>Close</button>
                    </div>

                    {tableData[0].map((header, index) => (
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
                                    filterUniqueValuesDict[columnToFilterBasedOn] &&
                                    filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues
                                        .filter(value => {
                                            // Filter based on search query
                                            if (searchQuery) {
                                                return value.toLowerCase().includes(searchQuery.toLowerCase());
                                            }
                                            return true;
                                        })
                                        // .filter(value => {
                                        //     // TODO: if a value is checked but not in the rendered table, it should not be in the list displayed
                                        //     let valueInRenderedTable = false;
                                        //     let valueIsChecked = false;
                                        //
                                        //     for (let i = 0; i < finalTableData.length && !valueInRenderedTable; i++) {
                                        //         if (finalTableData[i].includes(value)) {
                                        //             valueInRenderedTable = true;
                                        //         }
                                        //     }
                                        //
                                        //     if (filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues.includes(value)) {
                                        //         valueIsChecked = filterUniqueValuesDict[columnToFilterBasedOn].checked[filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues.indexOf(value)];
                                        //     }
                                        //
                                        //     return !(!valueInRenderedTable && valueIsChecked);
                                        // })
                                        .map((value, index) => (
                                            <label key={index}>
                                                <input
                                                    type="checkbox"
                                                    checked={filterUniqueValuesDict[columnToFilterBasedOn].checked[index]}
                                                    onChange={() => {
                                                        filterUniqueValuesDict[columnToFilterBasedOn].checked[index] = !filterUniqueValuesDict[columnToFilterBasedOn].checked[index];
                                                        setFilterUniqueValuesDict({...filterUniqueValuesDict});
                                                    }}
                                                />
                                                {value}
                                            </label>
                                        ))
                                }
                            </div>
                        </div>
                        <div className={"table-module-filter-popup-buttons-wrapper"}>
                            <button
                                onClick={() => {
                                    filterUniqueValuesDict[columnToFilterBasedOn].checked = filterUniqueValuesDict[columnToFilterBasedOn].checked.map(() => true);
                                    setFilterUniqueValuesDict({...filterUniqueValuesDict});
                                }}
                            >Check All
                            </button>
                            <button
                                onClick={() => {
                                    filterUniqueValuesDict[columnToFilterBasedOn].checked = filterUniqueValuesDict[columnToFilterBasedOn].checked.map(() => false);
                                    setFilterUniqueValuesDict({...filterUniqueValuesDict});
                                }}
                            >Uncheck All
                            </button>
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
    tableData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
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
};

export default Table;
