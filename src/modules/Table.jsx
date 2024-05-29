import PropTypes from "prop-types";
import '../styles/Table.css';

function  Table({tableHeader, tableData, numCols}) {


    return (
        <div className="table-module">
            <table className="table-module-table" >
                {tableHeader && <tr><th colSpan={numCols}><h1>{tableHeader}</h1></th></tr>}

                {tableData.map((row, rowIndex) => {
                    return (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => {
                                return <td key={cellIndex}>{rowIndex === 0 ? <h2>{cell}</h2> : <p>{cell}</p>}</td>
                            })}
                        </tr>
                    );
                })}


            </table>
        </div>
    );
}

Table.propTypes = {
    tableHeader: PropTypes.string,
    tableData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
    numCols: PropTypes.number
};

export default Table;