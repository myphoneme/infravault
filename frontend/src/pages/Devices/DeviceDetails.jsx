import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

function DeviceDetails() {
  const { deviceId } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDevice();
  }, [deviceId]);

  const fetchDevice = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/devices/${deviceId}`);

      setDevice(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to load device"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
  return (
    <div className="device-page">
      <div className="device-loading">
        <div className="loading-spinner"></div>
        <span>Loading device...</span>
      </div>
    </div>
  );
}

  if (error) {
    return (
      <div>
        <p className="error-message">{error}</p>

        <button
          className="secondary-button"
          onClick={() => navigate("/devices")}
        >
          Back to Devices
        </button>
      </div>
    );
  }

  if (!device) {
    return <h2>Device not found</h2>;
  }

  return (
    <div className="device-page">

      <div className="page-header">

        <div>
          <h1>{device.device_name}</h1>

          <p>
            Device details and connection information
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/devices")}
        >
          ←
        </button>

      </div>

      <div className="table-card">

        <table>
          <tbody>

            <tr>
              <th>ID</th>
              <td>{device.id}</td>
            </tr>

            <tr>
              <th>Device Name</th>
              <td>{device.device_name}</td>
            </tr>

            <tr>
              <th>Host</th>
              <td>{device.host}</td>
            </tr>

            <tr>
              <th>Port</th>
              <td>{device.port}</td>
            </tr>

            <tr>
              <th>Connection Type</th>
              <td>{device.connection_type}</td>
            </tr>

            <tr>
              <th>Username</th>
              <td>{device.username}</td>
            </tr>

            <tr>
              <th>Password</th>
                <td>
                  {device.password ? (
                   <span>{device.password}</span>
                  ) : (
                    <span>••••••••</span>
                  )}
                </td>
            </tr>

            <tr>
              <th>Status</th>
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
            </tr>

            <tr>
              <th>Device Status</th>
              <td>
                <span
                   className={`condition-${device.device_condition
                   ?.toLowerCase()
                   .replaceAll(" ", "-")}`}
           >
                  {device.device_condition || "-"}
                </span>
             </td>
            </tr>

            <tr>
              <th>Comments</th>
              <td>{device.comments || "-"}</td>
            </tr>

            <tr>
              <th>Created At</th>
              <td>{device.created_at}</td>
            </tr>

            <tr>
              <th>Updated At</th>
              <td>{device.updated_at}</td>
            </tr>

          </tbody>
        </table>

      </div>

    </div>
  );
}

export default DeviceDetails;