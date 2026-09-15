import { useEffect, useState } from "react";

import { createPortal } from "react-dom";
import api from "../api/axios";

import SummaryCard from "../components/UI/SummaryCard";
import SummaryCards from "../components/UI/SummaryCards";
import SearchFilterBar from "../components/UI/SearchFilterBar";
import PageHeader from "../components/UI/PageHeader";

import DeviceList from "./Devices/DeviceList";
import DeviceForm from "./Devices/DeviceForm";

import {
  Server,
  CircleCheck,
  CirclePause,
  RadioTower,
  WifiOff,
  Power,
  PackageOpen,
} from "lucide-react";

function Devices() {


  const [devices, setDevices] = useState([]);

  const [deviceSummary, setDeviceSummary] = useState({
  total_devices: 0,
  active_devices: 0,
  inactive_devices: 0,
  reachable_devices: 0,
  unreachable_devices: 0,
  switched_off_devices: 0,
  unused_devices: 0,
});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingDevice, setViewingDevice] = useState(null);

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
const [deviceConditionFilter, setDeviceConditionFilter] = useState("");

const totalDevices = pagination.total;

const activeDevices = devices.filter(
  (device) => device.device_status === "Active"
).length;

const inactiveDevices = devices.filter(
  (device) => device.device_status === "Inactive"
).length;

const reachableDevices = devices.filter(
  (device) => device.device_condition === "Reachable"
).length;

const unreachableDevices = devices.filter(
  (device) => device.device_condition === "Unreachable"
).length;

const switchedOffDevices = devices.filter(
  (device) => device.device_condition === "Switched Off"
).length;

const unusedDevices = devices.filter(
  (device) => device.device_condition === "Unused"
).length;

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
    device_condition: "Unused",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  

  useEffect(() => {
    fetchDevices();
    fetchDeviceSummary();
  }, []);

  // =========================
  // GET DEVICES
  // =========================
  
 const fetchDeviceSummary = async () => {
  try {
    const response = await api.get("/devices/summary");

    setDeviceSummary(response.data);
  } catch (err) {
    console.error("Failed to load device summary:", err);
  }
};

  const fetchDevices = async (
  page = 1,
  searchValue = search,
  statusValue = statusFilter,
  conditionValue = deviceConditionFilter
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
        device_condition: conditionValue || undefined,
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

    // Confirm password validation
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.post("/devices/", formData);

      setSuccess("Device created successfully");

      resetForm();
      setConfirmPassword("");

      await fetchDevices();
      await fetchDeviceSummary();
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
      device_condition: device.device_condition || "Unused",
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
      await fetchDeviceSummary();
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

  const handleViewDevice = async (deviceId) => {
  try {
    setError("");

    const response = await api.get(`/devices/${deviceId}`);

    setViewingDevice(response.data);
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to load device details"
    );
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
      await fetchDeviceSummary();
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
  setConfirmPassword("");

  setFormData({
    device_name: "",
    host: "",
    port: 22,
    connection_type: "SSH",
    username: "",
    password: "",
    comments: "",
    device_status: "Active",
    device_condition: "Unused",
  });

  setShowForm(true);
};

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setShowForm(false);
    setEditingDevice(null);
    setConfirmPassword("");

    setFormData({
      device_name: "",
      host: "",
      port: 22,
      connection_type: "SSH",
      username: "",
      password: "",
    
      comments: "",
      device_status: "Active",
      device_condition: "Unused",
    });
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
  return (
    <div className="page-container">
      <div className="device-loading">
        <div className="loading-spinner"></div>
        <span>Loading devices...</span>
      </div>
    </div>
  );
}

const deviceViewModal = viewingDevice && (
  <div
    className="modal-overlay"
    onClick={() => setViewingDevice(null)}
  >
    <div
      className="device-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-header">
        <div>
          <h2>Device Details</h2>
          <p>View device information</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setViewingDevice(null)}
        >
          ×
        </button>
      </div>
    <div className="view-modal-body">
      <div className="form-grid">
        <div className="form-group">
          <label>ID</label>
          <div className="view-value">
            {viewingDevice.id ?? "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Device Name</label>
          <div className="view-value">
            {viewingDevice.device_name || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Host</label>
          <div className="view-value">
            {viewingDevice.host || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Port</label>
          <div className="view-value">
            {viewingDevice.port ?? "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Connection Type</label>
          <div className="view-value">
            {viewingDevice.connection_type || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Username</label>
          <div className="view-value">
            {viewingDevice.username || "—"}
          </div>
        </div>

        <div className="form-group">
         <label>Password</label>
         <div className="view-value">
         {viewingDevice.password || "—"}
         </div>
        </div>

        <div className="form-group">
          <label>Status</label>
          <div className="view-value">
            {viewingDevice.device_status || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Device Status</label>
          <div className="view-value">
            {viewingDevice.device_condition || "—"}
          </div>
        </div>

        <div className="form-group full-width">
          <label>Comments</label>
          <div className="view-value multiline">
            {viewingDevice.comments || "—"}
          </div>
        
        
        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setViewingDevice(null)}
          >
            Close
          </button>
        </div>

      </div>
      </div>
    </div>  
    </div>
  </div>
);

  // =========================
  // PAGE
  // =========================

  return (
    <div className="page-container">

      {/* HEADER */}

      <PageHeader
         title="Device Management"
         description="Manage your infrastructure devices."
         actionLabel="+ Add Device"
         onAction={handleAdd}
      />


{/* DEVICE SUMMARY */}

<SummaryCards>

  <SummaryCard
    title="Total Devices"
    value={deviceSummary.total_devices}
    icon={Server}
    variant="primary"
  />

  <SummaryCard
    title="Active"
    value={deviceSummary.active_devices}
    icon={CircleCheck}
    variant="success"
  />

  <SummaryCard
    title="Inactive"
    value={deviceSummary.inactive_devices}
    icon={CirclePause}
    variant="warning"
  />

  <SummaryCard
    title="Reachable"
    value={deviceSummary.reachable_devices}
    icon={RadioTower}
    variant="success"
  />

  <SummaryCard
    title="Unreachable"
    value={deviceSummary.unreachable_devices}
    icon={WifiOff}
    variant="danger"
  />

  <SummaryCard
    title="Switched Off"
    value={deviceSummary.switched_off_devices}
    icon={Power}
    variant="warning"
  />

  <SummaryCard
    title="Unused"
    value={deviceSummary.unused_devices}
    icon={PackageOpen}
    variant="info"
  />

</SummaryCards>




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
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
        />
      )}

      {/* FILTERS */}

<SearchFilterBar
  search={{
    value: search,
    onChange: setSearch,
    placeholder: "Search by device name",
  }}
  filters={[
    {
      key: "status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "", label: "All Status" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
    {
      key: "condition",
      value: deviceConditionFilter,
      onChange: setDeviceConditionFilter,
      options: [
        { value: "", label: "All Device Status" },
        { value: "Reachable", label: "Reachable" },
        { value: "Unreachable", label: "Unreachable" },
        { value: "Switched Off", label: "Switched Off" },
        { value: "Unused", label: "Unused" },
      ],
    },
  ]}
  onSearch={() => fetchDevices(1)}
  onClear={() => {
    setSearch("");
    setStatusFilter("");
    setDeviceConditionFilter("");
    fetchDevices(1, "", "");
  }}
/>


      {/* DEVICE LIST */}

      <DeviceList
        devices={devices}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(device) => handleViewDevice(device.id)}
          
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
{viewingDevice &&
  createPortal(deviceViewModal, document.body)}

    </div>
  );
}

export default Devices;