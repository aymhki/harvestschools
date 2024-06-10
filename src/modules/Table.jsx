import React, { useState } from "react";
import PropTypes from "prop-types";
import '../styles/Table.css';

function Table({ tableHeader, tableData, numCols, sortConfigParam }) {
    const [sortConfig, setSortConfig] = useState(sortConfigParam ? sortConfigParam : { column: null, direction: 'neutral' });

    const sortedData = React.useMemo(() => {
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

    return (
        <div className="table-module">
            <table className="table-module-table">
                <tbody>
                {tableHeader && <tr><th colSpan={numCols}><h1>{tableHeader}</h1></th></tr>}
                {sortedData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} onClick={() => rowIndex=== 0 ? requestSort(cellIndex) : null}
                                style={{
                                    cursor: rowIndex === 0 ? 'pointer' : 'default',

                                }}
                            >
                                {rowIndex === (tableHeader ? 0 : 0) ? (
                                    <h2>{cell}{getSortIndicator(cellIndex)}</h2>
                                ) : (
                                    <p>{cell}</p>
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
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
    })
};

export default Table;
