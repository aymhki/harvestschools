// import {useEffect, useMemo, useState, useCallback, Fragment} from "react";
// import PropTypes from "prop-types";
// import '../styles/Table.css';
// import {animated, useSpring} from 'react-spring';
// import FilterAltIcon from '@mui/icons-material/FilterAlt';
//
// function Table({
//                    tableHeader,
//                    tableData,
//                    numCols,
//                    sortConfigParam,
//                    scrollable,
//                    compact,
//                    allowHideColumns,
//                    defaultHiddenColumns,
//                    allowExport,
//                    exportFileName,
//                    filterableColumns,
//                    headerModuleElements,
//                    onDeleteEntry,
//                    allowDeleteEntryOption,
//                    columnsToWrap,
//                    onEditEntry,
//                    allowEditEntryOption
// }) {
//     const [sortConfig, setSortConfig] = useState(sortConfigParam ? sortConfigParam : { column: null, direction: 'neutral' });
//     const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns || []));
//     const [isAccordionOpen, setIsAccordionOpen] = useState(false);
//     const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
//     const [columnToFilterBasedOn, setColumnToFilterBasedOn] = useState(null);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
//     const [finalTableData, setFinalTableData] = useState(tableData); // This is the data that will be displayed after filtering and sorting and hiding columns
//     const contentAnimation = useSpring({
//         opacity: isAccordionOpen ? 1 : 0,
//         transform: isAccordionOpen ? 'translateY(0)' : 'translateY(-100%)',
//         config: { duration: 300 },
//     });
//     const popupAnimation = useSpring({
//         opacity: isFilterPopupOpen ? 1 : 0,
//         transform: isFilterPopupOpen ? 'translateY(0)' : 'translateY(-100%)',
//         config: { duration: 300 },
//     });
//     const sortedData = useMemo(() => {
//         if (sortConfig.column === null) {
//             return tableData;
//         }
//         if (!tableData) {
//             return [];
//         }
//         const sorted = [...tableData];
//         const startIndex = tableHeader ? 2 : 1;
//         const compare = (a, b) => {
//             const valueA = a[sortConfig.column];
//             const valueB = b[sortConfig.column];
//             const numA = Number(valueA);
//             const numB = Number(valueB);
//             if (!isNaN(numA) && !isNaN(numB)) {
//                 return sortConfig.direction === 'ascending'
//                     ? numA - numB
//                     : numB - numA;
//             }
//             if (valueA < valueB) {
//                 return sortConfig.direction === 'ascending' ? -1 : 1;
//             }
//             if (valueA > valueB) {
//                 return sortConfig.direction === 'ascending' ? 1 : -1;
//             }
//             return 0;
//         };
//         const sortedSection = sorted.slice(startIndex).sort(compare);
//         return sorted.slice(0, startIndex).concat(sortedSection);
//     }, [tableData, sortConfig, tableHeader]);
//
//     const getFilterUniqueValuesDict = useCallback(() => {
//             if (!tableData || !tableData.length || !tableData[0]) {
//                 return {};
//             }
//
//             const filterUniqueValuesDict = {};
//             const startIndex = tableHeader ? 2 : 1;
//
//             if (filterableColumns && filterableColumns.length > 0) {
//                 for (let i = 0; i < tableData[0].length; i++) {
//                     const columnName = tableData[0][i];
//
//                     if (filterableColumns.includes(columnName)) {
//                         const uniqueValues = [...new Set(
//                             tableData.slice(startIndex)
//                                 .map(row => row[i])
//                                 .filter(value => value !== undefined && value !== null)
//                         )];
//
//                         filterUniqueValuesDict[columnName] = {
//                             uniqueValues: uniqueValues,
//                             checked: new Array(uniqueValues.length).fill(true)
//                         };
//                     }
//                 }
//             }
//
//             return filterUniqueValuesDict;
//         },
//         [tableHeader, tableData, filterableColumns]
//     );
//
//     const [filterUniqueValuesDict, setFilterUniqueValuesDict] = useState({});
//
//     useEffect(() => {
//         if (tableData && tableData.length > 0) {
//             setFilterUniqueValuesDict(getFilterUniqueValuesDict());
//         }
//     }, [tableData, getFilterUniqueValuesDict]);
//
//     useEffect(() => {
//         const handleResize = () => {
//             setIsMobile(window.innerWidth < 768);
//         };
//         window.addEventListener('resize', handleResize);
//         return () => window.removeEventListener('resize', handleResize);
//     }, []);
//
//     const requestSort = (columnIndex) => {
//         let direction = 'ascending';
//         if (sortConfig.column === columnIndex && sortConfig.direction === 'ascending') {
//             direction = 'descending';
//         } else if (sortConfig.column === columnIndex && sortConfig.direction === 'descending') {
//             direction = 'neutral';
//         }
//         setSortConfig({ column: direction === 'neutral' ? null : columnIndex, direction });
//     };
//
//     const getSortIndicator = (columnIndex) => {
//         if (sortConfig.column !== columnIndex) return ' ⇅';
//         if (sortConfig.direction === 'ascending') return ' ⇧';
//         if (sortConfig.direction === 'descending') return ' ⇩';
//         return ' ⇅';
//     };
//
//     const detectLink = (text) => {
//         if (text) {
//             const linkRegex = /https?:\/\/[^\s]+?\.[a-zA-Z]{3}/g;
//             const link = text.match(linkRegex);
//             if (link) {
//                 const linkText = text.replace(linkRegex, '');
//                 return <p className={"table-link"} lang={"en"}
//                           onClick={() => {
//                               window.open(link + linkText, "_blank");
//                           }}
//                 >{link + linkText}</p>;
//             }
//         }
//         return text;
//     };
//
//     const toggleColumnVisibility = (column) => {
//         setHiddenColumns((prevHidden) => {
//             const newHidden = new Set(prevHidden);
//             if (newHidden.has(column)) {
//                 newHidden.delete(column);
//             } else {
//                 newHidden.add(column);
//             }
//             return newHidden;
//         });
//     };
//
//     const detectLang = (text) => {
//         const arabicRegex = /[\u0600-\u06FF]/;
//         return arabicRegex.test(text) ? 'ar' : 'en';
//     }
//
//     const updateFinalTableData = useCallback(() => {
//         if (!tableData || !tableData.length) {
//             return;
//         }
//
//         let filteredData = [...sortedData];
//
//         if (filterableColumns && filterableColumns.length > 0) {
//             for (let i = 0; i < tableData[0].length; i++) {
//                 const columnName = tableData[0][i];
//
//                 if (filterableColumns.includes(columnName) && filterUniqueValuesDict[columnName]) {
//                     const columnFilter = filterUniqueValuesDict[columnName];
//
//                     filteredData = filteredData.filter((row, rowIndex) => {
//                         if (rowIndex === 0 || (tableHeader && rowIndex === 1)) {
//                             return true;
//                         }
//
//                         const cellValue = row[i];
//                         const valueIndex = columnFilter.uniqueValues.indexOf(cellValue);
//
//                         if (valueIndex === -1) {
//                             return true;
//                         }
//
//                         return columnFilter.checked[valueIndex];
//                     });
//                 }
//             }
//         }
//
//         const hiddenColumnsData = filteredData.map(row =>
//             row.filter((cell, index) => !hiddenColumns.has(sortedData[0][index]))
//         );
//
//         setFinalTableData(hiddenColumnsData);
//     }, [sortedData, hiddenColumns, filterUniqueValuesDict, tableData, filterableColumns, tableHeader]);
//
//     useEffect(() => {
//             updateFinalTableData();
//         },
//         [hiddenColumns, sortConfig, filterUniqueValuesDict, updateFinalTableData]
//     );
//
//     const hasActiveFilters = useCallback(() => {
//         if (!filterUniqueValuesDict) return false;
//
//         return Object.keys(filterUniqueValuesDict).some(key =>
//             filterUniqueValuesDict[key] &&
//             filterUniqueValuesDict[key].checked &&
//             filterUniqueValuesDict[key].checked.includes(false)
//         );
//     }, [filterUniqueValuesDict]);
//
//     const resetAllFilters = useCallback(() => {
//         const updatedFilters = {...filterUniqueValuesDict};
//
//         Object.keys(updatedFilters).forEach(key => {
//             if (updatedFilters[key] && updatedFilters[key].checked) {
//                 updatedFilters[key].checked = updatedFilters[key].checked.map(() => true);
//             }
//         });
//
//         setFilterUniqueValuesDict(updatedFilters);
//     }, [filterUniqueValuesDict]);
//
//     return (
//         <div className="table-module" style={{overflow: scrollable ? 'auto' : 'hidden'}}>
//             <div className={"table-module-header"}>
//                 <div className={"table-module-header-buttons-wrapper"}>
//                     {
//                         (!finalTableData || finalTableData.length === 0) && (
//                             <div className={"table-module-header-empty-state"}>
//                                 <h3>
//                                     No Table Entries Found.
//                                 </h3>
//                             </div>
//                         )
//                     }
//                     {finalTableData && allowHideColumns && (
//                         <button onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
//                             {isAccordionOpen ? 'Hide Columns' : 'Show Columns'}
//                         </button>
//                     )}
//                     {finalTableData && allowExport && (
//                         <button onClick={() => {
//                             if (!finalTableData) {return;}
//                             const csv = finalTableData.map(row =>
//                                 row.map(field => {
//                                         if (field && field !== null && field !== undefined && typeof field === 'string' && field.length > 0) {
//                                             return (field.includes(',') || field.includes(', ') || field.includes('\n') || field.includes('\r') || field.includes('\r\n') || field.includes('\n\r'))  ? `"${field}"` : field
//                                         } else {
//                                             return '';
//                                         }
//                                     }
//                                 ).join(',')
//                             ).join('\n');
//                             const blob = new Blob([csv], {type: 'text/csv'});
//                             const url = window.URL.createObjectURL(blob);
//                             const a = document.createElement('a');
//                             a.href = url;
//                             a.download = `${exportFileName ? exportFileName : 'table'}-${new Date().toISOString().split('T')[0]}-${new Date().toLocaleTimeString().replace(/:/g, '-')}.csv`;
//                             a.click();
//                             window.URL.revokeObjectURL(url);
//                         }}>
//                             Export to CSV
//                         </button>
//                     )}
//                     {finalTableData && hasActiveFilters() && (
//                         <button onClick={resetAllFilters}>
//                             Reset Filters
//                         </button>
//                     )}
//                     {
//                         headerModuleElements && headerModuleElements.map((element, index) => (
//                             <Fragment key={index}>
//                                 {element}
//                             </Fragment>
//                         ))
//                     }
//                 </div>
//             </div>
//             <table className={`${scrollable ? 'table-module-table-scrollable' : 'table-module-table'}`}
//                    style={{
//                        marginTop: `${(allowExport || allowHideColumns) ? (isMobile ? '10rem' : '10rem') : '0'}`,
//                    }}
//             >
//                 <tbody>
//                 {tableHeader &&
//                     <tr>
//                         <th colSpan={numCols}>
//                             <h1>{tableHeader}</h1>
//                         </th>
//                     </tr>
//                 }
//                 {finalTableData && finalTableData.map((row, rowIndex) => (
//                     <tr key={rowIndex}>
//                         {row.map((cell, cellIndex) => (
//                             <td key={cellIndex}
//                                 style={{
//                                     cursor: rowIndex === 0 ? 'pointer' : 'default',
//                                     whiteSpace: `${(scrollable && rowIndex === 0) ? 'nowrap' : 'normal'}`,
//                                 }}>
//                                 {rowIndex === (tableHeader ? 0 : 0) ? (
//                                     <>
//                                         {compact ? (
//                                             <div style={{
//                                                 display: 'flex',
//                                                 justifyContent: 'space-between',
//                                                 alignItems: 'center',
//
//                                                 // wordBreak: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'break-word' : 'normal',
//                                                 wordWrap: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'break-word' : 'normal',
//                                                 wrap: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'break-word' : 'normal',
//                                                 textWrap: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'wrap' : 'nowrap',
//                                             }}>
//                                                 <h3 className={"compact-table-header-text"} lang={detectLang(cell)} onClick={() => requestSort(cellIndex)}>
//                                                     {detectLink(cell)}{getSortIndicator(cellIndex)}
//                                                 </h3>
//                                                 {(filterableColumns && finalTableData[0] &&
//                                                         filterableColumns.includes(finalTableData[0][cellIndex])) &&
//                                                     <FilterAltIcon onClick={() =>
//                                                     {
//                                                         setIsFilterPopupOpen(!isFilterPopupOpen);
//                                                         setSearchQuery('');
//                                                         setColumnToFilterBasedOn(finalTableData[0][cellIndex]);
//                                                     }
//                                                     }/>
//                                                 }
//                                             </div>
//                                         ) : (
//                                             <div style={{
//                                                 display: 'flex',
//                                                 justifyContent: 'space-between',
//                                                 alignItems: 'center',
//                                             }}>
//                                                 <h2 lang={detectLang(cell)} onClick={() => requestSort(cellIndex)}>
//                                                     {detectLink(cell)}{getSortIndicator(cellIndex)}
//                                                 </h2>
//                                                 {(filterableColumns && finalTableData[0] &&
//                                                         filterableColumns.includes(finalTableData[0][cellIndex])) &&
//                                                     <FilterAltIcon onClick={() =>
//                                                     {
//                                                         setIsFilterPopupOpen(!isFilterPopupOpen);
//                                                         setSearchQuery('');
//                                                         setColumnToFilterBasedOn(finalTableData[0][cellIndex]);
//                                                     }
//                                                     }/>
//                                                 }
//                                             </div>
//                                         )}
//                                     </>
//                                 ) : (
//                                     <>
//                                         {compact ? (
//                                             <p
//                                                 className={"compact-table-cell-text"}
//                                                 lang={detectLang(cell)}
//                                             >
//                                                 {detectLink(cell)}
//                                             </p>
//                                         ) : (
//                                             <p
//                                                 lang={detectLang(cell)}
//                                             >
//                                                 {detectLink(cell)}
//                                             </p>
//                                         )}
//                                     </>
//                                 )}
//                             </td>
//                         ))}
//
//                         {allowEditEntryOption && onEditEntry && rowIndex !== 0 && (
//                             <td style={{ textAlign: 'center' }}>
//                                 <button
//                                     onClick={() => onEditEntry(rowIndex)}
//                                     aria-label="Edit row"
//                                 >
//                                     Edit
//                                 </button>
//                             </td>
//                         )}
//
//                         {allowDeleteEntryOption && onDeleteEntry && rowIndex !== 0 && (
//                             <td style={{ textAlign: 'center' }}>
//                                 <button
//                                     onClick={() => onDeleteEntry(rowIndex)}
//                                     aria-label="Delete row"
//                                 >
//                                     Delete
//                                 </button>
//                             </td>
//                         )}
//                     </tr>
//                 ))}
//                 </tbody>
//             </table>
//             <animated.div className="table-module-accordion" style={contentAnimation}>
//                 <div className="table-module-accordion-overlay" onClick={() => {
//                     setIsAccordionOpen(false)
//                 }}/>
//                 <div className="table-module-accordion-content">
//                     <div className="table-module-accordion-buttons">
//                         <button
//                             onClick={() => {
//                                 setHiddenColumns(new Set(tableData && tableData[0] ?
//                                     tableData[0].filter((header) => defaultHiddenColumns && defaultHiddenColumns.includes(header)) :
//                                     []
//                                 ));
//                             }}
//                         >
//                             Default
//                         </button>
//                         <button onClick={() => setHiddenColumns(new Set())}>Show All</button>
//                         <button onClick={() => setHiddenColumns(new Set(tableData && tableData[0] ? tableData[0] : []))}>Hide All</button>
//                         <button onClick={() => setIsAccordionOpen(false)}>Close</button>
//                     </div>
//                     {tableData && tableData[0] && tableData[0].map((header, index) => (
//                         <div key={index}>
//                             <label>
//                                 <input
//                                     type="checkbox"
//                                     checked={!hiddenColumns.has(header)}
//                                     onChange={() => toggleColumnVisibility(header)}
//                                 />
//                                 {'\t' + header}
//                             </label>
//                         </div>
//                     ))}
//                 </div>
//             </animated.div>
//             <animated.div className={"table-module-filter-popup-container"} style={popupAnimation}>
//                 <div className={"table-module-filter-popup-background"} onClick={() => {
//                     setIsFilterPopupOpen(false);
//                     setSearchQuery('');
//                 }}/>
//                 <div className={"table-module-filter-popup"}>
//                     <div className={"table-module-filter-popup-content"}>
//                         <h2>Filter Options</h2>
//                         <div>
//                             <h3>Unique Values</h3>
//                             <input type="text" className={"table-module-filter-search-input-field"}
//                                    placeholder={"Search"} value={searchQuery}
//                                    onChange={(e) => setSearchQuery(e.target.value)}/>
//                             <div className={"table-module-filter-popup-values-list"}>
//                                 {
//                                     columnToFilterBasedOn &&
//                                     filterUniqueValuesDict[columnToFilterBasedOn] &&
//                                     filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues
//                                         .filter(value => {
//                                             if (searchQuery) {
//                                                 return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
//                                             }
//                                             return true;
//                                         })
//                                         .map((value, index) => (
//                                             <label key={index}>
//                                                 <input
//                                                     type="checkbox"
//                                                     checked={filterUniqueValuesDict[columnToFilterBasedOn].checked[
//                                                         filterUniqueValuesDict[columnToFilterBasedOn].uniqueValues.indexOf(value)
//                                                         ]}
//                                                     onChange={() => {
//                                                         const updatedFilters = {...filterUniqueValuesDict};
//                                                         const valueIndex = updatedFilters[columnToFilterBasedOn].uniqueValues.indexOf(value);
//
//                                                         if (valueIndex !== -1) {
//                                                             updatedFilters[columnToFilterBasedOn].checked[valueIndex] =
//                                                                 !updatedFilters[columnToFilterBasedOn].checked[valueIndex];
//                                                             setFilterUniqueValuesDict(updatedFilters);
//                                                         }
//                                                     }}
//                                                 />
//                                                 {value}
//                                             </label>
//                                         ))
//                                 }
//                             </div>
//                         </div>
//                         <div className={"table-module-filter-popup-buttons-wrapper"}>
//                             {columnToFilterBasedOn && filterUniqueValuesDict[columnToFilterBasedOn] && (
//                                 <>
//                                     <button
//                                         onClick={() => {
//                                             const updatedFilters = {...filterUniqueValuesDict};
//                                             if (updatedFilters[columnToFilterBasedOn]) {
//                                                 updatedFilters[columnToFilterBasedOn].checked =
//                                                     updatedFilters[columnToFilterBasedOn].checked.map(() => true);
//                                                 setFilterUniqueValuesDict(updatedFilters);
//                                             }
//                                         }}
//                                     >Check All
//                                     </button>
//                                     <button
//                                         onClick={() => {
//                                             const updatedFilters = {...filterUniqueValuesDict};
//                                             if (updatedFilters[columnToFilterBasedOn]) {
//                                                 updatedFilters[columnToFilterBasedOn].checked =
//                                                     updatedFilters[columnToFilterBasedOn].checked.map(() => false);
//                                                 setFilterUniqueValuesDict(updatedFilters);
//                                             }
//                                         }}
//                                     >Uncheck All
//                                     </button>
//                                 </>
//                             )}
//                             <button onClick={() => {
//                                 setIsFilterPopupOpen(false);
//                                 setSearchQuery('');
//                             }}>Close</button>
//                         </div>
//                     </div>
//                 </div>
//             </animated.div>
//         </div>
//     );
// }
//
// Table.propTypes = {
//     tableHeader: PropTypes.string,
//     tableData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
//     numCols: PropTypes.number,
//     sortConfigParam: PropTypes.shape({
//         column: PropTypes.number,
//         direction: PropTypes.string
//     }),
//     scrollable: PropTypes.bool,
//     compact: PropTypes.bool,
//     allowHideColumns: PropTypes.bool,
//     defaultHiddenColumns: PropTypes.arrayOf(PropTypes.string),
//     allowExport: PropTypes.bool,
//     exportFileName: PropTypes.string,
//     filterableColumns: PropTypes.arrayOf(PropTypes.string),
//     headerModuleElements: PropTypes.array,
//     onDeleteEntry: PropTypes.func,
//     allowDeleteEntryOption: PropTypes.bool,
//     onEditEntry: PropTypes.func,
//     allowEditEntryOption: PropTypes.bool,
//     columnsToWrap: PropTypes.arrayOf(PropTypes.string),
// };
//
// export default Table;

import {useEffect, useMemo, useState, useCallback, Fragment} from "react";
import PropTypes from "prop-types";
import '../styles/Table.css';
import {animated, useSpring} from 'react-spring';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DatePicker from 'react-datepicker'; // You'll need to install this package
import 'react-datepicker/dist/react-datepicker.css'; // Import the styles

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
                   onEditEntry,
                   allowEditEntryOption
               }) {
    const [sortConfig, setSortConfig] = useState(sortConfigParam ? sortConfigParam : { column: null, direction: 'neutral' });
    const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns || []));
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
    const [columnToFilterBasedOn, setColumnToFilterBasedOn] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [finalTableData, setFinalTableData] = useState(tableData); // This is the data that will be displayed after filtering and sorting and hiding columns
    const [advancedFilters, setAdvancedFilters] = useState({});
    const [filterMode, setFilterMode] = useState('basic'); // 'basic' or 'advanced'

    // New state for advanced filtering
    const [dateFilter, setDateFilter] = useState({ type: 'exact', value: null });
    const [numberFilter, setNumberFilter] = useState({ type: 'exact', value: '' });

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

    // Helper function to determine column data type
    const getColumnType = useCallback((columnName) => {
        if (!filterableColumns) return 'Text';

        // Handle both the new object format and backward compatibility with array format
        if (Array.isArray(filterableColumns)) {
            return 'Text'; // Default to text for backward compatibility
        } else {
            return filterableColumns[columnName] || 'Text';
        }
    }, [filterableColumns]);

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
            if (filterableColumns) {
                // Handle both object and array formats
                const columnsToFilter = Array.isArray(filterableColumns)
                    ? filterableColumns
                    : Object.keys(filterableColumns);

                for (let i = 0; i < tableData[0].length; i++) {
                    const columnName = tableData[0][i];
                    if (columnsToFilter.includes(columnName)) {
                        const uniqueValues = [...new Set(
                            tableData.slice(startIndex)
                                .map(row => row[i])
                                .filter(value => value !== undefined && value !== null)
                        )];
                        filterUniqueValuesDict[columnName] = {
                            uniqueValues: uniqueValues,
                            checked: new Array(uniqueValues.length).fill(true),
                            type: getColumnType(columnName)
                        };
                    }
                }
            }
            return filterUniqueValuesDict;
        },
        [tableHeader, tableData, filterableColumns, getColumnType]
    );

    const [filterUniqueValuesDict, setFilterUniqueValuesDict] = useState({});

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

    // Enhanced filtering logic to handle advanced filters
    const updateFinalTableData = useCallback(() => {
        if (!tableData || !tableData.length) {
            return;
        }

        let filteredData = [...sortedData];
        const startIndex = tableHeader ? 2 : 1;

        if (filterableColumns) {
            for (let i = 0; i < tableData[0].length; i++) {
                const columnName = tableData[0][i];
                const columnFilter = filterUniqueValuesDict[columnName];
                const columnType = getColumnType(columnName);
                const columnsToFilter = Array.isArray(filterableColumns)
                    ? filterableColumns
                    : Object.keys(filterableColumns);

                if (columnsToFilter.includes(columnName) && columnFilter) {
                    // Apply basic filtering (checkbox selection)
                    filteredData = filteredData.filter((row, rowIndex) => {
                        if (rowIndex < startIndex) {
                            return true;
                        }

                        const cellValue = row[i];
                        const valueIndex = columnFilter.uniqueValues.indexOf(cellValue);

                        if (valueIndex === -1) {
                            return true;
                        }

                        return columnFilter.checked[valueIndex];
                    });

                    // Apply advanced filtering if active for this column
                    if (advancedFilters[columnName]) {
                        const filter = advancedFilters[columnName];

                        filteredData = filteredData.filter((row, rowIndex) => {
                            if (rowIndex < startIndex) return true;

                            const cellValue = row[i];

                            // Skip filtering if cell value is empty
                            if (cellValue === undefined || cellValue === null || cellValue === '') {
                                return true;
                            }

                            switch(columnType) {
                                case 'Date':
                                    const cellDate = new Date(cellValue);
                                    const filterDate = filter.value ? new Date(filter.value) : null;

                                    if (!filterDate || isNaN(cellDate.getTime())) return true;

                                    // Reset time components for accurate date comparison
                                    cellDate.setHours(0, 0, 0, 0);
                                    filterDate.setHours(0, 0, 0, 0);

                                    switch(filter.type) {
                                        case 'before':
                                            return cellDate <= filterDate;
                                        case 'after':
                                            return cellDate >= filterDate;
                                        case 'exact':
                                            return cellDate.getTime() === filterDate.getTime();
                                        default:
                                            return true;
                                    }

                                case 'Number':
                                    const cellNumber = parseFloat(cellValue);
                                    const filterNumber = parseFloat(filter.value);

                                    if (isNaN(filterNumber) || isNaN(cellNumber)) return true;

                                    switch(filter.type) {
                                        case 'bigger':
                                            return cellNumber >= filterNumber;
                                        case 'smaller':
                                            return cellNumber <= filterNumber;
                                        case 'exact':
                                            return cellNumber === filterNumber;
                                        default:
                                            return true;
                                    }

                                default:
                                    return true;
                            }
                        });
                    }
                }
            }
        }

        const hiddenColumnsData = filteredData.map(row =>
            row.filter((cell, index) => !hiddenColumns.has(sortedData[0][index]))
        );

        setFinalTableData(hiddenColumnsData);
    }, [
        sortedData,
        hiddenColumns,
        filterUniqueValuesDict,
        tableData,
        filterableColumns,
        tableHeader,
        advancedFilters,
        getColumnType
    ]);

    useEffect(() => {
            updateFinalTableData();
        },
        [hiddenColumns, sortConfig, filterUniqueValuesDict, advancedFilters, updateFinalTableData]
    );

    const hasActiveFilters = useCallback(() => {
        if (!filterUniqueValuesDict) return false;

        const hasBasicFilters = Object.keys(filterUniqueValuesDict).some(key =>
            filterUniqueValuesDict[key] &&
            filterUniqueValuesDict[key].checked &&
            filterUniqueValuesDict[key].checked.includes(false)
        );

        const hasAdvancedFilters = Object.keys(advancedFilters).length > 0;

        return hasBasicFilters || hasAdvancedFilters;
    }, [filterUniqueValuesDict, advancedFilters]);

    const resetAllFilters = useCallback(() => {
        // Reset basic filters
        const updatedFilters = {...filterUniqueValuesDict};
        Object.keys(updatedFilters).forEach(key => {
            if (updatedFilters[key] && updatedFilters[key].checked) {
                updatedFilters[key].checked = updatedFilters[key].checked.map(() => true);
            }
        });
        setFilterUniqueValuesDict(updatedFilters);

        // Reset advanced filters
        setAdvancedFilters({});
        setDateFilter({ type: 'exact', value: null });
        setNumberFilter({ type: 'exact', value: '' });
    }, [filterUniqueValuesDict]);

    // Function to apply advanced filter
    const applyAdvancedFilter = () => {
        if (!columnToFilterBasedOn) return;

        const columnType = getColumnType(columnToFilterBasedOn);
        let newFilter;

        switch (columnType) {
            case 'Date':
                newFilter = { ...dateFilter };
                break;
            case 'Number':
                newFilter = { ...numberFilter };
                break;
            default:
                return; // No advanced filters for text
        }

        // Only apply filter if it has a value
        if (newFilter.value) {
            setAdvancedFilters(prev => ({
                ...prev,
                [columnToFilterBasedOn]: newFilter
            }));
        }
    };

    // Function to clear advanced filter for current column
    const clearAdvancedFilter = () => {
        if (!columnToFilterBasedOn) return;

        setAdvancedFilters(prev => {
            const newFilters = {...prev};
            delete newFilters[columnToFilterBasedOn];
            return newFilters;
        });

        // Reset filter inputs
        setDateFilter({ type: 'exact', value: null });
        setNumberFilter({ type: 'exact', value: '' });
    };

    // Render filter control based on column type
    const renderFilterControl = () => {
        if (!columnToFilterBasedOn) return null;

        const columnType = getColumnType(columnToFilterBasedOn);
        const currentFilter = advancedFilters[columnToFilterBasedOn];

        switch (columnType) {
            case 'Date':
                return (
                    <div className="table-module-advanced-filter">
                        <h3>Date Filter</h3>
                        <div className="table-module-filter-controls">
                            <select
                                value={dateFilter.type}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="exact">Exact Date</option>
                                <option value="before">Before Date</option>
                                <option value="after">After Date</option>
                            </select>
                            <DatePicker
                                selected={dateFilter.value}
                                onChange={(date) => setDateFilter(prev => ({ ...prev, value: date }))}
                                dateFormat="yyyy/MM/dd"
                                placeholderText="Select a date"
                                className="table-module-date-picker"
                            />
                            <div className="table-module-filter-buttons">
                                <button onClick={applyAdvancedFilter} className="apply-filter">Apply Filter</button>
                                <button onClick={clearAdvancedFilter} className="clear-filter">Clear Filter</button>
                            </div>
                            {currentFilter && (
                                <div className="active-filter">
                                    <p>Active filter: {currentFilter.type} {currentFilter.value ? new Date(currentFilter.value).toLocaleDateString() : ''}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'Number':
                return (
                    <div className="table-module-advanced-filter">
                        <h3>Number Filter</h3>
                        <div className="table-module-filter-controls">
                            <select
                                value={numberFilter.type}
                                onChange={(e) => setNumberFilter(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="exact">Exact Value</option>
                                <option value="bigger">Greater Than or Equal</option>
                                <option value="smaller">Less Than or Equal</option>
                            </select>
                            <input
                                type="number"
                                value={numberFilter.value}
                                onChange={(e) => setNumberFilter(prev => ({ ...prev, value: e.target.value }))}
                                placeholder="Enter a number"
                                className="table-module-number-input"
                            />
                            <div className="table-module-filter-buttons">
                                <button onClick={applyAdvancedFilter} className="apply-filter">Apply Filter</button>
                                <button onClick={clearAdvancedFilter} className="clear-filter">Clear Filter</button>
                            </div>
                            {currentFilter && (
                                <div className="active-filter">
                                    <p>Active filter: {currentFilter.type} {currentFilter.value}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null; // Text type uses the existing filtering mechanism
        }
    };

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
                                                wordWrap: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'break-word' : 'normal',
                                                wrap: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'break-word' : 'normal',
                                                textWrap: columnsToWrap && columnsToWrap.includes(finalTableData[0][cellIndex]) ? 'wrap' : 'nowrap',
                                            }}>
                                                <h3 className={"compact-table-header-text"} lang={detectLang(cell)} onClick={() => requestSort(cellIndex)}>
                                                    {detectLink(cell)}{getSortIndicator(cellIndex)}
                                                </h3>
                                                {(filterableColumns && finalTableData[0] &&
                                                        ((Array.isArray(filterableColumns) && filterableColumns.includes(finalTableData[0][cellIndex])) ||
                                                            (!Array.isArray(filterableColumns) && Object.keys(filterableColumns).includes(finalTableData[0][cellIndex])))) &&
                                                    <FilterAltIcon onClick={() =>
                                                    {
                                                        setIsFilterPopupOpen(!isFilterPopupOpen);
                                                        setSearchQuery('');
                                                        setColumnToFilterBasedOn(finalTableData[0][cellIndex]);
                                                        setFilterMode('basic');
                                                        // Reset filter inputs when opening popup
                                                        setDateFilter({ type: 'exact', value: null });
                                                        setNumberFilter({ type: 'exact', value: '' });
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
                                                        ((Array.isArray(filterableColumns) && filterableColumns.includes(finalTableData[0][cellIndex])) ||
                                                            (!Array.isArray(filterableColumns) && Object.keys(filterableColumns).includes(finalTableData[0][cellIndex])))) &&
                                                    <FilterAltIcon onClick={() =>
                                                    {
                                                        setIsFilterPopupOpen(!isFilterPopupOpen);
                                                        setSearchQuery('');
                                                        setColumnToFilterBasedOn(finalTableData[0][cellIndex]);
                                                        setFilterMode('basic');
                                                        // Reset filter inputs when opening popup
                                                        setDateFilter({ type: 'exact', value: null });
                                                        setNumberFilter({ type: 'exact', value: '' });
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
                        {allowEditEntryOption && onEditEntry && rowIndex !== 0 && (
                            <td style={{ textAlign: 'center' }}>
                                <button
                                    onClick={() => onEditEntry(rowIndex)}
                                    aria-label="Edit row"
                                >
                                    Edit
                                </button>
                            </td>
                        )}
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
                        <h2>Filter Options: {columnToFilterBasedOn}</h2>

                        {/* Filter mode tabs */}
                        <div className="table-module-filter-tabs">
                            <button
                                className={filterMode === 'basic' ? 'active' : ''}
                                onClick={() => setFilterMode('basic')}
                            >
                                Basic Filter
                            </button>
                            {columnToFilterBasedOn && getColumnType(columnToFilterBasedOn) !== 'Text' && (
                                <button
                                    className={filterMode === 'advanced' ? 'active' : ''}
                                    onClick={() => setFilterMode('advanced')}
                                >
                                    Advanced Filter
                                </button>
                            )}
                        </div>

                        {/* Basic filter content */}
                        {filterMode === 'basic' && (
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
                        )}

                        {/* Advanced filter content */}
                        {filterMode === 'advanced' && renderFilterControl()}

                        <div className={"table-module-filter-popup-buttons-wrapper"}>
                            {filterMode === 'basic' && columnToFilterBasedOn && filterUniqueValuesDict[columnToFilterBasedOn] && (
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
    // Updated to support both the old array format and new object format
    filterableColumns: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.objectOf(PropTypes.oneOf(['Text', 'Date', 'Number']))
    ]),
    headerModuleElements: PropTypes.array,
    onDeleteEntry: PropTypes.func,
    allowDeleteEntryOption: PropTypes.bool,
    onEditEntry: PropTypes.func,
    allowEditEntryOption: PropTypes.bool,
    columnsToWrap: PropTypes.arrayOf(PropTypes.string),
};

export default Table;