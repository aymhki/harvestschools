import {useEffect, useState, useMemo} from "react";
import PropTypes from "prop-types";
import '../styles/Table.css';
import { animated, useSpring } from 'react-spring';
import FilterAltIcon from '@mui/icons-material/FilterAlt';


function Table({ tableHeader, tableData, numCols, sortConfigParam, scrollable, compact, allowHideColumns, defaultHiddenColumns, allowExport, exportFileName, filterableColumns }) {
    const [sortConfig, setSortConfig] = useState(sortConfigParam ? sortConfigParam : { column: null, direction: 'neutral' });
    const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns || []));
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
    const [columnToFilter, setColumnToFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
            if (a[sortConfig.column] < b[sortConfig.column]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.column] > b[sortConfig.column]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        };

        // Only sort the part of the array we want
        const sortedSection = sorted.slice(startIndex).sort(compare);
        return sorted.slice(0, startIndex).concat(sortedSection);
    }, [tableData, sortConfig, tableHeader]);

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
                return <p className={"table-link"}
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
                            const visibleData = sortedData.map((row) => row.filter((_, index) => !hiddenColumns.has(sortedData[0][index])));
                            const csv = visibleData.map(row =>
                                row.map(field =>
                                    typeof field === 'string' && field.includes(',') ? `"${field}"` : field.includes(', ') ? `"${field}"` : field.includes('\n') ? `"${field}"` : field.includes('\r') ? `"${field}"` : field.includes('\r\n') ? `"${field}"` : field.includes('\n\r') ? `"${field}"` : field
                                ).join(',')
                            ).join('\n');
                            const blob = new Blob([csv], {type: 'text/csv'});
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${exportFileName ? exportFileName : 'table'}-${new Date().toISOString().split('T')[0]}-${new Date().toLocaleTimeString().replace(/:/g, '-')}.csv`;
                            a.click();
                            window.URL.revokeObjectURL(url);

                        }}

                        >
                            Export to CSV
                        </button>
                    )}
                </div>


            </div>
            <table className={`${scrollable ? 'table-module-table-scrollable' : 'table-module-table'}`}
            style={{
                marginTop: `${(allowExport || allowHideColumns) ? (isMobile ? '10rem' : '10rem') : '0'}`,
            }}
            >

                <tbody>
                {tableHeader && <tr>
                    <th colSpan={numCols}><h1>{tableHeader}</h1></th>
                </tr>}
                {sortedData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                            !hiddenColumns.has(sortedData[0][cellIndex]) && (
                                <td key={cellIndex} onClick={() => rowIndex === 0 ? requestSort(cellIndex) : null}
                                    style={{
                                        cursor: rowIndex === 0 ? 'pointer' : 'default',
                                        whiteSpace: `${(scrollable && rowIndex === 0) ? 'nowrap' : 'normal'}`,
                                    }}

                                >
                                    {rowIndex === (tableHeader ? 0 : 0) ? (
                                        <>
                                            {compact ? (
                                                <h3 className={"compact-table-header-text"}>
                                                    {detectLink(cell)}{getSortIndicator(cellIndex)} {(filterableColumns && filterableColumns.includes(sortedData[0][cellIndex])) &&
                                                    <FilterAltIcon onClick={() => {
                                                        setIsFilterPopupOpen(!isFilterPopupOpen);
                                                        setColumnToFilter(cellIndex);
                                                    }}/>}
                                                </h3>

                                            ) : (
                                                <h2>
                                                    {detectLink(cell)}{getSortIndicator(cellIndex)} {(filterableColumns && filterableColumns.includes(sortedData[0][cellIndex])) &&
                                                    <FilterAltIcon onClick={() => {
                                                        setIsFilterPopupOpen(!isFilterPopupOpen);
                                                        setColumnToFilter(cellIndex);
                                                    }}/>}
                                                </h2>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {compact ? (
                                                <p
                                                    className={"compact-table-cell-text"}
                                                >
                                                    {detectLink(cell)}
                                                </p>
                                            ) : (
                                                <p>
                                                    {detectLink(cell)}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </td>
                            )
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
                <div className={"table-module-filter-popup-background"} onClick={() => setIsFilterPopupOpen(false)}/>
                <div className={"table-module-filter-popup"}>
                    {/*
                            This should be very similar to excel filter options in the since that it should have the following:
                            // A checkbox list of all the unique values in the column
                            // A search bar to search for specific values
                            // A button to close the filter popup
                            // A button to uncheck all checkboxes
                            // A button to check all checkboxes

                            // if the column is of type date or number then allow the user to set a range accordingly
                        */}

                    <div className={"table-module-filter-popup-content"}>
                        <h2>Filter Options</h2>
                        <div>
                            <h3>Unique Values</h3>
                            <input
                                type="text"
                                placeholder={"Search"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            <div className={"table-module-filter-popup-values-list"}>
                                {
                                    /*
                                    * Should have a list of checkboxes with the unique values of the column
                                    * Should all be checked by default unless a filter is already applied
                                    * Should be able to check and uncheck all checkboxes
                                    * Should be able to clear all filters
                                    * */

                                    // TODO: Implement the above
                                }

                            </div>
                        </div>
                        <div>
                            <button
                                // TODO: Implement the clear filters functionality
                            >Check All</button>
                            <button
                                // TODO: Implement the clear all rows functionality
                            >Uncheck All</button>
                            <button onClick={() => setIsFilterPopupOpen(false)}>Close</button>
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
