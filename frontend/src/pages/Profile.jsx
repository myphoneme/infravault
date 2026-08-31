import { useEffect, useState } from "react";
import api from "../api/axios";

function Profile() {
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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

    setShowPasswordForm(false);

    setError("");
    setSuccess("");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="profile-page">
        <h1>Profile</h1>
        <p>Loading profile...</p>
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="profile-page">

      {/* Page Header */}

      <div className="page-header">
        <div>
          <h1>Profile</h1>

          <p>
            Manage your account information
          </p>
        </div>
      </div>


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


            {!editing ? (

              <>
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

              </>

            ) : (

              <form onSubmit={handleSubmit}>

                <div className="profile-grid">

                  {/* Name */}

                  <div className="profile-field">

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

                  <div className="profile-field">

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


                {/* Edit Actions */}

                <div className="profile-actions">

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>


                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

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
                  setShowPasswordForm(true);
                }}
              >
                Change Password
              </button>

            </div>

          </div>


          {/* =========================
              CHANGE PASSWORD MODAL
              ========================= */}

          {showPasswordForm && (

            <div
              className="password-modal-overlay"
              onClick={handlePasswordCancel}
            >

              <div
                className="password-modal"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                {/* Modal Header */}

                <div className="password-modal-header">

                  <div>

                    <h2>
                      Change Password
                    </h2>

                    <p>
                      Update your InfraVault
                      account password
                    </p>

                  </div>


                  <button
                    type="button"
                    className="modal-close-button"
                    onClick={handlePasswordCancel}
                    aria-label="Close"
                  >
                    ×
                  </button>

                </div>


                {/* Password Form */}

                <form
                  onSubmit={handlePasswordSubmit}
                >

                  <div className="password-form">

                    {/* Current Password */}

                    <div className="profile-field">

                      <label htmlFor="current-password">
                        Current Password
                      </label>

                      <input
                        id="current-password"
                        type="password"
                        name="current_password"
                        value={
                          passwordData.current_password
                        }
                        onChange={
                          handlePasswordChange
                        }
                        required
                      />

                    </div>


                    {/* New Password */}

                    <div className="profile-field">

                      <label htmlFor="new-password">
                        New Password
                      </label>

                      <input
                        id="new-password"
                        type="password"
                        name="new_password"
                        value={
                          passwordData.new_password
                        }
                        onChange={
                          handlePasswordChange
                        }
                        required
                      />

                    </div>


                    {/* Confirm Password */}

                    <div className="profile-field">

                      <label htmlFor="confirm-password">
                        Confirm New Password
                      </label>

                      <input
                        id="confirm-password"
                        type="password"
                        name="confirm_password"
                        value={
                          passwordData.confirm_password
                        }
                        onChange={
                          handlePasswordChange
                        }
                        required
                      />

                    </div>

                  </div>


                  {/* Modal Actions */}

                  <div className="profile-actions">

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={changingPassword}
                    >
                      {changingPassword
                        ? "Changing..."
                        : "Change Password"}
                    </button>


                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        handlePasswordCancel
                      }
                      disabled={changingPassword}
                    >
                      Cancel
                    </button>

                  </div>

                </form>

              </div>

            </div>

          )}

        </>
      )}

    </div>
  );
}

export default Profile;