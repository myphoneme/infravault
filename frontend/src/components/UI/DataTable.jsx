import "./DataTable.css";

const DataTable = ({
  columns,
  data,
  emptyMessage = "No records found.",
  renderCell,
  rowKey = "id",
}) => {
  if (data.length === 0) {
    return (
      <div className="data-table-card">
        <p className="data-table-empty">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-card">
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr key={row[rowKey]}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {renderCell
                      ? renderCell(row, column)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;