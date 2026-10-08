import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import FormModal from "../../components/UI/FormModal";
import SearchableSelect from "../../components/UI/SearchableSelect";

function DeviceForm({
  formData,
  editingDevice,
  saving,
  onChange,
  onSubmit,
  onCancel,
  confirmPassword,
  setConfirmPassword,
  deviceCategories,
  modalClassName = "",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const modal = (
    <FormModal
      title={editingDevice ? "Edit Device" : "Create Device"}
      subtitle={
        editingDevice
          ? "Update device information"
          : "Add a new infrastructure device"
      }
      modalClassName={modalClassName}
      onClose={onCancel}
      onSubmit={onSubmit}
      saving={saving}
      submitText={editingDevice ? "Update Device" : "Create Device"}
      savingText={editingDevice ? "Updating..." : "Creating..."}
    >
      <div className="form-grid">
        <div className="form-group">
          <label>Device Name</label>
          <input
            type="text"
            name="device_name"
            value={formData.device_name}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Host</label>
          <input
            type="text"
            name="host"
            value={formData.host}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Port</label>
          <input
            type="number"
            name="port"
            value={formData.port}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Connection Type</label>
          <select
            name="connection_type"
            value={formData.connection_type}
            onChange={onChange}
          >
            <option value="SSH">SSH</option>
            <option value="RDP">RDP</option>
            <option value="FTP">FTP</option>
            <option value="SFTP">SFTP</option>
            <option value="HTTP">HTTP</option>
            <option value="HTTPS">HTTPS</option>
          </select>
        </div>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Device Category</label>

          <SearchableSelect
            value={formData.device_category_id}
            onChange={(value) =>
              onChange({
                target: {
                  name: "device_category_id",
                  value,
                },
              })
            }
            options={deviceCategories}
            placeholder="Select Category"
            searchPlaceholder="Search device category..."
            getOptionValue={(option) => option.id}
            getOptionLabel={(option) => option.category_name}
          />
        </div>

        <div className="form-group">
          <label>Password Rotation Days</label>

          <select
            name="password_rotation_days"
            value={formData.password_rotation_days ?? ""}
            onChange={onChange}
          >
            <option value="">Use Category Default</option>
            <option value="90">90 Days</option>
            <option value="180">180 Days</option>
            <option value="270">270 Days</option>
            <option value="360">360 Days</option>
          </select>
        </div>

        <div className="form-group">
          <label>Password</label>

          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={onChange}
              required={!editingDevice}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {!editingDevice && (
          <div className="form-group">
            <label>Confirm Password</label>

            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {confirmPassword &&
              formData.password !== confirmPassword && (
                <small className="password-error">
                  Passwords do not match.
                </small>
              )}
          </div>
        )}

        <div className="form-group">
          <label>Status</label>

          <select
            name="device_status"
            value={formData.device_status}
            onChange={onChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="form-group">
          <label>Device Status</label>

          <select
            name="device_condition"
            value={formData.device_condition}
            onChange={onChange}
          >
            <option value="Reachable">Reachable</option>
            <option value="Unreachable">Unreachable</option>
            <option value="Switched Off">Switched Off</option>
            <option value="Unused">Unused</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Comments</label>

          <textarea
            name="comments"
            value={formData.comments}
            onChange={onChange}
            rows="3"
          />
        </div>
      </div>
    </FormModal>
  );

  return createPortal(modal, document.body);
}

export default DeviceForm;