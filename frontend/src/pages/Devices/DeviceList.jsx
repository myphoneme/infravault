import DataTable from "../../components/UI/DataTable";

function DeviceList({ devices, onEdit, onDelete, onView }) {
  const columns = [
    { key: "id", label: "ID" },
    { key: "device_name", label: "Device Name" },
    { key: "host", label: "Host" },
    { key: "port", label: "Port" },
    { key: "connection_type", label: "Connection" },
    { key: "username", label: "Username" },
    { key: "device_status", label: "Status" },
    { key: "device_condition", label: "Device Status" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <DataTable
      columns={columns}
      data={devices}
      emptyMessage="No devices found."
      renderCell={(device, column) => {
        if (column.key === "device_status") {
          return (
            <span
              className={
                device.device_status === "Active"
                  ? "status-active"
                  : "status-inactive"
              }
            >
              {device.device_status}
            </span>
          );
        }

        if (column.key === "device_condition") {
          return (
            <span
              className={
                device.device_condition === "Reachable"
                  ? "condition-reachable"
                  : device.device_condition === "Unreachable"
                    ? "condition-unreachable"
                    : device.device_condition === "Switched Off"
                      ? "condition-switched-off"
                      : "condition-unused"
              }
            >
              {device.device_condition}
            </span>
          );
        }

        if (column.key === "actions") {
          return (
            <div className="action-buttons">
              <button
                type="button"
                className="view-button"
                onClick={() => onView(device)}
              >
                View
              </button>

              <button
                type="button"
                className="edit-button"
                onClick={() => onEdit(device)}
              >
                Edit
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={() => onDelete(device.id)}
              >
                Delete
              </button>
            </div>
          );
        }

        return device[column.key];
      }}
    />
  );
}

export default DeviceList;