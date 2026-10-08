import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import api from "../api/axios";
import PageHeader from "../components/UI/PageHeader";
import FormModal from "../components/UI/FormModal";

function Profile() {
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // LOAD PROFILE
  // =========================

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/v1/auth/me");

      setProfile(response.data);

      setFormData({
        name: response.data.name,
        email: response.data.email,
      });
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // =========================
  // PROFILE FORM
  // =========================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setError("");
    setSuccess("");

    setFormData({
      name: profile.name,
      email: profile.email,
    });

    setEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
    });

    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        "/api/v1/auth/me",
        formData
      );

      setProfile(response.data.user);

      setFormData({
        name: response.data.user.name,
        email: response.data.user.email,
      });

      setEditing(false);

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // PASSWORD FORM
  // =========================

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Check that both new passwords match
    if (
      passwordData.new_password !==
      passwordData.confirm_password
    ) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await api.put(
        "/api/v1/auth/change-password",
        {
          current_password:
            passwordData.current_password,

          new_password:
            passwordData.new_password,
        }
      );

      // Clear password fields
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      // Reset password visibility
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      // Close modal
      setShowPasswordForm(false);

      setSuccess(
        "Password changed successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setShowPasswordForm(false);

    setError("");
    setSuccess("");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader
          title="Profile"
          description="Manage your profile information."
        />

        <p>Loading profile...</p>
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="page-container">

      <PageHeader
        title="Profile"
        description="Manage your profile information."
      />

      {/* Error */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Success */}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {profile && (
        <>

          {/* =========================
              ACCOUNT INFORMATION
              ========================= */}

          <div className="profile-card">

            <div className="profile-card-header">

              <div>
                <h2>
                  Account Information
                </h2>

                <p>
                  Your InfraVault account details
                </p>
              </div>

            </div>

            <div className="profile-grid">

              {/* Name */}

              <div className="profile-field">

                <label>
                  Name
                </label>

                <div className="profile-value">
                  {profile.name}
                </div>

              </div>

              {/* Email */}

              <div className="profile-field">

                <label>
                  Email
                </label>

                <div className="profile-value">
                  {profile.email}
                </div>

              </div>

              {/* Role */}

              <div className="profile-field">

                <label>
                  Role
                </label>

                <div className="profile-value">
                  {profile.role}
                </div>

              </div>

              {/* Status */}

              <div className="profile-field">

                <label>
                  Status
                </label>

                <div className="profile-value">

                  <span
                    className={`status-badge ${
                      profile.is_active
                        ? "status-active"
                        : "status-inactive"
                    }`}
                  >
                    {profile.is_active
                      ? "● Active"
                      : "● Inactive"}
                  </span>

                </div>

              </div>

            </div>

            {/* Actions */}

            <div className="profile-actions">

              <button
                type="button"
                className="primary-button"
                onClick={handleEdit}
              >
                Edit Profile
              </button>

            </div>

          </div>

          {/* =========================
              SECURITY
              ========================= */}

          <div className="profile-card">

            <div className="profile-card-header">

              <div>

                <h2>
                  Security
                </h2>

                <p>
                  Manage your account password
                </p>

              </div>

            </div>

            {/* Security Row */}

            <div className="security-row">

              <div>

                <strong>
                  Password
                </strong>

                <p>
                  Change your account password
                </p>

              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setError("");
                  setSuccess("");

                  setPasswordData({
                    current_password: "",
                    new_password: "",
                    confirm_password: "",
                  });

                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);

                  setShowPasswordForm(true);
                }}
              >
                Change Password
              </button>

            </div>

          </div>

          {/* =========================
              EDIT PROFILE MODAL
              ========================= */}

          {editing && (
            <FormModal
              title="Edit Profile"
              subtitle="Update your profile information"
              onClose={handleCancel}
              onSubmit={handleSubmit}
              saving={saving}
              submitText="Save Changes"
              savingText="Saving..."
            >
              <div className="form-grid">

                {/* Name */}

                <div className="form-group">

                  <label htmlFor="profile-name">
                    Name
                  </label>

                  <input
                    id="profile-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* Email */}

                <div className="form-group">

                  <label htmlFor="profile-email">
                    Email
                  </label>

                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>


          {/* Role */}

          <div className="form-group">

            <label htmlFor="profile-role">
              Role
            </label>

            <input
              id="profile-role"
              type="text"
              value={profile.role}
              readOnly
            />

          </div>

          {/* Status */}

          <div className="form-group">

            <label htmlFor="profile-status">
              Status
            </label>

            <input
              id="profile-status"
              type="text"
              value={
                profile.is_active
                  ? "Active"
                  : "Inactive"
              }
              readOnly
            />

          </div>

              </div>
            </FormModal>
          )}

          {/* =========================
              CHANGE PASSWORD MODAL
              ========================= */}

          {showPasswordForm && (
            <FormModal
              title="Change Password"
              subtitle="Update your InfraVault account password"
              onClose={handlePasswordCancel}
              onSubmit={handlePasswordSubmit}
              saving={changingPassword}
              submitText="Change Password"
              savingText="Changing..."
            >
              <div className="form-grid">

                {/* Current Password */}

                <div className="form-group full-width">

                  <label htmlFor="current-password">
                    Current Password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="current-password"
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      name="current_password"
                      value={
                        passwordData.current_password
                      }
                      onChange={
                        handlePasswordChange
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowCurrentPassword(
                          (previous) => !previous
                        )
                      }
                      disabled={changingPassword}
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
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

                {/* New Password */}

                <div className="form-group full-width">

                  <label htmlFor="new-password">
                    New Password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="new-password"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      name="new_password"
                      value={
                        passwordData.new_password
                      }
                      onChange={
                        handlePasswordChange
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          (previous) => !previous
                        )
                      }
                      disabled={changingPassword}
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
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

                {/* Confirm New Password */}

                <div className="form-group full-width">

                  <label htmlFor="confirm-password">
                    Confirm New Password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirm_password"
                      value={
                        passwordData.confirm_password
                      }
                      onChange={
                        handlePasswordChange
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
                      disabled={changingPassword}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>

              </div>
            </FormModal>
          )}

        </>
      )}

    </div>
  );
}

export default Profile;