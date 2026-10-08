import { useEffect,useMemo,useRef, useState } from "react";

import { createPortal } from "react-dom";
import api from "../api/axios";

import SummaryCard from "../components/UI/SummaryCard";
import SummaryCards from "../components/UI/SummaryCards";
import SearchFilterBar from "../components/UI/SearchFilterBar";
import PageHeader from "../components/UI/PageHeader";
import Pagination from "../components/UI/Pagination";

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
  Eye,
  EyeOff
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
  const [changingPasswordDevice, setChangingPasswordDevice] = useState(null);
const [newPassword, setNewPassword] = useState("");
const [currentPassword, setCurrentPassword] = useState("");
const [confirmNewPassword, setConfirmNewPassword] = useState("");
const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

const [changingPassword, setChangingPassword] = useState(false); 

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
const [deviceCategories, setDeviceCategories] = useState([]);
const [dashboardHighlight, setDashboardHighlight] = useState(false);
const devicesTableRef = useRef(null);

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
    device_category_id: "",
    password_rotation_days: "",
    comments: "",
    device_status: "Active",
    device_condition: "Unused",
  });

  const [confirmPassword, setConfirmPassword] = useState("");


const handleChangePassword = (device) => {
  setChangingPasswordDevice(device);

  setCurrentPassword("");
  setNewPassword("");
  setConfirmNewPassword("");

  setShowCurrentPassword(false);
  setShowNewPassword(false);
  setShowConfirmNewPassword(false);

  setError("");
  setSuccess("");
};
  

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const dashboardMode =
      params.get("dashboard") === "true";

    if (dashboardMode) {
      setDashboardHighlight(true);

      fetchDevices(1, "", "", "");

      setTimeout(() => {
        devicesTableRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    } else {
      fetchDevices(1, search, statusFilter);
    }

    fetchDeviceSummary();
    fetchDeviceCategories();
  }, []);

  useEffect(() => {
    if (!dashboardHighlight) {
      return;
    }

    const handleFirstClick = () => {
      setDashboardHighlight(false);
    };

    document.addEventListener("click", handleFirstClick, {
      once: true,
    });

    return () => {
      document.removeEventListener("click", handleFirstClick);
    };
  }, [dashboardHighlight]);

 

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
        limit: 90,
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

const filteredDevices = useMemo(() => {
  const value = search.trim().toLowerCase();

  return devices.filter((device) => {
    const matchesSearch =
      !value ||
      device.device_name?.toLowerCase().includes(value);

    const matchesStatus =
      !statusFilter ||
      device.device_status === statusFilter;

    const matchesCondition =
      !deviceConditionFilter ||
      device.device_condition === deviceConditionFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCondition
    );
  });
}, [
  devices,
  search,
  statusFilter,
  deviceConditionFilter,
]);

const fetchDeviceCategories = async () => {
  try {
    const response = await api.get("/device-categories/", {
      params: {
        page: 1,
        limit: 1000, // load all categories for dropdowns
      },
    });

    setDeviceCategories(
      Array.isArray(response.data.data)
        ? response.data.data
        : []
    );
  } catch (err) {
    console.error("Failed to load device categories:", err);
  }
};




  // =========================
  // FORM INPUT
  // =========================

  const handleChange = (event) => {
  const { name, value } = event.target;

  setFormData((previous) => ({
    ...previous,
    [name]:
      name === "port" || name === "password_rotation_days"
        ? value === ""
          ? null
          : Number(value)
        : value,
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
      device_category_id: device.device_category_id,
      password_rotation_days: device.password_rotation_days ?? "",
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

        const detail = err.response?.data?.detail;

        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item) => item.msg || "Validation error")
              .join(", ")
          );
        } else {
          setError(detail || "Failed to update device");
        }

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
    device_category_id: "",
    password_rotation_days: "",
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
      device_category_id: "",
      password_rotation_days: "",
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
            <label>Device Category</label>
            <div className="view-value">
              {deviceCategories.find(
                (category) =>
                  String(category.id) ===
                  String(viewingDevice.device_category_id)
              )?.category_name || "—"}
            </div>
          </div>

          <div className="form-group">
            <label>Password Rotation Days</label>
            <div className="view-value">
              {viewingDevice.password_rotation_days
                ? `${viewingDevice.password_rotation_days} Days`
                : `${
                    deviceCategories.find(
                   (category) =>
                   String(category.id) ===
                   String(viewingDevice.device_category_id)
                 )?.default_rotation_days ?? "—"
                } Days`}
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
 
// ========
// CHANGE PASSWORD MODAL 
//


const changePasswordModal = changingPasswordDevice && (
  <div
    className="modal-overlay"
    onClick={() => {
      if (!changingPassword) {
        setChangingPasswordDevice(null);
      }
    }}
  >
    <div
      className="form-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-header">
        <div>
          <h2>Change Password</h2>
          <p>
            Update password for{" "}
            {changingPasswordDevice.device_name}
          </p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setChangingPasswordDevice(null)}
          disabled={changingPassword}
        >
          ×
        </button>
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          if (!currentPassword) {
            setError("Please enter the current password.");
            return;
          }

          if (!newPassword) {
            setError("Please enter a new password.");
            return;
          }

          if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match.");
            return;
          }

          try {
            setChangingPassword(true);
            setError("");

            await api.patch(
              `/devices/${changingPasswordDevice.id}/password`,
              {
                current_password: currentPassword,
                new_password: newPassword,
              }
            );

            setSuccess("Password changed successfully.");

            setChangingPasswordDevice(null);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");

            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmNewPassword(false);
          } catch (err) {
            console.error(err);

            setError(
              err.response?.data?.detail ||
                "Failed to change device password"
            );
          } finally {
            setChangingPassword(false);
          }
        }}
      >
        <div className="view-modal-body">
          <div className="form-grid">

            {/* CURRENT PASSWORD */}
            <div className="form-group full-width">
              <label>Current Password</label>

              <div className="password-input-wrapper">
                <input
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowCurrentPassword(
                      (previous) => !previous
                    )
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="form-group full-width">
              <label>New Password</label>

              <div className="password-input-wrapper">
                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  required
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowNewPassword(
                      (previous) => !previous
                    )
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM NEW PASSWORD */}
            <div className="form-group full-width">
              <label>Confirm New Password</label>

              <div className="password-input-wrapper">
                <input
                  type={
                    showConfirmNewPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmNewPassword}
                  onChange={(event) =>
                    setConfirmNewPassword(
                      event.target.value
                    )
                  }
                  required
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmNewPassword(
                      (previous) => !previous
                    )
                  }
                >
                  {showConfirmNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {confirmNewPassword &&
                newPassword !== confirmNewPassword && (
                  <small className="password-error">
                    Passwords do not match.
                  </small>
                )}
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setChangingPasswordDevice(null)
            }
            disabled={changingPassword}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={changingPassword}
          >
            {changingPassword
              ? "Changing..."
              : "Change Password"}
          </button>
        </div>
      </form>
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
    deviceCategories={deviceCategories}
  />
)}


<div className="app-content-card">
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
  onSearch={() => fetchDevices(1,"","","")}
  onClear={() => {
    setSearch("");
    setStatusFilter("");
    setDeviceConditionFilter("");
    fetchDevices(1, "", "","");
  }}
/>


      {/* DEVICE LIST */}

      <div
        ref={devicesTableRef}
        className={
          dashboardHighlight
            ? "dashboard-table-highlight"
            : ""
        }
      >
        <DeviceList
          devices={filteredDevices}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(device) => handleViewDevice(device.id)}
          onChangePassword={handleChangePassword}
        />
      </div>

      {/* PAGINATION */}

<div className="app-pagination-card">
  <Pagination
    currentPage={pagination.page}
    totalPages={pagination.total_pages}
    totalItems={pagination.total}
    itemsPerPage={pagination.limit}
    onPageChange={fetchDevices}
  />
</div>

</div>

{viewingDevice &&
  createPortal(deviceViewModal, document.body)}

{changingPasswordDevice &&
  createPortal(changePasswordModal, document.body)}

    </div>
  );
}

export default Devices;