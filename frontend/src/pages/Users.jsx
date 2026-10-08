import { useEffect, useMemo, useState } from "react";
import {
  UsersRound,
  UserRoundCheck,
  UserRoundX,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react";
import api from "../api/axios";

import SummaryCard from "../components/UI/SummaryCard";
import SummaryCards from "../components/UI/SummaryCards";
import SearchFilterBar from "../components/UI/SearchFilterBar";
import DataTable from "../components/UI/DataTable";
import PageHeader from "../components/UI/PageHeader";
import ActionButtons from "../components/UI/ActionButtons";
import FormModal from "../components/UI/FormModal";
import Pagination from "../components/UI/Pagination";

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

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [userSummary, setUserSummary] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
  });

  /*
   * ---------------------------------------------------------
   * LOAD USERS
   * ---------------------------------------------------------
   */

  const loadUsers = async (
    page = 1,
    filters = {
      search,
      roleFilter,
      statusFilter,
    }
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: page,
        limit: 90,
      };

      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }

      if (filters.roleFilter) {
        params.role = filters.roleFilter;
      }

      if (filters.statusFilter) {
        params.is_active =
          filters.statusFilter === "active";
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


  const filteredUsers = useMemo(() => {
  const value = search.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      !value ||
      user.name?.toLowerCase().includes(value) ||
      user.email?.toLowerCase().includes(value);

    const matchesRole =
      !roleFilter || user.role === roleFilter;

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });
}, [users, search, roleFilter, statusFilter]);

  /*
   * ---------------------------------------------------------
   * LOAD USER SUMMARY
   * ---------------------------------------------------------
   */

  const loadUserSummary = async () => {
    try {
      const response = await api.get("/users/summary");

      setUserSummary(response.data);
    } catch (err) {
      console.error(
        "Failed to load user summary:",
        err
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    loadUsers();
    loadUserSummary();
  }, []);






  /*
   * ---------------------------------------------------------
   * RESET FORM
   * ---------------------------------------------------------
   */

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "USER",
    });

    setConfirmPassword("");

    setShowPassword(false);
    setShowConfirmPassword(false);

    setEditingUser(null);
    setShowForm(false);

    setError("");
  };

  /*
   * ---------------------------------------------------------
   * FORM CHANGE
   * ---------------------------------------------------------
   */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * ---------------------------------------------------------
   * CREATE / UPDATE USER
   * ---------------------------------------------------------
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");

      /*
       * Confirm Password validation
       */
      if (
        formData.password ||
        confirmPassword
      ) {
        if (
          formData.password !== confirmPassword
        ) {
          setError(
            "Password and Confirm Password do not match."
          );
          return;
        }
      }

      /*
       * Create / Update
       *
       * confirmPassword is NOT sent to backend.
       */
      if (editingUser) {
        await api.put(
          `/users/${editingUser.id}`,
          formData
        );
      } else {
        await api.post(
          "/users/",
          formData
        );
      }

      resetForm();

      await loadUsers(
        editingUser ? currentPage : 1
      );

      await loadUserSummary();
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

  /*
   * ---------------------------------------------------------
   * EDIT USER
   * ---------------------------------------------------------
   */

  const handleEdit = (user) => {
    setEditingUser(user);

    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });

    /*
     * Password fields must start empty
     * when editing.
     */
    setConfirmPassword("");

    setShowPassword(false);
    setShowConfirmPassword(false);

    setError("");
    setShowForm(true);
  };

  /*
   * ---------------------------------------------------------
   * ACTIVATE / DEACTIVATE USER
   * ---------------------------------------------------------
   */

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
          is_active: newStatus,
        }
      );

      await loadUsers(currentPage);

      await loadUserSummary();
    } catch (err) {
      console.error(err);

      const detail =
        err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Failed to update user status"
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  const handleSearch = () => {
    loadUsers(1, {
      search,
      roleFilter,
      statusFilter,
    });
  };

  /*
   * ---------------------------------------------------------
   * CLEAR FILTERS
   * ---------------------------------------------------------
   */

  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");

    loadUsers(1, {
      search: "",
      roleFilter: "",
      statusFilter: "",
    });
  };

  /*
   * ---------------------------------------------------------
   * ADD USER
   * ---------------------------------------------------------
   */

  const handleAddUser = () => {
    setEditingUser(null);

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "USER",
    });

    setConfirmPassword("");

    setShowPassword(false);
    setShowConfirmPassword(false);

    setError("");
    setShowForm(true);
  };

  /*
   * ---------------------------------------------------------
   * JSX
   * ---------------------------------------------------------
   */

  return (
    <div className="page-container">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        title="User Management"
        description="Manage InfraVault users"
        actionLabel="+ Add User"
        onAction={handleAddUser}
      />

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


    {/*=================== Summary Cards ===================*/}

<SummaryCards>

  <SummaryCard
    title="Total Users"
    value={userSummary.total_users}
    icon={UsersRound}
    variant="primary"
  />

  <SummaryCard
    title="Active Users"
    value={userSummary.active_users}
    icon={UserRoundCheck}
    variant="success"
  />

  <SummaryCard
    title="Inactive Users"
    value={userSummary.inactive_users}
    icon={UserRoundX}
    variant="warning"
  />

  <SummaryCard
  title="Total Admins"
  value={userSummary.total_admins}
  icon={ShieldCheck}
  variant="info"
  />

</SummaryCards>


      {/* =====================================================
          USER FORM MODAL
      ====================================================== */}
{showForm && (
  <FormModal
    title={editingUser ? "Edit User" : "Add User"}
    subtitle={
      editingUser
        ? "Update user information"
        : "Create a new InfraVault user"
    }
    onClose={resetForm}
    onSubmit={handleSubmit}
    submitText={
      editingUser
        ? "Update User"
        : "Create User"
    }
  >
    <div className="form-grid">

      {/* NAME */}

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

      {/* EMAIL */}

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

      {/* PASSWORD */}

      <div className="form-group">
        <label htmlFor="password">
          Password
        </label>

        <div className="password-input-wrapper">
          <input
            id="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
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

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowPassword(
                (previous) => !previous
              )
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>
      </div>

      {/* CONFIRM PASSWORD */}

      <div className="form-group">
        <label htmlFor="confirmPassword">
          Confirm Password
        </label>

        <div className="password-input-wrapper">
          <input
            id="confirmPassword"
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            placeholder={
              editingUser
                ? "Confirm new password"
                : "Confirm password"
            }
            required={!editingUser}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowConfirmPassword(
                (previous) => !previous
              )
            }
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
          >
            {showConfirmPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>
      </div>

      {/* ROLE */}

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
  </FormModal>
)}
      
        
    

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && (
        <p>Loading users...</p>
      )}

      {/* =====================================================
          USERS CONTENT
      ====================================================== */}

      {!loading && (
        <>

{/* =================================================
    SEARCH & FILTER BAR
================================================== */}
<div className="app-content-card">

     <SearchFilterBar
  search={{
    value: search,
    onChange: setSearch,
    placeholder: "Search by name or email",
  }}
  filters={[
    {
      key: "role",
      value: roleFilter,
      onChange: setRoleFilter,
      options: [
        { value: "", label: "All Roles" },
        { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
        { value: "ADMIN", label: "ADMIN" },
        { value: "USER", label: "USER" },
      ],
    },
    {
      key: "status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ]}
  onSearch={()=>{}}
  onClear={handleClearFilters}
/>

         {/* =================================================
    USER TABLE
================================================== */}

<DataTable
  columns={[
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ]}
  data={filteredUsers}
  emptyMessage="No users found."
  renderCell={(user, column) => {
    if (column.key === "status") {
      return (
        <span
          className={
            user.is_active
              ? "status-active"
              : "status-inactive"
          }
        >
          {user.is_active ? "Active" : "Inactive"}
        </span>
      );
    }

if (column.key === "actions") {
  return (
    <ActionButtons
      onEdit={() => handleEdit(user)}
      onActivate={
        !user.is_active
          ? () => handleStatusChange(user)
          : undefined
      }
      onDeactivate={
        user.is_active
          ? () => handleStatusChange(user)
          : undefined
      }
    />
  );
}

    return user[column.key];
  }}
/>


          {/* =================================================
              PAGINATION
          ================================================== */}

          <div className="app-pagination-card">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={loadUsers}
            />
          </div>
          </div>

        </>
      )}

    </div>
  );
}

export default Users;