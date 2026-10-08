import DataTable from "../../components/UI/DataTable";
import ActionButtons from "../../components/UI/ActionButtons"

function DeviceList({ devices, onEdit, onDelete, onView ,onChangePassword}) {
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
                  : ""
              }
              style={{ display: "inline-block", textAlign: "center", minWidth: "60px" }}
              
            >
              {device.device_status==="Inactive"
              ? "-"
              : device.device_status}
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
    <ActionButtons
      onView={() => onView(device)}
      onEdit={() => onEdit(device)}
      onDelete={() => onDelete(device.id)}
       onChangePassword={() => onChangePassword(device)}
    />
  );
}

        return device[column.key];
      }}
    />
  );
}

export default DeviceList;