
import { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";

function ChangeDevicePasswordForm({
  device,
  onClose,
  onChanged,
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
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
        `/devices/${device.id}/password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        }
      );

      if (onChanged) {
        await onChanged();
      }

      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to change device password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const modal = (
    <div
      className="modal-overlay notification-record-modal"
      onClick={() => {
        if (!changingPassword) {
          onClose();
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
              Update password for {device.device_name}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={changingPassword}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="view-modal-body">
            <div className="form-grid">

              <div className="form-group full-width">
                <label>Current Password</label>

                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
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
                      setShowCurrentPassword((previous) => !previous)
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

              <div className="form-group full-width">
                <label>New Password</label>

                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
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
                      setShowNewPassword((previous) => !previous)
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

              <div className="form-group full-width">
                <label>Confirm New Password</label>

                <div className="password-input-wrapper">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(event) =>
                      setConfirmNewPassword(event.target.value)
                    }
                    required
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmNewPassword((previous) => !previous)
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
              onClick={onClose}
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

  return createPortal(modal, document.body);
}

export default ChangeDevicePasswordForm;