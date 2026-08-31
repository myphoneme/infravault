import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import DeviceList from "./Devices/DeviceList";
import DeviceForm from "./Devices/DeviceForm";

function Devices() {
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
});

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    device_name: "",
    host: "",
    port: 22,
    connection_type: "SSH",
    username: "",
    password: "",
    comments: "",
    device_status: "Active",
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  // =========================
  // GET DEVICES
  // =========================

  const fetchDevices = async (
  page = 1,
  searchValue = search,
  statusValue = statusFilter
) => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/devices/", {
      params: {
        page,
        limit: 20,
        search: searchValue || undefined,
        device_status: statusValue || undefined,
      },
    });

    setDevices(response.data.data);
    setPagination(response.data.pagination);
    setCurrentPage(page);

  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to load devices"
    );
  } finally {
    setLoading(false);
  }
};

  // =========================
  // FORM INPUT
  // =========================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "port" ? Number(value) : value,
    }));
  };

  // =========================
  // CREATE DEVICE
  // =========================

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.post("/devices/", formData);

      setSuccess("Device created successfully");

      resetForm();
      await fetchDevices();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to create device"
      );
    }finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT DEVICE
  // =========================

  const handleEdit = (device) => {
    setEditingDevice(device);

    setFormData({
      device_name: device.device_name,
      host: device.host,
      port: device.port,
      connection_type: device.connection_type,
      username: device.username,
      password: "",
      comments: device.comments || "",
      device_status: device.device_status,
    });

    setShowForm(true);
  };

  // =========================
  // UPDATE DEVICE
  // =========================

  const handleUpdate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.put(
        `/devices/${editingDevice.id}`,
        formData
      );

      setSuccess("Device updated successfully");

      resetForm();
      await fetchDevices();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to update device"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE DEVICE
  // =========================

  const handleDelete = async (deviceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this device?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await api.delete(`/devices/${deviceId}`);

      setSuccess("Device deleted successfully");

      await fetchDevices();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to delete device"
      );
    }
  };

  const handleAdd = () => {
  setEditingDevice(null);

  setFormData({
    device_name: "",
    host: "",
    port: 22,
    connection_type: "SSH",
    username: "",
    password: "",
    comments: "",
    device_status: "Active",
  });

  setShowForm(true);
};

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setShowForm(false);
    setEditingDevice(null);

    setFormData({
      device_name: "",
      host: "",
      port: 22,
      connection_type: "SSH",
      username: "",
      password: "",
      comments: "",
      device_status: "Active",
    });
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return <h2>Loading devices...</h2>;
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="device-page">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <h1>Device Management</h1>
          <p>
            Manage your infrastructure devices.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleAdd}
>
          + Add Device
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* SUCCESS */}


      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
      
      {/* FORM */}

      {showForm && (
        <DeviceForm
          formData={formData}
          editingDevice={editingDevice}
          saving={saving}
          onChange={handleChange}
          onSubmit={
            editingDevice
              ? handleUpdate
              : handleCreate
          }
          onCancel={resetForm}
        />
      )}

      {/* FILTERS */}

<div className="device-filters">

  <input
    type="text"
    placeholder="Search by device name"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="">All Status</option>
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
  </select>

  <button
    type="button"
    onClick={() => fetchDevices(1)}
  >
    Search
  </button>

  <button
    type="button"
    onClick={() => {
      setSearch("");
      setStatusFilter("");
      fetchDevices(1, "", "");
    }}
  >
    Clear
  </button>

</div>

      {/* DEVICE LIST */}

      <DeviceList
        devices={devices}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(device) =>
          navigate(`/devices/${device.id}`)
        }
      />

      {/* PAGINATION */}

<div className="pagination-controls">

  <button
    type="button"
    onClick={() =>
      fetchDevices(currentPage - 1)
    }
    disabled={!pagination.has_previous}
  >
    Previous
  </button>

  <span>
    Page {pagination.page} of {pagination.total_pages}
  </span>

  <button
    type="button"
    onClick={() =>
      fetchDevices(currentPage + 1)
    }
    disabled={!pagination.has_next}
  >
    Next
  </button>

</div>


    </div>
  );
}

export default Devices;