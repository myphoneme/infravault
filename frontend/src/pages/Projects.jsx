import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";

import SummaryCard from "../components/UI/SummaryCard";
import SummaryCards from "../components/UI/SummaryCards";
import SearchFilterBar from "../components/UI/SearchFilterBar";
import PageHeader from "../components/UI/PageHeader";

import ProjectList from "./Projects/ProjectList";
import ProjectForm from "./Projects/ProjectForm";



import {
  FolderKanban,
  Clock3,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function Projects() {


  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingProject, setViewingProject] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [currentAssignedUser, setCurrentAssignedUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  

  const [projectSummary, setProjectSummary] = useState({
  total_projects: 0,
  pending_projects: 0,
  completed_projects: 0,
  overdue_projects: 0,
});

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
const [saving, setSaving] = useState(false);
const [showForm, setShowForm] = useState(false);
const [editingProject, setEditingProject] = useState(null);

const [devices, setDevices] = useState([]);

const [formData, setFormData] = useState({
  project_name: "",
  repo_name: "",
  start_date: "",
  deadline: "",
  assigned_to: "",
  comments: "",
  device_master_id: "",
  project_path: "",
  deployment_script_path: "",
  tech_stack: "",
  project_status: "Pending",
});

  useEffect(() => {
    fetchProjects();
    fetchDevices();
    loadProjectSummary();
    loadUsers();
    loadAllUsers();
  }, []);

  const fetchProjects = async (
  page = 1,
  searchValue = search,
  statusValue = statusFilter
) => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/projects/", {
      params: {
        page,
        limit: 20,
        search: searchValue || undefined,
        project_status: statusValue || undefined,
      },
    });

    setProjects(response.data.data);
    setPagination(response.data.pagination);
    setCurrentPage(page);

  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to load projects"
    );
  } finally {
    setLoading(false);
  }
};


const loadProjectSummary = async () => {
  try {
    const response = await api.get("/dashboard/summary");

    setProjectSummary({
      total_projects: response.data.projects.total,
      pending_projects: response.data.projects.pending,
      completed_projects: response.data.projects.completed,
      overdue_projects: response.data.projects.overdue,
    });
  } catch (error) {
    console.error("Project summary error:", error);
  }
};

const loadUsers = async () => {
  try {
    setUsersLoading(true);

    const response = await api.get("/users/assignable");

    setUsers(response.data || []);
  } catch (err) {
    console.error("Failed to load users:", err);

    setError(
      err.response?.data?.detail ||
      "Failed to load users"
    );
  } finally {
    setUsersLoading(false);
  }
};


const loadAllUsers = async () => {
  try {
    setAllUsersLoading(true);

    const response = await api.get("/users/all");

    setAllUsers(response.data || []);
  } catch (err) {
    console.error("Failed to load all users:", err);

    setError(
      err.response?.data?.detail ||
      "Failed to load all users"
    );
  } finally {
    setAllUsersLoading(false);
  }
};

const loadAssignedUser = async (userId) => {
  if (!userId) {
    return null;
  }

  try {
    const response = await api.get(
      `/users/${userId}`
    );

    return response.data;
  } catch (err) {
    console.error("Failed to load assigned user:", err);

    return null;
  }
};


  const fetchDevices = async () => {
  try {
    const response = await api.get("/devices/");

    setDevices(response.data.data);
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to load devices"
    );
  }
};

const handleChange = (event) => {
  const { name, value } = event.target;

  setFormData((previous) => ({
    ...previous,
    [name]:
      name === "device_master_id" || name === "assigned_to"
        ? value === ""
          ? ""
          : Number(value)
        : value,
  }));
};

const loadRepositories = async () => {
  try {
    setRepositoriesLoading(true);

    const response = await api.get("/github/repositories");

    setRepositories(response.data || []);
  } catch (err) {
    console.error("Failed to load GitHub repositories:", err);

    setError(
      err.response?.data?.detail ||
      "Failed to load GitHub repositories"
    );
  } finally {
    setRepositoriesLoading(false);
  }
};

const userNameCounts = allUsers.reduce((counts, user) => {
  const name = user.name?.trim().toLowerCase();

  if (name) {
    counts[name] = (counts[name] || 0) + 1;
  }

  return counts;
}, {});


const getAssignedUserLabel = (user) => {
  if (!user) {
    return "—";
  }

  const name = user.name?.trim() || "";
  const normalizedName = name.toLowerCase();

  const isDuplicate =
    userNameCounts[normalizedName] > 1;

  return `${name}${
    isDuplicate
      ? ` — ${user.email}`
      : ""
  }${
    user.is_active === false
      ? " (Inactive)"
      : ""
  }`;
};

const handleAdd = async () => {
  setEditingProject(null);

  setFormData({
    project_name: "",
    repo_name: "",
    start_date: "",
    deadline: "",
    assigned_to: "",
    comments: "",
    device_master_id: "",
    project_path: "",
    deployment_script_path: "",
    tech_stack: "",
    project_status: "Pending",
  });

  setError("");
  setSuccess("");
  setShowForm(true);

  await loadRepositories();
  await loadUsers();
};


const handleView = (project) => {
  setViewingProject(project);

  const assignedUser = allUsers.find(
    (user) =>
      Number(user.id) === Number(project.assigned_to)
  );

  setCurrentAssignedUser(assignedUser || null);
};

const handleEdit = async (project) => {
  setEditingProject(project);

  const assignedUserId = Number(project.assigned_to);

  const assignedUser = allUsers.find(
    (user) => Number(user.id) === assignedUserId
  );

  setFormData({
    project_name: project.project_name || "",
    repo_name: project.repo_name || "",
    start_date: project.start_date
      ? project.start_date.substring(0, 10)
      : "",
    deadline: project.deadline
      ? project.deadline.substring(0, 10)
      : "",
    assigned_to: project.assigned_to ?? "",
    comments: project.comments || "",
    device_master_id: project.device_master_id ?? "",
    project_path: project.project_path || "",
    deployment_script_path:
      project.deployment_script_path || "",
    tech_stack: project.tech_stack || "",
    project_status: project.project_status || "Pending",
  });

  setError("");
  setSuccess("");
  setShowForm(true);

  await loadRepositories();

  // Load active users first.
  await loadUsers();

  // If the current assigned user is inactive,
  // add that user to the Edit dropdown.
  if (
    assignedUser &&
    assignedUser.is_active === false
  ) {
    setUsers((currentUsers) => {
      const alreadyExists = currentUsers.some(
        (user) => Number(user.id) === assignedUserId
      );

      if (alreadyExists) {
        return currentUsers;
      }

      return [...currentUsers, assignedUser];
    });
  }
};


const handleUpdate = async (event) => {
  event.preventDefault();

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    await api.put(
      `/projects/${editingProject.id}`,
      formData
    );

    setSuccess("Project updated successfully");

    resetForm();
    await fetchProjects();
  } catch (err) {
  console.error(err);

  const detail = err.response?.data?.detail;

  if (Array.isArray(detail)) {
    setError(
      detail
        .map((item) => item.msg)
        .join(", ")
    );
  } else {
    setError(
      detail ||
      "Failed to update project"
    );
  }
} finally {
  setSaving(false);
}
};

const handleDelete = async (project) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${project.project_name}"?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");
    setSuccess("");

    await api.delete(
      `/projects/${project.id}`
    );

    setSuccess("Project deleted successfully");

    await fetchProjects();
  } catch (err) {
    console.error(err);

    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      setError(
        detail
          .map((item) => item.msg)
          .join(", ")
      );
    } else {
      setError(
        detail ||
        "Failed to delete project"
      );
    }
  }
};

const handleCreate = async (event) => {
  event.preventDefault();

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    await api.post("/projects/", formData);

    setSuccess("Project created successfully");

    resetForm();
    await fetchProjects();
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to create project"
    );
  } finally {
    setSaving(false);
  }
};




const resetForm = () => {
  setShowForm(false);
  setEditingProject(null);

  setFormData({
    project_name: "",
    repo_name: "",
    start_date: "",
    deadline: "",
    assigned_to: "",
    comments: "",
    device_master_id: "",
    project_path: "",
    deployment_script_path: "",
    tech_stack: "",
    project_status: "Pending",
  });
};

const projectDevice = viewingProject
  ? devices.find(
      (device) => device.id === viewingProject.device_master_id
    )
  : null;

const projectViewModal = viewingProject && (
  <div
    className="modal-overlay"
    onClick={() => {
      setViewingProject(null);
      setCurrentAssignedUser(null);
    }}
  >
    <div
      className="device-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-header">
        <div>
          <h2>Project Details</h2>
          <p>View project information</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => {
             setViewingProject(null);
          }}
        >
          ×
        </button>
      </div>
    <div className="view-modal-body">
      <div className="form-grid">
        <div className="form-group">
          <label>ID</label>
          <div className="view-value">
            {viewingProject.id ?? "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Project Name</label>
          <div className="view-value">
            {viewingProject.project_name || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Repository</label>
          <div className="view-value">
            {viewingProject.repo_name || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Assigned To</label>
          <div className="view-value">
            {getAssignedUserLabel(currentAssignedUser)}
          </div>
        </div>

        <div className="form-group">
          <label>Start Date</label>
          <div className="view-value">
            {viewingProject.start_date
              ? String(viewingProject.start_date).slice(0, 10)
              : "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Deadline</label>
          <div className="view-value">
            {viewingProject.deadline
              ? String(viewingProject.deadline).slice(0, 10)
              : "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Device</label>
          <div className="view-value">
            {projectDevice
              ? `${projectDevice.device_name} - ${projectDevice.host}`
              : viewingProject.device_master_id ?? "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Status</label>
          <div className="view-value">
            {viewingProject.project_status || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Project Path</label>
          <div className="view-value">
            {viewingProject.project_path || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Deployment Script Path</label>
          <div className="view-value">
            {viewingProject.deployment_script_path || "—"}
          </div>
        </div>

        <div className="form-group">
          <label>Tech Stack</label>
          <div className="view-value">
            {viewingProject.tech_stack || "—"}
          </div>
        </div>

        <div className="form-group full-width">
          <label>Comments</label>
          <div className="view-value multiline">
            {viewingProject.comments || "—"}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setViewingProject(null)}
        >
          Close
        </button>
      </div>
    </div>
   </div> 
  </div>
);


  if (loading) {
    return <h2>Loading projects...</h2>;
  }

  return (
    <div className="device-page">

      {/* HEADER */}

       <PageHeader
          title="Project Management"
          description="Manage your infrastructure projects."
          actionLabel="+ Add Project"
          onAction={handleAdd}
        />

      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
  <div className="success-message">
    {success}
  </div>
)}

{showForm && (
  <ProjectForm
    formData={formData}
    devices={devices}
    repositories={repositories}
    repositoriesLoading={repositoriesLoading}
    users={users}
    usersLoading={usersLoading}
    editingProject={editingProject}
    saving={saving}
    onChange={handleChange}
    onSubmit={
      editingProject
        ? handleUpdate
        : handleCreate
    }
    onCancel={resetForm}
    
  />
)}


{/* =====================================================
    PROJECT SUMMARY
===================================================== */}

<SummaryCards>

  <SummaryCard
    title="Total Projects"
    value={projectSummary.total_projects}
    icon={FolderKanban}
    variant="primary"
  />

  <SummaryCard
    title="Pending"
    value={projectSummary.pending_projects}
    icon={Clock3}
    variant="warning"
  />

  <SummaryCard
    title="Completed"
    value={projectSummary.completed_projects}
    icon={CheckCircle2}
    variant="success"
  />

  <SummaryCard
    title="Overdue"
    value={projectSummary.overdue_projects}
    icon={AlertTriangle}
    variant="danger"
  />

</SummaryCards>



{/* FILTERS */}

<SearchFilterBar
  search={{
    value: search,
    onChange: setSearch,
    placeholder: "Search by project name",
  }}
  filters={[
    {
      key: "status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "", label: "All Status" },
        { value: "Pending", label: "Pending" },
        { value: "Completed", label: "Completed" },
        { value: "Overdue", label: "Overdue" },
      ],
    },
  ]}
  onSearch={() => fetchProjects(1)}
  onClear={() => {
    setSearch("");
    setStatusFilter("");
    fetchProjects(1, "", "");
  }}
/>



     <ProjectList
  projects={projects}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

      {/* PAGINATION */}

<div className="pagination-controls">

  <button
    type="button"
    onClick={() => fetchProjects(currentPage - 1)}
    disabled={!pagination.has_previous}
  >
    Previous
  </button>

  <span>
    Page {pagination.page} of {pagination.total_pages}
  </span>

  <button
    type="button"
    onClick={() => fetchProjects(currentPage + 1)}
    disabled={!pagination.has_next}
  >
    Next
  </button>

</div>
{viewingProject &&
  createPortal(projectViewModal, document.body)}
    </div>
  );
}


export default Projects;