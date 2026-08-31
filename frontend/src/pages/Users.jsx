import { useEffect, useState } from "react";
import api from "../api/axios";

function Users() {
  const [users, setUsers] = useState([]);
  
  const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

const loadUsers = async (page = 1) => {
  try {
    setLoading(true);
    setError("");

    const params = {
      page: page,
      limit: 20,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (roleFilter) {
      params.role = roleFilter;
    }

    if (statusFilter) {
      params.is_active = statusFilter === "active";
    }

    const response = await api.get("/users/", {
      params,
    });

    setUsers(response.data.data);
    setPagination(response.data.pagination);
    setCurrentPage(page);

  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to load users"
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "USER",
    });

    setEditingUser(null);
    setShowForm(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");

      if (editingUser) {
        await api.put(
          `/users/${editingUser.id}`,
          formData
        );
      } else {
        await api.post("/users/", formData);
      }

      resetForm();
      await loadUsers();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        (
          editingUser
            ? "Failed to update user"
            : "Failed to create user"
        )
      );
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);

    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });

    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/users/${userId}`);

      await loadUsers();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to delete user"
      );
    }
  };

  const handleStatusChange = async (user) => {
    const newStatus = !user.is_active;

    const action = newStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this user?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.patch(
        `/api/v1/users/${user.id}/status`,
        { 
          is_active: newStatus
        }
      );

      await loadUsers();
    } catch (err) {
        console.error(err);

        const detail = err.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Failed to update user status"
          );
      }
  };

  return (
    <div className="user-page">

      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage InfraVault users</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingUser(null);

              setFormData({
                name: "",
                email: "",
                password: "",
                role: "USER",
              });

              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">

          <div className="user-modal">

            <div className="modal-header">

              <div>
                <h2>
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h2>

                <p>
                  {editingUser
                    ? "Update user information"
                    : "Create a new InfraVault user"}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={resetForm}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                <div className="form-group">
                  <label htmlFor="name">
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      editingUser
                        ? "Enter new password"
                        : "Enter password"
                    }
                    required={!editingUser}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">
                    Role
                  </label>

                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="USER">
                      USER
                    </option>

                    <option value="ADMIN">
                      ADMIN
                    </option>

                    <option value="SUPER_ADMIN">
                      SUPER_ADMIN
                    </option>
                  </select>
                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingUser
                    ? "Update User"
                    : "Create User"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {loading && (
        <p>Loading users...</p>
      )}

      {!loading && (
  <>
    <div className="user-filters">

      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        <option value="">All Roles</option>
        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        <option value="ADMIN">ADMIN</option>
        <option value="USER">USER</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button
        type="button"
        onClick={() => loadUsers(1)}
      >
        Search
      </button>

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setRoleFilter("");
          setStatusFilter("");
          loadUsers(1);
        }}
      >
        Clear
      </button>

    </div>

    <div className="table-card">

      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {users.length === 0 ? (
            <tr>
              <td colSpan="6">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>

                <td>
                  {user.id}
                </td>

                <td>
                  {user.name}
                </td>

                <td>
                  {user.email}
                </td>

                <td>
                  {user.role}
                </td>

                <td>
                  <span
                    className={
                      user.is_active
                        ? "status-active"
                        : "status-inactive"
                    }
                  >
                    {user.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td>
                  <div className="action-buttons">

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className={
                        user.is_active
                          ? "deactivate-button"
                          : "activate-button"
                      }
                      onClick={() =>
                        handleStatusChange(user)
                      }
                    >
                      {user.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        handleDelete(user.id)
                      }
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

    {/* Pagination */}

    <div className="pagination-controls">

      <button
        type="button"
        onClick={() => loadUsers(currentPage - 1)}
        disabled={!pagination.has_previous}
      >
        Previous
      </button>

      <span>
        Page {pagination.page} of {pagination.total_pages}
      </span>

      <button
        type="button"
        onClick={() => loadUsers(currentPage + 1)}
        disabled={!pagination.has_next}
      >
        Next
      </button>

    </div>

  </>
)}
</div>

  );
}
export default Users;