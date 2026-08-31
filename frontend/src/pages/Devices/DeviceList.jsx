function DeviceList({ devices, onEdit, onDelete, onView }) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Device Name</th>
            <th>Host</th>
            <th>Port</th>
            <th>Connection</th>
            <th>Username</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {devices.length === 0 ? (
            <tr>
              <td colSpan="8">
                No devices found.
              </td>
            </tr>
          ) : (
            devices.map((device) => (
              <tr key={device.id}>
                <td>{device.id}</td>

                <td>{device.device_name}</td>

                <td>{device.host}</td>

                <td>{device.port}</td>

                <td>{device.connection_type}</td>

                <td>{device.username}</td>

                <td>
                  <span
                    className={
                      device.device_status === "Active"
                        ? "status-active"
                        : "status-inactive"
                    }
                  >
                    {device.device_status}
                  </span>
                </td>

                <td>
                  <div className="action-buttons">
                  <button
                    className="view-button"
                    onClick={() => onView(device)}
                  >
                    View
                  </button>

                  <button
                    className="edit-button"
                    onClick={() => onEdit(device)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => onDelete(device.id)}
                  >
                    Delete
                  </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DeviceList;