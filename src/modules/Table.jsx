import {useEffect, useMemo, useState, useCallback, Fragment} from "react";
import PropTypes from "prop-types";
import '../styles/Table.css';
import {animated, useSpring} from 'react-spring';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';


function Table({ tableHeader, tableData, numCols, sortConfigParam, scrollable, compact, allowHideColumns, defaultHiddenColumns, allowExport, exportFileName, filterableColumns, headerModuleElements, onDeleteEntry, allowDeleteEntryOption }) {
    const [sortConfig, setSortConfig] = useState(sortConfigParam ? sortConfigParam : { column: null, direction: 'neutral' });
    const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns || []));
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
    const [columnToFilterBasedOn, setColumnToFilterBasedOn] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');


    const [columnType, setColumnType] = useState(null); // 'date', 'number', 'text'
    const [dateFilterOption, setDateFilterOption] = useState('exact'); // 'exact', 'before', 'after'
    const [selectedDate, setSelectedDate] = useState(null);
    const [numberFilterOption, setNumberFilterOption] = useState('exact'); // 'exact', 'greater', 'less'
    const [filterNumber, setFilterNumber] = useState('');
    const [textFilterOption, setTextFilterOption] = useState('contains'); // 'contains', 'startsWith', 'endsWith', 'regex'
    const [textFilterValue, setTextFilterValue] = useState('');



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


    // Add this function to detect column type
    const detectColumnType = (columnName) => {
        // Get all values for this column excluding the header
        const startIndex = tableHeader ? 2 : 1;
        const columnIndex = tableData[0].indexOf(columnName);
        const values = tableData.slice(startIndex).map(row => row[columnIndex]);

        // Check if most values match date format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const dateCount = values.filter(val => dateRegex.test(val)).length;

        // Check if most values are numbers
        const numberRegex = /^-?\d+(\.\d+)?%?$/;
        const numberCount = values.filter(val => numberRegex.test(val)).length;

        // Determine the majority type
        if (dateCount > values.length * 0.5) {
            return 'date';
        } else if (numberCount > values.length * 0.5) {
            return 'number';
        } else {
            return 'text';
        }
    };

    // Add this function to apply dynamic filtering
    const applyDynamicFilter = () => {
        let filteredData = [...sortedData];
        const startIndex = tableHeader ? 2 : 1;

        for (let i = 0; i < tableData[0].length; i++) {
            if (filterableColumns && filterableColumns.includes(tableData[0][i])) {
                // If we're using checkboxes filter method
                if (filterUniqueValuesDict[tableData[0][i]].checked) {
                    filteredData = filteredData.filter((row, rowIndex) =>
                        rowIndex < startIndex ||
                        filterUniqueValuesDict[tableData[0][i]].checked[
                            filterUniqueValuesDict[tableData[0][i]].uniqueValues.indexOf(row[i])
                            ]
                    );
                }

                // If we're using dynamic filter for this column
                if (tableData[0][i] === columnToFilterBasedOn) {
                    const colIndex = tableData[0].indexOf(columnToFilterBasedOn);

                    // Apply date filtering
                    if (columnType === 'date' && selectedDate) {
                        const selectedDateObj = new Date(selectedDate);

                        filteredData = filteredData.filter((row, rowIndex) => {
                            if (rowIndex < startIndex) return true;

                            const cellDate = new Date(row[colIndex]);

                            if (dateFilterOption === 'exact') {
                                return cellDate.toISOString().split('T')[0] === selectedDateObj.toISOString().split('T')[0];
                            } else if (dateFilterOption === 'before') {
                                return cellDate <= selectedDateObj;
                            } else if (dateFilterOption === 'after') {
                                return cellDate >= selectedDateObj;
                            }
                            return true;
                        });
                    }

                    // Apply number filtering
                    else if (columnType === 'number' && filterNumber !== '') {
                        const numValue = parseFloat(filterNumber);

                        filteredData = filteredData.filter((row, rowIndex) => {
                            if (rowIndex < startIndex) return true;

                            // Remove percentage sign if exists and convert to number
                            const cellValue = parseFloat(row[colIndex].replace('%', ''));

                            if (numberFilterOption === 'exact') {
                                return cellValue === numValue;
                            } else if (numberFilterOption === 'greater') {
                                return cellValue >= numValue;
                            } else if (numberFilterOption === 'less') {
                                return cellValue <= numValue;
                            }
                            return true;
                        });
                    }

                    // Apply text filtering
                    else if (columnType === 'text' && textFilterValue !== '') {
                        filteredData = filteredData.filter((row, rowIndex) => {
                            if (rowIndex < startIndex) return true;

                            const cellText = row[colIndex].toString().toLowerCase();
                            const filterText = textFilterValue.toLowerCase();

                            if (textFilterOption === 'contains') {
                                return cellText.includes(filterText);
                            } else if (textFilterOption === 'startsWith') {
                                return cellText.startsWith(filterText);
                            } else if (textFilterOption === 'endsWith') {
                                return cellText.endsWith(filterText);
                            } else if (textFilterOption === 'regex') {
                                try {
                                    const regex = new RegExp(textFilterValue);
                                    return regex.test(row[colIndex]);
                                } catch (e) {
                                    return true; // Invalid regex
                                }
                            }
                            return true;
                        });
                    }
                }
            }
        }

        // Hide columns as needed
        let hiddenColumnsData = filteredData.map(row =>
            row.filter((cell, index) => !hiddenColumns.has(sortedData[0][index]))
        );

        setFinalTableData(hiddenColumnsData);
    };

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

    // Replace the updateFinalTableData function with this one
    const updateFinalTableData = useCallback(() => {
        applyDynamicFilter();
    }, [sortedData, hiddenColumns, filterUniqueValuesDict, tableData, filterableColumns,
        columnToFilterBasedOn, columnType, dateFilterOption, selectedDate,
        numberFilterOption, filterNumber, textFilterOption, textFilterValue]);

    useEffect(() => {
            updateFinalTableData();
        },
        [hiddenColumns, sortConfig, updateFinalTableData]
    );

    // Modify the existing filter icon click handler
    const handleFilterIconClick = (columnName) => {
        setIsFilterPopupOpen(!isFilterPopupOpen);
        setSearchQuery('');
        setColumnToFilterBasedOn(columnName);

        // Reset dynamic filter values
        setSelectedDate(null);
        setFilterNumber('');
        setTextFilterValue('');

        // Detect column type
        const type = detectColumnType(columnName);
        setColumnType(type);
    };


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

                                                        <FilterAltIcon onClick={() => handleFilterIconClick(finalTableData[0][cellIndex])} />
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

                                                        <FilterAltIcon onClick={() => handleFilterIconClick(finalTableData[0][cellIndex])} />
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

            {/* Replace the existing filter popup content with this */}
            <animated.div className={"table-module-filter-popup-container"} style={popupAnimation}>
                <div className={"table-module-filter-popup-background"} onClick={() => {
                    setIsFilterPopupOpen(false);
                    setSearchQuery('');
                }}/>
                <div className={"table-module-filter-popup"}>
                    <div className={"table-module-filter-popup-content"}>
                        <h2>Filter {columnToFilterBasedOn}</h2>

                        {/* Dynamic Filter Options */}
                        {columnType === 'date' && (
                            <div className="filter-date-section">
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Date Filter</FormLabel>
                                    <RadioGroup
                                        value={dateFilterOption}
                                        onChange={(e) => setDateFilterOption(e.target.value)}
                                    >
                                        <FormControlLabel value="exact" control={<Radio />} label="Exact Date" />
                                        <FormControlLabel value="before" control={<Radio />} label="Before Date" />
                                        <FormControlLabel value="after" control={<Radio />} label="After Date" />
                                    </RadioGroup>
                                </FormControl>

                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Select Date"
                                        value={selectedDate}
                                        onChange={(newDate) => setSelectedDate(newDate)}
                                        renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                                    />
                                </LocalizationProvider>

                                <div className="filter-buttons">
                                    <button onClick={() => {
                                        applyDynamicFilter();
                                        setIsFilterPopupOpen(false);
                                    }}>Apply Filter</button>
                                    <button onClick={() => {
                                        setSelectedDate(null);
                                        applyDynamicFilter();
                                    }}>Clear Date Filter</button>
                                </div>
                            </div>
                        )}

                        {columnType === 'number' && (
                            <div className="filter-number-section">
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Number Filter</FormLabel>
                                    <RadioGroup
                                        value={numberFilterOption}
                                        onChange={(e) => setNumberFilterOption(e.target.value)}
                                    >
                                        <FormControlLabel value="exact" control={<Radio />} label="Equal To" />
                                        <FormControlLabel value="greater" control={<Radio />} label="Greater Than or Equal" />
                                        <FormControlLabel value="less" control={<Radio />} label="Less Than or Equal" />
                                    </RadioGroup>
                                </FormControl>

                                <TextField
                                    label="Enter Number"
                                    type="number"
                                    value={filterNumber}
                                    onChange={(e) => setFilterNumber(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                />

                                <div className="filter-buttons">
                                    <button onClick={() => {
                                        applyDynamicFilter();
                                        setIsFilterPopupOpen(false);
                                    }}>Apply Filter</button>
                                    <button onClick={() => {
                                        setFilterNumber('');
                                        applyDynamicFilter();
                                    }}>Clear Number Filter</button>
                                </div>
                            </div>
                        )}

                        {columnType === 'text' && (
                            <div className="filter-text-section">
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Text Filter</FormLabel>
                                    <RadioGroup
                                        value={textFilterOption}
                                        onChange={(e) => setTextFilterOption(e.target.value)}
                                    >
                                        <FormControlLabel value="contains" control={<Radio />} label="Contains" />
                                        <FormControlLabel value="startsWith" control={<Radio />} label="Starts With" />
                                        <FormControlLabel value="endsWith" control={<Radio />} label="Ends With" />
                                        <FormControlLabel value="regex" control={<Radio />} label="Regular Expression" />
                                    </RadioGroup>
                                </FormControl>

                                <TextField
                                    label="Search Text"
                                    value={textFilterValue}
                                    onChange={(e) => setTextFilterValue(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <div className="filter-buttons">
                                    <button onClick={() => {
                                        applyDynamicFilter();
                                        setIsFilterPopupOpen(false);
                                    }}>Apply Filter</button>
                                    <button onClick={() => {
                                        setTextFilterValue('');
                                        applyDynamicFilter();
                                    }}>Clear Text Filter</button>
                                </div>
                            </div>
                        )}

                        {/* Original Unique Values Filter Section */}
                        <div>
                            <h3>Filter by Unique Values</h3>
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
                                    setSelectedDate(null);
                                    setFilterNumber('');
                                    setTextFilterValue('');
                                    applyDynamicFilter();
                                }}
                            >Reset All Filters
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
    headerModuleElements: PropTypes.array,
    onDeleteEntry: PropTypes.func,
    allowDeleteEntryOption: PropTypes.bool,
};

export default Table;
