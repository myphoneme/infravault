import { useEffect, useState } from "react";
import api from "../../api/axios";
import DeviceForm from "../../pages/Devices/DeviceForm";

const initialFormData = {
  device_name: "",
  host: "",
  port: 22,
  connection_type: "SSH",
  username: "",
  password: "",
  device_category_id: "",
  password_rotation_days: "",
  comments: "",
  device_status: "Active",
  device_condition: "Unused",
};

function UpdateDeviceForm({
  deviceId,
  onClose,
  onUpdated,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [editingDevice, setEditingDevice] = useState(null);

  const [deviceCategories, setDeviceCategories] = useState([]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load the selected device first so the form can open
  // without waiting for the categories request.
  useEffect(() => {
    if (!deviceId) return;

    const loadDevice = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/devices/${deviceId}`
        );

        const device = response.data;

        setEditingDevice(device);

        setFormData({
          device_name: device.device_name || "",
          host: device.host || "",
          port: device.port ?? 22,
          connection_type:
            device.connection_type || "SSH",
          username: device.username || "",
          password: "",
          device_category_id:
            device.device_category_id ?? "",
          password_rotation_days:
            device.password_rotation_days ?? "",
          comments: device.comments || "",
          device_status:
            device.device_status || "Active",
          device_condition:
            device.device_condition || "Unused",
        });

        setLoading(false);

        // Load categories in the background.
        const categoriesResponse = await api.get("/device-categories/", {
            params: {
                page: 1,
                limit: 1000,
            },
            });

            setDeviceCategories(
            Array.isArray(categoriesResponse.data.data)
                ? categoriesResponse.data.data
                : []
            );
            } catch (err) {
                console.error(err);

                setError(
                err.response?.data?.detail ||
                    "Failed to load device details"
                );
            } finally {
                setLoading(false);
            }
            };

            loadDevice();
        }, [deviceId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "port" ||
        name === "password_rotation_days"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingDevice) return;

    try {
      setSaving(true);
      setError("");

      await api.put(
        `/devices/${editingDevice.id}`,
        formData
      );

      if (onUpdated) {
        await onUpdated();
      }

      onClose();
    } catch (err) {
      console.error(err);

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg || "Validation error")
            .join(", ")
        );
      } else {
        setError(
          detail || "Failed to update device"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !editingDevice) {
    return (
      <div className="modal-overlay notification-record-modal">
        <div className="form-modal">
          <div className="form-modal-header">
            <h2>Update Device</h2>
          </div>

          <p>Loading device...</p>
        </div>
      </div>
    );
  }

  if (!editingDevice) {
    return null;
  }

  return (
    <>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <DeviceForm
        formData={formData}
        editingDevice={editingDevice}
        saving={saving}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={onClose}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        deviceCategories={deviceCategories}
        modalClassName="notification-record-modal"
      />
    </>
  );
}

export default UpdateDeviceForm;